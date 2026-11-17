import { useState } from "react";
import { BarChart3, Building2, CalendarCheck, MessageCircle, ScrollText, Ticket, TrendingUp, Users } from "lucide-react";
import { DashboardTab } from "./DashboardTab";
import { CatalogTab } from "./CatalogTab";
import { VendasTab } from "./VendasTab";
import { WhatsappTab } from "./WhatsappTab";
import { RelatoriosTab } from "./RelatoriosTab";
import { AgendamentoTab } from "./AgendamentoTab";
import { UsuariosTab } from "./UsuariosTab";
import { LogsTab } from "./LogsTab";
import type { AdminUser } from "../../types";

type TabId = "dashboard" | "relatorios" | "catalogo" | "vendas" | "agendamento" | "whatsapp" | "usuarios" | "logs";

const ALL_TABS: { id: TabId; label: string; icon: typeof TrendingUp; roles: AdminUser["role"][] }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp, roles: ["admin"] },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "hotel_admin"] },
  { id: "catalogo", label: "Hotéis & Atividades", icon: Building2, roles: ["admin", "hotel_admin"] },
  { id: "vendas", label: "Vendas & Vouchers", icon: Ticket, roles: ["admin", "hotel_admin", "agendamento"] },
  { id: "agendamento", label: "Sala de Agendamento", icon: CalendarCheck, roles: ["admin", "hotel_admin", "agendamento"] },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, roles: ["admin", "hotel_admin", "agendamento"] },
  { id: "logs", label: "Logs", icon: ScrollText, roles: ["admin", "hotel_admin", "agendamento"] },
  { id: "usuarios", label: "Usuários", icon: Users, roles: ["admin"] },
];

// Aba inicial por papel: master no Dashboard; admin de hotel no catálogo (abre/fecha vagas
// do seu hotel); sala de agendamento na fila de aprovação.
const DEFAULT_TAB: Record<AdminUser["role"], TabId> = {
  admin: "dashboard",
  hotel_admin: "catalogo",
  agendamento: "agendamento",
};

export function AdminApp({ user }: { user: AdminUser }) {
  const tabs = ALL_TABS.filter((t) => t.roles.includes(user.role));
  const [tab, setTab] = useState<TabId>(DEFAULT_TAB[user.role]);

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="no-print flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm"
            style={{
              background: tab === t.id ? "var(--forest)" : "var(--paper)",
              color: tab === t.id ? "var(--paper)" : "var(--bark)",
              border: "1px solid var(--line)",
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "relatorios" && <RelatoriosTab user={user} />}
      {tab === "catalogo" && <CatalogTab user={user} />}
      {tab === "vendas" && <VendasTab user={user} />}
      {tab === "agendamento" && <AgendamentoTab user={user} />}
      {tab === "whatsapp" && <WhatsappTab user={user} />}
      {tab === "logs" && <LogsTab user={user} />}
      {tab === "usuarios" && <UsuariosTab me={user} />}
    </div>
  );
}
