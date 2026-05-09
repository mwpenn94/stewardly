/**
 * Apps router — user-installable apps catalog.
 *
 * Exposes the procedures the Apps drawer needs to show installed apps,
 * create a new user-app, browse the public catalog, install via share link,
 * and publish/unpublish.
 *
 * Backed by `userApps` + `appInstalls` + `appShareLinks` (drizzle/schema.ts).
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { userApps, appInstalls, appShareLinks } from "../../drizzle/schema";

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

/** Generate a short URL-safe random token for share links. */
function randomToken(len = 24): string {
  // 24 chars from a 16-byte buffer base64-url encoded
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, len);
}

/** Generate a slug from a name; ensures uniqueness with a numeric suffix. */
async function uniqueSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "app";
  let candidate = base;
  let n = 1;
  // Loop until we find a free slug
  while (true) {
    const db = await requireDb();
    const existing = await db
      .select({ id: userApps.id })
      .from(userApps)
      .where(eq(userApps.slug, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 9999) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not generate a unique slug",
      });
    }
  }
}

export const appsRouter = router({
  /**
   * List apps the current user has installed (or owns).
   * Used to populate the Apps drawer's "Installed" group.
   */
  listInstalled: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const userId = ctx.user.id;
    // Owner-installed (auto) + explicit installs
    const owned = await db
      .select()
      .from(userApps)
      .where(eq(userApps.ownerUserId, userId))
      .orderBy(desc(userApps.updatedAt));

    const installed = await db
      .select({
        app: userApps,
        install: appInstalls,
      })
      .from(appInstalls)
      .innerJoin(userApps, eq(appInstalls.appId, userApps.id))
      .where(eq(appInstalls.userId, userId))
      .orderBy(desc(appInstalls.installedAt));

    // Dedupe — if the user owns + has an install row, prefer the install row's source
    const byId = new Map<number, { app: typeof userApps.$inferSelect; source: string; installedAt: Date | null }>();
    for (const row of installed) {
      byId.set(row.app.id, {
        app: row.app,
        source: row.install.installSource,
        installedAt: row.install.installedAt ?? null,
      });
    }
    for (const a of owned) {
      if (!byId.has(a.id)) {
        byId.set(a.id, { app: a, source: "created", installedAt: a.createdAt ?? null });
      }
    }
    return Array.from(byId.values());
  }),

  /**
   * Browse the public catalog. Optionally filter by search query.
   */
  browsePublic: publicProcedure
    .input(
      z.object({
        query: z.string().trim().max(200).optional(),
        limit: z.number().int().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const where = input.query
        ? and(
            eq(userApps.visibility, "public"),
            sql`(${userApps.name} LIKE ${"%" + input.query + "%"} OR ${userApps.description} LIKE ${"%" + input.query + "%"})`,
          )
        : eq(userApps.visibility, "public");
      const rows = await db
        .select()
        .from(userApps)
        .where(where)
        .orderBy(desc(userApps.installCount), desc(userApps.updatedAt))
        .limit(input.limit);
      return rows;
    }),

  /**
   * Create a new app owned by the current user.
   * Auto-installs it for the owner so it appears in the Apps drawer.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().max(2000).optional(),
        icon: z.string().max(256).optional(),
        visibility: z.enum(["private", "unlisted", "public"]).default("private"),
        config: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const slug = await uniqueSlug(input.name);
      const now = new Date();
      const [result] = await db.insert(userApps).values({
        slug,
        ownerUserId: ctx.user.id,
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        visibility: input.visibility,
        config: input.config ?? null,
        installCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      const insertId = (result as { insertId: number }).insertId;
      // Auto-install for the owner
      await db.insert(appInstalls).values({
        appId: insertId,
        userId: ctx.user.id,
        installSource: "created",
        installedAt: now,
      });
      const [app] = await db
        .select()
        .from(userApps)
        .where(eq(userApps.id, insertId))
        .limit(1);
      return app;
    }),

  /**
   * Install a public app from the catalog.
   */
  installPublic: protectedProcedure
    .input(z.object({ appId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [app] = await db
        .select()
        .from(userApps)
        .where(eq(userApps.id, input.appId))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      if (app.visibility !== "public") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "App is not publicly installable",
        });
      }
      // Idempotent: skip if already installed
      const existing = await db
        .select({ id: appInstalls.id })
        .from(appInstalls)
        .where(
          and(
            eq(appInstalls.userId, ctx.user.id),
            eq(appInstalls.appId, input.appId),
          ),
        )
        .limit(1);
      if (existing.length > 0) return { app, alreadyInstalled: true };

      await db.insert(appInstalls).values({
        appId: input.appId,
        userId: ctx.user.id,
        installSource: "public_catalog",
        installedAt: new Date(),
      });
      await db
        .update(userApps)
        .set({
          installCount: sql`${userApps.installCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userApps.id, input.appId));
      return { app, alreadyInstalled: false };
    }),

  /**
   * Install via a share link token (unlisted apps).
   */
  installFromShareLink: protectedProcedure
    .input(z.object({ token: z.string().min(8).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [link] = await db
        .select()
        .from(appShareLinks)
        .where(eq(appShareLinks.token, input.token))
        .limit(1);
      if (!link) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Share link not found",
        });
      }
      if (link.expiresAt && link.expiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Share link has expired",
        });
      }
      if (link.maxInstalls && link.useCount >= link.maxInstalls) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Share link has reached its install limit",
        });
      }
      const [app] = await db
        .select()
        .from(userApps)
        .where(eq(userApps.id, link.appId))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      // Idempotent install
      const existing = await db
        .select({ id: appInstalls.id })
        .from(appInstalls)
        .where(
          and(
            eq(appInstalls.userId, ctx.user.id),
            eq(appInstalls.appId, link.appId),
          ),
        )
        .limit(1);
      if (existing.length > 0) return { app, alreadyInstalled: true };

      await db.insert(appInstalls).values({
        appId: link.appId,
        userId: ctx.user.id,
        installSource: "share_link",
        shareLinkToken: link.token,
        installedAt: new Date(),
      });
      await db
        .update(appShareLinks)
        .set({ useCount: sql`${appShareLinks.useCount} + 1` })
        .where(eq(appShareLinks.id, link.id));
      await db
        .update(userApps)
        .set({
          installCount: sql`${userApps.installCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(userApps.id, link.appId));
      return { app, alreadyInstalled: false };
    }),

  /**
   * Generate a share link for an app the current user owns.
   */
  createShareLink: protectedProcedure
    .input(
      z.object({
        appId: z.number().int().positive(),
        expiresInDays: z.number().int().min(1).max(365).optional(),
        maxInstalls: z.number().int().min(1).max(10000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [app] = await db
        .select()
        .from(userApps)
        .where(eq(userApps.id, input.appId))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      if (app.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can create share links for an app",
        });
      }
      const token = randomToken();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;
      await db.insert(appShareLinks).values({
        token,
        appId: input.appId,
        createdByUserId: ctx.user.id,
        expiresAt,
        maxInstalls: input.maxInstalls ?? null,
        useCount: 0,
        createdAt: new Date(),
      });
      return { token };
    }),

  /**
   * Update visibility (owner only). Used by the publish/unpublish flow.
   */
  setVisibility: protectedProcedure
    .input(
      z.object({
        appId: z.number().int().positive(),
        visibility: z.enum(["private", "unlisted", "public"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [app] = await db
        .select()
        .from(userApps)
        .where(eq(userApps.id, input.appId))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      if (app.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can change visibility",
        });
      }
      await db
        .update(userApps)
        .set({ visibility: input.visibility, updatedAt: new Date() })
        .where(eq(userApps.id, input.appId));
      return { ok: true };
    }),

  /**
   * Resolve an app by its slug. Used by the /apps/:slug route resolver.
   * - Public apps are visible to anyone.
   * - Unlisted apps are visible only to users who have installed them.
   * - Private apps are visible only to the owner.
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(96) }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const [app] = await db
        .select()
        .from(userApps)
        .where(eq(userApps.slug, input.slug))
        .limit(1);
      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      // Visibility check
      if (app.visibility === "public") {
        return { app, installed: false };
      }
      if (!ctx.user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      // Check if user owns it or has installed it
      if (app.ownerUserId === ctx.user.id) {
        return { app, installed: true };
      }
      const [install] = await db
        .select()
        .from(appInstalls)
        .where(
          and(
            eq(appInstalls.userId, ctx.user.id),
            eq(appInstalls.appId, app.id),
          ),
        )
        .limit(1);
      if (!install) {
        throw new TRPCError({ code: "NOT_FOUND", message: "App not found" });
      }
      return { app, installed: true };
    }),
});
