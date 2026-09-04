"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Send, Archive, ArchiveRestore, History, Eye, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichEditor } from "@/components/editor/rich-editor";
import { RichText } from "@/components/rich-text";
import { CONTENT_CATEGORIES } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { saveContentDraft, publishContent, setContentArchived } from "@/actions/content";

export interface ContentEditorData {
  _id: string;
  title: string;
  category: string;
  summary: string;
  status: "draft" | "published" | "archived";
  hasDraft: boolean;
  body: string;
  publishedVersion: string | null;
  versions: {
    _id: string;
    version: string;
    status: string;
    publishedAt: string | null;
    updatedAt: string;
    updatedByName: string;
  }[];
}

export function ContentEditorView({ data }: { data: ContentEditorData }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(data.title);
  const [category, setCategory] = React.useState(data.category);
  const [summary, setSummary] = React.useState(data.summary);
  const [body, setBody] = React.useState(data.body);
  const [dirty, setDirty] = React.useState(false);
  const [pending, start] = React.useTransition();

  const categoryOptions = Array.from(new Set([...CONTENT_CATEGORIES, data.category]));

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setDirty(true); };
  }

  function save() {
    start(async () => {
      const res = await saveContentDraft(data._id, { title, category, summary, body });
      if (res.ok) { toast.success(res.message); setDirty(false); router.refresh(); } else toast.error(res.error);
    });
  }
  function publish() {
    start(async () => {
      // Save any pending edits first so we publish the latest.
      if (dirty) {
        const saveRes = await saveContentDraft(data._id, { title, category, summary, body });
        if (!saveRes.ok) { toast.error(saveRes.error); return; }
        setDirty(false);
      }
      const res = await publishContent(data._id);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  }
  function archive(archived: boolean) {
    start(async () => {
      const res = await setContentArchived(data._id, archived);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  }

  const canPublish = dirty || data.hasDraft;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/content"><ArrowLeft /></Link></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{title || "Untitled"}</h1>
              {data.status === "published" && !data.hasDraft && <Badge variant="success">Published v{data.publishedVersion}</Badge>}
              {data.hasDraft && <Badge variant="warning"><FileEdit className="h-3 w-3" /> Unpublished changes</Badge>}
              {data.status === "draft" && !data.hasDraft && <Badge variant="brand">Draft</Badge>}
              {data.status === "archived" && <Badge variant="muted">Archived</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{data.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.status === "archived" ? (
            <Button variant="outline" onClick={() => archive(false)} disabled={pending}><ArchiveRestore /> Restore</Button>
          ) : (
            <Button variant="outline" onClick={() => archive(true)} disabled={pending}><Archive /> Archive</Button>
          )}
          <Button variant="outline" onClick={save} disabled={pending || !dirty}><Save /> Save draft</Button>
          <Button variant="brand" onClick={publish} disabled={pending || !canPublish}><Send /> Publish</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => markDirty(setTitle)(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={markDirty(setCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" value={summary} onChange={(e) => markDirty(setSummary)(e.target.value)} className="min-h-0 h-16" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="edit">
            <TabsList>
              <TabsTrigger value="edit"><FileEdit className="mr-1.5 h-4 w-4" /> Edit</TabsTrigger>
              <TabsTrigger value="preview"><Eye className="mr-1.5 h-4 w-4" /> Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <RichEditor value={body} onChange={markDirty(setBody)} />
            </TabsContent>
            <TabsContent value="preview">
              <Card><CardContent className="pt-5"><RichText html={body} /></CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><History className="h-4 w-4" /> Version history</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.versions.length === 0 && <p className="text-sm text-muted-foreground">No versions yet.</p>}
            {data.versions.map((v) => (
              <div key={v._id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">v{v.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.status === "published" && v.publishedAt ? `Published ${formatDateTime(v.publishedAt)}` : `Edited ${formatDateTime(v.updatedAt)}`}
                  </p>
                  {v.updatedByName && <p className="text-xs text-muted-foreground/70">by {v.updatedByName}</p>}
                </div>
                <Badge variant={v.status === "published" ? "success" : v.status === "draft" ? "brand" : "muted"}>{v.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
