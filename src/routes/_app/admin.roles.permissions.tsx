import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/roles/permissions")({
  head: () => ({ meta: [{ title: "Permissions Matrix · MekWorld Marines ERP" }] }),
  component: PermissionsPage,
});

const MODULES = [
  "Visitors","Incidents","RM Inward","Batches","QC","Cold Storage",
  "Ponds","Plants","Shipments","HR","Floor Balance","Scan Document",
  "Temperature Log","Purchases","Expenses","Receivables","Analytics","Admin Panel",
];

// permission per role: ['c','v','e','d'] (super_admin), ['c','v'] (most), ['v'] (read-only)
function permsFor(role: string, mod: string): string[] {
  if (role === "super_admin") return ["c","v","e","d"];
  if (role === "admin") {
    if (mod === "Admin Panel") return ["v"];
    return ["c","v"];
  }
  if (mod === "Admin Panel") return [];
  // department mapping (lenient: view + create on relevant modules, view-only elsewhere)
  const map: Record<string, string[]> = {
    security_officer: ["Visitors","Incidents"],
    gate_guard: ["Visitors"],
    processing_supervisor: ["Batches","QC","Floor Balance","RM Inward"],
    qc_inspector: ["QC","Cold Storage","Temperature Log"],
    store_manager: ["RM Inward","Floor Balance","Scan Document"],
    hr_manager: ["HR"],
    accounts_officer: ["Purchases","Expenses","Receivables","Shipments"],
    pond_supervisor: ["Ponds"],
    maintenance_technician: ["Plants"],
    canteen_staff: [],
  };
  const allowed = map[role] ?? [];
  if (allowed.includes(mod)) return ["c","v"];
  return ["v"];
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
