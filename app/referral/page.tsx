import { createClient } from "@/lib/supabase/server";
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

  return (
    <ReferralProgress
      referralCode={profile?.referral_code ?? ""}
      referralCount={profile?.referral_count ?? 0}
      activated={profile?.activated ?? false}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
    />
  );
}
