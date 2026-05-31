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

export const Route = createFileRoute("/_app/accounts/receivables")({
  head: () => ({ meta: [{ title: "Receivables · MekWorld Marines ERP" }] }),
  component: Receivables,
});

function Receivables() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const { data = [], isLoading } = useQuery({ queryKey: ["receivables"], queryFn: async () => (await (supabase.from as any)("receivables").select("*").order("due_date", { ascending: true })).data ?? [] });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("receivables").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Receivable added"); qc.invalidateQueries({ queryKey: ["receivables"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const cols: Column<any>[] = [
    { key: "buyer", header: "Buyer" },
    { key: "invoice_no", header: "Invoice #", render: (r) => r.invoice_no ?? "—" },
    { key: "invoice_value_usd", header: "Value (USD)", render: (r) => `$${Number(r.invoice_value_usd).toLocaleString()}` },
    { key: "amount_received", header: "Received", render: (r) => `$${Number(r.amount_received).toLocaleString()}` },
    { key: "balance", header: "Balance", render: (r) => { const bal = Number(r.invoice_value_usd) - Number(r.amount_received); return <span className={bal > 0 ? "font-semibold" : "text-success"}>${bal.toLocaleString()}</span>; } },
    { key: "due_date", header: "Due", render: (r) => r.due_date ? format(new Date(r.due_date), "dd MMM yy") : "—" },
    { key: "status", header: "Status", render: (r) => {
      const overdue = r.due_date && r.due_date < today && r.status !== "paid";
      return overdue ? <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>
        : r.status === "paid" ? <Badge className="bg-success text-white">Paid</Badge>
        : r.status === "partial" ? <Badge className="bg-warning text-foreground">Partial</Badge>
        : <Badge variant="secondary">{r.status}</Badge>;
    } },
  ];
  return (
    <div>
      <PageHeader title="Export Receivables" subtitle="Outstanding invoices from international buyers"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Receivable</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Receivable</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ buyer: String(fd.get("buyer")), invoice_no: fd.get("invoice_no"), invoice_value_usd: Number(fd.get("invoice_value_usd") || 0), amount_received: Number(fd.get("amount_received") || 0), due_date: fd.get("due_date") || null, status: String(fd.get("status")) }); }} className="grid grid-cols-2 gap-3">
                <F n="buyer" l="Buyer" required />
                <F n="invoice_no" l="Invoice #" />
                <F n="invoice_value_usd" l="Value (USD)" type="number" step="0.01" required />
                <F n="amount_received" l="Received" type="number" step="0.01" />
                <F n="due_date" l="Due Date" type="date" />
                <div className="space-y-2"><Label>Status *</Label>
                  <Select name="status" defaultValue="pending" required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable data={data} columns={cols} searchKeys={["buyer", "invoice_no"]} loading={isLoading} />
    </div>
  );
}
function F({ n, l, type = "text", step, required }: { n: string; l: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-2"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
