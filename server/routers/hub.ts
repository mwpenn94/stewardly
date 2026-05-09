/**
 * server/routers/hub.ts — iOS-Home-Screen-style organizing surface.
 *
 * The Hub collapsed Apps + Engines + Library entries into a single grid.
 * Each row in `hubItems` is one of: app | artifact | file | folder.
 *
 * Permissions reuse the canonical 5-layer RBAC stack from server/_core/rbac.ts:
 *
 *   visibility='private'  → only owner sees / installs
 *   visibility='org'      → active org members satisfying optional minRole;
 *                           global_admin always bypasses
 *   visibility='unlisted' → anyone holding the share token can install
 *   visibility='public'   → listed in catalog, anyone signed in can install
 *
 * Built-in engine apps are seeded virtually (not stored) and merged into
 * `list` results so the Hub always shows the 5 engines as default tiles.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { recordHubHistory } from "./hubHistory";
import { getDb } from "../db";
import { hubItems, hubShareLinks, userApps, appInstalls } from "../../drizzle/schema";
import { getCurrentRoles, isGlobalAdmin, orgRoleAtLeast } from "../_core/rbac";

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is not available",
    });
  }
  return db;
}

function randomToken(len = 24): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, len);
}

/* ────────────────────────────────────────────────────────────────────
 * Built-in engine apps — seeded virtually so the Hub always shows the 5
 * engine tiles even before the user has any saved hubItems.
 * ──────────────────────────────────────────────────────────────────── */

export type BuiltinEngineApp = {
  id: number; // synthetic negative id so client can key on it
  builtinId: string;
  itemType: "app";
  label: string;
  icon: string;
  color: string;
  path: string;
  pageIndex: 0;
  sortOrder: number;
  visibility: "private";
  pinnedToDock: 0 | 1;
};

/**
 * 5-engine taxonomy with the rename "Continuous Improvement → Optimal".
 * The client mirrors this list; both must stay in sync.
 */
export const BUILTIN_ENGINE_APPS: BuiltinEngineApp[] = [
  { id: -1, builtinId: "engine:formational", itemType: "app", label: "Formational", icon: "🎓", color: "emerald", path: "/formational", pageIndex: 0, sortOrder: 0, visibility: "private", pinnedToDock: 0 },
  { id: -2, builtinId: "engine:relational",  itemType: "app", label: "Relational",  icon: "💞", color: "rose",    path: "/relational",  pageIndex: 0, sortOrder: 1, visibility: "private", pinnedToDock: 0 },
  { id: -3, builtinId: "engine:missional",   itemType: "app", label: "Missional",   icon: "🧭", color: "blue",    path: "/missional",   pageIndex: 0, sortOrder: 2, visibility: "private", pinnedToDock: 0 },
  { id: -4, builtinId: "engine:contextual",  itemType: "app", label: "Contextual",  icon: "📚", color: "amber",   path: "/contextual",  pageIndex: 0, sortOrder: 3, visibility: "private", pinnedToDock: 0 },
  // RENAME: was "Continuous Improvement" — now "Optimal"
  { id: -5, builtinId: "engine:optimal",     itemType: "app", label: "Optimal",     icon: "⚡", color: "purple",  path: "/continuous-improvement", pageIndex: 0, sortOrder: 4, visibility: "private", pinnedToDock: 0 },
];

const itemTypeEnum = z.enum(["app", "artifact", "file", "folder"]);
const visibilityEnum = z.enum(["private", "org", "unlisted", "public"]);
const minRoleEnum = z.enum(["user", "professional", "manager", "org_admin"]);

