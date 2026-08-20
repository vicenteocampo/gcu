import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeEligibility } from "@/lib/eligibility";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { fullName, country, schoolId, schoolOther } = await request.json();

  const { geo_eligible, school_eligible, eligible } = computeEligibility({
    country,
    schoolId,
    schoolOther,
  });

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName ?? null,
      country: country ?? null,
      school_id: schoolOther ? null : schoolId ?? null,
      school_other: schoolOther ?? null,
      geo_eligible,
      school_eligible,
      eligible,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, eligible });
}
