import "server-only";
import mongoose from "mongoose";
import {
  OnboardingTemplate,
  Content,
  ContentVersion,
  Policy,
  PolicyVersion,
  DocumentTemplate,
  TrainingModule,
  Assessment,
  OnboardingInstance,
  OnboardingStep,
} from "@/models";
import type { ITemplateItem } from "@/models/OnboardingTemplate";
import type { IEmployee } from "@/models/Employee";
import type { StepSection } from "@/types";

const SECTION_ORDER: StepSection[] = [
  "PREBOARDING",
  "CORE",
  "ROLE",
  "DOCUMENTS",
  "POLICIES",
  "TRAINING",
  "ASSESSMENT",
  "FINAL",
];

export const FINAL_CHECKLIST_ITEMS = [
  "I understand my role.",
  "I know my reporting manager.",
  "I understand Editco's working process.",
  "I understand the relevant policies.",
  "I have completed required training.",
  "I have submitted required documents.",
  "I understand confidentiality requirements.",
  "I know how to ask for help.",
  "I understand my first 30-day expectations.",
];

export interface ResolvedTemplates {
  coreTemplate: mongoose.HydratedDocument<import("@/models/OnboardingTemplate").IOnboardingTemplate> | null;
  roleTemplate: mongoose.HydratedDocument<import("@/models/OnboardingTemplate").IOnboardingTemplate> | null;
  items: ITemplateItem[];
  reviews: number[];
}

/**
 * Resolve which template items apply to a department + role.
 * = CORE template items  +  role-specific template items (if one exists).
 */
export async function resolveTemplates(
  departmentId: string,
  roleId: string,
): Promise<ResolvedTemplates> {
  const [coreTemplate, roleTemplate] = await Promise.all([
    OnboardingTemplate.findOne({ scope: "CORE", status: "published" }),
    OnboardingTemplate.findOne({
      scope: "ROLE",
      status: "published",
      department: departmentId,
      role: roleId,
    }),
  ]);

  const items = [...(coreTemplate?.items ?? []), ...(roleTemplate?.items ?? [])];
  const reviews = roleTemplate?.reviews ?? coreTemplate?.reviews ?? [30, 60, 90];
  return { coreTemplate, roleTemplate, items, reviews };
}

interface PreviewSectionItem {
  kind: string;
  title: string;
  required: boolean;
}
export interface OnboardingPreview {
  sections: { section: StepSection; label: string; items: PreviewSectionItem[] }[];
  counts: {
    core: number;
    role: number;
    documents: number;
    policies: number;
    training: number;
    assessments: number;
  };
  reviews: number[];
  hasRoleTemplate: boolean;
}

const TITLE_LOOKUP = {
  content: (id: mongoose.Types.ObjectId) => Content.findById(id).select("title").lean(),
  policy: (id: mongoose.Types.ObjectId) => Policy.findById(id).select("title").lean(),
  document: (id: mongoose.Types.ObjectId) => DocumentTemplate.findById(id).select("name").lean(),
  training: (id: mongoose.Types.ObjectId) => TrainingModule.findById(id).select("title").lean(),
  assessment: (id: mongoose.Types.ObjectId) => Assessment.findById(id).select("title").lean(),
};

/** Build a human preview of what an employee would receive — no writes. */
export async function buildPreview(
  departmentId: string,
  roleId: string,
): Promise<OnboardingPreview> {
  const { items, reviews, roleTemplate } = await resolveTemplates(departmentId, roleId);

  const bySection = new Map<StepSection, PreviewSectionItem[]>();
  const counts = { core: 0, role: 0, documents: 0, policies: 0, training: 0, assessments: 0 };

  for (const item of items) {
    let title = "Untitled";
    try {
      const doc = await TITLE_LOOKUP[item.kind]?.(item.ref as mongoose.Types.ObjectId);
      title = (doc as { title?: string; name?: string })?.title ?? (doc as { name?: string })?.name ?? title;
    } catch {
      /* ignore */
    }
    const section = item.section as StepSection;
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push({ kind: item.kind, title, required: item.required });

    if (item.section === "CORE") counts.core++;
    else if (item.section === "ROLE") counts.role++;
    else if (item.section === "DOCUMENTS") counts.documents++;
    else if (item.section === "POLICIES") counts.policies++;
    else if (item.section === "TRAINING") counts.training++;
    else if (item.section === "ASSESSMENT") counts.assessments++;
  }

  const { SECTION_LABELS } = await import("@/types");
  const sections = SECTION_ORDER.filter((s) => bySection.has(s)).map((s) => ({
    section: s,
    label: SECTION_LABELS[s],
    items: bySection.get(s)!,
  }));

  return { sections, counts, reviews, hasRoleTemplate: !!roleTemplate };
}

function orderFor(section: StepSection, itemOrder: number): number {
  const sIdx = SECTION_ORDER.indexOf(section);
  return sIdx * 1000 + itemOrder;
}

interface BuiltStep {
  section: StepSection;
  kind: string;
  title: string;
  required: boolean;
  order: number;
  refKind: string;
  refId: mongoose.Types.ObjectId | null;
  snapshot: Record<string, unknown>;
  version: string;
}

