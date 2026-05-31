import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/temperature-log/compliance")({
  head: () => ({ meta: [{ title: "Temperature Compliance · MekWorld Marines ERP" }] }),
  component: Comp,
});

function Comp() {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const { data = [] } = useQuery({
    queryKey: ["temp_readings_range", from, to],
    queryFn: async () => (await (supabase.from as any)("temperature_readings").select("*").gte("recorded_at", from).lte("recorded_at", to + "T23:59:59")).data ?? [],
  });
  const { data: thresholds = [] } = useQuery({ queryKey: ["temp_thresholds"], queryFn: async () => (await (supabase.from as any)("temperature_thresholds").select("*")).data ?? [] });
  const byLoc: Record<string, any[]> = {};
  data.forEach((r: any) => { (byLoc[r.location_name] ??= []).push(r); });
  const outOf = data.filter((r: any) => !r.in_range);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/temperature-log"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
      <PageHeader title="Temperature Compliance" subtitle="Per-location compliance over selected range" />
      <Card className="p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </Card>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {Object.entries(byLoc).map(([loc, rs]) => {
          const total = rs.length;
          const inR = rs.filter((r: any) => r.in_range).length;
          const pct = total > 0 ? Math.round((inR / total) * 100) : 0;
          const th = thresholds.find((t: any) => t.location_name === loc);
          return (
            <Card key={loc} className="p-4">
              <div className="font-semibold mb-1">{loc}</div>
              <div className="text-xs text-muted-foreground mb-2">{inR} of {total} in range · safe {th?.min_temp}°C to {th?.max_temp}°C</div>
              <Progress value={pct} className="h-2" />
              <div className="text-right text-sm font-semibold mt-1">{pct}%</div>
            </Card>
          );
        })}
      </div>
      <Card>
        <div className="p-4 font-semibold border-b">Out-of-Range Incidents ({outOf.length})</div>
        <div className="overflow-auto"><table className="w-full text-sm">
          <thead className="bg-muted"><tr>{["Time","Location","Temp","Corrective Action"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
          <tbody>{outOf.length === 0 ? <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">All within range</td></tr>
            : outOf.map((r: any) => <tr key={r.id} className="border-t"><td className="p-2">{format(new Date(r.recorded_at), "dd MMM HH:mm")}</td><td className="p-2">{r.location_name}</td><td className="p-2 text-destructive font-semibold">{r.temperature_c}°C</td><td className="p-2 text-muted-foreground italic">{r.corrective_action ?? "—"}</td></tr>)}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
