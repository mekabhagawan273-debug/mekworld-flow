import { WriteGate } from "@/components/WriteGate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/accounts/production-cost")({
  head: () => ({ meta: [{ title: "Production Cost · MekWorld Marines ERP" }] }),
  component: ProductionCost,
});

const THRESHOLD = 600; // ₹/kg

function ProductionCost() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["production_costs"],
    queryFn: async () => (await (supabase.from as any)("production_costs").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: batches = [] } = useQuery({ queryKey: ["batches_lookup"], queryFn: async () => (await supabase.from("processing_batches").select("id, batch_id").order("created_at", { ascending: false }).limit(200)).data ?? [] });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("production_costs").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Cost recorded"); qc.invalidateQueries({ queryKey: ["production_costs"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const material_cost = Number(fd.get("material_cost") || 0);
    const labour_cost = Number(fd.get("labour_cost") || 0);
    const overhead_cost = Number(fd.get("overhead_cost") || 0);
    const output_kg = Number(fd.get("output_kg") || 0);
    const total_cost = material_cost + labour_cost + overhead_cost;
    const cost_per_kg = output_kg > 0 ? +(total_cost / output_kg).toFixed(2) : 0;
    create.mutate({ batch_id: fd.get("batch_id") || null, material_cost, labour_cost, overhead_cost, total_cost, output_kg, cost_per_kg });
  };
  const cols: Column<any>[] = [
    { key: "batch_id", header: "Batch", render: (r) => <span className="font-mono text-xs">{batches.find((b: any) => b.id === r.batch_id)?.batch_id ?? "—"}</span> },
    { key: "material_cost", header: "Material", render: (r) => `₹${Number(r.material_cost).toLocaleString()}` },
    { key: "labour_cost", header: "Labour", render: (r) => `₹${Number(r.labour_cost).toLocaleString()}` },
    { key: "overhead_cost", header: "Overhead", render: (r) => `₹${Number(r.overhead_cost).toLocaleString()}` },
    { key: "total_cost", header: "Total", render: (r) => <span className="font-semibold">₹{Number(r.total_cost).toLocaleString()}</span> },
    { key: "output_kg", header: "Output (kg)" },
    { key: "cost_per_kg", header: "₹/kg", render: (r) => <span className={Number(r.cost_per_kg) > THRESHOLD ? "text-destructive font-semibold" : ""}>₹{r.cost_per_kg}</span> },
  ];
  return (
    <div>
      <PageHeader title="Production Cost" subtitle={`Cost per batch — alert when > ₹${THRESHOLD}/kg`}
        actions={
          <WriteGate module="accounts" note >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Cost</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Batch Cost</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-2"><Label>Batch</Label>
                    <Select name="batch_id"><SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                      <SelectContent>{batches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.batch_id}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <F n="material_cost" l="Material Cost (₹)" type="number" step="0.01" />
                  <F n="labour_cost" l="Labour Cost (₹)" type="number" step="0.01" />
                  <F n="overhead_cost" l="Overhead (₹)" type="number" step="0.01" />
                  <F n="output_kg" l="Output (kg)" type="number" step="0.01" />
                  <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </WriteGate>
        }
      />
      <DataTable data={data} columns={cols} loading={isLoading} />
    </div>
  );
}
function F({ n, l, type = "text", step, required }: { n: string; l: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-2"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
