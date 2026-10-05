"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { OnboardingToken, OnboardingInstance, Employee } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { generateOnboardingToken, generatePassword } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { onboardingUrl, defaultExpiry } from "@/lib/onboarding-links";
import { logActivity, notify } from "@/lib/activity";
import { infoBox } from "@/lib/email";

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

/**
 * Send the onboarding invitation email. Because the portal password is stored
 * only as a hash, we (re)set a fresh password and issue a fresh onboarding link
 * here so the email always contains working credentials. Re-sending therefore
 * rotates the previous password/link.
 */
export async function sendInvitation(instanceId: string): Promise<ActionResult<{ url: string }>> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();
    const instance = await OnboardingInstance.findById(instanceId);
    if (!instance) return fail("Onboarding instance not found.");

    const employee = await Employee.findById(instance.employee);
    if (!employee) return fail("Employee not found.");
    if (employee.status !== "active") {
      return fail("Cannot invite an employee who is not active.");
    }

    // Fresh portal password (only the hash is stored) so we can email real creds.
    // Advancing portalPasswordSetAt also invalidates any existing portal sessions.
    const portalPassword = generatePassword();
    employee.portalPasswordHash = await hashPassword(portalPassword);
    employee.portalPasswordSetAt = new Date();
    await employee.save();

    // Fresh onboarding link — revoke any active token, issue a new one.
    await OnboardingToken.updateMany(
      { instance: instance._id, status: "active" },
      { $set: { status: "revoked" } },
    );
    const { raw, hash } = generateOnboardingToken();
    await OnboardingToken.create({
      instance: instance._id,
      employee: employee._id,
      tokenHash: hash,
      status: "active",
      expiresAt: defaultExpiry(),
      createdByName: user.name,
    });
    const url = onboardingUrl(raw);

    instance.invitationSentAt = new Date();
    await instance.save();

    const firstName = employee.fullName.split(" ")[0] || "there";
    const { emailed } = await notify({
      audience: "employee",
      type: "invitation",
      title: "Your Editco onboarding is ready",
      message: "Open your secure link to begin onboarding.",
      employee: employee._id,
      instance: instance._id,
      email: {
        to: employee.email,
        subject: "Welcome to Editco — start your onboarding",
        heading: `Welcome to Editco, ${firstName}!`,
        intro:
          "Your onboarding portal is ready. Use the button below to open your secure onboarding link, then sign in with the credentials shown here.",
        bodyHtml: infoBox([
          { label: "Portal email", value: employee.email, mono: true },
          { label: "Password", value: portalPassword, mono: true },
        ]),
        ctaLabel: "Start onboarding",
        ctaUrl: url,
        footerNote:
          "This link is unique to you and expires in 14 days. For your security, keep these credentials private.",
      },
    });

    await logActivity({
      actorType: "admin", actorName: user.name, action: "invitation.sent",
      message: emailed
        ? `Invitation emailed to ${employee.fullName} (${employee.email})`
        : `Invitation prepared for ${employee.fullName} (${employee.email}) — email not sent`,
      employee: employee._id, instance: instance._id,
    });

    revalidatePath(`/employees/${instance.employee}`);
    return ok(
      { url },
      emailed
        ? `Invitation emailed to ${employee.email}`
        : `Link ready for ${employee.email} (email not sent — check SMTP settings)`,
    );
  });
}
