import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logEdits } from "@/lib/audit-log";
import { Lock, Plus, ShieldAlert, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/roles")({
  head: () => ({ meta: [{ title: "Role Management · MekWorld Marines ERP" }] }),
  component: RolesPage,
});

type Role = { id: string; role_name: string; role_display_name: string; is_built_in: boolean; is_active: boolean };

function RolesPage() {
  const { isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisplay, setNewDisplay] = useState("");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles-master"],
    queryFn: async () => {
      const { data } = await supabase.from("roles_master" as any).select("*").order("role_display_name");
      return (data as any) as Role[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["role-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => { map[r.role] = (map[r.role] ?? 0) + 1; });
      return map;
    },
  });

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader title="Role Management" />
        <Card className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-warning mb-3" />
          <h3 className="font-semibold mb-1">Super Admin access required</h3>
          <p className="text-sm text-muted-foreground">Only Super Admin can manage roles.</p>
        </Card>
      </div>
    );
  }

  const toggleActive = async (r: Role) => {
    const next = !r.is_active;
    const { error } = await supabase.from("roles_master" as any).update({ is_active: next }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logEdits("roles_master", r.id, { is_active: r.is_active }, { is_active: next });
    toast.success(`${r.role_display_name} ${next ? "activated" : "deactivated"}`);
    qc.invalidateQueries({ queryKey: ["roles-master"] });
  };

  const removeRole = async (r: Role) => {
    if (r.is_built_in) return;
    if (!confirm(`Delete role "${r.role_display_name}"?`)) return;
    const { error } = await supabase.from("roles_master" as any).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Role deleted");
    qc.invalidateQueries({ queryKey: ["roles-master"] });
  };

  const addRole = async () => {
    const slug = newName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!slug || !newDisplay.trim()) return toast.error("Both fields required");
    const { error } = await supabase.from("roles_master" as any).insert({
      role_name: slug, role_display_name: newDisplay.trim(), is_built_in: false, is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Custom role created");
    setOpen(false); setNewName(""); setNewDisplay("");
    qc.invalidateQueries({ queryKey: ["roles-master"] });
  };

  const columns: Column<Role>[] = [
    { key: "role_display_name", header: "Display Name" },
    { key: "role_name", header: "Role ID", render: (r) => <code className="text-xs">{r.role_name}</code> },
    { key: "is_built_in", header: "Type", render: (r) => r.is_built_in
        ? <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Built-in</Badge>
        : <Badge variant="outline">Custom</Badge> },
    { key: "users", header: "Users", render: (r) => <span className="font-medium">{counts[r.role_name] ?? 0}</span> },
    { key: "is_active", header: "Active", render: (r) => <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} /> },
    { key: "actions", header: "Actions", render: (r) => r.is_built_in
        ? <Button size="sm" variant="ghost" disabled><Lock className="w-4 h-4" /></Button>
        : <Button size="sm" variant="ghost" onClick={() => removeRole(r)} className="text-destructive">Delete</Button> },
  ];

  return (
    <div>
      <PageHeader
        title="Role Management"
        subtitle="Manage system roles, toggle availability, and create custom roles"
        actions={
          <div className="flex gap-2">
            <Link to="/admin/roles/permissions">
              <Button variant="outline">Permissions Matrix</Button>
            </Link>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Custom Role</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Custom Role</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Display Name</Label><Input value={newDisplay} onChange={(e) => setNewDisplay(e.target.value)} placeholder="e.g. Night Supervisor" /></div>
                  <div><Label>Role ID (no spaces)</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="night_supervisor" /></div>
                </div>
                <DialogFooter><Button onClick={addRole}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      <DataTable data={roles} columns={columns} loading={isLoading} searchKeys={["role_display_name", "role_name"]} />
    </div>
  );
}
