import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { User } from "@/models";
import { plain } from "@/lib/utils";
import { SettingsView, type SettingsUserDTO } from "@/components/admin/settings-view";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  await dbConnect();
  const me = await User.findById(session.uid).lean();

  const isSuperAdmin = session.role === "SUPER_ADMIN";
  let users: SettingsUserDTO[] = [];
  if (isSuperAdmin) {
    const rows = await User.find().sort({ createdAt: -1 }).lean();
    users = rows.map((u) => ({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
    }));
  }

  return (
    <SettingsView
      me={{
        name: me?.name ?? session.name,
        email: me?.email ?? session.email,
        role: me?.role ?? session.role,
      }}
      isSuperAdmin={isSuperAdmin}
      users={plain(users)}
      currentUserId={session.uid}
    />
  );
}
