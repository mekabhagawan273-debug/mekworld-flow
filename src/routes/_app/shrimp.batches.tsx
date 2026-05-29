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
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/shrimp/batches")({
  head: () => ({ meta: [{ title: "Processing Batches · MekWorld Marines ERP" }] }),
  component: Batches,
});

const PROC_TYPES = ["Headless", "PD", "PND", "HLSO", "Cooked", "IQF", "Block Frozen"];

function Batches() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("processing_batches")
        .select("*, shrimp_intake(lot_number, species)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: intakes = [] } = useQuery({
    queryKey: ["intake-options"],
    queryFn: async () => {
      const { data } = await supabase.from("shrimp_intake")
        .select("id, lot_number, species").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("processing_batches").insert(p);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Batch created");
      qc.invalidateQueries({ queryKey: ["batches"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      intake_id: fd.get("intake_id") || null,
      processing_type: fd.get("processing_type"),
      workers_count: Number(fd.get("workers_count") || 0),
      machines_used: fd.get("machines_used") || null,
      input_weight_kg: fd.get("input_weight_kg") ? Number(fd.get("input_weight_kg")) : null,
      output_weight_kg: fd.get("output_weight_kg") ? Number(fd.get("output_weight_kg")) : null,
      wastage_kg: Number(fd.get("wastage_kg") || 0),
      byproduct_kg: Number(fd.get("byproduct_kg") || 0),
      notes: fd.get("notes") || null,
    });
  };

  const columns: Column<any>[] = [
    { key: "batch_id", header: "Batch", render: (r) => <span className="font-mono text-xs">{r.batch_id}</span> },
    { key: "lot", header: "Source Lot", render: (r) => r.shrimp_intake?.lot_number ?? <span className="text-muted-foreground">—</span> },
    { key: "processing_type", header: "Type", render: (r) => <Badge variant="secondary">{r.processing_type}</Badge> },
    { key: "input_weight_kg", header: "Input (kg)", render: (r) => r.input_weight_kg ?? "—" },
    { key: "output_weight_kg", header: "Output (kg)", render: (r) => r.output_weight_kg ?? "—" },
    {
      key: "yield_pct", header: "Yield %",
      render: (r) => r.input_weight_kg > 0 ? (
        <span className={Number(r.yield_pct) >= 70 ? "text-success font-medium" : "text-warning font-medium"}>
          {Number(r.yield_pct).toFixed(1)}%
        </span>
      ) : "—",
    },
    { key: "workers_count", header: "Workers" },
    {
      key: "status", header: "Status", render: (r) => (
        <Badge className={
          r.status === "completed" ? "bg-success text-white"
          : r.status === "on_hold" ? "bg-warning text-foreground"
          : "bg-info text-white"
        }>{r.status.replace("_", " ")}</Badge>
      ),
    },
    { key: "start_time", header: "Started", render: (r) => format(new Date(r.start_time), "dd MMM HH:mm") },
  ];

  return (
    <div>
      <PageHeader
        title="Processing Batches"
        subtitle="Track every production batch from start to finish"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal text-teal-foreground hover:bg-teal/90">
                <Plus className="w-4 h-4 mr-2" />New Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />Create Processing Batch</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Source Intake Lot</Label>
                  <Select name="intake_id">
                    <SelectTrigger><SelectValue placeholder="Select lot..." /></SelectTrigger>
                    <SelectContent>
                      {intakes.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>{i.lot_number} — {i.species}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Processing type *</Label>
                  <Select name="processing_type" defaultValue="PD" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <FF name="workers_count" label="Workers" type="number" />
                <FF name="machines_used" label="Machines used" />
                <FF name="input_weight_kg" label="Input weight (kg)" type="number" step="0.01" />
                <FF name="output_weight_kg" label="Output weight (kg)" type="number" step="0.01" />
                <FF name="wastage_kg" label="Wastage (kg)" type="number" step="0.01" />
                <FF name="byproduct_kg" label="By-product (kg)" type="number" step="0.01" />
                <div className="col-span-2 space-y-2">
                  <Label>Notes</Label>
                  <Input name="notes" />
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable data={data} columns={columns} searchKeys={["batch_id", "processing_type"]} loading={isLoading} />
    </div>
  );
}

function FF({ name, label, type = "text", step }: { name: string; label: string; type?: string; step?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} step={step} />
    </div>
  );
}
