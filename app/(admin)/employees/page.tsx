import Link from "next/link";
import { Plus, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { Employee, Department } from "@/models";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { OnboardingStatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { EmployeesToolbar } from "@/components/admin/employees-toolbar";
import { formatDate, timeAgo, plain } from "@/lib/utils";
import type { OnboardingStatus } from "@/types";

export const metadata = { title: "Employees" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCapability("employees");
  await dbConnect();
  const sp = await searchParams;
  const q = (sp.q as string) ?? "";
  const departmentFilter = (sp.department as string) ?? "all";
  const statusFilter = (sp.status as string) ?? "all";
  const sort = (sp.sort as string) ?? "recent";
  const page = Math.max(1, parseInt((sp.page as string) ?? "1", 10) || 1);

  const query: Record<string, unknown> = { status: "active" };
  if (departmentFilter !== "all") query.department = departmentFilter;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ fullName: rx }, { email: rx }, { employeeCode: rx }];
  }

  const [employees, departments] = await Promise.all([
    Employee.find(query)
      .populate<{ department: { name: string } }>("department", "name")
      .populate<{ role: { title: string } }>("role", "title")
      .populate<{ instance: { status: OnboardingStatus; progress: number; updatedAt: Date } }>(
        "instance",
        "status progress updatedAt",
      )
      .lean(),
    Department.find({ status: "active" }).select("name").sort({ name: 1 }).lean(),
  ]);

  type Row = {
    _id: string;
    name: string;
    email: string;
    code: string;
    department: string;
    role: string;
    joiningDate: string;
    progress: number;
    status: OnboardingStatus;
    lastActivity: string;
    createdAt: string;
  };

  let rows: Row[] = employees.map((e) => ({
    _id: String(e._id),
    name: e.fullName,
    email: e.email,
    code: e.employeeCode,
    department: (e.department as { name?: string })?.name ?? "—",
    role: (e.role as { title?: string })?.title ?? "—",
    joiningDate: (e.joiningDate as Date).toISOString(),
    progress: (e.instance as { progress?: number })?.progress ?? 0,
    status: ((e.instance as { status?: OnboardingStatus })?.status ?? "not_started") as OnboardingStatus,
    lastActivity: ((e.instance as { updatedAt?: Date })?.updatedAt ?? (e.updatedAt as Date)).toString(),
    createdAt: (e.createdAt as Date).toISOString(),
  }));

  if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);

  rows.sort((a, b) => {
    switch (sort) {
      case "name": return a.name.localeCompare(b.name);
      case "joining": return +new Date(b.joiningDate) - +new Date(a.joiningDate);
      case "progress": return b.progress - a.progress;
      default: return +new Date(b.createdAt) - +new Date(a.createdAt);
    }
  });

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (departmentFilter !== "all") params.set("department", departmentFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (sort !== "recent") params.set("sort", sort);
    params.set("page", String(p));
    return `/employees?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Everyone being onboarded at Editco."
        actions={<Button asChild variant="brand"><Link href="/employees/new"><Plus /> New employee</Link></Button>}
      />

      <EmployeesToolbar departments={plain(departments.map((d) => ({ _id: String(d._id), name: d.name })))} />

      {total === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={q || statusFilter !== "all" || departmentFilter !== "all" ? "Try adjusting your filters." : "Create your first employee to generate onboarding."}
          action={<Button asChild variant="brand"><Link href="/employees/new"><Plus /> New employee</Link></Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Joining</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r._id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/employees/${r._id}`} className="flex items-center gap-3">
                      <UserAvatar name={r.name} className="h-9 w-9" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.code} · {r.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{r.department}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{r.role}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{formatDate(r.joiningDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.progress} className="w-20" />
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">{r.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><OnboardingStatusBadge status={r.status} /></TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{timeAgo(r.lastActivity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button asChild variant="outline" size="icon-sm" disabled={current <= 1}>
                <Link href={pageHref(current - 1)} aria-disabled={current <= 1}><ChevronLeft className="h-4 w-4" /></Link>
              </Button>
              <span className="px-2 text-xs text-muted-foreground">Page {current} / {pageCount}</span>
              <Button asChild variant="outline" size="icon-sm" disabled={current >= pageCount}>
                <Link href={pageHref(current + 1)} aria-disabled={current >= pageCount}><ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
