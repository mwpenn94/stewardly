/**
 * OrgSettingsPage (L2 Org Admin) — brand voice, prohibited topics, disclaimers,
 * AI overlay. Bound to trpc.organizationAi.{get,upsert} with org-picker for
 * admins of multiple orgs.
 */
import { useEffect, useState } from "react";
import { useRoles } from "@/hooks/useRoles";
import { trpc } from "@/lib/trpc";
import { StewardshipPageShell } from "@/components/StewardshipPageShell";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { LockKeyhole, Building2, Save } from "lucide-react";
import { toast } from "sonner";

export default function OrgSettingsPage() {
  const roles = useRoles();
  const utils = trpc.useUtils();
  const myOrgs = trpc.households.myOrgs.useQuery(undefined, { enabled: !!roles.canSeeOrgAdmin });
  const adminOrgs = (myOrgs.data ?? []).filter((o) => o.organizationRole === "org_admin");
  const [orgId, setOrgId] = useState<number | null>(null);

  useEffect(() => {
    if (orgId == null && adminOrgs.length > 0) setOrgId(adminOrgs[0].organizationId);
  }, [orgId, adminOrgs]);

  const settings = trpc.organizationAi.get.useQuery(
    { organizationId: orgId ?? 0 },
    { enabled: orgId != null },
  );
  const upsert = trpc.organizationAi.upsert.useMutation({
    onSuccess: () => {
      toast.success("Organization AI settings saved.");
      void utils.organizationAi.get.invalidate({ organizationId: orgId ?? 0 });
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const [form, setForm] = useState({
    organizationName: "",
    brandVoice: "",
    complianceLanguage: "",
    customDisclaimers: "",
    promptOverlay: "",
    toneStyle: "",
    responseFormat: "",
    responseLength: "",
    temperature: "" as string,
    maxTokens: "" as string,
  });

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      organizationName: settings.data.organizationName ?? "",
      brandVoice: settings.data.brandVoice ?? "",
      complianceLanguage: settings.data.complianceLanguage ?? "",
      customDisclaimers: settings.data.customDisclaimers ?? "",
      promptOverlay: settings.data.promptOverlay ?? "",
      toneStyle: settings.data.toneStyle ?? "",
      responseFormat: settings.data.responseFormat ?? "",
      responseLength: settings.data.responseLength ?? "",
      temperature: settings.data.temperature?.toString() ?? "",
      maxTokens: settings.data.maxTokens?.toString() ?? "",
    });
  }, [settings.data]);

  if (!roles.isLoading && !roles.canSeeOrgAdmin) {
    return (
      <StewardshipPageShell layer="L2" title="Organization Settings">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LockKeyhole className="w-4 h-4" /> Restricted</CardTitle>
            <CardDescription>Only organization admins can edit org settings.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  if (myOrgs.isLoading) {
    return (
      <StewardshipPageShell layer="L2" title="Organization Settings">
        <Skeleton className="h-64 w-full" />
      </StewardshipPageShell>
    );
  }

  if (adminOrgs.length === 0) {
    return (
      <StewardshipPageShell layer="L2" title="Organization Settings">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle>No organizations</CardTitle>
            <CardDescription>You're not currently an admin in any organization.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  return (
    <StewardshipPageShell
      layer="L2"
      title="Organization Settings"
      description="Brand voice, approved topics, prohibited topics, compliance disclaimers, AI overlay. Settings cascade down to managers, professionals, and end users in your org."
    >
      {adminOrgs.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <Label className="text-xs">Org:</Label>
          <select
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            value={orgId ?? ""}
            onChange={(e) => setOrgId(Number(e.target.value))}
          >
            {adminOrgs.map((o) => (
              <option key={o.organizationId} value={o.organizationId}>{o.organizationName}</option>
            ))}
          </select>
        </div>
      )}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" /> AI overlay & brand
          </CardTitle>
          <CardDescription>
            Layered on top of platform-level defaults. Managers, professionals, and end users in
            this organization inherit these values unless they override.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="organizationName">Display name</Label>
            <Input id="organizationName" value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="brandVoice">Brand voice</Label>
            <Textarea id="brandVoice" rows={3} value={form.brandVoice}
              onChange={(e) => setForm({ ...form, brandVoice: e.target.value })}
              placeholder="e.g. Warm, candid, faith-rooted; uses second-person; avoids jargon." />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="promptOverlay">System prompt overlay</Label>
            <Textarea id="promptOverlay" rows={4} value={form.promptOverlay}
              onChange={(e) => setForm({ ...form, promptOverlay: e.target.value })}
              placeholder="Appended to the platform base prompt for all conversations in this org." />
          </div>
          <div>
            <Label htmlFor="toneStyle">Tone</Label>
            <Input id="toneStyle" value={form.toneStyle}
              onChange={(e) => setForm({ ...form, toneStyle: e.target.value })} placeholder="warm | neutral | crisp" />
          </div>
          <div>
            <Label htmlFor="responseFormat">Response format</Label>
            <Input id="responseFormat" value={form.responseFormat}
              onChange={(e) => setForm({ ...form, responseFormat: e.target.value })} placeholder="prose | bullets | tables" />
          </div>
          <div>
            <Label htmlFor="responseLength">Response length</Label>
            <Input id="responseLength" value={form.responseLength}
              onChange={(e) => setForm({ ...form, responseLength: e.target.value })} placeholder="concise | standard | comprehensive" />
          </div>
          <div>
            <Label htmlFor="temperature">Temperature</Label>
            <Input id="temperature" type="number" step="0.1" min={0} max={2} value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="maxTokens">Max tokens</Label>
            <Input id="maxTokens" type="number" step="100" min={100} max={64000} value={form.maxTokens}
              onChange={(e) => setForm({ ...form, maxTokens: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="customDisclaimers">Custom disclaimers</Label>
            <Textarea id="customDisclaimers" rows={2} value={form.customDisclaimers}
              onChange={(e) => setForm({ ...form, customDisclaimers: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="complianceLanguage">Compliance language</Label>
            <Textarea id="complianceLanguage" rows={2} value={form.complianceLanguage}
              onChange={(e) => setForm({ ...form, complianceLanguage: e.target.value })} />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            disabled={orgId == null || upsert.isPending}
            onClick={() => {
              if (orgId == null) return;
              upsert.mutate({
                organizationId: orgId,
                organizationName: form.organizationName || undefined,
                brandVoice: form.brandVoice || undefined,
                complianceLanguage: form.complianceLanguage || undefined,
                customDisclaimers: form.customDisclaimers || undefined,
                promptOverlay: form.promptOverlay || undefined,
                toneStyle: form.toneStyle || undefined,
                responseFormat: form.responseFormat || undefined,
                responseLength: form.responseLength || undefined,
                temperature: form.temperature ? Number(form.temperature) : undefined,
                maxTokens: form.maxTokens ? Number(form.maxTokens) : undefined,
              });
            }}
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </CardFooter>
      </Card>
    </StewardshipPageShell>
  );
}
