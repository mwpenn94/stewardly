/**
 * Stewardly 5-layer AI settings + households router.
 *
 * Surfaces:
 *   - platformAi.{get,upsert}        — L1 global_admin (singleton)
 *   - organizationAi.{get,upsert}    — L2 org_admin in {orgId}
 *   - managerAi.{get,upsert}         — L3 manager in {orgId}
 *   - professionalAi.{get,upsert}    — L4 professional in {orgId}
 *   - households.list                — L4+ professional sees their assigned clients;
 *                                      L3 manager sees their team's professionals' clients;
 *                                      L2 org_admin sees the whole org;
 *                                      L1 global_admin sees all orgs.
 *
 * All settings rows are upserted by their natural key. JSON columns accept
 * arbitrary objects; the schema is in drizzle/schema.ts and matches the
 * canonical stewardly-ai shapes.
 */
import { z } from "zod";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  globalAdminProcedure,
  orgAdminProcedure,
  managerProcedure,
  professionalProcedure,
  getCurrentRoles,
} from "../_core/rbac";
import {
  platformAiSettings,
  organizationAiSettings,
  managerAiSettings,
  professionalAiSettings,
  users,
  userOrganizationRoles,
  organizations,
  plaidItems,
  snapTradeAccounts,
  snapTradePositions,
} from "../../drizzle/schema";

// ── shared zod helpers ───────────────────────────────────────────────────
const jsonField = z.unknown().optional();
const optString = z.string().optional();
const optNum = z.number().optional();

// ── Platform AI settings (L1) ────────────────────────────────────────────
export const platformAiRouter = router({
  get: globalAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(platformAiSettings)
      .where(eq(platformAiSettings.settingKey, "default"))
      .limit(1);
    return rows[0] ?? null;
  }),
  upsert: globalAdminProcedure
    .input(z.object({
      baseSystemPrompt: optString,
      defaultTone: optString,
      defaultResponseFormat: optString,
      defaultResponseLength: optString,
      modelPreferences: jsonField,
      ensembleWeights: jsonField,
      globalGuardrails: jsonField,
      prohibitedTopics: jsonField,
      maxTokensDefault: optNum,
      temperatureDefault: optNum,
      enabledFocusModes: jsonField,
      platformDisclaimer: optString,
      defaultTtsVoice: optString,
      defaultSpeechRate: optNum,
      defaultAutoPlayVoice: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const existing = await db
        .select({ id: platformAiSettings.id })
        .from(platformAiSettings)
        .where(eq(platformAiSettings.settingKey, "default"))
        .limit(1);
      const stamp = new Date();
      if (existing.length === 0) {
        await db.insert(platformAiSettings).values({
          settingKey: "default",
          ...input,
          createdAt: stamp,
          updatedAt: stamp,
        });
      } else {
        await db.update(platformAiSettings)
          .set({ ...input, updatedAt: stamp })
          .where(eq(platformAiSettings.id, existing[0].id));
      }
      return { ok: true as const };
    }),
});

// ── Organization AI settings (L2) ────────────────────────────────────────
export const organizationAiRouter = router({
  get: orgAdminProcedure.query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(organizationAiSettings)
      .where(eq(organizationAiSettings.organizationId, input.organizationId))
      .limit(1);
    return rows[0] ?? null;
  }),
  upsert: orgAdminProcedure
    .input(z.object({
      organizationName: optString,
      brandVoice: optString,
      approvedProductCategories: jsonField,
      prohibitedTopics: jsonField,
      complianceLanguage: optString,
      customDisclaimers: optString,
      promptOverlay: optString,
      toneStyle: optString,
      responseFormat: optString,
      responseLength: optString,
      modelPreferences: jsonField,
      ensembleWeights: jsonField,
      temperature: optNum,
      maxTokens: optNum,
      enabledFocusModes: jsonField,
      defaultTtsVoice: optString,
      defaultSpeechRate: optNum,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { organizationId, ...rest } = input;
      const existing = await db
        .select({ id: organizationAiSettings.id })
        .from(organizationAiSettings)
        .where(eq(organizationAiSettings.organizationId, organizationId))
        .limit(1);
      const stamp = new Date();
      if (existing.length === 0) {
        await db.insert(organizationAiSettings).values({
          organizationId,
          organizationName: rest.organizationName ?? "",
          ...rest,
          createdAt: stamp,
          updatedAt: stamp,
        });
      } else {
        await db.update(organizationAiSettings)
          .set({ ...rest, updatedAt: stamp })
          .where(eq(organizationAiSettings.id, existing[0].id));
      }
      return { ok: true as const };
    }),
});

