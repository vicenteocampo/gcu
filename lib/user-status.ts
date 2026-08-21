// Admin-table funnel status. "Activado" reuses the real `activated` field
// (passed the 1 Male + 1 Female referral gate) — that leaves a real gap for
// profiles that finished the questionnaire but haven't cleared the referral
// gate yet, shown as "Esperando referidos" rather than folded into one of
// the other three.
export type UserStatus = "Registrado" | "En encuesta" | "Esperando referidos" | "Activado";

export function computeUserStatus(profile: {
  onboarding_completed: boolean;
  questionnaire_completed: boolean;
  activated: boolean;
}): UserStatus {
  if (!profile.onboarding_completed) return "Registrado";
  if (!profile.questionnaire_completed) return "En encuesta";
  if (!profile.activated) return "Esperando referidos";
  return "Activado";
}
