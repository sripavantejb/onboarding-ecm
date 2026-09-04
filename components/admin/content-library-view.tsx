"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Library, Plus, Search, FileEdit, CheckCircle2, Archive } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONTENT_CATEGORIES } from "@/types";
import { formatDate } from "@/lib/utils";
import { createContent } from "@/actions/content";

export interface ContentDTO {
  _id: string;
  title: string;
  category: string;
  summary: string;
  status: "draft" | "published" | "archived";
  version: string;
  hasDraft: boolean;
  updatedAt: string;
}

export function ContentLibraryView({ items }: { items: ContentDTO[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [creating, setCreating] = React.useState(false);

  const categories = React.useMemo(
    () => ["all", ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );

  const filtered = items.filter((i) => {
    const matchQ = !query || i.title.toLowerCase().includes(query.toLowerCase()) || i.summary.toLowerCase().includes(query.toLowerCase());
    const matchC = category === "all" || i.category === category;
    return matchQ && matchC;
  });

  const grouped = Array.from(new Set(filtered.map((i) => i.category))).map((cat) => ({
    category: cat,
    items: filtered.filter((i) => i.category === cat),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Library"
        description="Author onboarding content once. Publish versions; new employees always get the latest."
        actions={<Button variant="brand" onClick={() => setCreating(true)}><Plus /> New content</Button>}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content…" className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => <SelectItem key={c} value={c}>{c === "all" ? "All categories" : c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Library} title="No content found" description="Try a different search, or create new content." />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.category} className="space-y-2">
              <h2 className="text-sm font-semibold">{g.category}</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {g.items.map((c) => (
                  <Link key={c._id} href={`/content/${c._id}`}>
                    <Card className="h-full p-4 transition-colors hover:border-brand/40 hover:bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight">{c.title}</p>
                        <StatusPill status={c.status} hasDraft={c.hasDraft} />
                      </div>
                      {c.summary && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>}
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{c.status === "published" ? `v${c.version}` : "Unpublished"}</span>
                        <span>·</span>
                        <span>Updated {formatDate(c.updatedAt)}</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateContentDialog open={creating} onOpenChange={setCreating} onCreated={(id) => router.push(`/content/${id}`)} />
    </div>
  );
}

function StatusPill({ status, hasDraft }: { status: string; hasDraft: boolean }) {
  if (status === "archived") return <Badge variant="muted"><Archive className="h-3 w-3" /> Archived</Badge>;
  if (status === "published")
    return hasDraft ? (
      <Badge variant="warning"><FileEdit className="h-3 w-3" /> Draft changes</Badge>
    ) : (
      <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Published</Badge>
    );
  return <Badge variant="brand"><FileEdit className="h-3 w-3" /> Draft</Badge>;
}

function CreateContentDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<string>(CONTENT_CATEGORIES[0]);
  const [summary, setSummary] = React.useState("");
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) { setTitle(""); setCategory(CONTENT_CATEGORIES[0]); setSummary(""); }
  }, [open]);

  function submit() {
    start(async () => {
      const res = await createContent({ title, category, summary, body: "" });
      if (res.ok && res.data) { toast.success(res.message); onOpenChange(false); onCreated(res.data.id); }
      else if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New content</DialogTitle>
          <DialogDescription>Create a module, then write and publish it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Working at Editco" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-summary">Summary</Label>
            <Textarea id="c-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One line describing this content" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="brand" onClick={submit} disabled={pending || title.trim().length < 2}>
            {pending ? "Creating…" : "Create & edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
