import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNotificationsSafe } from "@/actions/notifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Reject disabled accounts even if a JWT cookie is still present.
  const session = await getActiveSession();
  if (!session) redirect("/login");

  // Notifications are non-critical — never let a DB blip crash the admin shell.
  const { items, unread } = await getAdminNotificationsSafe(20);

  return (
    <AdminShell
      user={{ name: session.name, email: session.email, role: session.role }}
      notifications={items}
      unread={unread}
    >
      {children}
    </AdminShell>
  );
}
