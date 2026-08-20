import { getOnboardingCards } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding-flow";

export default async function OnboardingPage() {
  const cards = getOnboardingCards();

  const supabase = await createClient();
  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  return <OnboardingFlow cards={cards} schools={schools ?? []} />;
}
