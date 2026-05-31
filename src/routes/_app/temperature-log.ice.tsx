import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, ArrowLeft, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/temperature-log/ice")({
  head: () => ({ meta: [{ title: "Ice Log · MekWorld Marines ERP" }] }),
  component: IceLog,
});

function IceLog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["ice_log"], queryFn: async () => (await (supabase.from as any)("ice_log").select("*").order("log_date", { ascending: false })).data ?? [] });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("ice_log").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["ice_log"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const balance = data.reduce((s: number, r: any) => s + Number(r.ice_produced_kg) - Number(r.ice_consumed_kg), 0);
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/temperature-log"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link></Button>
      <PageHeader title="Ice Usage Log" subtitle="Daily ice production and consumption"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ice Entry</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); create.mutate({ log_date: fd.get("log_date"), ice_produced_kg: Number(fd.get("ice_produced_kg") || 0), ice_consumed_kg: Number(fd.get("ice_consumed_kg") || 0), recorded_by: fd.get("recorded_by") }); }} className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Date *</Label><Input name="log_date" type="date" required /></div>
                <div className="space-y-2"><Label>Recorded By</Label><Input name="recorded_by" /></div>
                <div className="space-y-2"><Label>Produced (kg)</Label><Input name="ice_produced_kg" type="number" step="0.01" /></div>
                <div className="space-y-2"><Label>Consumed (kg)</Label><Input name="ice_consumed_kg" type="number" step="0.01" /></div>
                <DialogFooter className="col-span-2"><Button type="submit" disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-5 mb-4 flex items-center gap-4"><Snowflake className="w-10 h-10 text-teal" />
        <div><div className="text-xs uppercase text-muted-foreground">Running Balance</div><div className="text-3xl font-bold">{balance.toLocaleString()} kg</div></div>
      </Card>
      <Card className="overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr>{["Date","Produced","Consumed","Net","By"].map(h => <th key={h} className="p-2 text-left">{h}</th>)}</tr></thead>
        <tbody>{data.map((r: any) => <tr key={r.id} className="border-t"><td className="p-2">{format(new Date(r.log_date), "dd MMM yy")}</td><td className="p-2 text-success">+{r.ice_produced_kg}</td><td className="p-2 text-warning">-{r.ice_consumed_kg}</td><td className="p-2 font-semibold">{Number(r.ice_produced_kg) - Number(r.ice_consumed_kg)}</td><td className="p-2">{r.recorded_by ?? "—"}</td></tr>)}</tbody>
      </table></Card>
    </div>
  );
}
