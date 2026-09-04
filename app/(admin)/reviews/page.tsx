import Link from "next/link";
import { CalendarCheck, AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Review } from "@/models";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

interface Row {
  _id: string; employeeId: string; employeeName: string; type: string; dueDate: string;
  status: string; reviewerName: string;
}

export default async function ReviewsPage() {
  await requireCapability("reviews");
  await dbConnect();

  const reviews = await Review.find()
    .populate<{ employee: { _id: string; fullName: string } }>("employee", "fullName")
    .sort({ dueDate: 1 })
    .lean();

  const rows: Row[] = reviews.map((r) => ({
    _id: String(r._id),
    employeeId: String((r.employee as { _id?: string })?._id ?? ""),
    employeeName: (r.employee as { fullName?: string })?.fullName ?? "—",
    type: r.type,
    dueDate: (r.dueDate as Date).toISOString(),
    status: r.status,
    reviewerName: r.reviewerName ?? "",
  }));

  const now = Date.now();
  const overdue = rows.filter((r) => r.status === "pending" && new Date(r.dueDate).getTime() < now);
  const upcoming = rows.filter((r) => r.status === "pending" && new Date(r.dueDate).getTime() >= now);
  const completed = rows.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="30 / 60 / 90-day reviews across all employees." />

      {rows.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No reviews scheduled" description="Reviews are created automatically when you add an employee." />
      ) : (
        <div className="space-y-6">
          <Section title="Overdue" icon={AlertTriangle} accent="destructive" rows={overdue} emptyText="Nothing overdue — great." />
          <Section title="Upcoming" icon={CalendarClock} accent="warning" rows={upcoming} emptyText="No upcoming reviews." />
          <Section title="Completed" icon={CheckCircle2} accent="success" rows={completed} emptyText="No completed reviews yet." />
        </div>
      )}
    </div>
  );
}

function Section({
  title, icon: Icon, accent, rows, emptyText,
}: {
  title: string;
  icon: typeof AlertTriangle;
  accent: "destructive" | "warning" | "success";
  rows: Row[];
  emptyText: string;
}) {
  const accentClass = { destructive: "text-destructive", warning: "text-warning-foreground", success: "text-success" }[accent];
  return (
    <div className="space-y-2">
      <h2 className={`flex items-center gap-2 text-sm font-semibold ${accentClass}`}>
        <Icon className="h-4 w-4" /> {title} <span className="text-muted-foreground">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <Card><CardContent className="divide-y p-0">
          {rows.map((r) => (
            <div key={r._id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={r.employeeName} className="h-8 w-8" />
                <div>
                  <p className="text-sm font-medium">{r.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.type}-day review · due {formatDate(r.dueDate)}{r.reviewerName && ` · by ${r.reviewerName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "completed" ? "success" : accent === "destructive" ? "destructive" : "warning"}>
                  {r.status === "completed" ? "Completed" : accent === "destructive" ? "Overdue" : "Pending"}
                </Badge>
                <Button asChild variant="outline" size="sm"><Link href={`/employees/${r.employeeId}`}>Open</Link></Button>
              </div>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
