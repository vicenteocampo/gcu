import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Access is gated upstream by proxy.ts (ADMIN_EMAILS allow-list on
// /api/admin/:path*) — this is how Vicente manually clears on_hold profiles.
export async function POST(request: Request) {
  const { profileId, eligibilityStatus } = await request.json();

  if (
    typeof profileId !== "string" ||
    !["eligible", "on_hold", "not_eligible"].includes(eligibilityStatus)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ eligibility_status: eligibilityStatus })
    .eq("id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
