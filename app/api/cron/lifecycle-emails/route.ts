import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail, type EmailType } from "@/lib/email/send";
import { activatedEmail, onboardingNudgeEmail, referralReminderEmail } from "@/lib/email/templates";

const ONBOARDING_NUDGE_HOURS = [2, 12, 24] as const;
const REFERRAL_REMINDER_HOURS = [2, 12, 24, 36] as const;

function hoursSince(isoTimestamp: string): number {
  return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);
}

// Runs on a schedule (see vercel.json `crons`) — hourly is enough to keep
// each touchpoint close to its target hour without bunching multiple sends
// together if a run is missed.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  let sent = 0;

  // Onboarding nudge: 2h / 12h / 24h after finishing onboarding, for anyone
  // who still hasn't finished the questionnaire.
  const { data: nudgeCandidates } = await admin
    .from("profiles")
    .select("id, email, onboarding_completed_at")
    .eq("onboarding_completed", true)
    .eq("questionnaire_completed", false)
    .not("onboarding_completed_at", "is", null);

  for (const profile of nudgeCandidates ?? []) {
    const elapsed = hoursSince(profile.onboarding_completed_at!);
    for (const hours of ONBOARDING_NUDGE_HOURS) {
      if (elapsed < hours) break;
      const { subject, html } = onboardingNudgeEmail();
      const result = await sendTrackedEmail({
        to: profile.email,
        profileId: profile.id,
        type: `onboarding_nudge_${hours}h` as EmailType,
        subject,
        html,
      });
      if (!result.skipped) sent++;
    }
  }

  // Referral reminder: 2h / 12h / 24h / 36h after finishing the
  // questionnaire (eligible, not yet activated) — includes their code.
  const { data: reminderCandidates } = await admin
    .from("profiles")
    .select("id, email, referral_count, referral_code, questionnaire_completed_at")
    .eq("questionnaire_completed", true)
    .eq("eligibility_status", "eligible")
    .eq("activated", false)
    .not("questionnaire_completed_at", "is", null);

  for (const profile of reminderCandidates ?? []) {
    const elapsed = hoursSince(profile.questionnaire_completed_at!);
    for (const hours of REFERRAL_REMINDER_HOURS) {
      if (elapsed < hours) break;
      const { subject, html } = referralReminderEmail(profile.referral_count, profile.referral_code);
      const result = await sendTrackedEmail({
        to: profile.email,
        profileId: profile.id,
        type: `referral_reminder_${hours}h` as EmailType,
        subject,
        html,
      });
      if (!result.skipped) sent++;
    }
  }

  const { data: activatedCandidates } = await admin
    .from("profiles")
    .select("id, email")
    .eq("activated", true);

  for (const profile of activatedCandidates ?? []) {
    const { subject, html } = activatedEmail();
    const result = await sendTrackedEmail({
      to: profile.email,
      profileId: profile.id,
      type: "activated",
      subject,
      html,
    });
    if (!result.skipped) sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
