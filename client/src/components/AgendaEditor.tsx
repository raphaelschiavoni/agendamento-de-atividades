import { useState } from "react";
import { CalendarPlus, Clock, Copy, Plus, Trash2 } from "lucide-react";
import type { ActivitySchedule, ScheduleSlot } from "../types";

const DAY_TABS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

// Agenda por dia da semana + datas pontuais (estilo catálogo): cada dia tem seus
// próprios horários, e cada horário sua quantidade de vagas.
export function AgendaEditor({
  schedule,
  onChange,
  defaultCapacity,
}: {
  schedule: ActivitySchedule;
  onChange: (s: ActivitySchedule) => void;
  defaultCapacity: number;
}) {
  const [tab, setTab] = useState<number | "dates">(new Date().getDay());
  const [newDate, setNewDate] = useState("");

  const weekdaySlots = (d: number): ScheduleSlot[] => schedule.weekdays?.[String(d)] ?? [];
  const dateEntries = Object.entries(schedule.dates ?? {}).sort(([a], [b]) => a.localeCompare(b));

  function setWeekday(d: number, slots: ScheduleSlot[]) {
    onChange({ ...schedule, weekdays: { ...(schedule.weekdays ?? {}), [String(d)]: slots } });
  }
  function setDateSlots(date: string, slots: ScheduleSlot[] | null) {
    const dates = { ...(schedule.dates ?? {}) };
    if (slots === null) delete dates[date];
    else dates[date] = slots;
    onChange({ ...schedule, dates });
  }
  function copyDayToAll(d: number) {
    const src = weekdaySlots(d);
    const weekdays: Record<string, ScheduleSlot[]> = {};
    for (let i = 0; i <= 6; i++) weekdays[String(i)] = src.map((s) => ({ ...s }));
    onChange({ ...schedule, weekdays });
  }

  return (
    <div className="rounded-md" style={{ border: "1px solid var(--line)", background: "var(--cream)" }}>
      {/* abas */}
      <div className="flex flex-wrap gap-1 p-2" style={{ borderBottom: "1px solid var(--line)" }}>
        {DAY_TABS.map((label, d) => {
          const has = weekdaySlots(d).length > 0;
          const active = tab === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setTab(d)}
              className="px-2.5 py-1.5 rounded-md text-xs"
              style={{
                background: active ? "var(--forest)" : "var(--paper)",
                color: active ? "var(--paper)" : "var(--bark)",
                border: "1px solid " + (has ? "var(--moss)" : "var(--line)"),
                fontWeight: has ? 600 : 400,
              }}
            >
              {label.replace("-feira", "")}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setTab("dates")}
          className="px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1"
          style={{
            background: tab === "dates" ? "var(--forest)" : "var(--paper)",
            color: tab === "dates" ? "var(--paper)" : "var(--bark)",
            border: "1px solid " + (dateEntries.length > 0 ? "var(--gold)" : "var(--line)"),
            fontWeight: dateEntries.length > 0 ? 600 : 400,
          }}
        >
          <CalendarPlus size={12} /> Datas pontuais
        </button>
      </div>

      <div className="p-3">
        {tab !== "dates" ? (
          <div>
            <SlotList
              slots={weekdaySlots(tab as number)}
              onChange={(slots) => setWeekday(tab as number, slots)}
              defaultCapacity={defaultCapacity}
            />
            {weekdaySlots(tab as number).length > 0 && (
              <button
                type="button"
                onClick={() => copyDayToAll(tab as number)}
                className="mt-2 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md"
                style={{ border: "1px solid var(--line)" }}
              >
                <Copy size={12} /> Copiar este dia para todos os dias
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-md px-2 py-1.5 text-sm"
                style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newDate && !(schedule.dates ?? {})[newDate]) setDateSlots(newDate, [{ time: "09:00" }]);
                  setNewDate("");
                }}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md"
                style={{ background: "var(--forest)", color: "var(--paper)" }}
              >
                <Plus size={12} /> Adicionar data
              </button>
            </div>
            {dateEntries.length === 0 && (
              <p className="text-xs opacity-60">Nenhuma data pontual. Use para eventos em dias específicos (ex.: 20/07).</p>
            )}
            <div className="space-y-3">
              {dateEntries.map(([date, slots]) => (
                <div key={date} className="rounded-md p-2.5" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: "var(--forest)" }}>
                      {date.split("-").reverse().join("/")}
                    </span>
                    <button type="button" onClick={() => setDateSlots(date, null)} title="Remover data">
                      <Trash2 size={13} color="var(--danger)" />
                    </button>
                  </div>
                  <SlotList slots={slots} onChange={(s) => setDateSlots(date, s)} defaultCapacity={defaultCapacity} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SlotList({
  slots,
  onChange,
  defaultCapacity,
}: {
  slots: ScheduleSlot[];
  onChange: (slots: ScheduleSlot[]) => void;
  defaultCapacity: number;
}) {
  function update(i: number, patch: Partial<ScheduleSlot>) {
    onChange(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function remove(i: number) {
    onChange(slots.filter((_, idx) => idx !== i));
  }
  function add() {
    const last = slots[slots.length - 1];
    onChange([...slots, { time: last ? last.time : "09:00", capacity: last?.capacity }]);
  }

  return (
    <div>
      {slots.length === 0 && <p className="text-xs opacity-60 mb-2">Sem horários — este dia fica indisponível.</p>}
      <div className="space-y-1.5">
        {slots.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <Clock size={13} style={{ opacity: 0.5 }} />
            <input
              type="time"
              value={s.time}
              onChange={(e) => update(i, { time: e.target.value })}
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            />
            <span className="text-xs opacity-60">Até</span>
            <input
              type="number"
              min={1}
              value={s.capacity ?? ""}
              placeholder={String(defaultCapacity)}
              onChange={(e) => {
                const n = Number(e.target.value);
                update(i, { capacity: e.target.value.trim() && Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined });
              }}
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ border: "1px solid var(--line)", background: "var(--paper)", width: 70 }}
            />
            <span className="text-xs opacity-60">vagas</span>
            <button type="button" onClick={() => remove(i)} title="Remover horário">
              <Trash2 size={13} color="var(--danger)" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md"
        style={{ background: "var(--moss)", color: "#fff" }}
      >
        <Plus size={12} /> Adicionar horário
      </button>
    </div>
  );
}
