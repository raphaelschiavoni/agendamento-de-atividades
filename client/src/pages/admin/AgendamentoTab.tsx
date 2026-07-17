import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, Home, MapPin, Phone, Sparkles } from "lucide-react";
import { listHotelsAdmin } from "../../api/hotels";
import { approveBookingAdmin, listBookingsAdmin } from "../../api/bookings";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import type { AdminUser } from "../../types";

// Fila da Sala de Agendamento: reservas aguardando validação.
// Ao aprovar, o resumo é disparado no WhatsApp da recepção do hotel.
export function AgendamentoTab({ user }: { user: AdminUser }) {
  const lockedHotel = user.role === "agendamento" ? user.hotelId : null;
  const [filterHotel, setFilterHotel] = useState<string>(lockedHotel ?? "all");
  const queryClient = useQueryClient();

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });
  const { data: pendentes = [], isLoading } = useQuery({
    queryKey: ["bookings-pendentes", filterHotel],
    queryFn: () => listBookingsAdmin({ hotelId: filterHotel, approvalStatus: "pendente" }),
    refetchInterval: 30_000, // a fila se atualiza sozinha a cada 30s
  });

  const approveMutation = useMutation({
    mutationFn: approveBookingAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings-pendentes"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-admin"] });
      queryClient.invalidateQueries({ queryKey: ["whatsapp-log"] });
    },
  });

  const hotelName = (id: string | null) => hotels.find((h) => h.id === id)?.name ?? "";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {lockedHotel ? (
          <span className="text-sm px-3 py-1.5 rounded-md" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>
            Sala de Agendamento — {hotelName(lockedHotel)}
          </span>
        ) : (
          <select
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="rounded-md px-2 py-1.5 text-sm"
            style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
          >
            <option value="all">Todos os hotéis</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
        <span className="text-xs opacity-60">
          {pendentes.length} reserva(s) aguardando validação · ao aprovar, o resumo é enviado ao WhatsApp da recepção
        </span>
      </div>

      {isLoading && <p className="text-sm opacity-60">Carregando…</p>}

      <div className="space-y-3">
        {pendentes.map((b) => (
          <div key={b.id} className="rounded-lg p-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--forest)" }}>
                  {b.activityName}
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--gold-light)", color: "var(--gold)" }}>{b.voucherCode}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: CATEGORY_META[b.category].bg, color: CATEGORY_META[b.category].color }}>
                    {CATEGORY_META[b.category].label}
                  </span>
                </div>
                <div className="text-xs opacity-70 mt-1.5 space-y-0.5">
                  <div className="flex items-center gap-1"><MapPin size={11} /> {b.hotelName} · {b.date} às {b.time}</div>
                  <div className="flex items-center gap-1">
                    <Phone size={11} /> {b.customer?.name} ({b.customer?.phone}) · {b.adults} adulto(s){b.children > 0 ? ` + ${b.children} criança(s)` : ""}
                  </div>
                  {b.roomNumber && (
                    <div className="flex items-center gap-1"><Home size={11} /> Chalé/Quarto: {b.roomNumber}</div>
                  )}
                  {b.category === "passaporte" && b.guestHotelId && b.guestHotelId !== b.hotelId && (
                    <div className="flex items-center gap-1" style={{ color: "var(--plum)" }}>
                      <Sparkles size={11} /> Passaporte — hospedado em {hotelName(b.guestHotelId)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-medium">{b.total === 0 ? "Incluso" : formatBRL(b.total)}</span>
                <button
                  onClick={() => approveMutation.mutate(b.id)}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm"
                  style={{ background: "var(--moss)", color: "#fff" }}
                >
                  <CheckCircle2 size={15} /> Aprovar e enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && pendentes.length === 0 && (
          <div className="rounded-lg p-8 text-center" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <CalendarCheck size={28} color="var(--moss)" className="mx-auto mb-2" />
            <p className="text-sm opacity-60">Nenhuma reserva aguardando validação. Tudo em dia! ✅</p>
          </div>
        )}
      </div>
    </div>
  );
}
