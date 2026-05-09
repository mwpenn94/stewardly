/**
 * AdminContentReview.tsx — R14.14
 *
 * Admin-only review queue for user-authored AI study material with one-click
 * adoption into the canonical hierarchy and a global edit-history feed.
 *
 * Route: /admin/content-review
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, Check, X, Loader2, History, ChevronRight,
  HelpCircle, Layers, ScrollText, BookOpen,
} from "lucide-react";
import { toast } from "sonner";

type Kind = "question" | "flashcard" | "case" | "definition";
const KIND_META: Record<Kind, { label: string; icon: any }> = {
  question: { label: "Questions", icon: HelpCircle },
  flashcard: { label: "Flashcards", icon: Layers },
  case: { label: "Cases", icon: ScrollText },
  definition: { label: "Definitions", icon: BookOpen },
};

export default function AdminContentReview() {
  const [kind, setKind] = useState<Kind>("question");
  const [trackId, setTrackId] = useState<string>("");
  const [chapterId, setChapterId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");

  const queue = trpc.adminAdoption.reviewQueue.useQuery({ kind });
  const recent = trpc.adminAdoption.recentChanges.useQuery({ limit: 30 });
  const utils = trpc.useUtils();

  const adoptMut = trpc.adminAdoption.adopt.useMutation({
    onSuccess: () => {
      utils.adminAdoption.reviewQueue.invalidate();
      utils.adminAdoption.recentChanges.invalidate();
      toast.success("Adopted into canonical hierarchy");
    },
    onError: (e) => toast.error(e.message),
  });
  const rejectMut = trpc.adminAdoption.reject.useMutation({
    onSuccess: () => {
      utils.adminAdoption.reviewQueue.invalidate();
      utils.adminAdoption.recentChanges.invalidate();
      toast.success("Rejected");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Admin Content Review
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review user-authored AI study material. Adopt promotes content into the canonical hierarchy at the
            track / chapter / section IDs you specify; rejection marks the row archived but keeps full version history.
          </p>
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
            <TabsContent key={k} value={k} className="mt-4 space-y-4">
              <Card className="bg-secondary/40 border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Hierarchy attachment (optional)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="Track ID" type="number" />
                  <Input value={chapterId} onChange={(e) => setChapterId(e.target.value)} placeholder="Chapter ID" type="number" />
                  <Input value={sectionId} onChange={(e) => setSectionId(e.target.value)} placeholder="Section ID" type="number" />
                </CardContent>
              </Card>

              {queue.isLoading ? (
                <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading queue…
                </div>
              ) : !queue.data || queue.data.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center text-sm text-muted-foreground py-12">
                    Nothing in the review queue.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {queue.data.map((row: any) => (
                    <Card key={row.id} className="hover:border-primary/40">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-snug font-medium truncate">
                              {row.prompt || row.term || row.title || "(untitled)"}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap mt-1">
                              <Badge variant="outline" className="text-[9px] py-0">user #{row.createdBy ?? "?"}</Badge>
                              <Badge variant="outline" className="text-[9px] py-0">{row.status}</Badge>
                              {row.difficulty && <Badge variant="outline" className="text-[9px] py-0">{row.difficulty}</Badge>}
                              {row.trackId && <Badge variant="outline" className="text-[9px] py-0">track {row.trackId}</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8"
                              disabled={adoptMut.isPending}
                              onClick={() =>
                                adoptMut.mutate({
                                  kind: k, id: row.id,
                                  trackId: trackId ? Number(trackId) : undefined,
                                  chapterId: chapterId ? Number(chapterId) : undefined,
                                  sectionId: sectionId ? Number(sectionId) : undefined,
                                })
                              }
                            >
                              <Check className="w-3 h-3 mr-1" /> Adopt
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-destructive"
                              disabled={rejectMut.isPending}
                              onClick={() => rejectMut.mutate({ kind: k, id: row.id })}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Global edit history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Recent edits across all users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recent.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : !recent.data?.length ? (
              <p className="text-sm text-muted-foreground">No recent edits.</p>
            ) : (
              <div className="space-y-1.5">
                {recent.data.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/40 last:border-0">
                    <Badge variant="outline" className="text-[9px] py-0 capitalize">{h.action}</Badge>
                    <span className="text-muted-foreground">{h.contentTable}#{h.contentId}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span>by user #{h.changedBy}</span>
                    <span className="ml-auto text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
