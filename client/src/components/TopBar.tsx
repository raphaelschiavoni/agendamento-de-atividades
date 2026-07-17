import { Home, LogOut, Moon, Sun } from "lucide-react";

type View = "cliente" | "admin";

export function TopBar({
  view,
  setView,
  isAdminLoggedIn,
  onLogout,
  onHome,
  theme,
  onToggleTheme,
}: {
  view: View;
  setView: (v: View) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
  onHome: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <div
      style={{ background: "var(--paper)", borderBottom: "1px solid var(--line)" }}
      className="no-print px-5 py-3 flex items-center justify-between flex-wrap gap-3"
    >
      <button onClick={onHome} title="Página inicial" aria-label="Ir para a página inicial" style={{ display: "block" }}>
        <img src="/logo.webp" alt="Hotéis Fazenda Rede dos Sonhos" style={{ height: 44, display: "block", cursor: "pointer" }} />
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          title={theme === "light" ? "Modo escuro" : "Modo claro"}
          aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
          className="flex items-center p-2 rounded-md"
          style={{ color: "var(--forest)", border: "1px solid var(--line)" }}
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
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
