import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/DataTable";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/floor-balance/history")({
  head: () => ({ meta: [{ title: "Floor Balance History · MekWorld Marines ERP" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["floor_snapshots"],
    queryFn: async () => (await (supabase.from as any)("floor_balance_snapshots").select("*").order("signed_at", { ascending: false })).data ?? [],
  });
  const [selected, setSelected] = useState<any>(null);

  const cols: Column<any>[] = [
    { key: "snapshot_date", header: "Date", render: (r) => format(new Date(r.snapshot_date), "dd MMM yy") },
    { key: "shift", header: "Shift", render: (r) => <Badge variant="secondary">{r.shift}</Badge> },
    { key: "supervisor_name", header: "Supervisor" },
    { key: "signed_at", header: "Signed", render: (r) => format(new Date(r.signed_at), "dd MMM HH:mm") },
    { key: "actions", header: "", render: (r) => <Button size="sm" variant="outline" onClick={() => setSelected(r)}>View</Button> },
  ];

  return (
    <div>
      <PageHeader title="Shift Snapshots" subtitle="Historical floor balance snapshots signed by supervisors" />
      <DataTable data={data} columns={cols} searchKeys={["supervisor_name", "shift"]} loading={isLoading} />
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Snapshot — {selected?.shift} · {selected && format(new Date(selected.snapshot_date), "dd MMM yyyy")}</DialogTitle></DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">Signed by {selected?.supervisor_name} at {selected && format(new Date(selected.signed_at), "dd MMM HH:mm")}</div>
          <div className="max-h-[60vh] overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">Material</th><th className="text-right p-2">Opening</th><th className="text-right p-2">Received</th><th className="text-right p-2">Issued</th><th className="text-right p-2">Balance</th></tr></thead>
              <tbody>
                {(selected?.snapshot_data ?? []).map((r: any, i: number) => (
                  <tr key={i} className="border-t"><td className="p-2">{r.name}</td><td className="text-right p-2">{r.opening}</td><td className="text-right p-2 text-success">+{r.received}</td><td className="text-right p-2 text-warning">-{r.issued}</td><td className="text-right p-2 font-semibold">{r.current}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
