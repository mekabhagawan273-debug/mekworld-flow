import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logEdits } from "@/lib/audit-log";
import { Settings, ShieldAlert, Shield, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin · MekWorld Marines ERP" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        if (!roleMap.has(r.user_id)) roleMap.set(r.user_id, []);
        roleMap.get(r.user_id)!.push(r.role);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
    enabled: isAdmin,
  });

  const { data: rolesMaster = [] } = useQuery({
    queryKey: ["roles-master-active"],
    queryFn: async () => {
      const { data } = await supabase.from("roles_master" as any).select("*").eq("is_active", true).order("role_display_name");
      return (data as any[]) ?? [];
    },
    enabled: isAdmin,
  });

  const { data: audit = [], isLoading: auditLoading } = useQuery({
    queryKey: ["edit-audit"],
    queryFn: async () => {
      const { data } = await supabase.from("edit_audit_log" as any).select("*").order("edited_at", { ascending: false }).limit(500);
      return (data as any[]) ?? [];
    },
    enabled: isSuperAdmin,
  });

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Admin Panel" subtitle="System management and configuration" />
        <Card className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-warning mb-3" />
          <h3 className="font-semibold mb-1">Admin access required</h3>
          <p className="text-sm text-muted-foreground">You need Super Admin or Admin role to view this section.</p>
        </Card>
      </div>
    );
  }

  const changeRole = async (userId: string, currentRole: string | undefined, newRole: string) => {
    if (!isSuperAdmin) return toast.error("Only Super Admin can change roles");
    if (currentRole) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", currentRole as any);
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) return toast.error(error.message);
    await logEdits("profiles", userId, { role: currentRole ?? "" }, { role: newRole });
    toast.success("Role updated. User will see the new role on next login.");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (error) return toast.error(error.message);
    toast.success(`Password reset email sent to ${email}`);
  };

  const userColumns: Column<any>[] = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    {
      key: "roles", header: "Roles", render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.length === 0 ? <span className="text-muted-foreground text-xs">No role</span>
            : r.roles.map((role: string) => <Badge key={role} variant="secondary" className="text-xs">{role.replace(/_/g, " ")}</Badge>)}
        </div>
      ),
    },
    ...(isSuperAdmin ? [{
      key: "change", header: "Change Role", render: (r: any) => (
        <Select value={r.roles[0] ?? ""} onValueChange={(v) => changeRole(r.id, r.roles[0], v)}>
          <SelectTrigger className="w-44 h-8"><SelectValue placeholder="Assign…" /></SelectTrigger>
          <SelectContent>
            {rolesMaster.map((rm: any) => (
              <SelectItem key={rm.role_name} value={rm.role_name}>{rm.role_display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    } as Column<any>] : []),
    ...(isSuperAdmin ? [{
      key: "actions", header: "Actions", render: (r: any) => (
        <Button size="sm" variant="ghost" onClick={() => resetPassword(r.email)}>
          <KeyRound className="w-3 h-3 mr-1" />Reset Password
        </Button>
      ),
    } as Column<any>] : []),
    { key: "is_active", header: "Status", render: (r) => r.is_active
        ? <Badge className="bg-success text-white">Active</Badge>
        : <Badge variant="outline">Inactive</Badge> },
  ];

  const auditColumns: Column<any>[] = [
    { key: "edited_at", header: "Date & Time", render: (r) => new Date(r.edited_at).toLocaleString() },
    { key: "table_name", header: "Table" },
    { key: "record_id", header: "Record", render: (r) => <code className="text-xs">{r.record_id?.slice(0, 8)}</code> },
    { key: "field_changed", header: "Field" },
    { key: "old_value", header: "Old Value", render: (r) => <span className="text-destructive">{r.old_value ?? "—"}</span> },
    { key: "new_value", header: "New Value", render: (r) => <span className="text-success">{r.new_value ?? "—"}</span> },
    { key: "edited_by_name", header: "Edited By", render: (r) => r.edited_by_name ?? "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        subtitle="Manage users, roles and system settings"
        actions={isSuperAdmin && (
          <div className="flex gap-2">
            <Link to="/admin/roles"><Button variant="outline"><Shield className="w-4 h-4 mr-2" />Role Management</Button></Link>
            <Link to="/admin/roles/permissions"><Button variant="outline">Permissions Matrix</Button></Link>
          </div>
        )}
      />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit" disabled={!isSuperAdmin}>Edit History {isSuperAdmin && audit.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{audit.length}</Badge>}</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <Card className="p-5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy text-navy-foreground grid place-items-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">User Management</h3>
                <p className="text-sm text-muted-foreground">All registered users and their assigned roles</p>
              </div>
            </div>
          </Card>
          <DataTable data={users} columns={userColumns} searchKeys={["email", "full_name"]} loading={isLoading} />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <Card className="p-5 mb-4">
            <h3 className="font-semibold">Edit Audit Trail</h3>
            <p className="text-sm text-muted-foreground">Every field-level change made by Super Admin to existing records</p>
          </Card>
          <DataTable data={audit} columns={auditColumns} searchKeys={["table_name", "field_changed", "edited_by_name"]} loading={auditLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
