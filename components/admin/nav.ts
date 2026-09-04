import {
  LayoutDashboard,
  Users,
  Workflow,
  Library,
  Building2,
  BriefcaseBusiness,
  FileText,
  ShieldCheck,
  GraduationCap,
  ClipboardCheck,
  CalendarCheck,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  capability?: string; // undefined = everyone with admin access
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Employees", href: "/employees", icon: Users, capability: "employees" },
      { label: "Onboarding", href: "/onboarding", icon: Workflow, capability: "onboarding" },
      { label: "Analytics", href: "/analytics", icon: BarChart3, capability: "analytics" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Content Library", href: "/content", icon: Library, capability: "content" },
      { label: "Documents", href: "/documents", icon: FileText, capability: "documents" },
      { label: "Policies", href: "/policies", icon: ShieldCheck, capability: "policies" },
      { label: "Training", href: "/training", icon: GraduationCap, capability: "training" },
      { label: "Assessments", href: "/assessments", icon: ClipboardCheck, capability: "assessments" },
    ],
  },
  {
    label: "Organization",
    items: [
      { label: "Departments", href: "/departments", icon: Building2, capability: "departments" },
      { label: "Roles", href: "/roles", icon: BriefcaseBusiness, capability: "roles" },
      { label: "Reviews", href: "/reviews", icon: CalendarCheck, capability: "reviews" },
      { label: "Settings", href: "/settings", icon: Settings, capability: "settings" },
    ],
  },
];
