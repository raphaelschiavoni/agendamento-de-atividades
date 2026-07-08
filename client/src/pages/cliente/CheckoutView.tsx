import { Sparkles } from "lucide-react";
import { BackRow } from "../../components/BackRow";
import { Field } from "../../components/Field";
import { formatBRL } from "../../lib/format";
import type { Customer, Hotel } from "../../types";

export function CheckoutView({
  customer,
  setCustomer,
  total,
  hotels,
  isGuest,
  isPassaporte,
  activityHotelName,
  guestHotelId,
  setGuestHotelId,
  roomNumber,
  setRoomNumber,
  onBack,
  onNext,
}: {
  customer: Customer;
  setCustomer: (updater: (c: Customer) => Customer) => void;
  total: number;
  hotels: Hotel[];
  isGuest: boolean;
  isPassaporte: boolean;
  activityHotelName: string;
  guestHotelId: string;
  setGuestHotelId: (v: string) => void;
  roomNumber: string;
  setRoomNumber: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  // No Passaporte, o hotel onde está hospedado é obrigatório.
  const passaporteOk = !isPassaporte || !!guestHotelId;
  const valid = customer.name.trim() && customer.phone.trim() && passaporteOk;

  const guestHotelName = hotels.find((h) => h.id === guestHotelId)?.name;
  const showBenefit = isPassaporte && guestHotelName && activityHotelName && guestHotelName !== activityHotelName;

  return (
    <div>
      <BackRow label="Seus dados" onBack={onBack} />
      <div className="space-y-3 max-w-md">
        <Field label="Nome completo" value={customer.name} onChange={(v) => setCustomer((c) => ({ ...c, name: v }))} placeholder="Como no documento" />
        <Field label="WhatsApp" value={customer.phone} onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))} placeholder="(19) 99999-0000" />
        <Field label="E-mail (opcional)" value={customer.email ?? ""} onChange={(v) => setCustomer((c) => ({ ...c, email: v }))} placeholder="voce@email.com" />

        {isPassaporte && (
          <div>
            <label className="text-xs font-medium opacity-70">Onde você está hospedado?</label>
            <select
              value={guestHotelId}
              onChange={(e) => setGuestHotelId(e.target.value)}
              className="w-full rounded-md px-3 py-2 mt-1 text-sm"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            >
              <option value="">Selecione o hotel da sua estadia…</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}

        {isGuest && (
          <Field
            label="Número do Chalé/Quarto"
            value={roomNumber}
            onChange={setRoomNumber}
            placeholder="Ex: 101, 205"
          />
        )}

        {showBenefit && (
          <div className="rounded-md p-3 flex items-start gap-2" style={{ background: "var(--plum-light)", border: "1px solid var(--plum)" }}>
            <Sparkles size={16} color="var(--plum)" style={{ marginTop: 1 }} />
            <p className="text-xs" style={{ color: "var(--bark)" }}>
              Você está usando o <strong>Passaporte dos Sonhos</strong> para aproveitar atividades de <strong>{activityHotelName}</strong> — um benefício da sua hospedagem em <strong>{guestHotelName}</strong>.
            </p>
          </div>
        )}

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
          Revisar reserva
        </button>
      </div>
    </div>
  );
}
