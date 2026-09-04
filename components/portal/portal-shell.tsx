import { BrandMark } from "@/components/brand-mark";
import { Progress } from "@/components/ui/progress";
import { SignOutButton } from "@/components/portal/sign-out-button";

export function PortalShell({
  name,
  progress,
  token,
  children,
}: {
  name?: string;
  progress?: number;
  token?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandMark />
          <div className="flex items-center gap-3">
            {typeof progress === "number" && (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-medium leading-none">{name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{progress}% complete</p>
                </div>
                <div className="w-24"><Progress value={progress} /></div>
              </div>
            )}
            {token && <SignOutButton token={token} />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 pt-4 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Editco Media · This is your private onboarding portal.
      </footer>
    </div>
  );
}
