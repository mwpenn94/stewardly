/**
 * shared/engineTaxonomy.ts — Canonical 5-engine taxonomy.
 *
 * SINGLE SOURCE OF TRUTH for the engine sidebar, AppsGridMenu drawer,
 * EngineHubPage cards, route resolution, and any nav badging.
 *
 * Round 13 (2026-05): inherits the source app's full sidebar nav
 * (stewardlyoriginal.manus.space / mwpenn94/stewardly-ai
 * client/src/lib/navigation.ts TOOLS_NAV + ADMIN_NAV) bucketed under
 * the 5 engines per the binding mapping rule:
 *
 *   LEARNING                → Formational
 *   RELATIONSHIPS           → Relational
 *   INTELLIGENCE / WEALTH   → Missional
 *   data/intelligence-hub   → Contextual
 *   WORK + ADMIN_NAV        → Optimal (continuous improvement / efficiency)
 *
 * Every source label/href/minRole is preserved 1:1. No invented leaves.
 *
 *   1. Formational       (Learn)               → /formational
 *   2. Relational        (People+Org+Team)     → /relational
 *   3. Missional         (Wealth Engine)       → /missional
 *   4. Contextual        (Data/Intelligence)   → /contextual
 *   5. Optimal           (Continuous Improve)  → /continuous-improvement
 *
 * Customer-facing language uses the engine names directly. Mission
 * specializations (wealth, pastoral, teaching, healthcare, coaching)
 * live INSIDE Missional, not as peer engines.
 *
 * Roles are progressive: every higher tier sees strictly more.
 *   guest   → public marketing surfaces only
 *   user    → Formational + Missional (own mission)
 *   advisor → + Relational + Contextual
 *   manager → + multi-household roll-ups inside Relational/Missional
 *   admin   → + Optimal (admin/CI tooling)
 *
 * `disclosureLevel` is the user-controlled progressive disclosure tier
 * (1=core; 4=everything). Items default to 1.
 */

import type { ComponentType } from "react";
import {
  GraduationCap,
  Users,
  Compass,
  Database,
  Sparkles,
  Calculator,
  Target,
  Layers,
  Building2,
  UserCog,
  Heart,
  BookOpen,
  TrendingUp,
  BarChart3,
  Cog,
  KeyRound,
  ShieldCheck,
  Globe2,
  Wrench,
  Activity,
  ClipboardList,
  FileText,
  Network,
  Zap,
  GitBranch,
  Briefcase,
  Brain,
  Mail,
  Calendar,
  Receipt,
  PieChart,
  LineChart,
  Headphones,
  Mic,
  Clock,
  Search,
  CheckSquare,
  Trophy,
  Map as MapIcon,
  Lock,
  Eye,
  Server,
  GitMerge,
  Repeat,
  AlertTriangle,
  Boxes,
  TestTube,
  Workflow,
  Bot,
  ScrollText,
  ListChecks,
  HelpCircle,
  History,
  Megaphone,
  HandCoins,
  Scale,
  Star,
  Flag,
  ShieldAlert,
  Gauge,
  Microscope,
  FileSearch,
  Filter,
  MessageSquare,
  Fingerprint,
  Package,
  HeartPulse,
  Stethoscope,
  Lightbulb,
  Plug,
  Bell,
  Globe,
  Truck,
  FileCheck,
  Play,
  UserPlus,
  Upload,
  Award,
  Users2,
  Cpu,
  Shield,
  RefreshCw,
  Terminal,
  ArrowLeftRight,
  Webhook,
  CreditCard,
  Download,
  Bookmark,
  ListMusic,
  Link as LinkIcon,
  Link2,
  Grid3X3,
  Rocket,
  ArrowRight,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
} from "lucide-react";

export type Role = "guest" | "user" | "advisor" | "manager" | "admin";

export const ROLE_LEVEL: Record<Role, number> = {
  guest: 0,
  user: 1,
  advisor: 2,
  manager: 3,
  admin: 4,
};

export interface EngineLeaf {
  /** Visible label. Customer-facing. */
  label: string;
  /** Wouter route. */
  path: string;
  /** Aliases that should also light this leaf as active. */
  match?: string[];
  /** Lucide icon. */
  icon: ComponentType<{ className?: string }>;
  /** Min role to see this leaf. Inherits engine.minRole if absent. */
  minRole?: Role;
  /** Progressive disclosure level (1=core ... 4=everything). Default 1. */
  disclosureLevel?: 1 | 2 | 3 | 4;
}

