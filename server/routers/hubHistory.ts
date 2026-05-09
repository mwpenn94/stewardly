/* ============================================================================
 * R14.16 — hubHistory router
 *
 * Multi-tier version history for any hubItems row. Mirrors the L1-L5 RBAC
 * stack — every read/write is gated by who can see the change at which tier.
 *
 *   self          : the owner of the hub item itself
 *   client        : a user who is a "client" of an organization
 *   professional  : an org member with role=professional, sees their org's
 *                   client items
 *   organization  : an org_admin or manager, sees the entire org
 *   platform      : a global_admin, sees everything
 *
 * "Acting on behalf of" — when a professional edits a client's hub item, we
 * record both `actorId` (the professional) and `onBehalfOfId` (the client),
 * so the client can still see + roll back the change in their own history.
 * ========================================================================== */
import { z } from "zod";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { getDb } from "../db";
const dbReady = () => getDb();
import {
  hubItemHistory,
  hubItems,
  userOrganizationRoles,
  users,
} from "../../drizzle/schema";
import { router, protectedProcedure } from "../_core/trpc";
import { getCurrentRoles, isGlobalAdmin } from "../_core/rbac";
import { TRPCError } from "@trpc/server";

const scopeEnum = z.enum(["self", "client", "professional", "organization", "platform"]);

/** Decide which scopeLevel to record for a hub-item change.
 *  - if item belongs to an org → organization (with scopeRefId = orgId)
 *  - if owner is a "client" via that org → client
 *  - otherwise (private personal item) → self via 'professional' bucket if
 *    actor is a professional, else 'organization' default 'platform' = no
 */
function classifyScope(args: {
  item: typeof hubItems.$inferSelect;
  actorIsProfessional: boolean;
  actorIsGlobalAdmin: boolean;
}): { scope: "platform" | "organization" | "professional" | "client"; refId: number | null } {
  const { item, actorIsProfessional, actorIsGlobalAdmin } = args;
  if (actorIsGlobalAdmin && !item.organizationId) return { scope: "platform", refId: null };
  if (item.organizationId) {
    // Org-owned item edited by a professional in that org → "client" tier
    // (because professionals act on clients' content). Otherwise "organization".
    if (actorIsProfessional) return { scope: "client", refId: item.organizationId };
    return { scope: "organization", refId: item.organizationId };
  }
  // Personal item, no org. Use "professional" if actor is a pro acting on
  // somebody else's content; else self-bucket via "client".
  return { scope: actorIsProfessional ? "professional" : "client", refId: null };
}

