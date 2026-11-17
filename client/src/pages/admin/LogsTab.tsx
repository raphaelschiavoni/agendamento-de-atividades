import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShieldCheck } from "lucide-react";
import { listHotelsAdmin } from "../../api/hotels";
import { listAuditLogs, type AuditLog } from "../../api/audit";
import { scopedHotelId, type AdminUser } from "../../types";

// Rótulos amigáveis das ações registradas.
const ACTION_LABELS: Record<string, string> = {
  "booking.edit": "Editou reserva",
  "booking.cancel": "Cancelou reserva",
  "booking.mark_used": "Marcou utilizado",
  "booking.approve": "Aprovou reserva",
  "activity.create": "Criou atividade",
  "activity.update": "Editou atividade",
  "activity.toggle": "Ativou/Desativou atividade",
  "activity.delete": "Excluiu atividade",
  "hotel.update": "Editou hotel",
  "user.create": "Criou usuário",
  "user.delete": "Excluiu usuário",
};

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todas as ações" },
  { value: "booking.edit", label: "Edição de reserva" },
  { value: "booking.cancel", label: "Cancelamento de reserva" },
  { value: "booking.mark_used", label: "Marcar utilizado" },
  { value: "booking.approve", label: "Aprovação de reserva" },
  { value: "activity", label: "Atividades (criar/editar/excluir)" },
  { value: "user", label: "Usuários" },
];

function actionColor(action: string): string {
  if (action.startsWith("booking.cancel") || action.endsWith(".delete")) return "var(--danger)";
  if (action.startsWith("booking.edit") || action.startsWith("activity.update")) return "var(--gold)";
  if (action.startsWith("booking.approve") || action.startsWith("booking.mark_used")) return "var(--moss)";
  return "var(--forest)";
}

export function LogsTab({ user }: { user: AdminUser }) {
  const lockedHotel = scopedHotelId(user);
  const [hotelId, setHotelId] = useState(lockedHotel ?? "all");
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });
  const { data: logs = [], isFetching } = useQuery({
    queryKey: ["audit-logs", hotelId, action, search],
    queryFn: () => listAuditLogs({ hotelId, action, search }),
    refetchInterval: 30_000,
  });

  const hotelName = (id: string | null) => hotels.find((h) => h.id === id)?.name ?? "—";
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="rounded-lg p-3 mb-4 flex items-start gap-2" style={{ background: "var(--moss-light)", border: "1px solid var(--moss)" }}>
        <ShieldCheck size={16} color="var(--moss)" style={{ marginTop: 2 }} />
        <p className="text-xs" style={{ color: "var(--bark)" }}>
          Toda alteração no painel (editar, cancelar, aprovar reservas, mexer em atividades) fica registrada aqui com <strong>quem fez e quando</strong>.
          {lockedHotel && " Você vê apenas os registros do seu hotel."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {!lockedHotel && (
          <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
            <option value="all">Todos os hotéis</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        )}
        <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
          {ACTION_FILTERS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5" style={{ border: "1px solid var(--line)" }}>
          <Search size={14} className="opacity-50" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por pessoa ou reserva" className="text-sm outline-none" style={{ background: "transparent" }} />
        </div>
        <span className="text-xs opacity-60">{isFetching ? "atualizando…" : `${logs.length} registro(s)`}</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Quando", "Quem", "Ação", "Detalhe", "Hotel"].map((h) => (
                <th key={h} className="text-left" style={{ padding: "6px 8px", borderBottom: "2px solid var(--line)", color: "var(--forest)", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((l: AuditLog) => (
              <tr key={l.id}>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap", opacity: 0.8 }}>{fmt(l.created_at)}</td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", fontWeight: 500, color: "var(--forest)" }}>{l.admin_name ?? "—"}</td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)" }}>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--cream)", color: actionColor(l.action), border: `1px solid ${actionColor(l.action)}` }}>
                    {ACTION_LABELS[l.action] ?? l.action}
                  </span>
                </td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", opacity: 0.9 }}>{l.summary}</td>
                <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", opacity: 0.7, whiteSpace: "nowrap" }}>{l.hotel_id ? hotelName(l.hotel_id) : "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "12px 8px", opacity: 0.5 }}>Nenhum registro com esses filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