export interface EngineMission {
  label: string;
  slug: string;
  icon: ComponentType<{ className?: string }>;
  minRole?: Role;
  leaves: EngineLeaf[];
}

export interface EngineDef {
  id:
    | "formational"
    | "relational"
    | "missional"
    | "contextual"
    | "continuous-improvement";
  label: string;
  tagline: string;
  icon: ComponentType<{ className?: string }>;
  minRole: Role;
  color: string;
  path: string;
  leaves?: EngineLeaf[];
  missions?: EngineMission[];
}

/** Order is the visible order in the Apps drawer. */
export const ENGINES: EngineDef[] = [
  // ── 1. Formational — inherits source LEARNING + My Progress ──────
  {
    id: "formational",
    label: "Formational",
    tagline: "Practitioner formation, knowledge, growth",
    icon: GraduationCap,
    minRole: "user",
    color: "text-emerald-400",
    path: "/formational",
    leaves: [
      // From source HOME section (formation-related entry points)
      { label: "My Progress", path: "/proficiency", match: ["/formational"], icon: Activity, disclosureLevel: 1 },
      // From source LEARNING section (in source order)
      { label: "Learning", path: "/learning", match: ["/learning/home"], icon: GraduationCap, disclosureLevel: 1 },
      { label: "Skill tracks", path: "/learning/tracks", match: ["/learning/tracks/:slug", "/learning/tracks/:slug/study", "/learning/tracks/:slug/quiz"], icon: ListChecks, disclosureLevel: 1 },
      { label: "Study Buddy", path: "/learning/study-buddy", icon: Brain, disclosureLevel: 1 },
      { label: "Licenses", path: "/learning/licenses", icon: Shield, disclosureLevel: 2 },
      { label: "Achievements", path: "/learning/achievements", icon: Award, disclosureLevel: 1 },
      { label: "Concept Map", path: "/learning/connections", icon: GitMerge, disclosureLevel: 2 },
      { label: "Due Review", path: "/learning/review", icon: RefreshCw, disclosureLevel: 1 },
      { label: "Search Content", path: "/learning/search", icon: Search, disclosureLevel: 2 },
      { label: "Content Studio", path: "/learning/studio", match: ["/learning/studio/:tab"], icon: Sparkles, minRole: "advisor", disclosureLevel: 3 },
      { label: "Sovereign Study", path: "/sovereign-study", icon: Compass, disclosureLevel: 2 },
      { label: "Hands-Free Study", path: "/learning/hands-free", icon: Headphones, disclosureLevel: 2 },
      { label: "AI Quiz", path: "/learning/ai-quiz", icon: Zap, disclosureLevel: 1 },
      { label: "Formula Lab", path: "/learning/formula-lab", icon: Calculator, disclosureLevel: 2 },
      { label: "Study Analytics", path: "/learning/analytics", icon: BarChart3, disclosureLevel: 2 },
      { label: "Export Progress", path: "/learning/export", icon: Download, disclosureLevel: 3 },
      { label: "Bookmarks", path: "/learning/bookmarks", icon: Bookmark, disclosureLevel: 2 },
      { label: "Playlists", path: "/learning/playlists", match: ["/learning/shared/:shareToken"], icon: ListMusic, disclosureLevel: 2 },
      { label: "Study Groups", path: "/learning/groups", match: ["/learning/study-groups"], icon: Users, disclosureLevel: 3 },
      { label: "Discovery Log", path: "/learning/discovery", icon: Compass, disclosureLevel: 3 },
      { label: "Peer Groups", path: "/learning/peer-groups", icon: Users2, disclosureLevel: 3 },
      { label: "Leaderboard", path: "/learning/leaderboard", icon: Trophy, disclosureLevel: 3 },
      // Additional learning leaves not in source nav but real pages
      { label: "Cases", path: "/learning/cases", match: ["/learning/case", "/learning/case/:caseId"], icon: FileText, disclosureLevel: 2 },
      { label: "Discipline deep-dive", path: "/learning/discipline/:slug", icon: Microscope, disclosureLevel: 3 },
      { label: "Exam simulator", path: "/learning/exam/:moduleSlug", icon: TestTube, disclosureLevel: 3 },
      { label: "Audio study", path: "/learning/audio/:slug", icon: Mic, disclosureLevel: 3 },
      { label: "Flashcard study", path: "/learning/tracks/:slug/study", icon: Repeat, disclosureLevel: 2 },
      { label: "Quiz runner", path: "/learning/tracks/:slug/quiz", icon: CheckSquare, disclosureLevel: 2 },
      { label: "Formulas", path: "/learning/formulas", icon: FileText, disclosureLevel: 2 },
      { label: "Connections browse", path: "/learning/connections-browse", icon: Search, disclosureLevel: 3 },
      { label: "FS toolkit", path: "/learning/fs-toolkit", icon: Wrench, disclosureLevel: 3 },
      { label: "Study session", path: "/learning/session/:trackSlug", icon: Clock, disclosureLevel: 3 },
      { label: "Learning settings", path: "/learning/settings", icon: Cog, disclosureLevel: 4 },
      { label: "Welcome", path: "/welcome", icon: Sparkles, disclosureLevel: 1 },
      { label: "Help", path: "/help", icon: HelpCircle, disclosureLevel: 4 },
      { label: "Changelog", path: "/changelog", icon: ClipboardList, disclosureLevel: 4 },
    ],
  },

  // ── 2. Relational — inherits source RELATIONSHIPS ───────────────
  {
    id: "relational",
    label: "Relational",
    tagline: "People, households, gathered community",
    icon: Heart,
    minRole: "user",
    color: "text-rose-400",
    path: "/relational",
    leaves: [
      // From source RELATIONSHIPS section (in source order)
      { label: "Relationships", path: "/relationships", match: ["/relational"], icon: Users, disclosureLevel: 1 },
      { label: "People", path: "/people", match: ["/people/:tab", "/relational/people"], icon: Users, disclosureLevel: 1 },
      { label: "Client Dashboard", path: "/client-dashboard", icon: LayoutDashboard, disclosureLevel: 1 },
      { label: "Lead Pipeline", path: "/leads", icon: Target, minRole: "advisor", disclosureLevel: 2 },
      { label: "CRM Sync", path: "/crm-sync", icon: RefreshCw, minRole: "advisor", disclosureLevel: 2 },
      { label: "Email Campaigns", path: "/email-campaigns", icon: Mail, minRole: "advisor", disclosureLevel: 2 },
      { label: "Data Pipelines", path: "/data-pipelines", icon: Database, minRole: "admin", disclosureLevel: 3 },
      { label: "Outreach Automation", path: "/outreach-automation", match: ["/relational/outreach"], icon: Zap, minRole: "advisor", disclosureLevel: 2 },
      { label: "Documents", path: "/settings/knowledge", icon: FileText, disclosureLevel: 2 },
      { label: "Dynamic Integrations", path: "/dynamic-integrations", icon: Plug, minRole: "advisor", disclosureLevel: 3 },
      { label: "Activity Timeline", path: "/activity-timeline", icon: Activity, disclosureLevel: 2 },
      { label: "Location Analytics", path: "/location-analytics", icon: Globe, minRole: "admin", disclosureLevel: 3 },
      { label: "Location Onboarding", path: "/location-onboarding", icon: Compass, minRole: "admin", disclosureLevel: 3 },
      { label: "Location Health", path: "/location-health", icon: Heart, minRole: "admin", disclosureLevel: 3 },
      { label: "Webhook vs Polling", path: "/webhook-vs-polling", icon: ArrowLeftRight, minRole: "admin", disclosureLevel: 4 },
      { label: "Alert Thresholds", path: "/alert-thresholds", icon: Bell, minRole: "admin", disclosureLevel: 4 },
      { label: "My Integrations", path: "/my-integrations", icon: LinkIcon, disclosureLevel: 2 },
      { label: "Community", path: "/community", icon: Users2, minRole: "advisor", disclosureLevel: 2 },
      // Additional relational pages already in v3 (organizations / portal)
      { label: "Portal", path: "/portal", icon: Globe2, minRole: "advisor", disclosureLevel: 2 },
      { label: "Portal analytics", path: "/portal-analytics", icon: BarChart3, minRole: "manager", disclosureLevel: 3 },
      { label: "Organizations", path: "/organizations", match: ["/relational/organizations", "/org/settings"], icon: Building2, minRole: "advisor", disclosureLevel: 2 },
      { label: "Org branding", path: "/org-branding", icon: Sparkles, minRole: "manager", disclosureLevel: 3 },
      { label: "Org landing", path: "/org/:slug", icon: Globe2, minRole: "advisor", disclosureLevel: 4 },
      { label: "Team", path: "/team", match: ["/team/settings", "/relational/team"], icon: UserCog, minRole: "manager", disclosureLevel: 2 },
    ],
  },

  // ── 3. Missional — inherits source INTELLIGENCE/WEALTH + WORK ───
  {
    id: "missional",
    label: "Missional",
    tagline: "Stewarded agency: wealth, pastoral, teaching, more",
    icon: Compass,
    minRole: "user",
    color: "text-blue-400",
    path: "/missional",
    leaves: [
      { label: "Mission overview", path: "/missional", icon: Compass, disclosureLevel: 1 },
    ],
    missions: [
      {
        label: "Wealth",
        slug: "wealth",
        icon: Calculator,
        minRole: "user",
        leaves: [
          // ── Source HOME section (mission-related)
          { label: "Financial Twin", path: "/financial-twin", match: ["/missional/wealth/financial-twin"], icon: Fingerprint, disclosureLevel: 1 },
          // ── Source INTELLIGENCE section (in source order)
          { label: "Intelligence", path: "/intelligence-hub", match: ["/intelligence-hub/:tab"], icon: Brain, disclosureLevel: 1 },
          { label: "Wealth Engine", path: "/wealth-engine", match: ["/wealth-engine/:panel", "/missional/wealth"], icon: Sparkles, disclosureLevel: 1 },
          { label: "Engine Dashboard", path: "/engine-dashboard", icon: Calculator, disclosureLevel: 1 },
          { label: "Calculators", path: "/calculators", match: ["/calculators/:panel", "/missional/wealth/calculators"], icon: Calculator, disclosureLevel: 1 },
          { label: "Retirement", path: "/wealth-engine/retirement", icon: Target, disclosureLevel: 1 },
          { label: "Strategy Compare", path: "/wealth-engine/strategy-comparison", icon: BarChart3, disclosureLevel: 2 },
          { label: "Quick Quote", path: "/wealth-engine/quick-quote", icon: Zap, disclosureLevel: 2 },
          { label: "Practice → Wealth", path: "/wealth-engine/practice-to-wealth", icon: Briefcase, minRole: "advisor", disclosureLevel: 2 },
          { label: "Business Income", path: "/wealth-engine/business-income", icon: HandCoins, minRole: "advisor", disclosureLevel: 2 },
          { label: "Team Builder", path: "/wealth-engine/team-builder", icon: Users, minRole: "advisor", disclosureLevel: 2 },
          { label: "What-If Grid", path: "/wealth-engine/what-if", icon: Grid3X3, disclosureLevel: 2 },
          { label: "Wealth Configurator", path: "/wealth-engine/configurator", icon: ShieldCheck, disclosureLevel: 2 },
          { label: "Reference Hub", path: "/wealth-engine/references", icon: BookOpen, disclosureLevel: 3 },
          { label: "Business Valuation", path: "/wealth-engine/business-valuation", icon: Rocket, minRole: "advisor", disclosureLevel: 2 },
          { label: "Holistic Comparison", path: "/wealth-engine/holistic-comparison", icon: BarChart3, minRole: "advisor", disclosureLevel: 3 },
          { label: "Quick Quote Hub", path: "/wealth-engine/quick-quote-hub", icon: Sparkles, minRole: "advisor", disclosureLevel: 2 },
          { label: "Income Quick Quote", path: "/wealth-engine/business-income-quick-quote", icon: HandCoins, minRole: "advisor", disclosureLevel: 3 },
          { label: "Owner Compensation", path: "/wealth-engine/owner-comp", icon: BarChart3, minRole: "advisor", disclosureLevel: 3 },
          { label: "Sensitivity Analysis", path: "/wealth-engine/sensitivity", icon: Grid3X3, disclosureLevel: 2 },
          { label: "Rebalancing", path: "/rebalancing", icon: Scale, minRole: "advisor", disclosureLevel: 2 },
          { label: "Market Data", path: "/market-data", icon: TrendingUp, disclosureLevel: 1 },
          { label: "Protection Score", path: "/protection-score", icon: Shield, disclosureLevel: 1 },
          { label: "Tax Planning", path: "/tax-planning", match: ["/missional/wealth/tax-planning"], icon: HandCoins, disclosureLevel: 1 },
          { label: "Tax Projector", path: "/tax-projector", icon: Calculator, minRole: "advisor", disclosureLevel: 2 },
          { label: "Estate Planning", path: "/estate", match: ["/missional/wealth/estate"], icon: Scale, disclosureLevel: 1 },
          { label: "Risk Assessment", path: "/risk-assessment", icon: BarChart3, disclosureLevel: 1 },
          { label: "Income Projection", path: "/income-projection", icon: TrendingUp, disclosureLevel: 1 },
          { label: "Insurance Analysis", path: "/insurance-analysis", match: ["/missional/wealth/insurance"], icon: Heart, disclosureLevel: 1 },
          { label: "Financial Planning", path: "/financial-planning", icon: LineChart, disclosureLevel: 1 },
          { label: "Social Security", path: "/social-security", icon: HeartPulse, disclosureLevel: 1 },
          { label: "Medicare", path: "/medicare", icon: Stethoscope, disclosureLevel: 1 },
          { label: "Products", path: "/products", match: ["/missional/wealth/products"], icon: Package, disclosureLevel: 1 },
          { label: "Product Intelligence", path: "/product-intelligence", icon: Lightbulb, minRole: "advisor", disclosureLevel: 2 },
          { label: "AI Usage", path: "/ai-usage", icon: Gauge, minRole: "advisor", disclosureLevel: 3 },
          { label: "Data Engine", path: "/data-engine", icon: Database, minRole: "advisor", disclosureLevel: 3 },
          { label: "Portfolio risk", path: "/portfolio-risk", match: ["/missional/wealth/portfolio"], icon: TrendingUp, disclosureLevel: 1 },
          { label: "Compliance Copilot", path: "/compliance-copilot", icon: Shield, minRole: "advisor", disclosureLevel: 2 },
          { label: "Business Exit", path: "/business-exit", icon: ArrowRight, minRole: "advisor", disclosureLevel: 3 },
          { label: "Annual Review", path: "/annual-review", icon: FileText, minRole: "advisor", disclosureLevel: 2 },
          { label: "Marketing Assets", path: "/marketing-assets", icon: ImageIcon, minRole: "advisor", disclosureLevel: 2 },
          { label: "Premium Finance Rates", path: "/premium-finance-rates", match: ["/people/premium-finance"], icon: HandCoins, minRole: "advisor", disclosureLevel: 3 },
          // ── Source WORK section (operational mission-execution)
          { label: "My Work", path: "/my-work", icon: Briefcase, minRole: "advisor", disclosureLevel: 2 },
          { label: "Operations", path: "/operations", icon: Workflow, disclosureLevel: 2 },
          { label: "Advisory", path: "/advisory", icon: Briefcase, disclosureLevel: 2 },
          { label: "Workflows", path: "/workflows", icon: GitBranch, disclosureLevel: 2 },
          { label: "Passive Actions", path: "/passive-actions", icon: RefreshCw, disclosureLevel: 3 },
          { label: "Insurance Apps", path: "/insurance-applications", icon: FileCheck, minRole: "advisor", disclosureLevel: 3 },
          { label: "Advisory Execution", path: "/advisory-execution", icon: Play, minRole: "advisor", disclosureLevel: 3 },
          { label: "Carrier Connector", path: "/carrier-connector", icon: Truck, minRole: "advisor", disclosureLevel: 3 },
          { label: "Suitability Panel", path: "/suitability-panel", icon: ClipboardList, minRole: "advisor", disclosureLevel: 3 },
          { label: "Client Onboarding", path: "/client-onboarding", icon: UserPlus, disclosureLevel: 2 },
          { label: "Import Data", path: "/import", icon: Upload, minRole: "advisor", disclosureLevel: 3 },
        ],
      },
    ],
  },

  // ── 4. Contextual — Memory, retrieval, market & economic context ─
  {
    id: "contextual",
    label: "Contextual",
    tagline: "Memory, retrieval, market & economic context",
    icon: Database,
    minRole: "user",
    color: "text-amber-400",
    path: "/contextual",
    leaves: [
      { label: "Intelligence hub", path: "/intelligence-hub", match: ["/intelligence-hub/:tab", "/intelligence", "/data-intelligence", "/analytics-hub", "/contextual/intelligence"], icon: Brain, disclosureLevel: 1 },
      { label: "Market data", path: "/market-data", match: ["/contextual/market-data"], icon: BarChart3, disclosureLevel: 1 },
      { label: "Data pipelines", path: "/data-pipelines", match: ["/contextual/pipelines"], icon: Network, disclosureLevel: 2 },
      { label: "Sovereign study", path: "/sovereign-study", icon: Microscope, disclosureLevel: 2 },
      { label: "Data Engine", path: "/data-engine", icon: Database, minRole: "advisor", disclosureLevel: 3 },
      { label: "Comparables", path: "/comparables", icon: Compass, minRole: "advisor", disclosureLevel: 3 },
    ],
  },

  // ── 5. Optimal — inherits source ADMIN_NAV + automation/CI tools ─
  {
    id: "continuous-improvement",
    label: "Optimal",
    tagline: "Feedback, audits, system optimization",
    icon: Activity,
    minRole: "advisor",
    color: "text-purple-400",
    path: "/continuous-improvement",
    leaves: [
      // From source ADMIN_NAV (in source order)
      { label: "Manager Dashboard", path: "/manager", icon: BarChart3, minRole: "manager", disclosureLevel: 1 },
      { label: "Global Admin", path: "/admin", match: ["/admin/:tab", "/admin-console", "/continuous-improvement/admin"], icon: Globe, minRole: "admin", disclosureLevel: 1 },
      { label: "AI Agents", path: "/agents", icon: Bot, minRole: "advisor", disclosureLevel: 2 },
      { label: "Code Chat", path: "/code-chat", icon: Terminal, minRole: "admin", disclosureLevel: 3 },
      { label: "Consensus", path: "/consensus", icon: GitMerge, minRole: "admin", disclosureLevel: 3 },
      { label: "Improvement Dashboard", path: "/admin/improvement", icon: TrendingUp, minRole: "admin", disclosureLevel: 1 },
      { label: "Improvement Engine", path: "/admin/improvement-engine", match: ["/improvement", "/continuous-improvement/improvement"], icon: Sparkles, minRole: "admin", disclosureLevel: 1 },
      { label: "Platform Guide", path: "/admin/guide", match: ["/platform", "/continuous-improvement/platform"], icon: BookOpen, minRole: "admin", disclosureLevel: 2 },
      { label: "System Health", path: "/admin/system-health", match: ["/continuous-improvement/system-health"], icon: Activity, minRole: "admin", disclosureLevel: 1 },
      { label: "Data Freshness", path: "/admin/data-freshness", icon: Clock, minRole: "admin", disclosureLevel: 2 },
      { label: "Lead Sources", path: "/admin/lead-sources", icon: Target, minRole: "admin", disclosureLevel: 3 },
      { label: "Rate Management", path: "/admin/rate-management", icon: TrendingUp, minRole: "admin", disclosureLevel: 3 },
      { label: "Platform Reports", path: "/admin/platform-reports", icon: FileText, minRole: "admin", disclosureLevel: 2 },
      { label: "API Keys", path: "/admin/api-keys", match: ["/continuous-improvement/api-keys"], icon: KeyRound, minRole: "admin", disclosureLevel: 1 },
      { label: "Webhooks", path: "/admin/webhooks", icon: Webhook, minRole: "admin", disclosureLevel: 2 },
      { label: "GHL Webhook Setup", path: "/admin/webhooks/ghl-setup", icon: Cog, minRole: "admin", disclosureLevel: 3 },
      { label: "Team", path: "/admin/team", icon: Users, minRole: "admin", disclosureLevel: 1 },
      { label: "Billing", path: "/admin/billing", icon: CreditCard, minRole: "admin", disclosureLevel: 1 },
      { label: "AI Intelligence", path: "/admin/intelligence", icon: Cpu, minRole: "admin", disclosureLevel: 2 },
      { label: "BCP Dashboard", path: "/admin/bcp", icon: Shield, minRole: "admin", disclosureLevel: 3 },
      { label: "Fairness Audit", path: "/admin/fairness", icon: Scale, minRole: "admin", disclosureLevel: 3 },
      { label: "Capabilities", path: "/manus-next", icon: Sparkles, minRole: "admin", disclosureLevel: 3 },
      { label: "Workflow Automation", path: "/workflow-automation", icon: Workflow, minRole: "admin", disclosureLevel: 2 },
      { label: "Enrichment Engine", path: "/enrichment-admin", icon: Layers, minRole: "admin", disclosureLevel: 3 },
      { label: "Admin Integrations", path: "/admin/integrations", icon: Link2, minRole: "admin", disclosureLevel: 1 },
      { label: "Knowledge Base", path: "/admin/knowledge", icon: BookOpen, minRole: "admin", disclosureLevel: 2 },
      { label: "Feature Permissions", path: "/admin/feature-permissions", icon: Shield, minRole: "admin", disclosureLevel: 2 },
      { label: "API Docs", path: "/api-docs", icon: BookOpen, minRole: "advisor", disclosureLevel: 2 },
      { label: "Audit Trail", path: "/admin/audit-trail", match: ["/continuous-improvement/audit"], icon: History, minRole: "admin", disclosureLevel: 1 },
      // Operational/CI items also surfaced in Optimal
      { label: "Command Center", path: "/command-center", icon: LayoutGrid, minRole: "advisor", disclosureLevel: 2 },
      { label: "Integrations", path: "/integrations", icon: Link2, disclosureLevel: 2 },
      { label: "Integration Health", path: "/integration-health", icon: HeartPulse, minRole: "advisor", disclosureLevel: 2 },
      { label: "Sync Dashboard", path: "/sync-dashboard", icon: ArrowLeftRight, minRole: "advisor", disclosureLevel: 2 },
      { label: "Permissions", path: "/permissions", icon: Shield, minRole: "admin", disclosureLevel: 2 },
      { label: "Compliance Audit", path: "/compliance-audit", icon: ShieldCheck, minRole: "advisor", disclosureLevel: 2 },
    ],
  },
];

