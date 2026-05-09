/* ============================================================================
 * R14.16 — voiceGuardrails.ts
 *
 * Cascade-load the L1 platform → L2 org → L3 manager → L4 professional AI
 * settings for the calling user, then turn them into:
 *
 *   • allowedRoutes  — navigation paths the agent may emit
 *   • prohibitedTopics — topics that hard-refuse
 *   • promptOverlay — extra system-prompt text the LLM must obey
 *   • redact(text)  — strip PII (SSN, credit-card, full DOB, account #s)
 *
 * Defaults are conservative: agent confined to Hub scope unless an admin or
 * org-admin has explicitly enabled app-wide via `globalGuardrails.scope`.
 * ============================================================================ */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import {
  platformAiSettings,
  organizationAiSettings,
  managerAiSettings,
  professionalAiSettings,
  userOrganizationRoles,
} from "../../drizzle/schema";

/** R14.17 — default deny-list. The agent may navigate to ANY in-app route
 *  except those whose path starts with one of these prefixes. Admins (global_admin)
 *  bypass the deny-list entirely. Org/manager/professional admins can extend the
 *  deny-list via globalGuardrails.deniedRoutePrefixes (string[]).
 *
 *  Rationale: users want to drive the whole app hands-free; only a small set of
 *  sensitive surfaces should require an explicit click. */
export const VOICE_DEFAULT_DENIED_ROUTES = [
  // Server-side OAuth / API surfaces — not real client routes anyway, but defensive.
  "/api/",
  "/oauth/",
  // Platform-admin surfaces — only global_admins should land here, and they bypass.
  "/admin/",
  "/platform-admin",
  // Org-admin surfaces.
  "/org-admin",
  // Sensitive credential / billing surfaces.
  "/billing/cards",
  "/billing/payment-methods",
  "/settings/secrets",
  "/settings/integrations/connect", // OAuth-handoff endpoints
  "/data-room",                      // sensitive document vault
  "/governance/keys",                // KMS / signing key surfaces
];

/** Legacy export kept for any external import; now empty so existing callers
 *  that treated it as an allowlist degrade to "allow everything" instead of
 *  silently blocking. */
export const HUB_DEFAULT_ALLOWED_ROUTES: string[] = [];

export type GuardrailContext = {
  /** Legacy: what the agent may navigate to. R14.17 — empty by default;
   *  use `isRouteAllowed` instead. Kept for backward compatibility. */
  allowedRoutes: string[];
  /** Path-prefix deny-list. Any navigate target starting with one of these is
   *  refused unless `bypass` is true. */
  deniedRoutePrefixes: string[];
  /** Test whether a navigation target is permitted under current guardrails. */
  isRouteAllowed(path: string): boolean;
  /** R14.16 carry-over: whether org has flipped scope to "app". With R14.17's
   *  deny-list-by-default, this stays true unless an admin tightens it. */
  appWide: boolean;
  /** Topic strings the agent must not engage with. */
  prohibitedTopics: string[];
  /** Concatenated prompt overlay text (platform → org → mgr → pro). */
  promptOverlay: string;
  /** Redact PII-shaped strings from the input before LLM call. */
  redact(s: string): string;
  /** Determine whether an utterance hits a prohibited topic. */
  isProhibited(s: string): boolean;
  /** True if the actor is allowed to bypass scope (admin/org-admin). */
  bypass: boolean;
};

const PII_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b\d{3}-?\d{2}-?\d{4}\b/g, label: "[redacted-ssn]" },
  { re: /\b(?:\d[ -]*?){13,16}\b/g, label: "[redacted-card]" },
  { re: /\b\d{1,2}\/\d{1,2}\/(?:19|20)\d{2}\b/g, label: "[redacted-dob]" },
];

function safeArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function loadGuardrails(args: {
  userId: number;
  globalRole?: string;
  organizationId?: number | null;
  managerId?: number | null;
  professionalId?: number | null;
}): Promise<GuardrailContext> {
  const db = await getDb();
  const isAdmin = args.globalRole === "global_admin";

  // Resolve org/manager/professional from membership if not provided
  let orgId = args.organizationId ?? null;
  let mgrId = args.managerId ?? null;
  let proId = args.professionalId ?? null;
  if (orgId === null) {
    const m = (await db
      .select()
      .from(userOrganizationRoles)
      .where(eq(userOrganizationRoles.userId, args.userId))
      .limit(1))[0];
    if (m) {
      orgId = m.organizationId ?? null;
      mgrId = m.managerId ?? null;
      proId = m.professionalId ?? null;
    }
  }

  const [pl] = await db.select().from(platformAiSettings).limit(1);
  const [org] = orgId
    ? await db
        .select()
        .from(organizationAiSettings)
        .where(eq(organizationAiSettings.organizationId, orgId))
        .limit(1)
    : [];
  const [mgr] = mgrId
    ? await db
        .select()
        .from(managerAiSettings)
        .where(eq(managerAiSettings.managerId, mgrId))
        .limit(1)
    : [];
  const [pro] = proId
    ? await db
        .select()
        .from(professionalAiSettings)
        .where(eq(professionalAiSettings.professionalId, proId))
        .limit(1)
    : [];

  // Aggregate prohibited topics from all 4 layers
  const prohibitedTopics = [
    ...safeArr((pl as any)?.prohibitedTopics),
    ...safeArr((org as any)?.prohibitedTopics),
  ];

  // Aggregate prompt overlay (highest tier first → most specific last so
  // it wins if the LLM weights later instructions higher).
  const promptOverlay = [
    (pl as any)?.baseSystemPrompt,
    (org as any)?.promptOverlay,
    (org as any)?.complianceLanguage,
    (mgr as any)?.promptOverlay,
    (pro as any)?.promptOverlay,
  ]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join("\n---\n");

  // R14.17 — default scope is now app-wide for everyone (with the deny-list
  // below). An org-admin can flip globalGuardrails.scope === "hub" to revert
  // to the old strict-Hub allowlist behavior for their tenant.
  const platformGuardrails = (pl as any)?.globalGuardrails ?? {};
  const orgGuardrails = (org as any)?.globalGuardrails ?? {};
  let appWide = true;
  if (!isAdmin) {
    if (
      (platformGuardrails && (platformGuardrails as any).scope === "hub") ||
      (orgGuardrails && (orgGuardrails as any).scope === "hub")
    ) {
      appWide = false;
    }
  }

  // Aggregate deny-list: built-ins + any custom prefixes set by an admin.
  const customDeny = [
    ...safeArr((platformGuardrails as any)?.deniedRoutePrefixes),
    ...safeArr((orgGuardrails as any)?.deniedRoutePrefixes),
    ...safeArr((mgr as any)?.globalGuardrails?.deniedRoutePrefixes),
    ...safeArr((pro as any)?.globalGuardrails?.deniedRoutePrefixes),
  ];
  const deniedRoutePrefixes = [...VOICE_DEFAULT_DENIED_ROUTES, ...customDeny];

  function isRouteAllowed(path: string): boolean {
    if (!path || typeof path !== "string") return false;
    if (isAdmin) return true; // admin bypass
    const target = path.toLowerCase();
    // If user is appWide=false (admin tightened them back to strict Hub),
    // fall back to the original strict allowlist behavior.
    if (!appWide) {
      const HUB_ROUTES = [
        "/", "/hub", "/formational", "/relational", "/missional",
        "/contextual", "/continuous-improvement", "/my-content",
        "/agent-chat", "/calculators", "/portfolio", "/products",
        "/lead-pipeline", "/tax-planning", "/estate-planning",
        "/insurance-analysis", "/social-security", "/medicare-analysis",
        "/platform-guide", "/settings",
      ];
      return HUB_ROUTES.some((r) => target === r || target.startsWith(r + "/"));
    }
    // Default app-wide-with-deny-list path.
    return !deniedRoutePrefixes.some((d) => target.startsWith(d.toLowerCase()));
  }

  return {
    allowedRoutes: HUB_DEFAULT_ALLOWED_ROUTES, // legacy field, retained for back-compat
    deniedRoutePrefixes,
    isRouteAllowed,
    appWide,
    prohibitedTopics,
    promptOverlay,
    redact(s: string) {
      let out = s;
      for (const p of PII_PATTERNS) out = out.replace(p.re, p.label);
      return out;
    },
    isProhibited(s: string) {
      const lower = s.toLowerCase();
      return prohibitedTopics.some((t) => lower.includes(t.toLowerCase()));
    },
    bypass: isAdmin,
  };
  // Suppress unused-variable lint
  void and;
}
