/**
 * tRPC router exposing the five-engine substrate to the frontend.
 *
 * The single procedure `engines.chat` accepts a free-text prompt
 * (and optional engine hint) and dispatches to the right engine via
 * the chatRouter.
 *
 * For now we use a simple keyword router to derive intent.kind from
 * the prompt; once the LLM goal-decomposition layer (Atlas
 * Orchestration) is wired, this becomes a planner call.
 */
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { engineWidgetLayouts } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { chatRouter } from "../engines";
import type { EngineId, Intent } from "../engines";
import { routedInvoke, atlasDecompose } from "../engines/_llmRouting";
import { getCurrentRoles } from "../_core/rbac";
import {
  WEALTH_ENGINE_TOOLS,
  toolsForLayer,
  invokeWealthTool,
  type EngineLayer,
} from "../engines/missional/wealth/agentTools";

/** Map UserRoles to the highest layer the caller qualifies for. */
function effectiveLayer(roles: { globalRole: string; orgs: { organizationRole: string }[] }): EngineLayer {
  if (roles.globalRole === "global_admin") return "L1";
  const ranks = roles.orgs.map((o) => o.organizationRole);
  if (ranks.includes("org_admin")) return "L2";
  if (ranks.includes("manager")) return "L3";
  if (ranks.includes("professional")) return "L4";
  return "L5";
}

const ENGINE_KEYWORDS: Record<EngineId, RegExp[]> = {
  missional: [/wealth|invest|tax|retire|insurance|portfolio|stock|bond|advisor|client/i],
  formational: [/learn|study|skill|practice|grow|improve|train|curric/i],
  relational: [/relationship|family|spouse|child|friend|community|connect|conflict/i],
  contextual: [/memory|history|past|context|remember|recall|search|document/i],
  "continuous-improvement": [/feedback|improve|optim|review|metric|kpi|goal|cycle/i],
};

const DEFAULT_INTENT_KINDS: Record<EngineId, string> = {
  missional: "missional.wealth.calculate",
  formational: "formational.curate",
  relational: "relational.engage",
  contextual: "contextual.recall",
  "continuous-improvement": "continuous-improvement.review",
};

function detectEngine(prompt: string): EngineId {
  for (const [engineId, patterns] of Object.entries(ENGINE_KEYWORDS) as Array<[EngineId, RegExp[]]>) {
    if (patterns.some((p) => p.test(prompt))) {
      return engineId;
    }
  }
  return "missional"; // default to missional/wealth — matches Stewardly's primary mission
}

