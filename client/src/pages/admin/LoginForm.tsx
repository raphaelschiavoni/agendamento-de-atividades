import { useState } from "react";
import { Lock } from "lucide-react";
import * as authApi from "../../api/auth";
import { ApiError } from "../../api/client";

export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setErr(null);
    try {
      await authApi.login(email, password);
      onLoggedIn();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center p-10">
      <div style={{ background: "var(--paper)", border: "1px solid var(--line)" }} className="rounded-lg p-8 w-full max-w-sm text-center">
        <Lock size={28} color="var(--forest)" className="mx-auto mb-3" />
        <h3 style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-lg mb-1">Acesso restrito</h3>
        <p style={{ color: "var(--bark)" }} className="text-sm mb-4 opacity-80">
          Entre com seu email e senha de administrador para gerenciar hotéis, atividades e vendas.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(null); }}
          placeholder="Email"
          className="w-full text-sm rounded-md px-3 py-2 mb-2"
          style={{ border: "1px solid var(--line)" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErr(null); }}
          placeholder="Senha"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full text-sm rounded-md px-3 py-2 mb-2"
          style={{ border: "1px solid var(--line)" }}
        />
        {err && <p style={{ color: "var(--danger)" }} className="text-xs mb-2">{err}</p>}
        <button
          onClick={submit}
          disabled={loading || !email || !password}
          className="w-full rounded-md py-2 text-sm"
          style={{ background: "var(--forest)", color: "var(--paper)" }}
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
