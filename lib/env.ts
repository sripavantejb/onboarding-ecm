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

  // --- Email (SMTP) — optional. When unset, emails are skipped (logged) instead
  // of throwing, so the app keeps working in local/dev without mail configured. ---
  get SMTP_HOST() {
    return process.env.SMTP_HOST || "smtp.gmail.com";
  },
  get SMTP_PORT() {
    return Number(process.env.SMTP_PORT || 465);
  },
  get SMTP_USER() {
    return process.env.SMTP_USER || "";
  },
  get SMTP_PASS() {
    // Gmail app passwords are shown with spaces; strip them so either form works.
    return (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  },
  get SMTP_FROM() {
    // Friendly From header; defaults to the authenticated user.
    return process.env.SMTP_FROM || (process.env.SMTP_USER ? `Editco <${process.env.SMTP_USER}>` : "");
  },
  get isEmailConfigured() {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  },
};
