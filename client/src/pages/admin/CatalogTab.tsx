import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { listHotelsAdmin, updateHotelAdmin } from "../../api/hotels";
import {
  createActivityAdmin,
  deleteActivityAdmin,
  listActivitiesAdmin,
  toggleActivityAdmin,
  updateActivityAdmin,
} from "../../api/activities";
import { CATEGORY_META, CATEGORY_ORDER } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import { ActivityEditor } from "./ActivityEditor";
import { HotelEditor } from "./HotelEditor";
import type { Activity, Category, Hotel } from "../../types";

export function CatalogTab() {
  const queryClient = useQueryClient();
  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });
  const [hotelId, setHotelId] = useState<string | undefined>(undefined);
  const activeHotelId = hotelId ?? hotels[0]?.id;

  const { data: activities = [] } = useQuery({
    queryKey: ["activities-admin", activeHotelId],
    queryFn: () => listActivitiesAdmin(activeHotelId!),
    enabled: !!activeHotelId,
  });

  const [editingActivity, setEditingActivity] = useState<Activity | "new" | null>(null);
  const [editingHotel, setEditingHotel] = useState(false);

  const hotel = hotels.find((h) => h.id === activeHotelId);

  function invalidateActivities() {
    queryClient.invalidateQueries({ queryKey: ["activities-admin", activeHotelId] });
  }

  const createMutation = useMutation({
    mutationFn: (data: Omit<Activity, "id" | "hotelId">) => createActivityAdmin({ ...data, hotelId: activeHotelId! }),
    onSuccess: () => { invalidateActivities(); setEditingActivity(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) => updateActivityAdmin(id, data),
    onSuccess: () => { invalidateActivities(); setEditingActivity(null); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleActivityAdmin(id, active),
    onSuccess: invalidateActivities,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteActivityAdmin,
    onSuccess: invalidateActivities,
  });
  const saveHotelMutation = useMutation({
    mutationFn: (data: Hotel) => updateHotelAdmin(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotels-admin"] });
      setEditingHotel(false);
    },
  });

  if (!hotel) return null;

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {hotels.map((h) => (
          <button
            key={h.id}
            onClick={() => setHotelId(h.id)}
            className="px-3 py-1.5 rounded-md text-sm whitespace-nowrap"
            style={{
              background: activeHotelId === h.id ? "var(--forest)" : "var(--paper)",
              color: activeHotelId === h.id ? "var(--paper)" : "var(--bark)",
              border: "1px solid var(--line)",
            }}
          >
            {h.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <div style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-lg">{hotel.name}</div>
          <div className="text-xs opacity-60 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><MapPin size={12} /> {hotel.address ? `${hotel.address} — ${hotel.city}` : hotel.city}</span>
            <span className="flex items-center gap-1"><MessageCircle size={12} /> WhatsApp: {hotel.waNumber}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditingHotel(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" style={{ border: "1px solid var(--line)" }}>
            <Pencil size={13} /> Editar hotel
          </button>
          <button
            onClick={() => setEditingActivity("new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
            style={{ background: "var(--forest)", color: "var(--paper)" }}
          >
            <Plus size={13} /> Nova atividade
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="rounded-lg p-3" style={{ background: "var(--paper)", border: "1px solid var(--line)", opacity: a.active ? 1 : 0.5 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>{a.name} {!a.active && "(inativa)"}</div>
                <div className="text-xs opacity-60">{a.durationMin} min · capacidade {a.capacity}/horário · horários: {a.times.join(", ")}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => toggleMutation.mutate({ id: a.id, active: !a.active })} className="px-2 py-1 rounded-md text-xs" style={{ border: "1px solid var(--line)" }}>
                  {a.active ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => setEditingActivity(a)} className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}><Pencil size={13} /></button>
                <button
                  onClick={() => { if (confirm("Remover esta atividade?")) deleteMutation.mutate(a.id); }}
                  className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}
                >
                  <Trash2 size={13} color="var(--danger)" />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {CATEGORY_ORDER.map((c) => (
                <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: CATEGORY_META[c].bg, color: CATEGORY_META[c].color }}>
                  {CATEGORY_META[c].label}: {a.prices[c as Category] === 0 ? "Incluso" : formatBRL(a.prices[c as Category])}
                </span>
              ))}
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="text-sm opacity-60">Nenhuma atividade cadastrada. Clique em "Nova atividade".</p>}
      </div>

      {editingActivity && (
        <ActivityEditor
          activity={editingActivity === "new" ? null : editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={(data) => {
            if (editingActivity !== "new" && editingActivity.id) {
              updateMutation.mutate({ id: editingActivity.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
      {editingHotel && (
        <HotelEditor hotel={hotel} onClose={() => setEditingHotel(false)} onSave={(data) => saveHotelMutation.mutate(data)} />
      )}
    </div>
  );
}
