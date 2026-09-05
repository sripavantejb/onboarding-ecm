"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Employee } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/password";
import { generatePassword } from "@/lib/tokens";
import { logActivity, notify } from "@/lib/activity";
import { infoBox } from "@/lib/email";

const schema = z.object({
  // If omitted, a strong password is generated. If provided, min 6 chars.
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

/**
 * Set or reset an employee's portal password. Only admins can do this.
 * Returns the plaintext password once so the admin can share it securely.
 */
export async function setEmployeePortalPassword(
  employeeId: string,
  input: unknown,
): Promise<ActionResult<{ password: string; email: string }>> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = schema.safeParse(input ?? {});
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid password");
    await dbConnect();

    const employee = await Employee.findById(employeeId);
    if (!employee) return fail("Employee not found.");

    const password = parsed.data.password ?? generatePassword();
    employee.portalPasswordHash = await hashPassword(password);
    employee.portalPasswordSetAt = new Date();
    await employee.save();

    await logActivity({
      actorType: "admin", actorName: user.name, action: "portal.password_set",
      message: `Set portal password for ${employee.fullName}`,
      employee: employee._id, instance: employee.instance,
    });
    await notify({
      audience: "employee", type: "credentials", title: "Your portal password was updated",
      message: "Your onboarding portal password has been reset.",
      employee: employee._id, instance: employee.instance,
      email: {
        to: employee.email,
        heading: "Your portal password was updated 🔑",
        intro: "Your Editco onboarding portal password has been reset. Use the credentials below to sign in via your onboarding link.",
        bodyHtml: infoBox([
          { label: "Portal email", value: employee.email, mono: true },
          { label: "New password", value: password, mono: true },
        ]),
        footerNote: "Open your onboarding link and sign in with these credentials. Keep them private.",
      },
    });

    revalidatePath(`/employees/${employee._id}`);
    return ok({ password, email: employee.email }, "Portal password set");
  });
}
