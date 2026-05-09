/**
 * InlineAppletRegistry.tsx — R14.14
 *
 * Maps the agent's `open_applet` ids to lazy-loaded React components that
 * AgentChat can embed inline. The component is rendered with `embedded={true}`
 * so each applet hides its outer chrome (sidebar/header) when shown in chat.
 */
import { lazy, Suspense, type ComponentType } from "react";

type EmbeddedComponent = ComponentType<{ embedded?: boolean }>;

const APPLETS: Record<string, () => Promise<{ default: EmbeddedComponent }>> = {
  formational: () => import("@/pages/learning/LearningHome") as any,
  contextual: () => import("@/pages/IntelligenceHubV2") as any,
  calculator: () => import("@/pages/Calculators") as any,
  tax: () => import("@/pages/TaxPlanning") as any,
  estate: () => import("@/pages/EstatePlanning") as any,
  insurance: () => import("@/pages/InsuranceAnalysis") as any,
  portfolio: () => import("@/pages/PortfolioPage") as any,
  products: () => import("@/pages/Products") as any,
  "lead-pipeline": () => import("@/pages/LeadPipeline") as any,
  "my-content": () => import("@/pages/MyContent") as any,
  "platform-guide": () => import("@/pages/PlatformGuide") as any,
};

const COMPONENT_CACHE = new Map<string, EmbeddedComponent>();

function resolveApplet(id: string): EmbeddedComponent | null {
  const loader = APPLETS[id];
  if (!loader) return null;
  if (!COMPONENT_CACHE.has(id)) {
    COMPONENT_CACHE.set(id, lazy(loader as any));
  }
  return COMPONENT_CACHE.get(id) ?? null;
}

export function InlineApplet({ id }: { id: string }) {
  const Component = resolveApplet(id);
  if (!Component) {
    return (
      <div className="text-xs text-muted-foreground border border-dashed border-border/50 rounded-lg p-3">
        No applet registered for "{id}".
      </div>
    );
  }
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
        <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        Loading {id}…
      </div>
    }>
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-2 max-h-[70vh] overflow-y-auto">
        <Component embedded />
      </div>
    </Suspense>
  );
}

export function isAppletAvailable(id: string): boolean {
  return id in APPLETS;
}

export function listAppletIds(): string[] {
  return Object.keys(APPLETS);
}

/**
 * R14.16 — Resolve a Hub item's `kind` to the right inline applet so the chat
 * agent can embed ANY Hub item, not the 11 hard-coded ones.
 *
 * Mapping rules (best-effort; falls back to a payload-aware viewer):
 *   - kind starts with "applet:" → the suffix is treated as the applet id
 *   - kind matches a known applet id → use it
 *   - otherwise → generic JSON viewer (still honours embed mode)
 */
export function appletIdForHubItemKind(kind?: string | null): string | null {
  if (!kind) return null;
  const k = kind.toLowerCase();
  if (k.startsWith("applet:")) {
    const id = k.slice("applet:".length);
    return id in APPLETS ? id : null;
  }
  if (k in APPLETS) return k;
  // Common kind → applet id mappings used by hub_items.kind values today
  const KIND_TO_APPLET: Record<string, string> = {
    "learning": "formational",
    "learning_track": "formational",
    "intelligence": "contextual",
    "calculator": "calculator",
    "tax_plan": "tax",
    "estate_plan": "estate",
    "insurance_review": "insurance",
    "portfolio": "portfolio",
    "product": "products",
    "lead": "lead-pipeline",
    "note": "my-content",
    "guide": "platform-guide",
  };
  return KIND_TO_APPLET[k] ?? null;
}



/**
 * R14.16 — Dynamic Hub-item embed. Looks up the hub_item by id, finds its
 * `kind`, resolves the matching applet, and renders it inline. Falls back to a
 * compact JSON viewer when no applet matches the kind so the chat agent can
 * still surface the item's content meaningfully.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export function HubItemEmbed({ itemId }: { itemId: number }) {
  const { data, isLoading, error } = trpc.hub.list.useQuery();
  const item = useMemo(
    () => (Array.isArray(data) ? (data as any[]).find((x) => x.id === itemId) : null),
    [data, itemId],
  );
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
        <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        Loading Hub item…
      </div>
    );
  }
  if (error || !item) {
    return (
      <div className="text-xs text-destructive border border-dashed border-destructive/50 rounded-lg p-3">
        Hub item #{itemId} could not be loaded.
      </div>
    );
  }
  const appletId = appletIdForHubItemKind(item.kind);
  if (appletId) return <InlineApplet id={appletId} />;
  // Fallback: payload viewer
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-3 text-xs">
      <div className="font-medium mb-1">{item.label || item.kind}</div>
      <pre className="whitespace-pre-wrap break-words text-muted-foreground max-h-[40vh] overflow-y-auto">
        {JSON.stringify(item.payload ?? {}, null, 2)}
      </pre>
    </div>
  );
}
