import { requireCapability } from "@/lib/authz";
import { dbConnect } from "@/lib/db";
import { DocumentSubmission, DocumentTemplate } from "@/models";
import { plain } from "@/lib/utils";
import { DocumentsQueue, type SubmissionRow, type DocTypeRow } from "@/components/admin/documents-queue";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requireCapability("documents");
  await dbConnect();

  const [subs, templates] = await Promise.all([
    DocumentSubmission.find()
      .populate<{ employee: { _id: string; fullName: string } }>("employee", "fullName")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    DocumentTemplate.find().sort({ category: 1, name: 1 }).lean(),
  ]);

  const rows: SubmissionRow[] = subs.map((s) => ({
    _id: String(s._id),
    employeeId: String((s.employee as { _id?: string })?._id ?? ""),
    employeeName: (s.employee as { fullName?: string })?.fullName ?? "—",
    documentName: s.documentName,
    fileId: String(s.fileId),
    fileName: s.fileName,
    size: s.size,
    status: s.status,
    rejectionReason: s.rejectionReason ?? "",
    uploadedAt: (s.createdAt as Date).toISOString(),
  }));

  const docTypes: DocTypeRow[] = templates.map((t) => ({
    _id: String(t._id),
    name: t.name,
    category: t.category,
    required: t.required,
    allowedTypes: t.allowedTypes,
    maxSizeMB: t.maxSizeMB,
  }));

  return <DocumentsQueue submissions={plain(rows)} docTypes={plain(docTypes)} />;
}
