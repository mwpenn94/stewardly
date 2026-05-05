/**
 * Search Engine Service — Multi-Source Aggregate Search
 * 
 * Achieves parity+ with Manus's `info_search_web` by returning REAL web results
 * with URLs, titles, and snippets from multiple free search engines.
 * 
 * Cascade order:
 *   1. DuckDuckGo HTML Search (primary — free, unlimited, real results)
 *   2. SearXNG (optional — configurable instance, meta-search aggregation)
 *   3. Brave Search API (optional — free 2000/month, high quality)
 *   4. DuckDuckGo Instant Answer API (supplementary — quick facts)
 *   5. Wikipedia Search (supplementary — authoritative reference)
 *   6. Hacker News Algolia (supplementary — tech/news discussions)
 * 
 * Design matches Manus exactly:
 *   - Search returns URLs + titles + snippets
 *   - Agent uses read_webpage/browse_web to visit URLs for full content
 *   - Multi-step research: search → browse → search again
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "ddg" | "searxng" | "brave" | "wikipedia" | "hackernews" | "youtube" | "direct";
  publishedDate?: string;
  /** Relevance score (0-100) for ranking */
  score?: number;
}

export interface SearchOptions {
  query: string;
  /** Number of results to return (default: 10) */
  numResults?: number;
  /** Time range filter matching Manus: past_hour, past_day, past_week, past_month, past_year */
  dateRange?: "all" | "past_hour" | "past_day" | "past_week" | "past_month" | "past_year";
  /** Search categories: general, news, images, videos, science, it */
  categories?: string[];
  /** Optional: SearXNG instance URL (if user configured one) */
  searxngUrl?: string;
  /** Optional: Brave Search API key */
  braveApiKey?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  /** Total results found across all engines */
  totalResults: number;
  /** Which engines were queried */
  enginesUsed: string[];
  /** Any errors encountered (non-fatal) */
  warnings: string[];
  /** Query as executed */
  query: string;
  /** Time taken in ms */
  durationMs: number;
}

// ── DuckDuckGo HTML Search (Primary Engine) ──────────────────────────────

/**
 * Parse real search results from DuckDuckGo's HTML search page.
 * This is the most reliable free source — returns Google-quality results.
 */
async function ddgHtmlSearch(query: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    // Build URL with date range parameter
    let url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    if (dateRange && dateRange !== "all") {
      // DDG date range: d (day), w (week), m (month), y (year)
      const rangeMap: Record<string, string> = {
        past_hour: "d", // DDG doesn't have hourly, use day
        past_day: "d",
        past_week: "w",
        past_month: "m",
        past_year: "y",
      };
      const df = rangeMap[dateRange];
      if (df) url += `&df=${df}`;
    }

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!resp.ok) return [];
    const html = await resp.text();

    // Parse results using regex (DDG HTML is stable and well-structured)
    const titleRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|div)/g;

    const titles: Array<{ url: string; title: string }> = [];
    let match: RegExpExecArray | null;
    while ((match = titleRegex.exec(html)) !== null) {
      let resultUrl = match[1];
      // Extract actual URL from DDG redirect
      const uddgMatch = resultUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) resultUrl = decodeURIComponent(uddgMatch[1]);
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      if (title && resultUrl && !isAdUrl(resultUrl)) {
        titles.push({ url: resultUrl, title });
      }
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(
        match[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&#x27;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .trim()
      );
    }

    return titles.map((t, i) => ({
      title: t.title,
      url: t.url,
      snippet: snippets[i] || "",
      source: "ddg" as const,
      score: 90 - i * 5, // DDG results are already ranked
    }));
  } catch (err: any) {
    console.error(`[searchEngine] DDG HTML search failed: ${err.message}`);
    return [];
  }
}

// ── SearXNG Search (Optional Meta-Search) ────────────────────────────────

/**
 * Query a SearXNG instance for aggregated results from multiple engines.
 * Requires a configured instance URL with JSON format enabled.
 */
