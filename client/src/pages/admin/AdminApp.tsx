import { useState } from "react";
import { BarChart3, Building2, CalendarCheck, MessageCircle, Ticket, TrendingUp, Users } from "lucide-react";
import { DashboardTab } from "./DashboardTab";
import { CatalogTab } from "./CatalogTab";
import { VendasTab } from "./VendasTab";
import { WhatsappTab } from "./WhatsappTab";
import { RelatoriosTab } from "./RelatoriosTab";
import { AgendamentoTab } from "./AgendamentoTab";
import { UsuariosTab } from "./UsuariosTab";
import type { AdminUser } from "../../types";

type TabId = "dashboard" | "relatorios" | "catalogo" | "vendas" | "agendamento" | "whatsapp" | "usuarios";

const ALL_TABS: { id: TabId; label: string; icon: typeof TrendingUp; roles: ("admin" | "agendamento")[] }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp, roles: ["admin"] },
  { id: "relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin"] },
  { id: "catalogo", label: "Hotéis & Atividades", icon: Building2, roles: ["admin"] },
  { id: "vendas", label: "Vendas & Vouchers", icon: Ticket, roles: ["admin", "agendamento"] },
  { id: "agendamento", label: "Sala de Agendamento", icon: CalendarCheck, roles: ["admin", "agendamento"] },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, roles: ["admin", "agendamento"] },
  { id: "usuarios", label: "Usuários", icon: Users, roles: ["admin"] },
];

export function AdminApp({ user }: { user: AdminUser }) {
  const tabs = ALL_TABS.filter((t) => t.roles.includes(user.role));
  // Sala de Agendamento abre direto na fila de aprovação.
  const [tab, setTab] = useState<TabId>(user.role === "agendamento" ? "agendamento" : "dashboard");

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
      {tab === "relatorios" && <RelatoriosTab />}
      {tab === "catalogo" && <CatalogTab />}
      {tab === "vendas" && <VendasTab />}
      {tab === "agendamento" && <AgendamentoTab user={user} />}
      {tab === "whatsapp" && <WhatsappTab user={user} />}
      {tab === "usuarios" && <UsuariosTab me={user} />}
    </div>
  );
}
