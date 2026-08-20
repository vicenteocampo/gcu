import { QUESTIONNAIRE } from "@/lib/questions";
import { QuestionnaireFlow } from "@/components/questionnaire-flow";

export default function QuestionnairePage() {
  return <QuestionnaireFlow questions={QUESTIONNAIRE} />;
}
