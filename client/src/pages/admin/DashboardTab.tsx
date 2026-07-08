import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calendar, ClipboardCheck, Ticket, TrendingUp } from "lucide-react";
import { getDashboardSummary } from "../../api/dashboard";
import { StatCard } from "../../components/StatCard";
import { formatBRL } from "../../lib/format";

export function DashboardTab() {
  const { data } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  if (!data) return null;

  const byHotel = data.byHotel.map((h) => ({ name: h.name.replace("Hotel Fazenda ", ""), faturamento: h.revenue }));

  return (
    <div>
      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))" }}>
        <StatCard label="Reservas hoje" value={data.todayBookingsCount} icon={Calendar} color="var(--moss)" />
        <StatCard label="Faturamento hoje" value={formatBRL(data.todayRevenue)} icon={TrendingUp} color="var(--gold)" />
        <StatCard label="Faturamento total" value={formatBRL(data.totalRevenue)} icon={ClipboardCheck} color="var(--forest)" />
        <StatCard label="Vouchers a utilizar" value={data.pendingVouchers} icon={Ticket} color="var(--clay)" />
      </div>
      <div className="rounded-lg p-4" style={{ background: "var(--paper)", border: "1px solid var(--line)" }}>
        <div className="text-sm font-medium mb-3" style={{ color: "var(--forest)" }}>Faturamento por hotel</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={byHotel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="faturamento" fill="var(--moss)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
