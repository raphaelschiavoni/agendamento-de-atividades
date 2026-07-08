import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "./components/TopBar";
import { ClienteApp } from "./pages/cliente/ClienteApp";
import { AdminApp } from "./pages/admin/AdminApp";
import { LoginForm } from "./pages/admin/LoginForm";
import * as authApi from "./api/auth";

type View = "cliente" | "admin";

export default function App() {
  const [view, setView] = useState<View>("cliente");
  const queryClient = useQueryClient();

  const { data: adminUser, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authApi.me,
    retry: false,
  });

  async function handleLogout() {
    await authApi.logout();
    queryClient.setQueryData(["auth-me"], null);
  }

  return (
    <div className="app-shell" style={{ background: "var(--cream)", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <TopBar view={view} setView={setView} isAdminLoggedIn={!!adminUser} onLogout={handleLogout} />
      {view === "cliente" ? (
        <ClienteApp />
      ) : isLoading ? null : adminUser ? (
        <AdminApp />
      ) : (
        <LoginForm onLoggedIn={() => queryClient.invalidateQueries({ queryKey: ["auth-me"] })} />
      )}
    </div>
  );
}
