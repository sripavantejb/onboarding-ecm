import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IRole {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  department: mongoose.Types.ObjectId;
  description?: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true },
);

RoleSchema.index({ department: 1, slug: 1 }, { unique: true });

export const Role: Model<IRole> =
  (models.Role as Model<IRole>) || model<IRole>("Role", RoleSchema);
