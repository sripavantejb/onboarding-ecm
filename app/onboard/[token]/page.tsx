import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Circle, CircleDot, Clock, XCircle, PartyPopper,
  Building2, BriefcaseBusiness, UserCog, CalendarDays, BookOpen, FileText, ShieldCheck,
  GraduationCap, ClipboardCheck, ChevronRight,
} from "lucide-react";
import { resolvePortal, touchPortalAccess } from "@/lib/portal";
import { employeeAuthedFor } from "@/lib/employee-auth";
import { PortalShell } from "@/components/portal/portal-shell";
import { PortalLogin } from "@/components/portal/portal-login";
import { InvalidLink } from "@/components/portal/invalid-link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dbConnect } from "@/lib/db";
import { OnboardingStep, OfferLetter } from "@/models";
import { OfferCard } from "@/components/portal/offer-card";
import { nextActionableStep } from "@/lib/progress";
import { SECTION_LABELS, type StepSection, type StepStatus } from "@/types";
import { formatDate, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Onboarding", robots: { index: false } };

const SECTION_SEQUENCE: StepSection[] = ["CORE", "ROLE", "DOCUMENTS", "POLICIES", "TRAINING", "ASSESSMENT", "FINAL"];
const KIND_ICON: Record<string, React.ElementType> = {
  content: BookOpen, document: FileText, policy: ShieldCheck, training: GraduationCap,
  assessment: ClipboardCheck, info_form: UserCog, checklist: CheckCircle2,
};

function StepStatusIcon({ status }: { status: StepStatus }) {
  if (status === "completed" || status === "approved") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === "rejected") return <XCircle className="h-5 w-5 text-destructive" />;
  if (status === "submitted" || status === "under_review") return <Clock className="h-5 w-5 text-warning-foreground" />;
  if (status === "in_progress") return <CircleDot className="h-5 w-5 text-brand" />;
  return <Circle className="h-5 w-5 text-muted-foreground/40" />;
}

const STATUS_TEXT: Partial<Record<StepStatus, string>> = {
  approved: "Approved", completed: "Done", rejected: "Action needed",
  under_review: "Under review", submitted: "Submitted", in_progress: "In progress",
};

export default async function PortalHome({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await resolvePortal(token);
  if (!portal.ok) return <InvalidLink reason={portal.reason} />;

  const { instance, employee } = portal;

  // Require the employee to sign in with the admin-set password.
  const authed = await employeeAuthedFor(employee._id.toString(), instance._id.toString());
  if (!authed) return <PortalLogin token={token} />;

  await touchPortalAccess(portal.token, portal.instance);
  await dbConnect();
  const [steps, offer] = await Promise.all([
    OnboardingStep.find({ instance: instance._id }).sort({ order: 1 }).lean(),
    OfferLetter.findOne({ instance: instance._id }).lean(),
  ]);
  const stepView = steps.map((s) => ({
    _id: String(s._id),
    section: s.section as StepSection,
    kind: s.kind,
    title: s.title,
    required: s.required,
    status: s.status as StepStatus,
    order: s.order,
  }));

  const next = nextActionableStep(stepView);
  const firstName = employee.fullName.split(/\s+/)[0];
  const isComplete = instance.status === "completed";

  const grouped = SECTION_SEQUENCE.map((sec) => ({
    section: sec,
    items: stepView.filter((s) => s.section === sec),
  })).filter((g) => g.items.length > 0);

  return (
    <PortalShell name={employee.fullName} progress={instance.progress} token={token}>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-brand">Welcome to Editco</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hi {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            This is your personal onboarding. Work through each step — we&apos;ll always show you what&apos;s next.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border bg-background px-4 py-3 text-sm">
          <Meta icon={BriefcaseBusiness} label={instance.roleName} />
          <Meta icon={Building2} label={instance.departmentName} />
          {employee.reportingManagerName && <Meta icon={UserCog} label={employee.reportingManagerName} />}
          <Meta icon={CalendarDays} label={`Joins ${formatDate(employee.joiningDate)}`} />
        </div>

        {offer && offer.status !== "revoked" && (
          <OfferCard
            token={token}
            status={offer.status}
            acceptedAt={offer.acceptedAt ? (offer.acceptedAt as Date).toISOString() : null}
          />
        )}

        {/* Next step / completion */}
        {isComplete ? (
          <Card className="border-success/30 bg-success/[0.05]">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-success/15">
                <PartyPopper className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold">You&apos;ve completed onboarding 🎉</p>
                <p className="text-sm text-muted-foreground">Welcome aboard, {firstName}! Your team will take it from here.</p>
              </div>
            </CardContent>
          </Card>
        ) : next ? (
          <Card className="border-brand/30 bg-brand/[0.03]">
            <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <ArrowRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">Next step</p>
                  <p className="text-base font-semibold">{next.title}</p>
                  {next.status === "rejected" && <p className="text-sm text-destructive">Needs your attention — please review and resubmit.</p>}
                </div>
              </div>
              <Button asChild variant="brand" size="lg" className="w-full sm:w-auto">
                <Link href={`/onboard/${token}/step/${next._id}`}>Continue <ArrowRight /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-warning/40 bg-warning/[0.06]">
            <CardContent className="flex items-center gap-3 py-5">
              <Clock className="h-5 w-5 text-warning-foreground" />
              <p className="text-sm">Nice work — everything you can do is done. Some items are awaiting review by your HR team.</p>
            </CardContent>
          </Card>
        )}

        {/* Sections */}
        <div className="space-y-5">
          {grouped.map((g) => {
            const done = g.items.filter((s) => s.status === "completed" || s.status === "approved").length;
            return (
              <div key={g.section} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{SECTION_LABELS[g.section]}</h2>
                  <span className="text-xs text-muted-foreground">{done}/{g.items.length}</span>
                </div>
                <Card className="overflow-hidden">
                  <ul className="divide-y">
                    {g.items.map((s) => {
                      const Icon = KIND_ICON[s.kind] ?? BookOpen;
                      const doneState = s.status === "completed" || s.status === "approved";
                      return (
                        <li key={s._id}>
                          <Link
                            href={`/onboard/${token}/step/${s._id}`}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                          >
                            <StepStatusIcon status={s.status} />
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className={cn("flex-1 truncate text-sm", doneState ? "text-muted-foreground" : "font-medium")}>
                              {s.title}
                            </span>
                            {STATUS_TEXT[s.status] && (
                              <Badge
                                variant={
                                  doneState ? "success" : s.status === "rejected" ? "destructive"
                                    : s.status === "under_review" || s.status === "submitted" ? "warning" : "brand"
                                }
                                className="hidden sm:inline-flex"
                              >
                                {STATUS_TEXT[s.status]}
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </PortalShell>
  );
}

function Meta({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-4 w-4" /> <span className="text-foreground">{label}</span>
    </span>
  );
}