async function searxngSearch(
  query: string,
  instanceUrl: string,
  dateRange?: string,
  categories?: string[]
): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      categories: categories?.join(",") || "general",
    });

    // SearXNG time_range: day, week, month, year
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "day",
        past_day: "day",
        past_week: "week",
        past_month: "month",
        past_year: "year",
      };
      const tr = rangeMap[dateRange];
      if (tr) params.set("time_range", tr);
    }

    const url = `${instanceUrl.replace(/\/$/, "")}/search?${params.toString()}`;
    const resp = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "ManusNext/1.0 (AI Agent Search)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.warn(`[searchEngine] SearXNG returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const results: SearchResult[] = (data.results || []).slice(0, 15).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.content || "",
      source: "searxng" as const,
      publishedDate: r.publishedDate || undefined,
      score: r.score ? Math.round(r.score * 100) : 85 - i * 3,
    }));

    return results.filter(r => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] SearXNG search failed: ${err.message}`);
    return [];
  }
}

// ── Brave Search API (Optional — Free 2000/month) ────────────────────────

/**
 * Query Brave Search API for high-quality web results.
 * Free tier: 2000 queries/month, returns real search results.
 */
async function braveSearch(
  query: string,
  apiKey: string,
  dateRange?: string
): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      count: "10",
    });

    // Brave freshness: pd (past day), pw (past week), pm (past month), py (past year)
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "pd",
        past_day: "pd",
        past_week: "pw",
        past_month: "pm",
        past_year: "py",
      };
      const freshness = rangeMap[dateRange];
      if (freshness) params.set("freshness", freshness);
    }

    const resp = await fetch(`https://api.search.brave.com/res/v1/web/search?${params.toString()}`, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      console.warn(`[searchEngine] Brave Search returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const results: SearchResult[] = (data.web?.results || []).slice(0, 10).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
      source: "brave" as const,
      publishedDate: r.page_age || undefined,
      score: 95 - i * 4, // Brave results are very high quality
    }));

    return results.filter(r => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] Brave search failed: ${err.message}`);
    return [];
  }
}

// ── Wikipedia Search (Supplementary) ─────────────────────────────────────

async function wikipediaSearch(query: string): Promise<SearchResult[]> {
  try {
    const resp = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&format=json&origin=*`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.query?.search || []).map((r: any, i: number) => ({
      title: r.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
      snippet: r.snippet?.replace(/<[^>]+>/g, "") || "",
      source: "wikipedia" as const,
      score: 70 - i * 5,
    }));
  } catch {
    return [];
  }
}

// ── Hacker News Algolia (Supplementary — Tech/News) ──────────────────────

