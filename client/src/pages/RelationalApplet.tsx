/**
 * /relational — Relational applet.
 *
 * Per user (Round 14.6): the relational applet must show ONLY its own
 * scoped navigation (People, Organizations, Manager) — no leakage from
 * the source AppShell/PersonaSidebar5. Each nested hub is rendered with
 * `embedded` so it skips its own AppShell wrapper.
 *
 * Layout:
 *   ┌──────────┬──────────────────────────┐
 *   │ Relation │ Active hub renders here  │
 *   │ -al nav  │  (full width, no clip)   │
 *   └──────────┴──────────────────────────┘
 */
import { lazy, Suspense, useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, ClipboardList, Network } from "lucide-react";

const PeopleHub = lazy(() => import("./PeopleHub"));
const Organizations = lazy(() => import("./Organizations"));
const ManagerDashboard = lazy(() => import("./ManagerDashboard"));

type AppletTab = "people" | "organizations" | "manager";

const TABS: { id: AppletTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "people", label: "People", icon: Users, description: "Pipeline, marketing, compliance" },
  { id: "organizations", label: "Organizations", icon: Building2, description: "Firms & relationships" },
  { id: "manager", label: "Manager", icon: ClipboardList, description: "Team performance" },
];

function ApplePanel({ tab }: { tab: AppletTab }) {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      {tab === "people" && <PeopleHub embedded />}
      {tab === "organizations" && <Organizations embedded />}
      {tab === "manager" && <ManagerDashboard embedded />}
    </Suspense>
  );
}

export default function RelationalApplet() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/relational/:tab");
  const activeTab: AppletTab = useMemo(() => {
    const t = params?.tab;
    if (t === "organizations" || t === "manager" || t === "people") return t;
    return "people";
  }, [params?.tab]);

  return (
    <div className="flex h-full min-h-0">
      {/* ─── Scoped applet sidebar ─── */}
      <aside
        role="complementary"
        aria-label="Relational applet navigation"
        className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/30 bg-card/30"
      >
        <div className="px-3 py-4 border-b border-border/30">
          <Link href="/hub">
            <div className="flex items-center gap-2 cursor-pointer">
              <Network className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Relational</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Applet</div>
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-1" aria-label="Relational sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setLocation(t.id === "people" ? "/relational" : `/relational/${t.id}`)
                }
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "text-primary" : ""}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground/70 truncate">{t.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ─── Mobile horizontal tabs ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden border-b border-border/30 bg-card/30 px-2 py-2">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Relational sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() =>
                    setLocation(t.id === "people" ? "/relational" : `/relational/${t.id}`)
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-accent border border-transparent"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <ApplePanel tab={activeTab} />
        </div>
      </div>
    </div>
  );
}
