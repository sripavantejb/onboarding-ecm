import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { EmploymentType, WorkMode } from "@/types";

/** A new hire saved before onboarding is generated. */
export interface IHireDraft {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  department?: mongoose.Types.ObjectId | null;
  role?: mongoose.Types.ObjectId | null;
  reportingManager?: mongoose.Types.ObjectId | null;
  reportingManagerName: string;
  joiningDate: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const HireDraftSchema = new Schema<IHireDraft>(
  {
    fullName: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "" },
    department: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    role: { type: Schema.Types.ObjectId, ref: "Role", default: null },
    reportingManager: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reportingManagerName: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Intern"],
      default: "Full-time",
    },
    workMode: { type: String, enum: ["On-site", "Remote", "Hybrid"], default: "On-site" },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const HireDraft: Model<IHireDraft> =
  (models.HireDraft as Model<IHireDraft>) || model<IHireDraft>("HireDraft", HireDraftSchema);
