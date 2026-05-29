import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Fish, Boxes, Snowflake, ShieldCheck, Truck,
  Users, FileBarChart, Settings, ClipboardList, AlertTriangle,
  PackageOpen, Anchor, DoorOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups: Array<{
  label: string;
  items: Array<{ to: string; icon: any; label: string }>;
}> = [
  {
    label: "OVERVIEW",
    items: [{ to: "/", icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "SHRIMP PROCESSING",
    items: [
      { to: "/shrimp/intake", icon: Fish, label: "Shrimp Intake" },
      { to: "/shrimp/batches", icon: ClipboardList, label: "Processing Batches" },
      { to: "/shrimp/qc", icon: ShieldCheck, label: "Quality Control" },
      { to: "/shrimp/cold-storage", icon: Snowflake, label: "Cold Storage" },
    ],
  },
  {
    label: "SECURITY & GATE",
    items: [
      { to: "/security/visitors", icon: Users, label: "Visitors" },
      { to: "/security/incidents", icon: AlertTriangle, label: "Incidents" },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { to: "/store", icon: Boxes, label: "Store & Materials" },
      { to: "/shipments", icon: Truck, label: "Shipments" },
      { to: "/hr", icon: PackageOpen, label: "HR & Manpower" },
      { to: "/reports", icon: FileBarChart, label: "Reports" },
    ],
  },
  {
    label: "ADMIN",
    items: [{ to: "/admin", icon: Settings, label: "Admin Panel" }],
  },
];

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center shadow-lg">
            <Anchor className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sidebar-accent-foreground text-sm tracking-wide">MEKWORLD</div>
            <div className="text-[11px] text-sidebar-foreground/70 uppercase tracking-widest">Marines ERP</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-2 text-[10px] font-bold text-sidebar-foreground/50 tracking-widest">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = path === it.to || (it.to !== "/" && path.startsWith(it.to));
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-sidebar-border text-[11px] text-sidebar-foreground/60">
          v1.0 · © MekWorld Marines
        </div>
      </aside>
    </>
  );
}
