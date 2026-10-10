"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { HireDraft } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { EMPLOYMENT_TYPES, WORK_MODES } from "@/types";

const draftSchema = z.object({
  fullName: z.string().max(120).optional().default(""),
  email: z.string().max(200).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  department: z.string().optional().default(""),
  role: z.string().optional().default(""),
  reportingManager: z.string().optional().default(""),
  reportingManagerName: z.string().max(120).optional().default(""),
  joiningDate: z.string().optional().default(""),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().default("Full-time"),
  workMode: z.enum(WORK_MODES).optional().default("On-site"),
});

function oidOrNull(value: string) {
  return /^[a-f\d]{24}$/i.test(value) ? value : null;
}

export async function saveHireDraft(
  input: unknown,
  draftId?: string,
): Promise<ActionResult<{ id: string }>> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = draftSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
    const d = parsed.data;
    const name = d.fullName.trim();
    const email = d.email.trim().toLowerCase();
    if (name.length < 2 && !email.includes("@")) {
      return fail("Add a name or email before saving a draft.");
    }
    if (email && !email.includes("@")) return fail("Enter a valid email, or leave it blank.");

    await dbConnect();
    const fields = {
      fullName: name,
      email,
      phone: d.phone.trim(),
      department: oidOrNull(d.department),
      role: oidOrNull(d.role),
      reportingManager: oidOrNull(d.reportingManager),
      reportingManagerName: d.reportingManagerName.trim(),
      joiningDate: d.joiningDate,
      employmentType: d.employmentType,
      workMode: d.workMode,
      createdByName: user.name,
    };

    if (draftId && oidOrNull(draftId)) {
      const existing = await HireDraft.findByIdAndUpdate(draftId, fields, { returnDocument: "after" });
      if (existing) {
        revalidatePath("/employees");
        revalidatePath("/employees/new");
        return ok({ id: existing._id.toString() }, "Draft saved. You can come back and finish it.");
      }
    }

    const created = await HireDraft.create(fields);
    revalidatePath("/employees");
    revalidatePath("/employees/new");
    return ok({ id: created._id.toString() }, "Draft saved. You can come back and finish it.");
  });
}

export async function discardHireDraft(draftId: string): Promise<ActionResult> {
  return guard(async () => {
    await requireCapability("employees");
    await dbConnect();
    await HireDraft.findByIdAndDelete(draftId);
    revalidatePath("/employees");
    return ok(undefined, "Draft discarded");
  });
}
