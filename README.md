# GCU (Gente Como Uno)

A selective, no-bullshit dating app. Users sign up, answer a short
questionnaire, and get one curated match per week. No swiping, no browsing,
no public profiles.

See [docs/gcu-initial-prompt.md](docs/gcu-initial-prompt.md) for the full spec.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth), accessed via `@supabase/ssr`
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

3. **Apply the schema.** The migration lives at
   `supabase/migrations/0001_init.sql`. Apply it via the Supabase CLI
   (`supabase db push`) or paste it into the SQL editor in the Supabase
   dashboard.

4. **Seed the eligible-schools list**

   ```bash
   npm run seed:schools
   ```

   Reads `content/eligible-schools.md` and upserts into the `schools` table.
   Re-run any time that file changes.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

## Content that isn't hardcoded

- `content/onboarding-cards.md` — the 4 onboarding card titles/bodies
- `content/eligible-schools.md` — the undergrad school allow-list (seeds `schools`)
- `lib/questions.ts` — the questionnaire config (real questions not added yet — drop them in here)

## Eligibility rule

A profile is eligible only when **both** gates pass: LatAm nationality/residency
**and** undergrad alum of a listed school (see `lib/eligibility.ts`).
Selecting "other" for school flags the profile for manual review.

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
- Questionnaire has no real questions yet — `lib/questions.ts` has a
  placeholder set showing the four supported types.
