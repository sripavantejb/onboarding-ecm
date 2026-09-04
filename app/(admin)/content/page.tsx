import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Content, ContentVersion } from "@/models";
import { plain } from "@/lib/utils";
import { ContentLibraryView, type ContentDTO } from "@/components/admin/content-library-view";

export const metadata = { title: "Content Library" };
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await requireCapability("content");
  await dbConnect();

  const items = await Content.find().sort({ category: 1, title: 1 }).lean();
  const publishedIds = items
    .map((c) => c.latestPublished)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const versions = await ContentVersion.find({ _id: { $in: publishedIds } }).select("version").lean();
  const vMap = new Map(versions.map((v) => [String(v._id), v.version]));

  const data: ContentDTO[] = items.map((c) => ({
    _id: String(c._id),
    title: c.title,
    category: c.category,
    summary: c.summary ?? "",
    status: c.status,
    version: c.latestPublished ? (vMap.get(String(c.latestPublished)) ?? "—") : "—",
    hasDraft: !!c.currentDraft,
    updatedAt: (c.updatedAt as Date).toISOString(),
  }));

  return <ContentLibraryView items={plain(data)} />;
}
