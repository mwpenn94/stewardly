# Stewardly v3 — Architecture Reconcile

> Status as of session ending **2026-05-06**. This document reconciles the
> 5-layer Stewardly architecture target against what currently ships in
> `stewardly-v3`. It is intentionally written in complete prose so it can
> double as an onboarding read for a new contributor.

## 1. Operating model

Stewardly is a five-layer stewardship platform. Each layer strictly subsumes
the layers below it within its scope, and every surface in the product is
the **same canonical surface** with progressively more controls revealed
based on the caller's role. We do not maintain a separate "user portal" and
"admin portal" — the same `App.tsx` route table renders to all callers, and
the `useRoles()` hook exposes five `canSee*` flags that drive sidebar
disclosure and per-page restriction states.

| Layer | Caller                  | Primary surfaces                                                                  |
|------:|-------------------------|------------------------------------------------------------------------------------|
| L5    | End user                | `/individual` hub → `/connections`, `/portfolio`, `/economic-data`                |
| L4    | Professional / advisor  | L5 plus `/households` roster and `/households/:userId` drill-down                  |
| L3    | Manager                 | L4 plus `/team` roster and `/team/settings` AI overlay                             |
| L2    | Organization admin      | L3 plus `/org/settings` (white-label baseline) and tenant member roster            |
| L1    | Platform admin          | L2 plus `/platform`, `/admin`, `/admin/tenants/:orgId` with full white-label form |

The matrix is enforced at three layers: `useRoles()` on the client gates
sidebar/page rendering, `*Procedure` factories in `server/_core/rbac.ts`
gate every tRPC call, and per-procedure `FORBIDDEN` checks gate any
multi-tenant data access (e.g., `households.getOne` rejects callers with
no scope on the requested user).

## 2. Engine registry

The four wealth engines (UWE, BIE, HE, SCUI) ship 18 tools through
`server/engines/missional/wealth/agentTools.ts`. Each tool has a JSON-schema
input, a per-layer access map, and an executor that delegates to its
sibling engine module. The tools are surfaced through two procedures:
`engines.toolsList` (per-layer filtering, used by both the admin console
inventory tile and `HouseholdDetailPage` to decide which run buttons to
render) and `engines.toolsInvoke` (dispatches a single tool against the
authenticated household). Coverage lives in
`server/wealth-engine-registry.test.ts`.

## 3. Glass design system

Glass is implemented as named utility classes in `client/src/index.css`:
`.glass`, `.glass-card`, `.glass-sidebar`, `.glass-overlay`, `.glass-modal`,
`.glass-input`, plus `.marble-bg` for the underlying texture. The
`StewardshipPageShell` header uses `.glass-sidebar`, every Stewardship
page card uses `.glass-card`, and the shadcn `Dialog` primitive overlay
and content slots now apply `.glass-overlay` and `.glass-modal`
respectively, so any feature dialog inherits the visual contract for
free. The locked snapshot test in `server/stewardship-surfaces.test.ts`
asserts every utility is defined with a `backdrop-filter` declaration so
a future refactor cannot silently strip the visual.

## 4. Where v3 currently has gaps

The reconciliation is honest, not aspirational. The remaining gaps as of
this session are tracked at the bottom of `todo.md`:

* **L1 API access page** — partner-scoped API keys are not yet shipped.
  The schema does not yet have an `apiKeys` table; this is a design
  decision pending (rotation policy, scope vocabulary).
* **L1 tier-aware billing** — the Stripe plumbing lands once an operator
  claims the sandbox referenced in the operator-only checklist.
* **L2 self-service member roster** — currently surfaces through the L1
  `TenantManagePage`. Cloning the roster into `OrgSettingsPage` so an
  org_admin can self-serve without the platform admin is a small lift.
* **WCAG AA contrast audit on glass surfaces** — automated snapshot is
  in place, but a manual contrast audit against AA still owes.
* **Vitest route guard for L4** — explicit "rejects role=user, accepts
  role=advisor" coverage on `/households/:userId` is not yet written
  (the page-level `canSeeProfessional` gate is exercised indirectly).

## 5. What changed in this session

The session that produced this doc landed three coordinated additions:

1. **L4 drill-down** at `/households/:userId` (`HouseholdDetailPage`).
   It calls a new `households.getOne` procedure that joins `users`,
   `userOrganizationRoles`, `plaidItems`, `snapTradeAccounts`, and
   `snapTradePositions`, computes a total AUM, and returns it under a
   `FORBIDDEN`-on-no-scope guard. The page then renders engine-run
   buttons whose visibility is computed against `engines.toolsList` so
   the tools the caller's layer cannot invoke are simply not shown.
2. **L2 multi-household roll-up** as a new tile on `TenantManagePage`,
   backed by `admin.orgRollup` (counts of households and professionals,
   total AUM across plaid/snaptrade, and the advisor-to-household
   ratio).
3. **L1 white-label config** — three new columns on `organizations`
   (`logoUrl`, `customDomain`, `themeColor`) plus
   `admin.tenantBranding` / `admin.updateTenantBranding` procedures and
   a form on `TenantManagePage` with hostname + URL validation. The
   shadcn `Dialog` primitive was migrated to the glass tokens in the
   same pass so all consumer dialogs inherit the visual.

Every new surface and procedure is covered by a vitest spec in
`server/admin-console.test.ts` (29 cases) and
`server/stewardship-surfaces.test.ts` (40 cases).
