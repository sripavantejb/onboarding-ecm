import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IOfferLetter {
  _id: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  // Snapshot of the details printed on the letter (so later employee edits don't change it).
  candidateName: string;
  roleTitle: string;
  departmentName: string;
  joiningDate: Date;
  employmentType: string;
  workMode: string;
  location: string;
  reportingManagerName: string;
  ctcAnnual: number;
  currency: string;
  offerDate: Date;
  responseByDate?: Date | null;
  terms: string[];
  fileId: mongoose.Types.ObjectId; // GridFS PDF
  fileName: string;
  // "generated" = built from the form via PDFKit; "uploaded" = admin-supplied PDF.
  source: "generated" | "uploaded";
  issuedByName: string;
  status: "issued" | "accepted" | "revoked";
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OfferLetterSchema = new Schema<IOfferLetter>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    candidateName: { type: String, required: true },
    roleTitle: { type: String, required: true },
    departmentName: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    employmentType: { type: String, required: true },
    workMode: { type: String, required: true },
    location: { type: String, default: "" },
    reportingManagerName: { type: String, default: "" },
    ctcAnnual: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    offerDate: { type: Date, default: () => new Date() },
    responseByDate: { type: Date, default: null },
    terms: { type: [String], default: [] },
    fileId: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, default: "" },
    source: { type: String, enum: ["generated", "uploaded"], default: "generated" },
    issuedByName: { type: String, default: "" },
    status: { type: String, enum: ["issued", "accepted", "revoked"], default: "issued" },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const OfferLetter: Model<IOfferLetter> =
  (models.OfferLetter as Model<IOfferLetter>) || model<IOfferLetter>("OfferLetter", OfferLetterSchema);
