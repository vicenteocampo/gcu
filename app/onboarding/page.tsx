import { getOnboardingCards } from "@/lib/content";
import { OnboardingFlow } from "@/components/onboarding-flow";

export default function OnboardingPage() {
  const cards = getOnboardingCards();
  return <OnboardingFlow cards={cards} />;
}
