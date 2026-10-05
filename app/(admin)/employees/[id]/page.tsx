import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import {
  Employee, OnboardingInstance, OnboardingStep, OnboardingToken,
  DocumentSubmission, AssessmentAttempt, Review, ActivityLog, OfferLetter, Policy, User,
} from "@/models";
import { plain } from "@/lib/utils";
import { EmployeeDetailView, type EmployeeDetail, type ManagerOption } from "@/components/admin/employee-detail-view";
import type { OnboardingStatus, StepStatus, UserRole } from "@/types";

export const metadata = { title: "Employee" };
export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCapability("employees");
  const { id } = await params;
  await dbConnect();

  const employee = await Employee.findById(id)
    .populate<{ department: { name: string } }>("department", "name")
    .populate<{ role: { title: string } }>("role", "title")
    .lean()
    .catch(() => null);
  if (!employee) notFound();

  const instance = employee.instance ? await OnboardingInstance.findById(employee.instance).lean() : null;

  const [steps, tokens, submissions, attempts, reviews, activity, offer, policies, managers] = await Promise.all([
    instance ? OnboardingStep.find({ instance: instance._id }).sort({ order: 1 }).lean() : [],
    instance ? OnboardingToken.find({ instance: instance._id }).sort({ createdAt: -1 }).lean() : [],
    instance ? DocumentSubmission.find({ instance: instance._id }).sort({ createdAt: -1 }).lean() : [],
    instance ? AssessmentAttempt.find({ instance: instance._id }).sort({ submittedAt: -1 }).lean() : [],
    instance ? Review.find({ instance: instance._id }).sort({ type: 1 }).lean() : [],
    ActivityLog.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(100).lean(),
    OfferLetter.findOne({ employee: employee._id }).lean(),
    Policy.find({ status: "published" }).select("title category").sort({ title: 1 }).lean(),
    User.find({ status: "active" }).select("name role").sort({ name: 1 }).lean(),
  ]);

  const now = Date.now();
  const activeToken = tokens.find((t) => t.status === "active");
  let linkStatus: "active" | "expired" | "revoked" | "none" = "none";
  if (activeToken) linkStatus = new Date(activeToken.expiresAt).getTime() < now ? "expired" : "active";
  else if (tokens.some((t) => t.status === "revoked")) linkStatus = "revoked";

  const detail: EmployeeDetail = {
    employee: {
      _id: String(employee._id),
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone ?? "",
      employeeCode: employee.employeeCode,
      department: (employee.department as { name?: string })?.name ?? "—",
      role: (employee.role as { title?: string })?.title ?? "—",
      reportingManager: employee.reportingManager ? String(employee.reportingManager) : "",
      reportingManagerName: employee.reportingManagerName ?? "",
      joiningDate: (employee.joiningDate as Date).toISOString(),
      employmentType: employee.employmentType,
      workMode: employee.workMode,
      profile: (employee.profile ?? {}) as Record<string, unknown>,
      passwordSetAt: employee.portalPasswordSetAt ? (employee.portalPasswordSetAt as Date).toISOString() : null,
      employmentStatus: (employee.status ?? "active") as "active" | "archived" | "past",
      tenureEndedAt: employee.tenureEndedAt ? (employee.tenureEndedAt as Date).toISOString() : null,
      tenureEndReason: employee.tenureEndReason ?? "",
    },
    instance: instance
      ? {
          _id: String(instance._id),
          status: instance.status as OnboardingStatus,
          progress: instance.progress,
          startedAt: instance.startedAt ? (instance.startedAt as Date).toISOString() : null,
          firstOpenedAt: instance.firstOpenedAt ? (instance.firstOpenedAt as Date).toISOString() : null,
          invitationSentAt: instance.invitationSentAt ? (instance.invitationSentAt as Date).toISOString() : null,
          completedAt: instance.completedAt ? (instance.completedAt as Date).toISOString() : null,
          createdAt: (instance.createdAt as Date).toISOString(),
          finalChecklist: (instance.finalChecklist ?? []).map((c) => ({ label: c.label, checked: c.checked })),
        }
      : null,
    link: {
      status: linkStatus,
      expiresAt: activeToken ? new Date(activeToken.expiresAt).toISOString() : null,
      firstOpenedAt: activeToken?.firstOpenedAt ? new Date(activeToken.firstOpenedAt).toISOString() : null,
      lastAccessedAt: activeToken?.lastAccessedAt ? new Date(activeToken.lastAccessedAt).toISOString() : null,
      openCount: activeToken?.openCount ?? 0,
    },
    steps: steps.map((s) => ({
      _id: String(s._id),
      section: s.section,
      kind: s.kind,
      title: s.title,
      required: s.required,
      status: s.status as StepStatus,
      version: s.version ?? "",
    })),
    submissions: submissions.map((s) => ({
      _id: String(s._id),
      stepId: String(s.step),
      documentName: s.documentName,
      fileId: String(s.fileId),
      fileName: s.fileName,
      mimeType: s.mimeType,
      size: s.size,
      status: s.status,
      rejectionReason: s.rejectionReason ?? "",
      reviewedByName: s.reviewedByName ?? "",
      uploadedAt: (s.createdAt as Date).toISOString(),
    })),
    attempts: attempts.map((a) => ({
      _id: String(a._id),
      stepId: String(a.step),
      attemptNumber: a.attemptNumber,
      score: a.score,
      passed: a.passed,
      submittedAt: (a.submittedAt as Date).toISOString(),
    })),
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      type: r.type,
      dueDate: (r.dueDate as Date).toISOString(),
      status: r.status,
      goals: r.goals ?? "",
      performance: r.performance ?? "",
      strengths: r.strengths ?? "",
      improvements: r.improvements ?? "",
      feedback: r.feedback ?? "",
      nextObjectives: r.nextObjectives ?? "",
      managerComments: r.managerComments ?? "",
      reviewerName: r.reviewerName ?? "",
      completedAt: r.completedAt ? (r.completedAt as Date).toISOString() : null,
    })),
    activity: activity.map((a) => ({
      _id: String(a._id),
      actorName: a.actorName,
      actorType: a.actorType,
      action: a.action,
      message: a.message,
      createdAt: (a.createdAt as Date).toISOString(),
    })),
    offer: offer
      ? {
          status: offer.status,
          ctcAnnual: offer.ctcAnnual,
          currency: offer.currency,
          location: offer.location ?? "",
          offerDate: (offer.offerDate as Date).toISOString(),
          responseByDate: offer.responseByDate ? (offer.responseByDate as Date).toISOString() : null,
          issuedByName: offer.issuedByName ?? "",
          acceptedAt: offer.acceptedAt ? (offer.acceptedAt as Date).toISOString() : null,
          fileId: String(offer.fileId),
          fileName: offer.fileName ?? "",
          source: (offer.source ?? "generated") as "generated" | "uploaded",
          terms: offer.terms ?? [],
        }
      : null,
    policies: policies.map((p) => ({
      _id: String(p._id),
      title: p.title,
      category: p.category,
    })),
  };

  const managerOptions: ManagerOption[] = managers.map((m) => ({
    _id: String(m._id),
    name: m.name,
    role: m.role as UserRole,
  }));

  return <EmployeeDetailView detail={plain(detail)} managers={plain(managerOptions)} />;
}