// ── Manager AI settings (L3) ─────────────────────────────────────────────
export const managerAiRouter = router({
  get: managerProcedure.query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(managerAiSettings)
      .where(and(
        eq(managerAiSettings.organizationId, input.organizationId),
        eq(managerAiSettings.managerId, ctx.user.id),
      ))
      .limit(1);
    return rows[0] ?? null;
  }),
  upsert: managerProcedure
    .input(z.object({
      teamFocusAreas: jsonField,
      clientSegmentTargeting: optString,
      reportingRequirements: jsonField,
      promptOverlay: optString,
      toneStyle: optString,
      responseFormat: optString,
      responseLength: optString,
      modelPreferences: jsonField,
      ensembleWeights: jsonField,
      temperature: optNum,
      maxTokens: optNum,
      defaultTtsVoice: optString,
      defaultSpeechRate: optNum,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { organizationId, ...rest } = input;
      const existing = await db
        .select({ id: managerAiSettings.id })
        .from(managerAiSettings)
        .where(and(
          eq(managerAiSettings.organizationId, organizationId),
          eq(managerAiSettings.managerId, ctx.user.id),
        ))
        .limit(1);
      const stamp = new Date();
      if (existing.length === 0) {
        await db.insert(managerAiSettings).values({
          organizationId,
          managerId: ctx.user.id,
          ...rest,
          createdAt: stamp,
          updatedAt: stamp,
        });
      } else {
        await db.update(managerAiSettings)
          .set({ ...rest, updatedAt: stamp })
          .where(eq(managerAiSettings.id, existing[0].id));
      }
      return { ok: true as const };
    }),
});

// ── Professional AI settings (L4) ────────────────────────────────────────
export const professionalAiRouter = router({
  get: professionalProcedure.query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(professionalAiSettings)
      .where(and(
        eq(professionalAiSettings.organizationId, input.organizationId),
        eq(professionalAiSettings.professionalId, ctx.user.id),
      ))
      .limit(1);
    return rows[0] ?? null;
  }),
  upsert: professionalProcedure
    .input(z.object({
      managerId: z.number().int().nullable().optional(),
      specialization: optString,
      methodology: optString,
      communicationStyle: optString,
      perClientOverrides: jsonField,
      promptOverlay: optString,
      toneStyle: optString,
      responseFormat: optString,
      responseLength: optString,
      modelPreferences: jsonField,
      ensembleWeights: jsonField,
      temperature: optNum,
      maxTokens: optNum,
      defaultTtsVoice: optString,
      defaultSpeechRate: optNum,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { organizationId, ...rest } = input;
      const existing = await db
        .select({ id: professionalAiSettings.id })
        .from(professionalAiSettings)
        .where(and(
          eq(professionalAiSettings.organizationId, organizationId),
          eq(professionalAiSettings.professionalId, ctx.user.id),
        ))
        .limit(1);
      const stamp = new Date();
      if (existing.length === 0) {
        await db.insert(professionalAiSettings).values({
          organizationId,
          professionalId: ctx.user.id,
          ...rest,
          createdAt: stamp,
          updatedAt: stamp,
        });
      } else {
        await db.update(professionalAiSettings)
          .set({ ...rest, updatedAt: stamp })
          .where(eq(professionalAiSettings.id, existing[0].id));
      }
      return { ok: true as const };
    }),
});

