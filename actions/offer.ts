"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Employee, OfferLetter } from "@/models";
import { requireCapability } from "@/lib/authz";
import { ok, fail, guard, type ActionResult } from "@/lib/action-result";
import { generateOfferLetterPdf } from "@/lib/pdf";
import { uploadBuffer, deleteFile } from "@/lib/gridfs";
import { logActivity, notify } from "@/lib/activity";

const schema = z.object({
  ctcAnnual: z.coerce.number().positive("Enter a valid annual CTC"),
  currency: z.string().default("INR"),
  location: z.string().max(120).optional().default(""),
  offerDate: z.string().optional(),
  responseByDate: z.string().optional(),
  terms: z.array(z.string().max(300)).optional().default([]),
});

export async function issueOfferLetter(employeeId: string, input: unknown): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    const parsed = schema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
    const d = parsed.data;
    await dbConnect();

    const employee = await Employee.findById(employeeId)
      .populate<{ department: { name: string } }>("department", "name")
      .populate<{ role: { title: string } }>("role", "title");
    if (!employee) return fail("Employee not found.");
    if (!employee.instance) return fail("This employee has no onboarding instance.");

    const departmentName = (employee.department as unknown as { name?: string })?.name ?? "—";
    const roleTitle = (employee.role as unknown as { title?: string })?.title ?? "—";
    const offerDate = d.offerDate ? new Date(d.offerDate) : new Date();
    const responseByDate = d.responseByDate ? new Date(d.responseByDate) : null;
    const terms = (d.terms ?? []).map((t) => t.trim()).filter(Boolean);

    const pdf = await generateOfferLetterPdf({
      candidateName: employee.fullName,
      roleTitle,
      departmentName,
      joiningDate: employee.joiningDate,
      employmentType: employee.employmentType,
      workMode: employee.workMode,
      location: d.location ?? "",
      reportingManagerName: employee.reportingManagerName ?? "",
      ctcAnnual: d.ctcAnnual,
      currency: d.currency,
      offerDate,
      responseByDate,
      terms,
      issuedByName: user.name,
      employeeCode: employee.employeeCode,
    });

    const fileName = `Editco-Offer-${employee.fullName.replace(/\s+/g, "-")}.pdf`;
    const fileId = await uploadBuffer(
      fileName,
      pdf,
      { employee: String(employee._id), kind: "offer-letter" },
      "application/pdf",
    );

    // Replace any existing offer (and its old file).
    const existing = await OfferLetter.findOne({ employee: employee._id });
    if (existing) {
      await deleteFile(String(existing.fileId));
      await existing.deleteOne();
    }

    await OfferLetter.create({
      employee: employee._id,
      instance: employee.instance,
      candidateName: employee.fullName,
      roleTitle,
      departmentName,
      joiningDate: employee.joiningDate,
      employmentType: employee.employmentType,
      workMode: employee.workMode,
      location: d.location ?? "",
      reportingManagerName: employee.reportingManagerName ?? "",
      ctcAnnual: d.ctcAnnual,
      currency: d.currency,
      offerDate,
      responseByDate,
      terms,
      fileId,
      issuedByName: user.name,
      status: "issued",
    });

    await logActivity({
      actorType: "admin", actorName: user.name, action: "offer.issued",
      message: `Issued offer letter to ${employee.fullName}`,
      employee: employee._id, instance: employee.instance, resourceType: "OfferLetter",
    });
    await notify({
      audience: "employee", type: "offer.issued", title: "Your offer letter is ready",
      message: "Your Editco offer letter is available in your portal to download and accept.",
      employee: employee._id, instance: employee.instance,
    });

    revalidatePath(`/employees/${employee._id}`);
    return ok(undefined, existing ? "Offer letter re-issued" : "Offer letter issued");
  });
}

export async function revokeOfferLetter(employeeId: string): Promise<ActionResult> {
  return guard(async () => {
    const user = await requireCapability("employees");
    await dbConnect();
    const offer = await OfferLetter.findOne({ employee: employeeId });
    if (!offer) return fail("No offer letter to revoke.");
    offer.status = "revoked";
    await offer.save();
    await logActivity({
      actorType: "admin", actorName: user.name, action: "offer.revoked",
      message: "Revoked offer letter", employee: employeeId, instance: offer.instance,
    });
    revalidatePath(`/employees/${employeeId}`);
    return ok(undefined, "Offer letter revoked");
  });
}
