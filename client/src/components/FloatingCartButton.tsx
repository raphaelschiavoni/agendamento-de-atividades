import { ShoppingCart } from "lucide-react";
import { formatBRL } from "../lib/format";

export function FloatingCartButton({ count, total, onClick }: { count: number; total: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-5 right-5 rounded-full px-5 py-3 flex items-center gap-2 shadow-lg z-40"
      style={{ background: "var(--forest)", color: "var(--paper)" }}
    >
      <ShoppingCart size={16} />
      <span className="text-sm">{count} {count === 1 ? "item" : "itens"} · {formatBRL(total)}</span>
    </button>
  );
}
