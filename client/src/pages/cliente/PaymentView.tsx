import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import { BackRow } from "../../components/BackRow";
import { PixQrPlaceholder } from "../../components/PixQrPlaceholder";
import { formatBRL } from "../../lib/format";

export function PaymentView({
  total,
  pixCode,
  onBack,
  onConfirm,
}: {
  total: number;
  pixCode: string;
  onBack: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível confirmar o pagamento");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div>
      <BackRow label="Pagamento via Pix" onBack={onBack} />
      <div className="rounded-lg p-6 max-w-md flex flex-col items-center text-center" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <p className="text-sm opacity-70 mb-3">Escaneie o QR Code ou copie o código Pix abaixo</p>
        <PixQrPlaceholder />
        <p className="text-xs opacity-50 mt-2">(QR de demonstração — a integração real gera este código via API do Mercado Pago)</p>
        <div className="text-2xl font-semibold mt-4" style={{ color: "var(--forest)" }}>{formatBRL(total)}</div>
        <div
          className="w-full mt-4 rounded-md px-3 py-2 text-xs break-all"
          style={{ background: "var(--cream)", fontFamily: "monospace", border: "1px solid var(--line)" }}
        >
          {pixCode}
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText(pixCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 rounded-md"
          style={{ border: "1px solid var(--line)" }}
        >
          <Copy size={13} /> {copied ? "Copiado!" : "Copiar código Pix"}
        </button>

        <div className="w-full mt-5 pt-4" style={{ borderTop: "1px dashed var(--line)" }}>
          <p className="text-xs opacity-60 mb-2">Ambiente de demonstração — em produção, a confirmação chega automaticamente via webhook do banco.</p>
          {error && <p className="text-xs mb-2" style={{ color: "var(--danger)" }}>{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full rounded-md py-2.5 text-sm flex items-center justify-center gap-2"
            style={{ background: "var(--moss)", color: "#fff" }}
          >
            <CheckCircle2 size={16} /> {confirming ? "Confirmando…" : "Simular pagamento aprovado"}
          </button>
        </div>
      </div>
    </div>
  );
}
