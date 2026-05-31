import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInHours } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/_app/plants/$id")({
  head: () => ({ meta: [{ title: "Plant Detail · MekWorld Marines ERP" }] }),
  component: PlantDetail,
});

function PlantDetail() {
  const { id } = Route.useParams();
  const { data: plant } = useQuery({ queryKey: ["plant", id], queryFn: async () => (await (supabase.from as any)("plants").select("*").eq("id", id).single()).data });
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/plants"><ArrowLeft className="w-4 h-4 mr-1" />All Plants</Link></Button>
      <PageHeader title={plant?.name ?? "Plant"} subtitle={`${plant?.plant_code ?? ""} · ${plant?.plant_type ?? ""} · ${plant?.capacity ?? ""} ${plant?.capacity_uom ?? ""}`} />
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat l="Supervisor" v={plant?.supervisor ?? "—"} />
            <Stat l="Total Workers" v={plant?.total_workers ?? 0} />
            <Stat l="Type" v={plant?.plant_type} />
            <Stat l="Capacity" v={`${plant?.capacity ?? "—"} ${plant?.capacity_uom ?? ""}`} />
            <Stat l="Location" v={plant?.location ?? "—"} />
            <Stat l="Commissioned" v={plant?.commissioned_date ? format(new Date(plant.commissioned_date), "dd MMM yy") : "—"} />
            <Stat l="Status" v={<Badge>{plant?.status}</Badge>} />
          </div>
        </TabsContent>
        <TabsContent value="machines"><MachinesTab plantId={id} /></TabsContent>
        <TabsContent value="production"><ProductionTab plantId={id} /></TabsContent>
        <TabsContent value="breakdowns"><BreakdownsTab plantId={id} /></TabsContent>
        <TabsContent value="consumption"><ConsumptionTab plantId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: any }) {
  return <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">{l}</div><div className="text-lg font-semibold mt-1">{v}</div></Card>;
}

function In({ n, l, type = "text", step, required }: { n: string; l: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-1"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}

function MachinesTab({ plantId }: { plantId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["machines", plantId], queryFn: async () => (await (supabase.from as any)("plant_machines").select("*").eq("plant_id", plantId)).data ?? [] });
  const create = useMutation({ mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("plant_machines").insert(p); if (error) throw error; }, onSuccess: () => { toast.success("Machine added"); qc.invalidateQueries({ queryKey: ["machines", plantId] }); setOpen(false); } });
  const today = new Date();
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Machine</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Machine</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ plant_id: plantId, machine_name: String(fd.get("machine_name")), make_model: fd.get("make_model"), serial_no: fd.get("serial_no"), last_service_date: fd.get("last_service_date") || null, next_service_due: fd.get("next_service_due") || null }); }} className="grid grid-cols-2 gap-3">
              <In n="machine_name" l="Name" required />
              <In n="make_model" l="Make/Model" />
              <In n="serial_no" l="Serial No" />
              <In n="last_service_date" l="Last Service" type="date" />
              <In n="next_service_due" l="Next Service" type="date" />
              <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Machine","Make/Model","Serial","Last Service","Next Service"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{data.length === 0 ? <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No machines</td></tr> : data.map((m: any) => (
          <tr key={m.id} className="border-t"><td className="p-2">{m.machine_name}</td><td className="p-2">{m.make_model ?? "—"}</td><td className="p-2 font-mono text-xs">{m.serial_no ?? "—"}</td><td className="p-2">{m.last_service_date ? format(new Date(m.last_service_date), "dd MMM yy") : "—"}</td>
            <td className={"p-2 " + (m.next_service_due && new Date(m.next_service_due) < today ? "text-destructive font-semibold" : "")}>{m.next_service_due ? format(new Date(m.next_service_due), "dd MMM yy") : "—"}</td></tr>
        ))}</tbody>
      </table></Card>
    </div>
  );
}

