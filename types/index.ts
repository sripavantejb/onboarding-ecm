// Shared enums & literal unions used across models, actions, and UI.

export const USER_ROLES = ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  MANAGER: "Manager",
};

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["On-site", "Remote", "Hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const ONBOARDING_STATUSES = [
  "not_started",
  "in_progress",
  "action_required",
  "awaiting_review",
  "completed",
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  action_required: "Action Required",
  awaiting_review: "Awaiting Review",
  completed: "Completed",
};

export const STEP_SECTIONS = [
  "PREBOARDING",
  "CORE",
  "ROLE",
  "DOCUMENTS",
  "POLICIES",
  "TRAINING",
  "ASSESSMENT",
  "FINAL",
] as const;
export type StepSection = (typeof STEP_SECTIONS)[number];

export const SECTION_LABELS: Record<StepSection, string> = {
  PREBOARDING: "Pre-boarding",
  CORE: "Start Here",
  ROLE: "Your Role",
  DOCUMENTS: "Documents",
  POLICIES: "Company Policies",
  TRAINING: "Training",
  ASSESSMENT: "Assessment",
  FINAL: "Final Steps",
};

export const STEP_KINDS = [
  "content",
  "document",
  "policy",
  "training",
  "assessment",
  "info_form",
  "checklist",
] as const;
export type StepKind = (typeof STEP_KINDS)[number];

export const STEP_STATUSES = [
  "locked",
  "not_started",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "completed",
] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];

export const DOC_STATUSES = [
  "pending",
  "uploaded",
  "under_review",
  "approved",
  "rejected",
] as const;
export type DocStatus = (typeof DOC_STATUSES)[number];

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const REVIEW_TYPES = ["30", "60", "90"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const QUESTION_TYPES = ["mcq", "truefalse", "short"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const TEMPLATE_SCOPES = ["CORE", "DEPARTMENT", "ROLE"] as const;
export type TemplateScope = (typeof TEMPLATE_SCOPES)[number];

// Content categories used by the Content Library (grouping label only).
export const CONTENT_CATEGORIES = [
  "Company",
  "Employee",
  "Sales",
  "Design",
  "Video",
  "Marketing",
  "Operations",
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];
