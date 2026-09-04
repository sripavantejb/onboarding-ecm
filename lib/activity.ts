import "server-only";
import mongoose from "mongoose";
import { ActivityLog, Notification } from "@/models";

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

interface NotifyInput {
  audience: "admin" | "employee";
  type: string;
  title: string;
  message?: string;
  link?: string;
  employee?: mongoose.Types.ObjectId | string | null;
  instance?: mongoose.Types.ObjectId | string | null;
}

/**
 * Create a notification. Designed so an email/webhook transport can be added
 * later without changing call sites — this is the single funnel.
 */
export async function notify(input: NotifyInput): Promise<void> {
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
    // Future: await sendEmail(...) / await postWebhook(...)
  } catch (err) {
    console.error("notify failed", err);
  }
}