function ProductionTab({ plantId }: { plantId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["production", plantId], queryFn: async () => (await (supabase.from as any)("plant_production_log").select("*").eq("plant_id", plantId).order("log_date", { ascending: false }).limit(60)).data ?? [] });
  const create = useMutation({ mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("plant_production_log").insert(p); if (error) throw error; }, onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["production", plantId] }); setOpen(false); } });
  const chart = [...data].slice(0, 30).reverse().map((r: any) => ({ d: format(new Date(r.log_date), "dd/MM"), Planned: r.planned_kg, Actual: r.actual_kg }));
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Log Production</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Production Entry</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ plant_id: plantId, log_date: fd.get("log_date"), planned_kg: Number(fd.get("planned_kg") || 0), actual_kg: Number(fd.get("actual_kg") || 0), recorded_by: fd.get("recorded_by") }); }} className="grid grid-cols-2 gap-3">
              <In n="log_date" l="Date" type="date" required />
              <In n="planned_kg" l="Planned (kg)" type="number" step="0.01" />
              <In n="actual_kg" l="Actual (kg)" type="number" step="0.01" />
              <In n="recorded_by" l="By" />
              <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="p-4"><h4 className="font-semibold mb-2">Last 30 days — Planned vs Actual</h4>
        <ResponsiveContainer width="100%" height={240}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" opacity={0.2} /><XAxis dataKey="d" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend />
          <Line type="monotone" dataKey="Planned" stroke="oklch(0.55 0.13 230)" strokeWidth={2} /><Line type="monotone" dataKey="Actual" stroke="oklch(0.72 0.13 195)" strokeWidth={2} />
        </LineChart></ResponsiveContainer>
      </Card>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Date","Planned","Actual","Eff %","By"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{data.map((r: any) => { const eff = r.planned_kg > 0 ? ((r.actual_kg / r.planned_kg) * 100).toFixed(1) : "—"; return <tr key={r.id} className="border-t"><td className="p-2">{format(new Date(r.log_date), "dd MMM yy")}</td><td className="p-2">{r.planned_kg}</td><td className="p-2">{r.actual_kg}</td><td className="p-2">{eff}%</td><td className="p-2">{r.recorded_by ?? "—"}</td></tr>; })}</tbody>
      </table></Card>
    </div>
  );
}

function BreakdownsTab({ plantId }: { plantId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["breakdowns", plantId], queryFn: async () => (await (supabase.from as any)("plant_breakdowns").select("*").eq("plant_id", plantId).order("start_time", { ascending: false })).data ?? [] });
  const create = useMutation({ mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("plant_breakdowns").insert(p); if (error) throw error; }, onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["breakdowns", plantId] }); setOpen(false); } });
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Log Breakdown</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Breakdown Entry</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ plant_id: plantId, machine_name: fd.get("machine_name"), start_time: fd.get("start_time") || new Date().toISOString(), resolved_time: fd.get("resolved_time") || null, issue: fd.get("issue"), technician: fd.get("technician"), root_cause: fd.get("root_cause"), corrective_action: fd.get("corrective_action") }); }} className="grid grid-cols-2 gap-3">
              <In n="machine_name" l="Machine" required />
              <In n="technician" l="Technician" />
              <In n="start_time" l="Start" type="datetime-local" />
              <In n="resolved_time" l="Resolved" type="datetime-local" />
              <In n="issue" l="Issue" />
              <In n="root_cause" l="Root Cause" />
              <div className="col-span-2"><In n="corrective_action" l="Corrective Action" /></div>
              <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Machine","Start","Issue","Tech","Downtime (h)","Root Cause"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{data.map((r: any) => { const dt = r.resolved_time ? differenceInHours(new Date(r.resolved_time), new Date(r.start_time)) : "—"; return <tr key={r.id} className="border-t"><td className="p-2">{r.machine_name}</td><td className="p-2">{format(new Date(r.start_time), "dd MMM HH:mm")}</td><td className="p-2">{r.issue ?? "—"}</td><td className="p-2">{r.technician ?? "—"}</td><td className="p-2">{dt}</td><td className="p-2">{r.root_cause ?? "—"}</td></tr>; })}</tbody>
      </table></Card>
    </div>
  );
}

function ConsumptionTab({ plantId }: { plantId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["consumption", plantId], queryFn: async () => (await (supabase.from as any)("plant_consumption_log").select("*").eq("plant_id", plantId).order("log_date", { ascending: false })).data ?? [] });
  const create = useMutation({ mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("plant_consumption_log").insert(p); if (error) throw error; }, onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["consumption", plantId] }); setOpen(false); } });
  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Log Consumption</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Consumption Entry</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ plant_id: plantId, log_date: fd.get("log_date"), energy_kwh: Number(fd.get("energy_kwh") || 0), water_kl: Number(fd.get("water_kl") || 0), recorded_by: fd.get("recorded_by") }); }} className="grid grid-cols-2 gap-3">
              <In n="log_date" l="Date" type="date" required />
              <In n="energy_kwh" l="Energy (kWh)" type="number" step="0.01" />
              <In n="water_kl" l="Water (kL)" type="number" step="0.01" />
              <In n="recorded_by" l="By" />
              <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Date","Energy kWh","Water kL","By"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{data.map((r: any) => <tr key={r.id} className="border-t"><td className="p-2">{format(new Date(r.log_date), "dd MMM yy")}</td><td className="p-2">{r.energy_kwh}</td><td className="p-2">{r.water_kl}</td><td className="p-2">{r.recorded_by ?? "—"}</td></tr>)}</tbody>
      </table></Card>
    </div>
  );
}
