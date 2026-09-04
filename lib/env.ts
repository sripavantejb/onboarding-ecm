/**
 * Centralized environment access. Never hardcode secrets — everything comes
 * from process.env. Throws early with a clear message if a required var is
 * missing at runtime (server only).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get MONGODB_URI() {
    return required("MONGODB_URI");
  },
  get AUTH_SECRET() {
    // Reuse NEXTAUTH_SECRET name for familiarity.
    return required("NEXTAUTH_SECRET");
  },
  get APP_URL() {
    // Prefer an explicit URL; otherwise fall back to Vercel's provided domain.
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercel) return `https://${vercel}`;
    return "http://localhost:3000";
  },
};