// ── Households roster (L4+) ──────────────────────────────────────────────
export const householdsRouter = router({
  /** Households visible to the caller, scope-widened by their highest role. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { scope: "L5" as const, households: [] };
    const roles = await getCurrentRoles(ctx.user.id);

    // L1 global admin: everyone in any org
    if (roles.globalRole === "global_admin") {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          openId: users.openId,
          organizationId: userOrganizationRoles.organizationId,
          organizationName: organizations.name,
          professionalId: userOrganizationRoles.professionalId,
          managerId: userOrganizationRoles.managerId,
          status: userOrganizationRoles.status,
        })
        .from(users)
        .innerJoin(userOrganizationRoles, eq(userOrganizationRoles.userId, users.id))
        .leftJoin(organizations, eq(organizations.id, userOrganizationRoles.organizationId))
        .where(eq(userOrganizationRoles.organizationRole, "user"))
        .limit(500);
      return { scope: "L1" as const, households: rows };
    }

    // L2 org_admin: anyone in their orgs
    const adminOrgs = roles.orgs
      .filter((o) => o.organizationRole === "org_admin")
      .map((o) => o.organizationId);
    if (adminOrgs.length > 0) {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          openId: users.openId,
          organizationId: userOrganizationRoles.organizationId,
          organizationName: organizations.name,
          professionalId: userOrganizationRoles.professionalId,
          managerId: userOrganizationRoles.managerId,
          status: userOrganizationRoles.status,
        })
        .from(users)
        .innerJoin(userOrganizationRoles, eq(userOrganizationRoles.userId, users.id))
        .leftJoin(organizations, eq(organizations.id, userOrganizationRoles.organizationId))
        .where(and(
          inArray(userOrganizationRoles.organizationId, adminOrgs),
          eq(userOrganizationRoles.organizationRole, "user"),
        ))
        .limit(500);
      return { scope: "L2" as const, households: rows };
    }

    // L3 manager: clients whose professional reports to them
    const managerOrgs = roles.orgs
      .filter((o) => o.organizationRole === "manager")
      .map((o) => o.organizationId);
    if (managerOrgs.length > 0) {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          openId: users.openId,
          organizationId: userOrganizationRoles.organizationId,
          organizationName: organizations.name,
          professionalId: userOrganizationRoles.professionalId,
          managerId: userOrganizationRoles.managerId,
          status: userOrganizationRoles.status,
        })
        .from(users)
        .innerJoin(userOrganizationRoles, eq(userOrganizationRoles.userId, users.id))
        .leftJoin(organizations, eq(organizations.id, userOrganizationRoles.organizationId))
        .where(and(
          inArray(userOrganizationRoles.organizationId, managerOrgs),
          eq(userOrganizationRoles.managerId, ctx.user.id),
          eq(userOrganizationRoles.organizationRole, "user"),
        ))
        .limit(500);
      return { scope: "L3" as const, households: rows };
    }

    // L4 professional: their assigned clients
    const profOrgs = roles.orgs
      .filter((o) => o.organizationRole === "professional")
      .map((o) => o.organizationId);
    if (profOrgs.length > 0) {
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          openId: users.openId,
          organizationId: userOrganizationRoles.organizationId,
          organizationName: organizations.name,
          professionalId: userOrganizationRoles.professionalId,
          managerId: userOrganizationRoles.managerId,
          status: userOrganizationRoles.status,
        })
        .from(users)
        .innerJoin(userOrganizationRoles, eq(userOrganizationRoles.userId, users.id))
        .leftJoin(organizations, eq(organizations.id, userOrganizationRoles.organizationId))
        .where(and(
          inArray(userOrganizationRoles.organizationId, profOrgs),
          eq(userOrganizationRoles.professionalId, ctx.user.id),
          eq(userOrganizationRoles.organizationRole, "user"),
        ))
        .limit(500);
      return { scope: "L4" as const, households: rows };
    }

    // L5: no households visible
    return { scope: "L5" as const, households: [] };
  }),

  /** Per-household drill-down (L4+ only). Returns user identity + integration footprint. */
  getOne: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "db unavailable" });
      }
      const roles = await getCurrentRoles(ctx.user.id);

      // Resolve all role rows for the requested user to figure out their orgs.
      const targetRoles = await db
        .select({
          organizationId: userOrganizationRoles.organizationId,
          organizationRole: userOrganizationRoles.organizationRole,
          managerId: userOrganizationRoles.managerId,
          professionalId: userOrganizationRoles.professionalId,
          status: userOrganizationRoles.status,
        })
        .from(userOrganizationRoles)
        .where(eq(userOrganizationRoles.userId, input.userId));

      // Access check, mirrors households.list scoping rules.
      const callerOrgIds = roles.orgs.map((o) => o.organizationId);
      const callerAdminOrgs = roles.orgs
        .filter((o) => o.organizationRole === "org_admin")
        .map((o) => o.organizationId);
      const callerManagerOrgs = roles.orgs
        .filter((o) => o.organizationRole === "manager")
        .map((o) => o.organizationId);
      const callerProfOrgs = roles.orgs
        .filter((o) => o.organizationRole === "professional")
        .map((o) => o.organizationId);

      const accessible = roles.globalRole === "global_admin"
        || targetRoles.some((r) =>
          callerAdminOrgs.includes(r.organizationId)
          || (callerManagerOrgs.includes(r.organizationId) && r.managerId === ctx.user.id)
          || (callerProfOrgs.includes(r.organizationId) && r.professionalId === ctx.user.id)
        )
        || ctx.user.id === input.userId;

      if (!accessible) {
        throw new TRPCError({ code: "FORBIDDEN", message: "household not accessible at your layer" });
      }

      const userRows = await db
        .select({ id: users.id, name: users.name, email: users.email, openId: users.openId })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (userRows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "user not found" });
      }

      // Integration footprint - mirrors admin.userSummary but returns rows.
      const [plaid, snapAccts, snapPos] = await Promise.all([
        db.select({
          id: plaidItems.id,
          institutionName: plaidItems.institutionName,
          status: plaidItems.status,
          lastSyncedAt: plaidItems.lastSyncedAt,
        }).from(plaidItems).where(eq(plaidItems.userId, input.userId)),
        db.select({
          id: snapTradeAccounts.id,
          accountName: snapTradeAccounts.accountName,
          institutionName: snapTradeAccounts.institutionName,
          totalValue: snapTradeAccounts.totalValue,
          currency: snapTradeAccounts.currency,
          lastSyncAt: snapTradeAccounts.lastSyncAt,
        }).from(snapTradeAccounts).where(eq(snapTradeAccounts.userId, input.userId)),
        db.select({
          id: snapTradePositions.id,
          symbolTicker: snapTradePositions.symbolTicker,
          symbolName: snapTradePositions.symbolName,
          marketValue: snapTradePositions.marketValue,
        }).from(snapTradePositions).where(eq(snapTradePositions.userId, input.userId)),
      ]);

      // Compute total AUM for convenience.
      let totalAum = 0;
      for (const a of snapAccts) {
        const v = Number(a.totalValue ?? 0);
        if (Number.isFinite(v)) totalAum += v;
      }

      const orgIds = Array.from(new Set(targetRoles.map((r) => r.organizationId)));
      const orgRows = orgIds.length > 0
        ? await db
            .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
            .from(organizations)
            .where(inArray(organizations.id, orgIds))
        : [];

      void callerOrgIds; // touched for future audit logging
      return {
        user: userRows[0],
        roles: targetRoles,
        organizations: orgRows,
        integrations: {
          plaidItems: plaid,
          snapTradeAccounts: snapAccts,
          snapTradePositions: snapPos,
        },
        totalAum,
      };
    }),

  /** List orgs the caller can act on (so the L2/L3/L4 settings forms know which org to scope to). */
  myOrgs: protectedProcedure.query(async ({ ctx }) => {
    const roles = await getCurrentRoles(ctx.user.id);
    return roles.orgs.map((o) => ({
      organizationId: o.organizationId,
      organizationName: o.organizationName,
      organizationSlug: o.organizationSlug,
      organizationRole: o.organizationRole,
    }));
  }),
});

// dummy reference to keep an import alive when tree-shaken
void isNotNull;
