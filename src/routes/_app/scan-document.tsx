import { WriteGate } from "@/components/WriteGate";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { extractDocument } from "@/lib/extract-document.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, ScanLine, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/scan-document")({
  head: () => ({ meta: [{ title: "Scan Document · MekWorld Marines ERP" }] }),
  component: ScanDoc,
});

const MODULES = [
  { v: "rm_inward", l: "RM Inward (Stock Movement)" },
  { v: "gm_inward", l: "GM Inward (Stock Movement)" },
  { v: "cm_inward", l: "CM Inward (Stock Movement)" },
  { v: "shipment", l: "Shipment" },
  { v: "purchase", l: "Accounts — Purchase Register" },
];

function ScanDoc() {
  const { user } = useAuth();
  const extract = useServerFn(extractDocument);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [target, setTarget] = useState("rm_inward");

  const onFile = async (f: File) => {
    if (f.size > 10 * 1024 * 1024) return toast.error("File must be under 10MB");
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setForm(null);
    setLoading(true);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      const out = await extract({ data: { image_base64: b64, mime_type: f.type || "image/jpeg" } });
      if (out.error || !out.extracted) {
        toast.error(out.error || "Could not extract data");
        setForm({ document_type: "", supplier_name: "", date: "", invoice_number: "", grand_total: 0, remarks: "" });
      } else {
        toast.success("Document parsed");
        setForm({ items: [], ...out.extracted });
      }
    } catch (e: any) { toast.error(e?.message || "AI request failed"); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!form || !file) return;
    setSaving(true);
    try {
      // Upload original
      const path = `${user?.id || "anon"}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("scanned-documents").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("scanned-documents").getPublicUrl(path);
      const docUrl = pub.publicUrl;

      // Push to target module
      const items = Array.isArray(form.items) ? form.items : [];
      const totalQty = items.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);

      if (target === "purchase") {
        await (supabase.from as any)("purchases").insert({
          supplier_name: form.supplier_name || "Unknown",
          invoice_no: form.invoice_number || null,
          purchase_date: form.date || new Date().toISOString().slice(0, 10),
          items: items.map((i: any) => `${i.item_name} x${i.quantity}`).join("; "),
          amount: Number(form.grand_total || 0),
          total: Number(form.grand_total || 0),
          payment_status: "pending",
        });
      } else if (target === "shipment") {
        await supabase.from("shipments").insert({
          notes: `From scan: ${form.invoice_number || ""} ${form.supplier_name || ""}`.trim(),
          total_quantity_kg: totalQty,
          invoice_value: Number(form.grand_total || 0),
          status: "planned",
        } as any);
      } else {
        // RM/GM/CM inward — create a stock_movement (generic)
        await supabase.from("stock_movements").insert({
          movement_type: "in",
          quantity: totalQty || 0,
          reference_no: form.invoice_number || null,
          notes: `Scanned: ${form.supplier_name || ""} — ${target.toUpperCase()}`,
        } as any);
      }

      await (supabase.from as any)("scanned_documents").insert({
        document_url: docUrl,
        document_type: form.document_type || null,
        target_module: target,
        extracted_data: form,
        uploaded_by: user?.id,
      });
      toast.success(`Data saved to ${MODULES.find(m => m.v === target)?.l}`);
      setFile(null); setPreviewUrl(""); setForm(null);
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Scan Document" subtitle="AI-powered data extraction from invoices, GRNs and shipment docs" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">1. Upload Document</h3>
          {!previewUrl ? (
            <label className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition">
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div className="text-sm text-center">
                <div className="font-medium">Drop file here or click to browse</div>
                <div className="text-xs text-muted-foreground">JPG, PNG, PDF · up to 10 MB</div>
              </div>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            </label>
          ) : (
            <div className="space-y-3">
              {file?.type.startsWith("image/")
                ? <img src={previewUrl} alt="preview" className="w-full max-h-[480px] object-contain border rounded" />
                : <iframe src={previewUrl} className="w-full h-[480px] border rounded" title="preview" />}
              <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreviewUrl(""); setForm(null); }}>Replace</Button>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">2. Review Extracted Data</h3>
          {loading ? (
            <div className="h-60 grid place-items-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2"><Loader2 className="w-6 h-6 animate-spin" /><div>Reading document with AI...</div></div>
            </div>
          ) : !form ? (
            <div className="h-60 grid place-items-center text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-2"><ScanLine className="w-8 h-8 opacity-40" /><div>Upload a document to begin</div></div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Fld label="Document Type" value={form.document_type} onChange={(v) => setForm({ ...form, document_type: v })} />
                <Fld label="Supplier" value={form.supplier_name} onChange={(v) => setForm({ ...form, supplier_name: v })} />
                <Fld label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                <Fld label="Invoice #" value={form.invoice_number} onChange={(v) => setForm({ ...form, invoice_number: v })} />
                <Fld label="Grand Total" type="number" value={form.grand_total} onChange={(v) => setForm({ ...form, grand_total: v })} />
              </div>
              <div className="space-y-1">
                <Label>Items ({(form.items ?? []).length})</Label>
                <div className="border rounded max-h-48 overflow-auto text-xs">
                  {(form.items ?? []).length === 0 ? <div className="p-3 text-muted-foreground">No items extracted</div> :
                    (form.items ?? []).map((it: any, i: number) => (
                      <div key={i} className="border-t p-2 flex justify-between"><span>{it.item_name}</span><span>{it.quantity} {it.unit} · ₹{it.total}</span></div>
                    ))}
                </div>
              </div>
              <div className="space-y-1"><Label>Remarks</Label><Textarea value={form.remarks ?? ""} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} /></div>
              <div className="space-y-1"><Label>Push to Module</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODULES.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <WriteGate module="scan" note>
                <Button onClick={save} disabled={saving} className="w-full bg-teal text-teal-foreground hover:bg-teal/90">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Save to Module
                </Button>
              </WriteGate>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Fld({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} />
    </div>
  );
}
