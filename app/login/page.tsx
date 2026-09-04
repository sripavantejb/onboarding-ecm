import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <BrandMark variant="dark" />
        <div className="space-y-4">
          <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Onboard new team members in minutes, not weeks.
          </h2>
          <p className="max-w-md text-sm text-primary-foreground/70">
            Create an employee, pick a department and role, and Editco Onboarding builds a
            complete, versioned onboarding journey — documents, policies, training and reviews —
            automatically.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Editco Media. Internal use only.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the admin dashboard.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
