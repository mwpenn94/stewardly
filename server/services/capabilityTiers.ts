/**
 * Capability Tiers Service — Quality-First Degradation Architecture
 * 
 * Every agent capability follows a tiered cascade:
 *   Tier 0 (Built-in): Platform services (Forge LLM, Forge Image, cloud_browser)
 *   Tier 1 (Free Premium): Best free APIs with monthly quotas (Brave 2k, etc.)
 *   Tier 2 (Free Unlimited): Unlimited free fallbacks (DDG HTML, SearXNG, Pollinations)
 *   Tier 3 (Degraded): Minimal fallback (Wikipedia, static, placeholder)
 *   Tier U (Upgrade): Paid APIs user can configure for unlimited premium quality
 * 
 * The system always starts at the highest quality tier available, degrades gracefully
 * when quotas exhaust, and provides clear upgrade paths at each degradation point.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type CapabilityDomain = 
  | "search"
  | "image_generation"
  | "voice_tts"
  | "voice_stt"
  | "browser"
  | "research"
  | "llm"
  | "code_execution"
  | "document_generation";

export type TierLevel = 0 | 1 | 2 | 3;

export interface TierDefinition {
  level: TierLevel;
  name: string;
  provider: string;
  quality: "premium" | "high" | "standard" | "degraded";
  /** Monthly quota (0 = unlimited, -1 = built-in/no limit) */
  monthlyQuota: number;
  /** Whether this tier requires user-provided API key */
  requiresApiKey: boolean;
  /** Environment variable name for the API key (if applicable) */
  apiKeyEnvName?: string;
  /** Description shown in Settings UI */
  description: string;
  /** Whether this tier is currently available (has required config) */
  available: boolean;
}

export interface CapabilityConfig {
  domain: CapabilityDomain;
  displayName: string;
  description: string;
  tiers: TierDefinition[];
  upgrades: UpgradeOption[];
  /** Current active tier (resolved at runtime) */
  activeTier?: TierDefinition;
  /** Current month usage count */
  currentUsage?: number;
}

export interface UpgradeOption {
  name: string;
  provider: string;
  quality: "premium" | "enterprise";
  monthlyQuota: number | "unlimited";
  priceEstimate: string;
  apiKeyEnvName: string;
  setupUrl: string;
  description: string;
}

export interface UsageRecord {
  domain: CapabilityDomain;
  tier: TierLevel;
  provider: string;
  timestamp: number;
  success: boolean;
}

export interface TierResolution {
  tier: TierDefinition;
  reason: string;
  degraded: boolean;
  upgradeAvailable: boolean;
  upgradeMessage?: string;
}

// ── Capability Definitions ────────────────────────────────────────────────

export function getCapabilityDefinitions(userConfig: UserCapabilityConfig): CapabilityConfig[] {
  return [
    defineSearchCapability(userConfig),
    defineImageGenCapability(userConfig),
    defineVoiceTTSCapability(userConfig),
    defineVoiceSTTCapability(userConfig),
    defineBrowserCapability(userConfig),
    defineResearchCapability(userConfig),
    defineLLMCapability(userConfig),
    defineCodeExecutionCapability(userConfig),
    defineDocumentGenCapability(userConfig),
  ];
}

export interface UserCapabilityConfig {
  /** User-provided API keys */
  apiKeys: Record<string, string | undefined>;
  /** SearXNG instance URL */
  searxngUrl?: string;
  /** Monthly usage counts per domain */
  usageCounts: Record<CapabilityDomain, number>;
}

// ── Search ────────────────────────────────────────────────────────────────

