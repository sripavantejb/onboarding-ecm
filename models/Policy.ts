import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IPolicy {
  _id: mongoose.Types.ObjectId;
  title: string;
  key: string;
  category: string;
  description?: string;
  status: "draft" | "published" | "archived";
  latestPublished?: mongoose.Types.ObjectId | null; // PolicyVersion
  versionCounter: number;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    title: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    latestPublished: { type: Schema.Types.ObjectId, ref: "PolicyVersion", default: null },
    versionCounter: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Policy: Model<IPolicy> =
  (models.Policy as Model<IPolicy>) || model<IPolicy>("Policy", PolicySchema);

export interface IPolicyVersion {
  _id: mongoose.Types.ObjectId;
  policy: mongoose.Types.ObjectId;
  version: string;
  versionNumber: number;
  title: string;
  body: string; // HTML
  effectiveDate: Date;
  status: "draft" | "published" | "archived";
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const PolicyVersionSchema = new Schema<IPolicyVersion>(
  {
    policy: { type: Schema.Types.ObjectId, ref: "Policy", required: true, index: true },
    version: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    effectiveDate: { type: Date, default: () => new Date() },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const PolicyVersion: Model<IPolicyVersion> =
  (models.PolicyVersion as Model<IPolicyVersion>) ||
  model<IPolicyVersion>("PolicyVersion", PolicyVersionSchema);

export interface IPolicyAcknowledgement {
  _id: mongoose.Types.ObjectId;
  step: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  policyTitle: string;
  version: string;
  acknowledgedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PolicyAcknowledgementSchema = new Schema<IPolicyAcknowledgement>(
  {
    step: { type: Schema.Types.ObjectId, ref: "OnboardingStep", required: true, index: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    policyTitle: { type: String, required: true },
    version: { type: String, required: true },
    acknowledgedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const PolicyAcknowledgement: Model<IPolicyAcknowledgement> =
  (models.PolicyAcknowledgement as Model<IPolicyAcknowledgement>) ||
  model<IPolicyAcknowledgement>("PolicyAcknowledgement", PolicyAcknowledgementSchema);
