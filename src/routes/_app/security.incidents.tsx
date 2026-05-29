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
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/DataTable";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/security/incidents")({
  head: () => ({ meta: [{ title: "Incidents · MekWorld Marines ERP" }] }),
  component: Incidents,
});

const TYPES = ["Accident", "Near Miss", "Security Breach", "Fire", "Theft", "Other"];

function Incidents() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("incidents").select("*").order("incident_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await supabase.from("incidents").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Incident logged"); qc.invalidateQueries({ queryKey: ["incidents"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      incident_type: fd.get("incident_type"),
      description: String(fd.get("description")),
      persons_involved: fd.get("persons_involved"),
      action_taken: fd.get("action_taken"),
      status: fd.get("status"),
    });
  };

  const columns: Column<any>[] = [
    { key: "incident_date", header: "Date", render: (r) => format(new Date(r.incident_date), "dd MMM HH:mm") },
    { key: "incident_type", header: "Type", render: (r) => <Badge variant="outline">{r.incident_type}</Badge> },
    { key: "description", header: "Description", className: "max-w-md" },
    { key: "persons_involved", header: "Involved" },
    {
      key: "status", header: "Status", render: (r) => (
        <Badge className={
          r.status === "Closed" ? "bg-success text-white"
          : r.status === "Under Investigation" ? "bg-warning text-foreground"
          : "bg-destructive text-destructive-foreground"
        }>{r.status}</Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Incident Register"
        subtitle="All safety and security incidents on the premises"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Plus className="w-4 h-4 mr-2" />Log Incident</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Log Incident</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select name="incident_type" defaultValue="Near Miss" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select name="status" defaultValue="Open" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Description *</Label><Textarea name="description" rows={3} required /></div>
                <div className="space-y-2"><Label>Persons involved</Label><Input name="persons_involved" /></div>
                <div className="space-y-2"><Label>Action taken</Label><Textarea name="action_taken" rows={2} /></div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable data={data} columns={columns} searchKeys={["description", "incident_type", "persons_involved"]} loading={isLoading} />
    </div>
  );
}
