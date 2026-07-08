import { BackRow } from "../../components/BackRow";
import { Field } from "../../components/Field";
import { formatBRL } from "../../lib/format";
import type { Customer } from "../../types";

export function CheckoutView({
  customer,
  setCustomer,
  total,
  onBack,
  onNext,
}: {
  customer: Customer;
  setCustomer: (updater: (c: Customer) => Customer) => void;
  total: number;
  onBack: () => void;
  onNext: () => void;
}) {
  const valid = customer.name.trim() && customer.phone.trim();
  return (
    <div>
      <BackRow label="Seus dados" onBack={onBack} />
      <div className="space-y-3 max-w-md">
        <Field label="Nome completo" value={customer.name} onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} placeholder="Como no documento" />
        <Field label="WhatsApp" value={customer.phone} onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} placeholder="(19) 99999-0000" />
        <Field label="E-mail (opcional)" value={customer.email ?? ""} onChange={(v) => setCustomer((c) => ({ ...c, email: v }))} placeholder="voce@email.com" />
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm opacity-70">Total a pagar</span>
          <span className="text-lg font-semibold" style={{ color: "var(--forest)" }}>{formatBRL(total)}</span>
        </div>
        <button
          disabled={!valid}
          onClick={onNext}
          className="w-full rounded-md py-2.5 text-sm"
          style={{ background: valid ? "var(--forest)" : "#ccc", color: "var(--paper)" }}
        >
          Pagar com Pix
        </button>
      </div>
    </div>
  );
}
