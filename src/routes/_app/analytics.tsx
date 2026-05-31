import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Fish, DollarSign, Waves, ClipboardList, Percent, Users, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { startOfMonth, subMonths, format } from "date-fns";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Executive Analytics · MekWorld Marines ERP" }] }),
  component: Analytics,
});

const COLORS = ["oklch(0.72 0.13 195)", "oklch(0.55 0.13 230)", "oklch(0.68 0.15 155)", "oklch(0.8 0.16 80)", "oklch(0.6 0.18 25)"];

function Analytics() {
  const { isAdmin, hasRole } = useAuth();
  if (!isAdmin && !hasRole("super_admin")) {
    return <Card className="p-10 text-center"><div className="font-semibold mb-1">Restricted</div><div className="text-sm text-muted-foreground">Executive Analytics is available to Super Admins only.</div></Card>;
  }
  const monthStart = startOfMonth(new Date()).toISOString();
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1)).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const q = (name: string, fn: () => Promise<any>) => useQuery({ queryKey: [name], queryFn: fn });
  const batches = q("a-batches", async () => (await supabase.from("processing_batches").select("output_weight_kg, input_weight_kg, yield_pct, created_at").gte("created_at", subMonths(new Date(), 6).toISOString())).data ?? []);
  const intake = q("a-intake", async () => (await supabase.from("shrimp_intake").select("species, quantity_kg, created_at").gte("created_at", monthStart)).data ?? []);
  const shipments = q("a-shipments", async () => (await supabase.from("shipments").select("invoice_value, customer_id, customers(name), created_at").gte("created_at", lastMonthStart)).data ?? []);
  const ponds = q("a-ponds", async () => (await (supabase.from as any)("ponds").select("id, name, status").eq("status", "active")).data ?? []);
  const harvests = q("a-harvests", async () => (await (supabase.from as any)("pond_harvests").select("pond_id, total_weight_kg, harvest_date").gte("harvest_date", monthStart.slice(0, 10))).data ?? []);
  const attendance = q("a-att", async () => (await supabase.from("attendance").select("id").eq("attendance_date", today)).data ?? []);

  const thisMonthBatches = (batches.data ?? []).filter((b: any) => b.created_at >= monthStart);
  const lastMonthBatches = (batches.data ?? []).filter((b: any) => b.created_at >= lastMonthStart && b.created_at < monthStart);
  const thisMonthShip = (shipments.data ?? []).filter((s: any) => s.created_at >= monthStart);
  const lastMonthShip = (shipments.data ?? []).filter((s: any) => s.created_at >= lastMonthStart && s.created_at < monthStart);

  const sumOutput = (arr: any[]) => arr.reduce((s, b) => s + Number(b.output_weight_kg || 0), 0);
  const sumShip = (arr: any[]) => arr.reduce((s, x) => s + Number(x.invoice_value || 0), 0);
  const avgYield = (arr: any[]) => arr.length === 0 ? 0 : +(arr.reduce((s, b) => s + Number(b.yield_pct || 0), 0) / arr.length).toFixed(1);

  const tm = sumOutput(thisMonthBatches), lm = sumOutput(lastMonthBatches);
  const tmShip = sumShip(thisMonthShip), lmShip = sumShip(lastMonthShip);
  const tmYield = avgYield(thisMonthBatches), lmYield = avgYield(lastMonthBatches);

  // Monthly trend (6 months)
  const months: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const s = startOfMonth(subMonths(new Date(), i));
    const e = startOfMonth(subMonths(new Date(), i - 1));
    const inM = (batches.data ?? []).filter((b: any) => new Date(b.created_at) >= s && new Date(b.created_at) < e);
    months.push({ m: format(s, "MMM"), kg: sumOutput(inM) });
  }

  // Species
  const speciesAgg: Record<string, number> = {};
  (intake.data ?? []).forEach((r: any) => { speciesAgg[r.species] = (speciesAgg[r.species] ?? 0) + Number(r.quantity_kg); });
  const speciesData = Object.entries(speciesAgg).map(([name, value]) => ({ name, value }));

  // Top buyers
  const buyerAgg: Record<string, number> = {};
  thisMonthShip.forEach((s: any) => { const n = s.customers?.name ?? "Unknown"; buyerAgg[n] = (buyerAgg[n] ?? 0) + Number(s.invoice_value || 0); });
  const topBuyers = Object.entries(buyerAgg).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Pond harvests
  const pondAgg: Record<string, number> = {};
  (harvests.data ?? []).forEach((h: any) => { pondAgg[h.pond_id] = (pondAgg[h.pond_id] ?? 0) + Number(h.total_weight_kg || 0); });
  const pondData = Object.entries(pondAgg).map(([pid, value]) => ({ name: (ponds.data ?? []).find((p: any) => p.id === pid)?.name ?? pid.slice(0, 6), value }));

  const change = (a: number, b: number) => b === 0 ? "—" : `${(((a - b) / b) * 100).toFixed(1)}%`;
  const compRows = [
    ["Total Processed (kg)", tm, lm],
    ["Export Value (USD)", tmShip, lmShip],
    ["Avg Yield %", tmYield, lmYield],
    ["Batches", thisMonthBatches.length, lastMonthBatches.length],
  ];

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("MekWorld Marines — Executive Report", 14, 18);
    doc.setFontSize(10); doc.text(format(new Date(), "dd MMM yyyy"), 14, 25);
    let y = 36;
    [["Total Processed This Month", `${tm.toLocaleString()} kg`],
     ["Total Export Value", `$${tmShip.toLocaleString()}`],
     ["Active Ponds", `${(ponds.data ?? []).length}`],
     ["Production Batches", `${thisMonthBatches.length}`],
     ["Average Yield %", `${tmYield}%`],
     ["Workforce Today", `${(attendance.data ?? []).length}`]].forEach(([k, v]) => { doc.text(`${k}: ${v}`, 14, y); y += 8; });
    y += 4; doc.setFontSize(12); doc.text("Month vs Last Month", 14, y); y += 6;
    doc.setFontSize(10);
    compRows.forEach(([k, a, b]) => { doc.text(`${k}: ${a} (prev ${b}, ${change(Number(a), Number(b))})`, 14, y); y += 7; });
    doc.save(`executive-report-${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div>
      <PageHeader title="Executive Analytics" subtitle="Cross-functional KPIs and trends"
        actions={<Button onClick={exportPdf} className="bg-navy text-navy-foreground hover:bg-navy-hover"><Download className="w-4 h-4 mr-2" />Export Report</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Processed (kg)" value={tm.toLocaleString()} icon={Fish} color="teal" />
        <StatCard label="Export (USD)" value={`$${tmShip.toLocaleString()}`} icon={DollarSign} color="success" />
        <StatCard label="Active Ponds" value={(ponds.data ?? []).length} icon={Waves} color="info" />
        <StatCard label="Batches" value={thisMonthBatches.length} icon={ClipboardList} color="ocean" />
        <StatCard label="Avg Yield" value={`${tmYield}%`} icon={Percent} color="warning" />
        <StatCard label="Workforce" value={(attendance.data ?? []).length} icon={Users} color="navy" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card className="p-5"><h3 className="font-semibold mb-3">Monthly Production Trend (6 mo)</h3>
          <ResponsiveContainer width="100%" height={220}><LineChart data={months}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="m" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
            <Line type="monotone" dataKey="kg" stroke="oklch(0.72 0.13 195)" strokeWidth={2} />
          </LineChart></ResponsiveContainer>
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-3">Pond Harvest (this month)</h3>
          {pondData.length === 0 ? <div className="h-48 grid place-items-center text-sm text-muted-foreground">No harvests</div>
            : <ResponsiveContainer width="100%" height={220}><BarChart data={pondData}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="value" fill="oklch(0.68 0.15 155)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>}
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-3">Species Processing</h3>
          {speciesData.length === 0 ? <div className="h-48 grid place-items-center text-sm text-muted-foreground">No data</div>
            : <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={speciesData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>{speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}
        </Card>
        <Card className="p-5"><h3 className="font-semibold mb-3">Top Buyers (this month)</h3>
          {topBuyers.length === 0 ? <div className="h-48 grid place-items-center text-sm text-muted-foreground">No shipments</div>
            : <ResponsiveContainer width="100%" height={220}><BarChart data={topBuyers} layout="vertical"><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} width={100} /><Tooltip /><Bar dataKey="value" fill="oklch(0.55 0.13 230)" /></BarChart></ResponsiveContainer>}
        </Card>
      </div>

      <Card>
        <div className="p-4 font-semibold border-b">This Month vs Last Month</div>
        <table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Metric</th><th className="p-2 text-right">This Month</th><th className="p-2 text-right">Last Month</th><th className="p-2 text-right">Change</th></tr></thead>
          <tbody>{compRows.map(([k, a, b], i) => <tr key={i} className="border-t"><td className="p-2">{k}</td><td className="p-2 text-right font-semibold">{typeof a === "number" ? a.toLocaleString() : a}</td><td className="p-2 text-right">{typeof b === "number" ? b.toLocaleString() : b}</td><td className="p-2 text-right">{change(Number(a), Number(b))}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
