import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { logEdits } from "@/lib/audit-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldAlert, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export type EditField = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "date" | "datetime-local" | "select";
  step?: string;
  options?: { value: string; label: string }[];
};

interface Props {
  table: string;
  record: Record<string, any> | null;
  fields: EditField[];
  invalidateKeys?: string[][];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allowDelete?: boolean;
}

export function SuperAdminEditDialog({
  table, record, fields, invalidateKeys = [], open, onOpenChange, allowDelete = true,
}: Props) {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (record) {
      const v: Record<string, any> = {};
      for (const f of fields) {
        const raw = record[f.name];
        if (f.type === "date" && raw) v[f.name] = String(raw).slice(0, 10);
        else if (f.type === "datetime-local" && raw) v[f.name] = String(raw).slice(0, 16);
        else v[f.name] = raw ?? "";
      }
      setValues(v);
    }
  }, [record, fields]);

  const save = useMutation({
    mutationFn: async () => {
      if (!record) throw new Error("No record");
      const after: Record<string, any> = {};
      for (const f of fields) {
        const v = values[f.name];
        if (f.type === "number") after[f.name] = v === "" || v == null ? null : Number(v);
        else after[f.name] = v === "" ? null : v;
      }
      const { error } = await (supabase.from as any)(table).update(after).eq("id", record.id);
      if (error) throw error;
      await logEdits(table, record.id, record, after);
    },
    onSuccess: () => {
      toast.success("Record updated");
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!record) throw new Error("No record");
      const { error } = await (supabase.from as any)(table).delete().eq("id", record.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record deleted");
      invalidateKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isSuperAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-warning" />
            Super Admin Edit
            <Badge variant="outline" className="font-mono text-xs">{table}</Badge>
          </DialogTitle>
          <DialogDescription>
            Editing record <code className="text-xs">{record?.id}</code>. All changes are logged to the audit trail.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="grid grid-cols-2 gap-4"
        >
          {fields.map((f) => (
            <div key={f.name} className={f.type === "textarea" ? "col-span-2 space-y-2" : "space-y-2"}>
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name} rows={2}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              ) : f.type === "select" ? (
                <Select
                  value={String(values[f.name] ?? "")}
                  onValueChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name} type={f.type ?? "text"} step={f.step}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <DialogFooter className="col-span-2 flex sm:justify-between gap-2">
            {allowDelete ? (
              <Button
                type="button" variant="destructive" size="sm"
                disabled={del.isPending}
                onClick={() => {
                  if (confirm("Permanently delete this record? This cannot be undone.")) del.mutate();
                }}
              >
                {del.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
