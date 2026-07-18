import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { Modal } from "../../components/Modal";
import { MonthCalendar } from "../../components/MonthCalendar";
import { getActivity, getAvailability } from "../../api/activities";
import { editBookingAdmin } from "../../api/bookings";
import { calendarDates, calendarWeekdays, slotsForDate } from "../../lib/schedule";
import { ApiError } from "../../api/client";
import type { Booking } from "../../types";

// Edição de uma reserva pela operação: mudar data/horário e nº de participantes.
export function EditBookingModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState<string | null>(booking.time);
  const [adults, setAdults] = useState(booking.adults);
  const [children, setChildren] = useState(booking.children);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qty = adults + children;

  const { data: activity } = useQuery({ queryKey: ["activity", booking.activityId], queryFn: () => getActivity(booking.activityId) });
  const { data: avail } = useQuery({
    queryKey: ["availability", booking.activityId, date, booking.category],
    queryFn: () => getAvailability(booking.activityId, date, booking.category),
    enabled: !!date,
  });

  const daySlots = activity ? slotsForDate(activity, date) : [];
  const remainingByTime = new Map((avail?.times ?? []).map((t) => [t.time, t.remaining]));
  // No slot original, a própria reserva já ocupa lugares — soma de volta para exibir o real disponível.
  const availableAt = (t: string) => {
    const base = remainingByTime.get(t) ?? daySlots.find((s) => s.time === t)?.capacity ?? 0;
    const sameSlot = date === booking.date && t === booking.time;
    return base + (sameSlot ? booking.qty : 0);
  };
  const remaining = time ? availableAt(time) : 0;
  const canAddMore = qty < remaining;

  async function save() {
    if (!time) return;
    setSaving(true);
    setError(null);
    try {
      await editBookingAdmin(booking.id, { date, time, adults, children });
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível salvar a alteração");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Editar reserva — ${booking.activityName}`} onClose={onClose}>
      <div className="text-xs opacity-60 mb-3">
        Voucher {booking.voucherCode} · {booking.customer?.name} ({booking.customer?.phone})
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium mb-1.5 opacity-70">Data</div>
        <MonthCalendar
          value={date}
          onChange={(d) => { setDate(d); setTime(null); }}
          allowedWeekdays={activity ? calendarWeekdays(activity) : undefined}
          allowedDates={activity ? calendarDates(activity) : undefined}
        />
      </div>

      <div className="mb-3">
        <div className="text-xs font-medium mb-1.5 opacity-70">Horário</div>
        <div className="flex flex-wrap gap-2">
          {daySlots.length === 0 && <p className="text-xs opacity-60">Sem horários disponíveis nesta data.</p>}
          {daySlots.map(({ time: t }) => {
            const left = availableAt(t);
            const full = left <= 0;
            return (
              <button
                key={t}
                disabled={full}
                onClick={() => setTime(t)}
                className="px-3 py-1.5 rounded-md text-xs flex flex-col items-center"
                style={{
                  background: time === t ? "var(--forest)" : full ? "#eee" : "var(--cream)",
                  color: time === t ? "var(--paper)" : full ? "#999" : "var(--bark)",
                  border: "1px solid var(--line)",
                  opacity: full ? 0.6 : 1,
                  cursor: full ? "not-allowed" : "pointer",
                }}
              >
                <span>{t}</span>
                <span style={{ fontSize: 10 }}>{full ? "esgotado" : `${left} vagas`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {time && (
        <div className="mb-4 space-y-3">
          <Counter label="Adultos" sub="13 anos ou mais" value={adults} onDec={() => setAdults((a) => Math.max(1, a - 1))} onInc={() => canAddMore && setAdults((a) => a + 1)} />
          <Counter label="Crianças" sub="até 12 anos" value={children} onDec={() => setChildren((c) => Math.max(0, c - 1))} onInc={() => canAddMore && setChildren((c) => c + 1)} />
          <div className="text-xs opacity-60">Total: {qty} pessoa(s) · máx. {remaining} disponíveis neste horário</div>
        </div>
      )}

      {error && <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-3" style={{ borderTop: "1px solid var(--line)" }}>
        <button onClick={onClose} className="px-3 py-2 rounded-md text-sm" style={{ border: "1px solid var(--line)" }}>Cancelar</button>
        <button
          disabled={!time || qty < 1 || qty > remaining || saving}
          onClick={save}
          className="px-4 py-2 rounded-md text-sm"
          style={{ background: !time || qty < 1 || qty > remaining ? "#ccc" : "var(--forest)", color: "var(--paper)" }}
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </Modal>
  );
}

function Counter({ label, sub, value, onDec, onInc }: { label: string; sub: string; value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>{label}</div>
        <div className="text-xs opacity-60">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onDec} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}><Minus size={14} /></button>
        <span className="text-base w-6 text-center">{value}</span>
        <button onClick={onInc} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}><Plus size={14} /></button>
      </div>
    </div>
  );
}
