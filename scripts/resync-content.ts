/**
 * Re-sync selected Content Library items from lib/seed-content.ts into the DB,
 * updating the currently-published version's body/title and the item summary.
 * Safe when no onboarding instances reference the content (they hold snapshots).
 *
 * Usage: npm run resync:content              (company modules)
 *        npm run resync:content -- all        (all seed content)
 */
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { Content, ContentVersion } from "@/models/Content";
import { CORE_CONTENT, SALES_CONTENT } from "@/lib/seed-content";
import { sanitizeRichText } from "@/lib/sanitize";

const COMPANY_KEYS = ["welcome-to-editco", "about-editco", "editco-101", "editco-way", "communication", "confidentiality"];

async function main() {
  await dbConnect();
  const all = [...CORE_CONTENT, ...SALES_CONTENT];
  const scopeAll = process.argv.includes("all");
  const targets = scopeAll ? all : all.filter((c) => COMPANY_KEYS.includes(c.key));

  let updated = 0;
  for (const item of targets) {
    const content = await Content.findOne({ key: item.key });
    if (!content) { console.log(`  · skip ${item.key} (not found)`); continue; }
    content.summary = item.summary;
    content.title = item.title;
    if (content.latestPublished) {
      await ContentVersion.updateOne(
        { _id: content.latestPublished },
        { $set: { body: sanitizeRichText(item.body), title: item.title } },
      );
    }
    await content.save();
    updated++;
    console.log(`  [ok] ${item.key}`);
  }
  console.log(`\nUpdated ${updated} content item(s).`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
