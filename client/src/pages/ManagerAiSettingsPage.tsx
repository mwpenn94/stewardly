/**
 * ManagerAiSettingsPage (L3) — team focus, reporting requirements, AI overlay.
 * Bound to trpc.managerAi.{get,upsert} with org-picker.
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
import { LockKeyhole, UserCog, Save } from "lucide-react";
import { toast } from "sonner";

export default function ManagerAiSettingsPage() {
  const roles = useRoles();
  const utils = trpc.useUtils();
  const myOrgs = trpc.households.myOrgs.useQuery(undefined, { enabled: !!roles.canSeeManager });
  const mgrOrgs = (myOrgs.data ?? []).filter((o) =>
    o.organizationRole === "manager" || o.organizationRole === "org_admin"
  );
  const [orgId, setOrgId] = useState<number | null>(null);

  useEffect(() => {
    if (orgId == null && mgrOrgs.length > 0) setOrgId(mgrOrgs[0].organizationId);
  }, [orgId, mgrOrgs]);

  const settings = trpc.managerAi.get.useQuery(
    { organizationId: orgId ?? 0 },
    { enabled: orgId != null },
  );
  const upsert = trpc.managerAi.upsert.useMutation({
    onSuccess: () => {
      toast.success("Manager AI settings saved.");
      void utils.managerAi.get.invalidate({ organizationId: orgId ?? 0 });
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const [form, setForm] = useState({
    teamFocus: "",
    clientSegmentTargeting: "",
    reportingRequirements: "",
    promptOverlay: "",
    toneStyle: "",
    responseFormat: "",
    responseLength: "",
    temperature: "" as string,
    maxTokens: "" as string,
  });
  useEffect(() => {
    if (!settings.data) return;
    const focusJson = settings.data.teamFocusAreas;
    const reportJson = settings.data.reportingRequirements;
    const focusStr = typeof focusJson === "string" ? focusJson :
      Array.isArray(focusJson) ? focusJson.join("\n") :
      focusJson ? JSON.stringify(focusJson, null, 2) : "";
    const reportStr = typeof reportJson === "string" ? reportJson :
      Array.isArray(reportJson) ? reportJson.join("\n") :
      reportJson ? JSON.stringify(reportJson, null, 2) : "";
    setForm({
      teamFocus: focusStr,
      clientSegmentTargeting: settings.data.clientSegmentTargeting ?? "",
      reportingRequirements: reportStr,
      promptOverlay: settings.data.promptOverlay ?? "",
      toneStyle: settings.data.toneStyle ?? "",
      responseFormat: settings.data.responseFormat ?? "",
      responseLength: settings.data.responseLength ?? "",
      temperature: settings.data.temperature?.toString() ?? "",
      maxTokens: settings.data.maxTokens?.toString() ?? "",
    });
  }, [settings.data]);

  if (!roles.isLoading && !roles.canSeeManager) {
    return (
      <StewardshipPageShell layer="L3" title="Team Manager">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LockKeyhole className="w-4 h-4" /> Restricted</CardTitle>
            <CardDescription>This page is for team managers.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  if (myOrgs.isLoading) {
    return (
      <StewardshipPageShell layer="L3" title="Team Manager">
        <Skeleton className="h-64 w-full" />
      </StewardshipPageShell>
    );
  }
  if (mgrOrgs.length === 0) {
    return (
      <StewardshipPageShell layer="L3" title="Team Manager">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle>No organizations</CardTitle>
            <CardDescription>You're not currently a manager in any organization.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  return (
    <StewardshipPageShell
      layer="L3"
      title="Team Manager"
      description="Team focus, reporting requirements, AI overlay. These layer on top of organization-level settings and cascade down to professionals on your team."
    >
      {mgrOrgs.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <Label className="text-xs">Org:</Label>
          <select
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            value={orgId ?? ""}
            onChange={(e) => setOrgId(Number(e.target.value))}
          >
            {mgrOrgs.map((o) => (
              <option key={o.organizationId} value={o.organizationId}>{o.organizationName}</option>
            ))}
          </select>
        </div>
      )}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-4 h-4 text-sky-400" /> Team profile
          </CardTitle>
          <CardDescription>Defaults inherited by professionals on your team.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="teamFocus">Team focus areas (one per line)</Label>
            <Textarea id="teamFocus" rows={3} value={form.teamFocus}
              onChange={(e) => setForm({ ...form, teamFocus: e.target.value })}
              placeholder="Retirement planning&#10;Business owners&#10;ESG" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="clientSegmentTargeting">Client segment</Label>
            <Input id="clientSegmentTargeting" value={form.clientSegmentTargeting}
              onChange={(e) => setForm({ ...form, clientSegmentTargeting: e.target.value })}
              placeholder="e.g. high net worth, mass affluent, retirees" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="reportingRequirements">Reporting requirements (one per line)</Label>
            <Textarea id="reportingRequirements" rows={3} value={form.reportingRequirements}
              onChange={(e) => setForm({ ...form, reportingRequirements: e.target.value })}
              placeholder="Quarterly performance review&#10;Compliance attestation" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="promptOverlay">Prompt overlay</Label>
            <Textarea id="promptOverlay" rows={3} value={form.promptOverlay}
              onChange={(e) => setForm({ ...form, promptOverlay: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="toneStyle">Tone</Label>
            <Input id="toneStyle" value={form.toneStyle}
              onChange={(e) => setForm({ ...form, toneStyle: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="responseFormat">Format</Label>
            <Input id="responseFormat" value={form.responseFormat}
              onChange={(e) => setForm({ ...form, responseFormat: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="responseLength">Length</Label>
            <Input id="responseLength" value={form.responseLength}
              onChange={(e) => setForm({ ...form, responseLength: e.target.value })} />
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
        </CardContent>
        <CardFooter>
          <Button
            disabled={orgId == null || upsert.isPending}
            onClick={() => {
              if (orgId == null) return;
              const splitLines = (s: string) =>
                s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
              upsert.mutate({
                organizationId: orgId,
                teamFocusAreas: form.teamFocus ? splitLines(form.teamFocus) : undefined,
                clientSegmentTargeting: form.clientSegmentTargeting || undefined,
                reportingRequirements: form.reportingRequirements ? splitLines(form.reportingRequirements) : undefined,
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
