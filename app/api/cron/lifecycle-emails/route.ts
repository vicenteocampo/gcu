import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/send";
import {
  activatedEmail,
  onboardingNudgeEmail,
  referralReminderEmail,
} from "@/lib/email/templates";

// Bare-bones lifecycle email sweep — each type sends at most once per
// profile (see ONE_OFF_TYPES in lib/email/send.ts). Not wired to a
// schedule yet: point a Vercel Cron entry (vercel.ts `crons`) at this
// route once the email content and cadence are approved.
// TODO: referral_reminder currently sends once total, not once per
// 0/2 -> 1/2 progress step — revisit if per-step reminders are wanted.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  let sent = 0;

  const { data: nudgeCandidates } = await admin
    .from("profiles")
    .select("id, email")
    .eq("onboarding_completed", true)
    .eq("questionnaire_completed", false);

  for (const profile of nudgeCandidates ?? []) {
    const { subject, html } = onboardingNudgeEmail();
    const result = await sendTrackedEmail({
      to: profile.email,
      profileId: profile.id,
      type: "onboarding_nudge",
      subject,
      html,
    });
    if (!result.skipped) sent++;
  }

  const { data: reminderCandidates } = await admin
    .from("profiles")
    .select("id, email, referral_count, referral_code")
    .eq("questionnaire_completed", true)
    .eq("activated", false);

  for (const profile of reminderCandidates ?? []) {
    const { subject, html } = referralReminderEmail(
      profile.referral_count,
      profile.referral_code
    );
    const result = await sendTrackedEmail({
      to: profile.email,
      profileId: profile.id,
      type: "referral_reminder",
      subject,
      html,
    });
    if (!result.skipped) sent++;
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
