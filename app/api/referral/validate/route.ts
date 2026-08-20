import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("referral_code", code)
    .limit(1);

  return NextResponse.json({ valid: Boolean(data && data.length > 0) });
}
