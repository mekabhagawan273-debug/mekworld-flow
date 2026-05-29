import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import {
  Users, Inbox, Fish, Snowflake, Truck, AlertTriangle, ClipboardList,
  PackageOpen, DoorOpen, UserPlus, Boxes, ShieldCheck, ArrowUpRight, Anchor,
} from "lucide-react";
import { format, startOfDay, startOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Dashboard · MekWorld Marines ERP" }] }),
  component: Dashboard,
});

async function fetchStats() {
  const todayIso = startOfDay(new Date()).toISOString();
  const monthIso = startOfMonth(new Date()).toISOString();
  const tables = [
    ["visitors", "check_in"],
    ["shrimp_intake", "created_at"],
    ["processing_batches", "created_at"],
    ["incidents", "created_at"],
  ] as const;
  const out: Record<string, { today: number; month: number }> = {};
  for (const [t, col] of tables) {
    const [{ count: today }, { count: month }] = await Promise.all([
      supabase.from(t).select("*", { count: "exact", head: true }).gte(col, todayIso),
      supabase.from(t).select("*", { count: "exact", head: true }).gte(col, monthIso),
    ]);
    out[t] = { today: today ?? 0, month: month ?? 0 };
  }
  // species chart
  const { data: species } = await supabase.from("shrimp_intake")
    .select("species, quantity_kg").gte("created_at", monthIso);
  const speciesAgg: Record<string, number> = {};
  (species ?? []).forEach((r: any) => {
    speciesAgg[r.species] = (speciesAgg[r.species] ?? 0) + Number(r.quantity_kg);
  });
  return { counts: out, species: Object.entries(speciesAgg).map(([name, value]) => ({ name, value })) };
}

const SPECIES_COLORS = ["oklch(0.72_0.13_195)", "oklch(0.55_0.13_230)", "oklch(0.68_0.15_155)"];

function Dashboard() {
  const { data } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });
  const c = data?.counts ?? {};
  const g = (k: string, kind: "today" | "month") => (c as any)[k]?.[kind] ?? 0;

  const stats = (kind: "today" | "month") => [
    { label: "Visitors", value: g("visitors", kind), icon: Users, color: "teal" as const },
    { label: "RM Inward", value: 0, icon: Inbox, color: "info" as const },
    { label: "RM Outward", value: 0, icon: ArrowUpRight, color: "ocean" as const },
    { label: "GM Inward", value: 0, icon: Boxes, color: "purple" as const },
    { label: "GM (NR)", value: 0, icon: PackageOpen, color: "warning" as const },
    { label: "GM (R)", value: 0, icon: PackageOpen, color: "success" as const },
    { label: "CM Inward", value: 0, icon: Boxes, color: "teal" as const },
    { label: "Shrimp Intake", value: g("shrimp_intake", kind), icon: Fish, color: "ocean" as const },
    { label: "Production Batches", value: g("processing_batches", kind), icon: ClipboardList, color: "info" as const },
    { label: "Shipments", value: 0, icon: Truck, color: "navy" as const },
    { label: "Incidents", value: g("incidents", kind), icon: AlertTriangle, color: "destructive" as const },
    { label: "Gatepass", value: 0, icon: DoorOpen, color: "warning" as const },
    { label: "Outpass", value: 0, icon: DoorOpen, color: "purple" as const },
    { label: "New Joining", value: 0, icon: UserPlus, color: "success" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card className="p-6 bg-gradient-to-r from-navy via-navy to-[oklch(0.24_0.06_240)] text-navy-foreground border-0 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-teal/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal text-teal-foreground grid place-items-center shadow-lg">
              <Anchor className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MEKWORLD MARINES ERP</h1>
              <p className="text-navy-foreground/70 text-sm">Marine Processing & Exports Management System</p>
            </div>
          </div>
          <div className="md:text-right">
            <div className="text-xs text-navy-foreground/60 uppercase tracking-widest">{format(new Date(), "EEEE")}</div>
            <div className="text-xl font-semibold">{format(new Date(), "dd MMMM yyyy")}</div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild className="bg-teal text-teal-foreground hover:bg-teal/90"><Link to="/security/visitors"><Users className="w-4 h-4 mr-2" />Add Visitor</Link></Button>
        <Button asChild variant="outline"><Link to="/shrimp/batches"><ClipboardList className="w-4 h-4 mr-2" />New Batch</Link></Button>
        <Button asChild variant="outline"><Link to="/security/visitors"><DoorOpen className="w-4 h-4 mr-2" />Issue Gatepass</Link></Button>
      </div>

      {/* Today's */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-teal rounded-full" />
          <h2 className="text-lg font-semibold">Today's Activities</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stats("today").map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* Month */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-ocean rounded-full" />
          <h2 className="text-lg font-semibold">Month Activities</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stats("month").map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Monthly Processing Yield</h3>
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[
              { d: "Wk 1", yield: 72 }, { d: "Wk 2", yield: 78 },
              { d: "Wk 3", yield: 81 }, { d: "Wk 4", yield: 76 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="d" stroke="currentColor" opacity={0.6} fontSize={12} />
              <YAxis stroke="currentColor" opacity={0.6} fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="yield" fill="oklch(0.72 0.13 195)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Species Intake (this month)</h3>
          {(data?.species ?? []).length === 0 ? (
            <div className="h-[220px] grid place-items-center text-sm text-muted-foreground">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.species ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {(data?.species ?? []).map((_, i) => <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
