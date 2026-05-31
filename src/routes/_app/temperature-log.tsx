import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, AlertTriangle, Thermometer, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { format, subHours } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";

export const Route = createFileRoute("/_app/temperature-log")({
  head: () => ({ meta: [{ title: "Temperature Log · MekWorld Marines ERP" }] }),
  component: TempLog,
});

function TempLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [lastAlert, setLastAlert] = useState<string | null>(null);

  const { data: thresholds = [] } = useQuery({ queryKey: ["temp_thresholds"], queryFn: async () => (await (supabase.from as any)("temperature_thresholds").select("*")).data ?? [] });
  const { data: readings = [] } = useQuery({ queryKey: ["temp_readings"], queryFn: async () => (await (supabase.from as any)("temperature_readings").select("*").order("recorded_at", { ascending: false }).limit(500)).data ?? [] });

  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("temperature_readings").insert(p); if (error) throw error; },
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["temp_readings"] }); setOpen(false);
      if (!v.in_range) { setLastAlert(`${v.location_name} out of range: ${v.temperature_c}°C`); toast.error(`Out of range: ${v.location_name}`); }
      else { toast.success("Reading saved"); }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const loc = String(fd.get("location_name"));
    const temp = Number(fd.get("temperature_c"));
    const th = thresholds.find((t: any) => t.location_name === loc);
    const in_range = th ? (temp >= Number(th.min_temp) && temp <= Number(th.max_temp)) : true;
    create.mutate({ location_name: loc, temperature_c: temp, recorded_by: user?.email, in_range });
  };

  const last24 = subHours(new Date(), 24).toISOString();
  const byLoc = useMemo(() => {
    const m: Record<string, any[]> = {};
    readings.filter((r: any) => r.recorded_at >= last24).forEach((r: any) => { (m[r.location_name] ??= []).push(r); });
    return m;
  }, [readings, last24]);

  return (
    <div>
      <PageHeader title="Temperature Log" subtitle="Cold chain monitoring across all locations"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/temperature-log/compliance">Compliance</Link></Button>
            <Button asChild variant="outline"><Link to="/temperature-log/ice"><Snowflake className="w-4 h-4 mr-2" />Ice Log</Link></Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Reading</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Temperature Reading</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2"><Label>Location *</Label>
                    <Select name="location_name" required>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{thresholds.map((t: any) => <SelectItem key={t.id} value={t.location_name}>{t.location_name} ({t.min_temp}°C to {t.max_temp}°C)</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2"><Label>Temperature (°C) *</Label><Input name="temperature_c" type="number" step="0.1" required /></div>
                  <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      {lastAlert && (
        <Card className="p-4 mb-4 bg-destructive/10 border-destructive/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div className="text-sm flex-1"><span className="font-semibold text-destructive">Out of range alert:</span> {lastAlert}</div>
          <Button size="sm" variant="outline" onClick={() => setLastAlert(null)}>Dismiss</Button>
        </Card>
      )}

      <div className="space-y-4 mb-6">
        {Object.entries(byLoc).length === 0 ? <Card className="p-8 text-center text-muted-foreground"><Thermometer className="w-8 h-8 mx-auto mb-2 opacity-40" />No readings in last 24h</Card>
          : Object.entries(byLoc).map(([loc, rs]) => {
            const th = thresholds.find((t: any) => t.location_name === loc);
            const chart = [...rs].reverse().map(r => ({ t: format(new Date(r.recorded_at), "HH:mm"), temp: Number(r.temperature_c) }));
            return (
              <Card key={loc} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{loc}</div>
                  <div className="text-xs text-muted-foreground">Safe: {th?.min_temp}°C to {th?.max_temp}°C · {rs.length} readings</div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="t" fontSize={10} /><YAxis fontSize={10} domain={['auto','auto']} />
                    {th && <ReferenceArea y1={Number(th.min_temp)} y2={Number(th.max_temp)} fill="oklch(0.7 0.15 155)" fillOpacity={0.08} />}
                    <Tooltip /><Line type="monotone" dataKey="temp" stroke="oklch(0.55 0.13 230)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            );
          })}
      </div>

      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Location","Temp °C","Recorded By","Time","Status"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{readings.slice(0, 50).map((r: any) => <tr key={r.id} className="border-t"><td className="p-2">{r.location_name}</td><td className="p-2 font-semibold">{r.temperature_c}°C</td><td className="p-2">{r.recorded_by ?? "—"}</td><td className="p-2">{format(new Date(r.recorded_at), "dd MMM HH:mm")}</td><td className="p-2">{r.in_range ? <Badge className="bg-success text-white">In Range ✓</Badge> : <Badge className="bg-destructive text-destructive-foreground">Out ✗</Badge>}</td></tr>)}</tbody>
      </table></Card>
    </div>
  );
}
