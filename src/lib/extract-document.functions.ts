import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PROMPT = `Extract all data from this document. Return strict JSON with fields: document_type (string), supplier_name (string), date (string YYYY-MM-DD), invoice_number (string), items (array of {item_name, quantity, unit, unit_price, total}), grand_total (number), remarks (string). Use null when not found. Output JSON only — no prose, no code fences.`;

export const extractDocument = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ image_base64: z.string().min(10), mime_type: z.string().min(3) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { error: "AI gateway not configured", extracted: null };
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a document data extraction assistant. Always reply with valid JSON only." },
            { role: "user", content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: `data:${data.mime_type};base64,${data.image_base64}` } },
            ] },
          ],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        return { error: `AI gateway ${res.status}: ${t.slice(0, 200)}`, extracted: null };
      }
      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      const cleaned = content.replace(/```json|```/g, "").trim();
      let parsed: any = null;
      try { parsed = JSON.parse(cleaned); } catch {
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
      }
      return { error: null, extracted: parsed, raw: content };
    } catch (e: any) {
      return { error: e?.message ?? "extraction failed", extracted: null };
    }
  });
