import { Badge } from "@/components/ui/badge";
import { ONBOARDING_STATUS_LABELS, type OnboardingStatus, type StepStatus, type DocStatus } from "@/types";

const ONBOARDING_VARIANT: Record<OnboardingStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  not_started: "muted",
  in_progress: "brand",
  action_required: "destructive",
  awaiting_review: "warning",
  completed: "success",
};

export function OnboardingStatusBadge({ status }: { status: OnboardingStatus }) {
  return <Badge variant={ONBOARDING_VARIANT[status]}>{ONBOARDING_STATUS_LABELS[status]}</Badge>;
}

const STEP_VARIANT: Record<StepStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  locked: "muted",
  not_started: "muted",
  in_progress: "brand",
  submitted: "warning",
  under_review: "warning",
  approved: "success",
  rejected: "destructive",
  completed: "success",
};
const STEP_LABEL: Record<StepStatus, string> = {
  locked: "Locked",
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export function StepStatusBadge({ status }: { status: StepStatus }) {
  return <Badge variant={STEP_VARIANT[status]}>{STEP_LABEL[status]}</Badge>;
}

const DOC_VARIANT: Record<DocStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  pending: "muted",
  uploaded: "brand",
  under_review: "warning",
  approved: "success",
  rejected: "destructive",
};
const DOC_LABEL: Record<DocStatus, string> = {
  pending: "Pending",
  uploaded: "Uploaded",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

export function DocStatusBadge({ status }: { status: DocStatus }) {
  return <Badge variant={DOC_VARIANT[status]}>{DOC_LABEL[status]}</Badge>;
}
