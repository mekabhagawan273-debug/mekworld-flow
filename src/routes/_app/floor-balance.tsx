import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, Loader2, ClipboardCheck, History, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { startOfDay } from "date-fns";

export const Route = createFileRoute("/_app/floor-balance")({
  head: () => ({ meta: [{ title: "Floor Balance · MekWorld Marines ERP" }] }),
  component: FloorBalance,
});

function FloorBalance() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => (await supabase.from("materials").select("*").order("name")).data ?? [],
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["floor_entries"],
    queryFn: async () => (await (supabase.from as any)("floor_balance_entries").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const today = startOfDay(new Date()).toISOString();
  const rows = useMemo(() => {
    return materials.map((m: any) => {
      const todays = entries.filter((e: any) => e.material_id === m.id && e.created_at >= today);
      const received = todays.filter((e: any) => e.entry_type === "receipt").reduce((s: number, e: any) => s + Number(e.quantity), 0);
      const issued = todays.filter((e: any) => e.entry_type === "issue").reduce((s: number, e: any) => s + Number(e.quantity), 0);
      const adj = todays.filter((e: any) => e.entry_type === "adjustment").reduce((s: number, e: any) => s + Number(e.quantity), 0);
      const opening = Number(m.current_stock ?? 0) - received + issued - adj;
      const current = opening + received - issued + adj;
      const pct = opening > 0 ? (current / opening) * 100 : 100;
      const status = pct < 10 ? "red" : pct < 20 ? "amber" : "green";
      return { ...m, opening, received, issued, current, pct, status };
    });
  }, [materials, entries, today]);

  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("floor_balance_entries").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Floor entry recorded"); qc.invalidateQueries({ queryKey: ["floor_entries"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      material_id: String(fd.get("material_id")),
      entry_type: String(fd.get("entry_type")),
      quantity: Number(fd.get("quantity")),
      shift: String(fd.get("shift")),
      remarks: fd.get("remarks") || null,
      recorded_by: user?.id,
      recorded_by_name: user?.email,
    });
  };

  const snap = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("floor_balance_snapshots").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Shift closed & snapshot saved"); setShiftOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onCloseShift = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    snap.mutate({
      shift: String(fd.get("shift")),
      supervisor_name: String(fd.get("supervisor_name")),
      snapshot_data: rows.map((r: any) => ({ name: r.name, code: r.code, current: r.current, opening: r.opening, received: r.received, issued: r.issued })),
    });
  };

  const discrepancy = rows.some((r: any) => r.pct < 10);

  const columns: Column<any>[] = [
    { key: "name", header: "Material", render: (r) => <span><span className="font-mono text-xs text-muted-foreground">{r.code}</span> {r.name}</span> },
    { key: "uom", header: "Unit" },
    { key: "opening", header: "Opening", render: (r) => r.opening.toLocaleString() },
    { key: "received", header: "Received", render: (r) => <span className="text-success">+{r.received.toLocaleString()}</span> },
    { key: "issued", header: "Issued", render: (r) => <span className="text-warning">-{r.issued.toLocaleString()}</span> },
    { key: "current", header: "Floor Balance", render: (r) => <span className="font-semibold">{r.current.toLocaleString()}</span> },
    { key: "status", header: "Status", render: (r) =>
        r.status === "green" ? <Badge className="bg-success text-white">Healthy</Badge>
        : r.status === "amber" ? <Badge className="bg-warning text-foreground">Low</Badge>
        : <Badge className="bg-destructive text-destructive-foreground">Critical</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Floor Balance"
        subtitle="Live material balance on the processing floor"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/floor-balance/history"><History className="w-4 h-4 mr-2" />History</Link></Button>
            <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
              <DialogTrigger asChild><Button variant="outline"><ClipboardCheck className="w-4 h-4 mr-2" />Close Shift</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Close Shift & Sign Snapshot</DialogTitle></DialogHeader>
                <form onSubmit={onCloseShift} className="space-y-4">
                  <div className="space-y-2"><Label>Shift *</Label>
                    <Select name="shift" defaultValue="morning" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Supervisor Name *</Label><Input name="supervisor_name" required placeholder="Type your name to sign" /></div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShiftOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={snap.isPending}>{snap.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirm & Sign</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Floor Entry</Button></DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>New Floor Entry</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2"><Label>Material *</Label>
                    <Select name="material_id" required>
                      <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>{materials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.code} — {m.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Type *</Label>
                    <Select name="entry_type" defaultValue="receipt" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="issue">Issue / Used</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Shift</Label>
                    <Select name="shift" defaultValue="morning">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2"><Label>Quantity *</Label><Input name="quantity" type="number" step="0.01" required /></div>
                  <div className="col-span-2 space-y-2"><Label>Remarks</Label><Textarea name="remarks" rows={2} /></div>
                  <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      {discrepancy && (
        <Card className="p-4 mb-4 bg-destructive/10 border-destructive/40 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div className="text-sm"><span className="font-semibold text-destructive">Critical balance alert:</span> one or more materials are below 10% of opening stock. Physical recount may be required.</div>
        </Card>
      )}
      <DataTable data={rows} columns={columns} searchKeys={["name", "code"]} />
    </div>
  );
}
