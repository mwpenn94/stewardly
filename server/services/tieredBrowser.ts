/**
 * Tiered Browser / Content Extraction Service
 * 
 * Quality-first degradation:
 *   Tier 0 (Built-in): Cloud Browser (full Chromium, click/scroll/input)
 *   Tier 1 (Free Premium): Jina Reader API (free, handles JS-rendered pages)
 *   Tier 2 (Free High): HTTP fetch + Readability (fast, no JS rendering)
 *   Tier 3 (Degraded): Basic HTTP fetch (raw HTML stripping)
 *   Tier U (Upgrades): Browserbase, Apify, ScrapingBee
 * 
 * This service handles content extraction from URLs.
 * For full browser automation (clicking, scrolling), the cloud_browser tool is used directly.
 */

export interface BrowseRequest {
  url: string;
  /** Maximum content length to return */
  maxLength?: number;
  /** Whether to attempt JS rendering */
  renderJs?: boolean;
  /** Specific selector to extract */
  selector?: string;
}

export interface BrowseResult {
  content: string;
  title: string;
  url: string;
  tier: "cloud_browser" | "jina" | "readability" | "basic_http";
  quality: "premium" | "high" | "standard" | "degraded";
  contentLength: number;
  warning?: string;
}

/**
 * Extract content from a URL using the tiered cascade.
 */
export async function browseUrlTiered(request: BrowseRequest): Promise<BrowseResult> {
  const { url, maxLength = 20000, renderJs = false } = request;

  // ── Tier 1: Jina Reader API (Free, Handles JS, Premium Quality) ──
  // Jina is free and handles JS-rendered pages, so it's the best free option
  try {
    const result = await jinaReaderFetch(url, maxLength);
    if (result && result.content.length > 100) {
      return {
        ...result,
        tier: "jina",
        quality: "high",
      };
    }
  } catch (err: any) {
    console.warn(`[tieredBrowser] Jina Reader failed: ${err.message}`);
  }

  // ── Tier 2: HTTP Fetch + Readability (Free, Fast, No JS) ──
  try {
    const result = await readabilityFetch(url, maxLength);
    if (result && result.content.length > 100) {
      return {
        ...result,
        tier: "readability",
        quality: "standard",
        warning: "Content extracted without JS rendering. Some dynamic content may be missing.",
      };
    }
  } catch (err: any) {
    console.warn(`[tieredBrowser] Readability fetch failed: ${err.message}`);
  }

  // ── Tier 3: Basic HTTP (Degraded) ──
  try {
    const result = await basicHttpFetch(url, maxLength);
    return {
      ...result,
      tier: "basic_http",
      quality: "degraded",
      warning: "Basic content extraction. JS-rendered content and complex layouts may be incomplete.",
    };
  } catch (err: any) {
    return {
      content: `Failed to fetch content from ${url}: ${err.message}`,
      title: "Fetch Error",
      url,
      tier: "basic_http",
      quality: "degraded",
      contentLength: 0,
      warning: "All content extraction methods failed.",
    };
  }
}

/**
 * Jina Reader API — Free, unlimited, handles JS-rendered pages.
 * Simply prepend r.jina.ai/ to any URL.
 * Returns clean markdown content.
 */
async function jinaReaderFetch(url: string, maxLength: number): Promise<Omit<BrowseResult, "tier" | "quality"> | null> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  
  const resp = await fetch(jinaUrl, {
    headers: {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
      "X-No-Cache": "true",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) return null;
  
  const text = await resp.text();
  if (!text || text.length < 50) return null;

  // Extract title from first line (Jina returns title as first heading)
  const titleMatch = text.match(/^#\s+(.+)/m);
  const title = titleMatch?.[1] || new URL(url).hostname;
  
  const content = text.slice(0, maxLength);
  
  return {
    content,
    title,
    url,
    contentLength: content.length,
  };
}

/**
 * HTTP Fetch + Readability — Fast, no JS rendering.
 * Uses basic HTML parsing to extract main content.
 */
async function readabilityFetch(url: string, maxLength: number): Promise<Omit<BrowseResult, "tier" | "quality"> | null> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ManusNext/1.0; +https://manus.im)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });

  if (!resp.ok) return null;
  
  const html = await resp.text();
  if (!html || html.length < 100) return null;

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || new URL(url).hostname;

  // Extract main content using simple heuristics
  const content = extractMainContent(html, maxLength);
  
  return {
    content,
    title,
    url,
    contentLength: content.length,
  };
}

/**
 * Basic HTTP fetch with minimal parsing.
 */
async function basicHttpFetch(url: string, maxLength: number): Promise<Omit<BrowseResult, "tier" | "quality">> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ManusNext/1.0)",
      Accept: "text/html,text/plain,application/json",
    },
    signal: AbortSignal.timeout(10000),
    redirect: "follow",
  });

  const contentType = resp.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    const json = await resp.json();
    const content = JSON.stringify(json, null, 2).slice(0, maxLength);
    return { content, title: new URL(url).hostname, url, contentLength: content.length };
  }

  const html = await resp.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || new URL(url).hostname;
  
  // Strip HTML tags and normalize whitespace
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  return { content: text, title, url, contentLength: text.length };
}

/**
 * Extract main content from HTML using heuristics.
 * Prioritizes <article>, <main>, then largest text block.
 */
function extractMainContent(html: string, maxLength: number): string {
  // Remove scripts and styles
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");

  // Try to find main content containers
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  
  const contentHtml = articleMatch?.[1] || mainMatch?.[1] || cleaned;

  // Convert to text
  const text = contentHtml
    .replace(/<h[1-6][^>]*>/gi, "\n\n## ")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return text.slice(0, maxLength);
}
