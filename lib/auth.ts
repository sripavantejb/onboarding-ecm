import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import type { UserRole } from "@/types";

const COOKIE_NAME = "editco_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export interface SessionPayload {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      uid: String(payload.uid),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

/**
 * JWT session that is still backed by an active User row. Prefer this over
 * getSession() for layout/auth gates so disabled accounts lose access immediately.
 * On a transient DB failure, falls back to the JWT so a blip does not log everyone out.
 */
export async function getActiveSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    await dbConnect();
    const dbUser = await User.findById(session.uid).select("status role name email").lean();
    if (!dbUser || dbUser.status !== "active") return null;
    return {
      uid: session.uid,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as UserRole,
    };
  } catch (err) {
    console.error("getActiveSession: status check failed, falling back to JWT:", err);
    return session;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete({ name: COOKIE_NAME, path: "/" });
}