/** Resolve a single template item into a frozen step snapshot. */
async function buildStepFromItem(item: ITemplateItem): Promise<BuiltStep | null> {
  const base = {
    section: item.section as StepSection,
    required: item.required,
    order: orderFor(item.section as StepSection, item.order),
    refKind: item.kind,
    refId: item.ref as mongoose.Types.ObjectId,
  };

  switch (item.kind) {
    case "content": {
      const content = await Content.findById(item.ref).lean();
      if (!content) return null;
      const version = content.latestPublished
        ? await ContentVersion.findById(content.latestPublished).lean()
        : null;
      return {
        ...base,
        kind: "content",
        title: content.title,
        version: version?.version ?? "1.0",
        snapshot: {
          contentKey: content.key,
          versionId: String(version?._id ?? ""),
          version: version?.version ?? "1.0",
          title: version?.title ?? content.title,
          body: version?.body ?? "",
        },
      };
    }
    case "policy": {
      const policy = await Policy.findById(item.ref).lean();
      if (!policy) return null;
      const version = policy.latestPublished
        ? await PolicyVersion.findById(policy.latestPublished).lean()
        : null;
      return {
        ...base,
        kind: "policy",
        title: policy.title,
        version: version?.version ?? "1.0",
        snapshot: {
          policyKey: policy.key,
          versionId: String(version?._id ?? ""),
          version: version?.version ?? "1.0",
          title: version?.title ?? policy.title,
          body: version?.body ?? "",
          effectiveDate: version?.effectiveDate ?? null,
        },
      };
    }
    case "document": {
      const doc = await DocumentTemplate.findById(item.ref).lean();
      if (!doc) return null;
      return {
        ...base,
        kind: "document",
        title: doc.name,
        version: "",
        snapshot: {
          key: doc.key,
          name: doc.name,
          description: doc.description,
          required: doc.required,
          allowedTypes: doc.allowedTypes,
          maxSizeMB: doc.maxSizeMB,
        },
      };
    }
    case "training": {
      const t = await TrainingModule.findById(item.ref).lean();
      if (!t) return null;
      return {
        ...base,
        kind: "training",
        title: t.title,
        version: "",
        snapshot: {
          key: t.key,
          title: t.title,
          description: t.description,
          contentType: t.contentType,
          body: t.body,
          resourceUrl: t.resourceUrl,
          checklist: t.checklist,
          estimatedMinutes: t.estimatedMinutes,
        },
      };
    }
    case "assessment": {
      const a = await Assessment.findById(item.ref).lean();
      if (!a) return null;
      return {
        ...base,
        kind: "assessment",
        title: a.title,
        version: "",
        snapshot: {
          key: a.key,
          title: a.title,
          description: a.description,
          passingScore: a.passingScore,
          maxAttempts: a.maxAttempts,
          // Freeze the full question set (including answers) at assignment time.
          questions: a.questions,
        },
      };
    }
    default:
      return null;
  }
}

/**
 * Create the OnboardingInstance + all OnboardingStep documents for an employee,
 * snapshotting the currently-published content versions.
 */
export async function generateInstanceForEmployee(
  employee: mongoose.HydratedDocument<IEmployee>,
  departmentName: string,
  roleName: string,
): Promise<mongoose.HydratedDocument<import("@/models/OnboardingInstance").IOnboardingInstance>> {
  const { coreTemplate, roleTemplate, items, reviews } = await resolveTemplates(
    employee.department.toString(),
    employee.role.toString(),
  );

  const templates: { templateId: mongoose.Types.ObjectId; scope: string; version: number }[] = [];
  if (coreTemplate) templates.push({ templateId: coreTemplate._id, scope: "CORE", version: coreTemplate.version });
  if (roleTemplate) templates.push({ templateId: roleTemplate._id, scope: "ROLE", version: roleTemplate.version });

  const instance = await OnboardingInstance.create({
    employee: employee._id,
    department: employee.department,
    role: employee.role,
    employeeName: employee.fullName,
    departmentName,
    roleName,
    templates,
    status: "not_started",
    progress: 0,
    reviews,
    finalChecklist: FINAL_CHECKLIST_ITEMS.map((label) => ({ label, checked: false })),
  });

  // Build steps from template items.
  const built: BuiltStep[] = [];
  for (const item of items) {
    const step = await buildStepFromItem(item);
    if (step) built.push(step);
  }

  // Always-present generated steps.
  const infoFormStep: BuiltStep = {
    section: "DOCUMENTS",
    kind: "info_form",
    title: "Employee Information",
    required: true,
    order: orderFor("DOCUMENTS", -1), // before uploads
    refKind: "info_form",
    refId: null,
    version: "",
    snapshot: {},
  };
  const finalStep: BuiltStep = {
    section: "FINAL",
    kind: "checklist",
    title: "Employee Declaration",
    required: true,
    order: orderFor("FINAL", 99),
    refKind: "checklist",
    refId: null,
    version: "",
    snapshot: { items: FINAL_CHECKLIST_ITEMS },
  };

  const allSteps = [infoFormStep, ...built, finalStep].sort((a, b) => a.order - b.order);

  await OnboardingStep.insertMany(
    allSteps.map((s) => ({
      instance: instance._id,
      employee: employee._id,
      section: s.section,
      kind: s.kind,
      title: s.title,
      required: s.required,
      order: s.order,
      status: "not_started",
      refKind: s.refKind,
      refId: s.refId,
      snapshot: s.snapshot,
      version: s.version,
    })),
  );

  return instance;
}
