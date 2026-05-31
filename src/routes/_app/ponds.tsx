import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2, Waves, FileBarChart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ponds")({
  head: () => ({ meta: [{ title: "Pond Management · MekWorld Marines ERP" }] }),
  component: PondsList,
});

const statusColor: Record<string, string> = {
  active: "bg-success text-white",
  fallow: "bg-muted text-foreground",
  harvesting: "bg-warning text-foreground",
  treatment: "bg-destructive text-destructive-foreground",
};

function PondsList() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["ponds"],
    queryFn: async () => (await (supabase.from as any)("ponds").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (p: any) => { const { error } = await (supabase.from as any)("ponds").insert(p); if (error) throw error; },
    onSuccess: () => { toast.success("Pond created"); qc.invalidateQueries({ queryKey: ["ponds"] }); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    create.mutate({
      pond_code: String(fd.get("pond_code")),
      name: String(fd.get("name")),
      size_acres: Number(fd.get("size_acres") || 0),
      pond_type: String(fd.get("pond_type")),
      status: String(fd.get("status")),
      species: fd.get("species") || null,
    });
  };

  return (
    <div>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Pond Management <Badge variant="secondary">{data.length} ponds</Badge></span> as any}
        subtitle="Master list of all aquaculture ponds"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/ponds/reports"><FileBarChart className="w-4 h-4 mr-2" />Reports</Link></Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="bg-teal text-teal-foreground hover:bg-teal/90"><Plus className="w-4 h-4 mr-2" />Add Pond</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Pond</DialogTitle></DialogHeader>
                <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
                  <Fld n="pond_code" l="Pond Code" required />
                  <Fld n="name" l="Name" required />
                  <Fld n="size_acres" l="Size (acres)" type="number" step="0.01" />
                  <div className="space-y-2"><Label>Type *</Label>
                    <Select name="pond_type" defaultValue="grow_out" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grow_out">Grow-out</SelectItem>
                        <SelectItem value="nursery">Nursery</SelectItem>
                        <SelectItem value="brood">Brood</SelectItem>
                        <SelectItem value="hatchery">Hatchery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Status *</Label>
                    <Select name="status" defaultValue="active" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="fallow">Fallow</SelectItem>
                        <SelectItem value="harvesting">Harvesting</SelectItem>
                        <SelectItem value="treatment">Under Treatment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Species</Label>
                    <Select name="species">
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vannamei">Vannamei</SelectItem>
                        <SelectItem value="Tiger">Tiger</SelectItem>
                        <SelectItem value="Black Tiger">Black Tiger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
      {isLoading ? <div className="text-center py-10 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
        : data.length === 0 ? <Card className="p-10 text-center text-muted-foreground"><Waves className="w-10 h-10 mx-auto mb-2 opacity-40" /><div>No ponds yet</div></Card>
        : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((p: any) => (
              <Link to="/ponds/$id" params={{ id: p.id }} key={p.id}>
                <Card className="p-4 hover:shadow-lg hover:border-teal/40 transition cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs font-mono text-muted-foreground">{p.pond_code}</div>
                      <div className="font-semibold">{p.name}</div>
                    </div>
                    <Waves className="w-5 h-5 text-teal" />
                  </div>
                  <div className="text-xs text-muted-foreground">{p.size_acres ?? "—"} acres</div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{p.pond_type}</Badge>
                    <Badge className={statusColor[p.status] ?? ""}>{p.status}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

function Fld({ n, l, type = "text", required, step }: { n: string; l: string; type?: string; required?: boolean; step?: string }) {
  return (<div className="space-y-2"><Label>{l}{required && " *"}</Label><Input name={n} type={type} step={step} required={required} /></div>);
}
