import { createAdminClient } from "@/lib/supabase/admin";
import { EMAIL_FROM, getResendClient } from "@/lib/email/resend";

export type EmailType =
  | "welcome_code"
  | "onboarding_nudge"
  | "submission_confirmation"
  | "referral_reminder"
  | "activated"
  | "weekly_match";

// One-off event types: never send twice to the same profile. Recurring
// types (e.g. weekly_match) are excluded — that dedupe will need a
// per-week key once matching logic exists.
const ONE_OFF_TYPES: EmailType[] = [
  "submission_confirmation",
  "activated",
  "onboarding_nudge",
  "referral_reminder",
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

  const resend = getResendClient();
  const result = await resend.emails.send({
    from: EMAIL_FROM,
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
}
