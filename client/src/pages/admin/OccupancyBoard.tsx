import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Users } from "lucide-react";
import { Modal } from "../../components/Modal";
import { getOccupancy, type ActivityOccupancy, type OccupancySlot } from "../../api/activities";
import { markUsedAdmin } from "../../api/bookings";
import { displayTime } from "../../lib/schedule";

// Cor do card por lotação: verde = vazio/com vagas, amarelo = enchendo, vermelho = esgotado.
function slotColors(s: OccupancySlot): { border: string; bg: string } {
  if (s.remaining <= 0) return { border: "var(--danger)", bg: "var(--clay-light)" };
  if (s.reserved <= 0) return { border: "var(--moss)", bg: "var(--moss-light)" };
  if (s.remaining <= s.capacity / 2) return { border: "var(--gold)", bg: "var(--gold-light)" };
  return { border: "var(--moss)", bg: "var(--moss-light)" };
}

// Guarda apenas as chaves; o slot exibido é lido ao vivo dos dados (reflete "utilizado").
type Detail = { activityId: string; time: string } | null;

export function OccupancyBoard({ hotelId, date }: { hotelId: string; date: string }) {
  const enabled = !!hotelId && hotelId !== "all" && !!date;
  const [detail, setDetail] = useState<Detail>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["occupancy", hotelId, date],
    queryFn: () => getOccupancy(hotelId, date),
    enabled,
    refetchInterval: 30_000,
  });

  const markUsedMutation = useMutation({
    mutationFn: markUsedAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-admin"] });
    },
  });

  if (!enabled) {
    return <p className="text-sm opacity-60">Selecione um hotel e um dia para ver a ocupação por horário.</p>;
  }
  if (isLoading) return <p className="text-sm opacity-60">Carregando ocupação…</p>;

  const activities: ActivityOccupancy[] = data?.activities ?? [];
  if (activities.length === 0) {
    return <p className="text-sm opacity-60">Nenhuma atividade com horários neste dia.</p>;
  }

  // Slot atualmente aberto no popup, lido ao vivo dos dados.
  const detailActivity = detail ? activities.find((a) => a.activityId === detail.activityId) : undefined;
  const detailSlot = detailActivity?.slots.find((s) => s.time === detail?.time);

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
        <span className="opacity-60">· Clique num card para ver os nomes e marcar utilizado</span>
      </div>

      {activities.map((a) => (
        <div key={a.activityId}>
          <div className="text-sm font-semibold mb-2" style={{ color: "var(--forest)" }}>{a.activityName}</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
            {a.slots.map((s) => {
              const c = slotColors(s);
              const clickable = s.guests.length > 0;
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => clickable && setDetail({ activityId: a.activityId, time: s.time })}
                  className="rounded-lg p-3 text-left"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderLeft: `5px solid ${c.border}`,
                    cursor: clickable ? "pointer" : "default",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: "var(--forest)" }}>{a.allDay ? "Dia todo" : `Horário: ${s.time}`}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--bark)" }}>Reservas: {s.reserved} pessoa(s)</div>
                  <div className="text-xs font-medium" style={{ color: c.border }}>
                    Disponível: {s.remaining} de {s.capacity}
                  </div>
                  {clickable && (
                    <div className="text-xs mt-1.5 flex items-center gap-1 opacity-70" style={{ color: "var(--forest)" }}>
                      <Users size={11} /> ver {s.guests.length} agendamento(s)
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {detail && detailActivity && detailSlot && (
        <Modal
          title={`${detailActivity.activityName} — ${displayTime(detailSlot.time)}`}
          onClose={() => setDetail(null)}
        >
          <div className="text-sm mb-3" style={{ color: "var(--bark)" }}>
            <strong>{detailSlot.reserved}</strong> pessoa(s) agendada(s) · {detailSlot.remaining} vaga(s) livre(s) de {detailSlot.capacity}
          </div>
          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: "60vh" }}>
            {detailSlot.guests.map((g, i) => (
              <div
                key={g.bookingId}
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
                style={{ background: "var(--cream)", border: "1px solid var(--line)" }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>
                    {i + 1}. {g.name}
                  </div>
                  {g.phone && <div className="text-xs opacity-60">{g.phone}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>
                    {g.qty} pessoa(s)
                  </span>
                  {g.used ? (
                    <span className="text-xs px-2 py-1 rounded-md flex items-center gap-1" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>
                      <CheckCircle2 size={13} /> Utilizado
                    </span>
                  ) : (
                    <button
                      onClick={() => markUsedMutation.mutate(g.bookingId)}
                      disabled={markUsedMutation.isPending}
                      className="text-xs px-2.5 py-1 rounded-md flex items-center gap-1"
                      style={{ background: "var(--moss)", color: "#fff" }}
                    >
                      <CheckCircle2 size={13} /> Marcar utilizado
                    </button>
                  )}
                </div>
              </div>
            ))}
            {detailSlot.guests.length === 0 && <p className="text-sm opacity-60">Nenhum agendamento neste horário.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
