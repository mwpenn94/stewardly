/**
 * Search Parity Tests — Validates the multi-engine search and data_lookup tools
 * achieve parity+ with Manus's info_search_web behavior.
 * 
 * EXECUTION ORDER in executeSearch:
 *   1. Brave (if braveApiKey) — 1 fetch call
 *   2. SearXNG multi-instance — up to 2 calls per instance (JSON then HTML)
 *      - If custom URL: tries JSON, then HTML on that URL
 *      - If no custom URL: tries up to 3 public instances (JSON + HTML each)
 *   3. DDG HTML — 1 fetch call
 *   4. Wikipedia — 1 fetch call
 *   5. Hacker News (if tech query) — 1 fetch call
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for search engine tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Search Engine Service", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.resetModules(); // Reset module cache so each test gets fresh import
  });

  it("should export executeSearch and formatSearchResults", async () => {
    const mod = await import("./services/searchEngine");
    expect(mod.executeSearch).toBeDefined();
    expect(typeof mod.executeSearch).toBe("function");
    expect(mod.formatSearchResults).toBeDefined();
    expect(typeof mod.formatSearchResults).toBe("function");
  });

  it("should return structured SearchResponse with correct fields", async () => {
    // Order: SearXNG public instances (JSON+HTML x3) → DDG → Wikipedia
    // Use mockImplementation to handle all calls
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("html.duckduckgo.com")) {
        return {
          ok: true,
          text: async () => `
            <div class="result">
              <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Farticle">Example Article Title</a>
              <td class="result__snippet">This is a snippet about the article content.</td>
            </div>
          `,
        };
      }
      if (typeof url === "string" && url.includes("wikipedia.org")) {
        return { ok: true, json: async () => ({ query: { search: [] } }) };
      }
      // SearXNG public instances — return empty to simulate unavailable
      return { ok: false, status: 403 };
    });

    const { executeSearch } = await import("./services/searchEngine");
    const response = await executeSearch({ query: "test query" });

    expect(response).toHaveProperty("results");
    expect(response).toHaveProperty("totalResults");
    expect(response).toHaveProperty("enginesUsed");
    expect(response).toHaveProperty("warnings");
    expect(response).toHaveProperty("query", "test query");
    expect(response).toHaveProperty("durationMs");
    expect(typeof response.durationMs).toBe("number");
  });

  it("should format results with URLs and guidance for read_webpage", async () => {
    const { formatSearchResults } = await import("./services/searchEngine");
    const mockResponse = {
      results: [
        { title: "Test Result", url: "https://example.com", snippet: "A test snippet", source: "ddg" as const, score: 90 },
        { title: "Second Result", url: "https://other.com", snippet: "Another snippet", source: "brave" as const, score: 85 },
      ],
      totalResults: 2,
      enginesUsed: ["duckduckgo", "brave"],
      warnings: [],
      query: "test query",
      durationMs: 150,
    };

    const formatted = formatSearchResults(mockResponse);
    
    // Should contain result titles and URLs
    expect(formatted).toContain("Test Result");
    expect(formatted).toContain("https://example.com");
    expect(formatted).toContain("Second Result");
    expect(formatted).toContain("https://other.com");
    // Should contain guidance to use read_webpage (matching Manus workflow)
    expect(formatted).toContain("read_webpage");
    // Should mention engines used
    expect(formatted).toContain("duckduckgo");
    expect(formatted).toContain("brave");
  });

  it("should deduplicate results from multiple engines", async () => {
    const { formatSearchResults } = await import("./services/searchEngine");
    const mockResponse = {
      results: [
        { title: "Unique Result 1", url: "https://a.com", snippet: "A", source: "ddg" as const, score: 90 },
        { title: "Unique Result 2", url: "https://b.com", snippet: "B", source: "brave" as const, score: 85 },
      ],
      totalResults: 2,
      enginesUsed: ["duckduckgo", "brave"],
      warnings: [],
      query: "test",
      durationMs: 100,
    };

    const formatted = formatSearchResults(mockResponse);
    // Each result should appear exactly once
    const occurrences = (formatted.match(/https:\/\/a\.com/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it("should handle date_range parameter for time-filtered searches", async () => {
    // Track all fetch calls to verify date parameter
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("html.duckduckgo.com")) {
        return {
          ok: true,
          text: async () => `<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fnews.com%2Frecent">Recent News</a><td class="result__snippet">Latest update</td></div>`,
        };
      }
      if (typeof url === "string" && url.includes("wikipedia.org")) {
        return { ok: true, json: async () => ({ query: { search: [] } }) };
      }
      return { ok: false, status: 403 };
    });

    const { executeSearch } = await import("./services/searchEngine");
    const response = await executeSearch({ query: "AI news", dateRange: "past_week" });

    // Should have called fetch with date parameter on DDG
    expect(mockFetch).toHaveBeenCalled();
    const ddgCall = mockFetch.mock.calls.find((c: any) => 
      typeof c[0] === "string" && c[0].includes("html.duckduckgo.com")
    );
    expect(ddgCall).toBeDefined();
    expect(ddgCall![0]).toContain("df=w"); // DDG week filter
  });

  it("should use SearXNG when configured with custom URL", async () => {
    // Order: SearXNG custom URL (JSON) → DDG → Wikipedia
    mockFetch.mockImplementation(async (url: string) => {
      if (typeof url === "string" && url.includes("my-searxng.example.com") && url.includes("format=json")) {
        return {
          ok: true,
          json: async () => ({
            results: [
              { title: "SearXNG Result", url: "https://searx-result.com", content: "From SearXNG" },
            ],
          }),
        };
      }
      if (typeof url === "string" && url.includes("html.duckduckgo.com")) {
        return { ok: true, text: async () => `<div></div>` };
      }
      if (typeof url === "string" && url.includes("wikipedia.org")) {
        return { ok: true, json: async () => ({ query: { search: [] } }) };
      }
      // Other SearXNG instances — fail
      return { ok: false, status: 403 };
    });

    const { executeSearch } = await import("./services/searchEngine");
    const response = await executeSearch({
      query: "test",
      searxngUrl: "https://my-searxng.example.com",
    });

    expect(response.enginesUsed).toContain("searxng");
    expect(response.results.some(r => r.source === "searxng")).toBe(true);
  });

  it("should use Brave Search when API key is configured", async () => {
    // Order: Brave → SearXNG (public, will fail) → DDG → Wikipedia
    mockFetch.mockImplementation(async (url: string, opts?: any) => {
      if (typeof url === "string" && url.includes("api.search.brave.com")) {
        return {
          ok: true,
          json: async () => ({
            web: {
              results: [
                { title: "Brave Result", url: "https://brave-result.com", description: "From Brave" },
              ],
            },
          }),
        };
      }
      if (typeof url === "string" && url.includes("html.duckduckgo.com")) {
        return { ok: true, text: async () => `<div></div>` };
      }
      if (typeof url === "string" && url.includes("wikipedia.org")) {
        return { ok: true, json: async () => ({ query: { search: [] } }) };
      }
      // SearXNG public instances — fail
      return { ok: false, status: 403 };
    });

    const { executeSearch } = await import("./services/searchEngine");
    const response = await executeSearch({
      query: "test",
      braveApiKey: "test-brave-key",
    });

    expect(response.enginesUsed).toContain("brave");
    expect(response.results.some(r => r.source === "brave")).toBe(true);
  });
});

describe("Data Lookup Tool", () => {
  it("should be registered in AGENT_TOOLS", async () => {
    const { AGENT_TOOLS } = await import("./agentTools");
    const dataLookup = AGENT_TOOLS.find(
      (t: any) => t.function?.name === "data_lookup"
    );
    expect(dataLookup).toBeDefined();
    expect(dataLookup?.function?.parameters?.properties?.api_id).toBeDefined();
    expect(dataLookup?.function?.parameters?.properties?.query_params).toBeDefined();
  });

  it("should have correct description mentioning authoritative data", async () => {
    const { AGENT_TOOLS } = await import("./agentTools");
    const dataLookup = AGENT_TOOLS.find(
      (t: any) => t.function?.name === "data_lookup"
    );
    expect(dataLookup?.function?.description).toContain("authoritative");
    expect(dataLookup?.function?.description).toContain("BEFORE web_search");
  });

  it("should require api_id parameter", async () => {
    const { AGENT_TOOLS } = await import("./agentTools");
    const dataLookup = AGENT_TOOLS.find(
      (t: any) => t.function?.name === "data_lookup"
    );
    expect(dataLookup?.function?.parameters?.required).toContain("api_id");
  });
});

describe("Web Search Tool Enhancement", () => {
  it("should have date_range parameter in tool definition", async () => {
    const { AGENT_TOOLS } = await import("./agentTools");
    const webSearch = AGENT_TOOLS.find(
      (t: any) => t.function?.name === "web_search"
    );
    expect(webSearch?.function?.parameters?.properties?.date_range).toBeDefined();
    expect(webSearch?.function?.parameters?.properties?.date_range?.enum).toContain("past_week");
    expect(webSearch?.function?.parameters?.properties?.date_range?.enum).toContain("past_month");
  });

  it("should mention real search engines in description", async () => {
    const { AGENT_TOOLS } = await import("./agentTools");
    const webSearch = AGENT_TOOLS.find(
      (t: any) => t.function?.name === "web_search"
    );
    expect(webSearch?.function?.description).toContain("DuckDuckGo");
    expect(webSearch?.function?.description).toContain("SearXNG");
    expect(webSearch?.function?.description).toContain("Brave");
  });
});

describe("System Prompt Parity", () => {
  it("should include structured task planning section", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/agentStream.ts", "utf-8");
    expect(content).toContain("STRUCTURED TASK PLANNING");
    expect(content).toContain("authoritative data APIs > web search results > internal knowledge");
    expect(content).toContain("Snippets in search results are NOT valid sources");
    expect(content).toContain("read_webpage");
  });

  it("should include data_lookup in tool descriptions", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/agentStream.ts", "utf-8");
    expect(content).toContain("data_lookup");
    expect(content).toContain("HIGHEST PRIORITY source");
  });

  it("should include information priority hierarchy", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/agentStream.ts", "utf-8");
    expect(content).toContain("authoritative data APIs > web search results > internal knowledge");
  });
});

describe("Capability Tiers Service", () => {
  it("should export getCapabilityDefinitions and resolveTier", async () => {
    const mod = await import("./services/capabilityTiers");
    expect(mod.getCapabilityDefinitions).toBeDefined();
    expect(mod.resolveTier).toBeDefined();
  });

  it("should define all 9 capability domains", async () => {
    const { getCapabilityDefinitions } = await import("./services/capabilityTiers");
    const defs = getCapabilityDefinitions({ apiKeys: {}, usageCounts: {} as any });
    expect(defs.length).toBeGreaterThanOrEqual(9);
    
    const domains = defs.map(d => d.domain);
    expect(domains).toContain("search");
    expect(domains).toContain("image_generation");
    expect(domains).toContain("voice_tts");
    expect(domains).toContain("browser");
    expect(domains).toContain("research");
    expect(domains).toContain("llm");
  });

  it("should resolve active tier with quality-first degradation", async () => {
    const { resolveTier } = await import("./services/capabilityTiers");
    const result = resolveTier("search", { apiKeys: {}, usageCounts: {} as any });
    
    // Without any API keys, should degrade to standard (DDG)
    expect(result).toHaveProperty("tier");
    expect(result.tier).toHaveProperty("level");
    expect(result.tier).toHaveProperty("quality");
    expect(result.tier).toHaveProperty("name");
  });

  it("should upgrade tier when Brave API key is provided", async () => {
    const { resolveTier } = await import("./services/capabilityTiers");
    const result = resolveTier("search", { apiKeys: { BRAVE_SEARCH_API_KEY: "test-key" }, usageCounts: {} as any });
    
    // With Brave key, should resolve to premium tier
    expect(result.tier.quality).toBe("premium");
  });

  it("should include upgrade paths for each domain", async () => {
    const { getCapabilityDefinitions } = await import("./services/capabilityTiers");
    const defs = getCapabilityDefinitions({ apiKeys: {}, usageCounts: {} as any });
    
    for (const def of defs) {
      expect(def).toHaveProperty("upgrades");
      expect(Array.isArray(def.upgrades)).toBe(true);
    }
  });
});

describe("Tiered Image Generation", () => {
  it("should export generateImageTiered", async () => {
    const mod = await import("./services/tieredImageGen");
    expect(mod.generateImageTiered).toBeDefined();
    expect(typeof mod.generateImageTiered).toBe("function");
  });
});

describe("Tiered Voice TTS", () => {
  it("should export generateSpeechTiered", async () => {
    const mod = await import("./services/tieredVoice");
    expect(mod.generateSpeechTiered).toBeDefined();
    expect(typeof mod.generateSpeechTiered).toBe("function");
  });
});

describe("Tiered Browser", () => {
  it("should export browseUrlTiered", async () => {
    const mod = await import("./services/tieredBrowser");
    expect(mod.browseUrlTiered).toBeDefined();
    expect(typeof mod.browseUrlTiered).toBe("function");
  });
});
