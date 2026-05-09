/**
 * glass-substrate.test.ts
 *
 * Locks the user-supplied glass substrate wiring against silent regressions:
 *   - Brand mark uses the marble icon (not a placeholder "?")
 *   - design-tokens.css delta is merged (font-scale, prose-chat, scroll-mask,
 *     animate-message-in, typing-dot, thinking-dot)
 *   - ChatGreeting is wired into ManusNextChat empty state
 *   - Header substrate badges (ConnectionQuality / SovereignMode / TierBadge)
 *     are present in ManusNextChat
 *   - ActionIndicator replaces the legacy text streaming status
 *   - Right-rail substrate panels (Memory / ATLAS / Workspace / SearchCascade
 *     / QualityScore) are conditionally rendered from the chat substrate
 *     context (no fake data when the context is empty)
 *   - chatSubstrate context exists, defaults all five slices to empty/null
 *   - Engine-taxonomy single source of truth still holds (regression guard)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const repoRoot = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(repoRoot, p), "utf8");

describe("glass substrate wiring", () => {
  it("BrandAvatar points at the marble icon (no placeholder)", () => {
    const src = read("client/src/components/BrandAvatar.tsx");
    expect(src).toMatch(/manus-storage|stewardly-icons|H_white_marble/i);
    // Should not silently fall back to literal "?" character
    const literalQuestion = src.match(/['"`]\?['"`]/);
    if (literalQuestion) {
      // OK as long as it's clearly a fallback path, not the primary
      expect(src).toMatch(/fallback|placeholder|alt=/i);
    }
  });

  it("design-tokens delta is merged into client/src/index.css", () => {
    const css = read("client/src/index.css");
    expect(css).toMatch(/--font-scale/);
    expect(css).toMatch(/font-scale-default/);
    expect(css).toMatch(/chat-density-default/);
    expect(css).toMatch(/\.scroll-mask/);
    expect(css).toMatch(/\.prose-chat/);
    expect(css).toMatch(/animate-message-in/);
    expect(css).toMatch(/\.typing-dot/);
    expect(css).toMatch(/\.thinking-dot/);
  });

  it("ChatGreeting is wired into ManusNextChat empty-state", () => {
    const src = read("client/src/components/ManusNextChat.tsx");
    expect(src).toMatch(/from\s+["']@\/components\/glass\/ChatGreeting["']/);
    expect(src).toMatch(/<ChatGreeting/);
  });

  it("header substrate badges are wired into ManusNextChat", () => {
    const src = read("client/src/components/ManusNextChat.tsx");
    expect(src).toMatch(/<ConnectionQualityIndicator/);
    expect(src).toMatch(/<SovereignModeIndicator/);
    expect(src).toMatch(/<TierBadge/);
  });

  it("ActionIndicator replaces legacy text streaming status", () => {
    const src = read("client/src/components/ManusNextChat.tsx");
    expect(src).toMatch(/<ActionIndicator/);
    // Legacy "Optimizing recursively..." text should no longer be in the
    // streaming branch (it would mean the old block wasn't replaced)
    expect(src).not.toMatch(/Optimizing recursively/);
  });

  it("right-rail substrate panels render conditionally from substrate context", () => {
    const src = read("client/src/components/ManusNextChat.tsx");
    expect(src).toMatch(/useChatSubstrate/);
    expect(src).toMatch(/<MemoryInsightPanel/);
    expect(src).toMatch(/<ATLASGoalPanel/);
    expect(src).toMatch(/<SearchCascadePanel/);
    expect(src).toMatch(/<WorkspaceArtifactsPanel/);
    expect(src).toMatch(/<QualityScoreDisplay/);
    // Conditional rendering ensures empty context = nothing rendered
    expect(src).toMatch(/hasRightRailContent/);
    expect(src).toMatch(/substrate\.qualityScore && /);
    expect(src).toMatch(/substrate\.memory && /);
    expect(src).toMatch(/substrate\.atlas && /);
    expect(src).toMatch(/substrate\.searchCascade && /);
  });

  it("ChatSubstrateContext defaults every slice to empty/null", () => {
    const src = read("client/src/contexts/ChatSubstrateContext.tsx");
    expect(src).toMatch(/qualityScore:\s*null/);
    expect(src).toMatch(/memory:\s*null/);
    expect(src).toMatch(/atlas:\s*null/);
    expect(src).toMatch(/workspaceArtifacts:\s*\[\]/);
    expect(src).toMatch(/searchCascade:\s*null/);
    expect(src).toMatch(/export function useChatSubstrate/);
    expect(src).toMatch(/export function ChatSubstrateProvider/);
  });

  it("engine taxonomy single source of truth still binds (regression guard)", () => {
    const src = read("shared/engineTaxonomy.ts");
    expect(src).toMatch(/formational/);
    expect(src).toMatch(/relational/);
    expect(src).toMatch(/missional/);
    expect(src).toMatch(/contextual/);
    expect(src).toMatch(/continuous-improvement|continuousImprovement/);
  });
});
