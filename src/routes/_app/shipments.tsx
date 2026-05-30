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
import { Plus, Loader2, Ship, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/shipments")({
  head: () => ({ meta: [{ title: "Shipments & Exports · MekWorld Marines ERP" }] }),
  component: Shipments,
});

const STATUS_COLOR: Record<string, string> = {
  planned: "bg-muted text-foreground",
  loading: "bg-info text-white",
  in_transit: "bg-teal text-teal-foreground",
  delivered: "bg-success text-white",
  cancelled: "bg-destructive text-destructive-foreground",
};

function Shipments() {
  return (
    <div>
      <PageHeader title="Shipments & Exports" subtitle="Container, BL, vessel and customer tracking" />
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="shipments"><ShipmentsTab /></TabsContent>
        <TabsContent value="customers"><CustomersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ShipmentsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipments").select("*, customers(name,country)").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    },
  });
  const { data: customers = [] } = useQuery({ queryKey: ["customers_lookup"], queryFn: async () => (await supabase.from("customers").select("id,name,country")).data ?? [] });

  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("shipments").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Shipment created"); qc.invalidateQueries({ queryKey: ["shipments"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      customer_id: fd.get("customer_id") ? String(fd.get("customer_id")) : null,
      container_no: fd.get("container_no") || null,
      bl_no: fd.get("bl_no") || null,
      vessel_name: fd.get("vessel_name") || null,
      port_of_loading: fd.get("port_of_loading") || null,
      port_of_discharge: fd.get("port_of_discharge") || null,
      destination_country: fd.get("destination_country") || null,
      ship_date: fd.get("ship_date") || null,
      eta: fd.get("eta") || null,
      total_quantity_kg: Number(fd.get("total_quantity_kg") || 0),
      total_cartons: Number(fd.get("total_cartons") || 0),
      invoice_value: Number(fd.get("invoice_value") || 0),
      currency: String(fd.get("currency") || "USD"),
      status: String(fd.get("status") || "planned"),
      notes: fd.get("notes") || null,
    });
  };

  const totalValue = data.reduce((a: number, r: any) => a + Number(r.invoice_value ?? 0), 0);
  const inTransit = data.filter((r: any) => r.status === "in_transit").length;

  const columns: Column<any>[] = [
    { key: "shipment_no", header: "Shipment #", render: (r) => <span className="font-mono text-xs">{r.shipment_no}</span> },
    { key: "customer", header: "Customer", render: (r) => r.customers?.name ?? "—" },
    { key: "destination", header: "Destination", render: (r) => r.destination_country ?? r.port_of_discharge ?? "—" },
    { key: "container_no", header: "Container", render: (r) => r.container_no ?? "—" },
    { key: "bl_no", header: "BL #", render: (r) => r.bl_no ?? "—" },
    { key: "vessel_name", header: "Vessel", render: (r) => r.vessel_name ?? "—" },
    { key: "ship_date", header: "Ship Date", render: (r) => r.ship_date ? format(new Date(r.ship_date), "dd MMM yy") : "—" },
    { key: "invoice_value", header: "Value", render: (r) => `${r.currency ?? "USD"} ${Number(r.invoice_value ?? 0).toLocaleString()}` },
    { key: "status", header: "Status", render: (r) => <Badge className={STATUS_COLOR[r.status] ?? ""}>{r.status.replace("_", " ")}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-start gap-3"><Ship className="w-5 h-5 text-teal mt-1" /><div><div className="text-xs uppercase text-muted-foreground">Total Shipments</div><div className="text-2xl font-bold mt-1">{data.length}</div></div></Card>
        <Card className="p-4 flex items-start gap-3"><Globe2 className="w-5 h-5 text-info mt-1" /><div><div className="text-xs uppercase text-muted-foreground">In Transit</div><div className="text-2xl font-bold mt-1">{inTransit}</div></div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Total Export Value (USD)</div><div className="text-2xl font-bold mt-1">${totalValue.toLocaleString()}</div></Card>
      </div>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />New Shipment</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Shipment</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-2"><Label>Customer</Label>
                <Select name="customer_id">
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.country})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select name="status" defaultValue="planned">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["planned","loading","in_transit","delivered","cancelled"].map(s =>
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <F name="container_no" label="Container No" />
              <F name="bl_no" label="BL Number" />
              <F name="vessel_name" label="Vessel Name" />
              <F name="port_of_loading" label="Port of Loading" />
              <F name="port_of_discharge" label="Port of Discharge" />
              <F name="destination_country" label="Destination Country" />
              <F name="ship_date" label="Ship Date" type="date" />
              <F name="eta" label="ETA" type="date" />
              <F name="total_quantity_kg" label="Total Qty (kg)" type="number" step="0.01" />
              <F name="total_cartons" label="Total Cartons" type="number" />
              <F name="invoice_value" label="Invoice Value" type="number" step="0.01" />
              <div className="space-y-2"><Label>Currency</Label>
                <Select name="currency" defaultValue="USD">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["USD","EUR","GBP","JPY","INR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-2"><Label>Notes</Label><Textarea name="notes" rows={2} /></div>
              <DialogFooter className="col-span-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Shipment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable data={data} columns={columns} searchKeys={["shipment_no", "container_no", "bl_no", "vessel_name"]} loading={isLoading} />
    </div>
  );
}

function CustomersTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await supabase.from("customers").select("*").order("name")).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("customers").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Customer added"); qc.invalidateQueries({ queryKey: ["customers"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      name: String(fd.get("name")), country: fd.get("country") || null,
      contact_person: fd.get("contact_person") || null, email: fd.get("email") || null,
      phone: fd.get("phone") || null, address: fd.get("address") || null,
    });
  };
  const columns: Column<any>[] = [
    { key: "name", header: "Name" },
    { key: "country", header: "Country", render: (r) => r.country ?? "—" },
    { key: "contact_person", header: "Contact", render: (r) => r.contact_person ?? "—" },
    { key: "email", header: "Email", render: (r) => r.email ?? "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
    { key: "is_active", header: "Status", render: (r) => r.is_active ? <Badge className="bg-success text-white">Active</Badge> : <Badge variant="outline">Inactive</Badge> },
  ];
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Customer</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
              <F name="name" label="Customer Name" required />
              <F name="country" label="Country" />
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
      <DataTable data={data} columns={columns} searchKeys={["name", "country", "email"]} loading={isLoading} />
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
