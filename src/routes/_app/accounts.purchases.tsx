import { WriteGate } from "@/components/WriteGate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/accounts/purchases")({
  head: () => ({ meta: [{ title: "Purchases · MekWorld Marines ERP" }] }),
  component: Purchases,
});

function Purchases() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({ queryKey: ["purchases"], queryFn: async () => (await (supabase.from as any)("purchases").select("*").order("purchase_date", { ascending: false })).data ?? [] });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("purchases").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Purchase recorded"); qc.invalidateQueries({ queryKey: ["purchases"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount") || 0);
    const gst_pct = Number(fd.get("gst_pct") || 0);
    const gst_amount = +(amount * gst_pct / 100).toFixed(2);
    create.mutate({
      supplier_name: String(fd.get("supplier_name")),
      invoice_no: fd.get("invoice_no") || null,
      purchase_date: fd.get("purchase_date"),
      items: fd.get("items") || null,
      amount, gst_pct, gst_amount, total: amount + gst_amount,
      payment_status: String(fd.get("payment_status")),
    });
  };
  const cols: Column<any>[] = [
    { key: "purchase_date", header: "Date", render: (r) => format(new Date(r.purchase_date), "dd MMM yy") },
    { key: "supplier_name", header: "Supplier" },
    { key: "invoice_no", header: "Invoice #", render: (r) => r.invoice_no ?? "—" },
    { key: "items", header: "Items", render: (r) => <span className="text-xs">{r.items ?? "—"}</span> },
    { key: "amount", header: "Amount", render: (r) => `₹${Number(r.amount).toLocaleString()}` },
    { key: "gst_pct", header: "GST %", render: (r) => `${r.gst_pct}%` },
    { key: "total", header: "Total", render: (r) => <span className="font-semibold">₹{Number(r.total).toLocaleString()}</span> },
    { key: "payment_status", header: "Status", render: (r) => <Badge className={r.payment_status === "paid" ? "bg-success text-white" : r.payment_status === "partial" ? "bg-warning text-foreground" : "bg-muted text-foreground"}>{r.payment_status}</Badge> },
  ];
  return (
    <div>
      <PageHeader title="Purchase Register" subtitle="Supplier invoices and payment status"
        actions={
          <WriteGate module="accounts" note >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Purchase</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>New Purchase</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
                  <F n="supplier_name" l="Supplier" required />
                  <F n="invoice_no" l="Invoice #" />
                  <F n="purchase_date" l="Date" type="date" required />
                  <div className="space-y-2"><Label>Payment Status *</Label>
                    <Select name="payment_status" defaultValue="pending" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><F n="items" l="Items / Description" /></div>
                  <F n="amount" l="Amount (₹)" type="number" step="0.01" required />
                  <F n="gst_pct" l="GST %" type="number" step="0.01" />
                  <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </WriteGate>
        }
      />
      <DataTable data={data} columns={cols} searchKeys={["supplier_name", "invoice_no"]} loading={isLoading} />
    </div>
  );
}
function F({ n, l, type = "text", step, required }: { n: string; l: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-2"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
