import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

// =============================================================================
// Manus Debug Collector - Vite Plugin
// Writes browser logs directly to files, trimmed when exceeding size limit
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024; // 1MB per log file
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6); // Trim to 60% to avoid constant re-trimming

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }

    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;

    // Keep newest lines (from end) that fit within 60% of maxSize
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }

    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;

  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);

  // Format entries with timestamps
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });

  // Append to log file
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");

  // Trim if exceeds max size
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

/**
 * Vite plugin to collect browser debug logs
 * - POST /__manus__/logs: Browser sends logs, written directly to files
 * - Files: browserConsole.log, networkRequests.log, sessionReplay.log
 * - Auto-trimmed when exceeding 1MB (keeps newest entries)
 */
function vitePluginManusDebugCollector(): Plugin {
  return {
    name: "manus-debug-collector",

    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true,
            },
            injectTo: "head",
          },
        ],
      };
    },

    configureServer(server: ViteDevServer) {
      // POST /__manus__/logs: Browser sends logs (written directly to files)
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }

        const handlePayload = (payload: any) => {
          // Write logs directly to files
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };

        const reqBody = (req as { body?: unknown }).body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }

        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];

export default defineConfig({
  plugins,
  resolve: {
    alias: [
      // Round 10: redirect any `import 'shiki'` (which loads bundle-full,
      // dynamic-imports all 237 syntax-highlighter languages, and turns
      // the dist into 600+ chunks ~30 MB) to bundle-web (which only
      // bundles the ~32 web-relevant langs). Streamdown's CodeBlock and
      // our own shikiHighlight both use the same `createHighlighter`
      // shape so this is a drop-in replacement.
      { find: /^shiki$/, replacement: "shiki/bundle/web" },
      // Round 12.2: stub mermaid (2.6 MB) since we don't render diagrams.
      // Streamdown's diagram code path will get a no-op renderer.
      { find: /^mermaid$/, replacement: path.resolve(import.meta.dirname, "client", "src", "lib", "mermaid-stub.ts") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "client", "src") },
      { find: "@shared", replacement: path.resolve(import.meta.dirname, "shared") },
      { find: "@assets", replacement: path.resolve(import.meta.dirname, "attached_assets") },
    ],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Round 12.2: cut deploy worker OOM. esbuild minifier uses ~3x less RAM
    // than terser; sourcemaps were doubling chunk sizes in memory.
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Round 12.2: split the heaviest page bundles into their own chunks so
          // Rollup never holds more than one of them in memory at once during render.
          if (id.includes('client/src/pages/Calculators.tsx')) return 'page-calculators';
          if (id.includes('client/src/pages/TaskView.tsx')) return 'page-taskview';
          if (id.includes('client/src/pages/CodeEditor.tsx')) return 'page-codeeditor';
          if (id.includes('client/src/pages/MyFinancialTwin.tsx')) return 'page-financialtwin';
          if (id.includes('client/src/pages/IntelligenceHub.tsx')) return 'page-intelhub';
          if (id.includes('client/src/pages/admin/')) return 'page-admin';
          if (id.includes('client/src/pages/learning/')) return 'page-learning';
          // Mermaid is dynamic-imported by streamdown for diagrams. Force it
          // into its own chunk so it never lands in the main page chunks.
          if (id.includes('node_modules/mermaid') || id.includes('node_modules/cytoscape') || id.includes('node_modules/dagre') || id.includes('node_modules/elkjs') || id.includes('node_modules/khroma')) {
            return 'vendor-mermaid';
          }
          // KaTeX is large and self-contained — safe to isolate
          if (id.includes('node_modules/katex')) {
            return 'vendor-katex';
          }
          // Framer-motion is ~130KB minified — split from main
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
            return 'vendor-framer-motion';
          }
          // Radix UI primitives are used across many pages — split from main
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          // Recharts is only used on BillingPage — split from main
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-recharts';
          }
          // tRPC + TanStack Query are core but can be split
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/@trpc')) {
            return 'vendor-trpc';
          }
          // Lucide icons are individually tree-shaken but still add up
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          // React core + React DOM — the largest unavoidable deps
          if (id.includes('node_modules/react-dom') || (id.includes('node_modules/react/') && !id.includes('react-'))) {
            return 'vendor-react';
          }
          // Let Vite handle all other chunking automatically to avoid
          // circular dependency issues between React and markdown libs
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
