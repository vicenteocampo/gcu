// Countries counted as "Latin American" for the geography eligibility gate.
// Self-reported nationality or residency, either counts (v1: single dropdown).
export const LATAM_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Dominican Republic",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Paraguay",
  "Peru",
  "Puerto Rico",
  "Uruguay",
  "Venezuela",
] as const;

export type LatamCountry = (typeof LATAM_COUNTRIES)[number];

export function isLatamCountry(country: string | null | undefined): boolean {
  if (!country) return false;
  return (LATAM_COUNTRIES as readonly string[]).includes(country);
}
