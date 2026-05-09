import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Lock, Globe, Link2, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * /apps/:slug route resolver.
 *
 * Loads the app by slug (apps.getBySlug) and renders its surface. The surface
 * type is determined by the app's `config.kind` field:
 *   - "external"  → render an outbound-link card (config.url)
 *   - "iframe"    → render an embedded iframe (config.url)
 *   - "markdown"  → render markdown content (config.markdown)
 *   - default      → render a placeholder hero with the app's metadata
 */
export default function AppViewerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data, isLoading, error } = trpc.apps.getBySlug.useQuery(
    { slug },
    { enabled: !!slug, retry: false },
  );

  if (!slug) {
    return (
      <EmptyState
        title="App not found"
        message="No app slug was provided."
        onBack={() => navigate("/")}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="App not found"
        message={
          error?.data?.code === "NOT_FOUND"
            ? "This app doesn't exist or you don't have permission to view it."
            : (error?.message ?? "Unable to load this app.")
        }
        onBack={() => navigate("/")}
      />
    );
  }

  const { app, installed } = data;
  const config = (app.config ?? {}) as {
    kind?: "external" | "iframe" | "markdown";
    url?: string;
    markdown?: string;
  };
  const kind = config.kind ?? "placeholder";

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {app.visibility === "public" && (
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          )}
          {app.visibility === "unlisted" && (
            <Badge variant="secondary" className="gap-1">
              <Link2 className="h-3 w-3" />
              Unlisted
            </Badge>
          )}
          {app.visibility === "private" && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )}
          {installed && <Badge variant="outline">Installed</Badge>}
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start gap-4">
            {app.icon ? (
              app.icon.startsWith("http") || app.icon.startsWith("/") ? (
                <img
                  src={app.icon}
                  alt={`${app.name} icon`}
                  className="h-16 w-16 rounded-lg object-cover border border-border/40"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg flex items-center justify-center text-3xl bg-muted/30 border border-border/40">
                  {app.icon}
                </div>
              )
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted/30 border border-border/40" />
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl">{app.name}</CardTitle>
              {app.description && (
                <CardDescription className="mt-1">
                  {app.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {kind === "external" && config.url && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This app opens in a new tab.
              </p>
              <Button asChild>
                <a href={config.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                  Open {app.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
          {kind === "iframe" && config.url && (
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-border/40">
              <iframe
                src={config.url}
                title={app.name}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          )}
          {kind === "markdown" && config.markdown && (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {config.markdown}
            </div>
          )}
          {kind === "placeholder" && (
            <p className="text-sm text-muted-foreground">
              This app doesn't have a configured surface yet.
              {user?.id === app.ownerUserId && " Edit its config to set a surface (external link, iframe URL, or markdown content)."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="container max-w-3xl py-16 text-center space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
      <Button onClick={onBack}>Go back home</Button>
    </div>
  );
}
