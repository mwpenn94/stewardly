/**
 * Stripe product / price definitions for Stewardly tier-aware billing.
 *
 * Catalog mirrors the 5-layer surface model:
 *   tier_individual  — L5 personal stewardship (Connections, Portfolio, EconomicData)
 *   tier_professional — L4 advisor practice with /households roster + engine runs
 *   tier_manager     — L3 manager team + /team/settings AI overlay
 *   tier_organization — L2 org admin + /org/settings + tenant member roster
 *
 * L1 platform admin is operator-internal and not sold as a tier.
 *
 * `tier` is the canonical, layer-name identifier used everywhere in the
 * client (BillingPage, gating logic) and by the Stripe webhook to decide
 * which entitlements to grant. Add a NEW row — do not reuse old IDs —
 * when introducing a new tier so historical Stripe sessions still resolve.
 */

export type StewardlyTier =
  | "individual"
  | "professional"
  | "manager"
  | "organization";

export interface ProductConfig {
  id: string;
  /** Tier this product grants. Drives entitlement on webhook. */
  tier: StewardlyTier;
  name: string;
  description: string;
  priceAmount: number; // in cents
  currency: string;
  mode: "payment" | "subscription";
  interval?: "month" | "year";
  /** Highlighted features rendered on /billing tier card. */
  features: string[];
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: "tier_individual_monthly",
    tier: "individual",
    name: "Stewardly Individual (Monthly)",
    description: "Personal stewardship surface: Connections, Portfolio, Economic Data.",
    priceAmount: 1900, // $19 / mo
    currency: "usd",
    mode: "subscription",
    interval: "month",
    features: [
      "Plaid + SnapTrade connections",
      "Portfolio aggregation",
      "Economic data dashboards",
    ],
  },
  {
    id: "tier_professional_monthly",
    tier: "professional",
    name: "Stewardly Professional (Monthly)",
    description: "Advisor workspace with household roster + UWE/BIE/HE/SCUI engine runs.",
    priceAmount: 9900, // $99 / mo
    currency: "usd",
    mode: "subscription",
    interval: "month",
    features: [
      "Everything in Individual",
      "Households roster + per-household drill-down",
      "UWE / BIE / HE / SCUI engine runs",
      "Per-professional AI overlay",
    ],
  },
  {
    id: "tier_manager_monthly",
    tier: "manager",
    name: "Stewardly Manager (Monthly)",
    description: "Manager workspace overseeing a team of professionals.",
    priceAmount: 19900, // $199 / mo
    currency: "usd",
    mode: "subscription",
    interval: "month",
    features: [
      "Everything in Professional",
      "/team roster + /team/settings AI overlay",
      "Roll-up across managed households",
    ],
  },
  {
    id: "tier_organization_monthly",
    tier: "organization",
    name: "Stewardly Organization (Monthly)",
    description: "Org-wide license: white-label baseline, multi-team, member roster.",
    priceAmount: 49900, // $499 / mo
    currency: "usd",
    mode: "subscription",
    interval: "month",
    features: [
      "Everything in Manager",
      "/org/settings AI overlay",
      "Tenant member roster",
      "Org-level white-label baseline",
    ],
  },
];

export function getProductById(id: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Tier strictly subsumes lower tiers. Used for entitlement checks. */
export const TIER_RANK: Record<StewardlyTier, number> = {
  individual: 1,
  professional: 2,
  manager: 3,
  organization: 4,
};

export function tierAtLeast(have: StewardlyTier | null, need: StewardlyTier): boolean {
  if (!have) return false;
  return TIER_RANK[have] >= TIER_RANK[need];
}

