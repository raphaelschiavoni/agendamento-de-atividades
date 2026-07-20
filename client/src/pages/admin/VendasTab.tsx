import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Pencil, Search, Trash2, X } from "lucide-react";
import { listHotelsAdmin } from "../../api/hotels";
import { cancelBookingAdmin, listBookingsAdmin, markUsedAdmin, type ListBookingsFilters } from "../../api/bookings";
import { StatusBadge } from "../../components/StatusBadge";
import { EditBookingModal } from "./EditBookingModal";
import { OccupancyBoard } from "./OccupancyBoard";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL, isoDate } from "../../lib/format";
import type { AdminUser, Booking } from "../../types";

export function VendasTab({ user }: { user: AdminUser }) {
  const lockedHotel = user.role === "agendamento" ? user.hotelId : null;
  const [view, setView] = useState<"lista" | "ocupacao">("lista");
  const [filterHotel, setFilterHotel] = useState(lockedHotel ?? "all");
  const [filterStatus, setFilterStatus] = useState<ListBookingsFilters["status"]>("all");
  const [filterDate, setFilterDate] = useState(""); // data da atividade; "" = todas
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);
  const queryClient = useQueryClient();

  const hoje = isoDate(new Date());
  const amanha = isoDate(new Date(Date.now() + 86_400_000));

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });
  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings-admin", filterHotel, filterStatus, filterDate, search],
    queryFn: () => listBookingsAdmin({ hotelId: filterHotel, status: filterStatus, date: filterDate || undefined, search }),
  });

  const markUsedMutation = useMutation({
    mutationFn: markUsedAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings-admin"] }),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelBookingAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings-admin"] }),
  });

  return (
    <div>
      {/* Alterna entre a lista de vouchers e o quadro de ocupação por horário */}
      <div className="flex gap-2 mb-4">
        {([["lista", "Reservas"], ["ocupacao", "Ocupação por horário"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-3 py-1.5 rounded-md text-sm"
            style={{
              background: view === v ? "var(--forest)" : "var(--paper)",
              color: view === v ? "var(--paper)" : "var(--bark)",
              border: "1px solid var(--line)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {lockedHotel ? (
          <span className="text-sm px-3 py-1.5 rounded-md" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>
            {hotels.find((h) => h.id === lockedHotel)?.name ?? "Seu hotel"}
          </span>
        ) : (
          <select value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)" }}>
            <option value="all">{view === "ocupacao" ? "Selecione um hotel…" : "Todos os hotéis"}</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
        {view === "lista" && (
          <>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ListBookingsFilters["status"])}
              className="rounded-md px-2 py-1.5 text-sm"
              style={{ border: "1px solid var(--line)" }}
            >
              <option value="all">Todos os status</option>
              <option value="pendente-uso">Aguardando uso</option>
              <option value="utilizado">Utilizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5" style={{ border: "1px solid var(--line)" }}>
              <Search size={14} className="opacity-50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nome, telefone ou voucher"
                className="text-sm outline-none"
                style={{ background: "transparent" }}
              />
            </div>
          </>
        )}
      </div>

      {/* Filtro por dia da atividade */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs opacity-60 flex items-center gap-1"><CalendarDays size={13} /> Dia da atividade:</span>
        {[
          { label: "Hoje", value: hoje },
          { label: "Amanhã", value: amanha },
        ].map((q) => (
          <button
            key={q.value}
            onClick={() => setFilterDate(filterDate === q.value ? "" : q.value)}
            className="px-2.5 py-1 rounded-full text-xs"
            style={{
              background: filterDate === q.value ? "var(--forest)" : "var(--paper)",
              color: filterDate === q.value ? "var(--paper)" : "var(--bark)",
              border: "1px solid var(--line)",
            }}
          >
            {q.label}
          </button>
        ))}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-md px-2 py-1 text-sm"
          style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
        />
        {filterDate && view === "lista" && (
          <button
            onClick={() => setFilterDate("")}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
            style={{ border: "1px solid var(--line)" }}
          >
            <X size={12} /> Limpar dia
          </button>
        )}
        {view === "lista" && <span className="text-xs opacity-60">{bookings.length} reserva(s)</span>}
      </div>

      {view === "ocupacao" && <OccupancyBoard hotelId={filterHotel} date={filterDate || hoje} />}

      {view === "lista" && (
      <div className="space-y-2">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg p-3 flex items-center justify-between flex-wrap gap-2" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <div>
              <div className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--forest)" }}>
                {b.activityName}
                <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--gold-light)", color: "var(--gold)" }}>{b.voucherCode}</span>
              </div>
              <div className="text-xs opacity-60">
                {b.hotelName} · {b.date} às {b.time} · {b.qty} pessoa(s) · {CATEGORY_META[b.category].label} · {b.customer?.name} ({b.customer?.phone})
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{formatBRL(b.total)}</span>
              <StatusBadge booking={b} />
              {b.status !== "cancelado" && !b.used && (
                <>
                  <button
                    onClick={() => setEditing(b)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                    style={{ border: "1px solid var(--line)", color: "var(--forest)" }}
                    title="Editar horário/participantes"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button onClick={() => markUsedMutation.mutate(b.id)} className="px-2 py-1 rounded-md text-xs" style={{ background: "var(--moss)", color: "#fff" }}>
                    Marcar utilizado
                  </button>
                </>
              )}
              {b.status !== "cancelado" && (
                <button
                  onClick={() => { if (confirm("Cancelar este voucher?")) cancelMutation.mutate(b.id); }}
                  className="p-1.5 rounded-md" style={{ border: "1px solid var(--line)" }}
                >
                  <Trash2 size={13} color="var(--danger)" />
                </button>
              )}
            </div>
          </div>
        ))}
        {bookings.length === 0 && <p className="text-sm opacity-60">Nenhuma venda encontrada com esses filtros.</p>}
      </div>
      )}

      {editing && (
        <EditBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ["bookings-admin"] });
            queryClient.invalidateQueries({ queryKey: ["bookings-pendentes"] });
          }}
        />
      )}
    </div>
  );
}
