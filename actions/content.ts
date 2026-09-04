"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Content, ContentVersion } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import { logActivity } from "@/lib/activity";

const metaSchema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  category: z.string().min(1, "Category is required"),
  summary: z.string().max(300).optional().default(""),
  body: z.string().default(""),
});

export async function createContent(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("content");
    const parsed = metaSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    let key = slugify(parsed.data.title);
    if (await Content.findOne({ key })) key = `${key}-${Date.now().toString(36).slice(-4)}`;

    const content = await Content.create({
      title: parsed.data.title,
      key,
      category: parsed.data.category,
      summary: parsed.data.summary,
      status: "draft",
      versionCounter: 0,
    });
    const draft = await ContentVersion.create({
      content: content._id,
      version: "1.0-draft",
      versionNumber: 1,
      title: parsed.data.title,
      body: sanitizeRichText(parsed.data.body),
      status: "draft",
      updatedByName: user.name,
    });
    content.currentDraft = draft._id;
    await content.save();

    await logActivity({
      actorType: "admin", actorName: user.name, action: "content.created",
      message: `Created content “${content.title}”`, resourceType: "Content", resourceId: content._id,
    });
    revalidatePath("/content");
    return ok({ id: content._id.toString() }, "Content created");
  });
}

export async function saveContentDraft(id: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("content");
    const parsed = metaSchema.partial().safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    const content = await Content.findById(id);
    if (!content) return fail("Content not found.");
    if (parsed.data.title) content.title = parsed.data.title;
    if (parsed.data.category) content.category = parsed.data.category;
    if (parsed.data.summary !== undefined) content.summary = parsed.data.summary;

    const cleanBody = parsed.data.body !== undefined ? sanitizeRichText(parsed.data.body) : undefined;

    let draft = content.currentDraft ? await ContentVersion.findById(content.currentDraft) : null;
    if (!draft) {
      draft = await ContentVersion.create({
        content: content._id,
        version: `${content.versionCounter + 1}.0-draft`,
        versionNumber: content.versionCounter + 1,
        title: content.title,
        body: cleanBody ?? "",
        status: "draft",
        updatedByName: user.name,
      });
      content.currentDraft = draft._id;
    } else {
      if (parsed.data.title) draft.title = parsed.data.title;
      if (cleanBody !== undefined) draft.body = cleanBody;
      draft.updatedByName = user.name;
      await draft.save();
    }
    await content.save();

    revalidatePath(`/content/${id}`);
    revalidatePath("/content");
    return ok(undefined, "Draft saved");
  });
}

export async function publishContent(id: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("content");
    await dbConnect();
    const content = await Content.findById(id);
    if (!content) return fail("Content not found.");
    const draft = content.currentDraft ? await ContentVersion.findById(content.currentDraft) : null;
    if (!draft) return fail("There are no unpublished changes to publish.");

    const newNum = content.versionCounter + 1;
    draft.versionNumber = newNum;
    draft.version = `${newNum}.0`;
    draft.status = "published";
    draft.publishedAt = new Date();
    await draft.save();

    content.versionCounter = newNum;
    content.latestPublished = draft._id;
    content.currentDraft = null;
    content.status = "published";
    await content.save();

    await logActivity({
      actorType: "admin", actorName: user.name, action: "content.published",
      message: `Published “${content.title}” v${draft.version}`, resourceType: "Content", resourceId: content._id,
    });
    revalidatePath(`/content/${id}`);
    revalidatePath("/content");
    return ok(undefined, `Published version ${draft.version}`);
  });
}

export async function setContentArchived(id: string, archived: boolean): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("content");
    await dbConnect();
    const content = await Content.findById(id);
    if (!content) return fail("Content not found.");
    content.status = archived ? "archived" : content.latestPublished ? "published" : "draft";
    await content.save();
    revalidatePath("/content");
    revalidatePath(`/content/${id}`);
    return ok(undefined, archived ? "Content archived" : "Content restored");
  });
}
