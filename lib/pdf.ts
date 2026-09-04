import "server-only";
import PDFDocument from "pdfkit";
import { LOGO_PNG_BASE64 } from "@/lib/logo-data";

const LOGO_BUFFER = Buffer.from(LOGO_PNG_BASE64, "base64");
const INK = "#1c1c22";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

export interface OfferLetterInput {
  candidateName: string;
  roleTitle: string;
  departmentName: string;
  joiningDate: Date;
  employmentType: string;
  workMode: string;
  location: string;
  reportingManagerName: string;
  ctcAnnual: number;
  currency: string;
  offerDate: Date;
  responseByDate?: Date | null;
  terms: string[];
  issuedByName: string;
  employeeCode: string;
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(d);
}
function fmtMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

export function generateOfferLetterPdf(input: OfferLetterInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 64, left: 56, right: 56 } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // ---- Header -----------------------------------------------------------
    try {
      doc.image(LOGO_BUFFER, left, 44, { width: 30, height: 30 });
    } catch {
      /* fall through — text header still renders */
    }
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(15).text("EDITCO MEDIA", left + 42, 48);
    doc.fillColor(MUTED).font("Helvetica").fontSize(9)
      .text("Smart websites · AI calling agents · Growth systems", left + 42, 66);
    doc.fillColor(MUTED).fontSize(9).text("editcomedia.com  ·  hello@editcomedia.com  ·  +91 90590 57093", left, 44, {
      width, align: "right",
    });

    doc.moveTo(left, 90).lineTo(right, 90).lineWidth(1).stroke(LINE);

    // ---- Meta -------------------------------------------------------------
    let y = 106;
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`Ref: ${input.employeeCode}`, left, y);
    doc.text(`Date: ${fmtDate(input.offerDate)}`, left, y, { width, align: "right" });
    y += 24;
    doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(8.5).text("PRIVATE & CONFIDENTIAL", left, y);
    y += 22;

    // ---- Salutation + subject --------------------------------------------
    doc.fillColor(INK).font("Helvetica").fontSize(11).text(`Dear ${input.candidateName},`, left, y);
    y += 22;
    doc.font("Helvetica-Bold").fontSize(11.5)
      .text(`Offer of Employment — ${input.roleTitle}`, left, y, { width });
    y = doc.y + 12;

    // ---- Body -------------------------------------------------------------
    doc.font("Helvetica").fontSize(10.5).fillColor(INK);
    const intro =
      `We are delighted to offer you the position of ${input.roleTitle} at Editco Media, within our ` +
      `${input.departmentName} team. We were impressed by you, and we believe you'll do great work with us.`;
    doc.text(intro, left, y, { width, align: "left", lineGap: 3 });
    y = doc.y + 12;

    doc.text("The key details of your offer are as follows:", left, y, { width, lineGap: 3 });
    y = doc.y + 10;

    // ---- Details box ------------------------------------------------------
    const rows: [string, string][] = [
      ["Position", input.roleTitle],
      ["Department", input.departmentName],
      ["Start date", fmtDate(input.joiningDate)],
      ["Employment type", input.employmentType],
      ["Work mode", input.workMode],
      ["Location", input.location || "—"],
      ["Reporting to", input.reportingManagerName || "To be confirmed"],
      ["Annual CTC", fmtMoney(input.ctcAnnual, input.currency)],
    ];
    const rowH = 22;
    const boxH = rows.length * rowH + 12;
    doc.roundedRect(left, y, width, boxH, 6).lineWidth(1).stroke(LINE);
    let ry = y + 6;
    rows.forEach(([k, v], i) => {
      if (i > 0) doc.moveTo(left + 12, ry).lineTo(right - 12, ry).lineWidth(0.5).stroke(LINE);
      doc.fillColor(MUTED).font("Helvetica").fontSize(9.5).text(k, left + 16, ry + 6, { width: 150 });
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5)
        .text(v, left + 170, ry + 6, { width: width - 186, align: "left" });
      ry += rowH;
    });
    y = y + boxH + 16;

    // ---- Terms ------------------------------------------------------------
    if (input.terms.length > 0) {
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text("Terms & conditions", left, y);
      y = doc.y + 6;
      doc.font("Helvetica").fontSize(10).fillColor(INK);
      for (const t of input.terms) {
        doc.text(`•  ${t}`, left + 4, y, { width: width - 4, lineGap: 2 });
        y = doc.y + 4;
      }
      y += 6;
    }

    const closing =
      `This offer is made in good faith and is subject to satisfactory completion of onboarding and ` +
      `verification of your documents.` +
      (input.responseByDate ? ` Please confirm your acceptance by ${fmtDate(input.responseByDate)}.` : "");
    doc.font("Helvetica").fontSize(10.5).fillColor(INK).text(closing, left, y, { width, lineGap: 3 });
    y = doc.y + 14;
    doc.text("We're excited to have you on the team and look forward to building great things together.", left, y, { width, lineGap: 3 });
    y = doc.y + 26;

    // ---- Signature --------------------------------------------------------
    doc.font("Helvetica").fontSize(10.5).fillColor(INK).text("Warm regards,", left, y);
    y = doc.y + 6;
    doc.font("Helvetica-Bold").fontSize(11).text(input.issuedByName || "Editco Media", left, y);
    doc.font("Helvetica").fontSize(9.5).fillColor(MUTED).text("For Editco Media", left, doc.y + 2);

    // Acceptance strip
    const stripY = doc.page.height - doc.page.margins.bottom - 26;
    doc.moveTo(left, stripY - 10).lineTo(right, stripY - 10).lineWidth(1).stroke(LINE);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.5)
      .text("You can review, accept and track this offer from your Editco onboarding portal.", left, stripY, { width, align: "center" });

    doc.end();
  });
}
