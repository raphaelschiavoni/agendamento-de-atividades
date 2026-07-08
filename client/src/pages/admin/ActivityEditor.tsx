import { useState } from "react";
import { Modal } from "../../components/Modal";
import { Field } from "../../components/Field";
import { PhotoField } from "../../components/PhotoField";
import { CATEGORY_META, CATEGORY_ORDER } from "../../lib/constants";
import type { Activity, Category } from "../../types";

type FormState = Omit<Activity, "id" | "hotelId"> & { id?: string };

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
      times: ["09:00", "14:00"],
      active: true,
      photo: "",
      tags: [],
      prices: { hospede: 0, visitante: 0, dayuse: 0, passaporte: 0 },
    }
  );
  const [timesText, setTimesText] = useState((activity?.times || ["09:00", "14:00"]).join(", "));
  const [tagsText, setTagsText] = useState((activity?.tags || []).join(", "));

  function submit() {
    const times = timesText.split(",").map((t) => t.trim()).filter(Boolean);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, times, tags });
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
          <Field label="Capacidade por horário" value={form.capacity} onChange={(v) => setForm((f) => ({ ...f, capacity: Number(v) || 0 }))} />
        </div>
        <Field label="Horários (separados por vírgula)" value={timesText} onChange={setTimesText} placeholder="09:00, 11:00, 14:00" />
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
