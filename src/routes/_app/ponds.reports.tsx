import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { startOfMonth } from "date-fns";

export const Route = createFileRoute("/_app/ponds/reports")({
  head: () => ({ meta: [{ title: "Pond Reports · MekWorld Marines ERP" }] }),
  component: PondReports,
});

function PondReports() {
  const monthIso = startOfMonth(new Date()).toISOString().slice(0, 10);
  const { data: ponds = [] } = useQuery({ queryKey: ["ponds-all"], queryFn: async () => (await (supabase.from as any)("ponds").select("*")).data ?? [] });
  const { data: harvests = [] } = useQuery({ queryKey: ["pond-harvests-month"], queryFn: async () => (await (supabase.from as any)("pond_harvests").select("*").gte("harvest_date", monthIso)).data ?? [] });
  const { data: feed = [] } = useQuery({ queryKey: ["pond-feed-month"], queryFn: async () => (await (supabase.from as any)("pond_feed_log").select("*").gte("log_date", monthIso)).data ?? [] });
  const { data: mort = [] } = useQuery({ queryKey: ["pond-mort-month"], queryFn: async () => (await (supabase.from as any)("pond_mortality").select("*").gte("log_date", monthIso)).data ?? [] });

  const rows = ponds.map((p: any) => ({
    name: p.name, code: p.pond_code,
    harvest: harvests.filter((h: any) => h.pond_id === p.id).reduce((s: number, h: any) => s + Number(h.total_weight_kg || 0), 0),
    feed: feed.filter((f: any) => f.pond_id === p.id).reduce((s: number, f: any) => s + Number(f.quantity_kg || 0), 0),
    mort: mort.filter((m: any) => m.pond_id === p.id).reduce((s: number, m: any) => s + Number(m.estimated_count || 0), 0),
    fcr: p.fcr ?? "—",
  }));

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/ponds"><ArrowLeft className="w-4 h-4 mr-1" />Ponds</Link></Button>
      <PageHeader title="Pond Reports" subtitle="This month summary across all ponds" />
      <Card className="overflow-auto"><table className="w-full text-sm">
        <thead className="bg-muted"><tr><th className="p-2 text-left">Pond</th><th className="p-2 text-right">Harvest (kg)</th><th className="p-2 text-right">Feed (kg)</th><th className="p-2 text-right">Mortality</th><th className="p-2 text-right">FCR</th></tr></thead>
        <tbody>{rows.map((r: any, i: number) => <tr key={i} className="border-t"><td className="p-2"><span className="font-mono text-xs text-muted-foreground">{r.code}</span> {r.name}</td><td className="p-2 text-right">{r.harvest.toLocaleString()}</td><td className="p-2 text-right">{r.feed.toLocaleString()}</td><td className="p-2 text-right">{r.mort.toLocaleString()}</td><td className="p-2 text-right">{r.fcr}</td></tr>)}</tbody>
      </table></Card>
    </div>
  );
}
