/**
 * Wave G — Applet-instance integration registry
 * ================================================
 *
 * Commitment C-27 / C-28: every imported applet instance from the
 * predecessor surfaces (emba_modules → Formational engine; stewardly-ai
 * → Relational engine) is enumerated in a typed registry so the UI can
 * render them, tests can verify coverage, and CI can flag missing
 * imports.
 *
 * Each entry pairs a stable `instanceId` with the engine it belongs to,
 * the source repo it was imported from, the canonical applet route, and
 * the command-center pattern that exposes it (sidebar tab, command-K
 * pattern, deep-link, etc.).
 *
 * The registry is pure data + a tiny query helper; tests and tRPC
 * procedures consume it directly.
 */

import type { EngineId } from "../engines/continuous-improvement/coverage";

export type CommandCenterPattern =
  | "applet-sidebar-tab"
  | "command-k-action"
  | "deep-link"
  | "dashboard-tile"
  | "task-action";

export interface AppletInstance {
  instanceId: string;
  engineId: EngineId;
  /** Origin repo this was imported from. */
  source: "emba_modules" | "stewardly-ai" | "stewardly-v3-native";
  /** Human-readable title for UI. */
  title: string;
  /** Route path (relative to client app root). */
  route: string;
  /** Command-center patterns the user can invoke this instance through. */
  patterns: readonly CommandCenterPattern[];
  /** Short description shown in the command-K palette. */
  description: string;
}

