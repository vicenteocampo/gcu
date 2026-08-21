import { QUESTIONNAIRE_SECTIONS } from "@/lib/questions";
import { getConsentStatements } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { QuestionnaireFlow } from "@/components/questionnaire-flow";

export default async function QuestionnairePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: schools }, { data: locations }, { data: responses }, { data: profile }] =
    await Promise.all([
      supabase.from("schools").select("name").order("name"),
      supabase.from("locations").select("name").order("name"),
      supabase.from("questionnaire_responses").select("question_key, answer").eq("profile_id", user!.id),
      supabase.from("profiles").select("questionnaire_completed").eq("id", user!.id).single(),
    ]);

  const initialAnswers = Object.fromEntries(
    (responses ?? []).map((r) => [r.question_key, r.answer as string | string[]])
  );

  return (
    <QuestionnaireFlow
      sections={QUESTIONNAIRE_SECTIONS}
      schools={schools?.map((s) => s.name) ?? []}
      locations={locations?.map((l) => l.name) ?? []}
      consentStatements={getConsentStatements()}
      initialAnswers={initialAnswers}
      isEditing={profile?.questionnaire_completed ?? false}
    />
  );
}
