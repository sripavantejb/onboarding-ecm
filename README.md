# Editco Employee Onboarding

A production-quality internal SaaS platform for onboarding new team members at Editco Media.
Admins create an employee, pick a department and role, and the system automatically generates a
complete, **versioned** onboarding journey — content, documents, policies, training, an assessment
and 30/60/90-day reviews — behind a **secure, revocable link**. Employees complete everything from a
clean, task-focused portal; admins watch progress in real time.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) · **TypeScript** (strict)
- **Tailwind CSS v4** + hand-built **shadcn/ui**-style components · **Lucide** icons
- **MongoDB** + **Mongoose** · **GridFS** for document storage
- **Zod** validation · **React Hook Form** · **Recharts** · custom JWT auth (`jose` + `bcryptjs`)

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
#   then fill in:
#     MONGODB_URI       – your MongoDB connection string (include a database name)
#     NEXTAUTH_SECRET   – node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#     NEXTAUTH_URL      – http://localhost:3000 in dev

# 3. Seed the database (departments, roles, content, policies, training, assessments, templates + admin)
npm run seed

# 4. Run
npm run dev
```

The seed prints the default admin account it creates:

```
Email:    admin@editcomedia.com
Password: Editco@2025        # change after first login (Settings)
```

> Override the defaults by setting `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` before seeding.
> The seed is **idempotent** — re-running it will not duplicate or overwrite existing content.

## Scripts

| Command             | Description                                              |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                    |
| `npm run build`     | Production build                                         |
| `npm run seed`      | Seed departments, roles, content, templates + admin     |
| `npm run test:flow` | End-to-end integration test of the onboarding engine    |

## How it works

### Templates → Instance snapshots (the core idea)
- Master content lives in the **Content Library** and is **versioned** (draft → published).
- `OnboardingTemplate`s map **department + role → items** (content / documents / policies / training / assessment) plus the review schedule. A **CORE** template applies to everyone; **ROLE** templates add the role-specific track.
- When an employee is created, the system resolves the applicable templates and **freezes a snapshot** of the currently-published content into `OnboardingStep` documents.
- **Editing a master never changes existing onboarding** (they hold their own snapshot). **New employees always get the latest published version.**

### Secure onboarding links
- A token is generated with `crypto.randomBytes` (256-bit). Only its **SHA-256 hash** is stored and indexed — a database leak never exposes working links.
- Tokens are validated entirely server-side, have an **expiry**, and can be **revoked** or **regenerated**. Predictable MongoDB IDs are never exposed in the URL.
- UTM parameters (if present) are analytics-only and grant no access.

### Progress
- Progress is **derived** from completed required steps — never a stored magic number — and the dashboard status bucket (Not Started / In Progress / Action Required / Awaiting Review / Completed) is computed from step states.

### Authorization
- Roles: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER` (admin app) and token-scoped employees (portal).
- Every sensitive server action re-checks the capability server-side (`requireCapability`) — never relying on the UI.

## Project structure

```
app/
  (admin)/            # authenticated admin app (dashboard, employees, content, …)
  onboard/[token]/    # employee portal (token-gated)
  api/                # GridFS upload + authenticated file streaming
actions/              # server actions (validated, authorized)
components/           # ui/ primitives + admin/ + portal/ feature components
lib/                  # db, auth, tokens, onboarding engine, progress, gridfs, seed
models/               # Mongoose models
scripts/              # seed / test / maintenance
types/                # shared enums & unions
```

## Security notes
- `.env*` is gitignored — secrets are never committed. The MongoDB URI and auth secret come only from the environment.
- Uploaded documents are stored in GridFS and served only through an **authenticated** route; raw URLs are never public.
- Admin-authored rich text is sanitized (`sanitize-html`) before storage.
