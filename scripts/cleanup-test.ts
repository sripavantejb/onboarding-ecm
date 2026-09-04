/** Remove employees created by the automated flow test (employeeCode starting "TEST-") and all their data. */
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import {
  Employee, OnboardingInstance, OnboardingStep, OnboardingToken, DocumentSubmission,
  AssessmentAttempt, TrainingProgress, PolicyAcknowledgement, Review, ActivityLog, Notification,
} from "@/models";

async function main() {
  await dbConnect();
  const employees = await Employee.find({ employeeCode: /^TEST-/ }).select("_id instance").lean();
  const empIds = employees.map((e) => e._id);
  const instIds = employees
    .map((e) => e.instance)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  if (empIds.length === 0) { console.log("No test employees to remove."); await mongoose.disconnect(); return; }

  const r = await Promise.all([
    OnboardingStep.deleteMany({ employee: { $in: empIds } }),
    OnboardingToken.deleteMany({ employee: { $in: empIds } }),
    DocumentSubmission.deleteMany({ employee: { $in: empIds } }),
    AssessmentAttempt.deleteMany({ employee: { $in: empIds } }),
    TrainingProgress.deleteMany({ employee: { $in: empIds } }),
    PolicyAcknowledgement.deleteMany({ employee: { $in: empIds } }),
    Review.deleteMany({ employee: { $in: empIds } }),
    ActivityLog.deleteMany({ employee: { $in: empIds } }),
    Notification.deleteMany({ employee: { $in: empIds } }),
    OnboardingInstance.deleteMany({ _id: { $in: instIds } }),
    Employee.deleteMany({ _id: { $in: empIds } }),
  ]);
  console.log(`Removed ${empIds.length} test employee(s) and their onboarding data.`);
  console.log("Deleted docs:", r.map((x) => x.deletedCount).reduce((a, b) => a + b, 0));
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
