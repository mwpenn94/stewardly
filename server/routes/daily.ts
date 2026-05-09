/**
 * Daily.co video rooms — wired but credentials-gated.
 * Uses DAILY_API_KEY when set; returns "not-configured" otherwise.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

const credsAvailable = () => Boolean(process.env.DAILY_API_KEY);

export const dailyRouter = router({
  status: protectedProcedure.query(() => ({
    configured: credsAvailable(),
    domain: process.env.DAILY_DOMAIN || null,
  })),
  createRoom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        ttlSeconds: z.number().int().min(60).max(86400 * 7).default(3600),
      })
    )
    .mutation(async ({ input }) => {
      if (!credsAvailable()) {
        throw new Error("Daily not configured: missing DAILY_API_KEY");
      }
      const res = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: input.name,
          properties: { exp: Math.floor(Date.now() / 1000) + input.ttlSeconds },
        }),
      });
      if (!res.ok) {
        throw new Error(`Daily ${res.status}: ${await res.text()}`);
      }
      return (await res.json()) as { url: string; name: string; id: string };
    }),
});
