/**
 * IndividualHomePage (L5 hub) — landing tile for end users that links to the
 * three personal-finance surfaces (/connections, /portfolio, /economic-data).
 *
 * Route: /individual
 *
 * No new tRPC dependencies — purely a navigational shell so the L5 layer has
 * a coherent "home" rather than dropping users straight into a feature page.
 */
import { Link } from "wouter";
import { StewardshipPageShell } from "@/components/StewardshipPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, LineChart, Globe2, ArrowRight } from "lucide-react";

interface HubTile {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconTone: string;
  testId: string;
}

const tiles: HubTile[] = [
  {
    href: "/connections",
    title: "Connections",
    description:
      "Link your bank accounts via Plaid and brokerage accounts via SnapTrade. " +
      "Connection state, last-sync time, and reauthorization controls live here.",
    icon: <Briefcase className="w-5 h-5" />,
    iconTone: "text-sky-400",
    testId: "individual-tile-connections",
  },
  {
    href: "/portfolio",
    title: "Portfolio",
    description:
      "Holdings table from your SnapTrade positions, total value, and per-account " +
      "breakdown. Read-only — trades happen in your brokerage.",
    icon: <LineChart className="w-5 h-5" />,
    iconTone: "text-violet-400",
    testId: "individual-tile-portfolio",
  },
  {
    href: "/economic-data",
    title: "Economic data",
    description:
      "FRED, BEA, BLS, and Census widgets with status badges. Use these as a " +
      "macro context layer for your stewardship conversations.",
    icon: <Globe2 className="w-5 h-5" />,
    iconTone: "text-emerald-400",
    testId: "individual-tile-economic-data",
  },
];

export default function IndividualHomePage() {
  return (
    <StewardshipPageShell
      layer="L5"
      title="Your stewardship hub"
      description="A single launch point for your personal finance surfaces. Each tile takes you to a focused workspace; settings and AI overlay live in your account menu."
    >
      <div className="grid gap-4 md:grid-cols-3" data-testid="individual-tile-grid">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} data-testid={t.testId} className="group">
            <Card className="glass-card h-full transition hover:translate-y-[-2px] hover:border-foreground/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={t.iconTone}>{t.icon}</span> {t.title}
                </CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center gap-1 group-hover:text-foreground">
                Open <ArrowRight className="w-3.5 h-3.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </StewardshipPageShell>
  );
}
