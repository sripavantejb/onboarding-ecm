"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Eye, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocStatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/utils";
import { approveDocument, rejectDocument } from "@/actions/documents-admin";
import type { DocStatus } from "@/types";

export interface SubmissionRow {
  _id: string; employeeId: string; employeeName: string; documentName: string;
  fileId: string; fileName: string; size: number; status: DocStatus;
  rejectionReason: string; uploadedAt: string;
}
export interface DocTypeRow {
  _id: string; name: string; category: string; required: boolean; allowedTypes: string[]; maxSizeMB: number;
}

export function DocumentsQueue({ submissions, docTypes }: { submissions: SubmissionRow[]; docTypes: DocTypeRow[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [rejecting, setRejecting] = React.useState<SubmissionRow | null>(null);
  const [reason, setReason] = React.useState("");

  const needsReview = submissions.filter((s) => s.status === "under_review" || s.status === "uploaded");
  const reviewed = submissions.filter((s) => s.status === "approved" || s.status === "rejected");

  function approve(id: string) {
    start(async () => {
      const res = await approveDocument(id);
      if (res.ok) { toast.success(res.message); router.refresh(); } else toast.error(res.error);
    });
  }
  function doReject() {
    if (!rejecting) return;
    start(async () => {
      const res = await rejectDocument(rejecting._id, { reason });
      if (res.ok) { toast.success(res.message); setRejecting(null); setReason(""); router.refresh(); } else toast.error(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" description="Review documents employees have submitted, and manage the required document types." />

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">Review queue {needsReview.length > 0 && <Badge variant="brand" className="ml-2">{needsReview.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="types">Document types</TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          {needsReview.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing to review" description="Submitted documents will appear here for approval." />
          ) : (
            <Card><CardContent className="divide-y p-0">
              {needsReview.map((s) => (
                <SubmissionItem key={s._id} s={s} pending={pending} onApprove={() => approve(s._id)} onReject={() => { setRejecting(s); setReason(""); }} />
              ))}
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          {reviewed.length === 0 ? (
            <EmptyState icon={FileText} title="No reviewed documents yet" />
          ) : (
            <Card><CardContent className="divide-y p-0">
              {reviewed.map((s) => <SubmissionItem key={s._id} s={s} pending={pending} />)}
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="types">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docTypes.map((t) => (
              <Card key={t._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary"><FileText className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium leading-tight">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.category}</p>
                    </div>
                  </div>
                  {t.required ? <Badge variant="brand">Required</Badge> : <Badge variant="muted">Optional</Badge>}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t.allowedTypes.join(", ")} · max {t.maxSizeMB} MB</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
    </div>
  );
}

function SubmissionItem({
  s, pending, onApprove, onReject,
}: {
  s: SubmissionRow;
  pending: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <UserAvatar name={s.employeeName} className="h-9 w-9" />
        <div>
          <Link href={`/employees/${s.employeeId}`} className="text-sm font-medium hover:underline">{s.employeeName}</Link>
          <p className="text-xs text-muted-foreground">{s.documentName} · {s.fileName} · {(s.size / 1024).toFixed(0)} KB · {timeAgo(s.uploadedAt)}</p>
          {s.status === "rejected" && s.rejectionReason && <p className="text-xs text-destructive">Rejected: {s.rejectionReason}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 pl-12 sm:pl-0">
        <DocStatusBadge status={s.status} />
        <Button asChild variant="outline" size="sm"><a href={`/api/files/${s.fileId}`} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /> View</a></Button>
        {onApprove && <Button variant="outline" size="sm" className="text-success" disabled={pending} onClick={onApprove}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</Button>}
        {onReject && <Button variant="outline" size="sm" className="text-destructive" disabled={pending} onClick={onReject}><XCircle className="h-3.5 w-3.5" /> Reject</Button>}
      </div>
    </div>
  );
}
