/**
 * server/_core/rbac.ts
 *
 * Stewardly 5-layer Role-Based Access Control.
 *
 * Architecture (canonical from stewardly-ai/notes-5layer.md):
 *   L1 Platform     - globalRole='global_admin'                 (singleton)
 *   L2 Organization - organizationRole='org_admin'    in an org
 *   L3 Manager      - organizationRole='manager'      in an org
 *   L4 Professional - organizationRole='professional' in an org
 *   L5 User         - organizationRole='user'         in an org (or no org)
 *
 * A user can be a member of multiple organizations with different
 * organizationRoles per org. Their globalRole is per-row but tracked
 * uniformly: any 'global_admin' row makes them L1.
 *
 * Cascade direction (most-permissive wins): L1 sees L2 sees L3 sees L4 sees L5
 * within their scope.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { userOrganizationRoles, organizations } from "../../drizzle/schema";
import { protectedProcedure } from "./trpc";

export type GlobalRole = "global_admin" | "user";
export type OrganizationRole = "org_admin" | "manager" | "professional" | "user";

export type OrgMembership = {
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  organizationRole: OrganizationRole;
  managerId: number | null;
  professionalId: number | null;
  status: "active" | "inactive" | "invited" | "pending_approval" | null;
};

export type UserRoles = {
  userId: number;
  /** Highest globalRole across all rows; 'global_admin' if any row has it. */
  globalRole: GlobalRole;
  /** Active org memberships only. */
  orgs: OrgMembership[];
};

const ORG_ROLE_RANK: Record<OrganizationRole, number> = {
  user: 1,
  professional: 2,
  manager: 3,
  org_admin: 4,
};

/** True iff `actual` >= `required` in the org-role hierarchy. */
export function orgRoleAtLeast(
  actual: OrganizationRole | null | undefined,
  required: OrganizationRole,
): boolean {
  if (!actual) return false;
  return ORG_ROLE_RANK[actual] >= ORG_ROLE_RANK[required];
}

/**
 * Load a user's roles. Returns global_admin if ANY row marks them so.
 * Active memberships only ('active' or null status — null treated as legacy active).
 */
export async function getCurrentRoles(userId: number): Promise<UserRoles> {
  const db = await getDb();
  if (!db) {
    return { userId, globalRole: "user", orgs: [] };
  }
  const rows = await db
    .select({
      organizationId: userOrganizationRoles.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      globalRole: userOrganizationRoles.globalRole,
      organizationRole: userOrganizationRoles.organizationRole,
      managerId: userOrganizationRoles.managerId,
      professionalId: userOrganizationRoles.professionalId,
      status: userOrganizationRoles.status,
    })
    .from(userOrganizationRoles)
    .leftJoin(
      organizations,
      eq(userOrganizationRoles.organizationId, organizations.id),
    )
    .where(eq(userOrganizationRoles.userId, userId));

  const isGlobalAdmin = rows.some((r: { globalRole: string | null }) => r.globalRole === "global_admin");
  const orgs: OrgMembership[] = rows
    .filter((r: { status: string | null }) => r.status === null || r.status === "active")
    .map((r: { organizationId: number; organizationName: string | null; organizationSlug: string | null; organizationRole: string | null; managerId: number | null; professionalId: number | null; status: string | null }) => ({
      organizationId: r.organizationId,
      organizationName: r.organizationName ?? "(unknown)",
      organizationSlug: r.organizationSlug ?? "",
      organizationRole: (r.organizationRole ?? "user") as OrganizationRole,
      managerId: r.managerId ?? null,
      professionalId: r.professionalId ?? null,
      status: r.status as OrgMembership["status"],
    }));

  return {
    userId,
    globalRole: isGlobalAdmin ? "global_admin" : "user",
    orgs,
  };
}

/** Fast check: is the user a global_admin? */
export async function isGlobalAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ globalRole: userOrganizationRoles.globalRole })
    .from(userOrganizationRoles)
    .where(
      and(
        eq(userOrganizationRoles.userId, userId),
        eq(userOrganizationRoles.globalRole, "global_admin"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Active org membership for a (user, org) pair, or null. */
export async function orgMembership(
  userId: number,
  organizationId: number,
): Promise<OrgMembership | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      organizationId: userOrganizationRoles.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      organizationRole: userOrganizationRoles.organizationRole,
      managerId: userOrganizationRoles.managerId,
      professionalId: userOrganizationRoles.professionalId,
      status: userOrganizationRoles.status,
    })
    .from(userOrganizationRoles)
    .leftJoin(
      organizations,
      eq(userOrganizationRoles.organizationId, organizations.id),
    )
    .where(
      and(
        eq(userOrganizationRoles.userId, userId),
        eq(userOrganizationRoles.organizationId, organizationId),
      ),
    )
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  if (r.status !== null && r.status !== "active") return null;
  return {
    organizationId: r.organizationId,
    organizationName: r.organizationName ?? "(unknown)",
    organizationSlug: r.organizationSlug ?? "",
    organizationRole: (r.organizationRole ?? "user") as OrganizationRole,
    managerId: r.managerId ?? null,
    professionalId: r.professionalId ?? null,
    status: r.status as OrgMembership["status"],
  };
}

/* ────────────────────────────────────────────────────────────────────
 * Procedure factories
 * ──────────────────────────────────────────────────────────────────── */

/** Procedure restricted to global_admin (L1 platform). */
export const globalAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const ok = await isGlobalAdmin(ctx.user.id);
  if (!ok) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Global admin access required (L1 platform).",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Zod schema for org-scoped procedures — every org-scoped procedure must accept this. */
export const orgScopedInput = z.object({ organizationId: z.number().int().positive() });

/**
 * Procedure factory: requires `organizationId` in input and `requiredRole`+
 * (most-permissive) in that org. global_admin always passes.
 *
 * Usage:
 *   const orgAdminProc = orgRoleProcedure('org_admin');
 *   orgAdminProc.input(orgScopedInput.extend({ ... })).mutation(...)
 */
export function orgRoleProcedure(requiredRole: OrganizationRole) {
  return protectedProcedure
    .input(orgScopedInput)
    .use(async ({ ctx, next, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      // global_admin bypass.
      if (await isGlobalAdmin(ctx.user.id)) {
        return next({ ctx: { ...ctx, user: ctx.user, orgMembership: null as OrgMembership | null } });
      }
      const m = await orgMembership(ctx.user.id, input.organizationId);
      if (!m) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a member of this organization.",
        });
      }
      if (!orgRoleAtLeast(m.organizationRole, requiredRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Requires organization role >= ${requiredRole} (have ${m.organizationRole}).`,
        });
      }
      return next({ ctx: { ...ctx, user: ctx.user, orgMembership: m } });
    });
}

/** L2 org_admin or higher (or global_admin). */
export const orgAdminProcedure = orgRoleProcedure("org_admin");
/** L3 manager or higher. */
export const managerProcedure = orgRoleProcedure("manager");
/** L4 professional or higher. */
export const professionalProcedure = orgRoleProcedure("professional");
