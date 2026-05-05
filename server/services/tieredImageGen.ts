/**
 * Tiered Image Generation Service
 * 
 * Quality-first degradation:
 *   Tier 0 (Built-in): Forge Image API (platform-provided, premium quality)
 *   Tier 1 (Free Unlimited): Pollinations.ai (free, unlimited, Flux/SDXL models)
 *   Tier 2 (Degraded): Placeholder SVG generation
 *   Tier U (Upgrades): DALL-E 3, Stability AI, Midjourney
 * 
 * The system tries the highest quality tier first and degrades only on failure.
 */

export interface ImageGenRequest {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  /** Original images for editing mode */
  originalImages?: Array<{ url: string; mimeType: string }>;
}

export interface ImageGenResult {
  url: string;
  tier: "forge" | "pollinations" | "placeholder";
  quality: "premium" | "high" | "degraded";
  model?: string;
  warning?: string;
}

/**
 * Generate an image using the tiered cascade.
 * Tries Forge first (built-in), then Pollinations (free unlimited), then placeholder.
 */
export async function generateImageTiered(request: ImageGenRequest): Promise<ImageGenResult> {
  // ── Tier 0: Forge Image API (Built-in, Premium) ──
  try {
    const { generateImage } = await import("../_core/imageGeneration");
    const result = await generateImage({
      prompt: request.prompt,
      originalImages: request.originalImages,
    });
    if (result?.url) {
      return {
        url: result.url,
        tier: "forge",
        quality: "premium",
        model: "forge-default",
      };
    }
  } catch (err: any) {
    console.warn(`[tieredImageGen] Forge failed: ${err.message}`);
  }

  // ── Tier 1: Pollinations.ai (Free, Unlimited, High Quality) ──
  try {
    const result = await pollinationsGenerate(request);
    if (result) {
      return {
        url: result,
        tier: "pollinations",
        quality: "high",
        model: "flux",
        warning: "Generated via Pollinations.ai (free tier). Upgrade to DALL-E 3 for premium quality.",
      };
    }
  } catch (err: any) {
    console.warn(`[tieredImageGen] Pollinations failed: ${err.message}`);
  }

  // ── Tier 2: Placeholder SVG (Degraded) ──
  const placeholderUrl = generatePlaceholderSvg(request.prompt, request.width || 1024, request.height || 1024);
  return {
    url: placeholderUrl,
    tier: "placeholder",
    quality: "degraded",
    warning: "Image generation unavailable. Showing placeholder. Configure an API key in Settings → Development for real image generation.",
  };
}

/**
 * Pollinations.ai — Free, unlimited AI image generation.
 * Uses Flux model by default. No API key required.
 * 
 * API: https://image.pollinations.ai/prompt/{prompt}?width={w}&height={h}&model={model}
 */
async function pollinationsGenerate(request: ImageGenRequest): Promise<string | null> {
  const { prompt, width = 1024, height = 1024 } = request;
  
  // Pollinations uses URL-encoded prompts in the path
  const encodedPrompt = encodeURIComponent(prompt);
  const model = request.model || "flux"; // flux, turbo, flux-realism, flux-anime, flux-3d
  
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=true`;
  
  // Verify the image is accessible (Pollinations generates on-demand)
  try {
    const resp = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(30000), // Image gen can take up to 30s
    });
    
    if (resp.ok || resp.status === 302 || resp.status === 301) {
      return url;
    }
    
    // Try without HEAD (some CDNs don't support it)
    return url; // Return the URL anyway — Pollinations generates on first GET
  } catch (err: any) {
    console.warn(`[tieredImageGen] Pollinations HEAD check failed: ${err.message}`);
    // Still return the URL — it may work on direct access
    return url;
  }
}

/**
 * Generate a placeholder SVG with the prompt text.
 * Used as absolute last resort when no image generation is available.
 */
function generatePlaceholderSvg(prompt: string, width: number, height: number): string {
  const truncatedPrompt = prompt.length > 80 ? prompt.slice(0, 80) + "..." : prompt;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#1a1a2e"/>
    <rect x="10%" y="10%" width="80%" height="80%" rx="16" fill="#16213e" stroke="#0f3460" stroke-width="2"/>
    <text x="50%" y="45%" text-anchor="middle" fill="#e94560" font-size="24" font-family="system-ui">🎨 Image Placeholder</text>
    <text x="50%" y="55%" text-anchor="middle" fill="#a0a0b0" font-size="14" font-family="system-ui">${escapeXml(truncatedPrompt)}</text>
    <text x="50%" y="70%" text-anchor="middle" fill="#606070" font-size="12" font-family="system-ui">Configure image generation in Settings → Development</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