/**
 * Helper: filter the taxonomy by user role + disclosure level.
 */
export function visibleEnginesFor(role: Role, disclosureLevel: 1 | 2 | 3 | 4 = 4): EngineDef[] {
  const userLevel = ROLE_LEVEL[role];
  return ENGINES.filter((e) => userLevel >= ROLE_LEVEL[e.minRole]).map((e) => ({
    ...e,
    leaves: (e.leaves ?? []).filter((leaf) => {
      const leafMin = leaf.minRole ?? e.minRole;
      return userLevel >= ROLE_LEVEL[leafMin] && (leaf.disclosureLevel ?? 1) <= disclosureLevel;
    }),
    missions: (e.missions ?? [])
      .filter((m) => userLevel >= ROLE_LEVEL[m.minRole ?? e.minRole])
      .map((m) => ({
        ...m,
        leaves: m.leaves.filter((leaf) => {
          const leafMin = leaf.minRole ?? m.minRole ?? e.minRole;
          return userLevel >= ROLE_LEVEL[leafMin] && (leaf.disclosureLevel ?? 1) <= disclosureLevel;
        }),
      })),
  }));
}

/**
 * Public preview: every engine and leaf up to disclosure level,
 * ignoring role gating. Used on engine landing pages for unauthenticated
 * visitors so they can see the full feature surface.
 */
