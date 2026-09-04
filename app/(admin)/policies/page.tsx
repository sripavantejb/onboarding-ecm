import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Policy, PolicyVersion } from "@/models";
import { plain } from "@/lib/utils";
import { PoliciesView, type PolicyDTO } from "@/components/admin/policies-view";

export const metadata = { title: "Policies" };
export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  await requireCapability("policies");
  await dbConnect();

  const items = await Policy.find().sort({ category: 1, title: 1 }).lean();
  const publishedIds = items
    .map((p) => p.latestPublished)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const versions = await PolicyVersion.find({ _id: { $in: publishedIds } }).select("version").lean();
  const vMap = new Map(versions.map((v) => [String(v._id), v.version]));

  // A policy has unpublished changes when a draft PolicyVersion exists for it.
  const draftPolicyIds = await PolicyVersion.find({ status: "draft" }).select("policy").lean();
  const draftSet = new Set(draftPolicyIds.map((d) => String(d.policy)));

  const data: PolicyDTO[] = items.map((p) => ({
    _id: String(p._id),
    title: p.title,
    category: p.category,
    description: p.description ?? "",
    status: p.status,
    version: p.latestPublished ? (vMap.get(String(p.latestPublished)) ?? "—") : "—",
    hasDraft: draftSet.has(String(p._id)),
    updatedAt: (p.updatedAt as Date).toISOString(),
  }));

  return <PoliciesView items={plain(data)} />;
}
