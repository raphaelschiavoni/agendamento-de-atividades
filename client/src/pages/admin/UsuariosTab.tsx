import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Shield, Trash2, UserPlus, X } from "lucide-react";
import { listHotelsAdmin } from "../../api/hotels";
import { createUser, deleteUser, listUsers, updateUser } from "../../api/users";
import { Field } from "../../components/Field";
import { ApiError } from "../../api/client";
import type { AdminRole, AdminUser, Hotel } from "../../types";

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: "Administrador Master",
  hotel_admin: "Administrador do Hotel",
  agendamento: "Sala de Agendamento",
};

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

  // Master não fica preso a hotel; os demais papéis vinculam-se a um hotel.
  const needsHotel = role !== "admin";
  const createMutation = useMutation({
    mutationFn: () => createUser({ name, email, password, role, hotelId: needsHotel ? (hotelId || null) : null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setName(""); setEmail(""); setPassword(""); setHotelId(""); setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Não foi possível criar o usuário"),
  });

  // Admin de hotel exige um hotel selecionado; sala pode ficar "todos".
  const valid = Boolean(name.trim() && email.trim() && password.length >= 6 && (role !== "hotel_admin" || hotelId));

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
              <option value="hotel_admin">Administrador do Hotel (gerencia só o hotel dele)</option>
              <option value="admin">Administrador Master (rede inteira)</option>
            </select>
          </div>
          {needsHotel && (
            <div>
              <label className="text-xs font-medium opacity-70 block mb-1">Hotel deste acesso</label>
              <select
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
                style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
              >
                {/* Admin de hotel precisa escolher 1 hotel; sala pode ficar na rede inteira. */}
                <option value="">{role === "hotel_admin" ? "— escolha o hotel —" : "Todos os hotéis (rede inteira)"}</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>Somente {h.name}</option>)}
              </select>
              <p className="text-xs opacity-50 mt-1">
                {role === "hotel_admin"
                  ? "Edita atividades, vagas e relatórios apenas deste hotel. Não vê nem altera os outros hotéis."
                  : hotelId
                    ? "Verá e aprovará apenas as reservas deste hotel."
                    : "Verá e aprovará as reservas de todos os hotéis, com filtro por hotel."}
              </p>
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
            <UserRow key={u.id} user={u} me={me} hotels={hotels} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UserRow({ user, me, hotels }: { user: AdminUser; me: AdminUser; hotels: Hotel[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>(user.role);
  const [hotelId, setHotelId] = useState(user.hotelId ?? "");
  const [error, setError] = useState<string | null>(null);

  const hotelName = (id: string | null) => hotels.find((h) => h.id === id)?.name ?? "—";

  const reset = () => {
    setName(user.name); setEmail(user.email); setPassword("");
    setRole(user.role); setHotelId(user.hotelId ?? ""); setError(null);
  };

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: Partial<{ name: string; email: string; password: string; role: AdminRole; hotelId: string | null }> = {
        name: name.trim(),
        email: email.trim(),
        role,
        // Master nunca fica preso; admin de hotel/sala mandam o hotel (sala pode ir "todos" = null).
        hotelId: role === "admin" ? null : (hotelId || null),
      };
      if (password.trim()) payload.password = password.trim();
      return updateUser(user.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditing(false); setPassword(""); setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Não foi possível salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const needsHotel = role !== "admin";
  const validEdit = Boolean(
    name.trim() && email.trim() &&
    (password.trim() === "" || password.trim().length >= 6) &&
    (role !== "hotel_admin" || hotelId)
  );

  if (editing) {
    return (
      <div className="rounded-md p-3 space-y-2" style={{ background: "var(--cream)", border: "1px solid var(--forest)" }}>
        <Field label="Nome" value={name} onChange={setName} />
        <Field label="Email (login)" value={email} onChange={setEmail} />
        <Field label="Nova senha (deixe em branco para manter)" value={password} onChange={setPassword} placeholder="••••••" />
        <div>
          <label className="text-xs font-medium opacity-70 block mb-1">Perfil</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full rounded-md px-3 py-2 text-sm"
            style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
          >
            <option value="agendamento">Sala de Agendamento</option>
            <option value="hotel_admin">Administrador do Hotel</option>
            <option value="admin">Administrador Master</option>
          </select>
        </div>
        {needsHotel && (
          <div>
            <label className="text-xs font-medium opacity-70 block mb-1">Hotel deste acesso</label>
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            >
              <option value="">{role === "hotel_admin" ? "— escolha o hotel —" : "Todos os hotéis (rede inteira)"}</option>
              {hotels.map((h) => <option key={h.id} value={h.id}>Somente {h.name}</option>)}
            </select>
          </div>
        )}
        {user.id === me.id && role !== "admin" && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            Atenção: você está rebaixando o seu próprio acesso master — vai perder o acesso total à rede.
          </p>
        )}
        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={!validEdit || updateMutation.isPending}
            className="flex-1 rounded-md py-2 text-sm flex items-center justify-center gap-1.5"
            style={{ background: validEdit ? "var(--forest)" : "#ccc", color: "var(--paper)" }}
          >
            <Check size={14} /> {updateMutation.isPending ? "Salvando…" : "Salvar"}
          </button>
          <button
            onClick={() => { reset(); setEditing(false); }}
            className="rounded-md py-2 px-3 text-sm flex items-center gap-1.5"
            style={{ border: "1px solid var(--line)" }}
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md p-3 flex items-center justify-between gap-2" style={{ background: "var(--cream)" }}>
      <div>
        <div className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--forest)" }}>
          {user.role === "admin" && <Shield size={13} color="var(--gold)" />}
          {user.role === "hotel_admin" && <Shield size={13} color="var(--moss)" />}
          {user.name} {user.id === me.id && <span className="text-xs opacity-50">(você)</span>}
        </div>
        <div className="text-xs opacity-60">
          {user.email} · {
            user.role === "admin"
              ? ROLE_LABEL.admin
              : user.role === "hotel_admin"
                ? `${ROLE_LABEL.hotel_admin} — ${hotelName(user.hotelId)}`
                : `${ROLE_LABEL.agendamento} — ${user.hotelId ? hotelName(user.hotelId) : "Todos os hotéis"}`
          }
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => { reset(); setEditing(true); }}
          className="p-1.5 rounded-md"
          style={{ border: "1px solid var(--line)" }}
          title="Editar usuário"
        >
          <Pencil size={13} color="var(--forest)" />
        </button>
        {user.id !== me.id && (
          <button
            onClick={() => { if (confirm(`Excluir o usuário ${user.name}?`)) deleteMutation.mutate(); }}
            className="p-1.5 rounded-md"
            style={{ border: "1px solid var(--line)" }}
            title="Excluir usuário"
          >
            <Trash2 size={13} color="var(--danger)" />
          </button>
        )}
      </div>
    </div>
  );
}
