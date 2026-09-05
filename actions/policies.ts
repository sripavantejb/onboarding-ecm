"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Policy, PolicyVersion, Employee, OnboardingInstance, OnboardingStep } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";
import { logActivity, notify } from "@/lib/activity";
import { recomputeInstance } from "@/lib/instance-state";

const metaSchema = z.object({
  title: z.string().min(2, "Title is too short").max(120),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(300).optional().default(""),
  body: z.string().default(""),
  effectiveDate: z.string().optional().default(""),
});

function parseEffectiveDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function createPolicy(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("policies");
    const parsed = metaSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    let key = slugify(parsed.data.title);
    if (await Policy.findOne({ key })) key = `${key}-${Date.now().toString(36).slice(-4)}`;

    const policy = await Policy.create({
      title: parsed.data.title,
      key,
      category: parsed.data.category,
      description: parsed.data.description,
      status: "draft",
      versionCounter: 0,
    });
    await PolicyVersion.create({
      policy: policy._id,
      version: "1.0-draft",
      versionNumber: 1,
      title: parsed.data.title,
      body: sanitizeRichText(parsed.data.body),
      effectiveDate: parseEffectiveDate(parsed.data.effectiveDate) ?? new Date(),
      status: "draft",
    });

    await logActivity({
      actorType: "admin", actorName: user.name, action: "policy.created",
      message: `Created policy “${policy.title}”`, resourceType: "Policy", resourceId: policy._id,
    });
    revalidatePath("/policies");
    return ok({ id: policy._id.toString() }, "Policy created");
  });
}

export async function savePolicyDraft(id: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("policies");
    const parsed = metaSchema.partial().safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();

    const policy = await Policy.findById(id);
    if (!policy) return fail("Policy not found.");
    if (parsed.data.title) policy.title = parsed.data.title;
    if (parsed.data.category) policy.category = parsed.data.category;
    if (parsed.data.description !== undefined) policy.description = parsed.data.description;

    const cleanBody = parsed.data.body !== undefined ? sanitizeRichText(parsed.data.body) : undefined;
    const effectiveDate = parseEffectiveDate(parsed.data.effectiveDate);

    // The draft is the most recent PolicyVersion with status "draft".
    let draft = await PolicyVersion.findOne({ policy: policy._id, status: "draft" }).sort({ versionNumber: -1 });
    if (!draft) {
      draft = await PolicyVersion.create({
        policy: policy._id,
        version: `${policy.versionCounter + 1}.0-draft`,
        versionNumber: policy.versionCounter + 1,
        title: policy.title,
        body: cleanBody ?? "",
        effectiveDate: effectiveDate ?? new Date(),
        status: "draft",
      });
    } else {
      if (parsed.data.title) draft.title = parsed.data.title;
      if (cleanBody !== undefined) draft.body = cleanBody;
      if (effectiveDate) draft.effectiveDate = effectiveDate;
      await draft.save();
    }
    await policy.save();

    revalidatePath(`/policies/${id}`);
    revalidatePath("/policies");
    return ok(undefined, "Draft saved");
  });
}

export async function publishPolicy(id: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("policies");
    await dbConnect();
    const policy = await Policy.findById(id);
    if (!policy) return fail("Policy not found.");
    const draft = await PolicyVersion.findOne({ policy: policy._id, status: "draft" }).sort({ versionNumber: -1 });
    if (!draft) return fail("There are no unpublished changes to publish.");

    const newNum = policy.versionCounter + 1;
    draft.versionNumber = newNum;
    draft.version = `${newNum}.0`;
    draft.status = "published";
    draft.publishedAt = new Date();
    await draft.save();

    policy.versionCounter = newNum;
    policy.latestPublished = draft._id;
    policy.status = "published";
    await policy.save();

    await logActivity({
      actorType: "admin", actorName: user.name, action: "policy.published",
      message: `Published “${policy.title}” v${draft.version}`, resourceType: "Policy", resourceId: policy._id,
    });
    revalidatePath(`/policies/${id}`);
    revalidatePath("/policies");
    return ok(undefined, `Published version ${draft.version}`);
  });
}

/**
 * Assign a published policy to an already-onboarding employee: adds a "sign this
 * policy" step to their onboarding (snapshotting the latest published version)
 * and emails them to review & sign it. Idempotent per policy per employee.
 */
export async function assignPolicyToEmployee(
  employeeId: string,
  policyId: string,
): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("policies");
    await dbConnect();

    const employee = await Employee.findById(employeeId).select("fullName email instance").lean();
    if (!employee) return fail("Employee not found.");
    if (!employee.instance) return fail("This employee has no onboarding to add a policy to.");

    const instance = await OnboardingInstance.findById(employee.instance);
    if (!instance) return fail("Onboarding instance not found.");

    const policy = await Policy.findById(policyId).lean();
    if (!policy) return fail("Policy not found.");
    if (policy.status !== "published" || !policy.latestPublished)
      return fail("Only published policies can be assigned. Publish it first.");
    const version = await PolicyVersion.findById(policy.latestPublished).lean();

    // Don't add the same policy twice.
    const exists = await OnboardingStep.findOne({
      instance: instance._id,
      kind: "policy",
      "snapshot.policyKey": policy.key,
    }).select("_id").lean();
    if (exists) return fail(`“${policy.title}” is already assigned to this employee.`);

    // Place it after any existing policy steps (POLICIES section base order = 4000).
    const policySteps = await OnboardingStep.find({ instance: instance._id, section: "POLICIES" })
      .select("order").lean();
    const order = (policySteps.length ? Math.max(...policySteps.map((s) => s.order)) : 4000) + 1;

    await OnboardingStep.create({
      instance: instance._id,
      employee: instance.employee,
      section: "POLICIES",
      kind: "policy",
      title: policy.title,
      required: true,
      order,
      status: "not_started",
      refKind: "policy",
      refId: policy._id,
      addedByAdmin: true,
      version: version?.version ?? "1.0",
      snapshot: {
        policyKey: policy.key,
        versionId: String(version?._id ?? ""),
        version: version?.version ?? "1.0",
        title: version?.title ?? policy.title,
        body: version?.body ?? "",
        effectiveDate: version?.effectiveDate ?? null,
      },
    });

    // Adding a required step changes progress — recompute from steps.
    await recomputeInstance(instance._id);

    await logActivity({
      actorType: "admin", actorName: user.name, action: "policy.assigned",
      message: `Assigned policy “${policy.title}” to ${employee.fullName}`,
      employee: instance.employee, instance: instance._id, resourceType: "Policy", resourceId: policy._id,
    });
    await notify({
      audience: "employee", type: "policy.assigned", title: "New policy to review & sign",
      message: `Please review and sign “${policy.title}”.`,
      employee: instance.employee, instance: instance._id,
      email: {
        to: employee.email,
        heading: "A new policy needs your signature ✍️",
        intro: `A new policy — “${policy.title}” — has been added to your onboarding for you to read and acknowledge.`,
        footerNote: "Sign in to your onboarding portal to review and sign this policy.",
      },
    });

    revalidatePath(`/employees/${employeeId}`);
    return ok(undefined, `“${policy.title}” assigned — employee notified`);
  });
}

export async function setPolicyArchived(id: string, archived: boolean): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("policies");
    await dbConnect();
    const policy = await Policy.findById(id);
    if (!policy) return fail("Policy not found.");
    policy.status = archived ? "archived" : policy.latestPublished ? "published" : "draft";
    await policy.save();
    revalidatePath("/policies");
    revalidatePath(`/policies/${id}`);
    return ok(undefined, archived ? "Policy archived" : "Policy restored");
  });
}
