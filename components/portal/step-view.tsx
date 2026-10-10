"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Loader2, Upload, FileText, AlertCircle, RotateCcw,
  ShieldCheck, GraduationCap, ClipboardCheck, BookOpen, UserCog, ExternalLink, PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichText } from "@/components/rich-text";
import { formatDate, cn } from "@/lib/utils";
import { SECTION_LABELS, type StepSection, type StepStatus, type DocStatus } from "@/types";
import {
  completeContentStep, acknowledgePolicy, completeTraining, submitAssessment,
  saveInfoDraft, submitInfoForm, completeOnboarding,
} from "@/actions/portal";

export interface StepViewData {
  token: string;
  stepId: string;
  kind: string;
  section: string;
  title: string;
  status: StepStatus;
  version: string;
  snapshot: Record<string, unknown>;
  employment: {
    fullName: string; email: string; phone: string; department: string; role: string;
    reportingManager: string; joiningDate: string; employmentType: string; workMode: string;
  };
  profile: Record<string, unknown>;
  submission: { status: DocStatus; rejectionReason: string; fileName: string } | null;
  attempts: { attemptNumber: number; score: number; passed: boolean }[];
  outstanding: string[];
  progress: number;
}

const KIND_ICON: Record<string, React.ElementType> = {
  content: BookOpen, document: FileText, policy: ShieldCheck, training: GraduationCap,
  assessment: ClipboardCheck, info_form: UserCog, checklist: CheckCircle2,
};

export function StepView({ data }: { data: StepViewData }) {
  const router = useRouter();
  const Icon = KIND_ICON[data.kind] ?? BookOpen;
  const done = data.status === "completed" || data.status === "approved";

  function goHome() {
    router.push(`/onboard/${data.token}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/onboard/${data.token}`}><ArrowLeft /> All steps</Link>
      </Button>

      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {SECTION_LABELS[data.section as StepSection] ?? data.section}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{data.title}</h1>
          {data.version && <p className="text-xs text-muted-foreground">Version {data.version}</p>}
        </div>
        {done && <Badge variant="success" className="ml-auto"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</Badge>}
      </div>

      {data.kind === "content" && <ContentTask data={data} onDone={goHome} />}
      {data.kind === "policy" && <PolicyTask data={data} onDone={goHome} />}
      {data.kind === "training" && <TrainingTask data={data} onDone={goHome} />}
      {data.kind === "assessment" && <AssessmentTask data={data} onDone={goHome} />}
      {data.kind === "document" && <DocumentTask data={data} onDone={goHome} />}
      {data.kind === "info_form" && <InfoFormTask data={data} onDone={goHome} />}
      {data.kind === "checklist" && <FinalChecklistTask data={data} onDone={goHome} />}
    </div>
  );
}

/* ------------------------------- Content --------------------------------- */

function ContentTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const [pending, start] = React.useTransition();
  const body = String(data.snapshot.body ?? "");
  const done = data.status === "completed";

  return (
    <div className="space-y-5">
      <Card><CardContent className="pt-6"><RichText html={body} /></CardContent></Card>
      <div className="flex justify-end">
        {done ? (
          <Button variant="outline" onClick={onDone}>Back to steps</Button>
        ) : (
          <Button variant="brand" disabled={pending} onClick={() => start(async () => {
            const res = await completeContentStep(data.token, data.stepId);
            if (res.ok) { toast.success(res.message); onDone(); } else toast.error(res.error);
          })}>
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Mark as complete
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Policy --------------------------------- */

function PolicyTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const [pending, start] = React.useTransition();
  const [agreed, setAgreed] = React.useState(false);
  const body = String(data.snapshot.body ?? "");
  const effectiveDate = data.snapshot.effectiveDate ? formatDate(String(data.snapshot.effectiveDate)) : null;
  const done = data.status === "completed";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">Version {data.version || "1.0"}</Badge>
        {effectiveDate && <span>Effective {effectiveDate}</span>}
      </div>
      <Card><CardContent className="pt-6"><RichText html={body} /></CardContent></Card>

      {done ? (
        <Card className="border-success/30 bg-success/[0.05]">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm">You have acknowledged this policy.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
              <span className="text-sm">I have read and understood this document.</span>
            </label>
            <div className="flex justify-end">
              <Button variant="brand" disabled={!agreed || pending} onClick={() => start(async () => {
                const res = await acknowledgePolicy(data.token, data.stepId);
                if (res.ok) { toast.success(res.message); onDone(); } else toast.error(res.error);
              })}>
                {pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Acknowledge
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- Training -------------------------------- */

function TrainingTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const [pending, start] = React.useTransition();
  const contentType = String(data.snapshot.contentType ?? "text");
  const body = String(data.snapshot.body ?? "");
  const resourceUrl = String(data.snapshot.resourceUrl ?? "");
  const checklist = (data.snapshot.checklist as { label: string }[] | undefined) ?? [];
  const [checked, setChecked] = React.useState<boolean[]>(() => checklist.map(() => false));
  const done = data.status === "completed";
  const allChecked = checklist.length === 0 || checked.every(Boolean);

  return (
    <div className="space-y-5">
      <Card><CardContent className="space-y-4 pt-6">
        {body && <RichText html={body} />}
        {resourceUrl && contentType !== "checklist" && (
          <Button asChild variant="outline"><a href={resourceUrl} target="_blank" rel="noreferrer"><ExternalLink /> Open resource</a></Button>
        )}
        {contentType === "checklist" && (
          <ul className="space-y-2.5">
            {checklist.map((c, i) => (
              <li key={i}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={checked[i]}
                    disabled={done}
                    onCheckedChange={(v) => setChecked((prev) => prev.map((p, idx) => (idx === i ? v === true : p)))}
                    className="mt-0.5"
                  />
                  <span className={cn("text-sm", checked[i] && "text-muted-foreground line-through")}>{c.label}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </CardContent></Card>

      <div className="flex justify-end">
        {done ? (
          <Button variant="outline" onClick={onDone}>Back to steps</Button>
        ) : (
          <Button variant="brand" disabled={pending || !allChecked} onClick={() => start(async () => {
            const res = await completeTraining(data.token, data.stepId, {
              checkedItems: checked.map((c, i) => (c ? i : -1)).filter((i) => i >= 0),
            });
            if (res.ok) { toast.success(res.message); onDone(); } else toast.error(res.error);
          })}>
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Complete training
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Assessment ------------------------------- */

interface SnapQuestion { type: "mcq" | "truefalse" | "short"; prompt: string; options: string[]; points: number }

function AssessmentTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const [pending, start] = React.useTransition();
  const questions = (data.snapshot.questions as SnapQuestion[] | undefined) ?? [];
  const passingScore = Number(data.snapshot.passingScore ?? 70);
  const maxAttempts = Number(data.snapshot.maxAttempts ?? 3);
  const attemptsUsed = data.attempts.length;
  const attemptsLeft = Math.max(0, maxAttempts - attemptsUsed);
  const passed = data.status === "completed" || data.attempts.some((a) => a.passed);
  const best = data.attempts.reduce((m, a) => Math.max(m, a.score), 0);

  const [answers, setAnswers] = React.useState<{ selectedIndex?: number; text?: string }[]>(() => questions.map(() => ({})));
  const [result, setResult] = React.useState<{ score: number; passed: boolean } | null>(null);

  const answered = answers.every((a, i) =>
    questions[i].type === "short" ? (a.text ?? "").trim().length > 0 : a.selectedIndex !== undefined);

  if (passed) {
    return (
      <Card className="border-success/30 bg-success/[0.05]">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <div><p className="font-semibold">Assessment passed</p><p className="text-sm text-muted-foreground">Your best score: {best}%</p></div>
          <Button variant="outline" onClick={onDone}>Back to steps</Button>
        </CardContent>
      </Card>
    );
  }

  if (attemptsLeft === 0) {
    return (
      <Card className="border-destructive/30 bg-destructive/[0.04]">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div><p className="font-semibold">No attempts remaining</p><p className="text-sm text-muted-foreground">Please contact your HR team to reset this assessment.</p></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">Pass mark {passingScore}%</Badge>
        <Badge variant="muted">{attemptsLeft} attempt{attemptsLeft !== 1 && "s"} left</Badge>
      </div>

      {result && !result.passed && (
        <Card className="border-warning/40 bg-warning/[0.06]">
          <CardContent className="flex items-center gap-3 py-4">
            <RotateCcw className="h-5 w-5 text-warning-foreground" />
            <p className="text-sm">You scored {result.score}%. You need {passingScore}% to pass — review the material and try again.</p>
          </CardContent>
        </Card>
      )}

      {questions.map((q, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 pt-5">
            <p className="text-sm font-medium">{i + 1}. {q.prompt}</p>
            {q.type === "short" ? (
              <Input
                placeholder="Your answer"
                value={answers[i].text ?? ""}
                onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? { text: e.target.value } : a)))}
              />
            ) : (
              <RadioGroup
                value={answers[i].selectedIndex?.toString() ?? ""}
                onValueChange={(v) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? { selectedIndex: parseInt(v, 10) } : a)))}
              >
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/40">
                    <RadioGroupItem value={oi.toString()} />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button variant="brand" disabled={pending || !answered} onClick={() => start(async () => {
          const res = await submitAssessment(data.token, data.stepId, { answers });
          if (res.ok && res.data) {
            setResult({ score: res.data.score, passed: res.data.passed });
            if (res.data.passed) { toast.success(res.message); onDone(); }
            else { toast.error(res.message ?? "Try again"); setAnswers(questions.map(() => ({}))); }
          } else if (!res.ok) toast.error(res.error);
        })}>
          {pending ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} Submit assessment
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------- Document -------------------------------- */

function DocumentTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const allowed = (data.snapshot.allowedTypes as string[] | undefined) ?? ["pdf", "jpg", "jpeg", "png"];
  const maxSizeMB = Number(data.snapshot.maxSizeMB ?? 10);
  const description = String(data.snapshot.description ?? "");
  const sub = data.submission;
  const approved = sub?.status === "approved";

  async function upload() {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("token", data.token);
      fd.append("stepId", data.stepId);
      fd.append("file", file);
      const res = await fetch("/api/portal/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok) { toast.success("Uploaded — awaiting review"); onDone(); }
      else toast.error(json.error ?? "Upload failed");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card><CardContent className="space-y-2 pt-5">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <p className="text-xs text-muted-foreground">Accepted: {allowed.join(", ")} · Max {maxSizeMB} MB</p>
      </CardContent></Card>

      {sub && (
        <Card className={cn(
          sub.status === "approved" && "border-success/30 bg-success/[0.05]",
          sub.status === "rejected" && "border-destructive/30 bg-destructive/[0.04]",
          (sub.status === "under_review" || sub.status === "uploaded") && "border-warning/40 bg-warning/[0.06]",
        )}>
          <CardContent className="flex items-start gap-3 py-4">
            {sub.status === "approved" ? <CheckCircle2 className="h-5 w-5 text-success" />
              : sub.status === "rejected" ? <AlertCircle className="h-5 w-5 text-destructive" />
              : <FileText className="h-5 w-5 text-warning-foreground" />}
            <div className="text-sm">
              <p className="font-medium">
                {sub.status === "approved" ? "Approved" : sub.status === "rejected" ? "Rejected — please re-upload" : "Uploaded — awaiting review"}
              </p>
              <p className="text-muted-foreground">{sub.fileName}</p>
              {sub.status === "rejected" && sub.rejectionReason && <p className="mt-1 text-destructive">Reason: {sub.rejectionReason}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {approved ? (
        <div className="flex justify-end"><Button variant="outline" onClick={onDone}>Back to steps</Button></div>
      ) : (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2">
              <Label>{sub ? "Upload a new file" : "Upload your document"}</Label>
              <Input
                type="file"
                accept={allowed.map((t) => `.${t}`).join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="brand" disabled={!file || uploading} onClick={upload}>
                {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {sub ? "Re-upload" : "Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- Info form ------------------------------- */

type InfoFormState = {
  personal: Record<string, string>;
  emergencyContact: Record<string, string>;
  bank: Record<string, string>;
};

function profileToForm(profile: Record<string, unknown>): InfoFormState {
  const p = profile as {
    personal?: Record<string, string>; emergencyContact?: Record<string, string>; bank?: Record<string, string>;
  };
  return {
    personal: {
      dateOfBirth: p.personal?.dateOfBirth ?? "", gender: p.personal?.gender ?? "",
      addressLine: p.personal?.addressLine ?? "", city: p.personal?.city ?? "",
      state: p.personal?.state ?? "", postalCode: p.personal?.postalCode ?? "",
      personalEmail: p.personal?.personalEmail ?? "", altPhone: p.personal?.altPhone ?? "",
    },
    emergencyContact: {
      name: p.emergencyContact?.name ?? "", relationship: p.emergencyContact?.relationship ?? "",
      phone: p.emergencyContact?.phone ?? "", email: p.emergencyContact?.email ?? "",
    },
    bank: {
      accountHolder: p.bank?.accountHolder ?? "", bankName: p.bank?.bankName ?? "",
      accountNumber: p.bank?.accountNumber ?? "", ifsc: p.bank?.ifsc ?? "", branch: p.bank?.branch ?? "",
    },
  };
}

function InfoFormTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const storageKey = `editco-profile-draft:${data.stepId}`;
  const [form, setForm] = React.useState(() => profileToForm(data.profile));
  const submitted = Boolean((data.profile as { submittedAt?: string }).submittedAt);
  const [draftKept, setDraftKept] = React.useState(
    !submitted && Boolean((data.profile as { draftSavedAt?: string }).draftSavedAt),
  );
  const e = data.employment;

  // Restore anything typed on this device if they left before saving.
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as InfoFormState;
      if (parsed?.personal && parsed?.emergencyContact && parsed?.bank) setForm(parsed);
    } catch { /* ignore a bad local draft */ }
  }, [storageKey]);

  function setField(section: "personal" | "emergencyContact" | "bank", key: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [section]: { ...prev[section], [key]: value } };
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }

  function saveDraft() {
    start(async () => {
      const res = await saveInfoDraft(data.token, data.stepId, form);
      if (res.ok) { setDraftKept(true); toast.success(res.message); router.refresh(); }
      else toast.error(res.error);
    });
  }

  function submit() {
    start(async () => {
      const res = await submitInfoForm(data.token, data.stepId, form);
      if (res.ok) {
        try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
        toast.success(res.message);
        onDone();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-5">
      <Section title="Employment information" note="Provided by your HR team — read only.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ReadOnly label="Full name" value={e.fullName} />
          <ReadOnly label="Work email" value={e.email} />
          <ReadOnly label="Department" value={e.department} />
          <ReadOnly label="Role" value={e.role} />
          <ReadOnly label="Reporting manager" value={e.reportingManager || "—"} />
          <ReadOnly label="Joining date" value={formatDate(e.joiningDate)} />
          <ReadOnly label="Employment type" value={e.employmentType} />
          <ReadOnly label="Work mode" value={e.workMode} />
        </div>
      </Section>

      <Section title="Personal information">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldInput label="Date of birth" type="date" value={form.personal.dateOfBirth} onChange={(v) => setField("personal", "dateOfBirth", v)} />
          <FieldInput label="Gender" value={form.personal.gender} onChange={(v) => setField("personal", "gender", v)} />
          <FieldInput label="Personal email" type="email" value={form.personal.personalEmail} onChange={(v) => setField("personal", "personalEmail", v)} />
          <FieldInput label="Alternate phone" value={form.personal.altPhone} onChange={(v) => setField("personal", "altPhone", v)} />
          <FieldInput label="Address" className="sm:col-span-2" value={form.personal.addressLine} onChange={(v) => setField("personal", "addressLine", v)} />
          <FieldInput label="City" value={form.personal.city} onChange={(v) => setField("personal", "city", v)} />
          <FieldInput label="State" value={form.personal.state} onChange={(v) => setField("personal", "state", v)} />
          <FieldInput label="Postal code" value={form.personal.postalCode} onChange={(v) => setField("personal", "postalCode", v)} />
        </div>
      </Section>

      <Section title="Emergency contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldInput label="Contact name *" value={form.emergencyContact.name} onChange={(v) => setField("emergencyContact", "name", v)} />
          <FieldInput label="Relationship" value={form.emergencyContact.relationship} onChange={(v) => setField("emergencyContact", "relationship", v)} />
          <FieldInput label="Phone *" value={form.emergencyContact.phone} onChange={(v) => setField("emergencyContact", "phone", v)} />
          <FieldInput label="Email" type="email" value={form.emergencyContact.email} onChange={(v) => setField("emergencyContact", "email", v)} />
        </div>
      </Section>

      <Section title="Bank details" note="For salary processing.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldInput label="Account holder" value={form.bank.accountHolder} onChange={(v) => setField("bank", "accountHolder", v)} />
          <FieldInput label="Bank name" value={form.bank.bankName} onChange={(v) => setField("bank", "bankName", v)} />
          <FieldInput label="Account number" value={form.bank.accountNumber} onChange={(v) => setField("bank", "accountNumber", v)} />
          <FieldInput label="IFSC" value={form.bank.ifsc} onChange={(v) => setField("bank", "ifsc", v)} />
          <FieldInput label="Branch" className="sm:col-span-2" value={form.bank.branch} onChange={(v) => setField("bank", "branch", v)} />
        </div>
      </Section>

      <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        {!submitted && draftKept && (
          <p className="text-xs text-muted-foreground sm:mr-auto">Draft saved — you can leave and come back.</p>
        )}
        <Button variant="outline" disabled={pending} onClick={saveDraft}>
          {pending ? <Loader2 className="animate-spin" /> : null} Save draft
        </Button>
        <Button variant="brand" disabled={pending} onClick={submit}>
          {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Submit information
        </Button>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div><p className="text-sm font-semibold">{title}</p>{note && <p className="text-xs text-muted-foreground">{note}</p>}</div>
        {children}
      </CardContent>
    </Card>
  );
}
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">{value}</div>
    </div>
  );
}
function FieldInput({ label, value, onChange, type = "text", className }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ---------------------------- Final checklist ---------------------------- */

function FinalChecklistTask({ data, onDone }: { data: StepViewData; onDone: () => void }) {
  const [pending, start] = React.useTransition();
  const items = (data.snapshot.items as string[] | undefined) ?? [];
  const [checked, setChecked] = React.useState<boolean[]>(() => items.map(() => false));
  const done = data.status === "completed";
  const allChecked = items.length > 0 && checked.every(Boolean);
  const blocked = data.outstanding.length > 0;

  if (done) {
    return (
      <Card className="border-success/30 bg-success/[0.05]">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <PartyPopper className="h-8 w-8 text-success" />
          <div><p className="font-semibold">Onboarding complete</p><p className="text-sm text-muted-foreground">Thank you — welcome to Editco!</p></div>
          <Button variant="outline" onClick={onDone}>Back to overview</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {blocked && (
        <Card className="border-warning/40 bg-warning/[0.06]">
          <CardContent className="py-4">
            <p className="text-sm font-medium">Finish these first</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {data.outstanding.map((t, i) => <li key={i} className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5 text-warning-foreground" /> {t}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm font-semibold">Employee declaration</p>
          <ul className="space-y-2.5">
            {items.map((label, i) => (
              <li key={i}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={checked[i]}
                    disabled={blocked}
                    onCheckedChange={(v) => setChecked((prev) => prev.map((p, idx) => (idx === i ? v === true : p)))}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="brand" size="lg" disabled={pending || !allChecked || blocked} onClick={() => start(async () => {
          const res = await completeOnboarding(data.token, data.stepId, { checked });
          if (res.ok) { toast.success(res.message); onDone(); } else toast.error(res.error);
        })}>
          {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Complete Onboarding
        </Button>
      </div>
    </div>
  );
}
