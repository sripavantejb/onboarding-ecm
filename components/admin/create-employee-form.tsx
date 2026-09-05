"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, UserPlus, Loader2, CheckCircle2, Sparkles, FileText, ShieldCheck,
  GraduationCap, ClipboardCheck, CalendarCheck, BookOpen, ExternalLink, Send, Circle, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPLOYMENT_TYPES, WORK_MODES, ROLE_LABELS } from "@/types";
import { createEmployeeAndGenerate, getOnboardingPreview } from "@/actions/employees";
import { sendInvitation } from "@/actions/tokens";
import type { OnboardingPreview } from "@/lib/onboarding";

export interface DeptWithRoles {
  _id: string;
  name: string;
  roles: { _id: string; title: string }[];
}
export interface ManagerOption {
  _id: string;
  name: string;
  role: keyof typeof ROLE_LABELS;
}

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  department: z.string().min(1, "Select a department"),
  role: z.string().min(1, "Select a role"),
  reportingManager: z.string().optional(),
  joiningDate: z.string().min(1, "Select a joining date"),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  workMode: z.enum(WORK_MODES),
});
type FormValues = z.infer<typeof schema>;

interface SuccessData {
  employeeId: string;
  instanceId: string;
  url: string;
  name: string;
  department: string;
  role: string;
  email: string;
  password: string;
}

