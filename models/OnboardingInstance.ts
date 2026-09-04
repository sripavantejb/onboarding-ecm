import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { OnboardingStatus, StepKind, StepSection, StepStatus } from "@/types";

export interface IOnboardingInstance {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  role: mongoose.Types.ObjectId;
  // Denormalized for fast lists / snapshot integrity.
  employeeName: string;
  departmentName: string;
  roleName: string;
  templates: { templateId: mongoose.Types.ObjectId; scope: string; version: number }[];
  status: OnboardingStatus;
  progress: number; // derived, cached (0-100) over required steps
  reviews: number[];
  startedAt?: Date | null;
  firstOpenedAt?: Date | null;
  invitationSentAt?: Date | null;
  completedAt?: Date | null;
  finalChecklist: { label: string; checked: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingInstanceSchema = new Schema<IOnboardingInstance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    employeeName: { type: String, required: true },
    departmentName: { type: String, required: true },
    roleName: { type: String, required: true },
    templates: {
      type: [{ templateId: Schema.Types.ObjectId, scope: String, version: Number }],
      default: [],
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "action_required", "awaiting_review", "completed"],
      default: "not_started",
      index: true,
    },
    progress: { type: Number, default: 0 },
    reviews: { type: [Number], default: [30, 60, 90] },
    startedAt: { type: Date, default: null },
    firstOpenedAt: { type: Date, default: null },
    invitationSentAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    finalChecklist: {
      type: [{ label: String, checked: { type: Boolean, default: false } }],
      default: [],
    },
  },
  { timestamps: true },
);

export const OnboardingInstance: Model<IOnboardingInstance> =
  (models.OnboardingInstance as Model<IOnboardingInstance>) ||
  model<IOnboardingInstance>("OnboardingInstance", OnboardingInstanceSchema);

/**
 * A single onboarding task for an employee. `snapshot` freezes the master
 * content (and its version) at assignment time so later master edits never
 * change this employee's experience.
 */
export interface IOnboardingStep {
  _id: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  section: StepSection;
  kind: StepKind;
  title: string;
  required: boolean;
  optional?: boolean; // admin-added extra that can be removed
  order: number;
  status: StepStatus;
  refKind?: string;
  refId?: mongoose.Types.ObjectId | null;
  // Frozen content — shape depends on kind.
  snapshot: Record<string, unknown>;
  version?: string; // content/policy version label captured
  addedByAdmin?: boolean; // employee-specific override
  dueDate?: Date | null;
  completedAt?: Date | null;
  latestSubmission?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingStepSchema = new Schema<IOnboardingStep>(
  {
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    section: { type: String, required: true },
    kind: { type: String, required: true },
    title: { type: String, required: true },
    required: { type: Boolean, default: true },
    optional: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["locked", "not_started", "in_progress", "submitted", "under_review", "approved", "rejected", "completed"],
      default: "not_started",
    },
    refKind: { type: String, default: "" },
    refId: { type: Schema.Types.ObjectId, default: null },
    snapshot: { type: Schema.Types.Mixed, default: {} },
    version: { type: String, default: "" },
    addedByAdmin: { type: Boolean, default: false },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    latestSubmission: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

OnboardingStepSchema.index({ instance: 1, order: 1 });

export const OnboardingStep: Model<IOnboardingStep> =
  (models.OnboardingStep as Model<IOnboardingStep>) ||
  model<IOnboardingStep>("OnboardingStep", OnboardingStepSchema);
