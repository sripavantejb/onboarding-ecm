"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { resolvePortal } from "@/lib/portal";
import { verifyPassword } from "@/lib/password";
import { createEmployeeSession, destroyEmployeeSession } from "@/lib/employee-auth";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function employeeLogin(token: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");

    const portal = await resolvePortal(token);
    if (!portal.ok) return fail("This onboarding link is no longer valid.");
    const { employee, instance } = portal;

    if (parsed.data.email.trim().toLowerCase() !== employee.email.toLowerCase()) {
      return fail("Invalid email or password.");
    }
    if (!employee.portalPasswordHash) {
      return fail("Your account isn’t ready yet. Please ask your HR team to set your password.");
    }
    const valid = await verifyPassword(parsed.data.password, employee.portalPasswordHash);
    if (!valid) return fail("Invalid email or password.");

    await createEmployeeSession({
      eid: employee._id.toString(),
      iid: instance._id.toString(),
      name: employee.fullName,
    });
    await logActivity({
      actorType: "employee", actorName: employee.fullName, action: "portal.signin",
      message: `${employee.fullName} signed in to the portal`,
      employee: employee._id, instance: instance._id,
    });
    revalidatePath(`/onboard/${token}`);
    return ok(undefined, "Signed in");
  });
}

export async function employeeLogout(token: string): Promise<ActionResult> {
  return guard(async () => {
    await destroyEmployeeSession();
    revalidatePath(`/onboard/${token}`);
    return ok(undefined, "Signed out");
  });
}
