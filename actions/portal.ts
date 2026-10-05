"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import {
  OnboardingStep, Employee, PolicyAcknowledgement,
  TrainingProgress, AssessmentAttempt, OfferLetter,
} from "@/models";
import { resolvePortal } from "@/lib/portal";
import { employeeAuthedFor } from "@/lib/employee-auth";
import { recomputeInstance } from "@/lib/instance-state";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { logActivity, notify } from "@/lib/activity";

async function authorizeStep(token: string, stepId: string) {
  const portal = await resolvePortal(token);
  if (!portal.ok) return { error: portal.reason } as const;
  if (!(await employeeAuthedFor(
    portal.employee._id.toString(),
    portal.instance._id.toString(),
    portal.employee.portalPasswordSetAt,
  ))) {
    return { error: "invalid" as const };
  }
  const step = await OnboardingStep.findById(stepId);
  if (!step || step.instance.toString() !== portal.instance._id.toString()) {
    return { error: "invalid" as const };
  }
  return { portal, step } as const;
}

function reval(token: string) {
  revalidatePath(`/onboard/${token}`);
}

export async function completeContentStep(token: string, stepId: string): Promise<ActionResult> {
  return guard(async () => {
    await dbConnect();
    const auth = await authorizeStep(token, stepId);
    if ("error" in auth) return fail("This link is no longer valid.");
    const { portal, step } = auth;
    if (step.status !== "completed") {
      step.status = "completed";
      step.completedAt = new Date();
      await step.save();
      await recomputeInstance(step.instance);
      await logActivity({
        actorType: "employee", actorName: portal.employee.fullName, action: "content.completed",
        message: `Completed “${step.title}”`, employee: portal.employee._id, instance: portal.instance._id,
      });
    }
    reval(token);
    return ok(undefined, "Marked complete");
  });
}

export async function acknowledgePolicy(token: string, stepId: string): Promise<ActionResult> {
  return guard(async () => {
    await dbConnect();
    const auth = await authorizeStep(token, stepId);
    if ("error" in auth) return fail("This link is no longer valid.");
    const { portal, step } = auth;
    if (step.kind !== "policy") return fail("Not a policy step.");

    const snap = step.snapshot as { title?: string; version?: string };
    await PolicyAcknowledgement.create({
      step: step._id, instance: portal.instance._id, employee: portal.employee._id,
      policyTitle: snap.title ?? step.title, version: snap.version ?? step.version ?? "1.0",
      acknowledgedAt: new Date(),
    });
    step.status = "completed";
    step.completedAt = new Date();
    await step.save();
    await recomputeInstance(step.instance);
    await logActivity({
      actorType: "employee", actorName: portal.employee.fullName, action: "policy.acknowledged",
      message: `Acknowledged “${step.title}” (v${snap.version ?? step.version})`,
      employee: portal.employee._id, instance: portal.instance._id,
    });
    reval(token);
    return ok(undefined, "Policy acknowledged");
  });
}

const trainingSchema = z.object({ checkedItems: z.array(z.number()).optional() });

export async function completeTraining(token: string, stepId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await dbConnect();
    const auth = await authorizeStep(token, stepId);
    if ("error" in auth) return fail("This link is no longer valid.");
    const { portal, step } = auth;
    const parsed = trainingSchema.safeParse(input ?? {});
    const checked = parsed.success ? parsed.data.checkedItems ?? [] : [];

    const snap = step.snapshot as { contentType?: string; checklist?: { label: string }[] };
    if (snap.contentType === "checklist") {
      const total = snap.checklist?.length ?? 0;
      if (checked.length < total) return fail("Please complete all checklist items first.");
    }

    await TrainingProgress.findOneAndUpdate(
      { step: step._id },
      {
        $set: {
          instance: portal.instance._id, employee: portal.employee._id,
          status: "completed", checkedItems: checked, completedAt: new Date(),
        },
        $setOnInsert: { startedAt: new Date() },
      },
      { upsert: true },
    );
    step.status = "completed";
    step.completedAt = new Date();
    await step.save();
    await recomputeInstance(step.instance);
    await logActivity({
      actorType: "employee", actorName: portal.employee.fullName, action: "training.completed",
      message: `Completed training “${step.title}”`, employee: portal.employee._id, instance: portal.instance._id,
    });
    await notify({
      audience: "admin", type: "training.completed", title: "Training completed",
      message: `${portal.employee.fullName} completed “${step.title}”.`,
      employee: portal.employee._id, instance: portal.instance._id, link: `/employees/${portal.employee._id}`,
    });
    reval(token);
    return ok(undefined, "Training completed");
  });
}

