import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailFrom, getMailer } from "@/lib/email/mailer";

export type EmailType =
  | "welcome_code"
  | "onboarding_nudge_2h"
  | "onboarding_nudge_12h"
  | "onboarding_nudge_24h"
  | "submission_confirmation"
  | "on_hold_notice"
  | "referral_reminder_2h"
  | "referral_reminder_12h"
  | "referral_reminder_24h"
  | "referral_reminder_36h"
  | "activated"
  | "weekly_match";

// One-off event types: never send twice to the same profile. Each timed
// reminder touchpoint (e.g. onboarding_nudge_12h) is its own one-off type,
// so the 2h/12h/24h/36h sends each fire exactly once. Recurring types
// (e.g. weekly_match) are excluded — that dedupe will need a per-week key
// once matching logic exists.
const ONE_OFF_TYPES: EmailType[] = [
  "submission_confirmation",
  "on_hold_notice",
  "activated",
  "onboarding_nudge_2h",
  "onboarding_nudge_12h",
  "onboarding_nudge_24h",
  "referral_reminder_2h",
  "referral_reminder_12h",
  "referral_reminder_24h",
  "referral_reminder_36h",
];

type SendArgs = {
  to: string;
  profileId?: string;
  type: EmailType;
  subject: string;
  html: string;
};

export async function sendTrackedEmail({ to, profileId, type, subject, html }: SendArgs) {
  const admin = createAdminClient();

  if (profileId && ONE_OFF_TYPES.includes(type)) {
    const { data: existing } = await admin
      .from("email_log")
      .select("id")
      .eq("profile_id", profileId)
      .eq("email_type", type)
      .limit(1);

    if (existing && existing.length > 0) {
      return { skipped: true as const };
    }
  }

  // Dev fallback: without Gmail SMTP credentials configured, log instead of
  // sending — and never let email delivery fail the caller's underlying
  // write (the profile/questionnaire update it's reacting to has usually
  // already committed by the time this runs).
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`[dev] would send "${type}" email to ${to}: ${subject}`);
    return { skipped: true as const };
  }

  try {
    const mailer = getMailer();
    const result = await mailer.sendMail({
      from: getEmailFrom(),
      to,
      subject,
      html,
    });

    if (profileId) {
      await admin.from("email_log").insert({
        profile_id: profileId,
        email_type: type,
      });
    }

    return { skipped: false as const, result };
  } catch (err) {
    console.error(`Failed to send "${type}" email to ${to}:`, err);
    return { skipped: true as const };
  }
}
