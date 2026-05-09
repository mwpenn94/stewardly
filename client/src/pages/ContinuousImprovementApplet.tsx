/**
 * /continuous-improvement — Continuous Improvement applet.
 *
 * Round 14.6: scoped applet sidebar. Each nested page is rendered with
 * `embedded` so it skips its own AppShell wrapper. No AppShell or
 * PersonaSidebar5 leakage.
 */
import { lazy, Suspense, useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Cpu,
  Activity,
  ShieldCheck,
  Scale,
  ClipboardCheck,
  Repeat,
} from "lucide-react";

const ImprovementDashboard = lazy(() => import("./ImprovementDashboard"));
const ImprovementEngine = lazy(() => import("./ImprovementEngine"));
const AdminSystemHealth = lazy(() => import("./AdminSystemHealth"));
const AdminAuditTrail = lazy(() => import("./AdminAuditTrail"));
const FairnessTestDashboard = lazy(() => import("./FairnessTestDashboard"));
const ComplianceAudit = lazy(() => import("./ComplianceAudit"));

type AppletTab =
  | "overview"
  | "engine"
  | "system-health"
  | "audit-trail"
  | "fairness"
  | "compliance";

const TABS: { id: AppletTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp, description: "Quality & hypotheses" },
  { id: "engine", label: "Engine", icon: Cpu, description: "Improvement audits" },
  { id: "system-health", label: "System Health", icon: Activity, description: "Platform vitals" },
  { id: "audit-trail", label: "Audit Trail", icon: ShieldCheck, description: "Action history" },
  { id: "fairness", label: "Fairness", icon: Scale, description: "Bias testing" },
  { id: "compliance", label: "Compliance", icon: ClipboardCheck, description: "Regulatory audit" },
];

function ApplePanel({ tab }: { tab: AppletTab }) {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      {tab === "overview" && <ImprovementDashboard embedded />}
      {tab === "engine" && <ImprovementEngine embedded />}
      {tab === "system-health" && <AdminSystemHealth embedded />}
      {tab === "audit-trail" && <AdminAuditTrail embedded />}
      {tab === "fairness" && <FairnessTestDashboard embedded />}
      {tab === "compliance" && <ComplianceAudit embedded />}
    </Suspense>
  );
}

export default function ContinuousImprovementApplet() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/continuous-improvement/:tab");
  const activeTab: AppletTab = useMemo(() => {
    const t = params?.tab;
    if (
      t === "engine" ||
      t === "system-health" ||
      t === "audit-trail" ||
      t === "fairness" ||
      t === "compliance" ||
      t === "overview"
    ) {
      return t;
    }
    return "overview";
  }, [params?.tab]);

  const goTo = (id: AppletTab) =>
    setLocation(id === "overview" ? "/continuous-improvement" : `/continuous-improvement/${id}`);

  return (
    <div className="flex h-full min-h-0">
      <aside
        role="complementary"
        aria-label="Continuous Improvement applet navigation"
        className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/30 bg-card/30"
      >
        <div className="px-3 py-4 border-b border-border/30">
          <Link href="/hub">
            <div className="flex items-center gap-2 cursor-pointer">
              <Repeat className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Continuous Improvement</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Applet</div>
              </div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-1" aria-label="CI sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => goTo(t.id)}
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

      <div className="flex-1 flex flex-col min-w-0">
        {/* R14.25.e: tab strip uses overflow-x-auto + scroll-padding so the
         * fade-out edge hint and the active tab’s focus-into-view both work.
         * `flex-nowrap` + `min-w-max` on the inner row guarantees children
         * are not flex-shrunk into illegibility on narrow viewports. */}
        <div className="lg:hidden border-b border-border/30 bg-card/30 px-2 py-2">
          <div
            className="flex gap-1 overflow-x-auto -mx-2 px-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollPaddingInline: "0.5rem" }}
            role="tablist"
            aria-label="Continuous Improvement sections"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => goTo(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-md text-xs whitespace-nowrap transition-colors ${
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