const answerSchema = z.object({
  answers: z.array(z.object({ selectedIndex: z.number().optional(), text: z.string().optional() })),
});

interface SnapQuestion {
  type: "mcq" | "truefalse" | "short";
  prompt: string;
  options: string[];
  correctIndex: number;
  correctText?: string;
  points: number;
}

export async function submitAssessment(
  token: string, stepId: string, input: unknown,
): Promise<ActionResult<{ score: number; passed: boolean; attemptsLeft: number }>> {
  return guard(async () => {
    await dbConnect();
    const auth = await authorizeStep(token, stepId);
    if ("error" in auth) return fail("This link is no longer valid.");
    const { portal, step } = auth;
    const parsed = answerSchema.safeParse(input);
    if (!parsed.success) return fail("Invalid submission.");

    const snap = step.snapshot as { questions?: SnapQuestion[]; passingScore?: number; maxAttempts?: number; title?: string };
    const questions = snap.questions ?? [];
    const maxAttempts = snap.maxAttempts ?? 3;

    const priorAttempts = await AssessmentAttempt.countDocuments({ step: step._id });
    if (step.status === "completed") return fail("You have already passed this assessment.");
    if (priorAttempts >= maxAttempts) return fail("No attempts remaining.");

    let earned = 0, totalPoints = 0;
    const graded = questions.map((q, i) => {
      totalPoints += q.points;
      const a = parsed.data.answers[i] ?? {};
      let correct = false;
      if (q.type === "short") {
        const expected = (q.correctText ?? "").trim().toLowerCase();
        correct = !!expected && (a.text ?? "").trim().toLowerCase().includes(expected);
      } else {
        correct = a.selectedIndex === q.correctIndex;
      }
      if (correct) earned += q.points;
      return { questionIndex: i, selectedIndex: a.selectedIndex, text: a.text, correct };
    });

    const score = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0;
    const passed = score >= (snap.passingScore ?? 70);
    const attemptNumber = priorAttempts + 1;

    await AssessmentAttempt.create({
      step: step._id, instance: portal.instance._id, employee: portal.employee._id,
      attemptNumber, answers: graded, score, passed, submittedAt: new Date(),
    });

    if (passed) {
      step.status = "completed";
      step.completedAt = new Date();
    } else {
      step.status = "in_progress";
    }
    await step.save();
    await recomputeInstance(step.instance);

    await logActivity({
      actorType: "employee", actorName: portal.employee.fullName, action: "assessment.submitted",
      message: `Submitted “${step.title}” — scored ${score}% (${passed ? "passed" : "failed"})`,
      employee: portal.employee._id, instance: portal.instance._id,
    });
    if (passed) {
      await notify({
        audience: "admin", type: "assessment.completed", title: "Assessment passed",
        message: `${portal.employee.fullName} passed “${step.title}” with ${score}%.`,
        employee: portal.employee._id, instance: portal.instance._id, link: `/employees/${portal.employee._id}`,
      });
    }
    reval(token);
    return ok({ score, passed, attemptsLeft: Math.max(0, maxAttempts - attemptNumber) },
      passed ? `Passed with ${score}%` : `Scored ${score}% — try again`);
  });
}

