"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import {
  Employee, Department, Role, OnboardingInstance, OnboardingStep, OnboardingToken, User, Review,
} from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { buildPreview, generateInstanceForEmployee, type OnboardingPreview } from "@/lib/onboarding";
import { generateOnboardingToken, generatePassword } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { onboardingUrl, defaultExpiry } from "@/lib/onboarding-links";
import { EMPLOYMENT_TYPES, WORK_MODES } from "@/types";
import { logActivity, notify } from "@/lib/activity";

export async function getOnboardingPreview(
  departmentId: string,
  roleId: string,
): Promise<OnboardingPreview | null> {
  await requireCapability("employees");
  if (!departmentId || !roleId) return null;
  await dbConnect();
  return buildPreview(departmentId, roleId);
}

const createSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(30).optional().default(""),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Role is required"),
  reportingManager: z.string().optional().default(""),
  joiningDate: z.string().min(1, "Joining date is required"),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
});

async function generateEmployeeCode(): Promise<string> {
  const count = await Employee.countDocuments();
  for (let i = 0; i < 5; i++) {
    const code = `ECM-${String(count + 1 + i).padStart(4, "0")}`;
    if (!(await Employee.exists({ employeeCode: code }))) return code;
  }
  return `ECM-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function createEmployeeAndGenerate(
  input: unknown,
): Promise<ActionResult<{ employeeId: string; instanceId: string; url: string; name: string; department: string; role: string; email: string; password: string }>> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
    const d = parsed.data;
    await dbConnect();

    const [dept, role] = await Promise.all([Department.findById(d.department), Role.findById(d.role)]);
    if (!dept) return fail("Selected department was not found.");
    if (!role) return fail("Selected role was not found.");
    if (role.department.toString() !== dept._id.toString())
      return fail("That role does not belong to the selected department.");

    let managerName = "";
    let managerId: string | null = null;
    if (d.reportingManager) {
      const mgr = await User.findById(d.reportingManager).select("name").lean().catch(() => null);
      if (mgr) { managerName = mgr.name; managerId = String(mgr._id); }
    }

    // Auto-generate the employee's portal password (admin can reset it later).
    const portalPassword = generatePassword();

    const employee = await Employee.create({
      fullName: d.fullName,
      email: d.email.toLowerCase(),
      phone: d.phone,
      employeeCode: await generateEmployeeCode(),
      department: dept._id,
      role: role._id,
      reportingManager: managerId,
      reportingManagerName: managerName,
      joiningDate: new Date(d.joiningDate),
      employmentType: d.employmentType,
      workMode: d.workMode,
      status: "active",
      profile: {},
      portalPasswordHash: await hashPassword(portalPassword),
      portalPasswordSetAt: new Date(),
      createdByName: user.name,
    });

    // Generate onboarding instance + steps (snapshotting current published content).
    const instance = await generateInstanceForEmployee(employee, dept.name, role.title);
    employee.instance = instance._id;
    await employee.save();

    // 30/60/90 review structure, due relative to the joining date.
    const joining = new Date(d.joiningDate).getTime();
    await Review.insertMany(
      instance.reviews.map((days) => ({
        instance: instance._id,
        employee: employee._id,
        type: String(days) as "30" | "60" | "90",
        dueDate: new Date(joining + days * 24 * 60 * 60 * 1000),
        status: "pending",
      })),
    );

    // Secure onboarding token — only the hash is stored.
    const { raw, hash } = generateOnboardingToken();
    await OnboardingToken.create({
      instance: instance._id,
      employee: employee._id,
      tokenHash: hash,
      status: "active",
      expiresAt: defaultExpiry(),
      createdByName: user.name,
    });

    await logActivity({
      actorType: "admin", actorName: user.name, action: "employee.created",
      message: `Created employee ${employee.fullName} (${role.title}, ${dept.name})`,
      employee: employee._id, instance: instance._id, resourceType: "Employee", resourceId: employee._id,
    });
    await notify({
      audience: "admin", type: "employee.created", title: "New employee created",
      message: `${employee.fullName} — ${role.title}, ${dept.name}`,
      employee: employee._id, instance: instance._id, link: `/employees/${employee._id}`,
    });

    revalidatePath("/employees");
    revalidatePath("/dashboard");
    return ok(
      {
        employeeId: employee._id.toString(),
        instanceId: instance._id.toString(),
        url: onboardingUrl(raw),
        name: employee.fullName,
        department: dept.name,
        role: role.title,
        email: employee.email,
        password: portalPassword,
      },
      "Employee created & onboarding generated",
    );
  });
}

const updateSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  email: z.string().email("Enter a valid email"),
});

/** Edit an employee's basic details (name, email). Keeps denormalized copies in sync. */
export async function updateEmployee(
  employeeId: string,
  input: unknown,
): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
    await dbConnect();

    const employee = await Employee.findById(employeeId);
    if (!employee) return fail("Employee not found.");

    const previousName = employee.fullName;
    const previousEmail = employee.email;
    const nextEmail = parsed.data.email.toLowerCase().trim();

    // Email is the portal login identity — don't let two employees share one.
    if (nextEmail !== previousEmail) {
      const clash = await Employee.exists({ _id: { $ne: employee._id }, email: nextEmail });
      if (clash) return fail("Another employee already uses that email.");
    }

    employee.fullName = parsed.data.fullName.trim();
    employee.email = nextEmail;
    await employee.save();

    // Onboarding instances snapshot the name for fast lists — keep it consistent.
    if (employee.instance) {
      await OnboardingInstance.updateOne(
        { _id: employee.instance },
        { $set: { employeeName: employee.fullName } },
      );
    }

    const changes: string[] = [];
    if (previousName !== employee.fullName) changes.push(`name “${previousName}” → “${employee.fullName}”`);
    if (previousEmail !== nextEmail) changes.push(`email ${previousEmail} → ${nextEmail}`);
    await logActivity({
      actorType: "admin", actorName: user.name, action: "employee.updated",
      message: `Updated employee ${changes.join(", ") || "details"}`,
      employee: employee._id, instance: employee.instance, resourceType: "Employee", resourceId: employee._id,
    });

    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/employees");
    return ok(undefined, "Employee details updated");
  });
}

export async function archiveEmployee(id: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();
    await Employee.updateOne({ _id: id }, { $set: { status: "archived" } });
    await OnboardingToken.updateMany({ employee: id }, { $set: { status: "revoked" } });
    await logActivity({
      actorType: "admin", actorName: user.name, action: "employee.archived",
      message: `Archived employee`, employee: id, resourceType: "Employee", resourceId: id,
    });
    revalidatePath("/employees");
    return ok(undefined, "Employee archived and links revoked");
  });
}

const endTenureSchema = z.object({
  reason: z.string().max(300).optional().default(""),
});

/**
 * End an employee's tenure. Moves them to the "past employees" list, revokes
 * their portal access, and — via the status gate in `notify()` — stops any
 * further onboarding/update emails from reaching them.
 */
export async function endTenure(employeeId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = endTenureSchema.safeParse(input ?? {});
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
    await dbConnect();

    const employee = await Employee.findById(employeeId);
    if (!employee) return fail("Employee not found.");
    if (employee.status === "past") return fail("This employee's tenure has already ended.");

    const reason = parsed.data.reason.trim();
    employee.status = "past";
    employee.tenureEndedAt = new Date();
    employee.tenureEndReason = reason;
    await employee.save();

    // Cut off portal access — links stop working immediately.
    await OnboardingToken.updateMany({ employee: employee._id }, { $set: { status: "revoked" } });

    await logActivity({
      actorType: "admin", actorName: user.name, action: "employee.tenure_ended",
      message: `Ended tenure for ${employee.fullName}${reason ? ` — ${reason}` : ""}`,
      employee: employee._id, instance: employee.instance, resourceType: "Employee", resourceId: employee._id,
    });

    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/employees");
    return ok(undefined, "Tenure ended — moved to past employees");
  });
}

/** Reverse an end-tenure: bring a former employee back to active. Portal links must be regenerated. */
export async function reactivateEmployee(employeeId: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();

    const employee = await Employee.findById(employeeId);
    if (!employee) return fail("Employee not found.");
    if (employee.status === "active") return fail("This employee is already active.");

    employee.status = "active";
    employee.tenureEndedAt = null;
    employee.tenureEndReason = "";
    await employee.save();

    await logActivity({
      actorType: "admin", actorName: user.name, action: "employee.reactivated",
      message: `Reactivated ${employee.fullName}`,
      employee: employee._id, instance: employee.instance, resourceType: "Employee", resourceId: employee._id,
    });

    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/employees");
    return ok(undefined, "Employee reactivated — regenerate their link to restore portal access");
  });
}