export const APPLET_INSTANCES: readonly AppletInstance[] = [
  // ─────────────────────────────────────────────────────────────────
  // Formational (imported from emba_modules)
  // ─────────────────────────────────────────────────────────────────
  {
    instanceId: "formational.learning-home",
    engineId: "formational",
    source: "emba_modules",
    title: "Learning Home",
    route: "/formational/learning",
    patterns: ["applet-sidebar-tab", "command-k-action"],
    description: "Curriculum overview, recommended tracks, and pace controls.",
  },
  {
    instanceId: "formational.skills",
    engineId: "formational",
    source: "emba_modules",
    title: "Skills",
    route: "/formational/skills",
    patterns: ["applet-sidebar-tab", "dashboard-tile"],
    description: "Practitioner skills assessment and certification ladder.",
  },
  {
    instanceId: "formational.sovereign-study",
    engineId: "formational",
    source: "emba_modules",
    title: "Sovereign Study",
    route: "/formational/sovereign-study",
    patterns: ["applet-sidebar-tab"],
    description: "Self-directed study mode with offline-first content.",
  },
  {
    instanceId: "formational.my-content",
    engineId: "formational",
    source: "emba_modules",
    title: "My Content",
    route: "/formational/my-content",
    patterns: ["applet-sidebar-tab"],
    description: "Practitioner-curated content library.",
  },
  {
    instanceId: "formational.knowledge-admin",
    engineId: "formational",
    source: "emba_modules",
    title: "Knowledge Admin",
    route: "/formational/knowledge-admin",
    patterns: ["applet-sidebar-tab", "deep-link"],
    description: "Admin surface for knowledge ingestion + curation.",
  },
  {
    instanceId: "formational.deep-research",
    engineId: "formational",
    source: "emba_modules",
    title: "Deep Research",
    route: "/formational/deep-research",
    patterns: ["applet-sidebar-tab", "task-action"],
    description: "Research workflows backed by the deep-research skill.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Relational (imported from stewardly-ai)
  // ─────────────────────────────────────────────────────────────────
  {
    instanceId: "relational.contacts",
    engineId: "relational",
    source: "stewardly-ai",
    title: "Contacts",
    route: "/relational/contacts",
    patterns: ["applet-sidebar-tab", "command-k-action"],
    description: "Contact directory with reconnect and stewardship cadence.",
  },
  {
    instanceId: "relational.outreach",
    engineId: "relational",
    source: "stewardly-ai",
    title: "Outreach",
    route: "/relational/outreach",
    patterns: ["applet-sidebar-tab", "task-action"],
    description: "Outreach drafting with steward-aligned templates.",
  },
  {
    instanceId: "relational.pipeline",
    engineId: "relational",
    source: "stewardly-ai",
    title: "Pipeline",
    route: "/relational/pipeline",
    patterns: ["applet-sidebar-tab", "dashboard-tile"],
    description: "Stewardship pipeline view with stage transitions.",
  },
  {
    instanceId: "relational.community",
    engineId: "relational",
    source: "stewardly-ai",
    title: "Community",
    route: "/relational/community",
    patterns: ["applet-sidebar-tab"],
    description: "Community/cohort surface for relational broadcasts.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Missional (native v3)
  // ─────────────────────────────────────────────────────────────────
  {
    instanceId: "missional.calculators",
    engineId: "missional",
    source: "stewardly-v3-native",
    title: "Calculators",
    route: "/missional/calculators",
    patterns: ["applet-sidebar-tab", "command-k-action", "task-action"],
    description: "Wealth, planning, and stewardship calculators.",
  },
  {
    instanceId: "missional.advice-drafting",
    engineId: "missional",
    source: "stewardly-v3-native",
    title: "Advice Drafting",
    route: "/missional/advice",
    patterns: ["applet-sidebar-tab", "task-action"],
    description: "Tier 1/2/3 advice drafting with counsel-gate integration.",
  },
  {
    instanceId: "missional.specialty",
    engineId: "missional",
    source: "stewardly-v3-native",
    title: "Specialty Stewardship",
    route: "/missional/specialty",
    patterns: ["applet-sidebar-tab"],
    description: "Specialty workflows (estate, business, charitable, etc.).",
  },

  // ─────────────────────────────────────────────────────────────────
  // Contextual (native v3)
  // ─────────────────────────────────────────────────────────────────
  {
    instanceId: "contextual.memory",
    engineId: "contextual",
    source: "stewardly-v3-native",
    title: "Memory",
    route: "/contextual/memory",
    patterns: ["applet-sidebar-tab", "command-k-action"],
    description: "M1–M8 memory entries, classification, and TTL.",
  },
  {
    instanceId: "contextual.audit",
    engineId: "contextual",
    source: "stewardly-v3-native",
    title: "Audit Trail",
    route: "/contextual/audit",
    patterns: ["applet-sidebar-tab", "deep-link"],
    description: "Read-only audit trail across engines.",
  },
  {
    instanceId: "contextual.search",
    engineId: "contextual",
    source: "stewardly-v3-native",
    title: "Search",
    route: "/contextual/search",
    patterns: ["applet-sidebar-tab", "command-k-action"],
    description: "Cross-engine search with provenance.",
  },
  {
    instanceId: "contextual.vault",
    engineId: "contextual",
    source: "stewardly-v3-native",
    title: "Vault",
    route: "/contextual/vault",
    patterns: ["applet-sidebar-tab"],
    description: "Encrypted vault for client documents and credentials.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Continuous Improvement (native v3)
  // ─────────────────────────────────────────────────────────────────
  {
    instanceId: "continuous-improvement.coverage",
    engineId: "continuous-improvement",
    source: "stewardly-v3-native",
    title: "Coverage Snapshot",
    route: "/continuous-improvement/coverage",
    patterns: ["dashboard-tile", "command-k-action"],
    description: "Live commitment-coverage view across all engines.",
  },
  {
    instanceId: "continuous-improvement.roundtrip",
    engineId: "continuous-improvement",
    source: "stewardly-v3-native",
    title: "Round-Trip Metrics",
    route: "/continuous-improvement/roundtrip",
    patterns: ["dashboard-tile"],
    description: "TaskChat → Hub round-trip latency and success rate.",
  },
  {
    instanceId: "continuous-improvement.byom-setup",
    engineId: "continuous-improvement",
    source: "stewardly-v3-native",
    title: "BYOM Setup",
    route: "/continuous-improvement/byom",
    patterns: ["dashboard-tile", "task-action"],
    description: "Single-button-press BYO model onboarding.",
  },
];

/* ------------------------------------------------------------------ *
 * Query helpers                                                       *
 * ------------------------------------------------------------------ */

export function listByEngine(engineId: EngineId): AppletInstance[] {
  return APPLET_INSTANCES.filter((a) => a.engineId === engineId);
}

export function listBySource(source: AppletInstance["source"]): AppletInstance[] {
  return APPLET_INSTANCES.filter((a) => a.source === source);
}

export function listByPattern(pattern: CommandCenterPattern): AppletInstance[] {
  return APPLET_INSTANCES.filter((a) => a.patterns.includes(pattern));
}

export function getInstance(instanceId: string): AppletInstance | undefined {
  return APPLET_INSTANCES.find((a) => a.instanceId === instanceId);
}
