import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { timingSafeEqual } from "crypto";

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  recovery_key: z.string().min(16).max(512),
});

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/recover-super-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = BodySchema.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ error: "Invalid input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const expected = process.env.SUPER_ADMIN_RECOVERY_KEY;
        if (!expected || !safeEqual(parsed.recovery_key, expected)) {
          return new Response(
            JSON.stringify({ error: "Invalid email or recovery key" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        // Find user by email via admin listUsers (paginate up to a reasonable cap)
        let userId: string | null = null;
        for (let page = 1; page <= 20 && !userId; page++) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: 200,
          });
          if (error) {
            return new Response(
              JSON.stringify({ error: "Lookup failed" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }
          const match = data.users.find(
            (u) => u.email?.toLowerCase() === parsed.email.toLowerCase(),
          );
          if (match) userId = match.id;
          if (data.users.length < 200) break;
        }

        if (!userId) {
          return new Response(
            JSON.stringify({ error: "Invalid email or recovery key" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        // Idempotent insert
        const { error: insertErr } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "super_admin" });
        if (insertErr && !/duplicate|unique/i.test(insertErr.message)) {
          return new Response(
            JSON.stringify({ error: "Failed to grant role" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        await supabaseAdmin.from("edit_audit_log").insert({
          table_name: "recovery",
          record_id: userId,
          field_changed: "super_admin_granted",
          old_value: null,
          new_value: parsed.email,
          edited_by: userId,
          edited_by_name: "RECOVERY",
        });

        return new Response(
          JSON.stringify({ success: true, message: "Super Admin role granted" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
