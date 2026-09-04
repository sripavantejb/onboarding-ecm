"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { FileSignature, Download, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { acceptOffer } from "@/actions/portal";

export function OfferCard({
  token, status, acceptedAt,
}: {
  token: string;
  status: "issued" | "accepted" | "revoked";
  acceptedAt: string | null;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const accepted = status === "accepted";

  return (
    <Card className="border-brand/30 bg-brand/[0.03]">
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">Your offer letter</p>
              {accepted && <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Accepted</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {accepted ? "Thanks for accepting — download a copy any time." : "Review and download your official Editco offer letter."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/portal/offer/${token}`} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> Download PDF</a>
          </Button>
          {!accepted && (
            <Button
              variant="brand"
              size="sm"
              disabled={pending}
              onClick={() => start(async () => {
                const res = await acceptOffer(token);
                if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
              })}
            >
              {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Accept offer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
