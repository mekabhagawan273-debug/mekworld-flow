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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/store")({
  head: () => ({ meta: [{ title: "Store & Materials · MekWorld Marines ERP" }] }),
  component: Store,
});

function Store() {
  return (
    <div>
      <PageHeader title="Store & Materials" subtitle="RM / GM / CM / PM stock, suppliers and movements" />
      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>
        <TabsContent value="materials"><MaterialsTab /></TabsContent>
        <TabsContent value="movements"><MovementsTab /></TabsContent>
        <TabsContent value="suppliers"><SuppliersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function MaterialsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").order("code");
      if (error) throw error; return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("materials").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Material added"); qc.invalidateQueries({ queryKey: ["materials"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      code: String(fd.get("code")), name: String(fd.get("name")),
      category: String(fd.get("category")), uom: String(fd.get("uom")),
      min_stock: Number(fd.get("min_stock") || 0),
      current_stock: Number(fd.get("current_stock") || 0),
      unit_cost: Number(fd.get("unit_cost") || 0),
    });
  };
  const lowStock = data.filter((m: any) => Number(m.current_stock) < Number(m.min_stock ?? 0)).length;
  const columns: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", header: "Name" },
    { key: "category", header: "Category", render: (r) => <Badge variant="secondary">{r.category}</Badge> },
    { key: "uom", header: "UOM" },
    { key: "current_stock", header: "Current Stock", render: (r) =>
        <span className={Number(r.current_stock) < Number(r.min_stock ?? 0) ? "text-destructive font-semibold" : ""}>
          {Number(r.current_stock).toLocaleString()}
        </span> },
    { key: "min_stock", header: "Min Stock", render: (r) => Number(r.min_stock ?? 0).toLocaleString() },
    { key: "unit_cost", header: "Unit Cost", render: (r) => `₹${Number(r.unit_cost ?? 0).toFixed(2)}` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Total Items</div><div className="text-2xl font-bold mt-1">{data.length}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Categories</div><div className="text-2xl font-bold mt-1">{new Set(data.map((m: any) => m.category)).size}</div></Card>
        <Card className="p-4 flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-warning mt-1" /><div><div className="text-xs uppercase text-muted-foreground">Low Stock Alert</div><div className="text-2xl font-bold mt-1">{lowStock}</div></div></Card>
      </div>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Material</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New Material</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
              <F name="code" label="Code" required />
              <F name="name" label="Name" required />
              <div className="space-y-2"><Label>Category *</Label>
                <Select name="category" defaultValue="RM" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RM">Raw Material</SelectItem>
                    <SelectItem value="GM">General Material</SelectItem>
                    <SelectItem value="CM">Chemical Material</SelectItem>
                    <SelectItem value="PM">Packing Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>UOM *</Label>
                <Select name="uom" defaultValue="kg" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["kg","g","ltr","pcs","carton","box","bag"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <F name="current_stock" label="Opening Stock" type="number" step="0.01" />
              <F name="min_stock" label="Min Stock Level" type="number" step="0.01" />
              <F name="unit_cost" label="Unit Cost (₹)" type="number" step="0.01" />
              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data} columns={columns} searchKeys={["code", "name", "category"]} loading={isLoading} />
    </div>
  );
}

function MovementsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_movements").select("*, materials(code,name,uom), suppliers(name)").order("created_at", { ascending: false }).limit(500);
      if (error) throw error; return data ?? [];
    },
  });
  const { data: materials = [] } = useQuery({ queryKey: ["materials_lookup"], queryFn: async () => (await supabase.from("materials").select("id,code,name")).data ?? [] });
  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers_lookup"], queryFn: async () => (await supabase.from("suppliers").select("id,name")).data ?? [] });

  const create = useMutation({
    mutationFn: async (p: any) => {
      const { error } = await supabase.from("stock_movements").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Movement recorded"); qc.invalidateQueries({ queryKey: ["stock_movements"] }); qc.invalidateQueries({ queryKey: ["materials"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      material_id: String(fd.get("material_id")),
      movement_type: String(fd.get("movement_type")),
      quantity: Number(fd.get("quantity")),
      reference_no: fd.get("reference_no") || null,
      supplier_id: fd.get("supplier_id") ? String(fd.get("supplier_id")) : null,
      notes: fd.get("notes") || null,
    });
  };

  const columns: Column<any>[] = [
    { key: "movement_date", header: "Date", render: (r) => format(new Date(r.movement_date), "dd MMM yy") },
    { key: "movement_type", header: "Type", render: (r) => r.movement_type === "in"
        ? <Badge className="bg-success text-white gap-1"><ArrowDownToLine className="w-3 h-3" />Inward</Badge>
        : <Badge className="bg-warning text-foreground gap-1"><ArrowUpFromLine className="w-3 h-3" />Outward</Badge> },
    { key: "material", header: "Material", render: (r) => r.materials ? `${r.materials.code} — ${r.materials.name}` : "—" },
    { key: "quantity", header: "Quantity", render: (r) => `${Number(r.quantity).toLocaleString()} ${r.materials?.uom ?? ""}` },
    { key: "reference_no", header: "Reference", render: (r) => r.reference_no ?? "—" },
    { key: "supplier", header: "Supplier", render: (r) => r.suppliers?.name ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />New Movement</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Stock Movement</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Material *</Label>
                <Select name="material_id" required>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>{materials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Type *</Label>
                <Select name="movement_type" defaultValue="in" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="in">Inward</SelectItem><SelectItem value="out">Outward</SelectItem></SelectContent>
                </Select>
              </div>
              <F name="quantity" label="Quantity" type="number" step="0.01" required />
              <F name="reference_no" label="Reference / GRN No" />
              <div className="space-y-2"><Label>Supplier</Label>
                <Select name="supplier_id">
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2"><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data} columns={columns} searchKeys={["reference_no"]} loading={isLoading} />
    </div>
  );
}

function SuppliersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await supabase.from("suppliers").select("*").order("name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("suppliers").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Supplier added"); qc.invalidateQueries({ queryKey: ["suppliers"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      name: String(fd.get("name")), contact_person: fd.get("contact_person") || null,
      phone: fd.get("phone") || null, email: fd.get("email") || null,
      supplier_type: String(fd.get("supplier_type")), address: fd.get("address") || null,
    });
  };
  const columns: Column<any>[] = [
    { key: "name", header: "Name" },
    { key: "supplier_type", header: "Type", render: (r) => <Badge variant="secondary">{r.supplier_type}</Badge> },
    { key: "contact_person", header: "Contact", render: (r) => r.contact_person ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    { key: "is_active", header: "Status", render: (r) => r.is_active ? <Badge className="bg-success text-white">Active</Badge> : <Badge variant="outline">Inactive</Badge> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Supplier</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New Supplier</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
              <F name="name" label="Supplier Name" required />
              <div className="space-y-2"><Label>Type *</Label>
                <Select name="supplier_type" defaultValue="material" required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shrimp">Shrimp / Raw Material</SelectItem>
                    <SelectItem value="material">General Material</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                    <SelectItem value="chemical">Chemical</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <F name="contact_person" label="Contact Person" />
              <F name="phone" label="Phone" />
              <F name="email" label="Email" type="email" />
              <div className="col-span-2 space-y-2"><Label>Address</Label><Textarea name="address" rows={2} /></div>
              <DialogFooter className="col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data} columns={columns} searchKeys={["name", "contact_person", "email"]} loading={isLoading} />
    </div>
  );
}

function F({ name, label, type = "text", required, step }: { name: string; label: string; type?: string; required?: boolean; step?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}{required && " *"}</Label>
      <Input id={name} name={name} type={type} step={step} required={required} />
    </div>
  );
}
