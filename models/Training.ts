import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IChecklistItem {
  label: string;
}

export interface ITrainingModule {
  _id: mongoose.Types.ObjectId;
  title: string;
  key: string;
  description?: string;
  category: string;
  contentType: "text" | "video" | "pdf" | "image" | "external" | "checklist";
  body: string; // HTML for text; caption otherwise
  resourceUrl?: string; // video/pdf/image/external link
  checklist: IChecklistItem[];
  estimatedMinutes: number;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const TrainingModuleSchema = new Schema<ITrainingModule>(
  {
    title: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    contentType: {
      type: String,
      enum: ["text", "video", "pdf", "image", "external", "checklist"],
      default: "text",
    },
    body: { type: String, default: "" },
    resourceUrl: { type: String, default: "" },
    checklist: { type: [{ label: String }], default: [] },
    estimatedMinutes: { type: Number, default: 15 },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true },
);

export const TrainingModule: Model<ITrainingModule> =
  (models.TrainingModule as Model<ITrainingModule>) ||
  model<ITrainingModule>("TrainingModule", TrainingModuleSchema);

export interface ITrainingProgress {
  _id: mongoose.Types.ObjectId;
  step: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  status: "not_started" | "in_progress" | "completed";
  checkedItems: number[]; // indices completed
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingProgressSchema = new Schema<ITrainingProgress>(
  {
    step: { type: Schema.Types.ObjectId, ref: "OnboardingStep", required: true, index: true, unique: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
    checkedItems: { type: [Number], default: [] },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const TrainingProgress: Model<ITrainingProgress> =
  (models.TrainingProgress as Model<ITrainingProgress>) ||
  model<ITrainingProgress>("TrainingProgress", TrainingProgressSchema);