export const hubHistoryRouter = router({
  /** List history entries the caller is authorized to see, optionally
   *  filtered by hubItemId or scope. */
  list: protectedProcedure
    .input(
      z
        .object({
          hubItemId: z.number().int().optional(),
          scope: scopeEnum.optional(),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const roles = await getCurrentRoles(userId);
      const isAdmin = isGlobalAdmin(roles);

      // Find the user's org memberships (and which roles they hold there)
      const db = await dbReady();
      const memberships = await db
        .select()
        .from(userOrganizationRoles)
        .where(eq(userOrganizationRoles.userId, userId));
      const orgIdsAsAdmin = memberships
        .filter((m) =>
          ["org_admin", "manager", "owner"].includes(m.organizationRole as string),
        )
        .map((m) => m.organizationId);
      const orgIdsAsProfessional = memberships
        .filter((m) =>
          ["professional", "manager", "org_admin", "owner"].includes(
            m.organizationRole as string,
          ),
        )
        .map((m) => m.organizationId);

      // Build the WHERE clause:
      //   - global_admin sees everything
      //   - else: own actions, on-behalf-of-me actions, items I own,
      //          org-scope changes within orgs I admin, client-scope
      //          changes within orgs where I'm a professional
      const conds = [];
      if (!isAdmin) {
        const ors = [
          eq(hubItemHistory.actorId, userId),
          eq(hubItemHistory.onBehalfOfId, userId),
        ];
        if (orgIdsAsAdmin.length > 0) {
          ors.push(
            and(
              eq(hubItemHistory.scopeLevel, "organization"),
              inArray(hubItemHistory.scopeRefId, orgIdsAsAdmin),
            )!,
          );
        }
        if (orgIdsAsProfessional.length > 0) {
          ors.push(
            and(
              eq(hubItemHistory.scopeLevel, "client"),
              inArray(hubItemHistory.scopeRefId, orgIdsAsProfessional),
            )!,
          );
        }
        conds.push(or(...ors)!);
      }
      if (input?.hubItemId) conds.push(eq(hubItemHistory.hubItemId, input.hubItemId));
      if (input?.scope && input.scope !== "self") {
        conds.push(eq(hubItemHistory.scopeLevel, input.scope === "client" ? "client" : input.scope));
      }
      const where = conds.length > 0 ? and(...conds) : undefined;

      const rows = await db
        .select()
        .from(hubItemHistory)
        .where(where)
        .orderBy(desc(hubItemHistory.createdAt))
        .limit(input?.limit ?? 50);
      return rows;
    }),

  /** Roll back a hub item to the previousData snapshot of a specific
   *  history entry. RBAC: must be allowed to see that entry. */
  rollback: protectedProcedure
    .input(z.object({ historyId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await dbReady();
      const [entry] = await db
        .select()
        .from(hubItemHistory)
        .where(eq(hubItemHistory.id, input.historyId))
        .limit(1);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      const [item] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, entry.hubItemId))
        .limit(1);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const roles = await getCurrentRoles(userId);
      const isAdmin = isGlobalAdmin(roles);
      const isOwner = item.ownerUserId === userId;
      // Org admins and pros for the item's org can also roll back
      let allowed = isAdmin || isOwner;
      if (!allowed && item.organizationId) {
        const m = (await db
          .select()
          .from(userOrganizationRoles)
          .where(
            and(
              eq(userOrganizationRoles.userId, userId),
              eq(userOrganizationRoles.organizationId, item.organizationId),
            ),
          )
          .limit(1))[0];
        if (m && ["professional", "manager", "org_admin", "owner"].includes(m.organizationRole as string)) {
          allowed = true;
        }
      }
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      const prev = entry.previousData as any;
      if (!prev || typeof prev !== "object") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No previous snapshot to roll back to." });
      }

      // Apply the rollback (only payload + label + icon + color — never
      // ownership, visibility, or scopeRefIds)
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      for (const k of ["label", "icon", "color", "payload"]) {
        if (k in prev) patch[k] = (prev as any)[k];
      }
      await (await dbReady()).update(hubItems).set(patch).where(eq(hubItems.id, item.id));

      // Record the rollback as its own history entry
      await (await dbReady()).insert(hubItemHistory).values({
        hubItemId: item.id,
        action: "rollback",
        scopeLevel: entry.scopeLevel,
        scopeRefId: entry.scopeRefId,
        actorId: userId,
        onBehalfOfId: item.ownerUserId !== userId ? item.ownerUserId : null,
        previousData: { ...item } as any,
        newData: { ...item, ...patch } as any,
        note: `Rollback to history #${entry.id}`,
      });

      return { ok: true };
    }),
});

/** Helper used by hub.update / hub.delete / hub.create to append a history
 *  row. Exposed so the existing hub router can call it without a circular
 *  import. */
export async function recordHubHistory(args: {
  itemBefore: typeof hubItems.$inferSelect | null;
  itemAfter: typeof hubItems.$inferSelect | null;
  actorId: number;
  action: "create" | "update" | "delete" | "rollback" | "publish" | "adopt";
  note?: string;
}) {
  const { itemBefore, itemAfter, actorId, action, note } = args;
  const item = itemAfter ?? itemBefore;
  if (!item) return;
  // Look up actor's org memberships to classify scope correctly
  const memberships = await db
    .select()
    .from(userOrganizationRoles)
    .where(eq(userOrganizationRoles.userId, actorId));
  const isPro = memberships.some(
    (m) =>
      item.organizationId === m.organizationId &&
      ["professional", "manager", "org_admin", "owner"].includes(m.organizationRole as string),
  );
  const [actorRow] = await db.select().from(users).where(eq(users.id, actorId)).limit(1);
  const isAdmin = (actorRow?.globalRole as string) === "global_admin";
  const { scope, refId } = classifyScope({
    item,
    actorIsProfessional: isPro,
    actorIsGlobalAdmin: isAdmin,
  });
  await db.insert(hubItemHistory).values({
    hubItemId: item.id,
    action,
    scopeLevel: scope,
    scopeRefId: refId,
    actorId,
    onBehalfOfId: item.ownerUserId !== actorId ? item.ownerUserId : null,
    previousData: itemBefore ? ({ ...itemBefore } as any) : null,
    newData: itemAfter ? ({ ...itemAfter } as any) : null,
    note: note ?? null,
  });
}
