"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { TrainingModule } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import { logActivity } from "@/lib/activity";

const checklistItemSchema = z.object({
  label: z.string().min(1, "Checklist item cannot be empty").max(200),
});

const schema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(400).optional().default(""),
  contentType: z.enum(["text", "video", "pdf", "image", "external", "checklist"]).default("text"),
  body: z.string().optional().default(""),
  resourceUrl: z.string().max(2000).optional().default(""),
  checklist: z.array(checklistItemSchema).optional().default([]),
  estimatedMinutes: z.number().int().min(0, "Minutes cannot be negative").max(100000).default(15),
});

/** Generate a unique key from the title, appending a short suffix if taken. */
async function uniqueKey(title: string): Promise<string> {
  let key = slugify(title) || "module";
  if (await TrainingModule.findOne({ key })) key = `${key}-${Date.now().toString(36).slice(-4)}`;
  return key;
}

export async function createTraining(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("training");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    const key = await uniqueKey(parsed.data.title);
    const module = await TrainingModule.create({
      title: parsed.data.title,
      key,
      description: parsed.data.description,
      category: parsed.data.category,
      contentType: parsed.data.contentType,
      body: sanitizeRichText(parsed.data.body),
      resourceUrl: parsed.data.resourceUrl,
      checklist: parsed.data.checklist,
      estimatedMinutes: parsed.data.estimatedMinutes,
      status: "active",
    });

    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "training.created",
      message: `Created training “${module.title}”`,
      resourceType: "TrainingModule",
      resourceId: module._id,
    });
    revalidatePath("/training");
    return ok({ id: module._id.toString() }, "Training created");
  });
}

export async function updateTraining(id: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("training");
    const parsed = schema.partial().safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    const module = await TrainingModule.findById(id);
    if (!module) return fail("Training module not found.");

    if (parsed.data.title) module.title = parsed.data.title;
    if (parsed.data.category) module.category = parsed.data.category;
    if (parsed.data.description !== undefined) module.description = parsed.data.description;
    if (parsed.data.contentType) module.contentType = parsed.data.contentType;
    if (parsed.data.body !== undefined) module.body = sanitizeRichText(parsed.data.body);
    if (parsed.data.resourceUrl !== undefined) module.resourceUrl = parsed.data.resourceUrl;
    if (parsed.data.checklist !== undefined) module.checklist = parsed.data.checklist;
    if (parsed.data.estimatedMinutes !== undefined) module.estimatedMinutes = parsed.data.estimatedMinutes;
    await module.save();

    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "training.updated",
      message: `Updated training “${module.title}”`,
      resourceType: "TrainingModule",
      resourceId: module._id,
    });
    revalidatePath("/training");
    return ok(undefined, "Training updated");
  });
}

export async function setTrainingArchived(id: string, archived: boolean): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("training");
    await dbConnect();
    const module = await TrainingModule.findById(id);
    if (!module) return fail("Training module not found.");
    module.status = archived ? "archived" : "active";
    await module.save();

    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: archived ? "training.archived" : "training.restored",
      message: `${archived ? "Archived" : "Restored"} training “${module.title}”`,
      resourceType: "TrainingModule",
      resourceId: module._id,
    });
    revalidatePath("/training");
    return ok(undefined, archived ? "Training archived" : "Training restored");
  });
}
