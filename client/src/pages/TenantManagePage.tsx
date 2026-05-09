/**
 * TenantManagePage - L1 only. Manage member roles for a single org.
 * Route: /admin/tenants/:orgId
 */
import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useRoles } from "@/hooks/useRoles";
import { StewardshipPageShell } from "@/components/StewardshipPageShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { LockKeyhole, ChevronLeft, UserPlus, UserMinus, Shield, Palette, BarChart3, Save } from "lucide-react";
import { toast } from "sonner";

const ORG_ROLES = ["user", "professional", "manager", "org_admin"] as const;
type OrgRole = (typeof ORG_ROLES)[number];

export default function TenantManagePage() {
  const [, params] = useRoute("/admin/tenants/:orgId");
  const orgId = params?.orgId ? Number(params.orgId) : 0;
  const roles = useRoles();
  const utils = trpc.useUtils();
  const tenants = trpc.admin.listTenants.useQuery(undefined, { enabled: roles.canSeeAdminConsole });
  const members = trpc.admin.tenantMembers.useQuery(
    { organizationId: orgId },
    { enabled: roles.canSeeAdminConsole && !!orgId },
  );

  const upsertMember = trpc.admin.upsertMember.useMutation({
    onSuccess: () => {
      toast.success("Membership updated");
      utils.admin.tenantMembers.invalidate({ organizationId: orgId });
      utils.admin.listTenants.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const removeMember = trpc.admin.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      utils.admin.tenantMembers.invalidate({ organizationId: orgId });
      utils.admin.listTenants.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<OrgRole>("user");

  // L1 white-label branding state
  const branding = trpc.admin.tenantBranding.useQuery(
    { organizationId: orgId },
    { enabled: roles.canSeeAdminConsole && !!orgId },
  );
  const [logoUrl, setLogoUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [themeColor, setThemeColor] = useState("");
  useEffect(() => {
    if (branding.data) {
      setLogoUrl(branding.data.logoUrl ?? "");
      setCustomDomain(branding.data.customDomain ?? "");
      setThemeColor(branding.data.themeColor ?? "");
    }
  }, [branding.data]);
  const updateBranding = trpc.admin.updateTenantBranding.useMutation({
    onSuccess: () => {
      toast.success("Branding saved");
      utils.admin.tenantBranding.invalidate({ organizationId: orgId });
    },
    onError: (e) => toast.error(e.message),
  });

  // L2 multi-household roll-up
  const rollup = trpc.admin.orgRollup.useQuery(
    { organizationId: orgId },
    { enabled: roles.canSeeAdminConsole && !!orgId },
  );

  if (!roles.isLoading && !roles.canSeeAdminConsole) {
    return (
      <StewardshipPageShell layer="ADMIN" title="Tenant manager">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LockKeyhole className="w-4 h-4" /> Restricted</CardTitle>
            <CardDescription>Global admin access required.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  const tenant = tenants.data?.tenants.find(t => t.id === orgId);

  return (
    <StewardshipPageShell
      layer="ADMIN"
      title={tenant?.name ?? `Tenant #${orgId}`}
      description={tenant ? `Manage member roles for ${tenant.name} (/${tenant.slug})` : "Loading tenant…"}
    >
      <div className="mb-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1"><ChevronLeft className="w-4 h-4" /> Back to admin console</Button>
        </Link>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Members</CardTitle>
          <CardDescription>{members.data?.members.length ?? 0} member{(members.data?.members.length ?? 0) === 1 ? "" : "s"} (active + pending).</CardDescription>
        </CardHeader>
        <CardContent>
          {members.isLoading && <p className="text-sm text-muted-foreground italic">Loading…</p>}
          {members.data && members.data.members.length === 0 && <p className="text-sm text-muted-foreground italic">No members yet — add one below.</p>}
          <ul className="divide-y divide-border/40" data-testid="tenant-member-list">
            {members.data?.members.map(m => (
              <li key={m.userId} className="py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{m.name ?? m.email ?? `User #${m.userId}`}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">#{m.userId} · {m.email ?? "(no email)"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{m.globalRole === "global_admin" && <span className="mr-2 text-amber-400">global_admin</span>}{m.status ?? "active"}</div>
                <select
                  value={m.organizationRole ?? "user"}
                  onChange={e => upsertMember.mutate({ organizationId: orgId, userId: m.userId, organizationRole: e.target.value as OrgRole })}
                  className="bg-background/40 border border-border/40 rounded px-2 py-1 text-xs"
                  data-testid={`tenant-role-select-${m.userId}`}
                >
                  {ORG_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Remove ${m.email ?? `user #${m.userId}`} from ${tenant?.name ?? "this org"}?`)) {
                      removeMember.mutate({ organizationId: orgId, userId: m.userId });
                    }
                  }}
                  data-testid={`tenant-remove-${m.userId}`}
                >
                  <UserMinus className="w-3 h-3" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* L2 multi-household roll-up tile */}
      <Card className="glass-card mt-4" data-testid="tenant-rollup-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Org roll-up</CardTitle>
          <CardDescription>
            Multi-household analytics: count of households, total assets under stewardship,
            and advisor-to-household ratio. Computed live across snaptrade_accounts.totalValue.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-md border border-border/50 bg-background/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Households</div>
            <div className="font-mono text-2xl mt-1">{rollup.data?.households ?? "—"}</div>
          </div>
          <div className="rounded-md border border-border/50 bg-background/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Professionals</div>
            <div className="font-mono text-2xl mt-1">{rollup.data?.professionals ?? "—"}</div>
          </div>
          <div className="rounded-md border border-border/50 bg-background/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total AUS</div>
            <div className="font-mono text-2xl mt-1">
              {rollup.data ? `$${Math.round(rollup.data.totalAum).toLocaleString()}` : "—"}
            </div>
          </div>
          <div className="rounded-md border border-border/50 bg-background/30 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Adv : H ratio</div>
            <div className="font-mono text-2xl mt-1">
              {rollup.data
                ? rollup.data.professionals > 0
                  ? `1 : ${rollup.data.advisorRatio.toFixed(1)}`
                  : "n/a"
                : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* L1 white-label branding tile */}
      <Card className="glass-card mt-4" data-testid="tenant-branding-tile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4 text-violet-400" /> White-label</CardTitle>
          <CardDescription>
            Per-tenant logo, custom domain (host only, no protocol), and theme color override.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-3">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://cdn.example.com/tenant-logo.png" data-testid="tenant-logo-url" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="customDomain">Custom domain</Label>
            <Input id="customDomain" value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="steward.example.com" data-testid="tenant-custom-domain" />
          </div>
          <div>
            <Label htmlFor="themeColor">Theme color</Label>
            <Input id="themeColor" value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              placeholder="#0081f2 or oklch(...)" data-testid="tenant-theme-color" />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            disabled={!orgId || updateBranding.isPending}
            onClick={() => updateBranding.mutate({
              organizationId: orgId,
              logoUrl: logoUrl ? logoUrl : null,
              customDomain: customDomain ? customDomain : null,
              themeColor: themeColor ? themeColor : null,
            })}
            data-testid="tenant-branding-save"
          >
            <Save className="w-4 h-4 mr-1" /> Save branding
          </Button>
        </CardFooter>
      </Card>

      <Card className="glass-card mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add member</CardTitle>
          <CardDescription>Grant an existing user an organization role. (User must already exist; create accounts via OAuth login.)</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap gap-2 items-end"
            onSubmit={e => {
              e.preventDefault();
              const id = Number(newUserId);
              if (!Number.isFinite(id) || id <= 0) {
                toast.error("Enter a valid user ID");
                return;
              }
              upsertMember.mutate(
                { organizationId: orgId, userId: id, organizationRole: newRole },
                {
                  onSuccess: () => {
                    setNewUserId("");
                    setNewRole("user");
                  },
                },
              );
            }}
          >
            <div className="flex-1 min-w-[10rem]">
              <label className="text-xs text-muted-foreground">User ID</label>
              <Input
                value={newUserId}
                onChange={e => setNewUserId(e.target.value)}
                placeholder="e.g. 42"
                className="bg-background/40"
                data-testid="tenant-add-user-id"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as OrgRole)}
                className="block bg-background/40 border border-border/40 rounded px-2 py-2 text-sm"
                data-testid="tenant-add-user-role"
              >
                {ORG_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={upsertMember.isPending}>Grant</Button>
          </form>
        </CardContent>
      </Card>
    </StewardshipPageShell>
  );
}
