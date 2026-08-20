import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, EMAIL_FROM } from "@/lib/email/resend";
import { welcomeCodeEmail } from "@/lib/email/templates";

const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

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

  try {
    const resend = getResendClient();
    await resend.emails.send({ from: EMAIL_FROM, to: normalizedEmail, subject, html });
  } catch {
    return NextResponse.json({ error: "Could not send email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
