import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/DataTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Settings, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin · MekWorld Marines ERP" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin } = useAuth();
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

  const columns: Column<any>[] = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "department", header: "Department", render: (r) => r.department ?? "—" },
    {
      key: "roles", header: "Roles", render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.length === 0 ? <span className="text-muted-foreground text-xs">No role</span>
            : r.roles.map((role: string) => <Badge key={role} variant="secondary" className="text-xs">{role.replace("_", " ")}</Badge>)}
        </div>
      ),
    },
    { key: "is_active", header: "Status", render: (r) => r.is_active
        ? <Badge className="bg-success text-white">Active</Badge>
        : <Badge variant="outline">Inactive</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage users, roles and system settings" />
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
      <DataTable data={users} columns={columns} searchKeys={["email", "full_name"]} loading={isLoading} />
    </div>
  );
}
