import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

/**
 * Employee portal session — separate from the admin session. Scoped to one
 * employee + onboarding instance. Combined with the secret link token, this
 * means documents are protected by an admin-set password, not just the URL.
 */

const COOKIE_NAME = "editco_portal";
const MAX_AGE = 60 * 60 * 12; // 12 hours
const AUDIENCE = "editco-employee";

export interface EmployeeSession {
  eid: string; // employee id
  iid: string; // instance id
  name: string;
}

function key(): Uint8Array {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function createEmployeeSession(payload: EmployeeSession): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { audience: AUDIENCE });
    return { eid: String(payload.eid), iid: String(payload.iid), name: String(payload.name) };
  } catch {
    return null;
  }
}

export async function destroyEmployeeSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** True only when the current portal session matches this employee + instance. */
export async function employeeAuthedFor(eid: string, iid: string): Promise<boolean> {
  const session = await getEmployeeSession();
  return !!session && session.eid === eid && session.iid === iid;
}
