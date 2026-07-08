import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { Modal } from "../../components/Modal";
import { MonthCalendar } from "../../components/MonthCalendar";
import { getAvailability } from "../../api/activities";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL, isoDate } from "../../lib/format";
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
  const [date, setDate] = useState<string>(isoDate(new Date()));
  const [time, setTime] = useState<string | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const qty = adults + children;

  const { data } = useQuery({
    queryKey: ["availability", activity.id, date],
    queryFn: () => getAvailability(activity.id, date),
    enabled: !!date,
  });
  const remainingByTime = new Map((data?.times ?? []).map((t) => [t.time, t.remaining]));
  const remaining = time ? remainingByTime.get(time) ?? activity.capacity : activity.capacity;

  useEffect(() => {
    setAdults(1);
    setChildren(0);
  }, [time]);

  const price = activity.prices[category] || 0;
  const canAddMore = qty < remaining;

  return (
    <Modal onClose={onClose} title={activity.name}>
      <div className="mb-4">
        <div className="text-xs font-medium mb-1.5 opacity-70">Escolha a data</div>
        <MonthCalendar value={date} onChange={(d) => { setDate(d); setTime(null); }} />
      </div>

      <div className="mb-3">
        <div className="text-xs font-medium mb-1.5 opacity-70">Escolha o horário</div>
        <div className="flex flex-wrap gap-2">
          {activity.times.map((t) => {
            const left = remainingByTime.get(t) ?? activity.capacity;
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
          <Counter
            label="Adultos"
            sub="13 anos ou mais"
            value={adults}
            onDec={() => setAdults((a) => Math.max(1, a - 1))}
            onInc={() => canAddMore && setAdults((a) => a + 1)}
          />
          <Counter
            label="Crianças"
            sub="até 12 anos"
            value={children}
            onDec={() => setChildren((c) => Math.max(0, c - 1))}
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
