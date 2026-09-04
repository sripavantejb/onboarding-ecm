import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNotifications } from "@/actions/notifications";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { items, unread } = await getAdminNotifications(20);

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
