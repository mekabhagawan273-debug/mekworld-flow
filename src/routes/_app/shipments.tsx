import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/_app/shipments")({
  head: () => ({ meta: [{ title: "Shipments · MekWorld Marines ERP" }] }),
  component: () => (
    <div>
      <PageHeader title="Shipments & Exports" subtitle="Container, BL, vessel and document tracking" />
      <Card className="p-12 text-center border-dashed">
        <Construction className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h3 className="font-semibold mb-1">Module coming soon</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">Shipment, document checklist and status tracker will be enabled in the next phase.</p>
      </Card>
    </div>
  ),
});
