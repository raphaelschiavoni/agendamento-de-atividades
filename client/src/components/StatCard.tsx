import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-lg p-4 flex items-center gap-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="p-2 rounded-md" style={{ background: color + "22" }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div className="text-xs opacity-60">{label}</div>
        <div className="text-lg font-semibold" style={{ color: "var(--forest)" }}>{value}</div>
      </div>
    </div>
  );
}