export const enginesRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(8000),
        engine: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const engineId = (input.engine as EngineId) || detectEngine(input.prompt);
      const intentKind = DEFAULT_INTENT_KINDS[engineId] || `${engineId}.dispatch`;

      const intent: Intent<{ prompt: string }> = {
        kind: intentKind,
        expects: [],
        payload: { prompt: input.prompt },
        meta: {
          tenantId: ctx.user?.id?.toString() ?? "anonymous",
          practitionerId: ctx.user?.openId ?? "anonymous",
          originEngine: engineId,
          ...(engineId === "missional" ? { mission: "wealth" as const } : {}),
          adminLevel: "manual",
          correlationId: nanoid(),
          isComplianceClass: false,
        },
      };

      const result = await chatRouter(intent);
      return { engine: engineId, intentKind, result };
    }),

  /** List the registered engines + their advertised intent kinds. */
  list: publicProcedure.query(() => {
    return Object.entries(DEFAULT_INTENT_KINDS).map(([id, defaultIntent]) => ({
      id,
      defaultIntent,
    }));
  }),

  /** Routed LLM chat that goes through Aegis Cache + Sovereign provider routing. */
  routedChat: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(8000),
        engine: z.string().optional(),
        bypassCache: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const engineId = (input.engine as EngineId) || detectEngine(input.prompt);
      const intentKind = DEFAULT_INTENT_KINDS[engineId] || `${engineId}.dispatch`;
      const tenantId = ctx.user?.id?.toString() ?? "anonymous";
      const resp = await routedInvoke({
        tenantId,
        intentKind,
        bypassCache: input.bypassCache,
        messages: [
          {
            role: "system",
            content:
              "You are Stewardly, a five-engine stewardship copilot (Formational, Relational, Missional, Contextual, Continuous-Improvement). Always respond as a calm, practical steward. Never give individualized investment, legal, or medical advice; provide framework-level guidance.",
          },
          { role: "user", content: input.prompt },
        ],
      });
      return { engine: engineId, intentKind, ...resp };
    }),

  // ── Wealth-engine tool registry surface (UWE/BIE/HE/SCUI) ───────────────
  /** List the wealth-engine tools the caller can invoke at their layer. */
  toolsList: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getCurrentRoles(ctx.user.id);
    const layer = effectiveLayer(roles);
    const allowed = toolsForLayer(layer);
    return {
      layer,
      tools: allowed.map((t) => ({
        name: t.tool.function.name,
        description: t.tool.function.description ?? "",
        family: t.family,
        requiredLayer: t.requiredLayer,
        parameters: t.tool.function.parameters,
      })),
      totalRegistered: WEALTH_ENGINE_TOOLS.length,
    };
  }),

  /** Invoke a wealth-engine tool by name, with per-layer access gating. */
  toolsInvoke: protectedProcedure
    .input(
      z.object({
        toolName: z.string().min(1),
        args: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const roles = await getCurrentRoles(ctx.user.id);
      const layer = effectiveLayer(roles);
      try {
        const result = await invokeWealthTool(input.toolName, input.args, layer);
        return { ok: true as const, layer, result };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/requires layer/.test(message)) {
          throw new TRPCError({ code: "FORBIDDEN", message });
        }
        if (/unknown wealth tool/.test(message)) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  // ── Engine widget layout (Round 7) ───────────────────────────────────
  /** Read the user's saved sortable widget order for a given engine surface. */
  getLayout: protectedProcedure
    .input(z.object({ engineId: z.string().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { engineId: input.engineId, order: [] as string[] };
      const rows = await db
        .select()
        .from(engineWidgetLayouts)
        .where(
          and(
            eq(engineWidgetLayouts.userId, ctx.user.id),
            eq(engineWidgetLayouts.engineId, input.engineId),
          ),
        )
        .limit(1);
      const row = rows[0];
      const order = Array.isArray(row?.order) ? (row!.order as string[]) : [];
      return { engineId: input.engineId, order };
    }),

  /** Persist the user's drag-and-drop widget order for an engine surface. */
  setLayout: protectedProcedure
    .input(
      z.object({
        engineId: z.string().min(1).max(64),
        order: z.array(z.string().min(1).max(256)).max(64),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false as const, reason: "db_unavailable" };
      // Upsert pattern: try update first, insert if no row exists.
      const existing = await db
        .select({ id: engineWidgetLayouts.id })
        .from(engineWidgetLayouts)
        .where(
          and(
            eq(engineWidgetLayouts.userId, ctx.user.id),
            eq(engineWidgetLayouts.engineId, input.engineId),
          ),
        )
        .limit(1);
      if (existing[0]) {
        await db
          .update(engineWidgetLayouts)
          .set({ order: input.order })
          .where(eq(engineWidgetLayouts.id, existing[0].id));
      } else {
        await db.insert(engineWidgetLayouts).values({
          userId: ctx.user.id,
          engineId: input.engineId,
          order: input.order,
        });
      }
      return { ok: true as const, engineId: input.engineId, order: input.order };
    }),

  /** Atlas: decompose a goal into a plan and persist to atlas_goals + atlas_plans. */
  atlasPlan: publicProcedure
    .input(
      z.object({
        goalText: z.string().min(1).max(4000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tenantId = ctx.user?.id?.toString() ?? "anonymous";
      const out = await atlasDecompose({ tenantId, goalText: input.goalText });
      return out;
    }),
});
