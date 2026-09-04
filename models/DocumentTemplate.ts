import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { DocStatus } from "@/types";

export interface IDocumentTemplate {
  _id: mongoose.Types.ObjectId;
  name: string;
  key: string;
  description?: string;
  required: boolean;
  category: string;
  allowedTypes: string[]; // e.g. ["pdf","jpg","png"]
  maxSizeMB: number;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    required: { type: Boolean, default: true },
    category: { type: String, default: "General" },
    allowedTypes: { type: [String], default: ["pdf", "jpg", "jpeg", "png"] },
    maxSizeMB: { type: Number, default: 10 },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true },
);

export const DocumentTemplate: Model<IDocumentTemplate> =
  (models.DocumentTemplate as Model<IDocumentTemplate>) ||
  model<IDocumentTemplate>("DocumentTemplate", DocumentTemplateSchema);

export interface IDocumentSubmission {
  _id: mongoose.Types.ObjectId;
  step: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  documentName: string;
  fileId: mongoose.Types.ObjectId; // GridFS file _id
  fileName: string;
  mimeType: string;
  size: number;
  status: DocStatus;
  rejectionReason?: string;
  reviewedByName?: string;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSubmissionSchema = new Schema<IDocumentSubmission>(
  {
    step: { type: Schema.Types.ObjectId, ref: "OnboardingStep", required: true, index: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    documentName: { type: String, required: true },
    fileId: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "uploaded", "under_review", "approved", "rejected"],
      default: "uploaded",
    },
    rejectionReason: { type: String, default: "" },
    reviewedByName: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const DocumentSubmission: Model<IDocumentSubmission> =
  (models.DocumentSubmission as Model<IDocumentSubmission>) ||
  model<IDocumentSubmission>("DocumentSubmission", DocumentSubmissionSchema);
