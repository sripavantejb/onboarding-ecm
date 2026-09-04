import "server-only";
import { getSession, type SessionPayload } from "@/lib/auth";
import { CAPABILITIES, can } from "@/lib/authz-client";
import type { UserRole } from "@/types";

export { CAPABILITIES, can };

export class AuthError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "AuthError";
  }
}
export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  return getSession();
}

/** Throws AuthError if not logged in. */
export async function requireUser(): Promise<SessionPayload> {
  const user = await getSession();
  if (!user) throw new AuthError();
  return user;
}

/** Throws unless the current user has one of the allowed roles. */
export async function requireRole(...roles: UserRole[]): Promise<SessionPayload> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

/** Throws ForbiddenError unless the user's role has the capability. */
export async function requireCapability(capability: string): Promise<SessionPayload> {
  const user = await requireUser();
  if (!can(user.role, capability)) throw new ForbiddenError();
  return user;
}
