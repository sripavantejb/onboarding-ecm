import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { QuestionType } from "@/types";

export interface IAssessmentQuestion {
  _id?: mongoose.Types.ObjectId;
  type: QuestionType;
  prompt: string;
  options: string[]; // for mcq / truefalse
  correctIndex: number; // index into options for mcq/truefalse
  correctText?: string; // expected keyword(s) for short answer
  points: number;
}

export interface IAssessment {
  _id: mongoose.Types.ObjectId;
  title: string;
  key: string;
  description?: string;
  category: string;
  passingScore: number; // percent
  maxAttempts: number;
  questions: IAssessmentQuestion[];
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IAssessmentQuestion>(
  {
    type: { type: String, enum: ["mcq", "truefalse", "short"], required: true },
    prompt: { type: String, required: true },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: 0 },
    correctText: { type: String, default: "" },
    points: { type: Number, default: 1 },
  },
  { _id: true },
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    passingScore: { type: Number, default: 70 },
    maxAttempts: { type: Number, default: 3 },
    questions: { type: [QuestionSchema], default: [] },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true },
);

export const Assessment: Model<IAssessment> =
  (models.Assessment as Model<IAssessment>) ||
  model<IAssessment>("Assessment", AssessmentSchema);

export interface IAssessmentAttempt {
  _id: mongoose.Types.ObjectId;
  step: mongoose.Types.ObjectId;
  instance: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  attemptNumber: number;
  answers: { questionIndex: number; selectedIndex?: number; text?: string; correct: boolean }[];
  score: number; // percent
  passed: boolean;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    step: { type: Schema.Types.ObjectId, ref: "OnboardingStep", required: true, index: true },
    instance: { type: Schema.Types.ObjectId, ref: "OnboardingInstance", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    attemptNumber: { type: Number, required: true },
    answers: {
      type: [
        {
          questionIndex: Number,
          selectedIndex: Number,
          text: String,
          correct: Boolean,
        },
      ],
      default: [],
    },
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

export const AssessmentAttempt: Model<IAssessmentAttempt> =
  (models.AssessmentAttempt as Model<IAssessmentAttempt>) ||
  model<IAssessmentAttempt>("AssessmentAttempt", AssessmentAttemptSchema);
