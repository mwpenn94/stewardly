/**
 * server/routers/admin.ts
 *
 * Cross-layer Admin Console procedures (L1 only).
 *
 * Surfaces:
 *   - admin.listTenants            list orgs + member counts
 *   - admin.tenantMembers(orgId)   list members of an org with their roles
 *   - admin.upsertMember           grant/change role for a user in an org
 *   - admin.removeMember           remove role row
 *   - admin.listUsers(query?)      paged user search for GDPR ops
 *   - admin.userSummary(userId)    per-user data summary across stewardly tables
 *   - admin.deleteUserData(userId) trigger gdpr.deleteAllData for an arbitrary user
 *
 * All gated by globalAdminProcedure. Tenant-management mutations are
 * audit-logged through console + a row in audit_logs (when present).
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, count, eq, like, or, sql } from "drizzle-orm";
import { router } from "../_core/trpc";
import { globalAdminProcedure } from "../_core/rbac";
import { getDb } from "../db";
import {
  organizations,
  userOrganizationRoles,
  users,
  plaidItems,
  snapTradeBrokerageConnections,
  snapTradeAccounts,
  snapTradePositions,
  integrationConnections,
  platformApiKeys,
} from "../../drizzle/schema";
import crypto from "node:crypto";

/** Known scope vocabulary; extend as new public APIs ship. */
const API_KEY_SCOPES = [
  "read:engines",
  "read:economic-data",
  "read:portfolio",
  "read:households",
] as const;
const apiKeyScopeEnum = z.enum(API_KEY_SCOPES);

const orgRoleEnum = z.enum(["user", "professional", "manager", "org_admin"]);
const globalRoleEnum = z.enum(["user", "global_admin"]);

