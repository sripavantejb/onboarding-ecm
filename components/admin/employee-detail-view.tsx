"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Building2, BriefcaseBusiness, UserCog, CalendarDays, Link2,
  RefreshCw, Ban, Clock, Send, CheckCircle2, XCircle, CircleDot, Circle, AlertCircle,
  FileText, Download, MessageSquarePlus, Eye, ShieldCheck, GraduationCap, ClipboardCheck, BookOpen,
  KeyRound, Pencil, UserX, UserCheck, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { CopyButton } from "@/components/copy-button";
import { OnboardingStatusBadge, StepStatusBadge, DocStatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDate, formatDateTime, timeAgo, cn } from "@/lib/utils";
import { ROLE_LABELS, SECTION_LABELS, type StepSection, type StepStatus, type OnboardingStatus, type DocStatus, type UserRole } from "@/types";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { regenerateToken, revokeToken, setTokenExpiry, sendInvitation } from "@/actions/tokens";
import { approveDocument, rejectDocument } from "@/actions/documents-admin";
import { assignPolicyToEmployee } from "@/actions/policies";
import { updateEmployee, endTenure, reactivateEmployee } from "@/actions/employees";
import { saveReview } from "@/actions/reviews";
import { addNote } from "@/actions/notes";
import { issueOfferLetter, revokeOfferLetter, uploadOfferLetter } from "@/actions/offer";
import { setEmployeePortalPassword } from "@/actions/employee-access";

export interface ManagerOption {
  _id: string;
  name: string;
  role: UserRole;
}

export interface EmployeeDetail {
  employee: {
    _id: string; fullName: string; email: string; phone: string; employeeCode: string;
    department: string; role: string;
    reportingManager: string;
    reportingManagerName: string; joiningDate: string;
    employmentType: string; workMode: string; profile: Record<string, unknown>;
    passwordSetAt: string | null;
    employmentStatus: "active" | "archived" | "past";
    tenureEndedAt: string | null;
    tenureEndReason: string;
  };
  instance: {
    _id: string; status: OnboardingStatus; progress: number;
    startedAt: string | null; firstOpenedAt: string | null; invitationSentAt: string | null;
    completedAt: string | null; createdAt: string; finalChecklist: { label: string; checked: boolean }[];
  } | null;
  link: {
    status: "active" | "expired" | "revoked" | "none";
    expiresAt: string | null; firstOpenedAt: string | null; lastAccessedAt: string | null; openCount: number;
  };
  steps: { _id: string; section: string; kind: string; title: string; required: boolean; status: StepStatus; version: string }[];
  submissions: {
    _id: string; stepId: string; documentName: string; fileId: string; fileName: string;
    mimeType: string; size: number; status: DocStatus; rejectionReason: string; reviewedByName: string; uploadedAt: string;
  }[];
  attempts: { _id: string; stepId: string; attemptNumber: number; score: number; passed: boolean; submittedAt: string }[];
  reviews: {
    _id: string; type: string; dueDate: string; status: string; goals: string; performance: string;
    strengths: string; improvements: string; feedback: string; nextObjectives: string; managerComments: string;
    reviewerName: string; completedAt: string | null;
  }[];
  activity: { _id: string; actorName: string; actorType: string; action: string; message: string; createdAt: string }[];
  offer: {
    status: "issued" | "accepted" | "revoked";
    ctcAnnual: number; currency: string; location: string; offerDate: string;
    responseByDate: string | null; issuedByName: string; acceptedAt: string | null;
    fileId: string; fileName: string; source: "generated" | "uploaded"; terms: string[];
  } | null;
  policies: { _id: string; title: string; category: string }[];
}

const SECTION_SEQUENCE: StepSection[] = ["CORE", "ROLE", "DOCUMENTS", "POLICIES", "TRAINING", "ASSESSMENT", "FINAL"];

const DETAIL_TABS = ["overview", "onboarding", "offer", "documents", "reviews", "activity", "notes"] as const;

