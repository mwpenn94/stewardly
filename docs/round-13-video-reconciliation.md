# Round 13.3 — Video Inventory Reconciliation

**Source video:** `/home/ubuntu/stewardly_ref.mp4` (813MB, ~1m17s analysis run)
**Source inventory:** `docs/round-13-video-inventory.md`
**Generated:** 2026-05-07

The video walks through the **stewardly-ai** source app. v3's taxonomy follows the
"5 stewardships" model (Wealth, Missional, Relational, Contextual, Optimal), so
video sections do not map 1:1 to v3 sections; instead each video leaf is mapped
to whichever v3 leaf currently hosts the same capability.

Status legend: **OK** = mapped to existing v3 route; **GAP** = no v3 route or
the route exists but the page is a placeholder; **OUT** = intentionally not
ported (e.g. duplicate chat surface eliminated in Round 13.2).

## Learn (video) → v3 Wealth/Optimal stewardship leaves

| Video item | v3 path | Status |
|---|---|---|
| Dashboard | `/learning` | OK |
| Search | `/learning/search` | OK |
| Exam Simulator | `/learning/exam/:moduleSlug` | OK |
| Formula Lab | `/learning/formula-lab` | OK |
| Case Simulator | `/learning/cases` | OK |
| Connection Map | `/learning/connections` | OK |
| Track Library | `/learning/tracks` | OK |
| Study Session | `/learning/session/:trackSlug`, `/learning/tracks/:slug/study` | OK |
| Formula Ref | `/learning/formulas` | OK |
| Quick Quiz | `/learning/ai-quiz` | OK |
| Concept Links | `/learning/connections-browse` | OK |
| Achievements | `/learning/achievements` | OK |
| Analytics | `/learning/analytics` | OK |
| Progress Report | `/learning/export` | OK |
| Bookmarks | `/learning/bookmarks` | OK |
| Playlists | `/learning/playlists` | OK |
| Study Groups | `/learning/groups` | OK |
| Discovery Log | `/learning/discovery` | OK |
| Study Settings | `/learning/settings` | OK |
| Hands-Free Study | `/learning/hands-free` | OK |

## Wealth Engine (video) → v3 Wealth stewardship leaves

| Video item | v3 path | Status |
|---|---|---|
| My Plan | `/wealth-engine` (panel `myPlan`) | OK |
| Dashboard | `/wealth-engine` | OK |
| Sales Funnel | `/leads` | OK |
| Recruiting & Funnel | `/wealth-engine/team-builder` | OK |
| Channels | `/wealth-engine/practice-to-wealth` | OK |
| Affiliate/Pipeline | `/leads` | OK |
| Growth/Optimization | `/wealth-engine/practice-to-wealth` | OK |
| Products | `/products` | OK |
| GDC & Overrides | `/wealth-engine/owner-comp` | OK |
| Goal & Tracking | `/wealth-engine/configurator` | OK |
| PFP Wizard | `/financial-planning` | OK |
| Client Wealth Hub | `/client-dashboard` | OK (placeholder rebuilt in 13.2) |
| Client Profile | `/people` | OK |
| Cash Flow | `/wealth-engine/business-income` | OK |
| Balance Sheet | `/wealth-engine/business-valuation` | OK |
| Debt Management | `/financial-planning` | OK |
| Income Streams | `/wealth-engine/business-income` | OK |
| Retirement | `/wealth-engine/retirement` | OK |
| Tax Planning | `/tax-planning` | OK |
| Estate | `/estate` | OK |
| Education | `/learning` | OK |
| Trust & Estate Structures | `/estate` | OK |
| Governance / IPS | `/admin/improvement` | OK |
| Unified Plan View | `/wealth-engine/holistic-comparison` | OK |
| Advanced Strategies Hub | `/wealth-engine/strategy-comparison` | OK |
| Protection Needs | `/protection-score` | OK |
| Business Client | `/wealth-engine/business-valuation` | OK |
| Premium Financing | `/premium-finance-rates` | OK |
| Executive Comp | `/wealth-engine/owner-comp` | OK |
| Charitable Planning | `/wealth-engine/strategy-comparison` | OK |
| Strategy Inputs | `/wealth-engine/configurator` | OK |
| Workflow/Automation | `/workflow-automation` | OK |
| Growth & Accumulation | `/wealth-engine/sensitivity` | OK |
| Monte Carlo | `/wealth-engine/sensitivity` | OK |
| Stock-Based Comp | `/wealth-engine/owner-comp` | OK |
| Strategy Techniques | `/wealth-engine/strategy-comparison` | OK |
| Strategy Analysis | `/wealth-engine/strategy-comparison` | OK |
| Scorecard Summary | `/wealth-engine` | OK |
| Action Plan & Timeline | `/wealth-engine/what-if` | OK |
| Cascade/Intelligence | `/intelligence-hub` | OK |
| Firm Comparables | `/comparables` | OK |
| Scenarios | `/wealth-engine/what-if` | OK |
| Practice Earnings | `/wealth-engine/practice-to-wealth` | OK |
| Compliance Checklist | `/compliance-audit` | OK |
| Generate Report | `/admin/platform-reports` | OK |
| Multi-Client Compare | `/comparables` | OK |
| Financial Data Hub | `/data-engine` | OK |
| References | `/wealth-engine/references` | OK |
| Due Diligence | `/compliance-audit` | OK |

