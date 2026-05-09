/**
 * PortfolioPage (L5) — aggregate view of the user's positions and accounts
 * across all SnapTrade-connected brokerages. Surfaces total market value,
 * cash balance, top holdings, and an account-level breakdown.
 */
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { StewardshipPageShell } from "@/components/StewardshipPageShell";
import { Wallet, TrendingUp, Layers } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function formatUsd(n: number | string | null | undefined) {
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

export default function PortfolioPage() {
  const accounts = trpc.snapTrade.listAccounts.useQuery(undefined, { retry: false });
  const positions = trpc.snapTrade.listPositions.useQuery(undefined, { retry: false });

  const totals = useMemo(() => {
    const accs = accounts.data ?? [];
    const totalEquity = accs.reduce((acc, a) => acc + (Number(a.totalValue ?? a.marketValue ?? 0) || 0), 0);
    const totalCash = accs.reduce((acc, a) => acc + (Number(a.cashBalance ?? 0) || 0), 0);
    const positionCount = positions.data?.length ?? 0;
    return { totalEquity, totalCash, positionCount, accountCount: accs.length };
  }, [accounts.data, positions.data]);

  const topPositions = useMemo(() => {
    const ps = positions.data ?? [];
    return [...ps]
      .map(p => ({
        ...p,
        marketValueNum: Number(p.marketValue ?? 0) || 0,
      }))
      .sort((a, b) => b.marketValueNum - a.marketValueNum)
      .slice(0, 10);
  }, [positions.data]);

  const isLoading = accounts.isLoading || positions.isLoading;
  const isEmpty = !isLoading && totals.accountCount === 0;

  return (
    <StewardshipPageShell
      layer="L5"
      title="Portfolio"
      description="Aggregate view of your investment accounts. Market values reflect the most recent SnapTrade sync."
    >
      {isEmpty ? (
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle>No accounts yet</CardTitle>
            <CardDescription>Connect a brokerage to see your portfolio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/connections">
              <Button>Go to Connections</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total equity"
              value={formatUsd(totals.totalEquity)}
              icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
              loading={isLoading}
            />
            <KpiCard
              label="Cash balance"
              value={formatUsd(totals.totalCash)}
              icon={<Wallet className="w-4 h-4 text-sky-400" />}
              loading={isLoading}
            />
            <KpiCard label="Accounts" value={String(totals.accountCount)} loading={isLoading} />
            <KpiCard
              label="Positions"
              value={String(totals.positionCount)}
              icon={<Layers className="w-4 h-4 text-violet-400" />}
              loading={isLoading}
            />
          </div>

          {/* Top holdings */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Top holdings</CardTitle>
              <CardDescription>By market value (top 10).</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : topPositions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No positions found. Try syncing your brokerage from the Connections page.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="text-left py-2 font-medium">Symbol</th>
                      <th className="text-left py-2 font-medium hidden sm:table-cell">Description</th>
                      <th className="text-right py-2 font-medium">Quantity</th>
                      <th className="text-right py-2 font-medium">Market value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {topPositions.map((p) => (
                      <tr key={p.id} data-testid={`portfolio-row-${p.symbolTicker ?? p.id}`}>
                        <td className="py-2 font-medium">{p.symbolTicker ?? "—"}</td>
                        <td className="py-2 text-muted-foreground hidden sm:table-cell truncate max-w-xs">
                          {p.symbolName ?? p.symbolType ?? ""}
                        </td>
                        <td className="py-2 text-right tabular-nums">{p.units ?? "—"}</td>
                        <td className="py-2 text-right tabular-nums">{formatUsd(p.marketValueNum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Accounts breakdown */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>One row per brokerage account.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <ul className="divide-y divide-border/40">
                  {accounts.data?.map(a => (
                    <li key={a.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{a.accountName ?? a.accountNumber ?? "Account"}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.institutionName ?? a.accountType ?? ""}
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="text-sm font-medium">{formatUsd(a.totalValue ?? a.marketValue)}</div>
                        <div className="text-xs text-muted-foreground">cash {formatUsd(a.cashBalance)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </StewardshipPageShell>
  );
}

function KpiCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-semibold tracking-tight">
        {loading ? <Skeleton className="h-6 w-24" /> : value}
      </div>
    </div>
  );
}
