import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Snowflake, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/shrimp/cold-storage")({
  head: () => ({ meta: [{ title: "Cold Storage · MekWorld Marines ERP" }] }),
  component: ColdStorage,
});

function ColdStorage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["cold_storage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cold_storage").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("cold_storage").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Stock added"); qc.invalidateQueries({ queryKey: ["cold_storage"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      product_name: String(fd.get("product_name")),
      chamber_no: String(fd.get("chamber_no")),
      quantity_kg: Number(fd.get("quantity_kg")),
      cartons: Number(fd.get("cartons") || 0),
      packing_date: fd.get("packing_date") || null,
      best_before: fd.get("best_before") || null,
      temperature_c: fd.get("temperature_c") ? Number(fd.get("temperature_c")) : null,
    });
  };

  const columns: Column<any>[] = [
    { key: "product_name", header: "Product" },
    { key: "chamber_no", header: "Chamber" },
    { key: "quantity_kg", header: "Qty (kg)", render: (r) => Number(r.quantity_kg).toLocaleString() },
    { key: "cartons", header: "Cartons" },
    { key: "packing_date", header: "Packed", render: (r) => r.packing_date ? format(new Date(r.packing_date), "dd MMM yy") : "—" },
    { key: "best_before", header: "Best Before", render: (r) => r.best_before ? format(new Date(r.best_before), "dd MMM yy") : "—" },
    {
      key: "temperature_c", header: "Temp °C", render: (r) => {
        if (r.temperature_c == null) return "—";
        const out = r.temperature_c > r.temp_max || r.temperature_c < r.temp_min;
        return (
          <span className={out ? "text-destructive font-semibold inline-flex items-center gap-1" : ""}>
            {out && <AlertTriangle className="w-3 h-3" />}{r.temperature_c}°C
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cold Storage Inventory"
        subtitle="Frozen stock by chamber with temperature monitoring"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Stock</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Snowflake className="w-5 h-5" />Add to Cold Storage</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                <FF name="product_name" label="Product name" required />
                <FF name="chamber_no" label="Chamber #" required />
                <FF name="quantity_kg" label="Quantity (kg)" type="number" step="0.01" required />
                <FF name="cartons" label="Cartons" type="number" />
                <FF name="packing_date" label="Packing date" type="date" />
                <FF name="best_before" label="Best before" type="date" />
                <FF name="temperature_c" label="Temperature °C" type="number" step="0.1" />
                <DialogFooter className="col-span-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable data={data} columns={columns} searchKeys={["product_name", "chamber_no"]} loading={isLoading} />
    </div>
  );
}

function FF({ name, label, type = "text", step, required }: { name: string; label: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-2"><Label htmlFor={name}>{label}{required && " *"}</Label><Input id={name} name={name} type={type} step={step} required={required} /></div>);
}
