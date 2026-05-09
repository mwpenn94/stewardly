/**
 * /contextual — Contextual Applet
 * ================================
 *
 * Wave B.4 — single-applet shell for the Contextual engine surface.
 *
 * The Contextual engine is the engine of institutional context: the
 * cross-session memory store, the immutable audit trail, the tenant-scoped
 * search index, and the encrypted document vault. (See
 * `server/engines/contextual/index.ts` for the authoritative intent set:
 * `contextual.memory.{read,write,export}`, `contextual.audit.read`,
 * `contextual.search.query`, `contextual.vault.{upload,download}`.)
 *
 * This applet exposes the user-facing surfaces that map to those intents,
 * organized in three groups so users see the engine's responsibilities
 * the way the substrate organizes them.
 *
 * Surfaces included:
 *
 *   Memory (substrate slice)
 *     - Memory                 ← cross-session memory CRUD
 *
 *   Audit & Compliance
 *     - Audit Trail            ← admin-grade immutable audit view
 *     - Compliance Audit       ← compliance-class audit dashboard
 *     - Data Freshness         ← freshness/last-updated trail
 *
 *   Search & Vault
 *     - Knowledge Admin        ← tenant-scoped search index admin
 *     - Library                ← encrypted artifact + file vault
 *     - Deep Research          ← search-cascade planner surface
 *     - Intelligence Hub       ← retained intelligence overlay
 *
 * URL stays under `/contextual/*` so the scoped sidebar persists across
 * navigation. Each sub-route mounts the source page; pages that already
 * accept the `embedded` prop receive it.
 */
import { lazy, Suspense, useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Layers,
  BrainCircuit,
  ShieldCheck,
  ScrollText,
  Clock,
  Database,
  Library as LibraryIcon,
  Telescope,
  Activity,
} from "lucide-react";

const MemoryPage = lazy(() => import("./MemoryPage"));
const AdminAuditTrail = lazy(() => import("./AdminAuditTrail"));
const ComplianceAudit = lazy(() => import("./ComplianceAudit"));
const AdminDataFreshness = lazy(() => import("./AdminDataFreshness"));
const KnowledgeAdmin = lazy(() => import("./KnowledgeAdmin"));
const Library = lazy(() => import("./Library"));
const DeepResearchPage = lazy(() => import("./DeepResearchPage"));
const IntelligenceHubV2 = lazy(() => import("./IntelligenceHubV2"));

type TabId =
  | "memory"
  | "audit-trail"
  | "compliance-audit"
  | "data-freshness"
  | "knowledge-admin"
  | "vault"
  | "deep-research"
  | "intelligence";

const SECTIONS: { group: string; items: { id: TabId; label: string; icon: React.ElementType; description?: string }[] }[] = [
  {
    group: "Memory",
    items: [
      { id: "memory", label: "Memory", icon: BrainCircuit, description: "Cross-session memory" },
    ],
  },
  {
    group: "Audit & Compliance",
    items: [
      { id: "audit-trail", label: "Audit Trail", icon: ScrollText, description: "Immutable audit view" },
      { id: "compliance-audit", label: "Compliance Audit", icon: ShieldCheck, description: "Compliance dashboard" },
      { id: "data-freshness", label: "Data Freshness", icon: Clock, description: "Last-updated trail" },
    ],
  },
  {
    group: "Search & Vault",
    items: [
      { id: "knowledge-admin", label: "Search Index", icon: Database, description: "Tenant search index admin" },
      { id: "vault", label: "Vault", icon: LibraryIcon, description: "Artifact + file vault" },
      { id: "deep-research", label: "Deep Research", icon: Telescope, description: "Search-cascade planner" },
      { id: "intelligence", label: "Intelligence Hub", icon: Activity, description: "Retained intelligence overlay" },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

function Panel({ tab }: { tab: TabId }) {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      {tab === "memory" && <MemoryPage />}
      {tab === "audit-trail" && <AdminAuditTrail embedded />}
      {tab === "compliance-audit" && <ComplianceAudit />}
      {tab === "data-freshness" && <AdminDataFreshness />}
      {tab === "knowledge-admin" && <KnowledgeAdmin embedded />}
      {tab === "vault" && <Library />}
      {tab === "deep-research" && <DeepResearchPage />}
      {tab === "intelligence" && <IntelligenceHubV2 embedded />}
    </Suspense>
  );
}

export default function ContextualApplet() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/contextual/:tab");
  const activeTab: TabId = useMemo(() => {
    const t = params?.tab as TabId | undefined;
    return ALL_ITEMS.find((i) => i.id === t)?.id ?? "memory";
  }, [params?.tab]);

  return (
    <div className="flex h-full min-h-0">
      {/* Scoped applet sidebar (desktop) */}
      <aside
        role="complementary"
        aria-label="Contextual applet navigation"
        className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/30 bg-card/30"
      >
        <div className="px-3 py-4 border-b border-border/30">
          <Link href="/hub">
            <div className="flex items-center gap-2 cursor-pointer">
              <Layers className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Contextual</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Applet</div>
              </div>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-3" aria-label="Contextual sections">
            {SECTIONS.map((section) => (
              <div key={section.group} role="group" aria-label={section.group}>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">
                  {section.group}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setLocation(item.id === "memory" ? "/contextual" : `/contextual/${item.id}`)
                        }
                        aria-current={isActive ? "page" : undefined}
                        className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isActive ? "text-primary" : ""}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-[10px] text-muted-foreground/60 truncate">{item.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile horizontal tab strip */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden border-b border-border/30 bg-card/30 px-2 py-2 overflow-x-auto">
          <div className="flex gap-1" role="tablist" aria-label="Contextual tabs">
            {ALL_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() =>
                    setLocation(item.id === "memory" ? "/contextual" : `/contextual/${item.id}`)
                  }
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-accent border border-transparent"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Panel tab={activeTab} />
        </div>
      </div>
    </div>
  );
}
