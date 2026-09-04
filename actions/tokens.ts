"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { OnboardingToken, OnboardingInstance, Employee } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { generateOnboardingToken } from "@/lib/tokens";
import { onboardingUrl, defaultExpiry } from "@/lib/onboarding-links";
import { logActivity, notify } from "@/lib/activity";

/** Revoke existing active tokens and issue a fresh one. Returns the new URL. */
export async function regenerateToken(instanceId: string): Promise<ActionResult<{ url: string }>> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();
    const instance = await OnboardingInstance.findById(instanceId);
    if (!instance) return fail("Onboarding instance not found.");

    await OnboardingToken.updateMany(
      { instance: instance._id, status: "active" },
      { $set: { status: "revoked" } },
    );

    const { raw, hash } = generateOnboardingToken();
    await OnboardingToken.create({
      instance: instance._id,
      employee: instance.employee,
      tokenHash: hash,
      status: "active",
      expiresAt: defaultExpiry(),
      createdByName: user.name,
    });

    await logActivity({
      actorType: "admin", actorName: user.name, action: "link.regenerated",
      message: "Onboarding link regenerated", employee: instance.employee, instance: instance._id,
    });
    revalidatePath(`/employees/${instance.employee}`);
    return ok({ url: onboardingUrl(raw) }, "New link generated — previous link revoked");
  });
}

export async function revokeToken(instanceId: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();
    const instance = await OnboardingInstance.findById(instanceId);
    if (!instance) return fail("Onboarding instance not found.");
    await OnboardingToken.updateMany(
      { instance: instance._id, status: "active" },
      { $set: { status: "revoked" } },
    );
    await logActivity({
      actorType: "admin", actorName: user.name, action: "link.revoked",
      message: "Onboarding link revoked", employee: instance.employee, instance: instance._id,
    });
    revalidatePath(`/employees/${instance.employee}`);
    return ok(undefined, "Link revoked");
  });
}

const expirySchema = z.object({ days: z.number().int().min(1).max(365) });

export async function setTokenExpiry(instanceId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("employees");
    const parsed = expirySchema.safeParse(input);
    if (!parsed.success) return fail("Enter a valid number of days (1–365).");
    await dbConnect();
    const instance = await OnboardingInstance.findById(instanceId);
    if (!instance) return fail("Onboarding instance not found.");
    const res = await OnboardingToken.updateOne(
      { instance: instance._id, status: "active" },
      { $set: { expiresAt: defaultExpiry(parsed.data.days) } },
    );
    if (res.matchedCount === 0) return fail("No active link to update. Regenerate a link first.");
    revalidatePath(`/employees/${instance.employee}`);
    return ok(undefined, `Link now expires in ${parsed.data.days} days`);
  });
}

export async function sendInvitation(instanceId: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();
    const instance = await OnboardingInstance.findById(instanceId);
    if (!instance) return fail("Onboarding instance not found.");
    const activeToken = await OnboardingToken.findOne({ instance: instance._id, status: "active" });
    if (!activeToken) return fail("No active link. Regenerate a link before sending the invitation.");

    instance.invitationSentAt = new Date();
    await instance.save();

    const employee = await Employee.findById(instance.employee).select("fullName email").lean();
    await logActivity({
      actorType: "admin", actorName: user.name, action: "invitation.sent",
      message: `Invitation sent to ${employee?.fullName ?? "employee"} (${employee?.email ?? ""})`,
      employee: instance.employee, instance: instance._id,
    });
    await notify({
      audience: "employee", type: "invitation", title: "Your Editco onboarding is ready",
      message: "Open your secure link to begin onboarding.", employee: instance.employee, instance: instance._id,
    });
    revalidatePath(`/employees/${instance.employee}`);
    // Email transport can be wired into notify() later; the invitation is recorded now.
    return ok(undefined, "Invitation recorded & employee notified");
  });
}
