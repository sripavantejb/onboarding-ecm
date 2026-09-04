import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Policy, PolicyVersion } from "@/models";
import { plain } from "@/lib/utils";
import { PolicyEditorView, type PolicyEditorData } from "@/components/admin/policy-editor-view";

export const metadata = { title: "Edit policy" };
export const dynamic = "force-dynamic";

export default async function PolicyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("policies");
  const { id } = await params;
  await dbConnect();

  const policy = await Policy.findById(id).lean().catch(() => null);
  if (!policy) notFound();

  const [draft, published, versions] = await Promise.all([
    PolicyVersion.findOne({ policy: policy._id, status: "draft" }).sort({ versionNumber: -1 }).lean(),
    policy.latestPublished ? PolicyVersion.findById(policy.latestPublished).lean() : null,
    PolicyVersion.find({ policy: policy._id }).sort({ versionNumber: -1 }).lean(),
  ]);

  const editable = draft ?? published;

  const data: PolicyEditorData = {
    _id: String(policy._id),
    title: policy.title,
    category: policy.category,
    description: policy.description ?? "",
    status: policy.status,
    hasDraft: !!draft,
    body: editable?.body ?? "",
    effectiveDate: editable?.effectiveDate ? (editable.effectiveDate as Date).toISOString() : new Date().toISOString(),
    publishedVersion: published?.version ?? null,
    versions: versions.map((v) => ({
      _id: String(v._id),
      version: v.version,
      status: v.status,
      publishedAt: v.publishedAt ? (v.publishedAt as Date).toISOString() : null,
      updatedAt: (v.updatedAt as Date).toISOString(),
      effectiveDate: v.effectiveDate ? (v.effectiveDate as Date).toISOString() : null,
    })),
  };

  return <PolicyEditorView data={plain(data)} />;
}
