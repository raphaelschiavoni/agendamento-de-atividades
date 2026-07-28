import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { Modal } from "../../components/Modal";
import { MonthCalendar } from "../../components/MonthCalendar";
import { getAvailability } from "../../api/activities";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL, isoDate } from "../../lib/format";
import { ALL_DAY_TIME, calendarDates, calendarWeekdays, isKidsActivity, isSlotBookable, slotsForDate } from "../../lib/schedule";
import type { Activity, Category } from "../../types";

export function ScheduleModal({
  activity,
  category,
  onClose,
  onConfirm,
}: {
  activity: Activity;
  category: Category;
  onClose: () => void;
  onConfirm: (date: string, time: string, adults: number, children: number) => void;
}) {
  const isKids = isKidsActivity(activity.name);
  const isAllDay = activity.allDay;
  const [date, setDate] = useState<string>(isoDate(new Date()));
  const [time, setTime] = useState<string | null>(isAllDay ? ALL_DAY_TIME : null);
  const [adults, setAdults] = useState(isKids ? 0 : 1);
  const [children, setChildren] = useState(isKids ? 1 : 0);
  const qty = adults + children;

  const { data } = useQuery({
    queryKey: ["availability", activity.id, date, category],
    queryFn: () => getAvailability(activity.id, date, category),
    enabled: !!date,
  });
  // Agenda efetiva do dia escolhido. Dia todo: um único "slot" (vagas do dia);
  // com horário: esconde os que já começaram (+ tolerância) para hoje.
  const daySlots = isAllDay
    ? (isSlotBookable(date, ALL_DAY_TIME) ? [{ time: ALL_DAY_TIME, capacity: activity.dailyCapacity }] : [])
    : slotsForDate(activity, date).filter((s) => isSlotBookable(date, s.time));
  const capOf = (t: string) => daySlots.find((s) => s.time === t)?.capacity ?? activity.capacity;
  const remainingByTime = new Map((data?.times ?? []).map((t) => [t.time, t.remaining]));
  const remaining = time ? remainingByTime.get(time) ?? capOf(time) : daySlots[0]?.capacity ?? activity.capacity;

  // Dia todo: horário sempre definido enquanto a data for válida.
  useEffect(() => {
    if (isAllDay) setTime(daySlots.length > 0 ? ALL_DAY_TIME : null);
  }, [isAllDay, date, daySlots.length]);

  useEffect(() => {
    setAdults(isKids ? 0 : 1);
    setChildren(isKids ? 1 : 0);
  }, [time, isKids]);

  const price = activity.prices[category] || 0;
  const canAddMore = qty < remaining;

  return (
    <Modal onClose={onClose} title={activity.name}>
      <div className="mb-4">
        <div className="text-xs font-medium mb-1.5 opacity-70">Escolha a data</div>
        <MonthCalendar
          value={date}
          onChange={(d) => { setDate(d); if (!isAllDay) setTime(null); }}
          allowedWeekdays={isAllDay ? [] : calendarWeekdays(activity)}
          allowedDates={isAllDay ? [] : calendarDates(activity)}
        />
      </div>

      {isAllDay ? (
        <div className="mb-3 text-xs px-2.5 py-2 rounded-md" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>
          Atividade disponível o dia todo (sem horário fixo). {remaining > 0 ? `${remaining} vaga(s) restante(s) neste dia.` : "Esgotada neste dia."}
        </div>
      ) : (
      <div className="mb-3">
        <div className="text-xs font-medium mb-1.5 opacity-70">Escolha o horário</div>
        <div className="flex flex-wrap gap-2">
          {daySlots.length === 0 && <p className="text-xs opacity-60">Sem horários disponíveis nesta data.</p>}
          {daySlots.map(({ time: t, capacity: cap }) => {
            const left = remainingByTime.get(t) ?? cap;
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
      )}

      {time && (
        <div className="mb-4 space-y-3">
          {isKids ? (
            <div className="text-xs px-2.5 py-1.5 rounded-md" style={{ background: "var(--gold-light)", color: "var(--gold)" }}>
              Atividade Kids — exclusiva para crianças (sem adultos).
            </div>
          ) : (
            <Counter
              label="Adultos"
              sub="13 anos ou mais"
              value={adults}
              onDec={() => setAdults((a) => Math.max(1, a - 1))}
              onInc={() => canAddMore && setAdults((a) => a + 1)}
            />
          )}
          <Counter
            label="Crianças"
            sub="até 12 anos"
            value={children}
            onDec={() => setChildren((c) => Math.max(isKids ? 1 : 0, c - 1))}
            onInc={() => canAddMore && setChildren((c) => c + 1)}
          />
          <div className="text-xs opacity-60">
            Total: {qty} pessoa(s) · máx. {remaining} disponíveis neste horário
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--line)" }}>
        <span style={{ color: CATEGORY_META[category].color, fontWeight: 600 }}>
          {price === 0 ? "Incluso" : formatBRL(price * qty)}
        </span>
        <button
          disabled={!date || !time}
          onClick={() => onConfirm(date, time!, adults, children)}
          className="px-4 py-2 rounded-md text-sm"
          style={{ background: !date || !time ? "#ccc" : "var(--forest)", color: "var(--paper)" }}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </Modal>
  );
}

function Counter({
  label,
  sub,
  value,
  onDec,
  onInc,
}: {
  label: string;
  sub: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>{label}</div>
        <div className="text-xs opacity-60">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onDec} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}>
          <Minus size={14} />
        </button>
        <span className="text-base w-6 text-center">{value}</span>
        <button onClick={onInc} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