export function CreateEmployeeForm({
  departments, managers,
}: {
  departments: DeptWithRoles[];
  managers: ManagerOption[];
}) {
  const router = useRouter();
  const [preview, setPreview] = React.useState<OnboardingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<SuccessData | null>(null);

  const {
    register, handleSubmit, watch, setValue, formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "", email: "", phone: "", department: "", role: "",
      reportingManager: "", joiningDate: "", employmentType: "Full-time", workMode: "On-site",
    },
  });

  const departmentId = watch("department");
  const roleId = watch("role");
  const selectedDept = departments.find((d) => d._id === departmentId);

  // Load preview when department + role are both chosen.
  React.useEffect(() => {
    let active = true;
    if (departmentId && roleId) {
      setPreviewLoading(true);
      getOnboardingPreview(departmentId, roleId)
        .then((p) => { if (active) setPreview(p); })
        .finally(() => { if (active) setPreviewLoading(false); });
    } else {
      setPreview(null);
    }
    return () => { active = false; };
  }, [departmentId, roleId]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const res = await createEmployeeAndGenerate(values);
    setSubmitting(false);
    if (res.ok && res.data) {
      toast.success(res.message);
      setSuccess(res.data);
    } else if (!res.ok) {
      toast.error(res.error);
    }
  }

  if (success) return <SuccessScreen data={success} onViewEmployee={() => router.push(`/employees/${success.employeeId}`)} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create employee"
        description="Enter the essentials — onboarding is generated automatically from the department and role."
        actions={<Button asChild variant="ghost"><Link href="/employees"><ArrowLeft /> Back</Link></Button>}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle className="text-sm">Personal</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
                <Input {...register("fullName")} placeholder="e.g. Gayathri" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} placeholder="name@editcomedia.com" />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="Optional" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Employment</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Department" error={errors.department?.message}>
                <Select value={departmentId} onValueChange={(v) => { setValue("department", v, { shouldValidate: true }); setValue("role", ""); }}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Role" error={errors.role?.message}>
                <Select value={roleId} onValueChange={(v) => setValue("role", v, { shouldValidate: true })} disabled={!selectedDept}>
                  <SelectTrigger><SelectValue placeholder={selectedDept ? "Select role" : "Pick a department first"} /></SelectTrigger>
                  <SelectContent>
                    {selectedDept?.roles.map((r) => <SelectItem key={r._id} value={r._id}>{r.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Reporting manager">
                <Select value={watch("reportingManager")} onValueChange={(v) => setValue("reportingManager", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((m) => <SelectItem key={m._id} value={m._id}>{m.name} · {ROLE_LABELS[m.role]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Joining date" error={errors.joiningDate?.message}>
                <Input type="date" {...register("joiningDate")} />
              </Field>
              <Field label="Employment type">
                <Select value={watch("employmentType")} onValueChange={(v) => setValue("employmentType", v as FormValues["employmentType"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Work mode">
                <Select value={watch("workMode")} onValueChange={(v) => setValue("workMode", v as FormValues["workMode"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WORK_MODES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button asChild variant="outline"><Link href="/employees">Cancel</Link></Button>
            <Button type="submit" variant="brand" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {submitting ? "Generating…" : "Create Employee & Generate Onboarding"}
            </Button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PreviewPanel preview={preview} loading={previewLoading} hasSelection={!!departmentId && !!roleId} />
        </div>
      </form>
    </div>
  );
}

function Field({
  label, error, children, className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const KIND_ICON: Record<string, React.ElementType> = {
  content: BookOpen, document: FileText, policy: ShieldCheck, training: GraduationCap, assessment: ClipboardCheck,
};

function PreviewPanel({
  preview, loading, hasSelection,
}: {
  preview: OnboardingPreview | null;
  loading: boolean;
  hasSelection: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-brand" /> Onboarding preview
        </CardTitle>
        <p className="text-xs text-muted-foreground">Generated automatically from the selected department &amp; role.</p>
      </CardHeader>
      <CardContent>
        {!hasSelection ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Circle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Select a department and role to preview the onboarding.</p>
          </div>
        ) : loading || !preview ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Core" value={preview.counts.core} />
              <Stat label="Role" value={preview.counts.role} />
              <Stat label="Documents" value={preview.counts.documents} />
              <Stat label="Policies" value={preview.counts.policies} />
              <Stat label="Training" value={preview.counts.training} />
              <Stat label="Assessment" value={preview.counts.assessments} />
            </div>
            {!preview.hasRoleTemplate && (
              <p className="rounded-md bg-warning/15 px-3 py-2 text-xs text-warning-foreground">
                No role-specific track found — this role receives the core onboarding only.
              </p>
            )}
            <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><CalendarCheck className="h-4 w-4" /> Reviews</span>
              <span className="font-medium">{preview.reviews.join(" / ")} day</span>
            </div>

            <div className="max-h-[42vh] space-y-4 overflow-y-auto scrollbar-thin pr-1">
              {preview.sections.map((s) => (
                <div key={s.section}>
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <ul className="space-y-1">
                    {s.items.map((it, i) => {
                      const Icon = KIND_ICON[it.kind] ?? BookOpen;
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
                          <span className="truncate">{it.title}</span>
                          {!it.required && <Badge variant="muted" className="ml-auto text-[10px]">optional</Badge>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background px-2 py-2.5">
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SuccessScreen({ data, onViewEmployee }: { data: SuccessData; onViewEmployee: () => void }) {
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  // Sending the invite rotates the link + resets the password, so track the
  // fresh link and stop showing the now-stale credentials once emailed.
  const [emailedUrl, setEmailedUrl] = React.useState<string | null>(null);
  const displayUrl = emailedUrl ?? data.url;

  async function invite() {
    setSending(true);
    const res = await sendInvitation(data.instanceId);
    setSending(false);
    if (res.ok) { if (res.data) setEmailedUrl(res.data.url); toast.success(res.message); setSent(true); }
    else toast.error(res.error);
  }

  return (
    <div className="mx-auto max-w-xl py-8">
      <Card>
        <CardContent className="space-y-6 pt-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/12">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Employee created</h2>
            <p className="text-lg font-medium">{data.name}</p>
            <p className="text-sm text-muted-foreground">{data.department} · {data.role}</p>
          </div>

          <div className="flex items-center justify-center gap-6 rounded-lg border bg-muted/20 py-3">
            <div><p className="text-xl font-semibold">0%</p><p className="text-xs text-muted-foreground">Progress</p></div>
            <div className="h-8 w-px bg-border" />
            <div><Badge variant="muted" className="text-sm">Not Started</Badge></div>
          </div>

          <div className="space-y-2 text-left">
            <Label className="text-xs text-muted-foreground">Secure onboarding link</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={displayUrl} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
              <CopyButton value={displayUrl} iconOnly />
            </div>
            <p className="text-xs text-muted-foreground">This link is unique, expires in 14 days, and can be revoked anytime.</p>
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-left">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand" />
              <Label className="text-xs font-medium">Portal login credentials</Label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Email</Label>
                <div className="flex items-center gap-1.5">
                  <Input readOnly value={data.email} className="h-8 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <CopyButton value={data.email} iconOnly />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Password</Label>
                <div className="flex items-center gap-1.5">
                  <Input readOnly value={data.password} className="h-8 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <CopyButton value={data.password} iconOnly />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {sent
                ? `A fresh link and a new password were emailed to ${data.email}. The credentials above are no longer valid.`
                : `Share these securely with ${data.name.split(" ")[0]}, or click Send Invitation to email them a fresh link and password automatically.`}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <CopyButton value={displayUrl} label="Copy Onboarding Link" className="flex-1" variant="outline" />
            <Button variant="outline" className="flex-1" onClick={invite} disabled={sending || sent}>
              <Send /> {sent ? "Invitation sent" : sending ? "Sending…" : "Send Invitation"}
            </Button>
            <Button asChild variant="brand" className="flex-1">
              <a href={displayUrl} target="_blank" rel="noreferrer"><ExternalLink /> Open Portal</a>
            </Button>
          </div>
          <button onClick={onViewEmployee} className="text-sm text-brand hover:underline">
            View employee record →
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
