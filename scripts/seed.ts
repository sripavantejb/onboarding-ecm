/**
 * Standalone seed runner.
 * Usage:  npm run seed
 * (loads .env.local via node --env-file, then seeds MongoDB)
 */
import mongoose from "mongoose";
import { runSeed } from "@/lib/seed";

async function main() {
  console.log("→ Seeding Editco Onboarding database…");
  const result = await runSeed();
  console.log("\n✔ Seed complete.");
  console.table(result.counts);
  if (result.createdAdmin) {
    console.log("\nDefault admin account created:");
    console.log(`  Email:    ${result.adminEmail}`);
    console.log(`  Password: ${result.adminPassword}`);
    console.log("  ⚠ Change this password after first login (Settings).");
  } else {
    console.log(`\nAdmin already existed (${result.adminEmail}) — left untouched.`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("�‑ Seed failed:", err);
  process.exit(1);
});
