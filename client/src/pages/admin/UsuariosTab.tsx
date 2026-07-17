import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Trash2, UserPlus } from "lucide-react";
import { listHotelsAdmin } from "../../api/hotels";
import { createUser, deleteUser, listUsers } from "../../api/users";
import { Field } from "../../components/Field";
import { ApiError } from "../../api/client";
import type { AdminRole, AdminUser } from "../../types";

export function UsuariosTab({ me }: { me: AdminUser }) {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("agendamento");
  const [hotelId, setHotelId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createUser({ name, email, password, role, hotelId: role === "agendamento" ? hotelId : null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setName(""); setEmail(""); setPassword(""); setHotelId(""); setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Não foi possível criar o usuário"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const hotelName = (id: string | null) => hotels.find((h) => h.id === id)?.name ?? "—";
  const valid = name.trim() && email.trim() && password.length >= 6 && (role === "admin" || hotelId);

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
      <div className="rounded-lg p-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--forest)" }}>
          <UserPlus size={16} /> Novo usuário
        </div>
        <div className="space-y-3">
          <Field label="Nome" value={name} onChange={setName} placeholder="Ex: Sala Campo dos Sonhos" />
          <Field label="Email (login)" value={email} onChange={setEmail} placeholder="sala.campo@redesonhos.com.br" />
          <Field label="Senha (mín. 6 caracteres)" value={password} onChange={setPassword} placeholder="••••••" />
          <div>
            <label className="text-xs font-medium opacity-70 block mb-1">Perfil</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            >
              <option value="agendamento">Sala de Agendamento (aprova reservas do seu hotel)</option>
              <option value="admin">Administrador (acesso total)</option>
            </select>
          </div>
          {role === "agendamento" && (
            <div>
              <label className="text-xs font-medium opacity-70 block mb-1">Hotel da sala</label>
              <select
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
                style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
              >
                <option value="">Selecione o hotel…</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          <button
            onClick={() => createMutation.mutate()}
            disabled={!valid || createMutation.isPending}
            className="w-full rounded-md py-2 text-sm"
            style={{ background: valid ? "var(--forest)" : "#ccc", color: "var(--paper)" }}
          >
            {createMutation.isPending ? "Criando…" : "Criar usuário"}
          </button>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div className="text-sm font-medium mb-3" style={{ color: "var(--forest)" }}>Usuários ({users.length})</div>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-md p-3 flex items-center justify-between gap-2" style={{ background: "var(--cream)" }}>
              <div>
                <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--forest)" }}>
                  {u.role === "admin" && <Shield size={13} color="var(--gold)" />}
                  {u.name} {u.id === me.id && <span className="text-xs opacity-50">(você)</span>}
                </div>
                <div className="text-xs opacity-60">
                  {u.email} · {u.role === "admin" ? "Administrador" : `Sala de Agendamento — ${hotelName(u.hotelId)}`}
                </div>
              </div>
              {u.id !== me.id && (
                <button
                  onClick={() => { if (confirm(`Excluir o usuário ${u.name}?`)) deleteMutation.mutate(u.id); }}
                  className="p-1.5 rounded-md"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <Trash2 size={13} color="var(--danger)" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
