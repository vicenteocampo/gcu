import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionValue } from "@/lib/admin-session";

export async function POST(request: Request) {
  const { email, code } = await request.json();

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAllowedEmail = adminEmails.includes(normalizedEmail);
  const isCorrectPin = typeof code === "string" && code === process.env.ADMIN_PIN;

  if (!isAllowedEmail || !isCorrectPin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(normalizedEmail), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
