import { jsPDF } from "jspdf";
import type { Booking } from "../types";
import { formatBRL } from "./format";
import { whenText } from "./schedule";

const CATEGORY_LABELS: Record<string, string> = {
  hospede: "Hóspede",
  visitante: "Visitante",
  dayuse: "Day Use",
  passaporte: "Passaporte dos Sonhos",
};

// Cores da marca (RGB).
const FOREST: [number, number, number] = [30, 51, 36];
const GOLD: [number, number, number] = [217, 164, 65];
const BARK: [number, number, number] = [42, 33, 24];

/** Monta um PDF (A4) com um voucher por reserva. */
export function buildVoucherPdf(vouchers: Booking[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...FOREST);
  doc.setFontSize(20);
  doc.text("Rede dos Sonhos", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Hotéis Fazenda — Turismo para todos", margin, y + 6);
  y += 16;

  doc.setDrawColor(220, 210, 185);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  vouchers.forEach((v, i) => {
    const participantes =
      v.children > 0
        ? `${v.qty} pessoa(s) (${v.adults} adulto(s), ${v.children} criança(s))`
        : `${v.qty} pessoa(s)`;

    // Moldura do voucher
    const boxH = 54;
    doc.setDrawColor(220, 210, 185);
    doc.setFillColor(255, 252, 246);
    doc.roundedRect(margin, y, pageW - margin * 2, boxH, 3, 3, "FD");

    let ty = y + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...FOREST);
    doc.text(v.activityName, margin + 6, ty);
    ty += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BARK);
    doc.text(`${v.hotelName}`, margin + 6, ty);
    ty += 6;
    doc.text(`Data: ${v.date}   ${whenText(v.time)}`, margin + 6, ty);
    ty += 5.5;
    doc.text(`Participantes: ${participantes}`, margin + 6, ty);
    ty += 5.5;
    doc.text(`Categoria: ${CATEGORY_LABELS[v.category] ?? v.category}`, margin + 6, ty);
    ty += 5.5;
    doc.text(`Cliente: ${v.customer?.name ?? ""}`, margin + 6, ty);

    // Código do voucher em destaque (direita)
    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...GOLD);
    doc.text(v.voucherCode, pageW - margin - 6, y + 12, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...FOREST);
    doc.text(v.total === 0 ? "Incluso" : formatBRL(v.total), pageW - margin - 6, y + 20, { align: "right" });

    y += boxH + 8;

    // Nova página se necessário
    if (y > 250 && i < vouchers.length - 1) {
      doc.addPage();
      y = 20;
    }
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Apresente este voucher (código) na recepção do hotel na chegada.", margin, y + 2);

  return doc;
}

export function voucherFileName(vouchers: Booking[]): string {
  const code = vouchers.length === 1 ? vouchers[0].voucherCode : "vouchers";
  return `voucher-${code}.pdf`;
}
