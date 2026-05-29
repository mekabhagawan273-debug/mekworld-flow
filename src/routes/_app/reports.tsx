import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { FileBarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports · MekWorld Marines ERP" }] }),
  component: Reports,
});

const REPORTS = [
  { key: "shrimp_intake", title: "Shrimp Intake Report", desc: "All shrimp deliveries" },
  { key: "processing_batches", title: "Production Batches Report", desc: "Batch-wise yield and production" },
  { key: "qc_inspections", title: "QC Inspections Report", desc: "Pass/fail ratio per batch" },
  { key: "cold_storage", title: "Cold Storage Report", desc: "Current frozen stock by chamber" },
  { key: "visitors", title: "Visitor Report", desc: "Daily visitor log" },
  { key: "incidents", title: "Incident Summary", desc: "All incidents by type and status" },
] as const;

function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Export operational reports to Excel or PDF" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => <ReportCard key={r.key} table={r.key} title={r.title} desc={r.desc} />)}
      </div>
    </div>
  );
}

function ReportCard({ key: table, title, desc }: { key: string; title: string; desc: string }) {
  const { data = [] } = useQuery({
    queryKey: ["report", table],
    queryFn: async () => {
      const { data } = await supabase.from(table as any).select("*").limit(1000);
      return (data ?? []) as any[];
    },
  });

  const xlsx = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 28));
    XLSX.writeFile(wb, `${table}-${format(new Date(), "yyyyMMdd")}.xlsx`);
  };
  const pdf = () => {
    const doc = new jsPDF("l");
    doc.setFontSize(14); doc.text(`MekWorld Marines — ${title}`, 14, 14);
    doc.setFontSize(9); doc.text(format(new Date(), "dd MMM yyyy HH:mm"), 14, 20);
    if (data.length) {
      const headers = Object.keys(data[0]).slice(0, 8);
      autoTable(doc, {
        startY: 26, head: [headers],
        body: data.map((r) => headers.map((h) => String(r[h] ?? "").slice(0, 32))),
        styles: { fontSize: 7 }, headStyles: { fillColor: [13, 27, 42] },
      });
    } else doc.text("No data", 14, 30);
    doc.save(`${table}-${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-teal/15 text-teal grid place-items-center">
          <FileBarChart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.length} records</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={xlsx}><Download className="w-3 h-3 mr-1" />Excel</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={pdf}><Download className="w-3 h-3 mr-1" />PDF</Button>
      </div>
    </Card>
  );
}
