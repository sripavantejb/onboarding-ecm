import { notFound } from "next/navigation";
import { resolvePortal } from "@/lib/portal";
import { employeeAuthedFor } from "@/lib/employee-auth";
import { InvalidLink } from "@/components/portal/invalid-link";
import { PortalLogin } from "@/components/portal/portal-login";
import { PortalShell } from "@/components/portal/portal-shell";
import { dbConnect } from "@/lib/db";
import { OnboardingStep, DocumentSubmission, AssessmentAttempt } from "@/models";
import { plain } from "@/lib/utils";
import { StepView, type StepViewData } from "@/components/portal/step-view";
import type { StepStatus } from "@/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding step", robots: { index: false } };

export default async function StepPage({ params }: { params: Promise<{ token: string; stepId: string }> }) {
  const { token, stepId } = await params;
  const portal = await resolvePortal(token);
  if (!portal.ok) return <InvalidLink reason={portal.reason} />;

  const { instance, employee } = portal;
  if (!(await employeeAuthedFor(employee._id.toString(), instance._id.toString(), employee.portalPasswordSetAt))) {
    return <PortalLogin token={token} />;
  }

  await dbConnect();
  const step = await OnboardingStep.findById(stepId).lean().catch(() => null);
  if (!step || step.instance.toString() !== instance._id.toString()) notFound();

  // Kind-specific extras
  let submission = null;
  let attempts: { attemptNumber: number; score: number; passed: boolean }[] = [];
  let outstanding: string[] = [];

  if (step.kind === "document") {
    const sub = await DocumentSubmission.findOne({ step: step._id }).sort({ createdAt: -1 }).lean();
    if (sub) submission = { status: sub.status, rejectionReason: sub.rejectionReason ?? "", fileName: sub.fileName };
  }
  if (step.kind === "assessment") {
    const list = await AssessmentAttempt.find({ step: step._id }).sort({ attemptNumber: 1 }).lean();
    attempts = list.map((a) => ({ attemptNumber: a.attemptNumber, score: a.score, passed: a.passed }));
  }
  if (step.kind === "checklist") {
    const others = await OnboardingStep.find({
      instance: instance._id, required: true, _id: { $ne: step._id },
      status: { $nin: ["completed", "approved"] },
    }).select("title").lean();
    outstanding = others.map((o) => o.title);
  }

  const data: StepViewData = {
    token,
    stepId: String(step._id),
    kind: step.kind,
    section: step.section,
    title: step.title,
    status: step.status as StepStatus,
    version: step.version ?? "",
    snapshot: (step.snapshot ?? {}) as Record<string, unknown>,
    employment: {
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone ?? "",
      department: instance.departmentName,
      role: instance.roleName,
      reportingManager: employee.reportingManagerName ?? "",
      joiningDate: (employee.joiningDate as Date).toISOString(),
      employmentType: employee.employmentType,
      workMode: employee.workMode,
    },
    profile: (employee.profile ?? {}) as Record<string, unknown>,
    submission,
    attempts,
    outstanding,
    progress: instance.progress,
  };

  return (
    <PortalShell name={employee.fullName} progress={instance.progress} token={token}>
      <StepView data={plain(data)} />
    </PortalShell>
  );
}