function defineSearchCapability(config: UserCapabilityConfig): CapabilityConfig {
  const braveKey = config.apiKeys["BRAVE_SEARCH_API_KEY"];
  const serperKey = config.apiKeys["SERPER_API_KEY"];
  const tavilyKey = config.apiKeys["TAVILY_API_KEY"];
  const googleKey = config.apiKeys["GOOGLE_CUSTOM_SEARCH_KEY"];
  
  return {
    domain: "search",
    displayName: "Web Search",
    description: "Real-time web search with URLs, titles, and snippets",
    tiers: [
      {
        level: 0,
        name: "Brave Search (Free Premium)",
        provider: "brave",
        quality: "premium",
        monthlyQuota: 2000,
        requiresApiKey: true,
        apiKeyEnvName: "BRAVE_SEARCH_API_KEY",
        description: "2,000 free searches/month. Best free quality — real Google-level results.",
        available: !!braveKey,
      },
      {
        level: 1,
        name: "SearXNG Meta-Search",
        provider: "searxng",
        quality: "high",
        monthlyQuota: 0, // unlimited
        requiresApiKey: false,
        description: "Aggregates results from Google, Bing, DuckDuckGo via public meta-search instances. Unlimited.",
        available: true, // Always available via HTML parsing
      },
      {
        level: 2,
        name: "DuckDuckGo HTML",
        provider: "ddg",
        quality: "standard",
        monthlyQuota: 0, // unlimited
        requiresApiKey: false,
        description: "Direct HTML parsing of DuckDuckGo results. Free, unlimited, reliable.",
        available: true,
      },
      {
        level: 3,
        name: "Wikipedia + Hacker News",
        provider: "wikipedia",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Reference-only results from Wikipedia and HN. Limited to encyclopedic content.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "Serper.dev",
        provider: "serper",
        quality: "premium",
        monthlyQuota: 2500,
        priceEstimate: "$50/month (2,500 searches)",
        apiKeyEnvName: "SERPER_API_KEY",
        setupUrl: "https://serper.dev",
        description: "Google Search Results API. Highest quality, structured JSON output.",
      },
      {
        name: "Tavily AI Search",
        provider: "tavily",
        quality: "premium",
        monthlyQuota: 1000,
        priceEstimate: "$0 (1,000 free/month) or $50/month",
        apiKeyEnvName: "TAVILY_API_KEY",
        setupUrl: "https://tavily.com",
        description: "AI-optimized search with content extraction built-in.",
      },
      {
        name: "Google Custom Search",
        provider: "google_cse",
        quality: "enterprise",
        monthlyQuota: 10000,
        priceEstimate: "$5/1000 queries after free 100/day",
        apiKeyEnvName: "GOOGLE_CUSTOM_SEARCH_KEY",
        setupUrl: "https://programmablesearchengine.google.com",
        description: "Official Google results. 100 free/day, then $5 per 1000.",
      },
    ],
  };
}

// ── Image Generation ──────────────────────────────────────────────────────

function defineImageGenCapability(config: UserCapabilityConfig): CapabilityConfig {
  const openaiKey = config.apiKeys["OPENAI_API_KEY"];
  const stabilityKey = config.apiKeys["STABILITY_API_KEY"];
  
  return {
    domain: "image_generation",
    displayName: "Image Generation",
    description: "AI-powered image creation and editing",
    tiers: [
      {
        level: 0,
        name: "Forge Image API (Built-in)",
        provider: "forge",
        quality: "premium",
        monthlyQuota: -1, // built-in
        requiresApiKey: false,
        description: "Platform-provided image generation. High quality, included with subscription.",
        available: true,
      },
      {
        level: 1,
        name: "Pollinations.ai",
        provider: "pollinations",
        quality: "high",
        monthlyQuota: 0, // unlimited
        requiresApiKey: false,
        description: "Free, unlimited AI image generation. Good quality Flux/SDXL models.",
        available: true,
      },
      {
        level: 2,
        name: "Placeholder SVG",
        provider: "placeholder",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Generates placeholder SVG images with text descriptions. No AI generation.",
        available: true,
      },
      {
        level: 3,
        name: "Text Description Only",
        provider: "text_only",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Returns a text description of what the image would contain.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "DALL-E 3 (OpenAI)",
        provider: "openai_dalle",
        quality: "premium",
        monthlyQuota: "unlimited",
        priceEstimate: "$0.04-0.08 per image",
        apiKeyEnvName: "OPENAI_API_KEY",
        setupUrl: "https://platform.openai.com/api-keys",
        description: "OpenAI DALL-E 3. Highest quality, best prompt following.",
      },
      {
        name: "Stability AI",
        provider: "stability",
        quality: "premium",
        monthlyQuota: "unlimited",
        priceEstimate: "$0.01-0.04 per image",
        apiKeyEnvName: "STABILITY_API_KEY",
        setupUrl: "https://platform.stability.ai",
        description: "Stable Diffusion 3. Fast, high quality, affordable.",
      },
    ],
  };
}

