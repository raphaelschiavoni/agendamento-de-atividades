export function formatBRL(v: number): string {
  if (!v) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

export function friendlyDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
}
