import "server-only";
import { env } from "@/lib/env";

/** Build the public onboarding URL for a raw token. */
export function onboardingUrl(rawToken: string): string {
  return `${env.APP_URL.replace(/\/$/, "")}/onboard/${rawToken}`;
}

export const DEFAULT_TOKEN_TTL_DAYS = 14;

export function defaultExpiry(days = DEFAULT_TOKEN_TTL_DAYS): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
