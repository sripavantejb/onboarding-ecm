import { Ban, Clock, Link2Off } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent } from "@/components/ui/card";
import type { PortalReason } from "@/lib/portal";

const CONTENT: Record<PortalReason, { icon: React.ElementType; title: string; message: string }> = {
  invalid: {
    icon: Link2Off,
    title: "This link isn’t valid",
    message: "We couldn’t find an onboarding for this link. Please check the URL, or contact your HR team for a fresh invitation.",
  },
  expired: {
    icon: Clock,
    title: "This invitation has expired",
    message: "For security, onboarding links expire after a set time. Please ask your HR team to send you a new link.",
  },
  revoked: {
    icon: Ban,
    title: "This link has been revoked",
    message: "This onboarding link is no longer active. Please contact your HR team if you believe this is a mistake.",
  },
};

export function InvalidLink({ reason }: { reason: PortalReason }) {
  const c = CONTENT[reason];
  const Icon = c.icon;
  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center"><BrandMark /></div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-semibold">{c.title}</h1>
              <p className="text-sm text-muted-foreground">{c.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