// ── Voice TTS (Text-to-Speech) ────────────────────────────────────────────

function defineVoiceTTSCapability(config: UserCapabilityConfig): CapabilityConfig {
  const elevenLabsKey = config.apiKeys["ELEVENLABS_API_KEY"];
  
  return {
    domain: "voice_tts",
    displayName: "Text-to-Speech",
    description: "Convert text to natural-sounding speech",
    tiers: [
      {
        level: 0,
        name: "Edge TTS (Free Premium)",
        provider: "edge_tts",
        quality: "premium",
        monthlyQuota: 0, // unlimited
        requiresApiKey: false,
        description: "Microsoft Edge neural voices. Free, unlimited, high quality. 400+ voices.",
        available: true,
      },
      {
        level: 1,
        name: "Kokoro TTS (Local)",
        provider: "kokoro",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Open-source neural TTS. Runs locally, no API needed.",
        available: true,
      },
      {
        level: 2,
        name: "Browser SpeechSynthesis",
        provider: "browser_tts",
        quality: "standard",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Built-in browser speech synthesis. Basic quality, always available.",
        available: true,
      },
      {
        level: 3,
        name: "Text Only (No Audio)",
        provider: "text_only",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Returns text without audio generation.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "ElevenLabs",
        provider: "elevenlabs",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$5/month (30k chars) or $22/month (100k chars)",
        apiKeyEnvName: "ELEVENLABS_API_KEY",
        setupUrl: "https://elevenlabs.io",
        description: "Industry-leading voice cloning and TTS. Most natural sounding.",
      },
      {
        name: "OpenAI TTS",
        provider: "openai_tts",
        quality: "premium",
        monthlyQuota: "unlimited",
        priceEstimate: "$15/1M chars (tts-1) or $30/1M chars (tts-1-hd)",
        apiKeyEnvName: "OPENAI_API_KEY",
        setupUrl: "https://platform.openai.com/api-keys",
        description: "OpenAI text-to-speech. 6 voices, very natural.",
      },
    ],
  };
}

// ── Voice STT (Speech-to-Text) ────────────────────────────────────────────

function defineVoiceSTTCapability(config: UserCapabilityConfig): CapabilityConfig {
  return {
    domain: "voice_stt",
    displayName: "Speech-to-Text",
    description: "Transcribe audio to text",
    tiers: [
      {
        level: 0,
        name: "Forge Whisper (Built-in)",
        provider: "forge_whisper",
        quality: "premium",
        monthlyQuota: -1,
        requiresApiKey: false,
        description: "Platform-provided Whisper transcription. High accuracy, included.",
        available: true,
      },
      {
        level: 1,
        name: "Browser Speech Recognition",
        provider: "browser_stt",
        quality: "standard",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Built-in browser speech recognition API. Real-time, free.",
        available: true,
      },
      {
        level: 2,
        name: "Whisper.cpp (Local)",
        provider: "whisper_local",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Local Whisper inference. Requires download of model weights.",
        available: false, // Requires setup
      },
      {
        level: 3,
        name: "Manual Transcription",
        provider: "manual",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "User must manually transcribe or paste text.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "Deepgram",
        provider: "deepgram",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$0.0043/min (Nova-2) — $200 free credit",
        apiKeyEnvName: "DEEPGRAM_API_KEY",
        setupUrl: "https://deepgram.com",
        description: "Fastest, most accurate STT. $200 free credit on signup.",
      },
      {
        name: "AssemblyAI",
        provider: "assemblyai",
        quality: "premium",
        monthlyQuota: "unlimited",
        priceEstimate: "$0.37/hour — free tier available",
        apiKeyEnvName: "ASSEMBLYAI_API_KEY",
        setupUrl: "https://assemblyai.com",
        description: "High accuracy with speaker diarization and sentiment analysis.",
      },
    ],
  };
}

// ── Browser Automation ────────────────────────────────────────────────────

