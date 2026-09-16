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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/shrimp/qc")({
  head: () => ({ meta: [{ title: "Quality Control · MekWorld Marines ERP" }] }),
  component: QC,
});

function QC() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["qc"],
    queryFn: async () => {
      const { data, error } = await supabase.from("qc_inspections")
        .select("*, processing_batches(batch_id)").order("inspection_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
  const { data: batches = [] } = useQuery({
    queryKey: ["batch-options"],
    queryFn: async () => {
      const { data } = await supabase.from("processing_batches")
        .select("id, batch_id").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("qc_inspections").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Inspection saved"); qc.invalidateQueries({ queryKey: ["qc"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      batch_id: fd.get("batch_id") || null,
      inspector_name: String(fd.get("inspector_name")),
      ph: fd.get("ph") ? Number(fd.get("ph")) : null,
      temperature_c: fd.get("temperature_c") ? Number(fd.get("temperature_c")) : null,
      bacterial_count: fd.get("bacterial_count") ? Number(fd.get("bacterial_count")) : null,
      status: fd.get("status"),
      remarks: fd.get("remarks") || null,
    });
  };

  const columns: Column<any>[] = [
    { key: "inspection_date", header: "Date", render: (r) => format(new Date(r.inspection_date), "dd MMM HH:mm") },
    { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-xs">{r.processing_batches?.batch_id ?? "—"}</span> },
    { key: "inspector_name", header: "Inspector" },
    { key: "ph", header: "pH", render: (r) => r.ph ?? "—" },
    { key: "temperature_c", header: "Temp °C", render: (r) => r.temperature_c ?? "—" },
    { key: "bacterial_count", header: "Bacterial #", render: (r) => r.bacterial_count ?? "—" },
    {
      key: "status", header: "Status", render: (r) => (
        <Badge className={
          r.status === "approved" ? "bg-success text-white"
          : r.status === "rejected" ? "bg-destructive text-destructive-foreground"
          : r.status === "on_hold" ? "bg-warning text-foreground"
          : "bg-muted text-foreground"
        }>{r.status}</Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quality Control"
        subtitle="QC inspections, approvals and rejections per batch"
        actions={
          <WriteGate module="qc" note >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />New Inspection</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" />QC Inspection</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Batch</Label>
                    <Select name="batch_id">
                      <SelectTrigger><SelectValue placeholder="Select batch..." /></SelectTrigger>
                      <SelectContent>
                        {batches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.batch_id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Inspector name *</Label>
                    <Input name="inspector_name" required />
                  </div>
                  <FF name="ph" label="pH" type="number" step="0.01" />
                  <FF name="temperature_c" label="Temperature °C" type="number" step="0.1" />
                  <FF name="bacterial_count" label="Bacterial count" type="number" />
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select name="status" defaultValue="approved" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Remarks</Label>
                    <Textarea name="remarks" rows={2} />
                  </div>
                  <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={create.isPending}>
                      {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </WriteGate>
        }
      />
      <DataTable data={data} columns={columns} searchKeys={["inspector_name"]} loading={isLoading} />
    </div>
  );
}

function FF({ name, label, type = "text", step }: { name: string; label: string; type?: string; step?: string }) {
  return (<div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} step={step} /></div>);
}
