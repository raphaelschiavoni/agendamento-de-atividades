import { Home, LogOut, Settings } from "lucide-react";

type View = "cliente" | "admin";

export function TopBar({
  view,
  setView,
  isAdminLoggedIn,
  onLogout,
}: {
  view: View;
  setView: (v: View) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}) {
  return (
    <div
      style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)" }}
      className="no-print px-5 py-3 flex items-center justify-between flex-wrap gap-3"
    >
      <img src="/logo.webp" alt="Hotéis Fazenda Rede dos Sonhos" style={{ height: 44, display: "block" }} />
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("cliente")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
          style={{
            background: view === "cliente" ? "var(--forest)" : "transparent",
            color: view === "cliente" ? "var(--paper)" : "var(--forest)",
            border: "1px solid " + (view === "cliente" ? "var(--forest)" : "var(--line)"),
          }}
        >
          <Home size={14} /> Área do Cliente
        </button>
        <button
          onClick={() => setView("admin")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
          style={{
            background: view === "admin" ? "var(--forest)" : "transparent",
            color: view === "admin" ? "var(--paper)" : "var(--forest)",
            border: "1px solid " + (view === "admin" ? "var(--forest)" : "var(--line)"),
          }}
        >
          <Settings size={14} /> Painel Administrativo
        </button>
        {view === "admin" && isAdminLoggedIn && (
          <button
            onClick={onLogout}
            title="Sair do painel"
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm"
            style={{ color: "var(--forest)" }}
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