export function EmployeeDetailView({
  detail,
  managers = [],
  initialTab = "onboarding",
}: {
  detail: EmployeeDetail;
  managers?: ManagerOption[];
  initialTab?: string;
}) {
  const { employee, instance, link } = detail;

  const isPast = employee.employmentStatus === "past";

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/employees"><ArrowLeft /> Employees</Link></Button>

      {isPast && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
          <UserX className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Former employee — tenure ended{employee.tenureEndedAt ? ` on ${formatDate(employee.tenureEndedAt)}` : ""}.</p>
            <p className="text-xs opacity-90">
              Portal access is revoked and no further onboarding updates are emailed to them.
              {employee.tenureEndReason ? ` Reason: ${employee.tenureEndReason}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <UserAvatar name={employee.fullName} className="h-14 w-14 text-base" />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">{employee.fullName}</h1>
                  {instance && <OnboardingStatusBadge status={instance.status} />}
                  <EditEmployeeButton
                    employeeId={employee._id}
                    fullName={employee.fullName}
                    email={employee.email}
                    reportingManager={employee.reportingManager}
                    reportingManagerName={employee.reportingManagerName}
                    managers={managers}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" /> {employee.role}</span>
                  <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {employee.department}</span>
                  <span className="flex items-center gap-1.5"><UserCog className="h-3.5 w-3.5" /> {employee.reportingManagerName || "No manager"}</span>
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Joins {formatDate(employee.joiningDate)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{employee.employeeCode}</p>
              </div>
            </div>
            {instance && (
              <div className="w-full sm:w-52">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold tabular-nums">{instance.progress}%</span>
                </div>
                <Progress value={instance.progress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {instance ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <Tabs defaultValue={DETAIL_TABS.includes(initialTab as (typeof DETAIL_TABS)[number]) ? initialTab : "onboarding"}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                <TabsTrigger value="offer">Offer</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview"><OverviewTab detail={detail} /></TabsContent>
              <TabsContent value="onboarding"><OnboardingTab detail={detail} /></TabsContent>
              <TabsContent value="offer"><OfferTab detail={detail} /></TabsContent>
              <TabsContent value="documents"><DocumentsTab detail={detail} /></TabsContent>
              <TabsContent value="reviews"><ReviewsTab detail={detail} /></TabsContent>
              <TabsContent value="activity"><ActivityTab detail={detail} /></TabsContent>
              <TabsContent value="notes"><NotesTab detail={detail} /></TabsContent>
            </Tabs>
          </div>

          <div className="space-y-5">
            <LinkManager instanceId={instance._id} link={link} invitationSentAt={instance.invitationSentAt} />
            <PortalAccessCard employeeId={employee._id} email={employee.email} passwordSetAt={employee.passwordSetAt} />
            <AssignPolicyCard employeeId={employee._id} policies={detail.policies} />
            <PreboardingCard detail={detail} />
            <EmploymentCard employee={employee} />
          </div>
        </div>
      ) : (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No onboarding instance found for this employee.</CardContent></Card>
      )}
    </div>
  );
}

/* ------------------------------ Edit details ----------------------------- */

function EditEmployeeButton({
  employeeId, fullName, email, reportingManager, reportingManagerName, managers,
}: {
  employeeId: string;
  fullName: string;
  email: string;
  reportingManager: string;
  reportingManagerName: string;
  managers: ManagerOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(fullName);
  const [mail, setMail] = React.useState(email);
  const [managerId, setManagerId] = React.useState(reportingManager);
  const [managerName, setManagerName] = React.useState(reportingManagerName);
  const [pending, start] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setName(fullName);
      setMail(email);
      setManagerId(reportingManager);
      setManagerName(reportingManagerName);
    }
  }, [open, fullName, email, reportingManager, reportingManagerName]);

  function save() {
    start(async () => {
      const res = await updateEmployee(employeeId, {
        fullName: name,
        email: mail,
        reportingManager: managerId,
        reportingManagerName: managerName,
      });
      if (res.ok) { toast.success(res.message); setOpen(false); router.refresh(); }
      else toast.error(res.error);
    });
  }

  return (
    <>
      <Button
        variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
        onClick={() => setOpen(true)} aria-label="Edit employee"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
            <DialogDescription>Update name, login email, and reporting manager.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full name</Label>
              <Input
                id="edit-name" value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); }} autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Login email</Label>
              <Input
                id="edit-email" type="email" value={mail} onChange={(e) => setMail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              />
              <p className="text-[11px] text-muted-foreground">Used to sign in to the portal and to receive onboarding emails.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Reporting manager</Label>
              <Select
                value={managerId || "custom"}
                onValueChange={(v) => {
                  if (v === "custom") {
                    setManagerId("");
                    return;
                  }
                  const mgr = managers.find((m) => m._id === v);
                  setManagerId(v);
                  if (mgr) setManagerName(mgr.name);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pick a teammate or type a name" /></SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name} · {ROLE_LABELS[m.role]}</SelectItem>
                  ))}
                  <SelectItem value="custom">Someone else (type name)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Reporting manager full name"
                onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button
                variant="brand"
                onClick={save}
                disabled={pending || name.trim().length < 2 || !mail.trim() || managerName.trim().length < 2}
              >
                {pending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* --------------------------------- Link ---------------------------------- */

function LinkManager({
  instanceId, link, invitationSentAt,
}: {
  instanceId: string;
  link: EmployeeDetail["link"];
  invitationSentAt: string | null;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [freshUrl, setFreshUrl] = React.useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
  const [expiryOpen, setExpiryOpen] = React.useState(false);
  const [days, setDays] = React.useState("14");

  const statusMap = {
    active: { label: "Active", variant: "success" as const },
    expired: { label: "Expired", variant: "warning" as const },
    revoked: { label: "Revoked", variant: "destructive" as const },
    none: { label: "No link", variant: "muted" as const },
  };
  const s = statusMap[link.status];

  function regen() {
    start(async () => {
      const res = await regenerateToken(instanceId);
      if (res.ok && res.data) { setFreshUrl(res.data.url); toast.success(res.message); router.refresh(); }
      else if (!res.ok) toast.error(res.error);
    });
  }
  function revoke() {
    start(async () => {
      const res = await revokeToken(instanceId);
      if (res.ok) { toast.success(res.message); setFreshUrl(null); router.refresh(); } else toast.error(res.error);
      setConfirmRevoke(false);
    });
  }
  function invite() {
    start(async () => {
      const res = await sendInvitation(instanceId);
      if (res.ok) { if (res.data) setFreshUrl(res.data.url); toast.success(res.message); router.refresh(); }
      else toast.error(res.error);
    });
  }
  function saveExpiry() {
    start(async () => {
      const res = await setTokenExpiry(instanceId, { days: parseInt(days, 10) });
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
      setExpiryOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2"><Link2 className="h-4 w-4" /> Onboarding link</span>
          <Badge variant={s.variant}>{s.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {freshUrl && (
          <div className="space-y-1.5 rounded-md border border-brand/30 bg-brand/[0.04] p-2.5">
            <p className="text-xs font-medium text-brand">New secure link (copy it now)</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={freshUrl} className="h-8 font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} />
              <CopyButton value={freshUrl} iconOnly />
            </div>
          </div>
        )}

        <dl className="space-y-1.5 text-xs">
          <Row label="Expires" value={link.expiresAt ? formatDateTime(link.expiresAt) : "—"} />
          <Row label="First opened" value={link.firstOpenedAt ? formatDateTime(link.firstOpenedAt) : "Not yet"} />
          <Row label="Last accessed" value={link.lastAccessedAt ? timeAgo(link.lastAccessedAt) : "Never"} />
          <Row label="Invitation" value={invitationSentAt ? `Sent ${timeAgo(invitationSentAt)}` : "Not sent"} />
        </dl>

        {!freshUrl && (
          <p className="rounded-md bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground">
            For security, existing links can&apos;t be shown again. Regenerate to get a fresh copyable link.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={regen} disabled={pending}><RefreshCw className="h-3.5 w-3.5" /> {link.status === "none" ? "Generate" : "Regenerate"}</Button>
          <Button variant="outline" size="sm" onClick={invite} disabled={pending || link.status !== "active"}><Send className="h-3.5 w-3.5" /> Send invite</Button>
          <Button variant="outline" size="sm" onClick={() => setExpiryOpen(true)} disabled={pending || link.status !== "active"}><Clock className="h-3.5 w-3.5" /> Set expiry</Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmRevoke(true)} disabled={pending || link.status !== "active"} className="text-destructive hover:text-destructive"><Ban className="h-3.5 w-3.5" /> Revoke</Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmRevoke} onOpenChange={setConfirmRevoke}
        title="Revoke this onboarding link?"
        description="The employee will immediately lose access to their portal. You can regenerate a new link later."
        confirmLabel="Revoke link" destructive loading={pending} onConfirm={revoke}
      />

      <Dialog open={expiryOpen} onOpenChange={setExpiryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set link expiry</DialogTitle><DialogDescription>Number of days from now.</DialogDescription></DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="expiry-days">Days</Label>
            <Input id="expiry-days" type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpiryOpen(false)} disabled={pending}>Cancel</Button>
            <Button variant="brand" onClick={saveExpiry} disabled={pending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

/* ----------------------------- Portal access ----------------------------- */

function PortalAccessCard({
  employeeId, email, passwordSetAt,
}: {
  employeeId: string;
  email: string;
  passwordSetAt: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [custom, setCustom] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  function submit() {
    start(async () => {
      const res = await setEmployeePortalPassword(employeeId, custom ? { password: custom } : {});
      if (res.ok && res.data) { setResult(res.data.password); toast.success(res.message); }
      else if (!res.ok) toast.error(res.error);
    });
  }
  function close() { setOpen(false); setCustom(""); setResult(null); }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><KeyRound className="h-4 w-4" /> Portal access</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">The employee signs in with their email and this password to protect their documents.</p>
        <dl className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="flex items-center gap-1"><span className="font-medium">{email}</span><CopyButton value={email} iconOnly /></dd>
          </div>
          <Row label="Password" value={passwordSetAt ? `Set ${formatDate(passwordSetAt)}` : "Not set"} />
        </dl>
        <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
          <KeyRound className="h-3.5 w-3.5" /> {passwordSetAt ? "Reset password" : "Set password"}
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{passwordSetAt ? "Reset" : "Set"} portal password</DialogTitle>
            <DialogDescription>Leave blank to generate a strong password automatically.</DialogDescription>
          </DialogHeader>
          {result ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">New password (shown once)</Label>
                <div className="flex items-center gap-1.5">
                  <Input readOnly value={result} className="font-mono text-sm" onFocus={(e) => e.currentTarget.select()} />
                  <CopyButton value={result} iconOnly />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This password was also emailed to the employee. It can&apos;t be shown here again.</p>
              <div className="flex justify-end"><Button variant="brand" onClick={close}>Done</Button></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="custom-pw">Custom password (optional)</Label>
                <Input id="custom-pw" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Auto-generate if blank" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={close} disabled={pending}>Cancel</Button>
                <Button variant="brand" onClick={submit} disabled={pending}>{pending ? "Setting…" : "Set password"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ----------------------------- Assign policy ----------------------------- */

function AssignPolicyCard({
  employeeId, policies,
}: {
  employeeId: string;
  policies: EmployeeDetail["policies"];
}) {
  const router = useRouter();
  const [policyId, setPolicyId] = React.useState("");
  const [pending, start] = React.useTransition();

  function assign() {
    if (!policyId) return;
    start(async () => {
      const res = await assignPolicyToEmployee(employeeId, policyId);
      if (res.ok) { toast.success(res.message); setPolicyId(""); router.refresh(); }
      else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" /> Assign a policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-xs text-muted-foreground">
          Add a published policy for this employee to review and sign. They&apos;ll be emailed automatically.
        </p>
        {policies.length === 0 ? (
          <p className="rounded-md bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground">
            No published policies yet. Publish one from the Policies page first.
          </p>
        ) : (
          <>
            <Select value={policyId} onValueChange={setPolicyId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select a policy…" /></SelectTrigger>
              <SelectContent>
                {policies.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="w-full" onClick={assign} disabled={pending || !policyId}>
              <Send className="h-3.5 w-3.5" /> {pending ? "Assigning…" : "Assign & notify"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Preboarding ------------------------------ */

function PreboardingCard({ detail }: { detail: EmployeeDetail }) {
  const { instance } = detail;
  if (!instance) return null;
  const items = [
    { label: "Employee created", at: instance.createdAt, done: true },
    { label: "Invitation sent", at: instance.invitationSentAt, done: !!instance.invitationSentAt },
    { label: "Portal opened", at: instance.firstOpenedAt, done: !!instance.firstOpenedAt },
    { label: "Onboarding completed", at: instance.completedAt, done: !!instance.completedAt },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Timeline</CardTitle></CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5">
              {it.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />}
              <div>
                <p className={cn("text-sm", it.done ? "font-medium" : "text-muted-foreground")}>{it.label}</p>
                {it.at && <p className="text-xs text-muted-foreground">{formatDateTime(it.at)}</p>}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Employment ------------------------------- */

function EmploymentCard({ employee }: { employee: EmployeeDetail["employee"] }) {
  const router = useRouter();
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, start] = React.useTransition();
  const isPast = employee.employmentStatus === "past";

  function end() {
    start(async () => {
      const res = await endTenure(employee._id, { reason });
      if (res.ok) { toast.success(res.message); setConfirmEnd(false); setReason(""); router.refresh(); }
      else toast.error(res.error);
    });
  }
  function reactivate() {
    start(async () => {
      const res = await reactivateEmployee(employee._id);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {isPast ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />} Employment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="space-y-1.5 text-xs">
          <Row label="Status" value={isPast ? "Former employee" : "Active"} />
          {isPast && <Row label="Tenure ended" value={employee.tenureEndedAt ? formatDate(employee.tenureEndedAt) : "—"} />}
        </dl>
        {isPast ? (
          <>
            <p className="text-xs text-muted-foreground">
              This employee is in the past-employees list. They receive no onboarding update emails and can&apos;t access the portal.
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={reactivate} disabled={pending}>
              <RotateCcw className="h-3.5 w-3.5" /> {pending ? "Reactivating…" : "Reactivate employee"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Ending the tenure revokes portal access, stops all onboarding update emails, and moves this record to past employees.
            </p>
            <Button
              variant="outline" size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setConfirmEnd(true)} disabled={pending}
            >
              <UserX className="h-3.5 w-3.5" /> End tenure
            </Button>
          </>
        )}
      </CardContent>

      <Dialog open={confirmEnd} onOpenChange={(v) => (v ? setConfirmEnd(true) : setConfirmEnd(false))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>End {employee.fullName}&apos;s tenure?</DialogTitle>
            <DialogDescription>
              They&apos;ll be moved to past employees. Portal access is revoked and no further update emails are sent. You can reactivate them later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="tenure-reason">Reason (optional)</Label>
            <Textarea
              id="tenure-reason" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Contract ended, resigned, offboarded." className="min-h-20"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmEnd(false)} disabled={pending}>Cancel</Button>
            <Button variant="destructive" onClick={end} disabled={pending}>{pending ? "Ending…" : "End tenure"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ------------------------------- Overview -------------------------------- */

function OverviewTab({ detail }: { detail: EmployeeDetail }) {
  const { employee } = detail;
  const p = employee.profile as {
    personal?: Record<string, string>; emergencyContact?: Record<string, string>; bank?: Record<string, string>;
    submittedAt?: string; draftSavedAt?: string;
  };
  const hasProfile = [p?.personal, p?.emergencyContact, p?.bank].some((block) =>
    Object.values(block ?? {}).some((v) => String(v ?? "").trim()),
  );
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">Contact & employment</CardTitle></CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Info icon={Mail} label="Email" value={employee.email} />
          <Info icon={Phone} label="Phone" value={employee.phone || "—"} />
          <Info icon={BriefcaseBusiness} label="Employment type" value={employee.employmentType} />
          <Info icon={Building2} label="Work mode" value={employee.workMode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Submitted information</CardTitle></CardHeader>
        <CardContent>
          {hasProfile ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {p?.submittedAt
                  ? `Submitted ${formatDate(p.submittedAt)}`
                  : "Saved as a draft — not submitted yet."}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <ProfileBlock title="Personal" data={p.personal} />
                <ProfileBlock title="Emergency contact" data={p.emergencyContact} />
                <ProfileBlock title="Bank details" data={p.bank} mask />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">The employee hasn&apos;t submitted their information form yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>
    </div>
  );
}

function ProfileBlock({ title, data, mask }: { title: string; data?: Record<string, string>; mask?: boolean }) {
  const entries = Object.entries(data ?? {}).filter(([, v]) => v);
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {entries.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
        <dl className="space-y-1">
          {entries.map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}: </span>
              <span className="font-medium">{mask && /account|ifsc/i.test(k) ? maskValue(v) : v}</span>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
function maskValue(v: string) { return v.length <= 4 ? v : "•".repeat(Math.max(0, v.length - 4)) + v.slice(-4); }

/* ------------------------------ Onboarding ------------------------------- */

const KIND_ICON: Record<string, React.ElementType> = {
  content: BookOpen, document: FileText, policy: ShieldCheck, training: GraduationCap, assessment: ClipboardCheck, info_form: UserCog, checklist: CheckCircle2,
};

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "completed" || status === "approved") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
  if (status === "submitted" || status === "under_review") return <Clock className="h-4 w-4 text-warning-foreground" />;
  if (status === "in_progress") return <CircleDot className="h-4 w-4 text-brand" />;
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

function OnboardingTab({ detail }: { detail: EmployeeDetail }) {
  const { steps } = detail;
  const grouped = SECTION_SEQUENCE.map((sec) => ({
    section: sec,
    items: steps.filter((s) => s.section === sec),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      {grouped.map((g) => (
        <Card key={g.section}>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{SECTION_LABELS[g.section]}</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {g.items.map((s) => {
              const Icon = KIND_ICON[s.kind] ?? BookOpen;
              return (
                <div key={s._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <StepIcon status={s.status} />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.title}</p>
                    {s.version && <p className="text-xs text-muted-foreground">v{s.version}</p>}
                  </div>
                  {!s.required && <Badge variant="muted" className="text-[10px]">optional</Badge>}
                  <StepStatusBadge status={s.status} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------- Documents ------------------------------- */

function DocumentsTab({ detail }: { detail: EmployeeDetail }) {
  const router = useRouter();
  const { steps, submissions } = detail;
  const [pending, start] = React.useTransition();
  const [rejecting, setRejecting] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");

  const docSteps = steps.filter((s) => s.kind === "document");
  const latestByStep = new Map<string, EmployeeDetail["submissions"][number]>();
  for (const s of submissions) if (!latestByStep.has(s.stepId)) latestByStep.set(s.stepId, s);

  function approve(id: string) {
    start(async () => {
      const res = await approveDocument(id);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  }
  function doReject() {
    if (!rejecting) return;
    start(async () => {
      const res = await rejectDocument(rejecting, { reason });
      if (res.ok) { toast.success(res.message); setRejecting(null); setReason(""); router.refresh(); } else toast.error(res.error);
    });
  }

  if (docSteps.length === 0)
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No documents assigned.</CardContent></Card>;

  return (
    <Card>
      <CardContent className="divide-y pt-0">
        {docSteps.map((step) => {
          const sub = latestByStep.get(step._id);
          return (
            <div key={step._id} className="flex flex-col gap-2 py-4 first:pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{step.title}{step.required && <span className="ml-1 text-destructive">*</span>}</p>
                  {sub ? (
                    <p className="text-xs text-muted-foreground">{sub.fileName} · {(sub.size / 1024).toFixed(0)} KB · {timeAgo(sub.uploadedAt)}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not uploaded yet</p>
                  )}
                  {sub?.status === "rejected" && sub.rejectionReason && (
                    <p className="mt-0.5 text-xs text-destructive">Rejected: {sub.rejectionReason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-7 sm:pl-0">
                {sub ? <DocStatusBadge status={sub.status} /> : <Badge variant="muted">Pending</Badge>}
                {sub && (
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/files/${sub.fileId}`} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /> View</a>
                  </Button>
                )}
                {sub && sub.status !== "approved" && (
                  <>
                    <Button variant="outline" size="sm" className="text-success" disabled={pending} onClick={() => approve(sub._id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" disabled={pending} onClick={() => { setRejecting(sub._id); setReason(""); }}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <Dialog open={!!rejecting} onOpenChange={(v) => !v && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject document</DialogTitle><DialogDescription>The employee will see this reason and can re-upload.</DialogDescription></DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Document is blurry — please re-scan." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} disabled={pending}>Cancel</Button>
            <Button variant="destructive" onClick={doReject} disabled={pending || reason.trim().length < 3}>Reject document</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* -------------------------------- Reviews -------------------------------- */

function ReviewsTab({ detail }: { detail: EmployeeDetail }) {
  return (
    <div className="space-y-4">
      {detail.reviews.length === 0 && <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No reviews scheduled.</CardContent></Card>}
      {detail.reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
    </div>
  );
}

function ReviewCard({ review }: { review: EmployeeDetail["reviews"][number] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [form, setForm] = React.useState(review);

  function save(complete: boolean) {
    start(async () => {
      const res = await saveReview(review._id, { ...form, complete });
      if (res.ok) { toast.success(res.message); setOpen(false); router.refresh(); } else toast.error(res.error);
    });
  }

  const fields: [keyof typeof form, string][] = [
    ["goals", "Goals"], ["performance", "Performance"], ["strengths", "Strengths"],
    ["improvements", "Areas for improvement"], ["feedback", "Feedback"],
    ["nextObjectives", "Next objectives"], ["managerComments", "Manager comments"],
  ];

  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-5">
        <div>
          <p className="font-medium">{review.type}-Day Review</p>
          <p className="text-xs text-muted-foreground">
            Due {formatDate(review.dueDate)}
            {review.completedAt && ` · Completed ${formatDate(review.completedAt)}${review.reviewerName ? ` by ${review.reviewerName}` : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={review.status === "completed" ? "success" : "warning"}>{review.status === "completed" ? "Completed" : "Pending"}</Badge>
          <Button variant="outline" size="sm" onClick={() => { setForm(review); setOpen(true); }}>{review.status === "completed" ? "View / edit" : "Complete"}</Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{review.type}-Day Review</DialogTitle><DialogDescription>Due {formatDate(review.dueDate)}</DialogDescription></DialogHeader>
          <div className="grid max-h-[60vh] gap-4 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <div key={key as string} className={cn("space-y-1.5", (key === "feedback" || key === "managerComments") && "sm:col-span-2")}>
                <Label>{label}</Label>
                <Textarea value={form[key] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="min-h-20" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => save(false)} disabled={pending}>Save draft</Button>
            <Button variant="brand" onClick={() => save(true)} disabled={pending}>Mark completed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ------------------------------- Activity -------------------------------- */

function ActivityTab({ detail }: { detail: EmployeeDetail }) {
  const items = detail.activity.filter((a) => a.action !== "note.added");
  return (
    <Card>
      <CardContent className="pt-5">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
          <ol className="space-y-4">
            {items.map((a) => (
              <li key={a._id} className="flex items-start gap-3">
                <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", a.actorType === "employee" ? "bg-brand" : a.actorType === "system" ? "bg-muted-foreground" : "bg-foreground")} />
                <div>
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{a.actorName} · {formatDateTime(a.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Offer --------------------------------- */

function fmtMoney(amount: number, currency: string) {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString("en-IN")}`; }
}

function OfferTab({ detail }: { detail: EmployeeDetail }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const offer = detail.offer;
  const [editing, setEditing] = React.useState(!offer);
  const [ctc, setCtc] = React.useState(offer ? String(offer.ctcAnnual) : "");
  const [currency, setCurrency] = React.useState(offer?.currency ?? "INR");
  const [location, setLocation] = React.useState(offer?.location ?? "");
  const [offerDate, setOfferDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [responseBy, setResponseBy] = React.useState("");
  const [terms, setTerms] = React.useState(
    offer?.terms?.join("\n") ??
      "This offer is subject to satisfactory verification of your documents.\nYou will serve a standard probation period as per company policy.\nYou agree to maintain confidentiality of all company information.",
  );

  function issue() {
    start(async () => {
      const res = await issueOfferLetter(detail.employee._id, {
        ctcAnnual: ctc,
        currency: currency || "INR",
        location,
        offerDate,
        responseByDate: responseBy || undefined,
        terms: terms.split("\n").map((t) => t.trim()).filter(Boolean),
      });
      if (res.ok) { toast.success(res.message); setEditing(false); router.refresh(); } else toast.error(res.error);
    });
  }
  function revoke() {
    start(async () => {
      const res = await revokeOfferLetter(detail.employee._id);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  }

  const fileRef = React.useRef<HTMLInputElement>(null);
  function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      const res = await uploadOfferLetter(detail.employee._id, fd);
      if (res.ok) { toast.success(res.message); setEditing(false); router.refresh(); } else toast.error(res.error);
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="space-y-4">
      {offer && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Offer letter</p>
                <p className="text-xs text-muted-foreground">
                  {offer.source === "uploaded" ? "Uploaded" : "Issued"} by {offer.issuedByName || "—"} · {formatDate(offer.offerDate)}
                </p>
              </div>
              <Badge variant={offer.status === "accepted" ? "success" : offer.status === "revoked" ? "destructive" : "brand"}>
                {offer.status === "accepted" ? `Accepted ${offer.acceptedAt ? formatDate(offer.acceptedAt) : ""}` : offer.status === "revoked" ? "Revoked" : "Issued"}
              </Badge>
            </div>
            {offer.source === "uploaded" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" /> Admin-uploaded PDF{offer.fileName ? ` · ${offer.fileName}` : ""}
              </p>
            ) : (
              <>
                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  <Info icon={FileText} label="Annual CTC" value={fmtMoney(offer.ctcAnnual, offer.currency)} />
                  <Info icon={Building2} label="Location" value={offer.location || "—"} />
                  {offer.responseByDate && <Info icon={CalendarDays} label="Respond by" value={formatDate(offer.responseByDate)} />}
                </div>
                {offer.terms.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {offer.terms.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><a href={`/api/files/${offer.fileId}`} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /> Download PDF</a></Button>
              <Button variant="outline" size="sm" onClick={() => setEditing((v) => !v)} disabled={pending}>{editing ? "Close" : "Re-issue"}</Button>
              {offer.status !== "revoked" && <Button variant="outline" size="sm" className="text-destructive" onClick={revoke} disabled={pending}>Revoke</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle className="text-sm">{offer ? "Re-issue offer letter" : "Issue offer letter"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Annual CTC</Label>
                <Input type="number" min={0} value={ctc} onChange={(e) => setCtc(e.target.value)} placeholder="e.g. 600000" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="INR" />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hyderabad / Remote" />
              </div>
              <div className="space-y-1.5">
                <Label>Offer date</Label>
                <Input type="date" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Respond by (optional)</Label>
                <Input type="date" value={responseBy} onChange={(e) => setResponseBy(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Terms (one per line)</Label>
              <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="min-h-28" />
            </div>
            <div className="flex justify-end gap-2">
              {offer && <Button variant="outline" onClick={() => setEditing(false)} disabled={pending}>Cancel</Button>}
              <Button variant="brand" onClick={issue} disabled={pending || !ctc}>
                {pending ? "Generating…" : offer ? "Re-generate & re-issue" : "Generate & issue offer letter"}
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or upload a signed PDF</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Upload offer letter (PDF)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                disabled={pending}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand/90 disabled:opacity-60"
              />
              <p className="text-[11px] text-muted-foreground">
                Uploading replaces any existing offer and makes the PDF available to the employee immediately. Max {10} MB.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!offer && !editing && (
        <div className="flex justify-center">
          <Button variant="brand" onClick={() => setEditing(true)}><FileText /> Issue offer letter</Button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Notes --------------------------------- */

function NotesTab({ detail }: { detail: EmployeeDetail }) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [pending, start] = React.useTransition();
  const notes = detail.activity.filter((a) => a.action === "note.added");

  function add() {
    if (!text.trim()) return;
    start(async () => {
      const res = await addNote({ employeeId: detail.employee._id, instanceId: detail.instance?._id, text });
      if (res.ok) { toast.success(res.message); setText(""); router.refresh(); } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 pt-5">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a private note about this employee…" />
          <div className="flex justify-end">
            <Button variant="brand" size="sm" onClick={add} disabled={pending || !text.trim()}><MessageSquarePlus className="h-4 w-4" /> Add note</Button>
          </div>
        </CardContent>
      </Card>
      {notes.map((n) => (
        <Card key={n._id}><CardContent className="pt-4">
          <p className="text-sm">{n.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">{n.actorName} · {formatDateTime(n.createdAt)}</p>
        </CardContent></Card>
      ))}
    </div>
  );
}
