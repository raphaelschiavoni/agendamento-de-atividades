import { useState, type ReactNode } from "react";
import { Calendar, Clock, Home, MapPin, Phone, Sparkles, User } from "lucide-react";
import { BackRow } from "../../components/BackRow";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import type { CartItem, Customer, Hotel } from "../../types";

export function RevisaoView({
  cart,
  customer,
  hotels,
  isGuest,
  isPassaporte,
  guestHotelId,
  roomNumber,
  total,
  onBack,
  onConfirm,
}: {
  cart: CartItem[];
  customer: Customer;
  hotels: Hotel[];
  isGuest: boolean;
  isPassaporte: boolean;
  guestHotelId: string;
  roomNumber: string;
  total: number;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestHotelName = hotels.find((h) => h.id === guestHotelId)?.name;
  const activityHotels = Array.from(new Set(cart.map((i) => i.hotelName)));

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível confirmar a reserva.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <BackRow label="Confirme sua reserva" sub="Revise os dados antes de confirmar" onBack={onBack} />

      {isPassaporte && (
        <div className="rounded-lg p-4 mb-3 flex flex-wrap gap-6" style={{ background: "var(--plum-light)", border: "1px solid var(--plum)" }}>
          <div className="flex items-center gap-2" style={{ color: "var(--plum)" }}>
            <Sparkles size={16} /> <span className="text-sm font-semibold">Passaporte dos Sonhos</span>
          </div>
          <div className="text-sm">
            <span className="opacity-60 text-xs block">Hospedado em</span>
            <span style={{ color: "var(--plum)", fontWeight: 600 }}>{guestHotelName ?? "—"}</span>
          </div>
          <div className="text-sm">
            <span className="opacity-60 text-xs block">Atividades em</span>
            <span style={{ color: "var(--plum)", fontWeight: 600 }}>{activityHotels.join(", ")}</span>
          </div>
        </div>
      )}

      <Section title="Seus dados">
        <Line icon={User} text={customer.name} />
        {(isGuest || isPassaporte) && roomNumber && <Line icon={Home} text={`Chalé/Quarto: ${roomNumber}`} />}
        <Line icon={Phone} text={customer.phone} />
        {customer.email && <Line icon={MapPin} text={customer.email} />}
      </Section>

      <Section title={`Atividades (${cart.length})`}>
        <div className="space-y-2">
          {cart.map((item, i) => (
            <div key={i} className="rounded-md p-3" style={{ background: "var(--cream)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--forest)" }}>{item.activityName}</span>
                <span className="text-sm font-medium">{item.unitPrice === 0 ? "Incluso" : formatBRL(item.unitPrice * item.qty)}</span>
              </div>
              <div className="text-xs opacity-60 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1"><MapPin size={11} /> {item.hotelName}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {item.date}</span>
                <span className="flex items-center gap-1"><Clock size={11} /> {item.time}</span>
                <span className="px-1.5 rounded-full" style={{ background: CATEGORY_META[item.category].bg, color: CATEGORY_META[item.category].color }}>{CATEGORY_META[item.category].label}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {item.adults} adulto(s){item.children > 0 ? ` · ${item.children} criança(s)` : ""} · {item.qty} pessoa(s)
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex items-center justify-between rounded-lg p-4 mb-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <span className="text-base font-medium">Total</span>
        <span className="text-lg font-semibold" style={{ color: "var(--forest)" }}>{total === 0 ? "Incluso" : formatBRL(total)}</span>
      </div>

      {error && <p className="text-sm mb-2" style={{ color: "var(--danger)" }}>{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full rounded-md py-2.5 text-sm"
        style={{ background: "var(--forest)", color: "var(--paper)" }}
      >
        {loading ? "Confirmando…" : total === 0 ? "Confirmar reserva" : "Ir para o pagamento"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg p-4 mb-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="text-xs uppercase tracking-wide opacity-50 mb-2">{title}</div>
      {children}
    </div>
  );
}

function Line({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm py-0.5" style={{ color: "var(--bark)" }}>
      <Icon size={14} style={{ opacity: 0.6 }} /> {text}
    </div>
  );
}
