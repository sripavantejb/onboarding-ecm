import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IActivityLog {
  _id: mongoose.Types.ObjectId;
  actorType: "admin" | "employee" | "system";
  actorName: string;
  action: string; // machine key, e.g. "document.uploaded"
  message: string; // human-readable
  employee?: mongoose.Types.ObjectId | null;
  instance?: mongoose.Types.ObjectId | null;
  resourceType?: string;
  resourceId?: mongoose.Types.ObjectId | null;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorType: { type: String, enum: ["admin", "employee", "system"], required: true },
    actorName: { type: String, default: "System" },
    action: { type: String, required: true, index: true },
    message: { type: String, required: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", default: null, index: true },
    resourceType: { type: String, default: "" },
    resourceId: { type: Schema.Types.ObjectId, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const ActivityLog: Model<IActivityLog> =
  (models.ActivityLog as Model<IActivityLog>) ||
  model<IActivityLog>("ActivityLog", ActivityLogSchema);
