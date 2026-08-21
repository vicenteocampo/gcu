import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeEligibilityStatus } from "@/lib/eligibility";
import { sendTrackedEmail } from "@/lib/email/send";
import { submissionConfirmationEmail, onHoldEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { answers, final } = (await request.json()) as {
    answers: Record<string, unknown>;
    final?: boolean;
  };

  const rows = Object.entries(answers ?? {}).map(([question_key, answer]) => ({
    profile_id: user.id,
    question_key,
    answer,
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("questionnaire_responses")
      .upsert(rows, { onConflict: "profile_id,question_key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (final) {
    const [{ data: responses }, { data: schools }, { data: locations }] = await Promise.all([
      supabase
        .from("questionnaire_responses")
        .select("question_key, answer")
        .eq("profile_id", user.id),
      supabase.from("schools").select("name"),
      supabase.from("locations").select("name"),
    ]);

    const answerByKey = new Map((responses ?? []).map((r) => [r.question_key, r.answer as string]));
    const fullName = answerByKey.get("full_name") ?? null;
    const school = answerByKey.get("education") ?? null;
    const basedIn = answerByKey.get("based_in") ?? null;

    const schoolNames = new Set((schools ?? []).map((s) => s.name));
    const locationNames = new Set((locations ?? []).map((l) => l.name));

    const schoolOnList = Boolean(school && schoolNames.has(school));
    const locationOnList = Boolean(basedIn && locationNames.has(basedIn));
    const eligibilityStatus = computeEligibilityStatus({
      schoolOnList,
      locationOnList,
    });

    // profiles has no client-facing UPDATE policy (see migration) — use the
    // service-role client now that we've verified the caller's identity.
    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        school,
        school_on_list: schoolOnList,
        based_in: basedIn,
        location_on_list: locationOnList,
        eligibility_status: eligibilityStatus,
        questionnaire_completed: true,
        questionnaire_completed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (eligibilityStatus === "eligible") {
      const { subject, html } = submissionConfirmationEmail();
      await sendTrackedEmail({
        to: user.email!,
        profileId: user.id,
        type: "submission_confirmation",
        subject,
        html,
      });
    } else {
      const { subject, html } = onHoldEmail();
      await sendTrackedEmail({
        to: user.email!,
        profileId: user.id,
        type: "on_hold_notice",
        subject,
        html,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
