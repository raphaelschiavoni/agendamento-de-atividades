import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isoDate, pad } from "../lib/format";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function MonthCalendar({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (date: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const initial = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-1.5 rounded-md"
          style={{ border: "1px solid var(--line)", opacity: canGoPrev ? 1 : 0.4, cursor: canGoPrev ? "pointer" : "not-allowed" }}
        >
          <ChevronLeft size={16} color="var(--forest)" />
        </button>
        <div className="rs-display capitalize" style={{ color: "var(--forest)", fontWeight: 600 }}>
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button onClick={nextMonth} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}>
          <ChevronRight size={16} color="var(--forest)" />
        </button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center" style={{ fontSize: 10, opacity: 0.5, padding: "2px 0" }}>
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const iso = isoDate(d);
          const isPast = d < today;
          const isSelected = value === iso;
          return (
            <button
              key={iso}
              disabled={isPast}
              onClick={() => onChange(iso)}
              className="rounded-md text-sm"
              style={{
                padding: "7px 0",
                background: isSelected ? "var(--forest)" : "transparent",
                color: isSelected ? "var(--paper)" : isPast ? "var(--line)" : "var(--bark)",
                border: "1px solid " + (isSelected ? "var(--forest)" : "transparent"),
                cursor: isPast ? "not-allowed" : "pointer",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {pad(d.getDate())}
            </button>
          );
        })}
      </div>
    </div>
  );
}
