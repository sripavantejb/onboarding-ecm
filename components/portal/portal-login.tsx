"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employeeLogin } from "@/actions/portal-auth";

export function PortalLogin({ token, emailHint }: { token: string; emailHint?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await employeeLogin(token, { email, password });
      if (res.ok) {
        toast.success("Welcome back");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center"><BrandMark /></div>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-1.5 text-center">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <h1 className="text-lg font-semibold">Sign in to your onboarding</h1>
              <p className="text-sm text-muted-foreground">
                Use the work email and password your HR team shared with you.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailHint || "you@company.com"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" variant="brand" className="w-full" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                {pending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              Don&apos;t have a password? Contact your HR team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
