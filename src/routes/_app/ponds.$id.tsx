import { WriteGate } from "@/components/WriteGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/_app/ponds/$id")({
  head: () => ({ meta: [{ title: "Pond Detail · MekWorld Marines ERP" }] }),
  component: PondDetail,
});

function PondDetail() {
  const { id } = Route.useParams();
  const { data: pond } = useQuery({
    queryKey: ["pond", id],
    queryFn: async () => (await (supabase.from as any)("ponds").select("*").eq("id", id).single()).data,
  });
  const doc = pond?.stocking_date ? differenceInDays(new Date(), new Date(pond.stocking_date)) : null;
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/ponds"><ArrowLeft className="w-4 h-4 mr-1" />All Ponds</Link></Button>
      <PageHeader title={pond?.name ?? "Pond"} subtitle={`${pond?.pond_code ?? ""} · ${pond?.size_acres ?? "—"} acres · ${pond?.pond_type ?? ""}`} />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="water">Water Quality</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="harvest">Harvest</TabsTrigger>
          <TabsTrigger value="mortality">Mortality</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat l="Species" v={pond?.species ?? "—"} />
            <Stat l="Stocking Date" v={pond?.stocking_date ? format(new Date(pond.stocking_date), "dd MMM yy") : "—"} />
            <Stat l="DOC (Days of Culture)" v={doc != null ? `${doc} days` : "—"} />
            <Stat l="PL Seed Count" v={pond?.pl_count?.toLocaleString() ?? "—"} />
            <Stat l="Avg Body Weight" v={pond?.avg_body_weight_g ? `${pond.avg_body_weight_g} g` : "—"} />
            <Stat l="Estimated Biomass" v={pond?.estimated_biomass_kg ? `${pond.estimated_biomass_kg} kg` : "—"} />
            <Stat l="FCR" v={pond?.fcr ?? "—"} />
            <Stat l="Status" v={<Badge>{pond?.status}</Badge>} />
          </div>
        </TabsContent>
        <TabsContent value="water"><WaterQuality pondId={id} /></TabsContent>
        <TabsContent value="feed"><LogTab pondId={id} table="pond_feed_log" title="Feed" fields={[["feed_brand","Brand"],["feed_type","Type"],["quantity_kg","Qty (kg)","number"]]} /></TabsContent>
        <TabsContent value="treatments"><LogTab pondId={id} table="pond_treatments" title="Treatments" dateField="treatment_date" fields={[["product_name","Product"],["dosage","Dosage"],["reason","Reason"],["applied_by","Applied By"]]} /></TabsContent>
        <TabsContent value="harvest"><LogTab pondId={id} table="pond_harvests" title="Harvest" dateField="harvest_date" fields={[["total_weight_kg","Total kg","number"],["count_per_kg","Count/kg","number"],["destination","Destination"],["price_per_kg","₹/kg","number"],["total_value","Total Value","number"]]} /></TabsContent>
        <TabsContent value="mortality"><LogTab pondId={id} table="pond_mortality" title="Mortality" fields={[["estimated_count","Count","number"],["cause","Cause"],["action_taken","Action"]]} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: any }) {
  return <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">{l}</div><div className="text-lg font-semibold mt-1">{v}</div></Card>;
}

function WaterQuality({ pondId }: { pondId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: ["pwq", pondId],
    queryFn: async () => (await (supabase.from as any)("pond_water_quality").select("*").eq("pond_id", pondId).order("log_date", { ascending: false }).limit(60)).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("pond_water_quality").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["pwq", pondId] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const chartData = [...data].slice(0, 14).reverse().map((r: any) => ({ d: format(new Date(r.log_date), "dd/MM"), pH: r.ph, DO: r.do_mgl }));
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <WriteGate module="ponds" note >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Water Quality Entry</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({
                pond_id: pondId, log_date: fd.get("log_date"),
                ph: Number(fd.get("ph") || 0), do_mgl: Number(fd.get("do_mgl") || 0),
                salinity_ppt: Number(fd.get("salinity_ppt") || 0), temperature_c: Number(fd.get("temperature_c") || 0),
                ammonia_mgl: Number(fd.get("ammonia_mgl") || 0), recorded_by: String(fd.get("recorded_by") || ""),
              }); }} className="grid grid-cols-2 gap-3">
                <In n="log_date" l="Date" type="date" required />
                <In n="ph" l="pH" type="number" step="0.01" />
                <In n="do_mgl" l="DO (mg/L)" type="number" step="0.01" />
                <In n="salinity_ppt" l="Salinity (ppt)" type="number" step="0.01" />
                <In n="temperature_c" l="Temp (°C)" type="number" step="0.1" />
                <In n="ammonia_mgl" l="Ammonia (mg/L)" type="number" step="0.01" />
                <In n="recorded_by" l="Recorded By" />
                <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </WriteGate>
      </div>
      <Card className="p-4"><h4 className="font-semibold mb-2">Last 14 days — pH & DO</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />
            <Line type="monotone" dataKey="pH" stroke="oklch(0.72 0.13 195)" strokeWidth={2} />
            <Line type="monotone" dataKey="DO" stroke="oklch(0.55 0.13 230)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Date","pH","DO","Sal","Temp","NH3","By"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{data.map((r: any) => <tr key={r.id} className="border-t"><td className="p-2">{format(new Date(r.log_date), "dd MMM")}</td><td className="p-2">{r.ph}</td><td className="p-2">{r.do_mgl}</td><td className="p-2">{r.salinity_ppt}</td><td className="p-2">{r.temperature_c}</td><td className="p-2">{r.ammonia_mgl}</td><td className="p-2">{r.recorded_by}</td></tr>)}</tbody>
      </table></Card>
    </div>
  );
}

function LogTab({ pondId, table, title, dateField = "log_date", fields }: { pondId: string; table: string; title: string; dateField?: string; fields: Array<[string, string, string?]> }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({
    queryKey: [table, pondId],
    queryFn: async () => (await (supabase.from as any)(table).select("*").eq("pond_id", pondId).order(dateField, { ascending: false })).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)(table).insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: [table, pondId] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <WriteGate module="ponds" >
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add {title}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const p: any = { pond_id: pondId, [dateField]: fd.get(dateField) };
                fields.forEach(([k, , t]) => { const v = fd.get(k); p[k] = t === "number" ? Number(v || 0) : (v || null); });
                create.mutate(p); }} className="grid grid-cols-2 gap-3">
                <In n={dateField} l="Date" type="date" required />
                {fields.map(([k, l, t]) => <In key={k} n={k} l={l} type={t} step={t === "number" ? "0.01" : undefined} />)}
                <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </WriteGate>
      </div>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Date</th>{fields.map(([k, l]) => <th key={k} className="p-2 text-left">{l}</th>)}</tr></thead>
        <tbody>{data.length === 0 ? <tr><td colSpan={fields.length + 1} className="p-4 text-center text-muted-foreground">No entries</td></tr>
          : data.map((r: any) => <tr key={r.id} className="border-t"><td className="p-2">{format(new Date(r[dateField]), "dd MMM yy")}</td>{fields.map(([k]) => <td key={k} className="p-2">{r[k] ?? "—"}</td>)}</tr>)}</tbody>
      </table></Card>
    </div>
  );
}

function In({ n, l, type = "text", step, required }: { n: string; l: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-1"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
