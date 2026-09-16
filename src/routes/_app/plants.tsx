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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Factory } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/plants")({
  head: () => ({ meta: [{ title: "Plant Management · MekWorld Marines ERP" }] }),
  component: PlantsList,
});

const statusColor: Record<string, string> = {
  running: "bg-success text-white",
  idle: "bg-muted text-foreground",
  maintenance: "bg-warning text-foreground",
  shutdown: "bg-destructive text-destructive-foreground",
};

function PlantsList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["plants"], queryFn: async () => (await (supabase.from as any)("plants").select("*").order("created_at", { ascending: false })).data ?? [] });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("plants").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Plant created"); qc.invalidateQueries({ queryKey: ["plants"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Plant Management <Badge variant="secondary">{data.length} plants</Badge></span> as any}
        subtitle="Plant master list and operational status"
        actions={
          <WriteGate module="plants" note >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Plant</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Plant</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({
                  plant_code: String(fd.get("plant_code")), name: String(fd.get("name")),
                  plant_type: String(fd.get("plant_type")), capacity: Number(fd.get("capacity") || 0),
                  status: String(fd.get("status")), supervisor: fd.get("supervisor") || null, location: fd.get("location") || null,
                }); }} className="grid grid-cols-2 gap-3">
                  <Fld n="plant_code" l="Plant Code" required />
                  <Fld n="name" l="Name" required />
                  <div className="space-y-2"><Label>Type *</Label>
                    <Select name="plant_type" defaultValue="processing" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processing">Processing Plant</SelectItem>
                        <SelectItem value="hatchery">Hatchery</SelectItem>
                        <SelectItem value="ice">Ice Plant</SelectItem>
                        <SelectItem value="cold_storage">Cold Storage</SelectItem>
                        <SelectItem value="feed_mill">Feed Mill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Fld n="capacity" l="Capacity (tons/day)" type="number" step="0.01" />
                  <div className="space-y-2"><Label>Status *</Label>
                    <Select name="status" defaultValue="running" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="idle">Idle</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="shutdown">Shutdown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Fld n="supervisor" l="Supervisor" />
                  <Fld n="location" l="Location" />
                  <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </WriteGate>
        }
      />
      {data.length === 0 ? <Card className="p-10 text-center text-muted-foreground"><Factory className="w-10 h-10 mx-auto mb-2 opacity-40" />No plants yet</Card>
        : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((p: any) => (
              <Link to="/plants/$id" params={{ id: p.id }} key={p.id}>
                <Card className="p-4 hover:shadow-lg hover:border-teal/40 transition cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div><div className="text-xs font-mono text-muted-foreground">{p.plant_code}</div><div className="font-semibold">{p.name}</div></div>
                    <Factory className="w-5 h-5 text-teal" />
                  </div>
                  <div className="text-xs text-muted-foreground">{p.capacity ?? "—"} {p.capacity_uom}</div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{p.plant_type}</Badge>
                    <Badge className={statusColor[p.status] ?? ""}>{p.status}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

function Fld({ n, l, type = "text", required, step }: { n: string; l: string; type?: string; required?: boolean; step?: string }) {
  return (<div className="space-y-2"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
