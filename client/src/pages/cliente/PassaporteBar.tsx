import { Sparkles } from "lucide-react";
import type { Hotel } from "../../types";

// Bloco exibido no topo da listagem quando a categoria é "Passaporte dos Sonhos":
// explica o benefício, coleta a hospedagem e permite ver atividades de qualquer hotel.
export function PassaporteBar({
  hotels,
  activityFilter,
  onPickFilter,
  guestHotelId,
  setGuestHotelId,
  roomNumber,
  setRoomNumber,
}: {
  hotels: Hotel[];
  activityFilter: string; // "all" ou id do hotel
  onPickFilter: (v: string) => void;
  guestHotelId: string;
  setGuestHotelId: (v: string) => void;
  roomNumber: string;
  setRoomNumber: (v: string) => void;
}) {
  const options = [{ id: "all", name: "Todos os hotéis" }, ...hotels.map((h) => ({ id: h.id, name: h.name.replace(" dos Sonhos", "") }))];
  return (
    <div className="rounded-lg p-4 mb-4" style={{ background: "var(--plum-light)", border: "1px solid var(--plum)" }}>
      <div className="flex items-start gap-2 mb-3">
        <Sparkles size={18} color="var(--plum)" style={{ marginTop: 1 }} />
        <p className="text-sm" style={{ color: "var(--bark)" }}>
          Com o <strong>Passaporte dos Sonhos</strong>, você usa as atividades de <strong>qualquer um dos 5 hotéis</strong> da
          rede durante a sua estadia, <strong>sem custo adicional</strong>.
        </p>
      </div>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div>
          <label className="text-xs font-medium opacity-70 block mb-1">Onde você está hospedado?</label>
          <select
            value={guestHotelId}
            onChange={(e) => setGuestHotelId(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
          >
            <option value="">Selecione o hotel da sua estadia…</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium opacity-70 block mb-1">Número do Chalé/Quarto</label>
          <input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Ex: 101, 205"
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium opacity-70 block mb-1.5">Ver atividades de:</label>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = o.id === activityFilter;
            return (
              <button
                key={o.id}
                onClick={() => onPickFilter(o.id)}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: active ? "var(--plum)" : "var(--paper)",
                  color: active ? "#fff" : "var(--bark)",
                  border: "1px solid var(--plum)",
                }}
              >
                {o.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
