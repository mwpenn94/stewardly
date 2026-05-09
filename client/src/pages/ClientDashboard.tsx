/**
 * ClientDashboard — placeholder following Round 13.2 cleanup.
 * The original page was a port of stewardly-ai's chat-conversations dashboard.
 * It is referenced by the Optimal stewardship leaf in shared/engineTaxonomy.ts,
 * so the route must continue to resolve. A purpose-built dashboard will land in a
 * follow-up pass; for now we surface the canonical destinations the leaf implies.
 */
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  { path: "/portfolio", label: "Portfolio", description: "Holdings, allocation, and performance" },
  { path: "/people-hub", label: "People Hub", description: "Households, contacts, and relationships" },
  { path: "/insights", label: "Insights", description: "Recent agent findings (redirects to chat)" },
  { path: "/integrations", label: "Connections", description: "Linked accounts and data sources" },
  { path: "/", label: "Start a new task", description: "Open the ManusNext task chat" },
];

export default function ClientDashboard() {
  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Client Dashboard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          A consolidated view of household health, recent activity, and pending stewardship
          actions is being assembled. Use the quick links below to reach the underlying tools
          while this dashboard is rebuilt.
        </p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map((link) => (
          <Card key={link.path}>
            <CardHeader>
              <CardTitle className="text-lg">{link.label}</CardTitle>
              <CardDescription>{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={link.path}>
                <Button variant="outline" size="sm">Open</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
