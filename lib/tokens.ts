import crypto from "crypto";

/**
 * Secure onboarding link tokens.
 *
 * - The raw token is generated from crypto.randomBytes → unpredictable.
 * - Only the SHA-256 HASH is ever stored in the database (indexed), so a DB
 *   leak does not expose working links.
 * - The raw token is shown to the admin exactly once and embedded in the URL.
 * - Validation hashes the incoming token and looks up the hash.
 */

const TOKEN_BYTES = 32; // 256 bits of entropy

export function generateOnboardingToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Short opaque id for non-sensitive public references (e.g. activity ids). */
export function shortId(bytes = 8): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** A readable, reasonably strong random password (no ambiguous characters). */
export function generatePassword(length = 10): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  // Guarantee at least one digit for policy friendliness.
  return out.slice(0, -1) + String(crypto.randomBytes(1)[0] % 10);
}

/** Constant-time comparison helper. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
