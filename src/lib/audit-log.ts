import { supabase } from "@/integrations/supabase/client";

/**
 * Diff two records and log changed fields to edit_audit_log.
 * Only call this when a Super Admin edits an existing record.
 */
export async function logEdits(
  tableName: string,
  recordId: string,
  before: Record<string, any>,
  after: Record<string, any>,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  let name: string | null = null;
  try {
    const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    name = data?.full_name ?? user.email ?? null;
  } catch { /* ignore */ }

  const rows: any[] = [];
  for (const k of Object.keys(after)) {
    const o = before?.[k];
    const n = after[k];
    if (JSON.stringify(o ?? null) !== JSON.stringify(n ?? null)) {
      rows.push({
        table_name: tableName,
        record_id: recordId,
        field_changed: k,
        old_value: o == null ? null : String(o),
        new_value: n == null ? null : String(n),
        edited_by: user.id,
        edited_by_name: name,
      });
    }
  }
  if (rows.length) await supabase.from("edit_audit_log" as any).insert(rows);
}
