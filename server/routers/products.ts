/**
 * Products router — backed by the real `products` table (drizzle/schema-ai.ts re-export).
 * Procedures: list, create, update, delete.
 * Used by client/src/pages/Products.tsx, AdvisoryHub.tsx, SuitabilityPanel.tsx.
 */
import { z } from "zod";
import { and, eq, or, isNull } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";

const productCategoryEnum = z.enum([
  "iul",
  "term_life",
  "disability",
  "ltc",
  "premium_finance",
  "whole_life",
  "variable_life",
]);
const riskLevelEnum = z.enum(["low", "moderate", "moderate_high", "high"]);

export const productsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          category: productCategoryEnum.optional(),
          includePlatform: z.boolean().optional().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conds = [
        or(
          eq(products.userId, ctx.user.id),
          isNull(products.userId), // platform/global products
        ),
      ];
      if (input?.category) {
        conds.push(eq(products.category, input.category));
      }
      const rows = await db
        .select()
        .from(products)
        .where(and(...conds))
        .limit(500);
      return rows;
    }),

  create: protectedProcedure
    .input(
      z.object({
        company: z.string().min(1).max(128),
        name: z.string().min(1).max(256),
        category: productCategoryEnum,
        description: z.string().max(2000).optional(),
        features: z.any().optional(),
        riskLevel: riskLevelEnum.optional(),
        minPremium: z.number().nonnegative().optional(),
        maxPremium: z.number().nonnegative().optional(),
        targetAudience: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.insert(products).values({
        userId: ctx.user.id,
        organizationId: null,
        company: input.company,
        name: input.name,
        category: input.category,
        description: input.description ?? null,
        features: input.features ?? null,
        riskLevel: input.riskLevel ?? null,
        minPremium: input.minPremium ?? null,
        maxPremium: input.maxPremium ?? null,
        targetAudience: input.targetAudience ?? null,
        competitorFlag: false,
        isPlatform: false,
      });
      return { success: true as const, id: (result as unknown as { insertId?: number }).insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        company: z.string().min(1).max(128).optional(),
        name: z.string().min(1).max(256).optional(),
        category: productCategoryEnum.optional(),
        description: z.string().max(2000).optional(),
        features: z.any().optional(),
        riskLevel: riskLevelEnum.optional(),
        minPremium: z.number().nonnegative().optional(),
        maxPremium: z.number().nonnegative().optional(),
        targetAudience: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { id, ...patch } = input;
      // Only update fields that were actually supplied
      const values: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined) values[k] = v;
      }
      if (Object.keys(values).length === 0) return { success: true as const };
      await db
        .update(products)
        .set(values)
        .where(and(eq(products.id, id), eq(products.userId, ctx.user.id)));
      return { success: true as const };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(products)
        .where(and(eq(products.id, input.id), eq(products.userId, ctx.user.id)));
      return { success: true as const };
    }),
});
