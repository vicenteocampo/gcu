import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedEmail } from "@/lib/email/send";
import { welcomeCodeEmail } from "@/lib/email/templates";
import { isValidInviteCode } from "@/lib/invite";

const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export async function POST(request: Request) {
  const { email, referralCode } = await request.json();

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

  // Sign-up is invite-only, but only for *new* members — someone re-entering
  // their code to sign back in doesn't need a referral code.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1);

  const isReturningUser = Boolean(existingProfile && existingProfile.length > 0);

  if (!isReturningUser && !(await isValidInviteCode(referralCode))) {
    return NextResponse.json({ error: "Invalid or missing invite code" }, { status: 400 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  const { error: insertError } = await admin.from("auth_codes").insert({
    email: normalizedEmail,
    code,
    expires_at: expiresAt,
  });

  if (insertError) {
    return NextResponse.json({ error: "Could not create code" }, { status: 500 });
  }

  const { subject, html } = welcomeCodeEmail(code);
  const result = await sendTrackedEmail({
    to: normalizedEmail,
    type: "welcome_code",
    subject,
    html,
  });

  // sendTrackedEmail never throws — a delivery failure shouldn't block
  // sign-up. Surface the code directly if it wasn't actually sent (missing
  // Gmail creds, or the send itself failed) so local testing still works.
  return NextResponse.json({ ok: true, devCode: result.skipped ? code : undefined });
}
