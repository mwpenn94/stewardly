/**
 * MyContent.tsx — R14.14
 *
 * "My AI-Generated Content" page. Lists every piece of AI-authored study
 * material the current user has produced (questions, flashcards, cases,
 * definitions), with full CRUD and a version-history side panel that lets
 * the user roll back to any prior version. Admins can flip a switch to view
 * everyone's content (cross-hierarchy version control).
 *
 * Routes: /my-content
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  History, Pencil, Trash2, RotateCcw, Sparkles, Loader2, FileText,
  HelpCircle, Layers, ScrollText, BookOpen,
} from "lucide-react";
import { toast } from "sonner";

type Kind = "question" | "flashcard" | "case" | "definition";

const KIND_META: Record<Kind, { label: string; icon: any; titleField: string }> = {
  question: { label: "Practice questions", icon: HelpCircle, titleField: "prompt" },
  flashcard: { label: "Flashcards", icon: Layers, titleField: "term" },
  case: { label: "Cases", icon: ScrollText, titleField: "title" },
  definition: { label: "Definitions", icon: BookOpen, titleField: "term" },
};

export default function MyContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [kind, setKind] = useState<Kind>("question");
  const [includeAll, setIncludeAll] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [historyRow, setHistoryRow] = useState<any | null>(null);

  const list = trpc.myContent.list.useQuery({ kind, includeAll: isAdmin && includeAll });
  const utils = trpc.useUtils();
  const updateMut = trpc.myContent.update.useMutation({
    onSuccess: () => { utils.myContent.list.invalidate(); toast.success("Saved"); setEditingRow(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.myContent.delete.useMutation({
    onSuccess: () => { utils.myContent.list.invalidate(); toast.success("Archived"); },
    onError: (e) => toast.error(e.message),
  });
  const regenMut = trpc.myContent.regenerateQuestion.useMutation({
    onSuccess: () => { utils.myContent.list.invalidate(); toast.success("Regenerated"); },
    onError: (e) => toast.error(e.message),
  });

  const meta = KIND_META[kind];
  const Icon = meta.icon;

  return (
    <>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              My AI Content
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Edit, regenerate, archive, and roll back any study material you've created with AI.
              Every change is versioned — you can always restore a previous version.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Switch id="include-all" checked={includeAll} onCheckedChange={setIncludeAll} />
              <Label htmlFor="include-all" className="text-xs">Show everyone's content (admin)</Label>
            </div>
          )}
        </div>

        <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
          <TabsList>
            {(Object.keys(KIND_META) as Kind[]).map((k) => {
              const I = KIND_META[k].icon;
              return (
                <TabsTrigger key={k} value={k} className="gap-1.5">
                  <I className="w-3.5 h-3.5" /> {KIND_META[k].label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(KIND_META) as Kind[]).map((k) => (
            <TabsContent key={k} value={k} className="mt-4">
              {list.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : !list.data || list.data.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center text-sm text-muted-foreground py-12">
                    <Icon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    No AI {meta.label.toLowerCase()} yet.{" "}
                    Generate some from the Learning page; they'll appear here.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {list.data.map((row: any) => {
                    const headline =
                      row[meta.titleField] ||
                      row.term ||
                      row.title ||
                      row.prompt ||
                      "(untitled)";
                    return (
                      <Card key={row.id} className="hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm leading-snug line-clamp-2 flex items-start gap-2">
                            <Icon className="w-4 h-4 text-primary flex-none mt-0.5" />
                            <span>{headline}</span>
                          </CardTitle>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
                            {row.source && <Badge variant="outline" className="text-[9px] py-0">{row.source}</Badge>}
                            {row.status && <Badge variant="outline" className="text-[9px] py-0">{row.status}</Badge>}
                            {row.difficulty && <Badge variant="outline" className="text-[9px] py-0">{row.difficulty}</Badge>}
                            {includeAll && row.createdBy && row.createdBy !== user?.id && (
                              <Badge variant="secondary" className="text-[9px] py-0">user #{row.createdBy}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex items-center gap-1 flex-wrap">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingRow(row)}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setHistoryRow(row)}>
                            <History className="w-3 h-3 mr-1" /> History
                          </Button>
                          {kind === "question" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              disabled={regenMut.isPending}
                              onClick={() => regenMut.mutate({ id: row.id })}
                            >
                              <Sparkles className="w-3 h-3 mr-1" /> Regenerate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMut.mutate({ kind, id: row.id })}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Archive
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <EditDialog
        kind={kind}
        row={editingRow}
        open={!!editingRow}
        onClose={() => setEditingRow(null)}
        onSave={(patch, reason) =>
          updateMut.mutate({ kind, id: editingRow.id, patch, reason })
        }
        saving={updateMut.isPending}
      />

      <HistorySheet
        kind={kind}
        row={historyRow}
        open={!!historyRow}
        onClose={() => setHistoryRow(null)}
      />
    </>
  );
}

function EditDialog({
  kind, row, open, onClose, onSave, saving,
}: {
  kind: Kind; row: any | null; open: boolean; onClose: () => void;
  onSave: (patch: any, reason?: string) => void; saving: boolean;
}) {
  const [patch, setPatch] = useState<any>({});
  const [reason, setReason] = useState("");
  // Reset when row changes
  useState(() => { setPatch({}); setReason(""); return null; });
  if (!row) return null;
  const fields: Record<Kind, { key: string; label: string; multiline?: boolean }[]> = {
    question: [
      { key: "prompt", label: "Prompt", multiline: true },
      { key: "explanation", label: "Explanation", multiline: true },
    ],
    flashcard: [
      { key: "term", label: "Term" },
      { key: "definition", label: "Definition", multiline: true },
    ],
    case: [
      { key: "title", label: "Title" },
      { key: "content", label: "Content", multiline: true },
    ],
    definition: [
      { key: "term", label: "Term" },
      { key: "definition", label: "Definition", multiline: true },
    ],
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {KIND_META[kind].label.slice(0, -1)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields[kind].map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              {f.multiline ? (
                <Textarea
                  defaultValue={row[f.key] ?? ""}
                  onChange={(e) => setPatch((p: any) => ({ ...p, [f.key]: e.target.value }))}
                  rows={f.key === "content" || f.key === "explanation" ? 6 : 3}
                />
              ) : (
                <Input
                  defaultValue={row[f.key] ?? ""}
                  onChange={(e) => setPatch((p: any) => ({ ...p, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs">Reason (optional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fixed typo" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(patch, reason || undefined)}
            disabled={saving || Object.keys(patch).length === 0}
          >
            {saving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Save version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySheet({
  kind, row, open, onClose,
}: { kind: Kind; row: any | null; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const history = trpc.myContent.history.useQuery(
    { kind, id: row?.id ?? 0 },
    { enabled: open && !!row },
  );
  const rollbackMut = trpc.myContent.rollback.useMutation({
    onSuccess: () => {
      utils.myContent.list.invalidate();
      utils.myContent.history.invalidate();
      toast.success("Rolled back to previous version");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-4 h-4" /> Version history
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {history.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {history.data?.history?.length === 0 && (
            <p className="text-sm text-muted-foreground">No edits recorded yet.</p>
          )}
          {history.data?.history?.map((h: any) => (
            <Card key={h.id} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  <span className="capitalize">{h.action}</span>
                  <span className="text-muted-foreground text-[10px] font-normal">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </CardTitle>
                {h.changeReason && (
                  <p className="text-[11px] text-muted-foreground italic">{h.changeReason}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {h.previousData && (
                  <details className="text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer">View previous</summary>
                    <pre className="mt-1 p-2 bg-secondary/50 rounded text-[10px] overflow-x-auto">
                      {JSON.stringify(h.previousData, null, 2)}
                    </pre>
                  </details>
                )}
                {h.action !== "create" && h.previousData && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => rollbackMut.mutate({ kind, historyId: h.id })}
                    disabled={rollbackMut.isPending}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Restore this version
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
