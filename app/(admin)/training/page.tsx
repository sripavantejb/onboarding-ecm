import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { TrainingModule } from "@/models";
import { plain } from "@/lib/utils";
import { TrainingView, type TrainingDTO } from "@/components/admin/training-view";

export const metadata = { title: "Training" };
export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  await requireCapability("training");
  await dbConnect();

  const modules = await TrainingModule.find().sort({ category: 1, title: 1 }).lean();

  const data: TrainingDTO[] = modules.map((m) => ({
    _id: String(m._id),
    title: m.title,
    key: m.key,
    description: m.description ?? "",
    category: m.category,
    contentType: m.contentType,
    body: m.body ?? "",
    resourceUrl: m.resourceUrl ?? "",
    checklist: (m.checklist ?? []).map((c) => ({ label: c.label })),
    estimatedMinutes: m.estimatedMinutes,
    status: m.status,
  }));

  return <TrainingView modules={plain(data)} />;
}
