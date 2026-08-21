import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReferralProgress } from "@/components/referral-progress";

export default async function ReferralPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code, referral_count, activated")
    .eq("id", user!.id)
    .single();

  let hasMale = false;
  let hasFemale = false;

  if (profile?.referral_code && !profile.activated) {
    // profiles has no client-facing SELECT policy for other users' rows —
    // use the admin client now that we've verified the caller's identity.
    const admin = createAdminClient();
    const { data: referred } = await admin
      .from("profiles")
      .select("gender")
      .eq("referred_by", profile.referral_code)
      .eq("questionnaire_completed", true);

    hasMale = (referred ?? []).some((p) => p.gender === "Male");
    hasFemale = (referred ?? []).some((p) => p.gender === "Female");
  }

  return (
    <ReferralProgress
      referralCode={profile?.referral_code ?? ""}
      referralCount={profile?.referral_count ?? 0}
      activated={profile?.activated ?? false}
      hasMale={hasMale}
      hasFemale={hasFemale}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
    />
  );
}
