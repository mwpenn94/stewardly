# Stewardly

**Infrastructure for practitioner stewards.**

Stewardly is the platform layer for any practitioner-stewardship discipline — pastor, teacher, coach, physician, financial advisor, community organizer, ministry leader, and others. Wealth is one mission within Missional; it is not the platform's identity.

This repository (`mwpenn94/stewardly`) is built forward from [`mwpenn94/manus-next-app`](https://github.com/mwpenn94/manus-next-app). The Manus Next foundation — its conversational chat surface, agentic runtime, project workspaces, voice pipeline, scheduler, replay, and continuous-improvement primitives — carries forward unchanged as the canonical foundation. On top of that foundation we add five renamed engines, a wealth-mission specialization migrated from [`mwpenn94/stewardly-ai`](https://github.com/mwpenn94/stewardly-ai), and a glass UI polish layer.

The original Manus Next README is preserved at [`docs/foundation/README-manus-next-app.md`](docs/foundation/README-manus-next-app.md) for reference; every feature it documents continues to work in this repository unchanged.

## The five engines

The customer-facing language uses the engine names directly. There is no finance-specific terminology in the platform's customer-facing surface; the wealth specialization sits inside Missional alongside pastoral, teaching, healthcare, coaching, and other mission specializations.

| Engine | Role |
|--------|------|
| **Formational** | Knowledge cultivation, education, professional development, and growth in the practitioner's domain. (Was *Learning*.) |
| **Relational** | Relationships, communications, household and team structure, the people the practitioner serves alongside. (Was *People*.) |
| **Missional** | Stewarded agency producing effect outward. The practitioner's mission work, with wealth, ministry, healthcare, teaching, coaching, or other missions as specializations within. (Was *Wealth*, with wealth as one mission among many.) |
| **Contextual** | Memory, audit trail, search, document vault — the institutional context that runs underneath everything. (Was *Data*.) |
| **Continuous Improvement** | The platform's self-extending intelligence and efficiency capabilities. (Unchanged in name.) |

The engines compose the eight substrate primitives — `chat-surface`, `agentic-runtime`, `rag`, `embeddings`, `voice`, `document-intelligence`, `classifier` (always local; gates everything), and `proposal-generator` — through the **Intent contract** (`server/engines/_intent.ts`). Engines never import other engines; cross-engine queries route through `chat-router`.

## Mission specializations within Missional

The financial advisory mission specialization is fully implemented and ports the prior `stewardly-ai` wealth-engine functionality (financial modeling, planning calculations, advisor recommendations, household graph, CE tracking adapted for the advisor mission). Pastoral, teaching, healthcare, coaching, and community-organizing specializations are scaffolded with the same Intent surface and ready to receive their domain-specific calculators and counsel.

```
server/engines/missional/
├── _index.ts
├── wealth/        ← ported from stewardly-ai (full)
├── pastoral/      ← scaffold
├── teaching/      ← scaffold
├── healthcare/    ← scaffold
├── coaching/      ← scaffold
└── community/     ← scaffold
```

## Architecture (binding, from STEWARDLY v3 §3)

The architecture below is binding; the build is to it, not a re-derivation of it.

The platform uses a **unified pricing formula** of the form `CustomerInvoice = PlatformFee + DirectCost (0% markup) + InfrastructureMargin − CustomerSavingsShare × MeasuredSavings`, with three billing modes (on-demand, subscription, hybrid) and a monthly true-up. Four BYOM scenarios are supported (S1 Stewardly providers, S2 customer enterprise contracts, S3 self-hosted, S4 hybrid per-primitive). The conflict-of-interest architecture enforces 0% markup pass-through pricing, BYOM-first-class equivalence, multi-provider substrate, and classifier-driven cost minimization. The classifier is always local and gates every substrate decision. Memory portability is first-class and never paywalled. The administrative spectrum — Manual / Supervised / Delegated / Automatic — is enforced per integration class, with the compliance class permanently excluded from Automatic. The EMBA Section 7 ToS boundary is permanent and inviolable: no automated access to `onlinelearning.quantic.edu` or related domains. Stewardship language is brand and values, not regulatory; counsel review is required before any compliance claim becomes public-facing.

## Glass polish layer

The glass components from `glass-components-export.zip` are integrated as the polish layer **within** Manus Next's existing UX language; they extend, they do not replace. The OKLCH design tokens, `ChatGreeting`, `EnginesGridMenu` (a renamed `AppsGridMenu` mapped to Formational/Relational/Missional/Contextual), `VoiceOrb`, and `PersonaSidebar5` are wired to actual engine state. The nine substrate primitives (`ActionIndicator`, `TierBadge`, `QualityScoreDisplay`, `SovereignModeIndicator`, `ConnectionQualityIndicator`, `WorkspaceArtifactsPanel`, `SearchCascadePanel`, `MemoryInsightPanel`, `ATLASGoalPanel`) light up automatically as their engine state becomes available.

## BYOM single-button-press setup

Bring-your-own local models, self-hosted infrastructure, and enterprise AI contracts are supported from day one with single-button-press setup. The setup agent uses the foundation's multi-engine search cascade, browser automation, sandbox execution, the Intent Checker pattern, and the iterate-on-validate convergence methodology to handle technical work for nontechnical users. Setup recommendations stay customer-side per the conflict-of-interest architecture.

## Repository map

```
.
├── client/                        # React 19 + Tailwind CSS 4 frontend (foundation)
│   └── src/components/glass/      # NEW: glass component polish layer
├── server/                        # Express + tRPC backend (foundation)
│   ├── _core/                     # Foundation core (LLM, env, auth, etc.)
│   └── engines/                   # NEW: five Stewardly engines
│       ├── _intent.ts             # Intent contract (substrate boundary)
│       ├── _substrate.ts          # Eight substrate primitives
│       ├── formational/
│       ├── relational/
│       ├── missional/
│       │   ├── wealth/            # Ported from stewardly-ai
│       │   ├── pastoral/
│       │   ├── teaching/
│       │   ├── healthcare/
│       │   ├── coaching/
│       │   └── community/
│       ├── contextual/
│       └── continuous-improvement/
├── shared/                        # Shared types and constants (foundation)
├── packages/                      # Workspace packages (foundation)
├── migrations/                    # NEW: stewardly-ai → stewardly migration
│   ├── inputs/                    # Place stewardly-ai DB dump and vault export here
│   ├── 001_additive_schema.sql
│   ├── 002_customer_state.ts
│   ├── 003_integrations.ts
│   ├── 004_document_vault.ts
│   ├── 005_pass_artifacts.ts
│   └── runbook.md
├── docs/
│   ├── foundation/                # Original manus-next-app docs preserved
│   ├── historical/passes/         # stewardly-ai Pass artifacts (Pass 162 and prior)
│   └── stewardly-v3/              # v3 build documentation
└── deploy/                        # NEW: production deploy bundle and runbook
```

## Quick start

```bash
pnpm install
cp .env.example .env             # populate using the secret roster in deploy/SECRETS.md
pnpm db:push                     # apply schema (additive — preserves existing data)
pnpm dev                         # http://localhost:5173
```

## Migration from stewardly-ai

The full migration runbook is at [`migrations/runbook.md`](migrations/runbook.md). It is idempotent, dry-run-capable, and preserves existing user accounts, accumulated memory, audit logs, configured integrations, document-vault contents, and recursive-optimization Pass artifacts. Existing user-visible features remain accessible by their existing paths; reorganization introduces new paths additively with redirects.

## Production deployment

See [`deploy/RUNBOOK.md`](deploy/RUNBOOK.md). The DNS plan retargets `stewardly.manus.space` to the new build. The 7-day stable-operation observation window precedes archival of `mwpenn94/stewardly-ai`; the archival PR is pre-prepared in this repo at `deploy/archival-pr/`.

## Operational discipline

This build preserves customer data, integrations, environment variables, secrets, build configuration, and existing customer experience through migration. Modifications require explicit justification with audit-logged rationale. Existing user accounts continue to authenticate without re-onboarding. Existing URLs continue to resolve. Hard-escalation surfaces are limited to the four conditions in v3 §7.

## Related repositories

The Manus Next foundation lives at [`mwpenn94/manus-next-app`](https://github.com/mwpenn94/manus-next-app) and continues to exist untouched as the canonical reference for foundation patterns this repo inherits from. The prior advisor-platform implementation lives at [`mwpenn94/stewardly-ai`](https://github.com/mwpenn94/stewardly-ai); after seven days of continuous stable operation on the new deployment, that repository will be archived per v3 §4.5.

## License

MIT — same as the foundation.
