import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Fish, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_app/shrimp/intake")({
  head: () => ({ meta: [{ title: "Shrimp Intake · MekWorld Marines ERP" }] }),
  component: ShrimpIntake,
});

type Intake = {
  id: string; lot_number: string; intake_date: string; supplier_name: string;
  vehicle_number: string | null; species: string; quantity_kg: number;
  price_per_kg: number; total_cost: number; quality_grade: string | null;
  moisture_pct: number | null; temperature_c: number | null; remarks: string | null;
};

function ShrimpIntake() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["shrimp_intake"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shrimp_intake")
        .select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Intake[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("shrimp_intake").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Intake logged");
      qc.invalidateQueries({ queryKey: ["shrimp_intake"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      supplier_name: String(fd.get("supplier_name")),
      vehicle_number: fd.get("vehicle_number") || null,
      species: fd.get("species"),
      quantity_kg: Number(fd.get("quantity_kg")),
      price_per_kg: Number(fd.get("price_per_kg") || 0),
      quality_grade: fd.get("quality_grade") || null,
      moisture_pct: fd.get("moisture_pct") ? Number(fd.get("moisture_pct")) : null,
      temperature_c: fd.get("temperature_c") ? Number(fd.get("temperature_c")) : null,
      remarks: fd.get("remarks") || null,
    };
    create.mutate(payload);
  };

  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shrimp Intake");
    XLSX.writeFile(wb, `shrimp-intake-${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  const columns: Column<Intake>[] = [
    { key: "lot_number", header: "Lot #", render: (r) => <span className="font-mono text-xs">{r.lot_number}</span> },
    { key: "intake_date", header: "Date", render: (r) => format(new Date(r.intake_date), "dd MMM yy") },
    { key: "supplier_name", header: "Supplier" },
    { key: "species", header: "Species", render: (r) => <Badge variant="secondary">{r.species}</Badge> },
    { key: "quantity_kg", header: "Qty (kg)", render: (r) => Number(r.quantity_kg).toLocaleString() },
    { key: "price_per_kg", header: "₹/kg", render: (r) => `₹${Number(r.price_per_kg).toFixed(2)}` },
    { key: "total_cost", header: "Total", render: (r) => `₹${Number(r.total_cost).toLocaleString()}` },
    {
      key: "quality_grade", header: "Grade", render: (r) => r.quality_grade ? (
        <Badge className={
          r.quality_grade === "A" ? "bg-success text-white"
          : r.quality_grade === "B" ? "bg-warning text-foreground"
          : "bg-destructive text-destructive-foreground"
        }>{r.quality_grade}</Badge>
      ) : <span className="text-muted-foreground">—</span>,
    },
    { key: "temperature_c", header: "Temp °C", render: (r) => r.temperature_c ?? "—" },
  ];

  const totalKg = data.reduce((a, r) => a + Number(r.quantity_kg), 0);
  const totalCost = data.reduce((a, r) => a + Number(r.total_cost), 0);

  return (
    <div>
      <PageHeader
        title="Shrimp Intake Register"
        subtitle="Log every raw shrimp delivery with full traceability"
        actions={
          <>
            <Button variant="outline" onClick={exportXlsx}><Download className="w-4 h-4 mr-2" />Excel</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal text-teal-foreground hover:bg-teal/90">
                  <Plus className="w-4 h-4 mr-2" />New Intake
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Fish className="w-5 h-5" />New Shrimp Intake</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                  <Field name="supplier_name" label="Supplier name" required />
                  <Field name="vehicle_number" label="Vehicle number" />
                  <div className="space-y-2">
                    <Label>Species *</Label>
                    <Select name="species" defaultValue="Vannamei" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vannamei">Vannamei</SelectItem>
                        <SelectItem value="Tiger">Tiger</SelectItem>
                        <SelectItem value="Black Tiger">Black Tiger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quality grade</Label>
                    <Select name="quality_grade" defaultValue="A">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C"].map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Field name="quantity_kg" label="Quantity (kg)" type="number" step="0.01" required />
                  <Field name="price_per_kg" label="Price per kg (₹)" type="number" step="0.01" />
                  <Field name="moisture_pct" label="Moisture %" type="number" step="0.01" />
                  <Field name="temperature_c" label="Temperature °C" type="number" step="0.1" />
                  <div className="col-span-2 space-y-2">
                    <Label>Remarks</Label>
                    <Textarea name="remarks" rows={2} />
                  </div>
                  <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={create.isPending}>
                      {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Save Intake
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total intakes</div>
          <div className="text-2xl font-bold mt-1">{data.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total quantity</div>
          <div className="text-2xl font-bold mt-1">{totalKg.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">kg</span></div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total value</div>
          <div className="text-2xl font-bold mt-1">₹{totalCost.toLocaleString()}</div>
        </Card>
      </div>

      <DataTable data={data} columns={columns} searchKeys={["lot_number", "supplier_name", "species"]} loading={isLoading} />
    </div>
  );
}

function Field({ name, label, type = "text", required, step }: {
  name: string; label: string; type?: string; required?: boolean; step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} type={type} step={step} required={required} />
    </div>
  );
}
