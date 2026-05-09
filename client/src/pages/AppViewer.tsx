/**
 * AppViewer — generic resolver for `/apps/:slug`.
 *
 * The Hub tile for any installed user-app navigates here. We resolve the
 * app via `apps.getBySlug` (publicProcedure that respects visibility),
 * then render its surface based on the manifest in `app.config`:
 *
 *   { kind: "link",     url: "..." }              → external open + landing card
 *   { kind: "iframe",   url: "...", height?: n }  → sandboxed iframe embed
 *   { kind: "markdown", body: "..." }             → markdown body
 *   { kind: "engine",   path: "/relational" }     → redirect to canonical engine route
 *
 * Anything else falls back to a "no surface yet" landing card with the
 * app metadata so the route is never a hard 404.
 */
import { useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppViewerProps {
  slug: string;
}

interface AppManifest {
  kind?: "link" | "iframe" | "markdown" | "engine";
  url?: string;
  height?: number;
  body?: string;
  path?: string;
}

function parseManifest(config: unknown): AppManifest {
  if (!config || typeof config !== "object") return {};
  return config as AppManifest;
}

export default function AppViewer({ slug }: AppViewerProps) {
  const [, navigate] = useLocation();
  const { data, isLoading, error } = trpc.apps.getBySlug.useQuery(
    { slug },
    { retry: false, enabled: !!slug },
  );

  const manifest = useMemo<AppManifest>(
    () => (data?.app ? parseManifest(data.app.config) : {}),
    [data?.app],
  );

  // Engine kind: redirect to canonical engine route.
  useEffect(() => {
    if (manifest.kind === "engine" && manifest.path) {
      navigate(manifest.path);
    }
  }, [manifest, navigate]);

  if (isLoading) {
    return (
      <div
        data-testid={`app-viewer-loading-${slug}`}
        className="container py-8 marble-bg flex items-center gap-2 text-muted-foreground"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading app…
      </div>
    );
  }

  if (error || !data?.app) {
    return (
      <div
        data-testid={`app-viewer-not-found-${slug}`}
        className="container py-8 pb-32 marble-bg"
      >
        <Card className="max-w-xl bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              App not available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              We couldn't find an app at <code>/apps/{slug}</code>. It may have
              been unpublished, made private, or you may need to install it
              first.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/hub">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Hub
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { app } = data;

  return (
    <div
      data-testid={`app-viewer-${slug}`}
      className="container py-8 pb-32 marble-bg"
    >
      <header className="mb-6 flex items-start gap-3">
        <div className="rounded-lg bg-foreground/5 p-2.5 text-2xl leading-none">
          {app.icon ?? "📦"}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
          {app.description ? (
            <p className="text-sm text-muted-foreground">{app.description}</p>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/hub">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Hub
          </Link>
        </Button>
      </header>

      {manifest.kind === "iframe" && manifest.url ? (
        <div
          data-testid={`app-viewer-iframe-${slug}`}
          className="rounded-lg border border-border overflow-hidden bg-card"
          style={{ height: Math.min(Math.max(manifest.height ?? 720, 320), 1600) }}
        >
          <iframe
            src={manifest.url}
            title={app.name}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            className="w-full h-full"
          />
        </div>
      ) : manifest.kind === "link" && manifest.url ? (
        <Card
          data-testid={`app-viewer-link-${slug}`}
          className="bg-card text-card-foreground border border-border max-w-xl"
        >
          <CardHeader>
            <CardTitle className="text-base">Open in a new tab</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground break-all">{manifest.url}</p>
            <Button asChild>
              <a href={manifest.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open {app.name}
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : manifest.kind === "markdown" && manifest.body ? (
        <Card
          data-testid={`app-viewer-markdown-${slug}`}
          className="bg-card text-card-foreground border border-border"
        >
          <CardContent className="prose prose-invert dark:prose-invert max-w-none py-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {manifest.body}
            </pre>
          </CardContent>
        </Card>
      ) : manifest.kind === "engine" ? (
        <Card className="bg-card text-card-foreground border border-border max-w-xl">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Redirecting to {manifest.path ?? "engine"}…
          </CardContent>
        </Card>
      ) : (
        <Card
          data-testid={`app-viewer-empty-${slug}`}
          className="bg-card text-card-foreground border border-border max-w-xl"
        >
          <CardHeader>
            <CardTitle className="text-base">No surface configured yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This app doesn't have a renderable surface in its manifest yet.
              Owners can add one by editing the app's config with a{" "}
              <code>kind</code> of <code>link</code>, <code>iframe</code>,{" "}
              <code>markdown</code>, or <code>engine</code>.
            </p>
            <Button asChild variant="outline">
              <Link href="/hub">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hub
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
