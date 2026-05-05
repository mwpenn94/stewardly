/**
 * Search Engine Service — Tiered Quality-First Degradation
 * 
 * Achieves parity+ with Manus's `info_search_web` by returning REAL web results
 * with URLs, titles, and snippets from multiple search engines.
 * 
 * TIERED CASCADE (highest quality first, degrades when unavailable):
 *   Tier 0 (Premium API):    Serper.dev (2,500 free on signup — Google results)
 *   Tier 1 (Premium API):    Brave Search API ($5 free credits/month)
 *   Tier 2 (Premium API):    Tavily (1,000 free credits/month — AI-optimized)
 *   Tier 3 (Free Unlimited): DuckDuckGo HTML parsing (may get CAPTCHA from cloud IPs)
 *   Tier 4 (Free Unlimited): SearXNG (public instances — often rate-limited)
 *   Tier 5 (Reference):      Wikipedia + Hacker News (always available)
 *   Tier U (User Upgrades):  Google CSE (100 free/day), Bing API, custom SearXNG
 * 
 * The system tries each tier in order and stops when it gets quality results.
 * Lower tiers still run for supplementary breadth (Wikipedia, HN).
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
  source: "serper" | "brave" | "tavily" | "ddg" | "searxng" | "google_cse" | "wikipedia" | "hackernews" | "youtube" | "direct";
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
  /** Optional: Serper.dev API key */
  serperApiKey?: string;
  /** Optional: Tavily API key */
  tavilyApiKey?: string;
  /** Optional: Google Custom Search Engine ID + API key */
  googleCseId?: string;
  googleCseKey?: string;
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
  /** Which tier provided the primary results */
  activeTier?: "premium" | "high" | "standard" | "degraded";
  /** Name of the primary engine that provided results */
  primaryEngine?: string;
}

// ── Tier 0: Serper.dev (Premium — 2,500 free credits on signup, Google results) ──

async function serperSearch(query: string, apiKey: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    const body: Record<string, any> = { q: query, num: 10 };
    
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "qdr:h", past_day: "qdr:d", past_week: "qdr:w", past_month: "qdr:m", past_year: "qdr:y",
      };
      body.tbs = rangeMap[dateRange] || undefined;
    }

    const resp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      console.warn(`[searchEngine] Serper returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const organic = data.organic || [];
    return organic.slice(0, 10).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || "",
      source: "serper" as const,
      publishedDate: r.date || undefined,
      score: 98 - i * 3, // Serper returns actual Google results — highest quality
    })).filter((r: SearchResult) => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] Serper search failed: ${err.message}`);
    return [];
  }
}

// ── Tier 1: Brave Search API (Premium — $5 free credits/month) ──────────────

async function braveSearch(query: string, apiKey: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({ q: query, count: "10" });

    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "pd", past_day: "pd", past_week: "pw", past_month: "pm", past_year: "py",
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
      console.warn(`[searchEngine] Brave returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    return (data.web?.results || []).slice(0, 10).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.description || "",
      source: "brave" as const,
      publishedDate: r.page_age || undefined,
      score: 95 - i * 4,
    })).filter((r: SearchResult) => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] Brave search failed: ${err.message}`);
    return [];
  }
}

// ── Tier 2: Tavily (Premium — 1,000 free credits/month, AI-optimized) ───────

async function tavilySearch(query: string, apiKey: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    const body: Record<string, any> = {
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 10,
      include_answer: false,
    };

    if (dateRange && dateRange !== "all") {
      // Tavily supports days parameter
      const daysMap: Record<string, number> = {
        past_hour: 1, past_day: 1, past_week: 7, past_month: 30, past_year: 365,
      };
      body.days = daysMap[dateRange] || undefined;
    }

    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.warn(`[searchEngine] Tavily returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    return (data.results || []).slice(0, 10).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.content || "",
      source: "tavily" as const,
      publishedDate: r.published_date || undefined,
      score: 92 - i * 4,
    })).filter((r: SearchResult) => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] Tavily search failed: ${err.message}`);
    return [];
  }
}

// ── Tier 3: DuckDuckGo HTML (Free Unlimited — may get CAPTCHA from cloud) ───

