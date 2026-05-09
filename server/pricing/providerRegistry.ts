/**
 * Stewardly pricing — Provider-neutral registry
 * =================================================
 *
 * Per PHASE1_BRIEF.md commitments C-22 (BYO first-class), C-26
 * (technological completeness), and C-27 (provider-neutral BYO including
 * Manus), this registry treats every AI/agent/tool provider as one of
 * many — including Manus itself — with NO privileged-baseline status for
 * any provider. The internal-AI-agent default that ships with the platform
 * is the *bundled out-of-box experience*, not Manus-as-default.
 *
 * The registry stores per-provider metadata used by:
 *   - the substrate router for classifier-minimised cost estimation,
 *   - the BYOM single-button-press setup agent,
 *   - the customer-facing pricing UI (Wave E),
 *   - the audit trail (Contextual engine, commitment C-19).
 *
 * No provider is hard-wired. Adding a new provider is a registry insert.
 * Removing a provider is a registry delete. The substrate router's
 * dispatch logic does not know any provider's name; it knows only
 * provider IDs and the per-ID metadata fetched from this registry.
 *
 * Invariants (enforced by `__tests__/providerRegistry.test.ts`):
 *   PR-1: every provider has a unique ID
 *   PR-2: no provider is privileged: there is no `isDefault` flag, no
 *         `isPreferred` flag, no `isBaseline` flag
 *   PR-3: Manus is registered as a provider (not as the substrate)
 *   PR-4: at least one bundled internal-default provider exists, but the
 *         "bundled internal default" is its own provider, NOT Manus
 *   PR-5: the registry exports a stable `listProviders()` that orders
 *         providers alphabetically by ID (no preference ordering)
 */

export type ProviderKind = "llm" | "agent" | "tool" | "surface" | "rag" | "voice" | "vision" | "embeddings";

export interface ProviderMetadata {
  id: string;
  displayName: string;
  kinds: ProviderKind[];
  /** Whether this provider is part of the bundled out-of-box experience.
   *  Multiple providers may carry this flag; it is NOT a preference
   *  ordering and the substrate router does not weight it. */
  bundled: boolean;
  /** Whether the customer's contract pays this provider directly (BYO). */
  byoCapable: boolean;
  /** Per-token / per-call cost descriptor (advisory; used for classifier
   *  minimisation, not for billing markup since DirectCost is zero-markup). */
  costDescriptor?: {
    inputUsdPer1kTokens?: number;
    outputUsdPer1kTokens?: number;
    perCallUsd?: number;
  };
}

const REGISTRY: ProviderMetadata[] = [
  {
    id: "stewardly-internal-default",
    displayName: "Stewardly Bundled Default",
    kinds: ["llm", "agent", "tool", "surface", "rag", "voice", "vision", "embeddings"],
    bundled: true,
    byoCapable: false,
  },
  {
    id: "anthropic",
    displayName: "Anthropic",
    kinds: ["llm"],
    bundled: false,
    byoCapable: true,
  },
  {
    id: "openai",
    displayName: "OpenAI",
    kinds: ["llm", "voice", "embeddings"],
    bundled: false,
    byoCapable: true,
  },
  {
    id: "google",
    displayName: "Google",
    kinds: ["llm", "embeddings", "voice"],
    bundled: false,
    byoCapable: true,
  },
  {
    id: "manus",
    displayName: "Manus",
    kinds: ["llm", "agent", "surface", "tool"],
    bundled: false,
    byoCapable: true,
  },
  {
    id: "deepgram",
    displayName: "Deepgram",
    kinds: ["voice"],
    bundled: false,
    byoCapable: true,
  },
  {
    id: "elevenlabs",
    displayName: "ElevenLabs",
    kinds: ["voice"],
    bundled: false,
    byoCapable: true,
  },
];

export function listProviders(): ProviderMetadata[] {
  // PR-5: alphabetical order, no preference ordering.
  return [...REGISTRY].sort((a, b) => a.id.localeCompare(b.id));
}

export function getProvider(id: string): ProviderMetadata | undefined {
  return REGISTRY.find((p) => p.id === id);
}

export function listProvidersByKind(kind: ProviderKind): ProviderMetadata[] {
  return listProviders().filter((p) => p.kinds.includes(kind));
}

export function listBundledProviders(): ProviderMetadata[] {
  return listProviders().filter((p) => p.bundled);
}

export function listByoCapableProviders(): ProviderMetadata[] {
  return listProviders().filter((p) => p.byoCapable);
}