export function previewEnginesFor(disclosureLevel: 1 | 2 | 3 | 4 = 4): EngineDef[] {
  return ENGINES.map((e) => ({
    ...e,
    leaves: (e.leaves ?? []).filter((leaf) => (leaf.disclosureLevel ?? 1) <= disclosureLevel),
    missions: (e.missions ?? []).map((m) => ({
      ...m,
      leaves: m.leaves.filter((leaf) => (leaf.disclosureLevel ?? 1) <= disclosureLevel),
    })),
  }));
}

/**
 * Legacy URL → canonical engine path. Used by additive redirects.
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/missional/wealth": "/wealth-engine",
  "/missional/wealth/calculators": "/calculators",
  "/missional/wealth/portfolio": "/portfolio-risk",
  "/missional/wealth/products": "/products",
  "/missional/wealth/tax-planning": "/tax-planning",
  "/missional/wealth/estate": "/estate",
  "/missional/wealth/insurance": "/insurance-analysis",
  "/missional/wealth/financial-twin": "/financial-twin",
  "/relational/people": "/people",
  "/relational/organizations": "/organizations",
  "/relational/outreach": "/outreach-automation",
  "/relational/team": "/team",
  "/contextual/intelligence": "/intelligence-hub",
  "/contextual/market-data": "/market-data",
  "/contextual/pipelines": "/data-pipelines",
  "/continuous-improvement/admin": "/admin",
  "/continuous-improvement/api-keys": "/admin/api-keys",
  "/continuous-improvement/system-health": "/admin/system-health",
  "/continuous-improvement/audit": "/admin/audit-trail",
  "/continuous-improvement/improvement": "/admin/improvement-engine",
  "/continuous-improvement/platform": "/admin/guide",
};