export const hubRouter = router({
  /**
   * Public Hub baseline: always returns the 5 built-in engine tiles so the
   * Hub never looks empty even before sign-in. Used as the unauthed render
   * source and as the empty-state fallback for authed users with no custom
   * hubItems yet.
   */
  listPublic: publicProcedure.query(async () => {
    return {
      items: [],
      builtins: BUILTIN_ENGINE_APPS,
      roles: { globalRole: "user" as const, orgs: [] as Array<{ organizationId: number; organizationName: string; organizationRole: string }> },
    };
  }),

  /**
   * List hub items visible to the current user, applying the 5-layer
   * permission cascade. Returns flat list (caller groups by parentFolderId
   * and pageIndex). Always includes BUILTIN_ENGINE_APPS for authenticated
   * users so the engine tiles are present out-of-the-box.
   */
  list: protectedProcedure
    .input(
      z
        .object({
          parentFolderId: z.number().int().nullable().optional(),
          query: z.string().trim().max(200).optional(),
          itemType: itemTypeEnum.optional(),
          sort: z.enum(["recents", "name", "type", "owner", "manual"]).default("manual"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const userId = ctx.user.id;
      const roles = await getCurrentRoles(userId);
      const isAdmin = roles.globalRole === "global_admin";

      // Base query: items the user OWNS, plus items shared via org with
      // sufficient role, plus items the user has installed (by hubItems
      // we created at install time — shared link installs make a copy).
      const baseRows = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.ownerUserId, userId))
        .orderBy(asc(hubItems.pageIndex), asc(hubItems.sortOrder));

      // Org-visible items the user can see (cascade by minRole). Skip the
      // expensive pull entirely if the user has no active orgs.
      let orgRows: (typeof hubItems.$inferSelect)[] = [];
      if (isAdmin) {
        orgRows = await db
          .select()
          .from(hubItems)
          .where(eq(hubItems.visibility, "org"));
      } else if (roles.orgs.length > 0) {
        const visibleOrgIds = roles.orgs.map((o) => o.organizationId);
        const candidate = await db
          .select()
          .from(hubItems)
          .where(
            and(
              eq(hubItems.visibility, "org"),
              sql`${hubItems.organizationId} IN (${sql.join(visibleOrgIds.map((id) => sql`${id}`), sql`, `)})`,
            ),
          );
        // Cascade by org-role: drop items where the user's role in the
        // owning org is below the item's minRole.
        orgRows = candidate.filter((it) => {
          if (!it.minRole) return true;
          const m = roles.orgs.find((o) => o.organizationId === it.organizationId);
          return m ? orgRoleAtLeast(m.organizationRole, it.minRole) : false;
        });
      }

      // Merge owner-rows and org-rows, dedupe by id (owner wins).
      const merged = new Map<number, typeof hubItems.$inferSelect>();
      for (const r of baseRows) merged.set(r.id, r);
      for (const r of orgRows) if (!merged.has(r.id)) merged.set(r.id, r);
      let rows = Array.from(merged.values());

      // Filter by parent folder
      if (input?.parentFolderId !== undefined) {
        rows = rows.filter((r) => (r.parentFolderId ?? null) === (input.parentFolderId ?? null));
      }
      if (input?.itemType) rows = rows.filter((r) => r.itemType === input.itemType);
      if (input?.query) {
        const q = input.query.toLowerCase();
        rows = rows.filter((r) => r.label.toLowerCase().includes(q));
      }

      // Sort (manual = stored order; recents = lastOpenedAt; name/type/owner)
      const sort = input?.sort ?? "manual";
      if (sort === "recents") {
        rows.sort((a, b) => (b.lastOpenedAt?.getTime() ?? 0) - (a.lastOpenedAt?.getTime() ?? 0));
      } else if (sort === "name") {
        rows.sort((a, b) => a.label.localeCompare(b.label));
      } else if (sort === "type") {
        rows.sort((a, b) => a.itemType.localeCompare(b.itemType) || a.label.localeCompare(b.label));
      } else if (sort === "owner") {
        rows.sort((a, b) => a.ownerUserId - b.ownerUserId || a.label.localeCompare(b.label));
      } else {
        rows.sort(
          (a, b) =>
            a.pageIndex - b.pageIndex ||
            a.sortOrder - b.sortOrder ||
            a.id - b.id,
        );
      }

      // Built-in engine tiles always present at root for authed users.
      const builtins = (input?.parentFolderId ?? null) === null ? BUILTIN_ENGINE_APPS : [];

      return {
        items: rows,
        builtins,
        roles: {
          globalRole: roles.globalRole,
          orgs: roles.orgs.map((o) => ({
            organizationId: o.organizationId,
            organizationName: o.organizationName,
            organizationRole: o.organizationRole,
          })),
        },
      };
    }),

  /**
   * Move/reorder items: change pageIndex, sortOrder, or parentFolderId.
   * Owner-only.
   */
  move: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        pageIndex: z.number().int().min(0).max(99).optional(),
        sortOrder: z.number().int().min(0).max(9999).optional(),
        parentFolderId: z.number().int().nullable().optional(),
        pinnedToDock: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [it] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, input.itemId))
        .limit(1);
      if (!it) throw new TRPCError({ code: "NOT_FOUND" });
      if (it.ownerUserId !== ctx.user.id) {
        const admin = await isGlobalAdmin(ctx.user.id);
        if (!admin) throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can move this item" });
      }
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.pageIndex !== undefined) patch.pageIndex = input.pageIndex;
      if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
      if (input.parentFolderId !== undefined) patch.parentFolderId = input.parentFolderId;
      if (input.pinnedToDock !== undefined) patch.pinnedToDock = input.pinnedToDock ? 1 : 0;
      await db.update(hubItems).set(patch).where(eq(hubItems.id, input.itemId));
      return { ok: true };
    }),

  /** Create a folder. */
  createFolder: protectedProcedure
    .input(
      z.object({
        label: z.string().trim().min(1).max(200),
        icon: z.string().max(256).optional(),
        color: z.string().max(32).optional(),
        pageIndex: z.number().int().min(0).max(99).default(0),
        sortOrder: z.number().int().min(0).max(9999).default(0),
        parentFolderId: z.number().int().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const now = new Date();
      const [r] = await db.insert(hubItems).values({
        ownerUserId: ctx.user.id,
        itemType: "folder",
        label: input.label,
        icon: input.icon ?? "📁",
        color: input.color ?? null,
        pageIndex: input.pageIndex,
        sortOrder: input.sortOrder,
        parentFolderId: input.parentFolderId ?? null,
        visibility: "private",
        createdAt: now,
        updatedAt: now,
      });
      return { id: (r as { insertId: number }).insertId };
    }),

  /**
   * Import (create a new hub item). Used by the create flow:
   *   • new app      → pass appId from a userApps.create result
   *   • import file  → pass payload.fileKey (storage key) + label
   *   • new artifact → pass payload (free-form JSON) + itemType='artifact'
   */
  import: protectedProcedure
    .input(
      z.object({
        itemType: z.enum(["app", "artifact", "file"]),
        label: z.string().trim().min(1).max(200),
        appId: z.number().int().positive().optional(),
        builtinId: z.string().max(96).optional(),
        icon: z.string().max(256).optional(),
        color: z.string().max(32).optional(),
        payload: z.record(z.string(), z.any()).optional(),
        pageIndex: z.number().int().min(0).max(99).default(0),
        sortOrder: z.number().int().min(0).max(9999).default(0),
        parentFolderId: z.number().int().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const now = new Date();
      const [r] = await db.insert(hubItems).values({
        ownerUserId: ctx.user.id,
        itemType: input.itemType,
        label: input.label,
        appId: input.appId ?? null,
        builtinId: input.builtinId ?? null,
        icon: input.icon ?? null,
        color: input.color ?? null,
        payload: input.payload ?? null,
        pageIndex: input.pageIndex,
        sortOrder: input.sortOrder,
        parentFolderId: input.parentFolderId ?? null,
        visibility: "private",
        createdAt: now,
        updatedAt: now,
      });
      return { id: (r as { insertId: number }).insertId };
    }),

  /**
   * Publish — change an item's visibility (and optional org / minRole).
   * Owner-only. global_admin can publish anything.
   */
  publish: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        visibility: visibilityEnum,
        organizationId: z.number().int().positive().nullable().optional(),
        minRole: minRoleEnum.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [it] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, input.itemId))
        .limit(1);
      if (!it) throw new TRPCError({ code: "NOT_FOUND" });
      const admin = await isGlobalAdmin(ctx.user.id);
      if (!admin && it.ownerUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can publish this item" });
      }
      // Validate org membership if publishing to org
      if (input.visibility === "org") {
        if (!input.organizationId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "organizationId is required when publishing to org" });
        }
        if (!admin) {
          const roles = await getCurrentRoles(ctx.user.id);
          const member = roles.orgs.find((o) => o.organizationId === input.organizationId);
          if (!member) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of that organization" });
          }
        }
      }
      await db
        .update(hubItems)
        .set({
          visibility: input.visibility,
          organizationId: input.visibility === "org" ? (input.organizationId ?? null) : null,
          minRole: input.visibility === "org" ? (input.minRole ?? null) : null,
          updatedAt: new Date(),
        })
        .where(eq(hubItems.id, input.itemId));
      return { ok: true };
    }),

  /** Generate a share link (token) for an item the current user owns. */
  createShareLink: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
        maxInstalls: z.number().int().min(1).max(10000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [it] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, input.itemId))
        .limit(1);
      if (!it) throw new TRPCError({ code: "NOT_FOUND" });
      if (it.ownerUserId !== ctx.user.id) {
        const admin = await isGlobalAdmin(ctx.user.id);
        if (!admin) throw new TRPCError({ code: "FORBIDDEN" });
      }
      const token = randomToken();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      await db.insert(hubShareLinks).values({
        token,
        hubItemId: input.itemId,
        createdByUserId: ctx.user.id,
        expiresAt,
        maxInstalls: input.maxInstalls ?? null,
        useCount: 0,
        createdAt: new Date(),
      });
      return { token };
    }),

  /** Install a hub item from a share link. Clones it as a private copy
   *  owned by the installer (so they can re-arrange / publish further). */
  installFromShareLink: protectedProcedure
    .input(z.object({ token: z.string().min(8).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [link] = await db
        .select()
        .from(hubShareLinks)
        .where(eq(hubShareLinks.token, input.token))
        .limit(1);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found" });
      if (link.expiresAt && link.expiresAt < new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Share link expired" });
      }
      if (link.maxInstalls && link.useCount >= link.maxInstalls) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Share link install limit reached" });
      }
      const [src] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, link.hubItemId))
        .limit(1);
      if (!src) throw new TRPCError({ code: "NOT_FOUND", message: "Source item not found" });
      const now = new Date();
      const [r] = await db.insert(hubItems).values({
        ownerUserId: ctx.user.id,
        itemType: src.itemType,
        appId: src.appId,
        builtinId: src.builtinId,
        label: src.label,
        icon: src.icon,
        color: src.color,
        payload: src.payload,
        pageIndex: 0,
        sortOrder: 9999, // append to first page
        parentFolderId: null,
        visibility: "private",
        createdAt: now,
        updatedAt: now,
      });
      await db
        .update(hubShareLinks)
        .set({ useCount: sql`${hubShareLinks.useCount} + 1` })
        .where(eq(hubShareLinks.id, link.id));
      return { id: (r as { insertId: number }).insertId };
    }),

  /** Soft-delete (remove) an item — owner only. */
  remove: protectedProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [it] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, input.itemId))
        .limit(1);
      if (!it) return { ok: true };
      if (it.ownerUserId !== ctx.user.id) {
        const admin = await isGlobalAdmin(ctx.user.id);
        if (!admin) throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.delete(hubItems).where(eq(hubItems.id, input.itemId));
      // R14.16 — record delete in tier-scoped history
      try { await recordHubHistory({ itemBefore: it, itemAfter: null, actorId: ctx.user.id, action: "delete" }); } catch (_) { /* non-blocking */ }
      return { ok: true };
    }),

  /**
   * R14.16 — update label / icon / color / payload of any hub item.
   * Owner-only (or global_admin / org_admin / professional acting in-org).
   * Every change records a row in hub_item_history with tier scoping so
   * users, professionals, and admins can roll back at their level.
   */
  update: protectedProcedure
    .input(
      z.object({
        itemId: z.number().int().positive(),
        label: z.string().trim().min(1).max(200).optional(),
        icon: z.string().max(256).nullable().optional(),
        color: z.string().max(32).nullable().optional(),
        payload: z.record(z.string(), z.any()).nullable().optional(),
        note: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [it] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, input.itemId))
        .limit(1);
      if (!it) throw new TRPCError({ code: "NOT_FOUND" });
      // Authorization: owner / global_admin / professional+ in same org
      let allowed = it.ownerUserId === ctx.user.id;
      if (!allowed) {
        const admin = await isGlobalAdmin(ctx.user.id);
        if (admin) allowed = true;
      }
      if (!allowed && it.organizationId) {
        const roles = await getCurrentRoles(ctx.user.id);
        const m = roles.orgs.find((o) => o.organizationId === it.organizationId);
        if (m && ["professional", "manager", "org_admin", "owner"].includes(m.organizationRole)) {
          allowed = true;
        }
      }
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });

      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.label !== undefined) patch.label = input.label;
      if (input.icon !== undefined) patch.icon = input.icon;
      if (input.color !== undefined) patch.color = input.color;
      if (input.payload !== undefined) patch.payload = input.payload;
      await db.update(hubItems).set(patch).where(eq(hubItems.id, input.itemId));
      const [after] = await db
        .select()
        .from(hubItems)
        .where(eq(hubItems.id, input.itemId))
        .limit(1);
      try {
        await recordHubHistory({
          itemBefore: it,
          itemAfter: after,
          actorId: ctx.user.id,
          action: "update",
          note: input.note,
        });
      } catch (_) { /* non-blocking */ }
      return { ok: true };
    }),

  /** Mark an item as opened (updates lastOpenedAt for "recents" sort). */
  touch: protectedProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      await db
        .update(hubItems)
        .set({ lastOpenedAt: new Date() })
        .where(and(eq(hubItems.id, input.itemId), eq(hubItems.ownerUserId, ctx.user.id)));
      return { ok: true };
    }),

  /** Public catalog of published hub items (visibility='public'). */
  browsePublic: publicProcedure
    .input(
      z.object({
        query: z.string().trim().max(200).optional(),
        itemType: itemTypeEnum.optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }).optional(),
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const conds = [eq(hubItems.visibility, "public")];
      if (input?.itemType) conds.push(eq(hubItems.itemType, input.itemType));
      if (input?.query) {
        conds.push(sql`${hubItems.label} LIKE ${"%" + input.query + "%"}`);
      }
      const rows = await db
        .select()
        .from(hubItems)
        .where(and(...conds))
        .orderBy(desc(hubItems.updatedAt))
        .limit(input?.limit ?? 50);
      return rows;
    }),
});
