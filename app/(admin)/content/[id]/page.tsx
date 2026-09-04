import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Content, ContentVersion } from "@/models";
import { plain } from "@/lib/utils";
import { ContentEditorView, type ContentEditorData } from "@/components/admin/content-editor-view";

export const metadata = { title: "Edit content" };
export const dynamic = "force-dynamic";

export default async function ContentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("content");
  const { id } = await params;
  await dbConnect();

  const content = await Content.findById(id).lean().catch(() => null);
  if (!content) notFound();

  const [draft, published, versions] = await Promise.all([
    content.currentDraft ? ContentVersion.findById(content.currentDraft).lean() : null,
    content.latestPublished ? ContentVersion.findById(content.latestPublished).lean() : null,
    ContentVersion.find({ content: content._id }).sort({ versionNumber: -1 }).lean(),
  ]);

  const editable = draft ?? published;

  const data: ContentEditorData = {
    _id: String(content._id),
    title: content.title,
    category: content.category,
    summary: content.summary ?? "",
    status: content.status,
    hasDraft: !!content.currentDraft,
    body: editable?.body ?? "",
    publishedVersion: published?.version ?? null,
    versions: versions.map((v) => ({
      _id: String(v._id),
      version: v.version,
      status: v.status,
      publishedAt: v.publishedAt ? (v.publishedAt as Date).toISOString() : null,
      updatedAt: (v.updatedAt as Date).toISOString(),
      updatedByName: v.updatedByName ?? "",
    })),
  };

  return <ContentEditorView data={plain(data)} />;
}
