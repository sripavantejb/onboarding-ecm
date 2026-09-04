"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Plus, Pencil, Archive, ArchiveRestore, MoreHorizontal, Search, Trash2, Clock,
} from "lucide-react";
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RichEditor } from "@/components/editor/rich-editor";
import { createTraining, updateTraining, setTrainingArchived } from "@/actions/training";

type ContentType = "text" | "video" | "pdf" | "image" | "external" | "checklist";

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "video", label: "Video" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "external", label: "External link" },
  { value: "checklist", label: "Checklist" },
];

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: "Text",
  video: "Video",
  pdf: "PDF",
  image: "Image",
  external: "External link",
  checklist: "Checklist",
};

const RESOURCE_TYPES: ContentType[] = ["video", "pdf", "image", "external"];

export interface ChecklistItemDTO {
  label: string;
}

export interface TrainingDTO {
  _id: string;
  title: string;
  key: string;
  description: string;
  category: string;
  contentType: ContentType;
  body: string;
  resourceUrl: string;
  checklist: ChecklistItemDTO[];
  estimatedMinutes: number;
  status: "active" | "archived";
}

export function TrainingView({ modules }: { modules: TrainingDTO[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<TrainingDTO | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [archiving, setArchiving] = React.useState<TrainingDTO | null>(null);
  const [pending, start] = React.useTransition();

  const filtered = modules.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  const grouped = Array.from(new Set(filtered.map((m) => m.category))).map((cat) => ({
    category: cat,
    items: filtered.filter((m) => m.category === cat),
  }));

  function toggleArchive(m: TrainingDTO) {
    start(async () => {
      const res = await setTrainingArchived(m._id, m.status === "active");
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else toast.error(res.error);
      setArchiving(null);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training"
        description="Author training modules employees complete during onboarding."
        actions={
          <Button variant="brand" onClick={() => setCreating(true)}>
            <Plus /> New training
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search training…" className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No training modules"
          description="Create a training module to include in onboarding tracks."
          action={<Button variant="brand" onClick={() => setCreating(true)}><Plus /> New training</Button>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.category} className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">{g.category}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((m) => (
                  <Card key={m._id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium leading-tight">{m.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="secondary">{CONTENT_TYPE_LABELS[m.contentType]}</Badge>
                          {m.status === "archived" && <Badge variant="muted"><Archive className="h-3 w-3" /> Archived</Badge>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                          {m.status === "active" ? (
                            <DropdownMenuItem destructive onClick={() => setArchiving(m)}><Archive className="h-4 w-4" /> Archive</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toggleArchive(m)}><ArchiveRestore className="h-4 w-4" /> Restore</DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {m.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
                    <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {m.estimatedMinutes} min
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TrainingDialog
        open={creating || !!editing}
        module={editing}
        onOpenChange={(v) => { if (!v) { setCreating(false); setEditing(null); } }}
        onDone={() => router.refresh()}
      />

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(v) => !v && setArchiving(null)}
        title={`Archive ${archiving?.title}?`}
        description="Archived training is hidden from new onboarding tracks."
        confirmLabel="Archive"
        destructive
        loading={pending}
        onConfirm={() => { if (archiving) toggleArchive(archiving); }}
      />
    </div>
  );
}

function TrainingDialog({
  open, module, onOpenChange, onDone,
}: {
  open: boolean;
  module: TrainingDTO | null;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("General");
  const [description, setDescription] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("text");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState("15");
  const [resourceUrl, setResourceUrl] = React.useState("");
  const [body, setBody] = React.useState("");
  const [checklist, setChecklist] = React.useState<string[]>([]);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setTitle(module?.title ?? "");
      setCategory(module?.category ?? "General");
      setDescription(module?.description ?? "");
      setContentType(module?.contentType ?? "text");
      setEstimatedMinutes(String(module?.estimatedMinutes ?? 15));
      setResourceUrl(module?.resourceUrl ?? "");
      setBody(module?.body ?? "");
      setChecklist(module?.checklist?.map((c) => c.label) ?? []);
    }
  }, [open, module]);

  function updateChecklistItem(i: number, value: string) {
    setChecklist((prev) => prev.map((item, idx) => (idx === i ? value : item)));
  }
  function addChecklistItem() {
    setChecklist((prev) => [...prev, ""]);
  }
  function removeChecklistItem(i: number) {
    setChecklist((prev) => prev.filter((_, idx) => idx !== i));
  }

  function submit() {
    const payload = {
      title,
      category,
      description,
      contentType,
      estimatedMinutes: Number(estimatedMinutes) || 0,
      resourceUrl: RESOURCE_TYPES.includes(contentType) ? resourceUrl : "",
      body: contentType === "text" ? body : "",
      checklist:
        contentType === "checklist"
          ? checklist.map((label) => label.trim()).filter(Boolean).map((label) => ({ label }))
          : [],
    };
    start(async () => {
      const res = module
        ? await updateTraining(module._id, payload)
        : await createTraining(payload);
      if (res.ok) { toast.success(res.message); onOpenChange(false); onDone(); }
      else toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{module ? "Edit training" : "New training"}</DialogTitle>
          <DialogDescription>Training modules are completed by employees during onboarding.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto scrollbar-thin pr-1">
          <div className="space-y-2">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand Guidelines 101" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-category">Category</Label>
              <Input id="t-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. General" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-minutes">Estimated minutes</Label>
              <Input id="t-minutes" type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary of this module" />
          </div>
          <div className="space-y-2">
            <Label>Content type</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {RESOURCE_TYPES.includes(contentType) && (
            <div className="space-y-2">
              <Label htmlFor="t-url">Resource URL</Label>
              <Input id="t-url" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="https://…" />
            </div>
          )}

          {contentType === "text" && (
            <div className="space-y-2">
              <Label>Body</Label>
              <RichEditor value={body} onChange={setBody} />
            </div>
          )}

          {contentType === "checklist" && (
            <div className="space-y-2">
              <Label>Checklist items</Label>
              <div className="space-y-2">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={item} onChange={(e) => updateChecklistItem(i, e.target.value)} placeholder={`Item ${i + 1}`} />
                    <Button variant="ghost" size="icon-sm" onClick={() => removeChecklistItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addChecklistItem}><Plus /> Add item</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button>
          <Button variant="brand" onClick={submit} disabled={pending || title.trim().length < 2 || category.trim().length < 1}>
            {pending ? "Saving…" : module ? "Save changes" : "Create training"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
