// Seeds the `schools` table from content/eligible-schools.md.
// Usage: npm run seed:schools
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getEligibleSchoolNames } from "../lib/content";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey);
  const names = getEligibleSchoolNames();

  const { error } = await supabase
    .from("schools")
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: true }
    );

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${names.length} schools.`);
}

main();
