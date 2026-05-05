/**
 * Sovereign Deploy — Async deploy pipeline for one-click publish.
 * Wraps the same logic as the GitHub webhook deploy but triggered directly.
 */

import { updateWebappDeployment, updateWebappProject } from "./db";
import { storagePut } from "./storage";
import { getFileContent, getRepoTree } from "./githubApi";

export async function triggerSovereignDeploy(
  project: any,
  repo: any,
  token: string,
  branch: string,
  depId: number
): Promise<void> {
  const buildLogLines: string[] = [`[${new Date().toISOString()}] One-click publish triggered`];
  const appendLog = async (line: string) => {
    buildLogLines.push(`[${new Date().toISOString()}] ${line}`);
    try { await updateWebappDeployment(depId, { buildLog: buildLogLines.join("\n") }); } catch {}
  };

  try {
    const [owner, repoName] = repo.fullName.split("/");
    await appendLog(`Fetching repo tree from branch: ${branch}`);

    const tree = await getRepoTree(token, owner, repoName, branch, true);
    const files = tree.tree.filter((f: any) => f.type === "blob");

    // Detect project type
    const packageJsonFile = files.find((f: any) => f.path === "package.json");
    let needsBuild = false;

    if (packageJsonFile) {
      try {
        const pkgContent = await getFileContent(token, owner, repoName, "package.json", branch);
        if (pkgContent.content) {
          const pkg = JSON.parse(Buffer.from(pkgContent.content, "base64").toString("utf-8"));
          if (pkg.scripts?.build) {
            needsBuild = true;
            await appendLog(`Detected build-required project (build: ${pkg.scripts.build})`);
          }
        }
      } catch (pkgErr: any) {
        await appendLog(`Warning: Could not parse package.json: ${pkgErr.message}`);
      }
    }

    let publishedUrl: string;

    if (needsBuild) {
      // BUILD PATH: Clone → install → build → upload
      const { execSync } = await import("child_process");
      const fs = await import("fs");
      const path = await import("path");
      const os = await import("os");

      const tmpDir = path.join(os.tmpdir(), `sovereign-deploy-${Date.now()}`);
      await appendLog(`Cloning repo...`);

      try {
        const cloneUrl = `https://x-access-token:${token}@github.com/${repo.fullName}.git`;
        execSync(`git clone --depth 1 --branch ${branch} ${cloneUrl} ${tmpDir}`, { timeout: 60000 });
        await appendLog(`Installing dependencies...`);

        const hasPnpmLock = fs.existsSync(path.join(tmpDir, "pnpm-lock.yaml"));
        const hasYarnLock = fs.existsSync(path.join(tmpDir, "yarn.lock"));
        const installCmd = hasPnpmLock ? "pnpm install --frozen-lockfile" : hasYarnLock ? "yarn install --frozen-lockfile" : "npm ci --legacy-peer-deps";
        execSync(`cd ${tmpDir} && ${installCmd}`, { timeout: 120000, env: { ...process.env, CI: "true" } });
        await appendLog(`Building...`);

        execSync(`cd ${tmpDir} && npm run build`, { timeout: 120000, env: { ...process.env, CI: "true", NODE_ENV: "production" } });
        await appendLog(`Build complete. Uploading...`);

        const distDir = fs.existsSync(path.join(tmpDir, "dist")) ? path.join(tmpDir, "dist")
          : fs.existsSync(path.join(tmpDir, "build")) ? path.join(tmpDir, "build")
          : fs.existsSync(path.join(tmpDir, "out")) ? path.join(tmpDir, "out")
          : null;

        if (!distDir || !fs.existsSync(path.join(distDir, "index.html"))) {
          await appendLog("ERROR: No index.html in build output");
          await updateWebappDeployment(depId, { status: "failed", errorMessage: "Build output missing index.html", buildLog: buildLogLines.join("\n") });
          await updateWebappProject(project.id, { deployStatus: "failed" });
          return;
        }

        const deployPrefix = `webapp/${project.externalId}`;
        const walkDir = (dir: string): string[] => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          const results: string[] = [];
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) results.push(...walkDir(fullPath));
            else results.push(fullPath);
          }
          return results;
        };

        const outputFiles = walkDir(distDir);
        const mimeTypes: Record<string, string> = {
          ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
          ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
          ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff",
          ".woff2": "font/woff2", ".webp": "image/webp", ".map": "application/json",
        };

        for (const filePath of outputFiles) {
          const relPath = path.relative(distDir, filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mime = mimeTypes[ext] || "application/octet-stream";
          const fileContent = fs.readFileSync(filePath);
          await storagePut(`${deployPrefix}/${relPath}`, fileContent, mime);
        }

        await appendLog(`Uploaded ${outputFiles.length} files`);
        const { url: indexUrl } = await storagePut(`${deployPrefix}/index.html`, fs.readFileSync(path.join(distDir, "index.html")), "text/html");
        publishedUrl = indexUrl;

        try { execSync(`rm -rf ${tmpDir}`, { timeout: 10000 }); } catch {}
      } catch (buildErr: any) {
        try { execSync(`rm -rf ${tmpDir}`, { timeout: 10000 }); } catch {}
        const errMsg = buildErr.message?.slice(0, 300) || "Unknown build error";
        await appendLog(`ERROR: ${errMsg}`);
        await updateWebappDeployment(depId, { status: "failed", errorMessage: errMsg, buildLog: buildLogLines.join("\n") });
        await updateWebappProject(project.id, { deployStatus: "failed" });
        return;
      }
    } else {
      // STATIC PATH: Find index.html directly
      const searchPaths = ["", "public/", "dist/", "build/", "docs/"];
      let indexHtml: string | null = null;

      for (const prefix of searchPaths) {
        const indexFile = files.find((f: any) => f.path === `${prefix}index.html`);
        if (indexFile) {
          const content = await getFileContent(token, owner, repoName, indexFile.path, branch);
          if (content.content) {
            indexHtml = Buffer.from(content.content, "base64").toString("utf-8");
            break;
          }
        }
      }

      if (!indexHtml) {
        await appendLog("ERROR: No index.html found");
        await updateWebappDeployment(depId, { status: "failed", errorMessage: "No index.html found", buildLog: buildLogLines.join("\n") });
        await updateWebappProject(project.id, { deployStatus: "failed" });
        return;
      }

      const deployPrefix = `webapp/${project.externalId}`;
      const { url: indexUrl } = await storagePut(`${deployPrefix}/index.html`, indexHtml, "text/html");
      publishedUrl = indexUrl;
      await appendLog(`Uploaded static site`);
    }

    // Success
    await updateWebappDeployment(depId, {
      status: "live",
      bundleUrl: publishedUrl,
      buildLog: buildLogLines.join("\n"),
      completedAt: new Date(),
    });
    await updateWebappProject(project.id, {
      deployStatus: "live",
      publishedUrl,
      lastDeployedAt: new Date(),
    });
    await appendLog("Publish complete!");

    // Notify owner
    try {
      const { notifyOwner } = await import("./_core/notification");
      await notifyOwner({
        title: `Published: ${repo.fullName}`,
        content: `One-click publish succeeded.\nURL: ${publishedUrl}`,
      });
    } catch {}
  } catch (err: any) {
    await appendLog(`ERROR: ${err.message}`);
    await updateWebappDeployment(depId, { status: "failed", errorMessage: err.message, buildLog: buildLogLines.join("\n") });
    await updateWebappProject(project.id, { deployStatus: "failed" });
  }
}
