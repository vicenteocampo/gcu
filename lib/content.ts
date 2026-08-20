import fs from "node:fs";
import path from "node:path";

export type OnboardingCard = {
  title: string;
  body: string;
};

// Reads content/onboarding-cards.md so copy can be edited without touching
// components. Cards are delimited by "## Card N" headings with **Title:**
// and **Body:** lines.
export function getOnboardingCards(): OnboardingCard[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "content", "onboarding-cards.md"),
    "utf-8"
  );

  const cardBlocks = raw.split(/^## Card \d+\s*$/m).slice(1);

  return cardBlocks.map((block) => {
    const titleMatch = block.match(/\*\*Title:\*\*\s*(.+)/);
    const bodyMatch = block.match(/\*\*Body:\*\*\s*([\s\S]*?)(?:\n\n|$)/);

    return {
      title: titleMatch?.[1]?.trim() ?? "",
      body: bodyMatch?.[1]?.trim() ?? "",
    };
  });
}

// Reads content/eligible-schools.md ("- School Name" per line) for seeding
// the `schools` table. See scripts/seed-schools.ts.
export function getEligibleSchoolNames(): string[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "content", "eligible-schools.md"),
    "utf-8"
  );

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

// Reads content/gcu-locations.md ("N. City Name" per line) for seeding the
// `locations` table. "Other" is a UI-only fallback, not a real location —
// excluded here. See scripts/seed-locations.ts.
export function getLocationNames(): string[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "content", "gcu-locations.md"),
    "utf-8"
  );

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.toLowerCase() !== "other");
}

// Reads content/gcu-consent.md ("- statement" per line) for the consent
// checklist page at the end of the questionnaire.
export function getConsentStatements(): string[] {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "content", "gcu-consent.md"),
    "utf-8"
  );

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}
