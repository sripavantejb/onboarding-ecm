import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { StepSection, TemplateScope } from "@/types";

/**
 * A template item references a master entity (content/document/policy/training/
 * assessment). At employee-creation time these are resolved and snapshotted
 * into OnboardingStep documents.
 */
export interface ITemplateItem {
  kind: "content" | "document" | "policy" | "training" | "assessment";
  ref: mongoose.Types.ObjectId;
  section: StepSection;
  required: boolean;
  order: number;
}

const TemplateItemSchema = new Schema<ITemplateItem>(
  {
    kind: {
      type: String,
      enum: ["content", "document", "policy", "training", "assessment"],
      required: true,
    },
    ref: { type: Schema.Types.ObjectId, required: true },
    section: { type: String, required: true },
    required: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
);

export interface IOnboardingTemplate {
  _id: mongoose.Types.ObjectId;
  name: string;
  scope: TemplateScope;
  department?: mongoose.Types.ObjectId | null;
  role?: mongoose.Types.ObjectId | null;
  items: ITemplateItem[];
  reviews: number[]; // e.g. [30,60,90]
  version: number; // current published version number
  status: "draft" | "published" | "archived";
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingTemplateSchema = new Schema<IOnboardingTemplate>(
  {
    name: { type: String, required: true },
    scope: { type: String, enum: ["CORE", "DEPARTMENT", "ROLE"], required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", default: null, index: true },
    items: { type: [TemplateItemSchema], default: [] },
    reviews: { type: [Number], default: [30, 60, 90] },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published" },
    publishedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const OnboardingTemplate: Model<IOnboardingTemplate> =
  (models.OnboardingTemplate as Model<IOnboardingTemplate>) ||
  model<IOnboardingTemplate>("OnboardingTemplate", OnboardingTemplateSchema);

/** Immutable snapshot captured every time a template is published. */
export interface IOnboardingTemplateVersion {
  _id: mongoose.Types.ObjectId;
  template: mongoose.Types.ObjectId;
  version: number;
  items: ITemplateItem[];
  reviews: number[];
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingTemplateVersionSchema = new Schema<IOnboardingTemplateVersion>(
  {
    template: { type: Schema.Types.ObjectId, ref: "OnboardingTemplate", required: true, index: true },
    version: { type: Number, required: true },
    items: { type: [TemplateItemSchema], default: [] },
    reviews: { type: [Number], default: [30, 60, 90] },
    publishedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const OnboardingTemplateVersion: Model<IOnboardingTemplateVersion> =
  (models.OnboardingTemplateVersion as Model<IOnboardingTemplateVersion>) ||
  model<IOnboardingTemplateVersion>("OnboardingTemplateVersion", OnboardingTemplateVersionSchema);
