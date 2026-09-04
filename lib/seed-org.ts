export interface SeedDept {
  name: string;
  slug: string;
  description: string;
  roles: { title: string; slug: string; description?: string }[];
}

export const DEPARTMENTS: SeedDept[] = [
  {
    name: "Sales & Business Development",
    slug: "sales-business-development",
    description: "Finding, understanding and winning the right customers for Editco.",
    roles: [
      { title: "Sales Executive", slug: "sales-executive", description: "Drives the Editco sales flow end to end." },
      { title: "Business Development Executive", slug: "business-development-executive", description: "Builds pipeline and new business opportunities." },
      { title: "Sales Manager", slug: "sales-manager", description: "Leads and coaches the sales team." },
      { title: "Business Development Intern", slug: "business-development-intern", description: "Learns the sales fundamentals hands-on." },
    ],
  },
  {
    name: "Creative",
    slug: "creative",
    description: "Creative direction across brands and campaigns.",
    roles: [{ title: "Creative Associate", slug: "creative-associate" }],
  },
  {
    name: "Design",
    slug: "design",
    description: "Brand and product design.",
    roles: [{ title: "Graphic Designer", slug: "graphic-designer" }],
  },
  {
    name: "Video",
    slug: "video",
    description: "Video production and editing.",
    roles: [{ title: "Video Editor", slug: "video-editor" }],
  },
  {
    name: "Marketing",
    slug: "marketing",
    description: "Campaigns, content and growth.",
    roles: [{ title: "Marketing Executive", slug: "marketing-executive" }],
  },
  {
    name: "Operations",
    slug: "operations",
    description: "Delivery, coordination and client handover.",
    roles: [{ title: "Operations Executive", slug: "operations-executive" }],
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Engineering and internal systems.",
    roles: [{ title: "Technology / Developer", slug: "technology-developer" }],
  },
  {
    name: "HR",
    slug: "hr",
    description: "People, culture and onboarding.",
    roles: [{ title: "HR Executive", slug: "hr-executive" }],
  },
  {
    name: "Interns",
    slug: "interns",
    description: "Early-career team members across functions.",
    roles: [{ title: "Intern", slug: "intern" }],
  },
];

// Roles that receive the dedicated Sales onboarding track.
export const SALES_TRACK_ROLE_SLUGS = [
  "sales-executive",
  "business-development-executive",
  "sales-manager",
  "business-development-intern",
];
