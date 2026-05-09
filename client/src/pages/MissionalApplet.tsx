/**
 * /missional — Missional applet (Wealth Engine + financial planning suite).
 *
 * Round 14.7 — exposes the COMPLETE list of wealth, planning, tax,
 * estate, insurance, and protection sub-routes under a scoped sidebar so
 * users can reach every Missional capability from a single applet entry.
 *
 * Each sub-route mounts the source page with `embedded` so the AppShell
 * passthrough doesn't add chrome. URL stays under /missional/* so the
 * scoped sidebar persists across navigation.
 */
import { lazy, Suspense, useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Compass, Calculator, TrendingUp, Briefcase, Shield, FileText,
  Heart, DollarSign, Target, Home, BarChart3, Users, Activity,
  Building2, ScrollText, FileBarChart, AlertTriangle, ListChecks,
  Banknote, PiggyBank,
} from "lucide-react";

const CalculatorsPage = lazy(() => import("./Calculators"));
const FinancialPlanning = lazy(() => import("./FinancialPlanning"));
const FinancialTwin = lazy(() => import("./MyFinancialTwin"));
const TaxPlanning = lazy(() => import("./TaxPlanning"));
const TaxProjector = lazy(() => import("./TaxProjector"));
const EstatePlanning = lazy(() => import("./EstatePlanning"));
const InsuranceAnalysis = lazy(() => import("./InsuranceAnalysis"));
const InsuranceApplications = lazy(() => import("./PartGPages").then(m => ({ default: m.InsuranceApplications })));
const PremiumFinanceRates = lazy(() => import("./PremiumFinanceRates"));
const SocialSecurity = lazy(() => import("./SocialSecurity"));
const Medicare = lazy(() => import("./MedicareAnalysis"));
const RiskAssessment = lazy(() => import("./RiskAssessment"));
const IncomeProjection = lazy(() => import("./IncomeProjection"));
const PortfolioRisk = lazy(() => import("./wealth-engine/PortfolioRiskMetrics"));
const ProtectionScore = lazy(() => import("./FinancialProtectionScore"));
const SuitabilityPanel = lazy(() => import("./SuitabilityPanel"));
const BusinessExit = lazy(() => import("./BusinessExit"));
const Comparables = lazy(() => import("./Comparables"));
const Rebalancing = lazy(() => import("./Rebalancing"));

type TabId =
  | "wealth" | "planning" | "twin" | "income-projection"
  | "tax-planning" | "tax-projector" | "estate"
  | "insurance" | "insurance-apps" | "premium-finance"
  | "social-security" | "medicare"
  | "risk-assessment" | "portfolio-risk" | "protection-score" | "suitability"
  | "business-exit" | "comparables" | "rebalancing";

const SECTIONS: { group: string; items: { id: TabId; label: string; icon: React.ElementType; description?: string }[] }[] = [
  { group: "Wealth Engine", items: [
    { id: "wealth", label: "Wealth Engine", icon: Calculator, description: "Calculators & strategy" },
    { id: "planning", label: "Financial Planning", icon: Compass, description: "Holistic plans" },
    { id: "twin", label: "Financial Twin", icon: Activity, description: "Personal AI advisor" },
    { id: "income-projection", label: "Income Projection", icon: TrendingUp, description: "Forecast cashflow" },
  ]},
  { group: "Tax & Estate", items: [
    { id: "tax-planning", label: "Tax Planning", icon: FileText, description: "Strategy & optimization" },
    { id: "tax-projector", label: "Tax Projector", icon: FileBarChart, description: "Year-end projection" },
    { id: "estate", label: "Estate Planning", icon: ScrollText, description: "Wills, trusts, legacy" },
  ]},
  { group: "Protection", items: [
    { id: "insurance", label: "Insurance Analysis", icon: Shield, description: "Coverage gap review" },
    { id: "insurance-apps", label: "Insurance Apps", icon: ListChecks, description: "Application tracker" },
    { id: "premium-finance", label: "Premium Finance", icon: Banknote, description: "Rate comparison" },
    { id: "protection-score", label: "Protection Score", icon: Heart, description: "Wellness index" },
  ]},
  { group: "Retirement & Risk", items: [
    { id: "social-security", label: "Social Security", icon: PiggyBank, description: "Optimization" },
    { id: "medicare", label: "Medicare", icon: Heart, description: "Coverage analysis" },
    { id: "risk-assessment", label: "Risk Assessment", icon: AlertTriangle, description: "Risk profile" },
    { id: "portfolio-risk", label: "Portfolio Risk", icon: BarChart3, description: "Allocation analysis" },
    { id: "suitability", label: "Suitability", icon: Target, description: "Suitability panel" },
  ]},
  { group: "Business", items: [
    { id: "business-exit", label: "Business Exit", icon: Briefcase, description: "Exit strategy" },
    { id: "comparables", label: "Comparables", icon: Building2, description: "Peer benchmarks" },
    { id: "rebalancing", label: "Rebalancing", icon: DollarSign, description: "Portfolio rebalance" },
  ]},
];

