import { useState } from "react";
import { Modal } from "../../components/Modal";
import { Field } from "../../components/Field";
import { PhotoField } from "../../components/PhotoField";
import type { Hotel } from "../../types";

export function HotelEditor({ hotel, onClose, onSave }: { hotel: Hotel; onClose: () => void; onSave: (data: Hotel) => void }) {
  const [form, setForm] = useState<Hotel>(hotel);
  return (
    <Modal title="Editar hotel" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nome do hotel" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <Field label="Endereço" value={form.address || ""} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Estrada..., km ..." />
        <Field label="Cidade" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
        <PhotoField value={form.photo} onChange={(v) => setForm((f) => ({ ...f, photo: v }))} />
        <Field
          label="Número de WhatsApp da recepção (com DDI, ex: 5519999990000)"
          value={form.waNumber || ""}
          onChange={(v) => setForm((f) => ({ ...f, waNumber: v }))}
        />
        <button
          onClick={() => onSave(form)}
          className="w-full rounded-md py-2 text-sm mt-2"
          style={{ background: "var(--forest)", color: "var(--paper)" }}
        >
          Salvar
        </button>
      </div>
    </Modal>
  );
}