export const adminRouter = router({
  /** List tenants with member counts. */
  listTenants: globalAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { tenants: [] as Array<{ id: number; name: string; slug: string; memberCount: number }> };
    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      })
      .from(organizations);
    const memberCounts = await db
      .select({
        organizationId: userOrganizationRoles.organizationId,
        c: count(userOrganizationRoles.id),
      })
      .from(userOrganizationRoles)
      .where(
        or(
          eq(userOrganizationRoles.status, "active"),
          sql`${userOrganizationRoles.status} IS NULL`,
        ),
      )
      .groupBy(userOrganizationRoles.organizationId);
    const counts = new Map(memberCounts.map((r: { organizationId: number; c: number }) => [r.organizationId, Number(r.c)]));
    return {
      tenants: rows.map((r: { id: number; name: string; slug: string }) => ({
        ...r,
        memberCount: counts.get(r.id) ?? 0,
      })),
    };
  }),

  /** Members of an org with their roles. */
  tenantMembers: globalAdminProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { members: [] as Array<{ userId: number; email: string | null; name: string | null; organizationRole: string; globalRole: string; status: string | null }> };
      const rows = await db
        .select({
          userId: userOrganizationRoles.userId,
          email: users.email,
          name: users.name,
          organizationRole: userOrganizationRoles.organizationRole,
          globalRole: userOrganizationRoles.globalRole,
          status: userOrganizationRoles.status,
        })
        .from(userOrganizationRoles)
        .leftJoin(users, eq(userOrganizationRoles.userId, users.id))
        .where(eq(userOrganizationRoles.organizationId, input.organizationId));
      return { members: rows };
    }),

  /** Grant or change a member's role in an org. Idempotent upsert by (user, org). */
  upsertMember: globalAdminProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        userId: z.number().int().positive(),
        organizationRole: orgRoleEnum,
        globalRole: globalRoleEnum.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await db
        .select({ id: userOrganizationRoles.id })
        .from(userOrganizationRoles)
        .where(
          and(
            eq(userOrganizationRoles.userId, input.userId),
            eq(userOrganizationRoles.organizationId, input.organizationId),
          ),
        )
        .limit(1);
      if (existing.length) {
        await db
          .update(userOrganizationRoles)
          .set({
            organizationRole: input.organizationRole,
            globalRole: input.globalRole ?? "user",
            status: "active",
          })
          .where(eq(userOrganizationRoles.id, existing[0].id));
      } else {
        await db.insert(userOrganizationRoles).values({
          userId: input.userId,
          organizationId: input.organizationId,
          organizationRole: input.organizationRole,
          globalRole: input.globalRole ?? "user",
          status: "active",
        });
      }
      return { ok: true };
    }),

  /** Remove a member from an org (delete the role row). */
  removeMember: globalAdminProcedure
    .input(z.object({ organizationId: z.number().int().positive(), userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(userOrganizationRoles)
        .where(
          and(
            eq(userOrganizationRoles.userId, input.userId),
            eq(userOrganizationRoles.organizationId, input.organizationId),
          ),
        );
      return { ok: true };
    }),

  /** Paged user search for GDPR ops. */
  listUsers: globalAdminProcedure
    .input(z.object({ query: z.string().max(200).optional(), limit: z.number().int().min(1).max(100).default(25) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { users: [] as Array<{ id: number; email: string | null; name: string | null }> };
      const q = input.query?.trim();
      const rows = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(q ? or(like(users.email, `%${q}%`), like(users.name, `%${q}%`)) : sql`1 = 1`)
        .limit(input.limit);
      return { users: rows };
    }),

  /** L1 white-label: read tenant branding (logoUrl, customDomain, themeColor). */
  tenantBranding: globalAdminProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          logoUrl: organizations.logoUrl,
          customDomain: organizations.customDomain,
          themeColor: organizations.themeColor,
        })
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);
      return rows[0] ?? null;
    }),

  /** L1 white-label: write tenant branding. */
  updateTenantBranding: globalAdminProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        logoUrl: z.string().url().max(500).nullable().optional(),
        customDomain: z
          .string()
          .max(256)
          .regex(/^[a-zA-Z0-9.-]+$/, "hostname only — no protocol or path")
          .nullable()
          .optional(),
        themeColor: z
          .string()
          .max(32)
          .regex(/^#?[0-9a-fA-F]{3,8}$|^oklch\(.+\)$|^[a-zA-Z]+$/, "hex/oklch/named color only")
          .nullable()
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const patch: Record<string, unknown> = {};
      if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl;
      if (input.customDomain !== undefined) patch.customDomain = input.customDomain;
      if (input.themeColor !== undefined) patch.themeColor = input.themeColor;
      if (Object.keys(patch).length === 0) return { ok: true, updated: 0 };
      await db
        .update(organizations)
        .set(patch)
        .where(eq(organizations.id, input.organizationId));
      return { ok: true, updated: 1 };
    }),

  /** L2 multi-household roll-up: count of households + total AUM + advisor ratio. */
  orgRollup: globalAdminProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { households: 0, professionals: 0, totalAum: 0, advisorRatio: 0 };
      const householdRows = await db
        .select({ userId: userOrganizationRoles.userId })
        .from(userOrganizationRoles)
        .where(
          and(
            eq(userOrganizationRoles.organizationId, input.organizationId),
            eq(userOrganizationRoles.organizationRole, "user"),
          ),
        );
      const professionalRows = await db
        .select({ userId: userOrganizationRoles.userId })
        .from(userOrganizationRoles)
        .where(
          and(
            eq(userOrganizationRoles.organizationId, input.organizationId),
            eq(userOrganizationRoles.organizationRole, "professional"),
          ),
        );
      const householdIds = householdRows.map((r: { userId: number }) => r.userId);
      let totalAum = 0;
      if (householdIds.length > 0) {
        const aumRows = await db
          .select({ totalValue: snapTradeAccounts.totalValue })
          .from(snapTradeAccounts)
          .where(sql`${snapTradeAccounts.userId} IN (${sql.join(householdIds.map((id: number) => sql`${id}`), sql`, `)})`);
        for (const r of aumRows) {
          const v = Number(r.totalValue ?? 0);
          if (Number.isFinite(v)) totalAum += v;
        }
      }
      const households = householdIds.length;
      const professionals = professionalRows.length;
      return {
        households,
        professionals,
        totalAum,
        advisorRatio: professionals > 0 ? households / professionals : 0,
      };
    }),

  /** Per-user data summary across the integration tables. */
  userSummary: globalAdminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { plaidItems: 0, snapBrokerages: 0, snapAccounts: 0, snapPositions: 0, integrations: 0 };
      const [pi, sb, sa, sp, ic] = await Promise.all([
        db.select({ c: count() }).from(plaidItems).where(eq(plaidItems.userId, input.userId)),
        db.select({ c: count() }).from(snapTradeBrokerageConnections).where(eq(snapTradeBrokerageConnections.userId, input.userId)),
        db.select({ c: count() }).from(snapTradeAccounts).where(eq(snapTradeAccounts.userId, input.userId)),
        db.select({ c: count() }).from(snapTradePositions).where(eq(snapTradePositions.userId, input.userId)),
        db.select({ c: count() }).from(integrationConnections).where(eq(integrationConnections.userId, input.userId)),
      ]);
      return {
        plaidItems: Number(pi[0]?.c ?? 0),
        snapBrokerages: Number(sb[0]?.c ?? 0),
        snapAccounts: Number(sa[0]?.c ?? 0),
        snapPositions: Number(sp[0]?.c ?? 0),
        integrations: Number(ic[0]?.c ?? 0),
      };
    }),

  /**
   * List all platform API keys. Plaintext is never returned.
   * Each row exposes only keyPrefix, label, scopes, lastUsedAt, expiresAt,
   * and revoked status.
   */
  listApiKeys: globalAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "db unavailable" });
    const rows = await db.select({
      id: platformApiKeys.id,
      keyPrefix: platformApiKeys.keyPrefix,
      label: platformApiKeys.label,
      scopes: platformApiKeys.scopes,
      issuedByUserId: platformApiKeys.issuedByUserId,
      lastUsedAt: platformApiKeys.lastUsedAt,
      expiresAt: platformApiKeys.expiresAt,
      revokedAt: platformApiKeys.revokedAt,
      createdAt: platformApiKeys.createdAt,
    }).from(platformApiKeys).orderBy(sql`createdAt DESC`);
    return { keys: rows };
  }),

  /**
   * Issue a new API key. Returns the plaintext exactly once.
   * After this call returns, only the prefix + hash are stored.
   */
  issueApiKey: globalAdminProcedure
    .input(z.object({
      label: z.string().min(1).max(256).optional(),
      scopes: z.array(apiKeyScopeEnum).min(1),
      expiresAt: z.number().int().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "db unavailable" });
      // Plaintext: swly_live_<32-char-base32>. Prefix shown in lists.
      const random = crypto.randomBytes(20).toString("base64url").slice(0, 32);
      const plaintext = `swly_live_${random}`;
      const keyPrefix = plaintext.slice(0, 16);
      const keyHash = crypto.createHash("sha256").update(plaintext).digest("hex");
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
      const [insert] = await db.insert(platformApiKeys).values({
        keyPrefix,
        keyHash,
        label: input.label ?? null,
        scopes: input.scopes.join(","),
        issuedByUserId: ctx.user.id,
        expiresAt,
      }).$returningId?.() ?? [{ id: 0 }];
      return {
        id: insert?.id ?? 0,
        keyPrefix,
        plaintext, // shown ONCE — clients must store immediately
        scopes: input.scopes,
        label: input.label ?? null,
        expiresAt: input.expiresAt ?? null,
      };
    }),

  /** Soft-revoke an API key (sets revokedAt; row is preserved for audit). */
  revokeApiKey: globalAdminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "db unavailable" });
      await db.update(platformApiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(platformApiKeys.id, input.id));
      return { ok: true };
    }),
});