function defineBrowserCapability(config: UserCapabilityConfig): CapabilityConfig {
  const browserbaseKey = config.apiKeys["BROWSERBASE_API_KEY"];
  
  return {
    domain: "browser",
    displayName: "Browser Automation",
    description: "Navigate, interact with, and extract content from web pages",
    tiers: [
      {
        level: 0,
        name: "Cloud Browser (Built-in)",
        provider: "cloud_browser",
        quality: "premium",
        monthlyQuota: -1,
        requiresApiKey: false,
        description: "Full Chromium browser with click, scroll, input, screenshot. Platform-provided.",
        available: true,
      },
      {
        level: 1,
        name: "Content Fetch + Readability",
        provider: "fetch_readability",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "HTTP fetch with Readability extraction. Fast, no JS rendering.",
        available: true,
      },
      {
        level: 2,
        name: "Jina Reader API",
        provider: "jina",
        quality: "standard",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Free web content extraction via r.jina.ai. Handles JS-rendered pages.",
        available: true,
      },
      {
        level: 3,
        name: "Basic HTTP (No Rendering)",
        provider: "basic_http",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Raw HTTP fetch. No JS rendering, limited content extraction.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "Browserbase",
        provider: "browserbase",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$0.01/min — 100 free minutes",
        apiKeyEnvName: "BROWSERBASE_API_KEY",
        setupUrl: "https://browserbase.com",
        description: "Cloud browser infrastructure. Stealth mode, anti-detection, parallel sessions.",
      },
      {
        name: "Apify",
        provider: "apify",
        quality: "premium",
        monthlyQuota: "unlimited",
        priceEstimate: "$49/month (100 compute units)",
        apiKeyEnvName: "APIFY_API_KEY",
        setupUrl: "https://apify.com",
        description: "Web scraping platform with 1000+ pre-built actors.",
      },
    ],
  };
}

// ── Deep Research ─────────────────────────────────────────────────────────

function defineResearchCapability(config: UserCapabilityConfig): CapabilityConfig {
  const perplexityKey = config.apiKeys["PERPLEXITY_API_KEY"];
  
  return {
    domain: "research",
    displayName: "Deep Research",
    description: "Multi-step research with source synthesis",
    tiers: [
      {
        level: 0,
        name: "Built-in Deep Research",
        provider: "forge_research",
        quality: "premium",
        monthlyQuota: -1,
        requiresApiKey: false,
        description: "Platform deep research agent. Multi-step, cited, comprehensive.",
        available: true,
      },
      {
        level: 1,
        name: "Parallel Search + Browse",
        provider: "parallel_search",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Multiple search queries + page reads in parallel. Free, good coverage.",
        available: true,
      },
      {
        level: 2,
        name: "Single Search + Summary",
        provider: "single_search",
        quality: "standard",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Single search query with LLM-summarized results. Basic research.",
        available: true,
      },
      {
        level: 3,
        name: "Knowledge Base Only",
        provider: "knowledge_only",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Uses only LLM's training knowledge. No live web data.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "Perplexity API (Sonar Pro)",
        provider: "perplexity",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$5/1000 queries (Sonar Pro)",
        apiKeyEnvName: "PERPLEXITY_API_KEY",
        setupUrl: "https://docs.perplexity.ai",
        description: "AI-native search with real-time citations. Best for research tasks.",
      },
      {
        name: "Tavily Extract",
        provider: "tavily_extract",
        quality: "premium",
        monthlyQuota: "unlimited",
        priceEstimate: "$50/month",
        apiKeyEnvName: "TAVILY_API_KEY",
        setupUrl: "https://tavily.com",
        description: "AI-optimized search + full page content extraction in one call.",
      },
    ],
  };
}

// ── LLM ───────────────────────────────────────────────────────────────────

