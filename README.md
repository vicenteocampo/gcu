# GCU (Gente Como Uno)

A selective, no-bullshit dating app. Users sign up, answer a short
questionnaire, and get one curated match per week. No swiping, no browsing,
no public profiles.

See [docs/gcu-initial-prompt.md](docs/gcu-initial-prompt.md) for the full spec.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Storage), accessed via `@supabase/ssr`
- Resend for transactional email
- Deployment target: Vercel

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**, then copy `.env.local.example` to
   `.env.local` and fill in real values (never commit `.env.local`):

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` — from the Supabase
     project settings
   - `RESEND_API_KEY` — from Resend
   - `ADMIN_EMAILS` — comma-separated allow-list for `/admin`
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally

3. **Link and apply the schema** via the Supabase CLI (already installed —
   `supabase init` has been run):

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   This applies `supabase/migrations/0001_init.sql`, which also creates the
   `photos` Storage bucket (public read, owner-only write) used by the
   questionnaire's photo upload question.

4. **Seed the schools and locations lists**

   ```bash
   npm run seed:schools
   npm run seed:locations
   ```

   Reads `content/eligible-schools.md` and `content/gcu-locations.md` and
   upserts into the `schools` / `locations` tables. Re-run any time those
   files change.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

## Content that isn't hardcoded

- `content/onboarding-cards.md` — the 4 onboarding card titles/bodies
- `content/eligible-schools.md` — the undergrad school allow-list (seeds `schools`)
- `content/gcu-locations.md` — the closed "where are you based" city list (seeds `locations`)
- `content/gcu-consent.md` — the consent checklist statements (final questionnaire page)
- `content/gcu-questionnaire.md` — source-of-truth copy for the 33 questions; keep
  `lib/questions.ts` in sync with it (the renderer reads only the TS config)

## Eligibility rule

A profile gets one of three states (`eligibility_status`): `eligible`,
`on_hold`, or `not_eligible`. School on the list **or** location on the list
→ `eligible`. Either being "Other" never auto-rejects — it goes `on_hold` for
manual review; approve/reject from the `/admin` table (see
`lib/eligibility.ts`). Only `eligible` profiles can reach `/referral`
(enforced in `proxy.ts`).

`profiles` has no client-facing `UPDATE` RLS policy — every write (onboarding
completion, questionnaire submission, eligibility overrides) goes through a
server route using the service-role client, so a signed-in user can never
self-promote their own `eligibility_status` via the browser.

## Known gaps / TODOs

- The custom 8-digit OTP → Supabase session handoff
  (`admin.generateLink` + client `verifyOtp`, see
  `app/api/auth/verify-code/route.ts` and `app/verify/page.tsx`) hasn't been
  smoke-tested against a live Supabase project yet — do that first once
  env vars are filled in.
- `app/api/cron/lifecycle-emails/route.ts` is a working stub (onboarding
  nudge, referral reminder, activated) but isn't wired to a schedule. Add a
  Vercel Cron entry once the content/cadence is approved.
- Weekly match email template exists (`lib/email/templates.ts`) but there's
  no matching logic yet — out of scope for this pass.
- Referral reminder currently sends once total per profile, not once per
  0/2 → 1/2 progress step.
