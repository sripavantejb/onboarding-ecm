import "server-only";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { OnboardingToken, OnboardingInstance, Employee } from "@/models";
import { hashToken } from "@/lib/tokens";
import { logActivity, notify } from "@/lib/activity";
import type { IOnboardingInstance } from "@/models/OnboardingInstance";
import type { IEmployee } from "@/models/Employee";
import type { IOnboardingToken } from "@/models/OnboardingToken";

export type PortalReason = "invalid" | "revoked" | "expired";

export type PortalResolution =
  | {
      ok: true;
      token: mongoose.HydratedDocument<IOnboardingToken>;
      instance: mongoose.HydratedDocument<IOnboardingInstance>;
      employee: mongoose.HydratedDocument<IEmployee>;
    }
  | { ok: false; reason: PortalReason };

/** Validate a raw onboarding token entirely server-side. */
export async function resolvePortal(rawToken: string): Promise<PortalResolution> {
  await dbConnect();
  if (!rawToken || rawToken.length < 16) return { ok: false, reason: "invalid" };

  const token = await OnboardingToken.findOne({ tokenHash: hashToken(rawToken) });
  if (!token) return { ok: false, reason: "invalid" };
  if (token.status === "revoked") return { ok: false, reason: "revoked" };
  if (new Date(token.expiresAt).getTime() < Date.now()) return { ok: false, reason: "expired" };

  const [instance, employee] = await Promise.all([
    OnboardingInstance.findById(token.instance),
    Employee.findById(token.employee),
  ]);
  if (!instance || !employee || employee.status !== "active") return { ok: false, reason: "invalid" };

  return { ok: true, token, instance, employee };
}

/** Record access; on the first open, fire the "portal opened" side-effects. */
export async function touchPortalAccess(
  token: mongoose.HydratedDocument<IOnboardingToken>,
  instance: mongoose.HydratedDocument<IOnboardingInstance>,
) {
  const firstOpen = !token.firstOpenedAt;
  token.lastAccessedAt = new Date();
  token.openCount = (token.openCount ?? 0) + 1;
  if (firstOpen) token.firstOpenedAt = new Date();
  await token.save();

  if (firstOpen) {
    instance.firstOpenedAt = new Date();
    if (!instance.startedAt) instance.startedAt = new Date();
    if (instance.status === "not_started") instance.status = "in_progress";
    await instance.save();
    await logActivity({
      actorType: "employee", actorName: instance.employeeName, action: "portal.opened",
      message: `${instance.employeeName} opened the onboarding portal`,
      employee: instance.employee, instance: instance._id,
    });
    await notify({
      audience: "admin", type: "portal.opened", title: "Portal opened",
      message: `${instance.employeeName} opened their onboarding portal.`,
      employee: instance.employee, instance: instance._id, link: `/employees/${instance.employee}`,
    });
  }
}
