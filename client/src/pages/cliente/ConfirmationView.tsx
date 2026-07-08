import { CheckCircle2, Ticket } from "lucide-react";
import { CATEGORY_META } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import type { Booking } from "../../types";

export function ConfirmationView({ vouchers, onNewOrder }: { vouchers: Booking[]; onNewOrder: () => void }) {
  return (
    <div>
      <div className="print-area">
        <img src="/logo.webp" alt="Hotéis Fazenda Rede dos Sonhos" style={{ height: 56, marginBottom: 16 }} />
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={24} color="var(--moss)" />
          <h2 style={{ fontFamily: "Georgia, serif", color: "var(--forest)" }} className="text-xl">Pagamento confirmado!</h2>
        </div>
        <p className="text-sm opacity-70 mb-4">
          Seu voucher foi liberado automaticamente e a recepção já foi avisada por WhatsApp. Apresente o código abaixo na chegada.
        </p>
        <div className="space-y-3">
          {vouchers.map((v) => (
            <div key={v.id} className="rounded-lg p-4 flex items-center gap-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
              <Ticket size={28} color={CATEGORY_META[v.category].color} />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: "var(--forest)" }}>{v.activityName} — {v.hotelName}</div>
                <div className="text-xs opacity-60">{v.date} às {v.time} · {v.qty} pessoa(s) · {CATEGORY_META[v.category].label}</div>
                <div className="text-sm mt-1 font-mono tracking-wider" style={{ color: "var(--gold)" }}>{v.voucherCode}</div>
              </div>
              <span className="text-sm font-medium">{formatBRL(v.total)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="no-print">
        <button
          onClick={() => window.print()}
          className="mt-4 mr-2 px-4 py-2 rounded-md text-sm"
          style={{ border: "1px solid var(--line)" }}
        >
          Imprimir voucher
        </button>
        <button
          onClick={onNewOrder}
          className="mt-4 px-4 py-2 rounded-md text-sm"
          style={{ background: "var(--forest)", color: "var(--paper)" }}
        >
          Fazer nova reserva
        </button>
      </div>
    </div>
  );
}
