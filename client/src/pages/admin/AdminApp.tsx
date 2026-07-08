import { useState } from "react";
import { Building2, MessageCircle, Ticket, TrendingUp } from "lucide-react";
import { DashboardTab } from "./DashboardTab";
import { CatalogTab } from "./CatalogTab";
import { VendasTab } from "./VendasTab";
import { WhatsappTab } from "./WhatsappTab";

type TabId = "dashboard" | "catalogo" | "vendas" | "whatsapp";

const TABS: { id: TabId; label: string; icon: typeof TrendingUp }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "catalogo", label: "Hotéis & Atividades", icon: Building2 },
  { id: "vendas", label: "Vendas & Vouchers", icon: Ticket },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

export function AdminApp() {
  const [tab, setTab] = useState<TabId>("dashboard");

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
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
      {tab === "catalogo" && <CatalogTab />}
      {tab === "vendas" && <VendasTab />}
      {tab === "whatsapp" && <WhatsappTab />}
    </div>
  );
}