async function hackerNewsSearch(query: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    let url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`;
    
    // Add date filter
    if (dateRange && dateRange !== "all") {
      const now = Math.floor(Date.now() / 1000);
      const rangeMap: Record<string, number> = {
        past_hour: 3600,
        past_day: 86400,
        past_week: 604800,
        past_month: 2592000,
        past_year: 31536000,
      };
      const seconds = rangeMap[dateRange];
      if (seconds) {
        url += `&numericFilters=created_at_i>${now - seconds}`;
      }
    }

    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.hits || []).slice(0, 5).map((hit: any, i: number) => ({
      title: hit.title || "",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      snippet: `${hit.points || 0} points, ${hit.num_comments || 0} comments`,
      source: "hackernews" as const,
      score: 60 - i * 5,
    }));
  } catch {
    return [];
  }
}

// ── URL Filtering ────────────────────────────────────────────────────────

const AD_DOMAINS = [
  "duckduckgo.com/y.js", "duckduckgo.com/l/",
  "ad.doubleclick.net", "googleadservices.com", "googlesyndication.com",
  "facebook.com/l.php", "t.co", "bit.ly", "tinyurl.com",
  "clickserve", "clicktrack", "adclick", "adsrv",
  "taboola.com", "outbrain.com", "revcontent.com",
  "criteo.com", "bidswitch.net",
];

function isAdUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return AD_DOMAINS.some(d => lower.includes(d)) || /\/ad[s]?\/click/i.test(url);
}

// ── Result Deduplication & Ranking ───────────────────────────────────────

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const r of results) {
    // Normalize URL for dedup (remove trailing slash, www prefix, protocol)
    const normalized = r.url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "")
      .toLowerCase();
    
    const existing = seen.get(normalized);
    if (!existing || (r.score || 0) > (existing.score || 0)) {
      seen.set(normalized, r);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

// ── Main Search Function ─────────────────────────────────────────────────

/**
 * Execute a multi-engine web search that returns REAL results with URLs.
 * Matches Manus's info_search_web behavior exactly.
 */
export async function executeSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, numResults = 10, dateRange, categories, searxngUrl, braveApiKey } = options;
  
  const allResults: SearchResult[] = [];
  const enginesUsed: string[] = [];
  const warnings: string[] = [];

  // ── Primary: DuckDuckGo HTML Search (always runs — free, unlimited) ──
  console.log(`[searchEngine] Primary: DDG HTML search for "${query}"...`);
  const ddgResults = await ddgHtmlSearch(query, dateRange);
  if (ddgResults.length > 0) {
    allResults.push(...ddgResults);
    enginesUsed.push("duckduckgo");
    console.log(`[searchEngine] DDG returned ${ddgResults.length} results`);
  } else {
    warnings.push("DuckDuckGo HTML returned no results (may be rate-limited)");
    console.warn("[searchEngine] DDG HTML returned 0 results");
  }

  // ── Optional: SearXNG (if configured) ──
  if (searxngUrl) {
    console.log(`[searchEngine] SearXNG: querying ${searxngUrl}...`);
    const searxResults = await searxngSearch(query, searxngUrl, dateRange, categories);
    if (searxResults.length > 0) {
      allResults.push(...searxResults);
      enginesUsed.push("searxng");
      console.log(`[searchEngine] SearXNG returned ${searxResults.length} results`);
    } else {
      warnings.push("SearXNG returned no results");
    }
  }

  // ── Optional: Brave Search (if API key configured) ──
  if (braveApiKey) {
    console.log(`[searchEngine] Brave: querying API...`);
    const braveResults = await braveSearch(query, braveApiKey, dateRange);
    if (braveResults.length > 0) {
      allResults.push(...braveResults);
      enginesUsed.push("brave");
      console.log(`[searchEngine] Brave returned ${braveResults.length} results`);
    } else {
      warnings.push("Brave Search returned no results");
    }
  }

  // ── Supplementary: Wikipedia (always runs for reference) ──
  const wikiResults = await wikipediaSearch(query);
  if (wikiResults.length > 0) {
    allResults.push(...wikiResults);
    enginesUsed.push("wikipedia");
  }

  // ── Supplementary: Hacker News (for tech/news queries) ──
  const techKeywords = ["ai", "software", "startup", "tech", "programming", "code", "api", "cloud", "machine learning", "llm", "open source"];
  const isTechQuery = techKeywords.some(k => query.toLowerCase().includes(k));
  if (isTechQuery) {
    const hnResults = await hackerNewsSearch(query, dateRange);
    if (hnResults.length > 0) {
      allResults.push(...hnResults);
      enginesUsed.push("hackernews");
    }
  }

  // ── Deduplicate and rank ──
  const ranked = deduplicateResults(allResults).slice(0, numResults);

  return {
    results: ranked,
    totalResults: allResults.length,
    enginesUsed,
    warnings,
    query,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Format search results into a Manus-compatible output string.
 * This is what the agent sees — clean, actionable results with URLs to visit.
 */
export function formatSearchResults(response: SearchResponse): string {
  let output = `## Web Search Results for: "${response.query}"\n\n`;
  output += `*${response.results.length} results from ${response.enginesUsed.join(", ")} (${response.durationMs}ms)*\n\n`;

  if (response.results.length === 0) {
    output += `No results found. Try:\n`;
    output += `- Simplifying the query\n`;
    output += `- Using different keywords\n`;
    output += `- Removing date-specific terms\n`;
    return output;
  }

  // Format results like a SERP — title, URL, snippet
  for (let i = 0; i < response.results.length; i++) {
    const r = response.results[i];
    output += `### ${i + 1}. ${r.title}\n`;
    output += `**URL:** ${r.url}\n`;
    if (r.snippet) output += `${r.snippet}\n`;
    if (r.publishedDate) output += `*Published: ${r.publishedDate}*\n`;
    output += `*(${r.source})*\n\n`;
  }

  // Add guidance for the agent (matching Manus workflow)
  output += `---\n\n`;
  output += `**Next steps:** Use \`read_webpage\` to visit the most relevant URLs above for detailed content. `;
  output += `Search results snippets are brief — always read the full page for comprehensive information.\n`;

  if (response.warnings.length > 0) {
    output += `\n*Warnings: ${response.warnings.join("; ")}*\n`;
  }

  return output;
}
