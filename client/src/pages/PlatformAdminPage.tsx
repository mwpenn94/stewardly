/**
 * PlatformAdminPage (L1 Global Admin) — base prompt, model defaults, global
 * guardrails, compliance disclaimers. Bound to trpc.platformAi.{get,upsert}.
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
import { LockKeyhole, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";

export default function PlatformAdminPage() {
  const roles = useRoles();
  const utils = trpc.useUtils();
  const settings = trpc.platformAi.get.useQuery(undefined, { enabled: !!roles.canSeePlatform });
  const upsert = trpc.platformAi.upsert.useMutation({
    onSuccess: () => {
      toast.success("Platform AI settings saved.");
      void utils.platformAi.get.invalidate();
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  const [form, setForm] = useState({
    baseSystemPrompt: "",
    defaultTone: "",
    defaultResponseFormat: "",
    defaultResponseLength: "",
    platformDisclaimer: "",
    maxTokensDefault: "" as string,
    temperatureDefault: "" as string,
  });
  useEffect(() => {
    if (!settings.data) return;
    setForm({
      baseSystemPrompt: settings.data.baseSystemPrompt ?? "",
      defaultTone: settings.data.defaultTone ?? "",
      defaultResponseFormat: settings.data.defaultResponseFormat ?? "",
      defaultResponseLength: settings.data.defaultResponseLength ?? "",
      platformDisclaimer: settings.data.platformDisclaimer ?? "",
      maxTokensDefault: settings.data.maxTokensDefault?.toString() ?? "",
      temperatureDefault: settings.data.temperatureDefault?.toString() ?? "",
    });
  }, [settings.data]);

  if (!roles.isLoading && !roles.canSeePlatform) {
    return (
      <StewardshipPageShell layer="L1" title="Platform Settings">
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="w-4 h-4" /> Restricted
            </CardTitle>
            <CardDescription>Platform settings are visible to global admins only.</CardDescription>
          </CardHeader>
        </Card>
      </StewardshipPageShell>
    );
  }

  return (
    <StewardshipPageShell
      layer="L1"
      title="Platform Settings"
      description="Base system prompt, model defaults, global guardrails, prohibited-topic list, compliance disclaimers. These are the foundation that every org / manager / professional / user prompt overlay layers on top of."
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" /> Platform defaults
          </CardTitle>
          <CardDescription>
            Cascade: <strong>append</strong> system prompts · <strong>override</strong> tone &amp; model · <strong>union</strong> guardrails ·
            <strong> intersect</strong> approved topics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="baseSystemPrompt">Base system prompt</Label>
            <Textarea id="baseSystemPrompt" rows={6} value={form.baseSystemPrompt}
              onChange={(e) => setForm({ ...form, baseSystemPrompt: e.target.value })}
              placeholder="The foundational prompt every conversation starts with." />
          </div>
          <div>
            <Label htmlFor="defaultTone">Default tone</Label>
            <Input id="defaultTone" value={form.defaultTone}
              onChange={(e) => setForm({ ...form, defaultTone: e.target.value })} placeholder="warm | neutral | crisp" />
          </div>
          <div>
            <Label htmlFor="defaultResponseFormat">Default format</Label>
            <Input id="defaultResponseFormat" value={form.defaultResponseFormat}
              onChange={(e) => setForm({ ...form, defaultResponseFormat: e.target.value })} placeholder="prose | bullets | tables" />
          </div>
          <div>
            <Label htmlFor="defaultResponseLength">Default length</Label>
            <Input id="defaultResponseLength" value={form.defaultResponseLength}
              onChange={(e) => setForm({ ...form, defaultResponseLength: e.target.value })} placeholder="concise | standard | comprehensive" />
          </div>
          <div>
            <Label htmlFor="temperatureDefault">Default temperature</Label>
            <Input id="temperatureDefault" type="number" step="0.1" min={0} max={2} value={form.temperatureDefault}
              onChange={(e) => setForm({ ...form, temperatureDefault: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="maxTokensDefault">Default max tokens</Label>
            <Input id="maxTokensDefault" type="number" step="100" min={100} max={64000} value={form.maxTokensDefault}
              onChange={(e) => setForm({ ...form, maxTokensDefault: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="platformDisclaimer">Platform disclaimer</Label>
            <Textarea id="platformDisclaimer" rows={2} value={form.platformDisclaimer}
              onChange={(e) => setForm({ ...form, platformDisclaimer: e.target.value })}
              placeholder="Compliance disclaimer appended to every conversation." />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            disabled={upsert.isPending}
            onClick={() => upsert.mutate({
              baseSystemPrompt: form.baseSystemPrompt || undefined,
              defaultTone: form.defaultTone || undefined,
              defaultResponseFormat: form.defaultResponseFormat || undefined,
              defaultResponseLength: form.defaultResponseLength || undefined,
              platformDisclaimer: form.platformDisclaimer || undefined,
              temperatureDefault: form.temperatureDefault ? Number(form.temperatureDefault) : undefined,
              maxTokensDefault: form.maxTokensDefault ? Number(form.maxTokensDefault) : undefined,
            })}
          >
            <Save className="w-4 h-4 mr-1" /> Save platform defaults
          </Button>
        </CardFooter>
      </Card>
    </StewardshipPageShell>
  );
}
