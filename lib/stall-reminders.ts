import "server-only";
import { dbConnect } from "@/lib/db";
import { Employee, OnboardingInstance, OnboardingStep, User } from "@/models";
import { sendMail, renderEmail, escapeHtml } from "@/lib/email";
import { notify } from "@/lib/activity";
import { env } from "@/lib/env";

const STALL_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_PER_SWEEP = 15;

/**
 * Email the employee and their reporting manager when required steps have sat
 * unfinished for three days. Runs at most once per employee per three days.
 */
export async function sendStallReminders(): Promise<number> {
  await dbConnect();
  const cutoff = new Date(Date.now() - STALL_MS);

  const steps = await OnboardingStep.find({
    required: true,
    status: { $in: ["not_started", "in_progress", "rejected"] },
    updatedAt: { $lte: cutoff },
  })
    .select("instance title")
    .lean();

  const titlesByInstance = new Map<string, string[]>();
  for (const step of steps) {
    const id = String(step.instance);
    const list = titlesByInstance.get(id) ?? [];
    list.push(step.title);
    titlesByInstance.set(id, list);
  }
  if (titlesByInstance.size === 0) return 0;

  const instances = await OnboardingInstance.find({
    _id: { $in: [...titlesByInstance.keys()] },
    status: { $ne: "completed" },
    $or: [
      { lastStallReminderAt: null },
      { lastStallReminderAt: { $exists: false } },
      { lastStallReminderAt: { $lte: cutoff } },
    ],
  })
    .select("employee employeeName lastStallReminderAt")
    .limit(MAX_PER_SWEEP)
    .lean();
  if (instances.length === 0) return 0;

  const employees = await Employee.find({
    _id: { $in: instances.map((i) => i.employee) },
    status: "active",
  })
    .select("fullName email reportingManager reportingManagerName")
    .lean();
  const employeeById = new Map(employees.map((e) => [String(e._id), e]));

  const managerIds = employees.flatMap((e) => (e.reportingManager ? [e.reportingManager] : []));
  const managers = managerIds.length
    ? await User.find({ _id: { $in: managerIds }, status: "active" }).select("email name").lean()
    : [];
  const managerById = new Map(managers.map((m) => [String(m._id), m]));

  let sent = 0;
  for (const instance of instances) {
    const employee = employeeById.get(String(instance.employee));
    if (!employee) continue;
    const titles = titlesByInstance.get(String(instance._id)) ?? [];
    if (titles.length === 0) continue;

    const list = `<ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.6;color:#334155;">${titles
      .slice(0, 8)
      .map((t) => `<li>${escapeHtml(t)}</li>`)
      .join("")}</ul>`;
    const intro = `${titles.length} required step${titles.length === 1 ? "" : "s"} ${titles.length === 1 ? "has" : "have"} been waiting for at least 3 days.`;

    if (employee.email) {
      await sendMail({
        to: employee.email,
        subject: "Your Editco onboarding is waiting",
        html: renderEmail({
          heading: "A few steps are still open",
          intro: `Hi ${employee.fullName.split(" ")[0]}, ${intro}`,
          bodyHtml: list,
          footerNote: "Open the onboarding link from your invitation email to continue.",
        }),
      });
    }

    const manager = employee.reportingManager ? managerById.get(String(employee.reportingManager)) : undefined;
    const adminUrl = `${env.APP_URL}/employees/${employee._id}`;
    if (manager?.email) {
      await sendMail({
        to: manager.email,
        subject: `${employee.fullName}'s onboarding needs a nudge`,
        html: renderEmail({
          heading: `${employee.fullName} is stalled`,
          intro,
          bodyHtml: list,
          ctaLabel: "Open their record",
          ctaUrl: adminUrl,
        }),
      });
    }

    await notify({
      audience: "admin",
      type: "onboarding.stalled",
      title: "Onboarding needs a nudge",
      message: `${employee.fullName} — ${intro}`,
      employee: employee._id,
      instance: instance._id,
      link: `/employees/${employee._id}`,
    });

    await OnboardingInstance.updateOne(
      { _id: instance._id },
      { $set: { lastStallReminderAt: new Date() } },
    );
    sent++;
  }
  return sent;
}