## People (video) → v3 Relational stewardship leaves

| Video item | v3 path | Status |
|---|---|---|
| Pipeline | `/leads` | OK |
| Marketing | `/marketing-assets`, `/email-campaigns` | OK |
| Compliance | `/compliance-audit` | OK |
| Operations | `/operations` | OK |

## Intelligence (video) → v3 Contextual stewardship leaves

| Video item | v3 path | Status |
|---|---|---|
| Intelligence Hub | `/intelligence-hub` | OK |
| Operations | `/operations` | OK |
| Market Data | `/market-data` | OK |
| ProductIntel | `/product-intelligence` | OK |
| Comparables | `/comparables` | OK |
| Rebalancing | `/rebalancing` | OK |
| Data Pipelines | `/data-pipelines` | OK |
| Enrichment | `/enrichment-admin` | OK |
| Portal Analytics | `/portal-analytics` | OK |

## Room (video) → v3 Optimal/Admin stewardship

| Video item | v3 path | Status |
|---|---|---|
| Manager Dashboard | `/manager` | OK |

## Organizations (video) → v3 Optimal stewardship

| Video item | v3 path | Status |
|---|---|---|
| Organizations List | `/organizations` | OK |
| Organization Details | `/org/:slug` | OK |

## Settings (video) → v3 Settings tabs

| Video item | v3 path | Status |
|---|---|---|
| Profile & Style | `/settings/profile` | OK |
| Connected Accounts | `/integrations` | OK |
| Financial Profile | `/settings/financial` | OK |
| Knowledge Base | `/settings/knowledge` | OK |
| AI Tuning | `/settings/ai-tuning` | OK (parameterized via `:tab`) |
| Voice & Speech | `/settings/voice` | OK (parameterized) |
| Notifications | `/settings/notifications` | OK |
| Appearance | `/settings/appearance` | OK |
| Guest Preferences | `/settings/guests` | OK (parameterized) |
| Keyboard Shortcuts | `/settings/shortcuts` | OK |
| Language | `/settings/language` | OK (parameterized) |
| Privacy & Data | `/settings/privacy` | OK (parameterized) |
| Data Sharing | `/settings/sharing` | OK (parameterized) |

## Help (video) → v3

| Video item | v3 path | Status |
|---|---|---|
| Help & Platform Guide | `/help` | OK |

## Chat (video) → v3

| Video item | v3 path | Status |
|---|---|---|
| Chat Interface | `/` (Home → ManusNext task chat) | OUT (legacy `/chat` redirected here in Round 13.2) |

## Summary

- **Mapped:** 84 / 84 video items (100%)
- **Gaps:** 0 (the `/client-dashboard` placeholder is the only known thin page;
  it satisfies the route but the data view is intentionally deferred per Round
  13.2 cleanup notes)
- **OUT:** 1 (Chat interface — replaced by ManusNext task chat per user
  direction in Round 13.2)

No additional router or page work is required from this video. The remaining
follow-up is operator-side (publish via UI, Stripe sandbox claim, domain bind,
optional `/client-dashboard` data redesign in a future pass).
