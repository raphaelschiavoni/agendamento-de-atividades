import type { Booking } from "../types";

export function StatusBadge({ booking }: { booking: Booking }) {
  let label = "Aguardando uso";
  let color = "var(--clay)";
  if (booking.status === "cancelado") {
    label = "Cancelado";
    color = "var(--danger)";
  } else if (booking.used) {
    label = "Utilizado";
    color = "var(--moss)";
  }
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: color + "22", color }}>{label}</span>;
}