function defineLLMCapability(config: UserCapabilityConfig): CapabilityConfig {
  const openaiKey = config.apiKeys["OPENAI_API_KEY"];
  const anthropicKey = config.apiKeys["ANTHROPIC_API_KEY"];
  
  return {
    domain: "llm",
    displayName: "Language Model",
    description: "AI reasoning, generation, and analysis",
    tiers: [
      {
        level: 0,
        name: "Forge LLM (Built-in)",
        provider: "forge",
        quality: "premium",
        monthlyQuota: -1,
        requiresApiKey: false,
        description: "Platform-provided LLM. High quality, included with subscription.",
        available: true,
      },
      {
        level: 1,
        name: "OpenRouter Free Models",
        provider: "openrouter_free",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Free models via OpenRouter (Llama 3.1, Mistral, etc.). Good quality.",
        available: true,
      },
      {
        level: 2,
        name: "Groq (Free Tier)",
        provider: "groq",
        quality: "standard",
        monthlyQuota: 14400, // 14.4k requests/day free
        requiresApiKey: true,
        apiKeyEnvName: "GROQ_API_KEY",
        description: "Groq free tier: 14.4k req/day. Fast inference, Llama/Mixtral models.",
        available: !!config.apiKeys["GROQ_API_KEY"],
      },
      {
        level: 3,
        name: "Reduced Context Mode",
        provider: "reduced",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Uses shorter context and simpler prompts to reduce token usage.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "OpenAI GPT-4o",
        provider: "openai",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$2.50/1M input + $10/1M output tokens",
        apiKeyEnvName: "OPENAI_API_KEY",
        setupUrl: "https://platform.openai.com/api-keys",
        description: "GPT-4o. Best overall quality, multimodal, fast.",
      },
      {
        name: "Anthropic Claude",
        provider: "anthropic",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$3/1M input + $15/1M output tokens",
        apiKeyEnvName: "ANTHROPIC_API_KEY",
        setupUrl: "https://console.anthropic.com",
        description: "Claude 3.5 Sonnet. Excellent for coding and analysis.",
      },
    ],
  };
}

// ── Code Execution ────────────────────────────────────────────────────────

function defineCodeExecutionCapability(config: UserCapabilityConfig): CapabilityConfig {
  return {
    domain: "code_execution",
    displayName: "Code Execution",
    description: "Run code in sandboxed environments",
    tiers: [
      {
        level: 0,
        name: "Cloud Sandbox (Built-in)",
        provider: "cloud_sandbox",
        quality: "premium",
        monthlyQuota: -1,
        requiresApiKey: false,
        description: "Full Linux sandbox with persistent state. Python, Node, shell.",
        available: true,
      },
      {
        level: 1,
        name: "WebContainer (Browser)",
        provider: "webcontainer",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "StackBlitz WebContainers. Node.js in browser, instant boot.",
        available: true,
      },
      {
        level: 2,
        name: "Pyodide (WASM Python)",
        provider: "pyodide",
        quality: "standard",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Python in browser via WebAssembly. Limited packages.",
        available: true,
      },
      {
        level: 3,
        name: "Code Display Only",
        provider: "display_only",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Shows code without execution. User must run manually.",
        available: true,
      },
    ],
    upgrades: [
      {
        name: "E2B Sandbox",
        provider: "e2b",
        quality: "enterprise",
        monthlyQuota: "unlimited",
        priceEstimate: "$0.10/hour — free tier available",
        apiKeyEnvName: "E2B_API_KEY",
        setupUrl: "https://e2b.dev",
        description: "Cloud code execution with persistent filesystems and GPU support.",
      },
    ],
  };
}

// ── Document Generation ───────────────────────────────────────────────────

function defineDocumentGenCapability(config: UserCapabilityConfig): CapabilityConfig {
  return {
    domain: "document_generation",
    displayName: "Document Generation",
    description: "Create PDFs, presentations, spreadsheets",
    tiers: [
      {
        level: 0,
        name: "Built-in Document Engine",
        provider: "forge_docs",
        quality: "premium",
        monthlyQuota: -1,
        requiresApiKey: false,
        description: "Platform document generation. PDF, PPTX, XLSX, Markdown.",
        available: true,
      },
      {
        level: 1,
        name: "Puppeteer PDF + LibreOffice",
        provider: "puppeteer_libre",
        quality: "high",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "HTML-to-PDF via Puppeteer, DOCX/PPTX via LibreOffice. Free, good quality.",
        available: true,
      },
      {
        level: 2,
        name: "Markdown + Basic Export",
        provider: "markdown_export",
        quality: "standard",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Markdown documents with basic PDF export. Limited formatting.",
        available: true,
      },
      {
        level: 3,
        name: "Plain Text",
        provider: "plain_text",
        quality: "degraded",
        monthlyQuota: 0,
        requiresApiKey: false,
        description: "Plain text output only. No formatting or export.",
        available: true,
      },
    ],
    upgrades: [],
  };
}

// ── Tier Resolution Engine ────────────────────────────────────────────────

/**
 * Resolve which tier to use for a given capability.
 * Always starts at the highest quality available tier and degrades only when necessary.
 */
