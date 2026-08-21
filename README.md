# GCU (Gente Como Uno)

A selective, no-bullshit dating app. Users sign up, answer a short
questionnaire, and get one curated match per week. No swiping, no browsing,
no public profiles.

See [docs/gcu-initial-prompt.md](docs/gcu-initial-prompt.md) for the full spec.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + Auth + Storage), accessed via `@supabase/ssr`
- Email: Gmail SMTP for now (`lib/email/mailer.ts`, via an App Password) —
  swap for Resend once a sending domain is set up
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
   - `GMAIL_USER` / `GMAIL_APP_PASSWORD` — the Gmail address sending email and
     a 16-character App Password for it (needs 2-Step Verification enabled;
     generate at myaccount.google.com/apppasswords). Without these set,
     emails just log to the server console instead of sending.
   - `RESEND_API_KEY` — saved for later; unused until Gmail is swapped out
   - `ADMIN_EMAILS` — comma-separated allow-list for `/admin`
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally
   - `BOOTSTRAP_INVITE_CODE` — see "Invite-only sign-up" below

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

## Invite-only sign-up

A valid referral code is required to sign up — the email step on `/` is
hidden until a code validates (`/api/referral/validate`). Existing members
re-entering their email to sign back in are exempted (checked by email
against `profiles` in `/api/auth/send-code`) — the gate is only for *new*
sign-ups.

Since a referral code normally comes from an existing profile, the very
first invitees need another way in: `BOOTSTRAP_INVITE_CODE` in `.env.local`
always validates, with no profile required. Hand it out to your first batch
of invitees, then everyone after that uses a real referral code from
`/referral`. See `lib/invite.ts`.

## Referral sharing

The `/referral` screen (`components/referral-progress.tsx`) offers two copy
options: the bare code, or the code plus a one-line explanation of GCU
(`inviteMessage` in that file) — review that copy before shipping to
production, per Vicente.

`activated` requires **one Male and one Female referral**, not just a raw
count of 2 — gender is only known once a referred profile finishes the
questionnaire, so activation is decided then, not at signup. See
`lib/referral-activation.ts`, called from the questionnaire route. The
`referral_count` DB trigger (migration `0001`/`0003`) only bumps a display
counter now; it no longer decides `activated`.

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

## Lifecycle email schedule

`app/api/cron/lifecycle-emails/route.ts` runs hourly via Vercel Cron
(`vercel.json`), authenticated with `CRON_SECRET` (Vercel sends it
automatically as a Bearer token for its own cron invocations):

- **Onboarding nudge** — 2h / 12h / 24h after finishing onboarding, for
  anyone who still hasn't finished the questionnaire (anchored on
  `profiles.onboarding_completed_at`)
- **Referral reminder** — 2h / 12h / 24h / 36h after finishing the
  questionnaire, for anyone `eligible` but not yet `activated` (anchored on
  `profiles.questionnaire_completed_at`); includes their referral code
- **Activated** — once, when `activated` flips to `true`

Each touchpoint is its own one-off `EmailType` (e.g. `referral_reminder_12h`)
so it can only send once per profile. Profiles that completed onboarding or
the questionnaire before the anchor timestamp columns existed (migration
`0002`) won't get timed reminders — there's no timestamp to anchor them to.

## Known gaps / TODOs

- Weekly match email template exists (`lib/email/templates.ts`) but there's
  no matching logic yet — out of scope for this pass.
- Gmail SMTP is a stand-in for a real sending domain — expect it to feel
  slower than a dedicated ESP and to cap out around ~500 sends/day.
