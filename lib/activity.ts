import "server-only";
import mongoose from "mongoose";
import { ActivityLog, Notification, Employee } from "@/models";
import { sendMail, renderEmail } from "@/lib/email";

interface LogInput {
  actorType: "admin" | "employee" | "system";
  actorName?: string;
  action: string;
  message: string;
  employee?: mongoose.Types.ObjectId | string | null;
  instance?: mongoose.Types.ObjectId | string | null;
  resourceType?: string;
  resourceId?: mongoose.Types.ObjectId | string | null;
  meta?: Record<string, unknown>;
}

export async function logActivity(input: LogInput): Promise<void> {
  try {
    await ActivityLog.create({
      actorType: input.actorType,
      actorName: input.actorName ?? "System",
      action: input.action,
      message: input.message,
      employee: input.employee ?? null,
      instance: input.instance ?? null,
      resourceType: input.resourceType ?? "",
      resourceId: input.resourceId ?? null,
      meta: input.meta ?? {},
    });
  } catch (err) {
    // Never let logging break the primary operation.
    console.error("logActivity failed", err);
  }
}

/**
 * Optional email delivery for a notification. When present, `notify()` also
 * sends a branded email. The recipient defaults to the linked employee's work
 * email, so most call sites only need `email: {}` (or a CTA).
 */
interface NotifyEmail {
  to?: string; // explicit recipient; otherwise resolved from `employee`
  subject?: string; // defaults to the notification title
  heading?: string; // defaults to the notification title
  intro?: string; // defaults to the notification message
  bodyHtml?: string; // extra HTML block (e.g. a credentials box)
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

interface NotifyInput {
  audience: "admin" | "employee";
  type: string;
  title: string;
  message?: string;
  link?: string;
  employee?: mongoose.Types.ObjectId | string | null;
  instance?: mongoose.Types.ObjectId | string | null;
  email?: NotifyEmail;
}

/**
 * Create a notification (and optionally send an email). This is the single
 * funnel — pass `email` to also deliver a branded message to the recipient.
 * Returns whether the email was actually handed off to SMTP.
 */
export async function notify(input: NotifyInput): Promise<{ emailed: boolean }> {
  try {
    await Notification.create({
      audience: input.audience,
      type: input.type,
      title: input.title,
      message: input.message ?? "",
      link: input.link ?? "",
      employee: input.employee ?? null,
      instance: input.instance ?? null,
      read: false,
    });
  } catch (err) {
    console.error("notify failed", err);
  }

  if (!input.email) return { emailed: false };
  try {
    let to = input.email.to;
    if (input.employee) {
      const emp = await Employee.findById(input.employee).select("email status").lean();
      // Former employees (tenure ended) receive no further update emails.
      if (emp && emp.status !== "active") {
        console.warn(`[email] recipient is not an active employee — skipped "${input.title}"`);
        return { emailed: false };
      }
      if (!to) to = emp?.email ?? undefined;
    }
    if (!to) {
      console.warn(`[email] no recipient for notification "${input.title}" — skipped`);
      return { emailed: false };
    }
    const emailed = await sendMail({
      to,
      subject: input.email.subject ?? input.title,
      html: renderEmail({
        heading: input.email.heading ?? input.title,
        intro: input.email.intro ?? input.message,
        bodyHtml: input.email.bodyHtml,
        ctaLabel: input.email.ctaLabel,
        ctaUrl: input.email.ctaUrl,
        footerNote: input.email.footerNote,
      }),
    });
    return { emailed };
  } catch (err) {
    console.error("notify email failed", err);
    return { emailed: false };
  }
}
