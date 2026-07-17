import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { listWhatsappLog } from "../../api/dashboard";
import { listHotelsAdmin } from "../../api/hotels";
import type { AdminUser } from "../../types";

export function WhatsappTab({ user }: { user: AdminUser }) {
  const lockedHotel = user.role === "agendamento" ? user.hotelId : null;
  const [filterHotel, setFilterHotel] = useState<string>(lockedHotel ?? "all");

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });
  const { data: log = [] } = useQuery({
    queryKey: ["whatsapp-log", filterHotel],
    queryFn: () => listWhatsappLog(filterHotel),
  });
  const sorted = [...log].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div>
      <div className="rounded-lg p-3 mb-4 flex items-start gap-2" style={{ background: "var(--gold-light)", border: "1px solid var(--gold)" }}>
        <AlertTriangle size={16} color="var(--gold)" style={{ marginTop: 2 }} />
        <p className="text-xs" style={{ color: "var(--bark)" }}>
          Histórico dos resumos enviados após a aprovação da Sala de Agendamento. Em produção, cada linha corresponde a
          uma chamada real para a API oficial do WhatsApp Business (Cloud API da Meta) para o número da recepção.
        </p>
      </div>

      <div className="mb-4">
        {lockedHotel ? (
          <span className="text-sm px-3 py-1.5 rounded-md" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>
            {hotels.find((h) => h.id === lockedHotel)?.name ?? "Seu hotel"}
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
      </div>

      <div className="space-y-2">
        {sorted.map((w) => (
          <div key={w.id} className="rounded-lg p-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--forest)" }}>Para: {w.hotel_name} ({w.to_number})</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>{w.status}</span>
            </div>
            <pre className="text-xs whitespace-pre-wrap" style={{ fontFamily: "inherit", color: "var(--bark)" }}>{w.message}</pre>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm opacity-60">Nenhuma mensagem enviada ainda.</p>}
      </div>
    </div>
  );
}
