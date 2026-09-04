import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { OnboardingInstance, Employee, Review, DocumentSubmission, OnboardingStep, AssessmentAttempt } from "@/models";
import { plain } from "@/lib/utils";
import { AnalyticsView, type AnalyticsData } from "@/components/admin/analytics-view";
import { ONBOARDING_STATUSES, ONBOARDING_STATUS_LABELS, type OnboardingStatus } from "@/types";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireCapability("analytics");
  await dbConnect();

  const [instances, statusAgg, deptAgg, docStepTotal, docApproved, assessmentAttempts, overdueReviews, upcomingJoiners] =
    await Promise.all([
      OnboardingInstance.find().select("status progress createdAt completedAt departmentName").lean(),
      OnboardingInstance.aggregate<{ _id: OnboardingStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      OnboardingInstance.aggregate<{ _id: string; total: number; completed: number; avgProgress: number }>([
        {
          $group: {
            _id: "$departmentName",
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            avgProgress: { $avg: "$progress" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      OnboardingStep.countDocuments({ kind: "document", required: true }),
      DocumentSubmission.countDocuments({ status: "approved" }),
      AssessmentAttempt.find().select("passed").lean(),
      Review.countDocuments({ status: "pending", dueDate: { $lt: new Date() } }),
      Employee.countDocuments({ status: "active", joiningDate: { $gte: startOfToday() } }),
    ]);

  const statusCounts: Record<string, number> = {};
  for (const s of statusAgg) statusCounts[s._id] = s.count;

  const completedInstances = instances.filter((i) => i.completedAt);
  const avgDays =
    completedInstances.length > 0
      ? completedInstances.reduce((sum, i) => sum + ((i.completedAt as Date).getTime() - (i.createdAt as Date).getTime()), 0) /
        completedInstances.length /
        (1000 * 60 * 60 * 24)
      : 0;

  const passedAttempts = assessmentAttempts.filter((a) => a.passed).length;

  const data: AnalyticsData = {
    total: instances.length,
    completed: statusCounts.completed ?? 0,
    inProgress: statusCounts.in_progress ?? 0,
    notStarted: statusCounts.not_started ?? 0,
    avgCompletionDays: Math.round(avgDays * 10) / 10,
    docCompletionRate: docStepTotal > 0 ? Math.round((docApproved / docStepTotal) * 100) : 0,
    assessmentPassRate: assessmentAttempts.length > 0 ? Math.round((passedAttempts / assessmentAttempts.length) * 100) : 0,
    overdueReviews,
    upcomingJoiners,
    statusDistribution: ONBOARDING_STATUSES.map((s) => ({ name: ONBOARDING_STATUS_LABELS[s], key: s, value: statusCounts[s] ?? 0 })),
    departmentStats: deptAgg.map((d) => ({
      department: d._id || "Unassigned",
      total: d.total,
      completed: d.completed,
      completionRate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
      avgProgress: Math.round(d.avgProgress ?? 0),
    })),
  };

  return <AnalyticsView data={plain(data)} />;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
