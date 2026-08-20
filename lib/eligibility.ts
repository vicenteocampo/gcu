export type EligibilityStatus = "eligible" | "on_hold" | "not_eligible";

// Eligibility rule (per spec): school on the list OR location on the list
// -> eligible. "Other" on both never auto-rejects — it goes on_hold for
// manual review in /admin. `not_eligible` is a manual-only admin override,
// never set automatically.
export function computeEligibilityStatus(args: {
  schoolOnList: boolean;
  locationOnList: boolean;
}): EligibilityStatus {
  return args.schoolOnList || args.locationOnList ? "eligible" : "on_hold";
}
