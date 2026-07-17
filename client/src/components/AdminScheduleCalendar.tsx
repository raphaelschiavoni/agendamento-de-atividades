import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isoDate, pad } from "../lib/format";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Seletor de disponibilidade da atividade no padrão do calendário do catálogo:
// - clicar num dia da semana (cabeçalho) marca recorrência semanal (ex.: toda qua e sex);
// - clicar num número do mês marca/desmarca uma data específica (ex.: evento dia 16).
export function AdminScheduleCalendar({
  weekdays,
  onToggleWeekday,
  allowedDates,
  onToggleDate,
}: {
  weekdays: number[];
  onToggleWeekday: (d: number) => void;
  allowedDates: string[];
  onToggleDate: (iso: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

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

  const semRestricao = weekdays.length === 0 && allowedDates.length === 0;

  return (
    <div className="rounded-md p-3" style={{ border: "1px solid var(--line)", background: "var(--cream)" }}>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
          <ChevronLeft size={14} color="var(--forest)" />
        </button>
        <div className="rs-display capitalize text-sm" style={{ color: "var(--forest)", fontWeight: 600 }}>
          {MONTHS[viewMonth]} {viewYear}
        </div>
        <button type="button" onClick={nextMonth} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
          <ChevronRight size={14} color="var(--forest)" />
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {WEEKDAYS.map((w, d) => {
          const active = weekdays.includes(d);
          return (
            <button
              key={w}
              type="button"
              onClick={() => onToggleWeekday(d)}
              title={active ? `Toda ${w}: ativa (clique para remover)` : `Ativar toda ${w}`}
              className="rounded-md text-center"
              style={{
                fontSize: 11,
                padding: "4px 0",
                background: active ? "var(--forest)" : "var(--paper)",
                color: active ? "var(--paper)" : "var(--bark)",
                border: "1px solid " + (active ? "var(--forest)" : "var(--line)"),
                fontWeight: active ? 600 : 400,
              }}
            >
              {w}
            </button>
          );
        })}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const iso = isoDate(d);
          const isPast = d < today;
          const byWeekday = weekdays.includes(d.getDay());
          const byDate = allowedDates.includes(iso);
          const available = semRestricao || byWeekday || byDate;
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onToggleDate(iso)}
              title={
                byDate
                  ? "Data específica marcada (clique para remover)"
                  : byWeekday
                    ? "Disponível pela recorrência semanal"
                    : "Clique para marcar esta data específica"
              }
              className="rounded-md text-sm"
              style={{
                padding: "6px 0",
                background: byDate ? "var(--gold)" : byWeekday ? "var(--moss-light)" : "transparent",
                color: isPast ? "var(--line)" : byDate ? "var(--bark)" : available ? "var(--forest)" : "var(--bark)",
                border: "1px solid " + (byDate ? "var(--gold)" : byWeekday ? "var(--moss)" : "var(--line)"),
                opacity: isPast ? 0.45 : available ? 1 : 0.55,
                cursor: isPast ? "not-allowed" : "pointer",
                fontWeight: byDate || byWeekday ? 600 : 400,
              }}
            >
              {pad(d.getDate())}
            </button>
          );
        })}
      </div>

      <p className="text-xs opacity-60 mt-2">
        {semRestricao
          ? "Disponível todos os dias. Clique nos dias da semana (topo) para recorrência semanal, ou nos números para datas específicas."
          : "Verde = recorrência semanal · Dourado = data específica. Sem marcação = indisponível."}
      </p>
    </div>
  );
}
