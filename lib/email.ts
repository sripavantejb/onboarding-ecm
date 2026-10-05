import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

/**
 * Email transport. A single lazily-created SMTP transporter is reused across
 * requests. If SMTP is not configured, sends are skipped (and logged) rather
 * than throwing — no call site should ever break because mail isn't set up.
 *
 * Configure via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 */

let cached: Transporter | null = null;

function transporter(): Transporter | null {
  if (!env.isEmailConfigured) return null;
  if (cached) return cached;
  cached = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return cached;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Send an email. Returns true if handed off to SMTP, false if skipped/failed. */
export async function sendMail(input: SendMailInput): Promise<boolean> {
  const t = transporter();
  if (!t) {
    console.warn(`[email] SMTP not configured — skipped "${input.subject}" → ${input.to}`);
    return false;
  }
  try {
    await t.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text ?? htmlToText(input.html),
      html: input.html,
    });
    return true;
  } catch (err) {
    // Never let a mail failure break the primary operation.
    console.error(`[email] failed to send "${input.subject}" → ${input.to}`, err);
    return false;
  }
}

/* --------------------------- Branded HTML template ------------------------- */

const BRAND = "#4f46e5";

export interface EmailTemplate {
  heading: string;
  /** Short intro paragraph under the heading. */
  intro?: string;
  /** Optional extra HTML block (e.g. a credentials box), inserted before the CTA. */
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Small muted note under the CTA. */
  footerNote?: string;
}

/** Escape a plain string for safe interpolation into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Attribute-safe URL for href — only http(s) schemes are allowed. */
function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return escapeHtml(parsed.toString());
  } catch {
    return null;
  }
}

/** Render a simple, email-client-friendly branded HTML document. */
export function renderEmail(t: EmailTemplate): string {
  const intro = t.intro
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(t.intro)}</p>`
    : "";
  const body = t.bodyHtml ?? "";
  const href = t.ctaUrl ? safeHref(t.ctaUrl) : null;
  const cta =
    t.ctaLabel && href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 16px;">
           <tr><td style="border-radius:8px;background:${BRAND};">
             <a href="${href}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(t.ctaLabel)}</a>
           </td></tr>
         </table>`
      : "";
  const footer = t.footerNote
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">${escapeHtml(t.footerNote)}</p>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f9;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:${BRAND};padding:20px 28px;">
            <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Editco</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(t.heading)}</h1>
            ${intro}
            ${body}
            ${cta}
            ${footer}
          </td></tr>
          <tr><td style="padding:16px 28px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Editco Media · Employee Onboarding. This is an automated message — please don't reply.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** A styled key/value box, handy for credentials. Values are escaped. */
export function infoBox(rows: { label: string; value: string; mono?: boolean }[]): string {
  const cells = rows
    .map(
      (r) => `<tr>
        <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;font-size:14px;color:#0f172a;${r.mono ? "font-family:ui-monospace,Menlo,Consolas,monospace;" : ""}">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 16px;margin:0 0 16px;">${cells}</table>`;
}

/** Crude HTML→text fallback for the plaintext part of the email. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
