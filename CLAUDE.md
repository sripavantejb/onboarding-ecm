# Editco Employee Onboarding — working notes

Internal onboarding SaaS. Next.js 16 (App Router) · TS strict · Tailwind v4 · Mongoose · Zod · custom JWT auth.

## Conventions (follow these when extending)
- **Server actions** live in `actions/`, start with `"use server"`, wrap bodies in `guard()` (lib/action-result),
  authorize with `requireCapability(<cap>)` / `requireRole(...)` (lib/authz), validate with Zod (v4 — read errors via
  `err.issues[0]?.message`), and return `ok(data, msg)` / `fail(msg)`. Call `revalidatePath()` after writes.
- **Pages** are Server Components: `export const dynamic = "force-dynamic"`, fetch with `.lean()`, serialize with
  `plain()` (lib/utils), and hand off to a client component in `components/admin|portal/`. `params` is a Promise in Next 16.
- **Client components** use `useRouter`/`useTransition`, `toast` from `sonner`, and the shadcn-style primitives in
  `components/ui/`. On success: `toast.success(res.message); router.refresh()`.
- **DB**: always `await dbConnect()` (cached). Import models from `@/models/<File>` (barrel `@/models` works in app code,
  but NOT in `node -e` eval — use per-file imports in throwaway scripts).
- **server-only** modules (lib/onboarding, lib/portal, lib/instance-state, lib/auth…) can't be imported by plain `tsx`
  scripts unless you pass `--conditions=react-server` (see the `test:flow` npm script).

## Core invariants (do not break)
- Onboarding **instances snapshot** published content at creation → editing masters never mutates existing instances;
  new employees get the latest **published** version. Logic in `lib/onboarding.ts`.
- Progress is **derived** from required steps in `lib/progress.ts` / `lib/instance-state.ts` — never stored arbitrarily.
- Onboarding tokens: only the **SHA-256 hash** is stored (`lib/tokens.ts`), validated server-side in `lib/portal.ts`.

## Commands
- `npm run seed` — idempotent seed (+ team admins `deepikamundla54@gmail.com` / `harshapolina1@gmail.com` / `sripavantejb@gmail.com`, password `abc@123`).
- `npm run test:flow` — 26-check engine integration test (creates then you can remove TEST- employees via
  `scripts/cleanup-test.ts`).
- `npm run build` / `npm run dev`.
