/**
 * Standalone seed runner.
 * Usage:  npm run seed
 * (loads .env.local via node --env-file, then seeds MongoDB)
 */
import mongoose from "mongoose";
import { runSeed } from "@/lib/seed";

async function main() {
  console.log("Seeding Editco Onboarding database...");
  const result = await runSeed();
  console.log("\n[ok] Seed complete.");
  console.table(result.counts);

  if (result.admins?.length) {
    console.log("\nAdmin accounts (password for all: " + (result.adminPassword ?? "(unchanged)") + "):");
    for (const a of result.admins) {
      const flag = a.created ? "created" : a.updated ? "updated" : "ok";
      console.log(`  [${flag}] ${a.name} <${a.email}>`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("[fail] Seed failed:", err);
  process.exit(1);
});
