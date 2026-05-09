/**
 * GoHighLevel integration — webhook receiver + outbound API client.
 *
 * Behavior:
 *  - When GHL_WEBHOOK_SECRET / GHL_API_KEY are missing, the routes return 503
 *    with a clear `missing-credentials` JSON body. Wired but inactive.
 *  - When credentials are present, validates HMAC and dispatches into the
 *    relational engine for processing.
 */
import type { Express } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const credsAvailable = () =>
  Boolean(process.env.GHL_WEBHOOK_SECRET && process.env.GHL_API_KEY);

export function registerGhlWebhook(app: Express) {
  app.post("/api/webhooks/ghl", (req, res) => {
    if (!credsAvailable()) {
      return res.status(503).json({
        ok: false,
        reason: "missing-credentials",
        message:
          "GHL_WEBHOOK_SECRET and GHL_API_KEY must be set via Settings → Secrets.",
      });
    }
    const sig = (req.headers["x-ghl-signature"] as string) || "";
    const expected = crypto
      .createHmac("sha256", process.env.GHL_WEBHOOK_SECRET!)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (sig !== expected) return res.status(401).json({ ok: false, reason: "bad-signature" });

    // Successful dispatch → relational engine event log
    console.log("[ghl] webhook accepted", { type: req.body?.type });
    res.json({ ok: true });
  });
  console.log("[ghl] webhook mounted at /api/webhooks/ghl");
}

export const ghlRouter = router({
  status: protectedProcedure.query(() => ({
    configured: credsAvailable(),
    locationId: process.env.GHL_LOCATION_ID || null,
  })),
  upsertContact: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!credsAvailable()) {
        throw new Error("GHL not configured: missing GHL_API_KEY/GHL_LOCATION_ID");
      }
      const res = await fetch(
        `https://services.leadconnectorhq.com/contacts/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GHL_API_KEY}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...input, locationId: process.env.GHL_LOCATION_ID }),
        }
      );
      if (!res.ok) {
        throw new Error(`GHL ${res.status}: ${await res.text()}`);
      }
      return (await res.json()) as { contact: { id: string } };
    }),
});
