"use server";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Notification } from "@/models";
import { requireUser } from "@/lib/authz";
import { plain } from "@/lib/utils";

export interface NotificationDTO {
  _id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export async function getAdminNotifications(limit = 20): Promise<{
  items: NotificationDTO[];
  unread: number;
}> {
  await requireUser();
  await dbConnect();
  const [items, unread] = await Promise.all([
    Notification.find({ audience: "admin" }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ audience: "admin", read: false }),
  ]);
  return { items: plain(items) as unknown as NotificationDTO[], unread };
}

export async function markNotificationRead(id: string) {
  await requireUser();
  await dbConnect();
  await Notification.updateOne({ _id: id, audience: "admin" }, { $set: { read: true } });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  await requireUser();
  await dbConnect();
  await Notification.updateMany({ audience: "admin", read: false }, { $set: { read: true } });
  revalidatePath("/", "layout");
}
