"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { employeeLogout } from "@/actions/portal-auth";

export function SignOutButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      disabled={pending}
      onClick={() => start(async () => {
        await employeeLogout(token);
        router.refresh();
      })}
    >
      <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}
