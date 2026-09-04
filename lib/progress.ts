import type { OnboardingStatus, StepStatus } from "@/types";

export interface StepLike {
  status: StepStatus;
  required: boolean;
  section?: string;
  order?: number;
  title?: string;
}

const DONE: StepStatus[] = ["completed", "approved"];
const AWAITING: StepStatus[] = ["submitted", "under_review"];
const ACTIONABLE: StepStatus[] = ["not_started", "in_progress", "rejected", "locked"];

export function isStepDone(status: StepStatus): boolean {
  return DONE.includes(status);
}

/**
 * Progress is DERIVED from required steps — never a stored magic number.
 * Returns a 0-100 integer.
 */
export function computeProgress(steps: StepLike[]): number {
  const required = steps.filter((s) => s.required);
  if (required.length === 0) return 0;
  const done = required.filter((s) => isStepDone(s.status)).length;
  return Math.round((done / required.length) * 100);
}

/** Derive the dashboard status bucket from the current steps. */
export function computeStatus(
  steps: StepLike[],
  opts: { started?: boolean } = {},
): OnboardingStatus {
  const required = steps.filter((s) => s.required);
  const doneCount = required.filter((s) => isStepDone(s.status)).length;

  if (required.length > 0 && doneCount === required.length) return "completed";
  if (steps.some((s) => s.status === "rejected")) return "action_required";

  const hasActionable = required.some((s) => ACTIONABLE.includes(s.status));
  const hasAwaiting = steps.some((s) => AWAITING.includes(s.status));

  if (!hasActionable && hasAwaiting) return "awaiting_review";
  if (doneCount > 0 || opts.started || hasAwaiting) return "in_progress";
  return "not_started";
}

/**
 * The single most important incomplete required task the employee should do
 * next. Returns null when nothing is actionable (all done or awaiting review).
 */
export function nextActionableStep<T extends StepLike>(steps: T[]): T | null {
  const ordered = [...steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return (
    ordered.find(
      (s) => s.required && (s.status === "not_started" || s.status === "in_progress" || s.status === "rejected"),
    ) ?? null
  );
}