async function ddgHtmlSearch(query: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    let url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "d", past_day: "d", past_week: "w", past_month: "m", past_year: "y",
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

    // Detect CAPTCHA/anomaly challenge
    if (html.includes("anomaly") || html.includes("challenge-form") || html.includes("botnet")) {
      console.warn("[searchEngine] DDG HTML: CAPTCHA detected, skipping");
      return [];
    }

    // Parse results (DDG HTML is stable and well-structured)
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
      score: 80 - i * 5,
    }));
  } catch (err: any) {
    console.error(`[searchEngine] DDG HTML search failed: ${err.message}`);
    return [];
  }
}

// ── Tier 3.5: Bing HTML Scraping (Free — works from cloud IPs with EN locale) ──

async function bingHtmlSearch(query: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    let url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setmkt=en-US&setlang=en&count=15`;
    
    // Date range filtering
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "eh", past_day: "ed", past_week: "ew", past_month: "em", past_year: "ey",
      };
      const df = rangeMap[dateRange];
      if (df) url += `&filters=ex1%3a%22${df}%22`;
    }

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!resp.ok) return [];
    const html = await resp.text();

    // Detect blocks
    if (html.includes("captcha") || html.includes("unusual traffic") || html.length < 5000) {
      console.warn("[searchEngine] Bing: blocked or empty response");
      return [];
    }

    const results: SearchResult[] = [];

    // Bing encodes URLs as base64 in &u=a1<BASE64>& parameter within bing.com/ck/a redirect links
    const regex = /<h2[^>]*><a[^>]+href="[^"]*&amp;u=a1([^&"]+)[^"]*"[^>]*>([\s\S]*?)<\/a><\/h2>/g;
    let m;
    while ((m = regex.exec(html)) !== null && results.length < 15) {
      try {
        const decoded = Buffer.from(m[1], "base64").toString("utf8");
        const title = m[2].replace(/<[^>]+>/g, "").trim();
        if (decoded.startsWith("http") && title && !isAdUrl(decoded)) {
          results.push({
            title,
            url: decoded,
            snippet: "",
            source: "direct" as const, // Use "direct" since we don't have a "bing" source type
            score: 82 - results.length * 4,
          });
        }
      } catch {}
    }

    // Try to extract snippets from b_lineclamp paragraphs
    const snippetRegex = /<p class="[^"]*b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
    let si = 0;
    let sm;
    while ((sm = snippetRegex.exec(html)) !== null && si < results.length) {
      const text = sm[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#0183;&#32;/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .trim();
      if (text.length > 20 && results[si]) {
        results[si].snippet = text;
        si++;
      }
    }

    return results;
  } catch (err: any) {
    console.warn(`[searchEngine] Bing HTML search failed: ${err.message}`);
    return [];
  }
}

// ── Tier 4: SearXNG (Free Unlimited — often rate-limited from cloud IPs) ────

async function searxngJsonSearch(query: string, instanceUrl: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({ q: query, format: "json", categories: "general" });
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "day", past_day: "day", past_week: "week", past_month: "month", past_year: "year",
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
      signal: AbortSignal.timeout(6000),
    });

    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.results || []).slice(0, 15).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.url || "",
      snippet: r.content || "",
      source: "searxng" as const,
      publishedDate: r.publishedDate || undefined,
      score: r.score ? Math.round(r.score * 100) : 75 - i * 3,
    })).filter((r: SearchResult) => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] SearXNG JSON failed: ${err.message}`);
    return [];
  }
}

async function searxngHtmlSearch(query: string, instanceUrl: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    let url = `${instanceUrl.replace(/\/$/, "")}/search?q=${encodeURIComponent(query)}`;
    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "day", past_day: "day", past_week: "week", past_month: "month", past_year: "year",
      };
      const tr = rangeMap[dateRange];
      if (tr) url += `&time_range=${tr}`;
    }

    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) return [];
    const html = await resp.text();

    const results: SearchResult[] = [];
    const articleRegex = /<article[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/article>/g;
    let match;
    while ((match = articleRegex.exec(html)) !== null && results.length < 15) {
      const block = match[0];
      const urlMatch = block.match(/href="(https?:\/\/[^"]+)"/);
      const titleMatch = block.match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/);
      const snippetMatch = block.match(/class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\//);
      
      if (urlMatch && titleMatch) {
        const title = titleMatch[1].replace(/<[^>]+>/g, "").trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        if (title && urlMatch[1] && !isAdUrl(urlMatch[1])) {
          results.push({
            title,
            url: urlMatch[1],
            snippet,
            source: "searxng" as const,
            score: 75 - results.length * 4,
          });
        }
      }
    }

    return results;
  } catch (err: any) {
    console.warn(`[searchEngine] SearXNG HTML parse failed: ${err.message}`);
    return [];
  }
}

