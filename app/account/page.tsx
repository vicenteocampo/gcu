import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountActions } from "@/components/account-actions";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("questionnaire_completed, onboarding_completed")
    .eq("id", user!.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }
  if (!profile?.questionnaire_completed) {
    redirect("/questionnaire");
  }

  return <AccountActions email={user!.email!} />;
}
