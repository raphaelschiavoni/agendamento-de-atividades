import { useQuery } from "@tanstack/react-query";
import { getOccupancy, type OccupancySlot } from "../../api/activities";

// Cor do card por lotação: verde = vazio/com vagas, amarelo = enchendo, vermelho = esgotado.
function slotColors(s: OccupancySlot): { border: string; bg: string } {
  if (s.remaining <= 0) return { border: "var(--danger)", bg: "var(--clay-light)" };
  if (s.reserved <= 0) return { border: "var(--moss)", bg: "var(--moss-light)" };
  if (s.remaining <= s.capacity / 2) return { border: "var(--gold)", bg: "var(--gold-light)" };
  return { border: "var(--moss)", bg: "var(--moss-light)" };
}

export function OccupancyBoard({ hotelId, date }: { hotelId: string; date: string }) {
  const enabled = !!hotelId && hotelId !== "all" && !!date;
  const { data, isLoading } = useQuery({
    queryKey: ["occupancy", hotelId, date],
    queryFn: () => getOccupancy(hotelId, date),
    enabled,
    refetchInterval: 30_000,
  });

  if (!enabled) {
    return <p className="text-sm opacity-60">Selecione um hotel e um dia para ver a ocupação por horário.</p>;
  }
  if (isLoading) return <p className="text-sm opacity-60">Carregando ocupação…</p>;

  const activities = data?.activities ?? [];
  if (activities.length === 0) {
    return <p className="text-sm opacity-60">Nenhuma atividade com horários neste dia.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-xs opacity-80">
        {[
          { c: "var(--moss)", t: "Com vagas" },
          { c: "var(--gold)", t: "Enchendo" },
          { c: "var(--danger)", t: "Esgotado" },
        ].map((l) => (
          <span key={l.t} className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: 3, background: l.c, display: "inline-block" }} /> {l.t}
          </span>
        ))}
      </div>

      {activities.map((a) => (
        <div key={a.activityId}>
          <div className="text-sm font-semibold mb-2" style={{ color: "var(--forest)" }}>{a.activityName}</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
            {a.slots.map((s) => {
              const c = slotColors(s);
              return (
                <div
                  key={s.time}
                  className="rounded-lg p-3 relative group"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `5px solid ${c.border}`, cursor: s.guests.length ? "help" : "default" }}
                >
                  <div className="text-sm font-semibold" style={{ color: "var(--forest)" }}>Horário: {s.time}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--bark)" }}>Reservas: {s.reserved} pessoa(s)</div>
                  <div className="text-xs font-medium" style={{ color: c.border }}>
                    Disponível: {s.remaining} de {s.capacity}
                  </div>

                  {/* Passe o mouse para conferir os nomes agendados neste horário */}
                  {s.guests.length > 0 && (
                    <div
                      className="hidden group-hover:block absolute z-20 left-0 top-full mt-1 rounded-md p-2 shadow-lg"
                      style={{ background: "var(--paper)", border: "1px solid var(--line)", minWidth: 180, maxHeight: 220, overflowY: "auto" }}
                    >
                      <div className="text-xs font-semibold mb-1" style={{ color: "var(--forest)" }}>Agendados ({s.reserved})</div>
                      {s.guests.map((g, i) => (
                        <div key={i} className="text-xs flex justify-between gap-3" style={{ color: "var(--bark)" }}>
                          <span>{g.name}</span>
                          {g.qty > 1 && <span className="opacity-60">{g.qty} pessoas</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
