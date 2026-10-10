import Link from "next/link";
import {
  Users, PlayCircle, AlertTriangle, Clock, CheckCircle2, CircleDashed, Plus, CalendarDays, ArrowRight,
} from "lucide-react";
import { getActiveSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Employee, OnboardingInstance, Review } from "@/models";
import { sendStallReminders } from "@/lib/stall-reminders";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { OnboardingStatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { EmptyState } from "@/components/empty-state";
import { formatDate, timeAgo } from "@/lib/utils";
import type { OnboardingStatus } from "@/types";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getActiveSession();
  await dbConnect();
  await sendStallReminders().catch((err) => console.error("stall reminders failed", err));

  const reviewSoon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const reviewQuery: Record<string, unknown> = {
    status: "pending",
    dueDate: { $lte: reviewSoon },
  };

  const [statusAgg, totalEmployees, recent, upcoming, dueReviews] = await Promise.all([
    OnboardingInstance.aggregate<{ _id: OnboardingStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Employee.countDocuments({ status: "active" }),
    Employee.find({ status: "active" })
      .populate<{ department: { name: string } }>("department", "name")
      .populate<{ role: { title: string } }>("role", "title")
      .populate<{ instance: { status: OnboardingStatus; progress: number; updatedAt: Date } }>("instance", "status progress updatedAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Employee.find({ status: "active", joiningDate: { $gte: startOfToday() } })
      .populate<{ role: { title: string } }>("role", "title")
      .sort({ joiningDate: 1 })
      .limit(5)
      .lean(),
    Review.find(reviewQuery)
      .populate<{ employee: { _id: string; fullName: string; reportingManager?: string } }>(
        "employee",
        "fullName reportingManager",
      )
      .sort({ dueDate: 1 })
      .limit(12)
      .lean(),
  ]);

  const managerOnly = session?.role === "MANAGER";
  const reviewsDue = dueReviews
    .filter((r) => {
      const emp = r.employee as { reportingManager?: { toString(): string } | string } | null;
      if (!managerOnly) return Boolean(emp);
      const managerId = emp?.reportingManager ? String(emp.reportingManager) : "";
      return managerId === session?.uid;
    })
    .slice(0, 6);

  const counts: Record<string, number> = {};
  for (const s of statusAgg) counts[s._id] = s.count;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${session?.name?.split(" ")[0] ?? "there"}`}
        description="Here's how onboarding is tracking across Editco."
        actions={<Button asChild variant="brand"><Link href="/employees/new"><Plus /> New employee</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Employees" value={totalEmployees} icon={Users} href="/employees" />
        <StatCard label="Not Started" value={counts.not_started ?? 0} icon={CircleDashed} href="/employees?status=not_started" />
        <StatCard label="In Progress" value={counts.in_progress ?? 0} icon={PlayCircle} accent="brand" href="/employees?status=in_progress" />
        <StatCard label="Action Required" value={counts.action_required ?? 0} icon={AlertTriangle} accent="destructive" href="/employees?status=action_required" />
        <StatCard label="Awaiting Review" value={counts.awaiting_review ?? 0} icon={Clock} accent="warning" href="/employees?status=awaiting_review" />
        <StatCard label="Completed" value={counts.completed ?? 0} icon={CheckCircle2} accent="success" href="/employees?status=completed" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent employees</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/employees">View all <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={Users} title="No employees yet" description="Create your first employee to see them here." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((e) => {
                    const inst = e.instance as { status?: OnboardingStatus; progress?: number; updatedAt?: Date } | null;
                    return (
                      <TableRow key={String(e._id)}>
                        <TableCell>
                          <Link href={`/employees/${e._id}`} className="flex items-center gap-3">
                            <UserAvatar name={e.fullName} className="h-8 w-8" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{e.fullName}</p>
                              <p className="truncate text-xs text-muted-foreground">{(e.department as { name?: string })?.name ?? "—"}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{(e.role as { title?: string })?.title ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={inst?.progress ?? 0} className="w-16" />
                            <span className="text-xs tabular-nums text-muted-foreground">{inst?.progress ?? 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell><OnboardingStatusBadge status={(inst?.status ?? "not_started") as OnboardingStatus} /></TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{inst?.updatedAt ? timeAgo(inst.updatedAt) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" /> Reviews due</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/reviews">All <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
          </CardHeader>
          <CardContent>
            {reviewsDue.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No 30/60/90 reviews due in the next two weeks.</p>
            ) : (
              <ul className="space-y-3">
                {reviewsDue.map((r) => {
                  const emp = r.employee as { _id?: string; fullName?: string } | null;
                  const started = [r.goals, r.performance, r.strengths, r.improvements, r.feedback, r.nextObjectives, r.managerComments]
                    .some((v) => typeof v === "string" && v.trim().length > 0);
                  const overdue = new Date(r.dueDate).getTime() < Date.now();
                  return (
                    <li key={String(r._id)}>
                      <Link href={`/employees/${emp?._id}?tab=reviews`} className="flex items-center gap-3 rounded-md p-1.5 hover:bg-muted/40">
                        <UserAvatar name={emp?.fullName ?? "Review"} className="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{emp?.fullName ?? "Employee"}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.type}-day · {formatDate(r.dueDate)}</p>
                        </div>
                        <Badge variant={overdue ? "destructive" : started ? "brand" : "warning"}>
                          {overdue ? "Overdue" : started ? "Draft" : "Due"}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" /> Upcoming joiners</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming joiners.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((e) => (
                  <li key={String(e._id)}>
                    <Link href={`/employees/${e._id}`} className="flex items-center gap-3 rounded-md p-1.5 hover:bg-muted/40">
                      <UserAvatar name={e.fullName} className="h-8 w-8" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{(e.role as { title?: string })?.title ?? "—"}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(e.joiningDate)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
