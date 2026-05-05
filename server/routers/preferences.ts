import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getUserPreferences, upsertUserPreferences } from "../db";

export const preferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getUserPreferences(ctx.user.id);
    return prefs ?? {
      generalSettings: { notifications: true, soundEffects: false, autoExpandActions: true, compactMode: false, theme: 'dark' },
      capabilities: {},
      systemPrompt: null,
      recursiveOptimizationEnabled: false,
      recursiveOptimizationDepth: 3,
      recursiveOptimizationTemperature: 'balanced',
    };
  }),

  save: protectedProcedure
    .input(z.object({
      generalSettings: z.record(z.string(), z.unknown()).optional(),
      capabilities: z.record(z.string(), z.boolean()).optional(),
      systemPrompt: z.string().nullable().optional(),
      recursiveOptimizationEnabled: z.boolean().optional(),
      recursiveOptimizationDepth: z.number().min(1).max(1280).optional(),
      recursiveOptimizationTemperature: z.enum(['conservative', 'balanced', 'exploratory']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return upsertUserPreferences({
        userId: ctx.user.id,
        generalSettings: input.generalSettings ?? undefined,
        capabilities: input.capabilities ?? undefined,
        systemPrompt: input.systemPrompt !== undefined ? input.systemPrompt : undefined,
        recursiveOptimizationEnabled: input.recursiveOptimizationEnabled,
        recursiveOptimizationDepth: input.recursiveOptimizationDepth,
        recursiveOptimizationTemperature: input.recursiveOptimizationTemperature,
      });
    }),

  // ── Preview Tier Settings ──
  getPreviewTier: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getUserPreferences(ctx.user.id);
    return {
      previewTier: prefs?.previewTier || "auto",
      vercelProjectId: prefs?.vercelProjectId || null,
      vercelTeamSlug: prefs?.vercelTeamSlug || null,
      codespaceScopeGranted: prefs?.codespaceScopeGranted || false,
    };
  }),

  /**
   * checkCodespaceScope — Validates the user's GitHub token in real-time
   * to determine if it has the `codespace` scope (or full permissions).
   * Returns { hasScope, scopes, username, source } so the UI can show
   * live status instead of relying on a static boolean.
   */
  checkCodespaceScope: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { resolveGitHubAuth } = await import("../services/githubAuthFailover");
      const auth = await resolveGitHubAuth({ userId: ctx.user.id, validate: true });
      if (!auth) {
        return { hasScope: false, scopes: [], username: null, source: null, error: "No GitHub token found. Connect GitHub in Connectors." };
      }
      // Validate token and get scopes from x-oauth-scopes header
      const resp = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (resp.status !== 200) {
        return { hasScope: false, scopes: [], username: auth.username || null, source: auth.source, error: "Token validation failed" };
      }
      const scopeHeader = resp.headers.get("x-oauth-scopes") || "";
      const scopes = scopeHeader.split(",").map(s => s.trim()).filter(Boolean);
      // Classic PATs with all permissions return empty scope header but have full access
      // Fine-grained PATs also return empty scope header but use different permission model
      // If token is valid and scope header is empty, assume full access (classic PAT behavior)
      const hasCodespaceScope = scopes.length === 0 || scopes.includes("codespace") || scopes.includes("repo");
      // Auto-update the preference if scope is detected
      if (hasCodespaceScope) {
        await upsertUserPreferences({ userId: ctx.user.id, codespaceScopeGranted: true });
      }
      return { hasScope: hasCodespaceScope, scopes, username: auth.username || null, source: auth.source, error: null };
    } catch (err: any) {
      return { hasScope: false, scopes: [], username: null, source: null, error: err.message || "Scope check failed" };
    }
  }),

  savePreviewTier: protectedProcedure
    .input(z.object({
      previewTier: z.enum(["auto", "webcontainer", "vercel", "codespace"]),
      vercelProjectId: z.string().nullable().optional(),
      vercelTeamSlug: z.string().nullable().optional(),
      codespaceScopeGranted: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return upsertUserPreferences({
        userId: ctx.user.id,
        previewTier: input.previewTier,
        vercelProjectId: input.vercelProjectId ?? undefined,
        vercelTeamSlug: input.vercelTeamSlug ?? undefined,
        codespaceScopeGranted: input.codespaceScopeGranted,
      });
    }),

  // ── Search Engine Configuration ──
  getSearchConfig: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getUserPreferences(ctx.user.id);
    const config = (prefs as any)?.searchConfig || {};
    return {
      searxngUrl: config.searxngUrl || "",
      braveApiKey: config.braveApiKey || "",
    };
  }),

  saveSearchConfig: protectedProcedure
    .input(z.object({
      searxngUrl: z.string().optional(),
      braveApiKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return upsertUserPreferences({
        userId: ctx.user.id,
        searchConfig: {
          searxngUrl: input.searxngUrl || undefined,
          braveApiKey: input.braveApiKey || undefined,
        },
      } as any);
    }),
});
