"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/auth";
import { ok, fail, type ActionResult, guard } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[String(issue.path[0])] = issue.message;
      return fail("Please check the form.", fe);
    }

    await dbConnect();
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (!user || user.status !== "active") {
      return fail("Invalid email or password.");
    }
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return fail("Invalid email or password.");

    await createSession({
      uid: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });
    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "auth.login",
      message: `${user.name} signed in`,
    });
    return ok(undefined, "Welcome back");
  });
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
