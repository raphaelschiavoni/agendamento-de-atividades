import { ChevronLeft } from "lucide-react";

export function BackRow({ label, sub, onBack }: { label: string; sub?: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <button onClick={onBack} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
        <ChevronLeft size={16} color="var(--forest)" />
      </button>
      <div>
        <div style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-lg leading-tight">{label}</div>
        {sub && <div className="text-xs opacity-60">{sub}</div>}
      </div>
    </div>
  );
}
