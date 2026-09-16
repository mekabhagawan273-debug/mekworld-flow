import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { canWriteWithRoles, type WriteModule } from "@/lib/permissions";

export const Route = createFileRoute("/_app/admin/roles/permissions")({
  head: () => ({ meta: [{ title: "Permissions Matrix · MekWorld Marines ERP" }] }),
  component: PermissionsPage,
});

const MODULES = [
  "Visitors","Incidents","RM Inward","Batches","QC","Cold Storage",
  "Ponds","Plants","Shipments","HR","Floor Balance","Scan Document",
  "Temperature Log","Purchases","Expenses","Receivables","Analytics","Admin Panel",
];

const MODULE_KEY: Record<string, WriteModule> = {
  "Visitors": "visitors", "Incidents": "incidents", "RM Inward": "intake",
  "Batches": "batches", "QC": "qc", "Cold Storage": "cold_storage",
  "Ponds": "ponds", "Plants": "plants", "Shipments": "shipments", "HR": "hr",
  "Floor Balance": "floor_balance", "Scan Document": "scan",
  "Temperature Log": "temperature", "Purchases": "accounts",
  "Expenses": "accounts", "Receivables": "accounts", "Analytics": "accounts",
  "Admin Panel": "admin",
};

// permission per role: ['c','v','e','d'] (super_admin), ['c','v'], or ['v']
function permsFor(role: string, mod: string): string[] {
  if (role === "super_admin") return ["c", "v", "e", "d"];
  const key = MODULE_KEY[mod];
  if (mod === "Analytics") return role === "admin" || role === "accounts_officer" ? ["v"] : ["v"];
  if (mod === "Admin Panel") return role === "admin" ? ["v"] : [];
  return canWriteWithRoles([role], key) ? ["c", "v"] : ["v"];
}

const BADGE: Record<string, string> = {
  c: "bg-info/20 text-info",
  v: "bg-muted text-foreground/70",
  e: "bg-warning/20 text-warning",
  d: "bg-destructive/20 text-destructive",
};

function PermissionsPage() {
  const { isSuperAdmin } = useAuth();
  const { data: roles = [] } = useQuery({
    queryKey: ["roles-master-active"],
    queryFn: async () => {
      const { data } = await supabase.from("roles_master" as any).select("*").eq("is_active", true).order("role_display_name");
      return (data as any[]) ?? [];
    },
  });

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader title="Permissions Matrix" />
        <Card className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-warning mb-3" />
          <h3 className="font-semibold">Super Admin access required</h3>
        </Card>
      </div>
    );
  }

  const exportPdf = () => window.print();

  return (
    <div>
      <PageHeader
        title="Role Permissions Matrix"
        subtitle="Read-only overview of what each role can do across modules"
        actions={<Button variant="outline" onClick={exportPdf}><Download className="w-4 h-4 mr-2" />Export as PDF</Button>}
      />
      <Card className="p-5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left p-2 sticky left-0 bg-card">Role</th>
              {MODULES.map((m) => <th key={m} className="p-2 text-center font-medium text-muted-foreground whitespace-nowrap">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-medium sticky left-0 bg-card whitespace-nowrap">{r.role_display_name}</td>
                {MODULES.map((m) => {
                  const ps = permsFor(r.role_name, m);
                  return (
                    <td key={m} className="p-2 text-center">
                      {ps.length === 0 ? <span className="text-muted-foreground">—</span> : (
                        <div className="flex justify-center gap-0.5">
                          {ps.map((p) => (
                            <span key={p} className={cn("inline-block w-5 h-5 rounded text-[10px] font-bold leading-5", BADGE[p])}>{p.toUpperCase()}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <span><span className={cn("inline-block w-4 h-4 rounded mr-1 align-middle", BADGE.c)} />Create</span>
          <span><span className={cn("inline-block w-4 h-4 rounded mr-1 align-middle", BADGE.v)} />View</span>
          <span><span className={cn("inline-block w-4 h-4 rounded mr-1 align-middle", BADGE.e)} />Edit (Super Admin only)</span>
          <span><span className={cn("inline-block w-4 h-4 rounded mr-1 align-middle", BADGE.d)} />Delete (Super Admin only)</span>
        </div>
      </Card>
    </div>
  );
}
