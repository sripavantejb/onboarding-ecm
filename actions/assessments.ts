"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Assessment } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const questionSchema = z.object({
  type: z.enum(["mcq", "truefalse", "short"]),
  prompt: z.string().min(1, "Question prompt is required").max(1000),
  options: z.array(z.string().max(500)).optional().default([]),
  correctIndex: z.number().int().min(0).default(0),
  correctText: z.string().max(500).optional().default(""),
  points: z.number().int().min(0, "Points cannot be negative").max(1000).default(1),
});

const schema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(400).optional().default(""),
  passingScore: z.number().int().min(0).max(100).default(70),
  maxAttempts: z.number().int().min(1, "Must allow at least one attempt").max(100).default(3),
  questions: z.array(questionSchema).optional().default([]),
});

/** Generate a unique key from the title, appending a short suffix if taken. */
async function uniqueKey(title: string): Promise<string> {
  let key = slugify(title) || "assessment";
  if (await Assessment.findOne({ key })) key = `${key}-${Date.now().toString(36).slice(-4)}`;
  return key;
}

export async function createAssessment(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("assessments");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    const key = await uniqueKey(parsed.data.title);
    const assessment = await Assessment.create({
      title: parsed.data.title,
      key,
      description: parsed.data.description,
      category: parsed.data.category,
      passingScore: parsed.data.passingScore,
      maxAttempts: parsed.data.maxAttempts,
      questions: parsed.data.questions,
      status: "active",
    });

    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "assessment.created",
      message: `Created assessment “${assessment.title}”`,
      resourceType: "Assessment",
      resourceId: assessment._id,
    });
    revalidatePath("/assessments");
    return ok({ id: assessment._id.toString() }, "Assessment created");
  });
}

export async function updateAssessment(id: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("assessments");
    const parsed = schema.partial().safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    const assessment = await Assessment.findById(id);
    if (!assessment) return fail("Assessment not found.");

    if (parsed.data.title) assessment.title = parsed.data.title;
    if (parsed.data.category) assessment.category = parsed.data.category;
    if (parsed.data.description !== undefined) assessment.description = parsed.data.description;
    if (parsed.data.passingScore !== undefined) assessment.passingScore = parsed.data.passingScore;
    if (parsed.data.maxAttempts !== undefined) assessment.maxAttempts = parsed.data.maxAttempts;
    if (parsed.data.questions !== undefined) assessment.questions = parsed.data.questions;
    await assessment.save();

    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "assessment.updated",
      message: `Updated assessment “${assessment.title}”`,
      resourceType: "Assessment",
      resourceId: assessment._id,
    });
    revalidatePath("/assessments");
    return ok(undefined, "Assessment updated");
  });
}

export async function setAssessmentArchived(id: string, archived: boolean): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("assessments");
    await dbConnect();
    const assessment = await Assessment.findById(id);
    if (!assessment) return fail("Assessment not found.");
    assessment.status = archived ? "archived" : "active";
    await assessment.save();

    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: archived ? "assessment.archived" : "assessment.restored",
      message: `${archived ? "Archived" : "Restored"} assessment “${assessment.title}”`,
      resourceType: "Assessment",
      resourceId: assessment._id,
    });
    revalidatePath("/assessments");
    return ok(undefined, archived ? "Assessment archived" : "Assessment restored");
  });
}
