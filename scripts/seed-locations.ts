// Syncs the `locations` table with content/gcu-locations.md: adds new
// names, removes ones no longer in the file.
// Usage: npm run seed:locations
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getLocationNames } from "../lib/content";

config({ path: ".env.local" });

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
  const names = getLocationNames();

  const { error: upsertError } = await supabase
    .from("locations")
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: true }
    );

  if (upsertError) {
    console.error("Seed failed:", upsertError.message);
    process.exit(1);
  }

  const { data: existing, error: selectError } = await supabase
    .from("locations")
    .select("id, name");

  if (selectError) {
    console.error("Sync failed:", selectError.message);
    process.exit(1);
  }

  const toRemove = (existing ?? []).filter((row) => !names.includes(row.name));

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("locations")
      .delete()
      .in("id", toRemove.map((row) => row.id));

    if (deleteError) {
      console.error("Removing stale locations failed:", deleteError.message);
      process.exit(1);
    }
  }

  console.log(
    `Synced locations: ${names.length} total${toRemove.length ? `, removed ${toRemove.map((r) => r.name).join(", ")}` : ""}.`
  );
}

main();
