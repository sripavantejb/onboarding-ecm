import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Assessment } from "@/models";
import { plain } from "@/lib/utils";
import { AssessmentsView, type AssessmentDTO } from "@/components/admin/assessments-view";

export const metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  await requireCapability("assessments");
  await dbConnect();

  const assessments = await Assessment.find().sort({ category: 1, title: 1 }).lean();

  const data: AssessmentDTO[] = assessments.map((a) => ({
    _id: String(a._id),
    title: a.title,
    key: a.key,
    description: a.description ?? "",
    category: a.category,
    passingScore: a.passingScore,
    maxAttempts: a.maxAttempts,
    questions: (a.questions ?? []).map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? [],
      correctIndex: q.correctIndex ?? 0,
      correctText: q.correctText ?? "",
      points: q.points ?? 1,
    })),
    status: a.status,
  }));

  return <AssessmentsView assessments={plain(data)} />;
}
