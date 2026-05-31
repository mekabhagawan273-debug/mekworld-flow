import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import {
  Users, AlertTriangle, DoorOpen, ClipboardList, Boxes, Inbox, Waves, Fish, Thermometer,
  Truck, UserPlus, ShieldCheck, Wallet, Factory,
} from "lucide-react";
import { format, startOfDay } from "date-fns";

export const Route = createFileRoute("/_app/dashboard/$dept")({
  head: () => ({ meta: [{ title: "Department Dashboard · MekWorld Marines ERP" }] }),
  component: DeptDash,
});

const DEPTS: Record<string, {
  title: string;
  stats: Array<{ label: string; table: string; col?: string; icon: any; color: any; filter?: any }>;
  actions: Array<{ to: string; label: string; icon: any }>;
  recent: string;
}> = {
  security: { title: "Security Gate",
    stats: [
      { label: "Visitors today", table: "visitors", col: "check_in", icon: Users, color: "teal" },
      { label: "Incidents today", table: "incidents", col: "created_at", icon: AlertTriangle, color: "destructive" },
    ],
    actions: [
      { to: "/security/visitors", label: "Register Visitor", icon: Users },
      { to: "/security/incidents", label: "Log Incident", icon: AlertTriangle },
    ], recent: "visitors",
  },
  processing: { title: "Processing Floor",
    stats: [
      { label: "Batches today", table: "processing_batches", col: "created_at", icon: ClipboardList, color: "info" },
      { label: "Intake today", table: "shrimp_intake", col: "created_at", icon: Fish, color: "teal" },
    ],
    actions: [
      { to: "/shrimp/batches", label: "New Batch", icon: ClipboardList },
      { to: "/shrimp/intake", label: "Log Intake", icon: Fish },
      { to: "/floor-balance", label: "Floor Balance", icon: Boxes },
    ], recent: "processing_batches",
  },
  store: { title: "Store & Warehouse",
    stats: [
      { label: "Stock movements today", table: "stock_movements", col: "created_at", icon: Inbox, color: "ocean" },
      { label: "Materials", table: "materials", col: "created_at", icon: Boxes, color: "purple" },
    ],
    actions: [
      { to: "/store", label: "Stock Movement", icon: Inbox },
      { to: "/scan-document", label: "Scan Invoice", icon: ClipboardList },
    ], recent: "stock_movements",
  },
  qc: { title: "Quality Control",
    stats: [
      { label: "Inspections today", table: "qc_inspections", col: "created_at", icon: ShieldCheck, color: "success" },
    ],
    actions: [{ to: "/shrimp/qc", label: "New Inspection", icon: ShieldCheck }], recent: "qc_inspections",
  },
  hr: { title: "HR & Admin",
    stats: [
      { label: "Attendance today", table: "attendance", col: "attendance_date", icon: UserPlus, color: "success" },
      { label: "Employees", table: "employees", col: "created_at", icon: Users, color: "teal" },
    ],
    actions: [{ to: "/hr", label: "Mark Attendance", icon: UserPlus }], recent: "attendance",
  },
  accounts: { title: "Accounts",
    stats: [
      { label: "Purchases today", table: "purchases", col: "created_at", icon: Wallet, color: "info" },
      { label: "Expenses today", table: "expenses", col: "created_at", icon: Wallet, color: "warning" },
    ],
    actions: [
      { to: "/accounts/purchases", label: "Add Purchase", icon: Wallet },
      { to: "/accounts/expenses", label: "Add Expense", icon: Wallet },
    ], recent: "purchases",
  },
  pond: { title: "Pond Operations",
    stats: [
      { label: "Active ponds", table: "ponds", col: "created_at", icon: Waves, color: "teal", filter: { status: "active" } },
      { label: "Water entries today", table: "pond_water_quality", col: "created_at", icon: Waves, color: "ocean" },
    ],
    actions: [{ to: "/ponds", label: "Open Ponds", icon: Waves }], recent: "pond_water_quality",
  },
  shipment: { title: "Shipment & Export",
    stats: [{ label: "Shipments today", table: "shipments", col: "created_at", icon: Truck, color: "navy" }],
    actions: [{ to: "/shipments", label: "New Shipment", icon: Truck }], recent: "shipments",
  },
  canteen: { title: "Canteen",
    stats: [],
    actions: [{ to: "/hr", label: "Attendance", icon: UserPlus }], recent: "attendance",
  },
  maintenance: { title: "Maintenance",
    stats: [{ label: "Breakdowns today", table: "plant_breakdowns", col: "created_at", icon: Factory, color: "warning" }],
    actions: [{ to: "/plants", label: "Open Plants", icon: Factory }, { to: "/temperature-log", label: "Temp Log", icon: Thermometer }], recent: "plant_breakdowns",
  },
};

function DeptDash() {
  const { dept } = Route.useParams();
  const { user } = useAuth();
  const cfg = DEPTS[dept];
  const todayIso = startOfDay(new Date()).toISOString();

  const { data: statValues = [] } = useQuery({
    queryKey: ["dept_stats", dept],
    queryFn: async () => {
      if (!cfg) return [];
      const out = await Promise.all(cfg.stats.map(async (s) => {
        let q = (supabase.from as any)(s.table).select("*", { count: "exact", head: true });
        if (s.col) q = q.gte(s.col, todayIso);
        if (s.filter) Object.entries(s.filter).forEach(([k, v]) => { q = q.eq(k, v); });
        const { count } = await q;
        return count ?? 0;
      }));
      return out;
    },
    enabled: !!cfg,
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["dept_recent", dept],
    queryFn: async () => {
      if (!cfg) return [];
      const { data } = await (supabase.from as any)(cfg.recent).select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: !!cfg,
  });

  if (!cfg) return <Card className="p-10 text-center text-muted-foreground">Unknown department: {dept}</Card>;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-navy via-navy to-[oklch(0.24_0.06_240)] text-navy-foreground border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{cfg.title} Dashboard</h1>
            <p className="text-navy-foreground/70 text-sm">{user?.email}</p>
          </div>
          <div className="md:text-right">
            <div className="text-xs uppercase tracking-widest text-navy-foreground/60">{format(new Date(), "EEEE")}</div>
            <div className="text-xl font-semibold">{format(new Date(), "dd MMMM yyyy")}</div>
          </div>
        </div>
      </Card>

      {cfg.stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {cfg.stats.map((s, i) => <StatCard key={s.label} label={s.label} value={statValues[i] ?? 0} icon={s.icon} color={s.color} />)}
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {cfg.actions.map((a) => { const I = a.icon; return (
            <Button asChild key={a.to} className="bg-teal text-teal-foreground hover:bg-teal/90"><Link to={a.to}><I className="w-4 h-4 mr-2" />{a.label}</Link></Button>
          ); })}
        </div>
      </div>

      <Card>
        <div className="p-4 font-semibold border-b">Recent Activity</div>
        <div className="divide-y">{recent.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No recent activity</div>
          : recent.map((r: any) => (
            <div key={r.id} className="p-3 text-sm flex items-center justify-between">
              <span className="truncate">{r.visitor_name || r.batch_id || r.invoice_no || r.machine_name || r.description || r.id.slice(0, 8)}</span>
              <span className="text-xs text-muted-foreground">{r.created_at ? format(new Date(r.created_at), "dd MMM HH:mm") : ""}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
