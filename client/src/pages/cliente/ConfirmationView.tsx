import { Download, MessageCircle, Ticket, CheckCircle2 } from "lucide-react";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import { whenText } from "../../lib/schedule";
import { buildVoucherPdf, voucherFileName } from "../../lib/voucherPdf";
import type { Booking } from "../../types";

export function ConfirmationView({ vouchers, onNewOrder }: { vouchers: Booking[]; onNewOrder: () => void }) {
  const fileName = voucherFileName(vouchers);

  function salvarVoucher() {
    buildVoucherPdf(vouchers).save(fileName);
  }

  async function enviarWhatsApp() {
    const doc = buildVoucherPdf(vouchers);
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    const texto =
      "Voucher Rede dos Sonhos\n" +
      vouchers.map((v) => `• ${v.activityName} — ${v.date} ${whenText(v.time)} — código ${v.voucherCode}`).join("\n");

    // No celular, compartilha o PDF direto (WhatsApp aparece nas opções).
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "Voucher Rede dos Sonhos", text: texto });
        return;
      } catch {
        /* usuário cancelou — cai no fallback */
      }
    }
    // Fallback (desktop): baixa o PDF e abre o WhatsApp com o texto do voucher.
    doc.save(fileName);
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <div className="print-area">
        <img src="/logo.webp" alt="Hotéis Fazenda Rede dos Sonhos" style={{ height: 56, marginBottom: 16 }} />
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={24} color="var(--moss)" />
          <h2 style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-xl">Pagamento confirmado!</h2>
        </div>
        <p className="text-sm opacity-70 mb-4">
          Seu voucher foi liberado automaticamente e a recepção já foi avisada por WhatsApp. Apresente o código abaixo na chegada.
        </p>
        <div className="space-y-3">
          {vouchers.map((v) => {
            const participantes =
              v.children > 0
                ? `${v.qty} pessoa(s) (${v.adults} adulto(s), ${v.children} criança(s))`
                : `${v.qty} pessoa(s)`;
            const crossHotel = v.category === "passaporte" && v.guestHotelId && v.guestHotelId !== v.hotelId;
            return (
              <div key={v.id} className="rounded-lg p-4 flex items-center gap-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
                <Ticket size={28} color={CATEGORY_META[v.category].color} />
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>{v.activityName} — {v.hotelName}</div>
                  <div className="text-xs opacity-60">{v.date} {whenText(v.time)} · {participantes} · {CATEGORY_META[v.category].label}</div>
                  {crossHotel && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--plum)" }}>✨ Passaporte dos Sonhos — benefício da sua hospedagem</div>
                  )}
                  <div className="text-sm mt-1 font-mono tracking-wider" style={{ color: "var(--gold)" }}>{v.voucherCode}</div>
                </div>
                <span className="text-sm font-medium">{formatBRL(v.total)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="no-print flex flex-wrap gap-2 mt-4">
        <button
          onClick={salvarVoucher}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm"
          style={{ border: "1px solid var(--line)", color: "var(--forest)" }}
        >
          <Download size={15} /> Salvar voucher
        </button>
        <button
          onClick={enviarWhatsApp}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm"
          style={{ background: "#25D366", color: "#fff" }}
          title="Enviar o PDF do voucher pelo WhatsApp"
        >
          <MessageCircle size={15} /> Enviar por WhatsApp
        </button>
        <button
          onClick={onNewOrder}
          className="px-4 py-2 rounded-md text-sm"
          style={{ background: "var(--forest)", color: "var(--paper)" }}
        >
          Fazer nova reserva
        </button>
      </div>
    </div>
  );
}
