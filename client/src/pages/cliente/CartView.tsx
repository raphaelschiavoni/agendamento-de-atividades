import { Trash2 } from "lucide-react";
import { BackRow } from "../../components/BackRow";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import type { CartItem } from "../../types";

export function CartView({
  cart,
  onRemove,
  onBack,
  onCheckout,
  total,
}: {
  cart: CartItem[];
  onRemove: (index: number) => void;
  onBack: () => void;
  onCheckout: () => void;
  total: number;
}) {
  return (
    <div>
      <BackRow label="Seu carrinho" onBack={onBack} />
      {cart.length === 0 ? (
        <p className="opacity-60 text-sm">Seu carrinho está vazio.</p>
      ) : (
        <div className="space-y-2">
          {cart.map((item, i) => (
            <div key={i} className="rounded-lg p-3 flex items-center justify-between" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>{item.activityName}</div>
                <div className="text-xs opacity-60">
                  {item.date} às {item.time} · {item.qty} pessoa(s) · {CATEGORY_META[item.category].label}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatBRL(item.unitPrice * item.qty)}</span>
                <button onClick={() => onRemove(i)}><Trash2 size={15} color="var(--danger)" /></button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--line)" }}>
            <span className="text-base font-medium">Total</span>
            <span className="text-lg font-semibold" style={{ color: "var(--forest)" }}>{formatBRL(total)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full mt-2 rounded-md py-2.5 text-sm"
            style={{ background: "var(--forest)", color: "var(--paper)" }}
          >
            Finalizar pedido
          </button>
        </div>
      )}
    </div>
  );
}
