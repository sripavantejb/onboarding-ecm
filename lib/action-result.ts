import { AuthError, ForbiddenError } from "@/lib/authz";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Wrap a server action body so auth/validation errors become clean results
 * instead of crashing. Unknown errors are logged and returned generically.
 */
export async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return fail("Please sign in to continue.");
    if (err instanceof ForbiddenError) return fail(err.message);
    console.error("Server action error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
    return fail(message);
  }
}
