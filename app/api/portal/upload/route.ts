import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { OnboardingStep, DocumentSubmission } from "@/models";
import { resolvePortal } from "@/lib/portal";
import { employeeAuthedFor } from "@/lib/employee-auth";
import { recomputeInstance } from "@/lib/instance-state";
import { uploadBuffer, deleteFile } from "@/lib/gridfs";
import { logActivity, notify } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = String(form.get("token") ?? "");
    const stepId = String(form.get("stepId") ?? "");
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }

    const portal = await resolvePortal(token);
    if (!portal.ok) return NextResponse.json({ ok: false, error: "This link is no longer valid." }, { status: 403 });
    if (!(await employeeAuthedFor(portal.employee._id.toString(), portal.instance._id.toString()))) {
      return NextResponse.json({ ok: false, error: "Please sign in to your portal first." }, { status: 401 });
    }

    await dbConnect();
    const step = await OnboardingStep.findById(stepId);
    if (!step || step.instance.toString() !== portal.instance._id.toString() || step.kind !== "document") {
      return NextResponse.json({ ok: false, error: "Invalid document step." }, { status: 400 });
    }

    const snap = step.snapshot as { allowedTypes?: string[]; maxSizeMB?: number; name?: string };
    const maxBytes = (snap.maxSizeMB ?? 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, error: `File exceeds ${snap.maxSizeMB ?? 10} MB limit.` }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const allowed = (snap.allowedTypes ?? ["pdf", "jpg", "jpeg", "png"]).map((t) => t.toLowerCase());
    if (allowed.length && ext && !allowed.includes(ext)) {
      return NextResponse.json({ ok: false, error: `Allowed file types: ${allowed.join(", ")}.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = await uploadBuffer(
      file.name,
      buffer,
      { employee: String(portal.employee._id), instance: String(portal.instance._id), step: String(step._id) },
      file.type || "application/octet-stream",
    );

    // Replace any previous submission's file for this step.
    const prev = await DocumentSubmission.find({ step: step._id });
    for (const p of prev) await deleteFile(String(p.fileId));
    await DocumentSubmission.deleteMany({ step: step._id });

    await DocumentSubmission.create({
      step: step._id, instance: portal.instance._id, employee: portal.employee._id,
      documentName: snap.name ?? step.title, fileId, fileName: file.name,
      mimeType: file.type || "application/octet-stream", size: file.size, status: "under_review",
    });

    step.status = "under_review";
    step.completedAt = null;
    await step.save();
    await recomputeInstance(step.instance);

    await logActivity({
      actorType: "employee", actorName: portal.employee.fullName, action: "document.uploaded",
      message: `Uploaded “${step.title}”`, employee: portal.employee._id, instance: portal.instance._id,
    });
    await notify({
      audience: "admin", type: "document.uploaded", title: "Document uploaded",
      message: `${portal.employee.fullName} uploaded “${step.title}” for review.`,
      employee: portal.employee._id, instance: portal.instance._id, link: `/employees/${portal.employee._id}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ ok: false, error: "Upload failed. Please try again." }, { status: 500 });
  }
}
