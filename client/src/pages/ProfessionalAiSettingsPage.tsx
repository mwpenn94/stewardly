/**
 * ProfessionalAiSettingsPage (L4) — specialization, methodology, communication
 * style, per-client overrides, AI overlay. Bound to trpc.professionalAi.{get,upsert}.
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
import { LockKeyhole, Briefcase, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfessionalAiSettingsPage() {
  const roles = useRoles();
  const utils = trpc.useUtils();
  const myOrgs = trpc.households.myOrgs.useQuery(undefined, { enabled: !!roles.canSeeProfessional });
  const profOrgs = (myOrgs.data ?? []).filter((o) =>
    o.organizationRole === "professional" || o.organizationRole === "manager" ||
    o.organizationRole === "org_admin"
  );
  const [orgId, setOrgId] = useState<number | null>(null);

  useEffect(() => {
    if (orgId == null && profOrgs.length > 0) setOrgId(profOrgs[0].organizationId);
  }, [orgId, profOrgs]);

  const settings = trpc.professionalAi.get.useQuery(
    { organizationId: orgId ?? 0 },
    { enabled: orgId != null },
  );
  const upsert = trpc.professionalAi.upsert.useMutation({
    onSuccess: () => {
      toast.success("Professional AI settings saved.");
      void utils.professionalAi.get.invalidate({ organizationId: orgId ?? 0 });
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const [form, setForm] = useState({
    specialization: "",
    methodology: "",
    communicationStyle: "",
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
      specialization: settings.data.specialization ?? "",
      methodology: settings.data.methodology ?? "",
      communicationStyle: settings.data.communicationStyle ?? "",
      promptOverlay: settings.data.promptOverlay ?? "",
      toneStyle: settings.data.toneStyle ?? "",
      responseFormat: settings.data.responseFormat ?? "",
      responseLength: settings.data.responseLength ?? "",
      temperature: settings.data.temperature?.toString() ?? "",
      maxTokens: settings.data.maxTokens?.toString() ?? "",
    });
  }, [settings.data]);

  if (!roles.isLoading && !roles.canSeeProfessional) {
    return (
      <StewardshipPageShell layer="L4" title="Professional Practice">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LockKeyhole className="w-4 h-4" /> Restricted</CardTitle>
            <CardDescription>This page is for professionals (advisors, planners, agents).</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  if (myOrgs.isLoading) {
    return (
      <StewardshipPageShell layer="L4" title="Professional Practice">
        <Skeleton className="h-64 w-full" />
      </StewardshipPageShell>
    );
  }
  if (profOrgs.length === 0) {
    return (
      <StewardshipPageShell layer="L4" title="Professional Practice">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle>No organizations</CardTitle>
            <CardDescription>You're not currently a professional in any organization.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  return (
    <StewardshipPageShell
      layer="L4"
      title="Professional Practice"
      description="Specialization, methodology, communication style, AI overlay. These layer on top of your organization's settings."
    >
      {profOrgs.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <Label className="text-xs">Org:</Label>
          <select
            className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-sm"
            value={orgId ?? ""}
            onChange={(e) => setOrgId(Number(e.target.value))}
          >
            {profOrgs.map((o) => (
              <option key={o.organizationId} value={o.organizationId}>{o.organizationName}</option>
            ))}
          </select>
        </div>
      )}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" /> Practice profile
          </CardTitle>
          <CardDescription>
            Your defaults when planning, advising, or chatting on behalf of clients in this org.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input id="specialization" value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              placeholder="e.g. Retirement income, ESG, business owners" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="methodology">Methodology</Label>
            <Textarea id="methodology" rows={3} value={form.methodology}
              onChange={(e) => setForm({ ...form, methodology: e.target.value })}
              placeholder="The framework you use when planning (e.g. Bucketing, Bogleheads, Modern Portfolio Theory)." />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="communicationStyle">Communication style</Label>
            <Textarea id="communicationStyle" rows={3} value={form.communicationStyle}
              onChange={(e) => setForm({ ...form, communicationStyle: e.target.value })}
              placeholder="How you write and explain things." />
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
              upsert.mutate({
                organizationId: orgId,
                specialization: form.specialization || undefined,
                methodology: form.methodology || undefined,
                communicationStyle: form.communicationStyle || undefined,
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
