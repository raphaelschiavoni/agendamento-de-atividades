// Gera e baixa um CSV (compatível com Excel, incl. acentos via BOM UTF-8).
export function downloadCSV(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(";"), ...rows.map((r) => r.map(escape).join(";"))];
  // BOM para o Excel reconhecer UTF-8; separador ";" para PT-BR.
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
