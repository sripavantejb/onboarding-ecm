import type { UserRole } from "@/types";

// Capability matrix — safe to import in Client Components (no server-only deps).
export const CAPABILITIES: Record<UserRole, Set<string>> = {
  SUPER_ADMIN: new Set([
    "employees",
    "onboarding",
    "content",
    "departments",
    "roles",
    "documents",
    "policies",
    "training",
    "assessments",
    "reviews",
    "analytics",
    "settings",
    "users",
  ]),
  HR_ADMIN: new Set([
    "employees",
    "onboarding",
    "content",
    "departments",
    "roles",
    "documents",
    "policies",
    "training",
    "assessments",
    "reviews",
    "analytics",
  ]),
  MANAGER: new Set(["employees", "onboarding", "reviews"]),
};

export function can(role: UserRole, capability: string): boolean {
  return CAPABILITIES[role]?.has(capability) ?? false;
}
