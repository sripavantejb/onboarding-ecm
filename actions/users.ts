"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { User } from "@/models";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireUser, requireRole } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";
import { USER_ROLES } from "@/types";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function changeMyPassword(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const session = await requireUser();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

    await dbConnect();
    const user = await User.findById(session.uid);
    if (!user) return fail("Your account could not be found.");

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return fail("Current password is incorrect.");

    user.passwordHash = await hashPassword(parsed.data.newPassword);
    await user.save();

    return ok(undefined, "Password updated");
  });
}

const createUserSchema = z.object({
  name: z.string().min(2, "Name is too short").max(120),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(USER_ROLES),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function createUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const actor = await requireRole("SUPER_ADMIN");
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

    await dbConnect();
    const email = parsed.data.email.toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) return fail("A user with that email already exists.");

    const user = await User.create({
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
      status: "active",
    });

    await logActivity({
      actorType: "admin",
      actorName: actor.name,
      action: "user.created",
      message: `Created user “${user.name}”`,
      resourceType: "User",
      resourceId: user._id,
    });

    revalidatePath("/settings");
    return ok({ id: user._id.toString() }, "User created");
  });
}

export async function setUserStatus(
  id: string,
  status: "active" | "disabled",
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireRole("SUPER_ADMIN");
    if (id === actor.uid) return fail("You cannot disable your own account.");

    await dbConnect();
    await User.updateOne({ _id: id }, { $set: { status } });

    revalidatePath("/settings");
    return ok(undefined, status === "active" ? "User enabled" : "User disabled");
  });
}
