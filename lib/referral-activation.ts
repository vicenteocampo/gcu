import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/send";
import { activatedEmail } from "@/lib/email/templates";

// Called whenever a referred profile finishes their questionnaire — that's
// the first point their gender is known. Activation requires at least one
// Male and one Female referral, not just a raw count of 2.
export async function recomputeReferrerActivation(referrerCode: string) {
  const admin = createAdminClient();

  const { data: referrer } = await admin
    .from("profiles")
    .select("id, email, activated")
    .eq("referral_code", referrerCode)
    .limit(1)
    .single();

  if (!referrer || referrer.activated) return;

  const { data: referred } = await admin
    .from("profiles")
    .select("gender")
    .eq("referred_by", referrerCode)
    .eq("questionnaire_completed", true);

  const hasMale = (referred ?? []).some((p) => p.gender === "Male");
  const hasFemale = (referred ?? []).some((p) => p.gender === "Female");

  if (!hasMale || !hasFemale) return;

  await admin.from("profiles").update({ activated: true }).eq("id", referrer.id);

  const { subject, html } = activatedEmail();
  await sendTrackedEmail({
    to: referrer.email,
    profileId: referrer.id,
    type: "activated",
    subject,
    html,
  });
}
