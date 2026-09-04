import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { ContentStatus } from "@/types";

/**
 * A Content item is a master onboarding module (e.g. "Welcome to Editco").
 * Its editable text lives in ContentVersion documents. `latestPublished`
 * points at the version new employees receive; existing onboarding instances
 * store their own snapshot and are unaffected by later edits.
 */
export interface IContent {
  _id: mongoose.Types.ObjectId;
  title: string;
  key: string; // stable slug, unique
  category: string;
  summary?: string;
  status: ContentStatus;
  latestPublished?: mongoose.Types.ObjectId | null; // ContentVersion
  currentDraft?: mongoose.Types.ObjectId | null; // ContentVersion
  versionCounter: number; // highest version number issued
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    title: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    summary: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    latestPublished: { type: Schema.Types.ObjectId, ref: "ContentVersion", default: null },
    currentDraft: { type: Schema.Types.ObjectId, ref: "ContentVersion", default: null },
    versionCounter: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Content: Model<IContent> =
  (models.Content as Model<IContent>) || model<IContent>("Content", ContentSchema);

export interface IContentVersion {
  _id: mongoose.Types.ObjectId;
  content: mongoose.Types.ObjectId;
  version: string; // e.g. "1.0", "2.0"
  versionNumber: number; // ordering integer
  title: string;
  body: string; // HTML (rendered from the editor)
  status: "draft" | "published" | "archived";
  publishedAt?: Date | null;
  updatedByName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentVersionSchema = new Schema<IContentVersion>(
  {
    content: { type: Schema.Types.ObjectId, ref: "Content", required: true, index: true },
    version: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: { type: Date, default: null },
    updatedByName: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ContentVersion: Model<IContentVersion> =
  (models.ContentVersion as Model<IContentVersion>) ||
  model<IContentVersion>("ContentVersion", ContentVersionSchema);
