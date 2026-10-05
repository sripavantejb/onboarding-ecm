import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

/**
 * Employee portal session — separate from the admin session. Scoped to one
 * employee + onboarding instance. Combined with the secret link token, this
 * means documents are protected by an admin-set password, not just the URL.
 *
 * `pwdAt` is the portalPasswordSetAt timestamp at login time. When an admin
 * resets the password, portalPasswordSetAt advances and older sessions fail
 * `employeeAuthedFor` until the employee signs in again.
 */

const COOKIE_NAME = "editco_portal";
const MAX_AGE = 60 * 60 * 12; // 12 hours
const AUDIENCE = "editco-employee";

export interface EmployeeSession {
  eid: string; // employee id
  iid: string; // instance id
  name: string;
  /** ms timestamp of portalPasswordSetAt when the session was issued */
  pwdAt: number;
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
    return {
      eid: String(payload.eid),
      iid: String(payload.iid),
      name: String(payload.name),
      pwdAt: typeof payload.pwdAt === "number" ? payload.pwdAt : 0,
    };
  } catch {
    return null;
  }
}

export async function destroyEmployeeSession(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COOKIE_NAME, path: "/" });
}

/**
 * True only when the current portal session matches this employee + instance
 * and was issued at/after the latest password set time (so resets invalidate).
 */
export async function employeeAuthedFor(
  eid: string,
  iid: string,
  passwordSetAt?: Date | null,
): Promise<boolean> {
  const session = await getEmployeeSession();
  if (!session || session.eid !== eid || session.iid !== iid) return false;
  if (passwordSetAt) {
    const current = new Date(passwordSetAt).getTime();
    if (current > 0 && session.pwdAt < current) return false;
  }
  return true;
}
