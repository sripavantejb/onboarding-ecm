"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { DocumentSubmission, OnboardingStep } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { recomputeInstance } from "@/lib/instance-state";
import { logActivity, notify } from "@/lib/activity";

export async function approveDocument(submissionId: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("documents");
    await dbConnect();
    const sub = await DocumentSubmission.findById(submissionId);
    if (!sub) return fail("Submission not found.");
    sub.status = "approved";
    sub.reviewedByName = user.name;
    sub.reviewedAt = new Date();
    sub.rejectionReason = "";
    await sub.save();

    const step = await OnboardingStep.findById(sub.step);
    if (step) {
      step.status = "approved";
      step.completedAt = new Date();
      await step.save();
      await recomputeInstance(step.instance);
    }
    await logActivity({
      actorType: "admin", actorName: user.name, action: "document.approved",
      message: `Approved document “${sub.documentName}”`,
      employee: sub.employee, instance: sub.instance, resourceType: "DocumentSubmission", resourceId: sub._id,
    });
    await notify({
      audience: "employee", type: "document.approved", title: "Document approved",
      message: `Your “${sub.documentName}” was approved.`, employee: sub.employee, instance: sub.instance,
      email: {
        heading: "Document approved ✅",
        intro: `Good news — your “${sub.documentName}” has been reviewed and approved. No further action is needed for this item.`,
        footerNote: "Sign in to your onboarding portal to continue with any remaining steps.",
      },
    });
    revalidatePath(`/employees/${sub.employee}`);
    revalidatePath("/documents");
    return ok(undefined, "Document approved");
  });
}

const rejectSchema = z.object({ reason: z.string().min(3, "Please give a short reason").max(500) });

export async function rejectDocument(submissionId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("documents");
    const parsed = rejectSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    const sub = await DocumentSubmission.findById(submissionId);
    if (!sub) return fail("Submission not found.");
    sub.status = "rejected";
    sub.reviewedByName = user.name;
    sub.reviewedAt = new Date();
    sub.rejectionReason = parsed.data.reason;
    await sub.save();

    const step = await OnboardingStep.findById(sub.step);
    if (step) {
      step.status = "rejected";
      step.completedAt = null;
      await step.save();
      await recomputeInstance(step.instance);
    }
    await logActivity({
      actorType: "admin", actorName: user.name, action: "document.rejected",
      message: `Rejected document “${sub.documentName}” — ${parsed.data.reason}`,
      employee: sub.employee, instance: sub.instance, resourceType: "DocumentSubmission", resourceId: sub._id,
    });
    await notify({
      audience: "employee", type: "document.rejected", title: "Document needs attention",
      message: `Your “${sub.documentName}” was rejected: ${parsed.data.reason}`, employee: sub.employee, instance: sub.instance,
      email: {
        heading: "Action needed on your document",
        intro: `Your “${sub.documentName}” was reviewed but couldn't be approved. Reason: ${parsed.data.reason}. Please sign in and re-upload a corrected version.`,
        footerNote: "Sign in to your onboarding portal to re-upload this document.",
      },
    });
    revalidatePath(`/employees/${sub.employee}`);
    revalidatePath("/documents");
    return ok(undefined, "Document rejected — employee notified");
  });
}