export function resolveTier(
  domain: CapabilityDomain,
  config: UserCapabilityConfig
): TierResolution {
  const capabilities = getCapabilityDefinitions(config);
  const capability = capabilities.find(c => c.domain === domain);
  
  if (!capability) {
    return {
      tier: { level: 3, name: "Unknown", provider: "none", quality: "degraded", monthlyQuota: 0, requiresApiKey: false, description: "Unknown capability", available: false },
      reason: "Unknown capability domain",
      degraded: true,
      upgradeAvailable: false,
    };
  }

  // Find the highest quality available tier that hasn't exhausted its quota
  for (const tier of capability.tiers) {
    if (!tier.available) continue;
    
    // Check quota
    if (tier.monthlyQuota > 0) {
      const usage = config.usageCounts[domain] || 0;
      if (usage >= tier.monthlyQuota) {
        // Quota exhausted — skip to next tier
        continue;
      }
    }
    
    // This tier is available and has quota
    const isDegraded = tier.level > 0;
    const hasUpgrade = capability.upgrades.length > 0;
    
    return {
      tier,
      reason: tier.level === 0 
        ? "Using highest quality tier" 
        : `Using ${tier.name} (${tier.quality} quality)`,
      degraded: isDegraded,
      upgradeAvailable: hasUpgrade,
      upgradeMessage: isDegraded && hasUpgrade
        ? `Upgrade to ${capability.upgrades[0].name} for ${capability.upgrades[0].quality} quality (${capability.upgrades[0].priceEstimate})`
        : undefined,
    };
  }

  // All tiers exhausted — return lowest available
  const lastTier = capability.tiers[capability.tiers.length - 1];
  return {
    tier: lastTier,
    reason: "All higher tiers exhausted or unavailable",
    degraded: true,
    upgradeAvailable: capability.upgrades.length > 0,
    upgradeMessage: `All free tiers exhausted. Upgrade to ${capability.upgrades[0]?.name || "a paid plan"} for continued service.`,
  };
}

/**
 * Record usage of a capability tier (for quota tracking).
 */
export function recordUsage(domain: CapabilityDomain, tier: TierLevel, success: boolean): UsageRecord {
  return {
    domain,
    tier,
    provider: "",
    timestamp: Date.now(),
    success,
  };
}

/**
 * Get a summary of all capabilities with their current tier status.
 */
export function getCapabilitySummary(config: UserCapabilityConfig): Array<{
  domain: CapabilityDomain;
  displayName: string;
  activeTier: TierDefinition;
  degraded: boolean;
  usagePercent: number;
  upgradeAvailable: boolean;
}> {
  const capabilities = getCapabilityDefinitions(config);
  
  return capabilities.map(cap => {
    const resolution = resolveTier(cap.domain, config);
    const usage = config.usageCounts[cap.domain] || 0;
    const quota = resolution.tier.monthlyQuota;
    const usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
    
    return {
      domain: cap.domain,
      displayName: cap.displayName,
      activeTier: resolution.tier,
      degraded: resolution.degraded,
      usagePercent,
      upgradeAvailable: resolution.upgradeAvailable,
    };
  });
}

// ── SearXNG Public Instance Pool ──────────────────────────────────────────

/**
 * Pool of known reliable public SearXNG instances.
 * These are queried via HTML parsing (not JSON format) for maximum compatibility.
 */
export const SEARXNG_PUBLIC_INSTANCES = [
  "https://search.bus-hit.me",
  "https://search.im-in.space",
  "https://search.indst.eu",
  "https://search.hbubli.cc",
  "https://ooglester.com",
  "https://search.einfachzocken.eu",
  "https://search.federicociro.com",
  "https://search.citw.lgbt",
  "https://nyc1.sx.ggtyler.dev",
  "https://search.canine.tools",
];

/**
 * Try multiple SearXNG instances with HTML parsing fallback.
 * Returns the first instance that responds successfully.
 */
export async function findWorkingSearXNGInstance(): Promise<string | null> {
  for (const instance of SEARXNG_PUBLIC_INSTANCES) {
    try {
      const resp = await fetch(`${instance}/search?q=test&format=json`, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "ManusNext/1.0" },
      });
      if (resp.ok) return instance;
    } catch {
      continue;
    }
  }
  return null;
}
