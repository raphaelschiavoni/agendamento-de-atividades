import { useState } from "react";
import { Modal } from "../../components/Modal";
import { Field } from "../../components/Field";
import { PhotoField } from "../../components/PhotoField";
import { AgendaEditor } from "../../components/AgendaEditor";
import { scheduleHasContent } from "../../lib/schedule";
import { CATEGORY_META, CATEGORY_ORDER } from "../../lib/constants";
import type { Activity, ActivitySchedule, Category, ScheduleSlot } from "../../types";

type FormState = Omit<Activity, "id" | "hotelId"> & { id?: string };

// Monta a agenda inicial a partir do modelo legado (times + weekdays + capacidades),
// para atividades criadas antes da agenda por dia.
function scheduleFromLegacy(activity: Activity | null): ActivitySchedule {
  if (activity && scheduleHasContent(activity.schedule)) return activity.schedule;
  const times = activity?.times?.length ? activity.times : ["09:00", "14:00"];
  const days = activity?.weekdays?.length ? activity.weekdays : [0, 1, 2, 3, 4, 5, 6];
  const weekdays: Record<string, ScheduleSlot[]> = {};
  for (const d of days) {
    const cap = activity?.weekdayCapacities?.[d];
    weekdays[String(d)] = times.map((t) => ({ time: t.slice(0, 5), capacity: cap }));
  }
  const dates: Record<string, ScheduleSlot[]> = {};
  for (const date of activity?.allowedDates ?? []) {
    dates[date] = times.map((t) => ({ time: t.slice(0, 5) }));
  }
  return { weekdays, dates };
}

export function ActivityEditor({
  activity,
  onClose,
  onSave,
}: {
  activity: Activity | null;
  onClose: () => void;
  onSave: (data: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(
    activity ?? {
      name: "",
      description: "",
      durationMin: 60,
      capacity: 10,
      times: [],
      active: true,
      photo: "",
      tags: [],
      weekdays: [],
      allowedDates: [],
      weekdayCapacities: {},
      schedule: {},
      prices: { hospede: 0, visitante: 0, dayuse: 0, passaporte: 0 },
      categoryCapacities: {},
    }
  );

  function setCategoryCapacity(c: Category, value: string) {
    setForm((f) => {
      const caps = { ...(f.categoryCapacities ?? {}) };
      const n = Number(value);
      if (!value.trim() || !Number.isFinite(n) || n < 0) delete caps[c];
      else caps[c] = Math.floor(n);
      return { ...f, categoryCapacities: caps };
    });
  }
  const [schedule, setSchedule] = useState<ActivitySchedule>(() => scheduleFromLegacy(activity));
  const [tagsText, setTagsText] = useState((activity?.tags || []).join(", "));

  function submit() {
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);

    // Limpa a agenda (remove dias/datas sem horários) e deriva os campos legados
    // (times/weekdays/allowedDates) para exibição e retrocompatibilidade.
    const weekdays: Record<string, ScheduleSlot[]> = {};
    for (const [d, slots] of Object.entries(schedule.weekdays ?? {})) {
      if ((slots?.length ?? 0) > 0) weekdays[d] = slots;
    }
    const dates: Record<string, ScheduleSlot[]> = {};
    for (const [date, slots] of Object.entries(schedule.dates ?? {})) {
      if ((slots?.length ?? 0) > 0) dates[date] = slots;
    }
    const cleaned: ActivitySchedule = { weekdays, dates };

    const allTimes = new Set<string>();
    for (const slots of [...Object.values(weekdays), ...Object.values(dates)]) {
      for (const s of slots) allTimes.add(s.time.slice(0, 5));
    }
    const weekdayNums = Object.keys(weekdays).map(Number).sort((a, b) => a - b);

    onSave({
      ...form,
      tags,
      schedule: cleaned,
      times: Array.from(allTimes).sort(),
      weekdays: weekdayNums.length === 7 ? [] : weekdayNums,
      allowedDates: Object.keys(dates).sort(),
      weekdayCapacities: {},
    });
  }

  return (
    <Modal title={activity ? "Editar atividade" : "Nova atividade"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nome da atividade" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Ex: Tirolesa" />
        <div>
          <label className="text-xs font-medium opacity-70">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-md px-3 py-2 mt-1 text-sm"
            style={{ border: "1px solid var(--line)" }}
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duração (min)" value={form.durationMin} onChange={(v) => setForm((f) => ({ ...f, durationMin: Number(v) || 0 }))} />
          <Field label="Vagas padrão por horário" value={form.capacity} onChange={(v) => setForm((f) => ({ ...f, capacity: Number(v) || 0 }))} />
        </div>

        <div>
          <label className="text-xs font-medium opacity-70 mb-1 block">Agenda da semana</label>
          <AgendaEditor schedule={schedule} onChange={setSchedule} defaultCapacity={form.capacity} />
          <p className="text-xs opacity-50 mt-1">
            Cada dia tem seus horários, e cada horário suas vagas (em branco = padrão {form.capacity}).
            Use "Datas pontuais" para eventos em dias específicos.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium opacity-70 mb-1 block">Vagas por categoria (por horário)</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_ORDER.map((c) => {
              const v = form.categoryCapacities?.[c as Category];
              const hidden = v === 0;
              return (
                <div key={c}>
                  <label className="text-xs opacity-60">{CATEGORY_META[c].label}</label>
                  <input
                    type="number"
                    min={0}
                    value={v ?? ""}
                    placeholder="Sem limite"
                    onChange={(e) => setCategoryCapacity(c as Category, e.target.value)}
                    className="w-full rounded-md px-2 py-1.5 text-sm"
                    style={{
                      border: "1px solid " + (hidden ? "var(--danger)" : "var(--line)"),
                      color: hidden ? "var(--danger)" : undefined,
                    }}
                  />
                  {hidden && <p className="text-xs mt-0.5" style={{ color: "var(--danger)" }}>Não aparece nesta categoria</p>}
                </div>
              );
            })}
          </div>
          <p className="text-xs opacity-50 mt-1">
            Em branco = sem limite (usa as vagas do horário) · <strong>0 = a atividade some desta categoria</strong> ·
            um número = máximo de vagas dessa categoria em cada horário.
          </p>
        </div>

        <Field label="Etiquetas (separadas por vírgula)" value={tagsText} onChange={setTagsText} placeholder="Fácil, A partir de 3 anos, Acessível" />
        <PhotoField value={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
        <div>
          <label className="text-xs font-medium opacity-70 mb-1 block">Preços por categoria (R$ — use 0 para "incluso")</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_ORDER.map((c) => (
              <div key={c}>
                <label className="text-xs opacity-60">{CATEGORY_META[c].label}</label>
                <input
                  type="number"
                  value={form.prices[c as Category]}
                  onChange={(e) => setForm((f) => ({ ...f, prices: { ...f.prices, [c]: Number(e.target.value) || 0 } }))}
                  className="w-full rounded-md px-2 py-1.5 text-sm"
                  style={{ border: "1px solid var(--line)" }}
                />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={submit}
          disabled={!form.name.trim()}
          className="w-full rounded-md py-2 text-sm mt-2"
          style={{ background: form.name.trim() ? "var(--forest)" : "#ccc", color: "var(--paper)" }}
        >
          Salvar atividade
        </button>
      </div>
    </Modal>
  );
}