/** Pool of known public SearXNG instances */
const SEARXNG_INSTANCES = [
  "https://search.bus-hit.me",
  "https://search.im-in.space",
  "https://search.indst.eu",
  "https://search.hbubli.cc",
  "https://ooglester.com",
  "https://search.einfachzocken.eu",
  "https://nyc1.sx.ggtyler.dev",
  "https://search.canine.tools",
  "https://priv.au",
];

async function searxngMultiInstance(query: string, dateRange?: string, customUrl?: string): Promise<SearchResult[]> {
  // If user configured a custom instance, try it first (self-hosted = reliable)
  if (customUrl) {
    const jsonResults = await searxngJsonSearch(query, customUrl, dateRange);
    if (jsonResults.length > 0) return jsonResults;
    const htmlResults = await searxngHtmlSearch(query, customUrl, dateRange);
    if (htmlResults.length > 0) return htmlResults;
  }

  // Try public instances (shuffle for load distribution, try up to 3)
  const shuffled = [...SEARXNG_INSTANCES].sort(() => Math.random() - 0.5);
  for (const instance of shuffled.slice(0, 3)) {
    const jsonResults = await searxngJsonSearch(query, instance, dateRange);
    if (jsonResults.length > 0) return jsonResults;
    const htmlResults = await searxngHtmlSearch(query, instance, dateRange);
    if (htmlResults.length > 0) return htmlResults;
  }

  return [];
}

// ── Tier U: Google Custom Search (User Upgrade — 100 free/day) ──────────────

async function googleCseSearch(query: string, cseId: string, apiKey: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      cx: cseId,
      key: apiKey,
      num: "10",
    });

    if (dateRange && dateRange !== "all") {
      const rangeMap: Record<string, string> = {
        past_hour: "d1", past_day: "d1", past_week: "w1", past_month: "m1", past_year: "y1",
      };
      const dr = rangeMap[dateRange];
      if (dr) params.set("dateRestrict", dr);
    }

    const resp = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      console.warn(`[searchEngine] Google CSE returned ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    return (data.items || []).slice(0, 10).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || "",
      source: "google_cse" as const,
      publishedDate: r.pagemap?.metatags?.[0]?.["article:published_time"] || undefined,
      score: 96 - i * 3, // Google CSE returns actual Google results
    })).filter((r: SearchResult) => r.url && r.title);
  } catch (err: any) {
    console.warn(`[searchEngine] Google CSE failed: ${err.message}`);
    return [];
  }
}

// ── Tier 5: Supplementary Sources (Reference Only — always available) ────────

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
      score: 60 - i * 5,
    }));
  } catch {
    return [];
  }
}

async function hackerNewsSearch(query: string, dateRange?: string): Promise<SearchResult[]> {
  try {
    let url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`;
    
    if (dateRange && dateRange !== "all") {
      const now = Math.floor(Date.now() / 1000);
      const rangeMap: Record<string, number> = {
        past_hour: 3600, past_day: 86400, past_week: 604800, past_month: 2592000, past_year: 31536000,
      };
      const seconds = rangeMap[dateRange];
      if (seconds) url += `&numericFilters=created_at_i>${now - seconds}`;
    }

    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.hits || []).slice(0, 5).map((hit: any, i: number) => ({
      title: hit.title || "",
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      snippet: `${hit.points || 0} points, ${hit.num_comments || 0} comments`,
      source: "hackernews" as const,
      score: 55 - i * 5,
    }));
  } catch {
    return [];
  }
}

// ── URL Filtering ─────────────────────────────────────────────────────────

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

// ── Result Deduplication & Ranking ────────────────────────────────────────

