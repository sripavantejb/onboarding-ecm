"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Department, Role, Employee } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  description: z.string().max(400).optional().default(""),
});

export async function createDepartment(input: unknown): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("departments");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    const slug = slugify(parsed.data.name);
    const exists = await Department.findOne({ slug });
    if (exists) return fail("A department with a similar name already exists.");
    const dept = await Department.create({ ...parsed.data, slug, status: "active" });
    await logActivity({
      actorType: "admin",
      actorName: user.name,
      action: "department.created",
      message: `Created department “${dept.name}”`,
      resourceType: "Department",
      resourceId: dept._id,
    });
    revalidatePath("/departments");
    return ok({ id: dept._id.toString() }, "Department created");
  });
}

export async function updateDepartment(id: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("departments");
    const parsed = schema.partial().safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    await Department.updateOne({ _id: id }, { $set: parsed.data });
    revalidatePath("/departments");
    return ok(undefined, "Department updated");
  });
}

export async function setDepartmentStatus(id: string, status: "active" | "archived"): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("departments");
    await dbConnect();
    if (status === "archived") {
      const active = await Employee.countDocuments({ department: id, status: "active" });
      if (active > 0) return fail(`Cannot archive: ${active} active employee(s) are in this department.`);
    }
    await Department.updateOne({ _id: id }, { $set: { status } });
    await Role.updateMany({ department: id }, { $set: { status } });
    revalidatePath("/departments");
    return ok(undefined, status === "archived" ? "Department archived" : "Department restored");
  });
}
