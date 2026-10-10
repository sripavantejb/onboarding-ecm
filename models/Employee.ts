import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { EmploymentType, WorkMode } from "@/types";

export interface IEmployeeProfile {
  // Employee-submitted personal information form.
  personal?: {
    dateOfBirth?: string;
    gender?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    personalEmail?: string;
    altPhone?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  bank?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    branch?: string;
  };
  submittedAt?: Date | null;
  draftSavedAt?: Date | null;
}

export interface IEmployee {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  employeeCode: string;
  department: mongoose.Types.ObjectId;
  role: mongoose.Types.ObjectId;
  reportingManager?: mongoose.Types.ObjectId | null; // User
  reportingManagerName?: string;
  joiningDate: Date;
  employmentType: EmploymentType;
  workMode: WorkMode;
  // "active" = current employee; "past" = tenure ended (former employee, no more emails); "archived" = hidden.
  status: "active" | "archived" | "past";
  // Set when an admin ends the tenure. Drives the "Past employees" view.
  tenureEndedAt?: Date | null;
  tenureEndReason?: string;
  instance?: mongoose.Types.ObjectId | null;
  profile: IEmployeeProfile;
  // Portal login credentials — set/reset by admins only.
  portalPasswordHash?: string;
  portalPasswordSetAt?: Date | null;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    employeeCode: { type: String, required: true, unique: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true, index: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    reportingManager: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reportingManagerName: { type: String, default: "" },
    joiningDate: { type: Date, required: true, index: true },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Intern"],
      default: "Full-time",
    },
    workMode: { type: String, enum: ["On-site", "Remote", "Hybrid"], default: "On-site" },
    status: { type: String, enum: ["active", "archived", "past"], default: "active" },
    tenureEndedAt: { type: Date, default: null },
    tenureEndReason: { type: String, default: "" },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", default: null },
    profile: { type: Schema.Types.Mixed, default: {} },
    portalPasswordHash: { type: String, default: "" },
    portalPasswordSetAt: { type: Date, default: null },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Employee: Model<IEmployee> =
  (models.Employee as Model<IEmployee>) || model<IEmployee>("Employee", EmployeeSchema);
