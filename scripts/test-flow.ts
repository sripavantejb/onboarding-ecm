/**
 * End-to-end integration test of the onboarding engine (no HTTP layer).
 * Run: npm run test:flow
 */
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import {
  Department, Role, Employee, OnboardingInstance, OnboardingStep, OnboardingToken,
  Content, ContentVersion,
} from "@/models";
import { buildPreview, generateInstanceForEmployee } from "@/lib/onboarding";
import { generateOnboardingToken, hashToken } from "@/lib/tokens";
import { resolvePortal } from "@/lib/portal";
import { setStepStatus, recomputeInstance } from "@/lib/instance-state";
import { defaultExpiry } from "@/lib/onboarding-links";

let pass = 0, fail = 0;
function check(label: string, cond: boolean) {
  if (cond) { pass++; console.log(`  [ok] ${label}`); }
  else { fail++; console.log(`  [fail] ${label}`); }
}

async function makeEmployee(name: string, deptId: mongoose.Types.ObjectId, roleId: mongoose.Types.ObjectId, deptName: string, roleName: string) {
  const emp = await Employee.create({
    fullName: name, email: `${name.toLowerCase()}.${Date.now().toString(36)}@editco.test`,
    employeeCode: `TEST-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.floor(Math.random()*1000)}`,
    department: deptId, role: roleId, joiningDate: new Date(),
    employmentType: "Full-time", workMode: "On-site", status: "active", profile: {},
  });
  const instance = await generateInstanceForEmployee(emp, deptName, roleName);
  emp.instance = instance._id; await emp.save();
  const { raw, hash } = generateOnboardingToken();
  const token = await OnboardingToken.create({
    instance: instance._id, employee: emp._id, tokenHash: hash, status: "active", expiresAt: defaultExpiry(),
  });
  return { emp, instance, raw, token };
}

async function main() {
  await dbConnect();
  console.log("\n=== Editco Onboarding — end-to-end engine test ===\n");

  const dept = await Department.findOne({ slug: "sales-business-development" });
  const role = await Role.findOne({ slug: "sales-executive", department: dept?._id });
  if (!dept || !role) throw new Error("Seed data missing — run `npm run seed` first.");

  console.log("1) Template preview for Sales / Sales Executive");
  const preview = await buildPreview(dept._id.toString(), role._id.toString());
  check("has core modules", preview.counts.core > 0);
  check("has role modules", preview.counts.role > 0);
  check("has documents", preview.counts.documents > 0);
  check("has policies", preview.counts.policies > 0);
  check("has training", preview.counts.training > 0);
  check("has assessment", preview.counts.assessments > 0);
  check("has 30/60/90 reviews", preview.reviews.join(",") === "30,60,90");
  check("resolved a role-specific track", preview.hasRoleTemplate);

  console.log("\n2) Create employee 'Gayathri' & generate onboarding");
  const g = await makeEmployee("Gayathri", dept._id, role._id, dept.name, role.title);
  const steps = await OnboardingStep.find({ instance: g.instance._id }).sort({ order: 1 }).lean();
  check("steps were generated", steps.length > 0);
  check("includes info_form step", steps.some((s) => s.kind === "info_form"));
  check("includes final checklist step", steps.some((s) => s.kind === "checklist"));
  const contentStep = steps.find((s) => s.kind === "content");
  check("content step has frozen body snapshot", !!(contentStep?.snapshot as { body?: string })?.body);
  check("initial progress is 0", g.instance.progress === 0);

  console.log("\n3) Secure token resolves via portal");
  const resolved = await resolvePortal(g.raw);
  check("valid raw token resolves", resolved.ok);
  check("wrong token is rejected", !(await resolvePortal("x".repeat(43))).ok);
  check("only hash stored (raw != stored)", g.token.tokenHash === hashToken(g.raw) && g.token.tokenHash !== g.raw);

  console.log("\n4) Complete all required steps → progress 100 / completed");
  const required = await OnboardingStep.find({ instance: g.instance._id, required: true });
  for (const s of required) await setStepStatus(s._id, "completed");
  const after = await recomputeInstance(g.instance._id);
  check("progress reaches 100%", after?.progress === 100);
  check("status becomes completed", after?.status === "completed");
  const refreshed = await OnboardingInstance.findById(g.instance._id);
  check("completedAt is set", !!refreshed?.completedAt);

  console.log("\n5) Versioning invariant: editing a master must NOT change existing instances");
  const editco101 = await Content.findOne({ key: "editco-101" });
  if (!editco101) throw new Error("editco-101 content missing");
  const gStep101 = steps.find((s) => (s.snapshot as { contentKey?: string })?.contentKey === "editco-101");
  const oldBody = (gStep101?.snapshot as { body?: string })?.body ?? "";
  // Publish a new version with different content.
  const newNum = editco101.versionCounter + 1;
  const newVersion = await ContentVersion.create({
    content: editco101._id, version: `${newNum}.0`, versionNumber: newNum,
    title: editco101.title, body: `<h1>Editco 101 — UPDATED ${Date.now()}</h1>`,
    status: "published", publishedAt: new Date(),
  });
  editco101.versionCounter = newNum; editco101.latestPublished = newVersion._id; await editco101.save();

  const gStepReloaded = await OnboardingStep.findById(gStep101?._id).lean();
  check("existing instance snapshot is unchanged", (gStepReloaded?.snapshot as { body?: string })?.body === oldBody);

  console.log("\n6) New employee receives the LATEST published version");
  const g2 = await makeEmployee("Arjun", dept._id, role._id, dept.name, role.title);
  const g2steps = await OnboardingStep.find({ instance: g2.instance._id }).lean();
  const g2step101 = g2steps.find((s) => (s.snapshot as { contentKey?: string })?.contentKey === "editco-101");
  const g2Body = (g2step101?.snapshot as { body?: string })?.body ?? "";
  check("new employee gets updated body", g2Body.includes("UPDATED"));
  check("new employee body differs from old snapshot", g2Body !== oldBody);
  check("new employee snapshot version is latest", (g2step101?.snapshot as { version?: string })?.version === `${newNum}.0`);

  console.log("\n7) Revoked & expired links stop working");
  g.token.status = "revoked"; await g.token.save();
  check("revoked token rejected", (await resolvePortal(g.raw)).ok === false);
  g2.token.expiresAt = new Date(Date.now() - 1000); await g2.token.save();
  const expiredRes = await resolvePortal(g2.raw);
  check("expired token rejected", expiredRes.ok === false && !expiredRes.ok && expiredRes.reason === "expired");

  console.log("\n8) Cross-employee isolation");
  // Re-issue a valid token for g2 and ensure it cannot touch Gayathri's steps.
  const { raw: g2raw, hash: g2hash } = generateOnboardingToken();
  g2.token.tokenHash = g2hash; g2.token.status = "active"; g2.token.expiresAt = defaultExpiry(); await g2.token.save();
  const g2portal = await resolvePortal(g2raw);
  const gAnyStep = steps[0];
  const belongsToG2 = g2portal.ok && (await OnboardingStep.findOne({ _id: gAnyStep._id, instance: g2portal.instance._id }));
  check("employee cannot access another employee's step", !belongsToG2);

  console.log(`\n=== Result: ${pass} passed, ${fail} failed ===\n`);
  await mongoose.disconnect();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
