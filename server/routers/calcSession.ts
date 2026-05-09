/**
 * server/routers/calcSession.ts
 *
 * tRPC router for the unified Wealth Engine "session" concept used by
 * client/src/pages/Calculators.tsx. Sessions are persisted into the
 * existing `calculator_scenarios` table; we treat the Wealth Engine as
 * a virtual `calculatorType = "wealth-engine"`.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { calculatorScenarios } from "../../drizzle/schema";

const WEALTH_ENGINE_TYPE = "wealth-engine";

export const calcSessionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(calculatorScenarios)
      .where(
        and(
          eq(calculatorScenarios.userId, ctx.user.id),
          eq(calculatorScenarios.calculatorType, WEALTH_ENGINE_TYPE),
        ),
      )
      .orderBy(desc(calculatorScenarios.updatedAt));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(calculatorScenarios)
        .where(
          and(
            eq(calculatorScenarios.id, input.id),
            eq(calculatorScenarios.userId, ctx.user.id),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    }),

  save: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        inputsJson: z.any().optional(),
        resultsJson: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [r] = await db
        .insert(calculatorScenarios)
        .values({
          userId: ctx.user.id,
          calculatorType: WEALTH_ENGINE_TYPE,
          name: input.name,
          inputsJson: input.inputsJson ?? null,
          resultsJson: input.resultsJson ?? null,
        });
      return { id: Number((r as any).insertId) };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(256).optional(),
        inputsJson: z.any().optional(),
        resultsJson: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const patch: Record<string, unknown> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.inputsJson !== undefined) patch.inputsJson = input.inputsJson;
      if (input.resultsJson !== undefined) patch.resultsJson = input.resultsJson;
      if (Object.keys(patch).length === 0) return { ok: true };
      await db
        .update(calculatorScenarios)
        .set(patch)
        .where(
          and(
            eq(calculatorScenarios.id, input.id),
            eq(calculatorScenarios.userId, ctx.user.id),
          ),
        );
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(calculatorScenarios)
        .where(
          and(
            eq(calculatorScenarios.id, input.id),
            eq(calculatorScenarios.userId, ctx.user.id),
          ),
        );
      return { ok: true };
    }),
});
