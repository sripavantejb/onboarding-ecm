import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IDepartment {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true },
);

export const Department: Model<IDepartment> =
  (models.Department as Model<IDepartment>) ||
  model<IDepartment>("Department", DepartmentSchema);