const ALL_ITEMS = SECTIONS.flatMap(s => s.items);

function Panel({ tab }: { tab: TabId }) {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      {tab === "wealth" && <CalculatorsPage embedded />}
      {tab === "planning" && <FinancialPlanning embedded />}
      {tab === "twin" && <FinancialTwin embedded />}
      {tab === "income-projection" && <IncomeProjection embedded />}
      {tab === "tax-planning" && <TaxPlanning embedded />}
      {tab === "tax-projector" && <TaxProjector embedded />}
      {tab === "estate" && <EstatePlanning embedded />}
      {tab === "insurance" && <InsuranceAnalysis embedded />}
      {tab === "insurance-apps" && <InsuranceApplications embedded />}
      {tab === "premium-finance" && <PremiumFinanceRates embedded />}
      {tab === "social-security" && <SocialSecurity embedded />}
      {tab === "medicare" && <Medicare embedded />}
      {tab === "risk-assessment" && <RiskAssessment embedded />}
      {tab === "portfolio-risk" && <PortfolioRisk embedded />}
      {tab === "protection-score" && <ProtectionScore embedded />}
      {tab === "suitability" && <SuitabilityPanel embedded />}
      {tab === "business-exit" && <BusinessExit embedded />}
      {tab === "comparables" && <Comparables embedded />}
      {tab === "rebalancing" && <Rebalancing embedded />}
    </Suspense>
  );
}

export default function MissionalApplet() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/missional/:tab");
  const activeTab: TabId = useMemo(() => {
    const t = params?.tab as TabId | undefined;
    return ALL_ITEMS.find(i => i.id === t)?.id ?? "wealth";
  }, [params?.tab]);

  return (
    <div className="flex h-full min-h-0">
      {/* Scoped applet sidebar */}
      <aside
        role="complementary"
        aria-label="Missional applet navigation"
        className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/30 bg-card/30"
      >
        <div className="px-3 py-4 border-b border-border/30">
          <Link href="/hub">
            <div className="flex items-center gap-2 cursor-pointer">
              <Compass className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Missional</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Applet</div>
              </div>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-3" aria-label="Missional sections">
            {SECTIONS.map(section => (
              <div key={section.group} role="group" aria-label={section.group}>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">{section.group}</p>
                <div className="space-y-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLocation(item.id === "wealth" ? "/missional" : `/missional/${item.id}`)}
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
                          {item.description && <div className="text-[10px] text-muted-foreground/60 truncate">{item.description}</div>}
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

      {/* Mobile horizontal tabs */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden border-b border-border/30 bg-card/30 px-2 py-2 overflow-x-auto">
          <div className="flex gap-1" role="tablist">
            {ALL_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setLocation(item.id === "wealth" ? "/missional" : `/missional/${item.id}`)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
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
