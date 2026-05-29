import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

function ComingSoon({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="p-12 text-center border-dashed">
        <Construction className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold mb-1">Module coming soon</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This module is part of the rollout plan. The core shrimp processing, security, dashboard and admin modules are live — additional modules will follow in the next iteration.
        </p>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/_app/store")({
  head: () => ({ meta: [{ title: "Store · MekWorld Marines ERP" }] }),
  component: () => <ComingSoon title="Store & Materials" subtitle="RM/GM/CM Inward & Outward, supplier master, stock ledger" />,
});
