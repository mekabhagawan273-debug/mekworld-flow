import { WriteGate } from "@/components/WriteGate";
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
import { Plus, Users, Loader2, LogOut as Out } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/security/visitors")({
  head: () => ({ meta: [{ title: "Visitors · MekWorld Marines ERP" }] }),
  component: Visitors,
});

function Visitors() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("visitors").select("*").order("check_in", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("visitors").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Visitor registered"); qc.invalidateQueries({ queryKey: ["visitors"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const checkOut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("visitors").update({ check_out: new Date().toISOString() }).eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Checked out"); qc.invalidateQueries({ queryKey: ["visitors"] }); },
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      visitor_name: String(fd.get("visitor_name")),
      id_type: fd.get("id_type"),
      id_number: fd.get("id_number"),
      purpose: fd.get("purpose"),
      host_employee: fd.get("host_employee"),
      vehicle_number: fd.get("vehicle_number"),
    });
  };

  const columns: Column<any>[] = [
    { key: "visitor_name", header: "Visitor" },
    { key: "id_type", header: "ID", render: (r) => `${r.id_type ?? "—"} ${r.id_number ?? ""}` },
    { key: "purpose", header: "Purpose" },
    { key: "host_employee", header: "Host" },
    { key: "vehicle_number", header: "Vehicle" },
    { key: "check_in", header: "In", render: (r) => format(new Date(r.check_in), "dd MMM HH:mm") },
    {
      key: "check_out", header: "Out", render: (r) => r.check_out
        ? <span className="text-success">{format(new Date(r.check_out), "HH:mm")}</span>
        : <Badge className="bg-info text-white">Inside</Badge>,
    },
    {
      key: "actions", header: "", render: (r) => !r.check_out && (
        <Button size="sm" variant="outline" onClick={() => checkOut.mutate(r.id)}>
          <Out className="w-3 h-3 mr-1" />Check out
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Visitor Management"
        subtitle="Register and track every visitor in the facility"
        actions={
          <WriteGate module="visitors" note >
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />New Visitor</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Register Visitor</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                  <FF name="visitor_name" label="Visitor name" required />
                  <FF name="id_type" label="ID type (Aadhar / PAN)" />
                  <FF name="id_number" label="ID number" />
                  <FF name="vehicle_number" label="Vehicle number" />
                  <FF name="host_employee" label="Host employee" />
                  <FF name="purpose" label="Purpose of visit" />
                  <DialogFooter className="col-span-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={create.isPending}>
                      {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Check In
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </WriteGate>
        }
      />
      <DataTable data={data} columns={columns} searchKeys={["visitor_name", "host_employee", "vehicle_number"]} loading={isLoading} />
    </div>
  );
}
function FF({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (<div className="space-y-2"><Label>{label}{required && " *"}</Label><Input name={name} required={required} /></div>);
}