const infoSchema = z.object({
  personal: z.object({
    dateOfBirth: z.string().optional(), gender: z.string().optional(), addressLine: z.string().optional(),
    city: z.string().optional(), state: z.string().optional(), postalCode: z.string().optional(),
    personalEmail: z.string().email("Enter a valid email").or(z.literal("")).optional(),
    altPhone: z.string().optional(),
  }),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().optional(), phone: z.string().min(5, "Enter a valid phone"), email: z.string().optional(),
  }),
  bank: z.object({
    accountHolder: z.string().optional(), bankName: z.string().optional(),
    accountNumber: z.string().optional(), ifsc: z.string().optional(), branch: z.string().optional(),
  }),
});

export async function submitInfoForm(token: string, stepId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await dbConnect();
    const auth = await authorizeStep(token, stepId);
    if ("error" in auth) return fail("This link is no longer valid.");
    const { portal, step } = auth;
    const parsed = infoSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");

    await Employee.updateOne(
      { _id: portal.employee._id },
      { $set: { profile: { ...parsed.data, submittedAt: new Date() } } },
    );
    step.status = "completed";
    step.completedAt = new Date();
    await step.save();
    await recomputeInstance(step.instance);
    await logActivity({
      actorType: "employee", actorName: portal.employee.fullName, action: "profile.completed",
      message: "Submitted employee information", employee: portal.employee._id, instance: portal.instance._id,
    });
    reval(token);
    return ok(undefined, "Information submitted");
  });
}

export async function acceptOffer(token: string): Promise<ActionResult> {
  return guard(async () => {
    const portal = await resolvePortal(token);
    if (!portal.ok) return fail("This link is no longer valid.");
    if (!(await employeeAuthedFor(
      portal.employee._id.toString(),
      portal.instance._id.toString(),
      portal.employee.portalPasswordSetAt,
    ))) {
      return fail("Please sign in to your portal first.");
    }
    const offer = await OfferLetter.findOne({ instance: portal.instance._id });
    if (!offer || offer.status === "revoked") return fail("No active offer letter to accept.");
    if (offer.status !== "accepted") {
      offer.status = "accepted";
      offer.acceptedAt = new Date();
      await offer.save();
      await logActivity({
        actorType: "employee", actorName: portal.employee.fullName, action: "offer.accepted",
        message: `${portal.employee.fullName} accepted their offer letter`,
        employee: portal.employee._id, instance: portal.instance._id,
      });
      await notify({
        audience: "admin", type: "offer.accepted", title: "Offer accepted",
        message: `${portal.employee.fullName} accepted their offer letter.`,
        employee: portal.employee._id, instance: portal.instance._id, link: `/employees/${portal.employee._id}`,
      });
    }
    reval(token);
    return ok(undefined, "Offer accepted");
  });
}

const checklistSchema = z.object({ checked: z.array(z.boolean()) });

export async function completeOnboarding(token: string, stepId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await dbConnect();
    const auth = await authorizeStep(token, stepId);
    if ("error" in auth) return fail("This link is no longer valid.");
    const { portal, step } = auth;
    const parsed = checklistSchema.safeParse(input);
    if (!parsed.success) return fail("Invalid submission.");
    if (!parsed.data.checked.every(Boolean)) return fail("Please confirm every item in the checklist.");

    // Gate: every OTHER required step must be complete first.
    const outstanding = await OnboardingStep.countDocuments({
      instance: portal.instance._id,
      required: true,
      _id: { $ne: step._id },
      status: { $nin: ["completed", "approved"] },
    });
    if (outstanding > 0) {
      return fail(`You still have ${outstanding} required step(s) to finish before completing onboarding.`);
    }

    const snap = step.snapshot as { items?: string[] };
    portal.instance.finalChecklist = (snap.items ?? []).map((label) => ({ label, checked: true }));
    await portal.instance.save();

    step.status = "completed";
    step.completedAt = new Date();
    await step.save();
    await recomputeInstance(step.instance);
    await logActivity({
      actorType: "employee", actorName: portal.employee.fullName, action: "declaration.signed",
      message: "Signed the employee declaration", employee: portal.employee._id, instance: portal.instance._id,
    });
    reval(token);
    return ok(undefined, "Onboarding complete");
  });
}
