"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Role, Department, Employee } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  title: z.string().min(2, "Title is too short").max(80),
  department: z.string().min(1, "Department is required"),
  description: z.string().max(400).optional().default(""),
});

export async function createRole(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("roles");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    const dept = await Department.findById(parsed.data.department);
    if (!dept) return fail("Selected department was not found.");
    const slug = slugify(parsed.data.title);
    const exists = await Role.findOne({ department: dept._id, slug });
    if (exists) return fail("A role with a similar title already exists in this department.");
    const role = await Role.create({
      title: parsed.data.title,
      description: parsed.data.description,
      department: dept._id,
      slug,
      status: "active",
    });
    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "role.created",
      message: `Created role “${role.title}” in ${dept.name}`,
      resourceType: "Role",
      resourceId: role._id,
    });
    revalidatePath("/roles");
    return ok({ id: role._id.toString() }, "Role created");
  });
}

export async function updateRole(id: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("roles");
    const parsed = schema.partial().safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    const patch: Record<string, unknown> = {};
    if (parsed.data.title) patch.title = parsed.data.title;
    if (parsed.data.description !== undefined) patch.description = parsed.data.description;
    if (parsed.data.department) patch.department = parsed.data.department;
    await Role.updateOne({ _id: id }, { $set: patch });
    revalidatePath("/roles");
    return ok(undefined, "Role updated");
  });
}

export async function setRoleStatus(id: string, status: "active" | "archived"): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("roles");
    await dbConnect();
    if (status === "archived") {
      const active = await Employee.countDocuments({ role: id, status: "active" });
      if (active > 0) return fail(`Cannot archive: ${active} active employee(s) have this role.`);
    }
    await Role.updateOne({ _id: id }, { $set: { status } });
    revalidatePath("/roles");
    return ok(undefined, status === "archived" ? "Role archived" : "Role restored");
  });
}
