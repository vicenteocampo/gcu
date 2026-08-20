import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReferralCode } from "@/lib/referral";

export async function POST(request: Request) {
  const { email, code, referralCode } = await request.json();

  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: codeRows, error: codeError } = await admin
    .from("auth_codes")
    .select("id, expires_at, used")
    .eq("email", normalizedEmail)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1);

  const codeRow = codeRows?.[0];

  if (codeError || !codeRow || codeRow.used || new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await admin.from("auth_codes").update({ used: true }).eq("id", codeRow.id);

  // Find or create the auth user for this email.
  let userId: string | undefined;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });

  if (created?.user) {
    userId = created.user.id;
  } else if (createError) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    userId = existingProfile?.[0]?.id;

    if (!userId) {
      return NextResponse.json({ error: "Could not resolve user" }, { status: 500 });
    }
  }

  // Ensure a profile row exists (one-time; trigger bumps the referrer's
  // count only on this initial insert).
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .limit(1);

  if (!existingProfile || existingProfile.length === 0) {
    let referredBy: string | null = null;

    if (typeof referralCode === "string" && referralCode.trim()) {
      const { data: referrer } = await admin
        .from("profiles")
        .select("referral_code")
        .eq("referral_code", referralCode.trim().toUpperCase())
        .limit(1);

      referredBy = referrer?.[0]?.referral_code ?? null;
    }

    let insertError = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await admin.from("profiles").insert({
        id: userId,
        email: normalizedEmail,
        referral_code: generateReferralCode(),
        referred_by: referredBy,
      });
      insertError = error;
      if (!error) break;
    }

    if (insertError) {
      return NextResponse.json({ error: "Could not create profile" }, { status: 500 });
    }
  }

  // Issue a session token the client can exchange via supabase.auth.verifyOtp.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
  });

  if (linkError || !link?.properties?.hashed_token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  return NextResponse.json({
    tokenHash: link.properties.hashed_token,
    email: normalizedEmail,
  });
}
