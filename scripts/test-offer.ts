/** E2E test: offer letter + employee portal authentication. Run: npm run test:offer (dev server up) */
import mongoose from "mongoose";
import { SignJWT } from "jose";
import { dbConnect } from "@/lib/db";
import { Department } from "@/models/Department";
import { Role } from "@/models/Role";
import { Employee } from "@/models/Employee";
import { OnboardingStep } from "@/models/OnboardingInstance";
import { OnboardingToken } from "@/models/OnboardingToken";
import { OfferLetter } from "@/models/OfferLetter";
import { generateInstanceForEmployee } from "@/lib/onboarding";
import { generateOfferLetterPdf } from "@/lib/pdf";
import { uploadBuffer, getFile, deleteFile } from "@/lib/gridfs";
import { generateOnboardingToken } from "@/lib/tokens";
import { hashPassword, verifyPassword } from "@/lib/password";
import { defaultExpiry } from "@/lib/onboarding-links";

let pass = 0, fail = 0;
const check = (l: string, c: boolean) => { c ? (pass++, console.log(`  ✓ ${l}`)) : (fail++, console.log(`  ✗ ${l}`)); };

async function portalCookie(eid: string, iid: string, name: string) {
  const jwt = await new SignJWT({ eid, iid, name })
    .setProtectedHeader({ alg: "HS256" }).setAudience("editco-employee")
    .setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET));
  return `editco_portal=${jwt}`;
}

async function main() {
  await dbConnect();
  console.log("\n=== Offer letter + portal auth E2E ===\n");
  const dept = await Department.findOne({ slug: "sales-business-development" });
  const role = await Role.findOne({ slug: "sales-executive", department: dept?._id });
  if (!dept || !role) throw new Error("Run npm run seed first.");

  const PW = "Secret123";
  const emp = await Employee.create({
    fullName: "Offer Testuser", email: `offer.${Date.now().toString(36)}@editco.test`,
    employeeCode: `TEST-OF-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    department: dept._id, role: role._id, joiningDate: new Date(Date.now() + 14 * 864e5),
    employmentType: "Full-time", workMode: "Hybrid", status: "active", profile: {},
    reportingManagerName: "Harsha Polina",
    portalPasswordHash: await hashPassword(PW), portalPasswordSetAt: new Date(),
  });
  const instance = await generateInstanceForEmployee(emp, dept.name, role.title);
  emp.instance = instance._id; await emp.save();
  const { raw, hash } = generateOnboardingToken();
  await OnboardingToken.create({ instance: instance._id, employee: emp._id, tokenHash: hash, status: "active", expiresAt: defaultExpiry() });
  const cookie = await portalCookie(String(emp._id), String(instance._id), emp.fullName);

  console.log("1) Password auth");
  check("correct password verifies", await verifyPassword(PW, emp.portalPasswordHash!));
  check("wrong password rejected", !(await verifyPassword("nope", emp.portalPasswordHash!)));

  console.log("\n2) Portal requires sign-in");
  const noAuth = await (await fetch(`http://localhost:3000/onboard/${raw}`)).text();
  check("unauthenticated visitor sees login screen", noAuth.includes("Sign in to your onboarding"));
  const authed = await (await fetch(`http://localhost:3000/onboard/${raw}`, { headers: { Cookie: cookie } })).text();
  check("authenticated visitor sees portal", authed.includes("Hi ") || authed.includes("Start Here"));

  console.log("\n3) Offer PDF generate + store");
  const pdf = await generateOfferLetterPdf({
    candidateName: emp.fullName, roleTitle: role.title, departmentName: dept.name,
    joiningDate: emp.joiningDate, employmentType: "Full-time", workMode: "Hybrid",
    location: "Hyderabad", reportingManagerName: "Harsha Polina", ctcAnnual: 600000,
    currency: "INR", offerDate: new Date(), responseByDate: new Date(Date.now() + 7 * 864e5),
    terms: ["Subject to document verification."], issuedByName: "Editco Admin", employeeCode: emp.employeeCode,
  });
  check("PDF has %PDF header", pdf.subarray(0, 4).toString() === "%PDF");
  const fileId = await uploadBuffer(`Editco-Offer-${emp.fullName}.pdf`, pdf, { kind: "offer-letter" }, "application/pdf");
  await OfferLetter.create({
    employee: emp._id, instance: instance._id, candidateName: emp.fullName, roleTitle: role.title,
    departmentName: dept.name, joiningDate: emp.joiningDate, employmentType: "Full-time", workMode: "Hybrid",
    location: "Hyderabad", reportingManagerName: "Harsha Polina", ctcAnnual: 600000, currency: "INR",
    offerDate: new Date(), terms: ["Subject to document verification."], fileId, issuedByName: "Editco Admin", status: "issued",
  });
  check("file retrievable from GridFS", !!(await getFile(String(fileId))));

  console.log("\n4) Offer download is gated by the session");
  const dlNoAuth = await fetch(`http://localhost:3000/api/portal/offer/${raw}`);
  check("download without sign-in blocked (401)", dlNoAuth.status === 401);
  const dl = await fetch(`http://localhost:3000/api/portal/offer/${raw}`, { headers: { Cookie: cookie } });
  check("download with sign-in works (200)", dl.status === 200);
  check("downloaded body is a PDF", Buffer.from(await dl.arrayBuffer()).subarray(0, 4).toString() === "%PDF");
  const badTok = await fetch(`http://localhost:3000/api/portal/offer/${"x".repeat(43)}`, { headers: { Cookie: cookie } });
  check("invalid token blocked (403)", badTok.status === 403);

  console.log("\n5) Portal home shows the offer card (authenticated)");
  check("offer card visible when signed in", authed === "" ? false : (await (await fetch(`http://localhost:3000/onboard/${raw}`, { headers: { Cookie: cookie } })).text()).includes("Your offer letter"));

  console.log("\n— cleanup —");
  await deleteFile(String(fileId));
  await OfferLetter.deleteMany({ employee: emp._id });
  await OnboardingToken.deleteMany({ employee: emp._id });
  await OnboardingStep.deleteMany({ employee: emp._id });
  await mongoose.model("OnboardingInstance").deleteOne({ _id: instance._id });
  await Employee.deleteOne({ _id: emp._id });
  console.log("  cleaned up");

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  await mongoose.disconnect();
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
