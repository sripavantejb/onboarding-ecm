import mongoose, { Schema, model, models, type Model } from "mongoose";

/**
 * Secure onboarding link. Only the SHA-256 hash of the raw token is stored.
 * The raw token lives only in the URL handed to the employee.
 */
export interface IOnboardingToken {
  _id: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  tokenHash: string;
  status: "active" | "revoked";
  expiresAt: Date;
  firstOpenedAt?: Date | null;
  lastAccessedAt?: Date | null;
  openCount: number;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingTokenSchema = new Schema<IOnboardingToken>(
  {
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    expiresAt: { type: Date, required: true },
    firstOpenedAt: { type: Date, default: null },
    lastAccessedAt: { type: Date, default: null },
    openCount: { type: Number, default: 0 },
    createdByName: { type: String, default: "" },
  },
  { timestamps: true },
);

export const OnboardingToken: Model<IOnboardingToken> =
  (models.OnboardingToken as Model<IOnboardingToken>) ||
  model<IOnboardingToken>("OnboardingToken", OnboardingTokenSchema);
