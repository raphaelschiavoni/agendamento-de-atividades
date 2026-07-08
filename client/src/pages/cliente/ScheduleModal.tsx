import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { Modal } from "../../components/Modal";
import { getAvailability } from "../../api/activities";
import { CATEGORY_META } from "../../lib/constants";
import { friendlyDate, formatBRL, isoDate, nextDays } from "../../lib/format";
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
  onConfirm: (date: string, time: string, qty: number) => void;
}) {
  const days = nextDays(14);
  const [date, setDate] = useState<string | null>(days[0] ? isoDate(days[0]) : null);
  const [time, setTime] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { data } = useQuery({
    queryKey: ["availability", activity.id, date],
    queryFn: () => getAvailability(activity.id, date!),
    enabled: !!date,
  });
  const remainingByTime = new Map((data?.times ?? []).map((t) => [t.time, t.remaining]));
  const remaining = time ? remainingByTime.get(time) ?? activity.capacity : activity.capacity;

  useEffect(() => {
    setQty(1);
  }, [time]);

  return (
    <Modal onClose={onClose} title={activity.name}>
      <div className="mb-3">
        <div className="text-xs font-medium mb-1.5 opacity-70">Escolha a data</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const iso = isoDate(d);
            return (
              <button
                key={iso}
                onClick={() => { setDate(iso); setTime(null); }}
                className="px-3 py-1.5 rounded-md text-xs whitespace-nowrap capitalize"
                style={{
                  background: date === iso ? "var(--forest)" : "var(--cream)",
                  color: date === iso ? "var(--paper)" : "var(--bark)",
                  border: "1px solid var(--line)",
                }}
              >
                {friendlyDate(d)}
              </button>
            );
          })}
        </div>
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
        <div className="mb-4">
          <div className="text-xs font-medium mb-1.5 opacity-70">Quantidade de pessoas</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}>
              <Minus size={14} />
            </button>
            <span className="text-base w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(remaining, q + 1))}
              className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}
            >
              <Plus size={14} />
            </button>
            <span className="text-xs opacity-60">máx. {remaining} disponíveis</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--line)" }}>
        <span style={{ color: CATEGORY_META[category].color, fontWeight: 600 }}>
          {(activity.prices[category] || 0) === 0 ? "Incluso" : formatBRL((activity.prices[category] || 0) * qty)}
        </span>
        <button
          disabled={!date || !time}
          onClick={() => onConfirm(date!, time!, qty)}
          className="px-4 py-2 rounded-md text-sm"
          style={{ background: !date || !time ? "#ccc" : "var(--forest)", color: "var(--paper)" }}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </Modal>
  );
}
