import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { listWhatsappLog } from "../../api/dashboard";

export function WhatsappTab() {
  const { data: log = [] } = useQuery({ queryKey: ["whatsapp-log"], queryFn: listWhatsappLog });
  const sorted = [...log].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div>
      <div className="rounded-lg p-3 mb-4 flex items-start gap-2" style={{ background: "var(--gold-light)", border: "1px solid var(--gold)" }}>
        <AlertTriangle size={16} color="var(--gold)" style={{ marginTop: 2 }} />
        <p className="text-xs" style={{ color: "var(--bark)" }}>
          Este é o registro simulado das mensagens que seriam enviadas. Em produção, cada linha abaixo corresponde a uma chamada
          real para a API oficial do WhatsApp Business (Cloud API da Meta) para o número da recepção do hotel correspondente.
        </p>
      </div>
      <div className="space-y-2">
        {sorted.map((w) => (
          <div key={w.id} className="rounded-lg p-3" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--forest)" }}>Para: {w.hotel_name} ({w.to_number})</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--moss-light)", color: "var(--moss)" }}>{w.status}</span>
            </div>
            <pre className="text-xs whitespace-pre-wrap" style={{ fontFamily: "inherit", color: "var(--bark)" }}>{w.message}</pre>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-sm opacity-60">Nenhuma mensagem enviada ainda.</p>}
      </div>
    </div>
  );
}
