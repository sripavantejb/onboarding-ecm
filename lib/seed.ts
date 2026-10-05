import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  User,
  Department,
  Role,
  Content,
  ContentVersion,
  Policy,
  PolicyVersion,
  DocumentTemplate,
  TrainingModule,
  Assessment,
  OnboardingTemplate,
  OnboardingTemplateVersion,
} from "@/models";
import { DEPARTMENTS, SALES_TRACK_ROLE_SLUGS } from "@/lib/seed-org";
import {
  CORE_CONTENT,
  SALES_CONTENT,
  POLICIES,
  DOCUMENTS,
  TRAINING,
  ASSESSMENTS,
  type SeedContent,
} from "@/lib/seed-content";
import type { ITemplateItem } from "@/models/OnboardingTemplate";

export interface SeedAdminAccount {
  name: string;
  email: string;
  created: boolean;
  updated: boolean;
}

export interface SeedResult {
  /** @deprecated use `admins` — kept for older script callers */
  createdAdmin: boolean;
  adminEmail: string;
  adminPassword?: string;
  admins: SeedAdminAccount[];
  counts: Record<string, number>;
}

/** Team accounts seeded for admin login + reporting-manager picker. */
const TEAM_ADMINS = [
  { name: "Deepika Mundla", email: "deepikamundla54@gmail.com", role: "SUPER_ADMIN" as const },
  { name: "Harsha Polina", email: "harshapolina1@gmail.com", role: "SUPER_ADMIN" as const },
  { name: "Sri Pavan Tej", email: "sripavantejb@gmail.com", role: "SUPER_ADMIN" as const },
];
const TEAM_ADMIN_PASSWORD = "abc@123";
const LEGACY_ADMIN_EMAIL = "admin@editcomedia.com";

type OID = mongoose.Types.ObjectId;

async function upsertContent(items: SeedContent[]): Promise<Map<string, OID>> {
  const map = new Map<string, OID>();
  for (const item of items) {
    let content = await Content.findOne({ key: item.key });
    if (!content) {
      content = await Content.create({
        title: item.title,
        key: item.key,
        category: item.category,
        summary: item.summary,
        status: "draft",
        versionCounter: 0,
      });
    }
    // Ensure a published v1.0 exists.
    let version = await ContentVersion.findOne({ content: content._id, versionNumber: 1 });
    if (!version) {
      version = await ContentVersion.create({
        content: content._id,
        version: "1.0",
        versionNumber: 1,
        title: item.title,
        body: item.body,
        status: "published",
        publishedAt: new Date(),
        updatedByName: "System (seed)",
        notes: "Initial version",
      });
      content.versionCounter = 1;
    }
    content.latestPublished = version._id;
    content.status = "published";
    content.category = item.category;
    content.summary = item.summary;
    await content.save();
    map.set(item.key, content._id);
  }
  return map;
}

