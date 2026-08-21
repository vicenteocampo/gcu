-- Anchor timestamps for the timed lifecycle-email reminders (onboarding
-- nudge at 2/12/24h, referral reminder at 2/12/24/36h — see
-- app/api/cron/lifecycle-emails/route.ts).
alter table profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists questionnaire_completed_at timestamptz;
