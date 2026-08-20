import { isLatamCountry } from "@/lib/latam-countries";

// Eligibility rule (confirmed with product owner): a profile is eligible
// only when BOTH gates pass — LatAm nationality/residency AND target-school
// alum. Selecting "other" for school flags the profile for manual review
// (school_eligible stays false until an admin overrides it).
export function computeEligibility(args: {
  country: string | null | undefined;
  schoolId: number | null | undefined;
  schoolOther: string | null | undefined;
}) {
  const geo_eligible = isLatamCountry(args.country);
  const school_eligible = Boolean(args.schoolId) && !args.schoolOther;
  const eligible = geo_eligible && school_eligible;

  return { geo_eligible, school_eligible, eligible };
}
