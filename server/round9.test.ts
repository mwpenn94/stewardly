import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PROJECT_ROOT = join(__dirname, "..");
const PAGES_DIR = join(PROJECT_ROOT, "client", "src", "pages");
const APP_TSX = readFileSync(join(PROJECT_ROOT, "client", "src", "App.tsx"), "utf8");

const PORTED_SOURCE_PAGES = [
  // R13.2: legacy source-app Chat.tsx removed (ManusNext task chat replaces it).
  "OperationsHub.tsx",
  "SettingsHub.tsx",
  "Workflows.tsx",
  "learning/StudyBuddy.tsx",
  "AgentManager.tsx",
  "AgentPage.tsx",
  "AdvisoryHub.tsx",
  "RelationshipsHub.tsx",
  "PeopleHub.tsx",
  "IntelligenceHubV2.tsx",
  "Calculators.tsx",
  "wealth-engine/PortfolioRiskMetrics.tsx",
  "Products.tsx",
  "PartGPages.tsx",
  "learning/ConnectionMap.tsx",
  // R14.18: CodeChat.tsx removed (legacy page deleted; agent execution moved to TaskView).
  "Consensus.tsx",
  "Comparables.tsx",
  "Rebalancing.tsx",
];

const REQUIRED_ROUTES = [
  // R13.2: '/chat/:id?' replaced with '/chat/:id' → redirect to '/task/:id'.
  '/chat',
  // R14.18: '/code-chat' removed (now redirects to '/').
  '/consensus',
  '/comparables',
  '/rebalancing',
  '/workflows',
  '/operations',
  '/calculators/:panel',
  '/calculators',
  '/wealth-engine/:panel',
  '/portfolio-risk',
  '/products',
  '/intelligence-hub/:tab',
  '/admin/:tab',
  '/people/:tab',
  '/people/premium-finance',
  '/settings/:tab',
  '/learning/connections',
  '/learning/study-groups',
  '/learning/connections-browse',
  '/insurance-applications',
  '/advisory-execution',
  '/carrier-connector',
  '/my-plan',
  '/improvement',
  '/documents',
  '/suitability',
  '/ai-settings',
  '/study',
  '/education',
  '/meetings',
  '/coach',
  '/planning',
  '/insights',
  '/student-loans',
  '/equity-comp',
  '/digital-assets',
  '/agentic',
  '/agent-operations',
  '/licensed-review',
  '/compliance',
  '/data-intelligence',
  '/analytics-hub',
  '/model-results',
  '/intelligence',
  '/insurance-quotes',
  '/estate-planning',
  '/premium-finance',
  '/marketplace',
  '/coi-network',
  '/professionals',
];

describe("Round 9 — source-of-truth port closes the gap", () => {
  describe("ported source page files exist on disk", () => {
    PORTED_SOURCE_PAGES.forEach((rel) => {
      it(`ports ${rel} from mwpenn94/stewardly-ai`, () => {
        expect(existsSync(join(PAGES_DIR, rel))).toBe(true);
      });
    });
  });

  describe("App.tsx wires every required route", () => {
    REQUIRED_ROUTES.forEach((route) => {
      it(`registers ${route}`, () => {
        // Match either path={"..."} or path="..." form
        const re = new RegExp(`path=(?:\\{?["'])${route.replace(/[\/?:]/g, m => "\\" + m)}["']`);
        expect(APP_TSX).toMatch(re);
      });
    });
  });

  describe("ported pages are actually imported (no orphan files)", () => {
    const importableNames = [
      // R14.18: "CodeChat" removed from importable names list.
      // R13.2: "Chat" removed (lazy-imported alias replaced with redirect routes).
      "Consensus", "Comparables", "Rebalancing", "Workflows",
      "OperationsHub", "SettingsHub", "IntelligenceHubV2", "ConnectionMap",
      "AdvisoryExecution", "CarrierConnector", "InsuranceApplications",
    ];
    importableNames.forEach((name) => {
      it(`App.tsx lazy-imports ${name}`, () => {
        const re = new RegExp(`const\\s+${name}\\s*=\\s*lazy`);
        expect(APP_TSX).toMatch(re);
      });
    });
  });
});
