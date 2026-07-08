import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, Download, FileText, Sparkles, TrendingUp, Users } from "lucide-react";
import { listHotelsAdmin } from "../../api/hotels";
import { getAnalyticsSummary, getAnalyticsCustomers, type AnalyticsFilters } from "../../api/analytics";
import { StatCard } from "../../components/StatCard";
import { CATEGORY_META, CATEGORY_ORDER } from "../../lib/constants";
import { formatBRL } from "../../lib/format";
import { downloadCSV } from "../../lib/export";

export function RelatoriosTab() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hotelId, setHotelId] = useState("all");
  const [category, setCategory] = useState("all");

  const filters: AnalyticsFilters = { from, to, hotelId, category };

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels-admin"], queryFn: listHotelsAdmin });
  const { data: summary } = useQuery({
    queryKey: ["analytics-summary", from, to, hotelId, category],
    queryFn: () => getAnalyticsSummary(filters),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["analytics-customers", from, to, hotelId, category],
    queryFn: () => getAnalyticsCustomers(filters),
  });

  const periodoLabel = from || to ? `${from || "início"} até ${to || "hoje"}` : "todo o período";

  function exportCustomersCSV() {
    downloadCSV(
      "clientes-rede-dos-sonhos.csv",
      ["Nome", "WhatsApp", "E-mail", "Reservas", "Participantes", "Total gasto (R$)", "Hotéis", "Última reserva"],
      customers.map((c) => [
        c.name, c.phone, c.email ?? "", c.bookings, c.participants,
        c.totalSpent.toFixed(2).replace(".", ","), c.hotels,
        new Date(c.lastBooking).toLocaleDateString("pt-BR"),
      ])
    );
  }

  const byHotelChart = (summary?.byHotel ?? []).map((h) => ({
    name: h.name.replace("Hotel Fazenda ", "").replace(" dos Sonhos", ""),
    faturamento: h.revenue,
  }));

  return (
    <div>
      {/* filtros — ocultos na impressão */}
      <div className="no-print flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="text-xs opacity-70 block mb-1">De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)", background: "var(--paper)" }} />
        </div>
        <div>
          <label className="text-xs opacity-70 block mb-1">Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)", background: "var(--paper)" }} />
        </div>
        <div>
          <label className="text-xs opacity-70 block mb-1">Hotel</label>
          <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
            <option value="all">Todos os hotéis</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs opacity-70 block mb-1">Categoria</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md px-2 py-1.5 text-sm" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
            <option value="all">Todas as categorias</option>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
          </select>
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm" style={{ background: "var(--forest)", color: "var(--paper)" }}>
            <FileText size={14} /> Exportar PDF
          </button>
          <button onClick={exportCustomersCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm" style={{ border: "1px solid var(--line)" }}>
            <Download size={14} /> Clientes (Excel)
          </button>
        </div>
      </div>

      {/* área do relatório (impressa) */}
      <div className="print-area">
        <div className="hidden print:block mb-4">
          <img src="/logo.webp" alt="Rede dos Sonhos" style={{ height: 48 }} />
          <div className="text-lg rs-display" style={{ color: "var(--forest)" }}>Relatório de Atividades — {periodoLabel}</div>
        </div>

        {summary && (
          <>
            <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))" }}>
              <StatCard label="Reservas" value={summary.totals.bookings} icon={Calendar} color="var(--moss)" />
              <StatCard label="Faturamento" value={formatBRL(summary.totals.revenue)} icon={TrendingUp} color="var(--gold)" />
              <StatCard label="Participantes" value={`${summary.totals.participants} (${summary.totals.adults}A/${summary.totals.children}C)`} icon={Users} color="var(--forest)" />
              <StatCard label="Vouchers usados / a usar" value={`${summary.totals.used} / ${summary.totals.pending}`} icon={Sparkles} color="var(--clay)" />
            </div>

            <Panel title="Faturamento por hotel">
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={byHotelChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                    <Bar dataKey="faturamento" fill="var(--moss)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <SimpleTable
                headers={["Hotel", "Reservas", "Faturamento"]}
                rows={summary.byHotel.map((h) => [h.name, String(h.bookings), formatBRL(h.revenue)])}
              />
            </Panel>

            <Panel title="Por categoria">
              <SimpleTable
                headers={["Categoria", "Reservas", "Participantes", "Faturamento"]}
                rows={summary.byCategory.map((c) => [
                  CATEGORY_META[c.category]?.label ?? c.category, String(c.bookings), String(c.participants), formatBRL(c.revenue),
                ])}
              />
            </Panel>

            {summary.passaporteCross.length > 0 && (
              <Panel title="Passaporte dos Sonhos — uso entre hotéis">
                <p className="text-xs opacity-60 mb-2">Hóspede de um hotel usando atividades de outro (benefício do Passaporte).</p>
                <SimpleTable
                  headers={["Hospedado em", "Atividade em", "Reservas", "Participantes"]}
                  rows={summary.passaporteCross.map((p) => [p.guestHotel, p.activityHotel, String(p.bookings), String(p.participants)])}
                />
              </Panel>
            )}

            <Panel title="Atividades mais procuradas">
              <SimpleTable
                headers={["Atividade", "Hotel", "Reservas", "Participantes", "Faturamento"]}
                rows={summary.topActivities.map((a) => [a.activityName, a.hotelName, String(a.bookings), String(a.participants), formatBRL(a.revenue)])}
              />
            </Panel>
          </>
        )}

        <Panel title={`Base de clientes (${customers.length})`}>
          <SimpleTable
            headers={["Nome", "WhatsApp", "E-mail", "Reservas", "Total", "Hotéis"]}
            rows={customers.map((c) => [c.name, c.phone, c.email ?? "—", String(c.bookings), formatBRL(c.totalSpent), c.hotels])}
          />
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg p-4 mb-5" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
      <div className="text-sm font-medium mb-3" style={{ color: "var(--forest)" }}>{title}</div>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left" style={{ padding: "6px 8px", borderBottom: "2px solid var(--line)", color: "var(--forest)", fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: "6px 8px", borderBottom: "1px solid var(--line)", opacity: 0.9 }}>{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ padding: "10px 8px", opacity: 0.5 }}>Sem dados no período.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
