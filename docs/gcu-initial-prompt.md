# GCU (Gente Como Uno) — Initial Build Prompt

## What we're building
A selective, no-bullshit dating app for affluent Latin Americans, living anywhere in the world. Users sign up, answer a short questionnaire, and get **one curated match per week**. No swiping, no browsing, no public profiles.

Working name: **GCU** ("Gente Como Uno").

## Environment setup (do this first)
Before writing any code, create a `.env.local` file in the project root and add it to `.gitignore` immediately (never commit this file). I'll fill in the real values myself — don't ask me to paste secrets into chat, and don't hardcode any credentials directly in code.

```
# .env.local — fill in real values locally, never commit
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_PASSWORD=
RESEND_API_KEY=
```

Reference these via `process.env.X` everywhere; nothing in this repo should ever contain a real key, password, or token.

## Tech stack
- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend/DB/Auth:** Supabase (Postgres + Supabase Auth)
- **Deployment target:** Vercel
- **Responsiveness:** Web app, must work well on mobile browsers (mobile web first, no native app for now)
- **Email:** Resend (or Supabase's built-in SMTP if simpler to start) triggered via Supabase Edge Functions

Set up the Next.js project with Supabase client (browser + server), Tailwind, and a clean `/app` router structure. Use Supabase Auth for session handling where possible instead of rolling our own.

## Flow overview
1. **Sign up** — email + 8-digit code (OTP-style, passwordless)
2. **Onboarding** — 4 short, witty intro cards (next/back navigation)
3. **Questionnaire** — the actual matching questions (I'll provide these separately; scaffold the UI and data model so it's easy to drop in)
4. **Thank you screen**
5. **Referral gate** — user must get 2 people to activate before they're eligible for matches; show their referral code
6. **Eligibility check** — LatAm nationals/residents, or undergrad alumni of a list of ~20 top US schools
7. **Automated emails** — triggered at key journey moments
8. **Admin CMS** — simple internal table view of all users

---

## 1. Sign up
- Single screen: email input → sends an 8-digit numeric code to that email → user enters code to verify.
- Use Supabase Auth email OTP if it supports 8-digit codes cleanly; otherwise implement a custom `auth_codes` table (email, code, expires_at, used) and verify manually, then create/sign in the Supabase user.
- On success, create a row in `profiles` (see schema below) if one doesn't exist.

## 2. Onboarding cards
- 4 cards, swipeable/next-back, no skip (must go through all 4 before questionnaire).
- Copy lives in `content/onboarding-cards.md` (see companion file) — **read it from that file, don't hardcode the copy in components**, so we can iterate on tone without touching code.
- Each card: title, body text, maybe a simple icon/illustration placeholder.

## 3. Questionnaire
- I'll share the actual question set with you next — for this first pass, scaffold:
  - A generic renderer that can handle question types: single-select, multi-select, short text, long text.
  - Answers saved to a `questionnaire_responses` table (see schema) as they go, or on final submit — your call on what's more robust.
- Don't invent questions yet. Build the structure so questions can be defined in a config (JSON/TS array) and swapped in easily.

## 4. Thank you screen
- Simple confirmation: "You're in the pool" — sets up the transition to the referral gate.

## 5. Referral gate
- After the thank you screen, show: "Before we start sending you matches, get 2 people to join with your code."
- Display the user's unique 6-character alphanumeric referral code.
- Track referral count on the user's profile; `activated = true` once `referral_count >= 2`.
- New users who sign up via a referral link/code should have that recorded (`referred_by`), and increment the referrer's count.

## 6. Eligibility
- Two independent gates, both should probably resolve to a single `eligible` boolean on the profile:
  - **Geography:** Latin American nationality or residency (self-reported in questionnaire/onboarding — simple country dropdown/select is fine for v1).
  - **Education:** undergrad at one of the schools in the list below. Generate this list as its own file at `content/eligible-schools.md` in the project (one school per line, same format as below) — don't hardcode it inline in components. Store schools in a `schools` table in Supabase, seeded from that file; user selects from a dropdown backed by that table (with an "other" option that flags for manual review).
- A user only needs to satisfy ONE of the two gates (LatAm OR target school) — confirm this assumption with me before hardcoding the logic, I'll fix if wrong.

### Eligible schools (undergrad) — first pass
1. Harvard University
2. Yale University
3. Princeton University
4. Stanford University
5. Massachusetts Institute of Technology (MIT)
6. University of Pennsylvania
7. Columbia University
8. Dartmouth College
9. Brown University
10. Cornell University
11. Duke University
12. Northwestern University
13. University of Chicago
14. Georgetown University
15. University of California, Berkeley
16. University of California, Los Angeles (UCLA)
17. University of Michigan, Ann Arbor
18. Vanderbilt University
19. University of Notre Dame
20. New York University (NYU)
21. Boston University
22. Babson College
23. Northeastern University

## 7. Automated emails
- Simple, rule-based (not a full marketing platform) — a Supabase Edge Function (or Next.js API route + cron) that triggers a templated email on specific events:
  - Welcome / verify email
  - Onboarding incomplete nudge (e.g., started but didn't finish questionnaire)
  - Thank you / submission confirmation
  - Referral reminder (0/2, 1/2 progress)
  - Activated (2/2 referrals — welcome to the pool)
  - Weekly match notification (placeholder for later, no matching logic needed yet)
- Log every send in an `email_log` table so we don't double-send and can debug.
- Keep templates as simple HTML/React Email components, one per event type.

## 8. Admin CMS
- Simple internal-only route (e.g. `/admin`), gated behind a basic password or a hardcoded allow-list of admin emails via Supabase Auth — nothing fancy for v1.
- Table view of all users with columns: email, name, country, school, eligible, referral_code, referral_count, activated, questionnaire_status, created_at.
- Sortable/filterable if easy, but a plain table is fine for v1.

---

## Supabase schema (first pass — adjust as needed)

```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id),
  email text unique not null,
  full_name text,
  country text,
  school text,
  eligible boolean default false,
  referral_code text unique not null,
  referred_by text references profiles(referral_code),
  referral_count int default 0,
  activated boolean default false,
  onboarding_completed boolean default false,
  questionnaire_completed boolean default false,
  created_at timestamptz default now()
);

-- schools (eligible undergrad list)
create table schools (
  id serial primary key,
  name text unique not null
);

-- questionnaire_responses
create table questionnaire_responses (
  id serial primary key,
  profile_id uuid references profiles(id),
  question_key text not null,
  answer jsonb not null,
  created_at timestamptz default now()
);

-- email_log
create table email_log (
  id serial primary key,
  profile_id uuid references profiles(id),
  email_type text not null,
  sent_at timestamptz default now()
);
```

---

## What to build in this first pass
1. Next.js + Supabase project scaffold with Tailwind.
2. Supabase schema above, applied as migrations.
3. Sign up flow (email + 8-digit code).
4. Onboarding card flow, reading from `content/onboarding-cards.md`.
5. Generic questionnaire renderer (config-driven, no real questions yet).
6. Thank you screen.
7. Referral gate screen + referral code generation/tracking logic.
8. Eligibility check logic wired to `schools` table + country field.
9. Bare-bones email trigger scaffolding (edge function stub + one working template, e.g. welcome email) — don't over-build this yet.
10. `/admin` table view of users.

Ask me before making irreversible product decisions (e.g. exact eligibility logic, whether referral must be exactly 2, email provider choice) — flag assumptions inline as TODOs instead of guessing silently on anything that isn't purely technical scaffolding.