function deduplicateResults(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  
  for (const r of results) {
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

// ── Main Search Function (Tiered Quality-First Cascade) ───────────────────

/**
 * Execute a tiered web search that degrades gracefully from highest quality.
 * 
 * Resolution order (stops at first tier that returns results):
 *   1. Serper.dev (if key) — actual Google results, highest quality
 *   2. Brave Search (if key) — independent index, premium quality
 *   3. Tavily (if key) — AI-optimized, premium quality
 *   4. Google CSE (if configured) — actual Google, limited free quota
 *   5. DuckDuckGo HTML — free, may get CAPTCHA from cloud IPs
 *   6. SearXNG (public instances) — free, often rate-limited
 *   7. Wikipedia + HN — always available, reference only
 * 
 * Supplementary sources (Wikipedia, HN) always run for breadth.
 */
export async function executeSearch(options: SearchOptions): Promise<SearchResponse> {
  const startTime = Date.now();
  const { query, numResults = 10, dateRange, searxngUrl, braveApiKey, serperApiKey, tavilyApiKey, googleCseId, googleCseKey } = options;
  
  let primaryResults: SearchResult[] = [];
  const supplementaryResults: SearchResult[] = [];
  const enginesUsed: string[] = [];
  const warnings: string[] = [];
  let activeTier: "premium" | "high" | "standard" | "degraded" = "degraded";
  let primaryEngine = "";

  // ── Premium Tier: Try API-key-based services first (most reliable from servers) ──

  // Tier 0: Serper.dev (actual Google results)
  if (!primaryResults.length && serperApiKey) {
    console.log(`[searchEngine] Trying Tier 0: Serper.dev (Google results)...`);
    const results = await serperSearch(query, serperApiKey, dateRange);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("serper");
      activeTier = "premium";
      primaryEngine = "Serper (Google)";
      console.log(`[searchEngine] ✓ Serper: ${results.length} results`);
    } else {
      warnings.push("Serper.dev: no results (credits may be exhausted)");
    }
  }

  // Tier 1: Brave Search
  if (!primaryResults.length && braveApiKey) {
    console.log(`[searchEngine] Trying Tier 1: Brave Search...`);
    const results = await braveSearch(query, braveApiKey, dateRange);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("brave");
      activeTier = "premium";
      primaryEngine = "Brave Search";
      console.log(`[searchEngine] ✓ Brave: ${results.length} results`);
    } else {
      warnings.push("Brave Search: no results (credits may be exhausted)");
    }
  }

  // Tier 2: Tavily
  if (!primaryResults.length && tavilyApiKey) {
    console.log(`[searchEngine] Trying Tier 2: Tavily...`);
    const results = await tavilySearch(query, tavilyApiKey, dateRange);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("tavily");
      activeTier = "premium";
      primaryEngine = "Tavily";
      console.log(`[searchEngine] ✓ Tavily: ${results.length} results`);
    } else {
      warnings.push("Tavily: no results (credits may be exhausted)");
    }
  }

  // Tier U: Google CSE (user upgrade — 100 free/day)
  if (!primaryResults.length && googleCseId && googleCseKey) {
    console.log(`[searchEngine] Trying Tier U: Google Custom Search...`);
    const results = await googleCseSearch(query, googleCseId, googleCseKey, dateRange);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("google_cse");
      activeTier = "premium";
      primaryEngine = "Google CSE";
      console.log(`[searchEngine] ✓ Google CSE: ${results.length} results`);
    }
  }

  // ── Free Tier: Try scraping-based services ──

  // Tier 3: DuckDuckGo HTML (often blocked from cloud IPs)
  if (!primaryResults.length) {
    console.log(`[searchEngine] Trying Tier 3: DuckDuckGo HTML...`);
    const results = await ddgHtmlSearch(query, dateRange);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("duckduckgo");
      activeTier = "standard";
      primaryEngine = "DuckDuckGo";
      console.log(`[searchEngine] ✓ DDG: ${results.length} results`);
    } else {
      warnings.push("DuckDuckGo: blocked (CAPTCHA)");
    }
  }

  // Tier 3.5: Bing HTML Scraping (works from cloud IPs with EN locale)
  if (!primaryResults.length) {
    console.log(`[searchEngine] Trying Tier 3.5: Bing HTML...`);
    const results = await bingHtmlSearch(query, dateRange);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("bing");
      activeTier = "standard";
      primaryEngine = "Bing";
      console.log(`[searchEngine] ✓ Bing: ${results.length} results`);
    } else {
      warnings.push("Bing: no results or blocked");
    }
  }

  // Tier 4: SearXNG (often rate-limited from cloud IPs)
  if (!primaryResults.length) {
    console.log(`[searchEngine] Trying Tier 4: SearXNG...`);
    const results = await searxngMultiInstance(query, dateRange, searxngUrl);
    if (results.length > 0) {
      primaryResults = results;
      enginesUsed.push("searxng");
      activeTier = "standard";
      primaryEngine = "SearXNG";
      console.log(`[searchEngine] ✓ SearXNG: ${results.length} results`);
    } else {
      warnings.push("SearXNG: all instances rate-limited");
    }
  }

  // ── Supplementary: Always run for breadth ──

  const wikiResults = await wikipediaSearch(query);
  if (wikiResults.length > 0) {
    supplementaryResults.push(...wikiResults);
    enginesUsed.push("wikipedia");
  }

  const techKeywords = ["ai", "software", "startup", "tech", "programming", "code", "api", "cloud", "machine learning", "llm", "open source", "developer", "framework"];
  const isTechQuery = techKeywords.some(k => query.toLowerCase().includes(k));
  if (isTechQuery) {
    const hnResults = await hackerNewsSearch(query, dateRange);
    if (hnResults.length > 0) {
      supplementaryResults.push(...hnResults);
      enginesUsed.push("hackernews");
    }
  }

  // ── Combine, deduplicate, rank ──
  const allResults = [...primaryResults, ...supplementaryResults];
  const ranked = deduplicateResults(allResults).slice(0, numResults);

  // If no primary results at all, mark as degraded
  if (!primaryResults.length && supplementaryResults.length > 0) {
    activeTier = "degraded";
    primaryEngine = "Wikipedia/HN (reference only)";
  }

  // Upgrade guidance
  if (activeTier !== "premium") {
    const missingKeys: string[] = [];
    if (!serperApiKey) missingKeys.push("Serper.dev (2500 free, Google results)");
    if (!braveApiKey) missingKeys.push("Brave ($5 free credits/mo)");
    if (!tavilyApiKey) missingKeys.push("Tavily (1000 free/mo)");
    if (missingKeys.length > 0) {
      warnings.push(`💡 Upgrade: Add a free API key in Settings → Development → Search Config. Options: ${missingKeys.join(", ")}`);
    }
  }

  if (ranked.length === 0) {
    warnings.push("All search tiers returned no results. Try different keywords or add a search API key.");
  }

  return {
    results: ranked,
    totalResults: allResults.length,
    enginesUsed,
    warnings,
    query,
    durationMs: Date.now() - startTime,
    activeTier,
    primaryEngine,
  };
}

