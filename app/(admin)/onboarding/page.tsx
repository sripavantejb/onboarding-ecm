import Link from "next/link";
import { Workflow } from "lucide-react";
import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { OnboardingInstance } from "@/models";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/utils";
import { ONBOARDING_STATUSES, ONBOARDING_STATUS_LABELS, type OnboardingStatus } from "@/types";

export const metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

const COLUMN_ACCENT: Record<OnboardingStatus, string> = {
  not_started: "border-muted-foreground/30",
  in_progress: "border-brand/40",
  action_required: "border-destructive/40",
  awaiting_review: "border-warning/50",
  completed: "border-success/40",
};

export default async function OnboardingPage() {
  await requireCapability("onboarding");
  await dbConnect();

  const instances = await OnboardingInstance.find()
    .populate<{ employee: { _id: string } }>("employee", "_id")
    .sort({ updatedAt: -1 })
    .lean();

  const byStatus = new Map<OnboardingStatus, typeof instances>();
  for (const s of ONBOARDING_STATUSES) byStatus.set(s, []);
  for (const inst of instances) byStatus.get(inst.status as OnboardingStatus)?.push(inst);

  const total = instances.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" description="Every active onboarding, grouped by where it stands right now." />

      {total === 0 ? (
        <EmptyState icon={Workflow} title="No onboarding in progress" description="Create an employee to generate their onboarding." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ONBOARDING_STATUSES.map((status) => {
            const items = byStatus.get(status) ?? [];
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{ONBOARDING_STATUS_LABELS[status]}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">None</p>}
                  {items.map((inst) => (
                    <Link key={String(inst._id)} href={`/employees/${(inst.employee as { _id?: string })?._id ?? inst.employee}`}>
                      <Card className={`border-l-2 p-3 transition-colors hover:bg-muted/30 ${COLUMN_ACCENT[status]}`}>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={inst.employeeName} className="h-8 w-8" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{inst.employeeName}</p>
                            <p className="truncate text-xs text-muted-foreground">{inst.roleName}</p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-2">
                          <Progress value={inst.progress} className="h-1.5" />
                          <span className="text-[11px] tabular-nums text-muted-foreground">{inst.progress}%</span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">Updated {timeAgo(inst.updatedAt as Date)}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
