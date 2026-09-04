import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { ReviewType } from "@/types";

export interface IReview {
  _id: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  type: ReviewType;
  dueDate: Date;
  status: "pending" | "completed";
  goals?: string;
  performance?: string;
  strengths?: string;
  improvements?: string;
  feedback?: string;
  nextObjectives?: string;
  managerComments?: string;
  reviewerName?: string;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    type: { type: String, enum: ["30", "60", "90"], required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    goals: { type: String, default: "" },
    performance: { type: String, default: "" },
    strengths: { type: String, default: "" },
    improvements: { type: String, default: "" },
    feedback: { type: String, default: "" },
    nextObjectives: { type: String, default: "" },
    managerComments: { type: String, default: "" },
    reviewerName: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", ReviewSchema);
