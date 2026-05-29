import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const colorMap = {
  teal: "from-teal/90 to-teal text-teal-foreground",
  ocean: "from-ocean/80 to-ocean text-white",
  success: "from-success/80 to-success text-white",
  warning: "from-warning/80 to-warning text-foreground",
  info: "from-info/80 to-info text-white",
  destructive: "from-destructive/80 to-destructive text-destructive-foreground",
  navy: "from-navy/90 to-navy text-navy-foreground",
  purple: "from-[oklch(0.6_0.18_300)] to-[oklch(0.5_0.18_300)] text-white",
} as const;

export function StatCard({
  label, value, icon: Icon, color = "teal",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
}) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow border-border/60 gap-2 flex flex-col">
      <div className="flex items-start justify-between">
        <div className={cn(
          "w-10 h-10 rounded-lg grid place-items-center bg-gradient-to-br shadow-sm",
          colorMap[color]
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
    </Card>
  );
}
