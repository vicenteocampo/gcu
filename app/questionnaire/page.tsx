import { QUESTIONNAIRE_SECTIONS } from "@/lib/questions";
import { getConsentStatements } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { QuestionnaireFlow } from "@/components/questionnaire-flow";

export default async function QuestionnairePage() {
  const supabase = await createClient();

  const [{ data: schools }, { data: locations }] = await Promise.all([
    supabase.from("schools").select("name").order("name"),
    supabase.from("locations").select("name").order("name"),
  ]);

  return (
    <QuestionnaireFlow
      sections={QUESTIONNAIRE_SECTIONS}
      schools={schools?.map((s) => s.name) ?? []}
      locations={locations?.map((l) => l.name) ?? []}
      consentStatements={getConsentStatements()}
    />
  );
}
