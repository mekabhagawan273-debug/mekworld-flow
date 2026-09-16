import { WriteGate } from "@/components/WriteGate";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/_app/accounts/expenses")({
  head: () => ({ meta: [{ title: "Expenses · MekWorld Marines ERP" }] }),
  component: Expenses,
});

const COLORS = ["oklch(0.72 0.13 195)", "oklch(0.55 0.13 230)", "oklch(0.68 0.15 155)", "oklch(0.8 0.16 80)", "oklch(0.6 0.18 25)", "oklch(0.6 0.18 300)", "oklch(0.7 0.1 150)"];
const CATS = ["Labour", "Power", "Fuel", "Packaging", "Chemicals", "Transport", "Misc"];

function Expenses() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({ queryKey: ["expenses"], queryFn: async () => (await (supabase.from as any)("expenses").select("*").order("expense_date", { ascending: false })).data ?? [] });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("expenses").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Expense added"); qc.invalidateQueries({ queryKey: ["expenses"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const monthStart = startOfMonth(new Date()).toISOString().slice(0, 10);
  const chart = useMemo(() => {
    const agg: Record<string, number> = {};
    data.filter((r: any) => r.expense_date >= monthStart).forEach((r: any) => { agg[r.category] = (agg[r.category] ?? 0) + Number(r.amount); });
    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [data, monthStart]);
  const cols: Column<any>[] = [
    { key: "expense_date", header: "Date", render: (r) => format(new Date(r.expense_date), "dd MMM yy") },
    { key: "category", header: "Category" },
    { key: "description", header: "Description", render: (r) => r.description ?? "—" },
    { key: "amount", header: "Amount", render: (r) => `₹${Number(r.amount).toLocaleString()}` },
    { key: "paid_by", header: "Paid By", render: (r) => r.paid_by ?? "—" },
  ];
  return (
    <div>
      <PageHeader title="Expenses" subtitle="Daily operational expenses by category"
        actions={
          <WriteGate module="accounts" note >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Expense</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ expense_date: fd.get("expense_date"), category: String(fd.get("category")), description: fd.get("description"), amount: Number(fd.get("amount") || 0), paid_by: fd.get("paid_by") }); }} className="grid grid-cols-2 gap-3">
                  <F n="expense_date" l="Date" type="date" required />
                  <div className="space-y-2"><Label>Category *</Label>
                    <Select name="category" defaultValue="Labour" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><F n="description" l="Description" /></div>
                  <F n="amount" l="Amount (₹)" type="number" step="0.01" required />
                  <F n="paid_by" l="Paid By" />
                  <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </WriteGate>
        }
      />
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-1 p-5"><h3 className="font-semibold mb-3">This Month by Category</h3>
          {chart.length === 0 ? <div className="h-48 grid place-items-center text-sm text-muted-foreground">No expenses</div>
            : <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={chart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>{chart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>}
        </Card>
        <Card className="lg:col-span-2 p-5">
          <h3 className="font-semibold mb-3">Month Totals</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {chart.map((c, i) => <div key={c.name} className="p-3 rounded border"><div className="text-xs text-muted-foreground">{c.name}</div><div className="font-semibold" style={{ color: COLORS[i % COLORS.length] }}>₹{c.value.toLocaleString()}</div></div>)}
          </div>
        </Card>
      </div>
      <DataTable data={data} columns={cols} searchKeys={["category", "description", "paid_by"]} loading={isLoading} />
    </div>
  );
}
function F({ n, l, type = "text", step, required }: { n: string; l: string; type?: string; step?: string; required?: boolean }) {
  return (<div className="space-y-2"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
