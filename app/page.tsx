import { redirect } from "next/navigation";
import { getActiveSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getActiveSession();
  redirect(session ? "/dashboard" : "/login");
}
