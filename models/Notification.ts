import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface INotification {
  _id: mongoose.Types.ObjectId;
  audience: "admin" | "employee";
  employee?: mongoose.Types.ObjectId | null; // target employee (employee audience)
  instance?: mongoose.Types.ObjectId | null;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    audience: { type: String, enum: ["admin", "employee"], required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", default: null },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const Notification: Model<INotification> =
  (models.Notification as Model<INotification>) ||
  model<INotification>("Notification", NotificationSchema);
