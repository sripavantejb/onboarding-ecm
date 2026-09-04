import "server-only";
import mongoose from "mongoose";
import { OnboardingInstance, OnboardingStep } from "@/models";
import { computeProgress, computeStatus } from "@/lib/progress";
import { logActivity, notify } from "@/lib/activity";
import type { StepStatus } from "@/types";

/**
 * Recalculate an instance's progress + status FROM its steps (never stored as a
 * magic number) and persist. Fires completion side-effects exactly once.
 */
export async function recomputeInstance(instanceId: mongoose.Types.ObjectId | string) {
  const instance = await OnboardingInstance.findById(instanceId);
  if (!instance) return null;

  const steps = await OnboardingStep.find({ instance: instance._id }).select("status required section order").lean();
  const progress = computeProgress(steps as { status: StepStatus; required: boolean }[]);
  const status = computeStatus(steps as { status: StepStatus; required: boolean }[], {
    started: !!instance.startedAt,
  });

  const wasCompleted = instance.status === "completed";
  instance.progress = progress;
  instance.status = status;
  if (status !== "not_started" && !instance.startedAt) instance.startedAt = new Date();

  if (status === "completed" && !instance.completedAt) {
    instance.completedAt = new Date();
  }
  await instance.save();

  if (status === "completed" && !wasCompleted) {
    await logActivity({
      actorType: "system", action: "onboarding.completed",
      message: `${instance.employeeName} completed onboarding`,
      employee: instance.employee, instance: instance._id,
    });
    await notify({
      audience: "admin", type: "onboarding.completed", title: "Onboarding completed",
      message: `${instance.employeeName} has finished onboarding.`,
      employee: instance.employee, instance: instance._id, link: `/employees/${instance.employee}`,
    });
  }

  return { progress, status };
}

/** Set a step's status then recompute the parent instance. */
export async function setStepStatus(
  stepId: mongoose.Types.ObjectId | string,
  status: StepStatus,
  opts: { completedAt?: Date | null } = {},
) {
  const step = await OnboardingStep.findById(stepId);
  if (!step) return null;
  step.status = status;
  if (status === "completed" || status === "approved") step.completedAt = opts.completedAt ?? new Date();
  if (status === "rejected" || status === "not_started") step.completedAt = null;
  await step.save();
  await recomputeInstance(step.instance);
  return step;
}