export async function runSeed(): Promise<SeedResult> {
  await dbConnect();

  // ---- Admin team accounts ------------------------------------------------
  // Env overrides still work for a single bootstrap account; otherwise seed the
  // Editco team so reporting managers and logins are ready out of the box.
  const passwordHash = await hashPassword(
    process.env.SEED_ADMIN_PASSWORD || TEAM_ADMIN_PASSWORD,
  );
  const admins: SeedAdminAccount[] = [];

  const teamToSeed = process.env.SEED_ADMIN_EMAIL
    ? [
        {
          name: "Editco Admin",
          email: process.env.SEED_ADMIN_EMAIL.toLowerCase(),
          role: "SUPER_ADMIN" as const,
        },
      ]
    : TEAM_ADMINS;

  for (const account of teamToSeed) {
    const email = account.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: account.name,
        email,
        passwordHash,
        role: account.role,
        status: "active",
      });
      admins.push({ name: account.name, email, created: true, updated: false });
    } else {
      existing.name = account.name;
      existing.passwordHash = passwordHash;
      existing.role = account.role;
      existing.status = "active";
      await existing.save();
      admins.push({ name: account.name, email, created: false, updated: true });
    }
  }

  // Retire the old default admin so it no longer appears as a reporting manager.
  if (!process.env.SEED_ADMIN_EMAIL) {
    await User.updateOne(
      { email: LEGACY_ADMIN_EMAIL },
      { $set: { status: "disabled" } },
    );
  }

  const createdAdmin = admins.some((a) => a.created);
  const adminEmail = admins[0]?.email ?? LEGACY_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || TEAM_ADMIN_PASSWORD;

  // ---- Departments & roles ------------------------------------------------
  const roleIdBySlug = new Map<string, OID>();
  for (const dept of DEPARTMENTS) {
    const d = await Department.findOneAndUpdate(
      { slug: dept.slug },
      { $setOnInsert: { name: dept.name, slug: dept.slug, description: dept.description, status: "active" } },
      { upsert: true, new: true },
    );
    for (const role of dept.roles) {
      const r = await Role.findOneAndUpdate(
        { department: d._id, slug: role.slug },
        { $setOnInsert: { title: role.title, slug: role.slug, department: d._id, description: role.description || "", status: "active" } },
        { upsert: true, new: true },
      );
      roleIdBySlug.set(role.slug, r._id);
    }
  }

  // ---- Content ------------------------------------------------------------
  const coreContentIds = await upsertContent(CORE_CONTENT);
  const salesContentIds = await upsertContent(SALES_CONTENT);

  // ---- Policies -----------------------------------------------------------
  const policyIds = new Map<string, OID>();
  for (const p of POLICIES) {
    let policy = await Policy.findOne({ key: p.key });
    if (!policy) {
      policy = await Policy.create({
        title: p.title,
        key: p.key,
        category: p.category,
        description: p.description,
        status: "draft",
        versionCounter: 0,
      });
    }
    let version = await PolicyVersion.findOne({ policy: policy._id, versionNumber: 1 });
    if (!version) {
      version = await PolicyVersion.create({
        policy: policy._id,
        version: "1.0",
        versionNumber: 1,
        title: p.title,
        body: p.body,
        effectiveDate: new Date(),
        status: "published",
        publishedAt: new Date(),
      });
      policy.versionCounter = 1;
    }
    policy.latestPublished = version._id;
    policy.status = "published";
    await policy.save();
    policyIds.set(p.key, policy._id);
  }

  // ---- Documents ----------------------------------------------------------
  const docIds = new Map<string, OID>();
  for (const doc of DOCUMENTS) {
    const d = await DocumentTemplate.findOneAndUpdate(
      { key: doc.key },
      {
        $setOnInsert: {
          name: doc.name,
          key: doc.key,
          description: doc.description,
          required: doc.required,
          category: doc.category,
          allowedTypes: doc.allowedTypes,
          maxSizeMB: 10,
          status: "active",
        },
      },
      { upsert: true, new: true },
    );
    docIds.set(doc.key, d._id);
  }

  // ---- Training -----------------------------------------------------------
  const trainingIds = new Map<string, OID>();
  for (const t of TRAINING) {
    const tm = await TrainingModule.findOneAndUpdate(
      { key: t.key },
      {
        $setOnInsert: {
          title: t.title,
          key: t.key,
          description: t.description,
          category: t.category,
          contentType: t.contentType,
          body: t.body,
          resourceUrl: t.resourceUrl || "",
          checklist: (t.checklist || []).map((label) => ({ label })),
          estimatedMinutes: t.estimatedMinutes,
          status: "active",
        },
      },
      { upsert: true, new: true },
    );
    trainingIds.set(t.key, tm._id);
  }

  // ---- Assessments --------------------------------------------------------
  const assessmentIds = new Map<string, OID>();
  for (const a of ASSESSMENTS) {
    const as = await Assessment.findOneAndUpdate(
      { key: a.key },
      {
        $setOnInsert: {
          title: a.title,
          key: a.key,
          description: a.description,
          category: a.category,
          passingScore: a.passingScore,
          maxAttempts: a.maxAttempts,
          questions: a.questions,
          status: "active",
        },
      },
      { upsert: true, new: true },
    );
    assessmentIds.set(a.key, as._id);
  }

  // ---- CORE onboarding template ------------------------------------------
  const coreItems: ITemplateItem[] = [];
  let order = 0;
  for (const c of CORE_CONTENT) {
    coreItems.push({ kind: "content", ref: coreContentIds.get(c.key)!, section: "CORE", required: true, order: order++ });
  }
  for (const doc of DOCUMENTS) {
    coreItems.push({ kind: "document", ref: docIds.get(doc.key)!, section: "DOCUMENTS", required: doc.required, order: order++ });
  }
  for (const p of POLICIES) {
    coreItems.push({ kind: "policy", ref: policyIds.get(p.key)!, section: "POLICIES", required: true, order: order++ });
  }
  for (const key of ["training-editco-101", "training-communication", "training-confidentiality"]) {
    coreItems.push({ kind: "training", ref: trainingIds.get(key)!, section: "TRAINING", required: true, order: order++ });
  }
  coreItems.push({
    kind: "assessment",
    ref: assessmentIds.get("assessment-editco-fundamentals")!,
    section: "ASSESSMENT",
    required: true,
    order: order++,
  });
  await upsertTemplate({ scope: "CORE", name: "Editco Core Onboarding", items: coreItems });

  // ---- Sales ROLE onboarding template ------------------------------------
  const salesItems: ITemplateItem[] = [];
  let sOrder = 0;
  for (const c of SALES_CONTENT) {
    salesItems.push({ kind: "content", ref: salesContentIds.get(c.key)!, section: "ROLE", required: true, order: sOrder++ });
  }
  salesItems.push({ kind: "training", ref: trainingIds.get("training-sales-fundamentals")!, section: "TRAINING", required: true, order: sOrder++ });
  salesItems.push({
    kind: "assessment",
    ref: assessmentIds.get("assessment-sales-fundamentals")!,
    section: "ASSESSMENT",
    required: true,
    order: sOrder++,
  });

  const salesDept = await Department.findOne({ slug: "sales-business-development" });
  for (const slug of SALES_TRACK_ROLE_SLUGS) {
    const roleId = roleIdBySlug.get(slug);
    if (!roleId || !salesDept) continue;
    await upsertTemplate({
      scope: "ROLE",
      name: `Sales Track — ${slug}`,
      items: salesItems,
      department: salesDept._id,
      role: roleId,
    });
  }

  const counts = {
    departments: await Department.countDocuments(),
    roles: await Role.countDocuments(),
    content: await Content.countDocuments(),
    policies: await Policy.countDocuments(),
    documents: await DocumentTemplate.countDocuments(),
    training: await TrainingModule.countDocuments(),
    assessments: await Assessment.countDocuments(),
    templates: await OnboardingTemplate.countDocuments(),
  };

  return {
    createdAdmin,
    adminEmail,
    adminPassword,
    admins,
    counts,
  };
}

async function upsertTemplate(input: {
  scope: "CORE" | "ROLE" | "DEPARTMENT";
  name: string;
  items: ITemplateItem[];
  department?: OID;
  role?: OID;
}) {
  const query =
    input.scope === "CORE"
      ? { scope: "CORE" as const }
      : { scope: input.scope, department: input.department, role: input.role ?? null };

  let tmpl = await OnboardingTemplate.findOne(query);
  if (!tmpl) {
    tmpl = await OnboardingTemplate.create({
      name: input.name,
      scope: input.scope,
      department: input.department ?? null,
      role: input.role ?? null,
      items: input.items,
      reviews: [30, 60, 90],
      version: 1,
      status: "published",
      publishedAt: new Date(),
    });
    await OnboardingTemplateVersion.create({
      template: tmpl._id,
      version: 1,
      items: input.items,
      reviews: [30, 60, 90],
      publishedAt: new Date(),
    });
  }
  return tmpl;
}