/**
 * Format search results into a Manus-compatible output string.
 * Includes tier quality indicator and upgrade guidance.
 */
export function formatSearchResults(response: SearchResponse): string {
  const tierLabel = {
    premium: "🟢 Premium",
    high: "🔵 High",
    standard: "🟡 Standard",
    degraded: "🔴 Degraded (reference only)",
  };

  let output = `## Web Search Results for: "${response.query}"\n\n`;
  output += `*${response.results.length} results from ${response.enginesUsed.join(", ")} (${response.durationMs}ms) — Quality: ${tierLabel[response.activeTier || "standard"]}`;
  if (response.primaryEngine) output += ` via ${response.primaryEngine}`;
  output += `*\n\n`;

  if (response.results.length === 0) {
    output += `No results found. Try:\n`;
    output += `- Simplifying the query\n`;
    output += `- Using different keywords\n`;
    output += `- Adding a free search API key (Serper, Brave, or Tavily) in Settings\n`;
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

  // Agent guidance
  output += `---\n\n`;
  output += `**Next steps:** Use \`read_webpage\` to visit the most relevant URLs above for detailed content. `;
  output += `Search results snippets are brief — always read the full page for comprehensive information.\n`;

  if (response.warnings.length > 0) {
    output += `\n*${response.warnings.join("; ")}*\n`;
  }

  return output;
}
