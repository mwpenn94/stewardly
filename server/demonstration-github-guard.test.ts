/**
 * Test: Demonstration mode bypasses GitHub Query Guard
 *
 * Root cause: When a user sends a prompt like "What can you do? Demonstrate each
 * capability. Afterward, tell me about the connected github repo...", two guards
 * fire simultaneously:
 * - wantsDemonstration=true → injects 10-group demonstration protocol
 * - isGitHubRepoQuery=true → blocks web_search, read_webpage, wide_research
 *
 * The GitHub guard was blocking tools required by the demonstration protocol,
 * causing a death loop → early termination.
 *
 * Fix: Add `!wantsDemonstration` to the GitHub guard condition so demonstration
 * mode takes priority.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const agentStreamSource = readFileSync(
  resolve(__dirname, "agentStream.ts"),
  "utf-8"
);

describe("Demonstration mode + GitHub Guard interaction", () => {
  it("GitHub guard condition includes !wantsDemonstration bypass", () => {
    // The fix: the guard should check `!wantsDemonstration` before blocking
    expect(agentStreamSource).toContain(
      "isGitHubRepoQuery && !wantsDemonstration && toolCalls && toolCalls.length > 0"
    );
  });

  it("wantsDemonstration is declared before the while loop (in scope for the guard)", () => {
    const wantsDemoLine = agentStreamSource.indexOf("const wantsDemonstration =");
    const whileLoopLine = agentStreamSource.indexOf("while (turn < maxTurns)");
    expect(wantsDemoLine).toBeGreaterThan(0);
    expect(whileLoopLine).toBeGreaterThan(0);
    // wantsDemonstration must be declared BEFORE the while loop
    expect(wantsDemoLine).toBeLessThan(whileLoopLine);
  });

  it("wantsDemonstration regex matches the exact failing prompt", () => {
    const prompt =
      "What can you do? Demonstrate each capability. Afterward, tell me about the connected github repo, what you can do with it, and render a preview a user can view of the app here.";
    const regex =
      /\b(demonstrate\s+(each|all|every)\s+(of\s+)?(your\s+)?(capabilities|tools|features|abilities)|show\s+(me\s+)?(all|each|every)\s+(of\s+)?(your\s+)?(capabilities|tools|features|abilities)|what\s+can\s+you\s+do.*(demonstrate|show\s+me)|go\s+until\s+done\s+demonstrating|do\s+them\s+all.*(capabilities|demonstrations)|show\s+me\s+all\s+(your\s+)?(capabilities|tools|features))\b/i;
    expect(regex.test(prompt)).toBe(true);
  });

  it("isGitHubRepoQuery regex matches the exact failing prompt", () => {
    const prompt =
      "What can you do? Demonstrate each capability. Afterward, tell me about the connected github repo, what you can do with it, and render a preview a user can view of the app here.";
    const regex =
      /\b(connected\s*(github|repo)|my\s*(github|repo)|the\s*repo|about\s*(the|my|your)\s*(connected\s*)?(github|repo)|tell\s*me\s*about.*repo|what\s*(can|do)\s*you.*repo|status\s*of.*repo|what.*connected.*repo|preview.*repo|render.*preview|you('re|\s+are)\s+connected)\b/i;
    expect(regex.test(prompt)).toBe(true);
  });

  it("wantsContinuous regex matches the exact failing prompt", () => {
    const prompt =
      "what can you do? demonstrate each capability. afterward, tell me about the connected github repo, what you can do with it, and render a preview a user can view of the app here.";
    const regex =
      /\b(demonstrate\s+(each|all|every)|show\s+(me\s+)?(all|each|every)\s+(your\s+)?(capabilities|tools|features)|show\s+me\s+everything\s+you\s+can|keep going|go until\s+(done|finished)|don't stop|do them all|run\s+(all|each|every)\s+(capabilities|tools|features)|test\s+(all|each|every)\s+(capabilities|tools|features)|try\s+(all|each|every)\s+(capabilities|tools|features)|show me all\s+(your|the)\s+(capabilities|tools)|one by one.*(capabilities|tools|features))\b/i;
    expect(regex.test(prompt)).toBe(true);
  });

  it("normal GitHub query (without demonstration) still triggers the guard", () => {
    const prompt = "Tell me about the connected github repo";
    const wantsDemoRegex =
      /\b(demonstrate\s+(each|all|every)\s+(of\s+)?(your\s+)?(capabilities|tools|features|abilities)|show\s+(me\s+)?(all|each|every)\s+(of\s+)?(your\s+)?(capabilities|tools|features|abilities)|what\s+can\s+you\s+do.*(demonstrate|show\s+me)|go\s+until\s+done\s+demonstrating|do\s+them\s+all.*(capabilities|demonstrations)|show\s+me\s+all\s+(your\s+)?(capabilities|tools|features))\b/i;
    const githubRegex =
      /\b(connected\s*(github|repo)|my\s*(github|repo)|the\s*repo|about\s*(the|my|your)\s*(connected\s*)?(github|repo)|tell\s*me\s*about.*repo|what\s*(can|do)\s*you.*repo|status\s*of.*repo|what.*connected.*repo|preview.*repo|render.*preview|you('re|\s+are)\s+connected)\b/i;

    const wantsDemonstration = wantsDemoRegex.test(prompt);
    const isGitHubRepoQuery = githubRegex.test(prompt);

    // Guard condition: isGitHubRepoQuery && !wantsDemonstration
    expect(wantsDemonstration).toBe(false);
    expect(isGitHubRepoQuery).toBe(true);
    expect(isGitHubRepoQuery && !wantsDemonstration).toBe(true); // Guard fires
  });

  it("demonstration + github combo bypasses the guard", () => {
    const prompt =
      "What can you do? Demonstrate each capability. Afterward, tell me about the connected github repo, what you can do with it, and render a preview a user can view of the app here.";
    const wantsDemoRegex =
      /\b(demonstrate\s+(each|all|every)\s+(of\s+)?(your\s+)?(capabilities|tools|features|abilities)|show\s+(me\s+)?(all|each|every)\s+(of\s+)?(your\s+)?(capabilities|tools|features|abilities)|what\s+can\s+you\s+do.*(demonstrate|show\s+me)|go\s+until\s+done\s+demonstrating|do\s+them\s+all.*(capabilities|demonstrations)|show\s+me\s+all\s+(your\s+)?(capabilities|tools|features))\b/i;
    const githubRegex =
      /\b(connected\s*(github|repo)|my\s*(github|repo)|the\s*repo|about\s*(the|my|your)\s*(connected\s*)?(github|repo)|tell\s*me\s*about.*repo|what\s*(can|do)\s*you.*repo|status\s*of.*repo|what.*connected.*repo|preview.*repo|render.*preview|you('re|\s+are)\s+connected)\b/i;

    const wantsDemonstration = wantsDemoRegex.test(prompt);
    const isGitHubRepoQuery = githubRegex.test(prompt);

    // Guard condition: isGitHubRepoQuery && !wantsDemonstration
    expect(wantsDemonstration).toBe(true);
    expect(isGitHubRepoQuery).toBe(true);
    expect(isGitHubRepoQuery && !wantsDemonstration).toBe(false); // Guard BYPASSED
  });

  it("source has comment explaining the demonstration exception", () => {
    expect(agentStreamSource).toContain(
      "EXCEPTION: When wantsDemonstration is true"
    );
    expect(agentStreamSource).toContain(
      "The demonstration protocol takes priority over the GitHub guard"
    );
  });
});
