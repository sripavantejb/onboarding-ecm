"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend, CartesianGrid,
} from "recharts";
import { Users, CheckCircle2, Clock, GraduationCap, CalendarClock, TimerReset } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export interface AnalyticsData {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  avgCompletionDays: number;
  docCompletionRate: number;
  assessmentPassRate: number;
  overdueReviews: number;
  upcomingJoiners: number;
  statusDistribution: { name: string; key: string; value: number }[];
  departmentStats: { department: string; total: number; completed: number; completionRate: number; avgProgress: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "oklch(0.7 0.02 285)",
  in_progress: "oklch(0.51 0.2 275)",
  action_required: "oklch(0.577 0.245 27.3)",
  awaiting_review: "oklch(0.75 0.15 75)",
  completed: "oklch(0.62 0.14 155)",
};

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
  const hasData = data.total > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Onboarding performance across Editco." />

      {!hasData ? (
        <EmptyState icon={Users} title="No data yet" description="Analytics will populate once you create employees and onboarding activity begins." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total onboarding" value={data.total} icon={Users} />
            <StatCard label="Completed" value={`${completionRate}%`} icon={CheckCircle2} accent="success" hint={`${data.completed} employees`} />
            <StatCard label="Avg. completion" value={`${data.avgCompletionDays}d`} icon={TimerReset} hint="Created → completed" />
            <StatCard label="Doc approval" value={`${data.docCompletionRate}%`} icon={CheckCircle2} accent="brand" />
            <StatCard label="Assessment pass" value={`${data.assessmentPassRate}%`} icon={GraduationCap} accent="brand" />
            <StatCard label="Overdue reviews" value={data.overdueReviews} icon={CalendarClock} accent={data.overdueReviews > 0 ? "destructive" : "default"} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Status distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.statusDistribution.filter((d) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {data.statusDistribution.filter((d) => d.value > 0).map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Completion by department</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.departmentStats} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }} formatter={(value) => `${value}%`} />
                    <Bar dataKey="completionRate" fill="oklch(0.51 0.2 275)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Department breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.departmentStats.map((d) => (
                  <div key={d.department} className="flex items-center gap-4">
                    <p className="w-48 shrink-0 truncate text-sm font-medium">{d.department}</p>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${d.avgProgress}%` }} />
                    </div>
                    <p className="w-28 shrink-0 text-right text-xs text-muted-foreground">{d.completed}/{d.total} · {d.avgProgress}% avg</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
