"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  employeeId: z.string().min(1),
  instanceId: z.string().optional(),
  text: z.string().min(1, "Note cannot be empty").max(2000),
});

export async function addNote(input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    await dbConnect();
    await logActivity({
      actorType: "admin", actorName: user.name, action: "note.added",
      message: parsed.data.text, employee: parsed.data.employeeId, instance: parsed.data.instanceId ?? null,
      resourceType: "Note",
    });
    revalidatePath(`/employees/${parsed.data.employeeId}`);
    return ok(undefined, "Note added");
  });
}
