import { createHmac, timingSafeEqual } from "crypto";

// Admin access is a separate, static-PIN gate — not the customer-facing
// email+OTP flow. A signed cookie (HMAC, not a DB session) marks a browser
// as logged in as a given admin email.
export const ADMIN_SESSION_COOKIE = "gcu_admin_session";

function sign(email: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(email)
    .digest("base64url");
}

export function createAdminSessionValue(email: string): string {
  return `${Buffer.from(email).toString("base64url")}.${sign(email)}`;
}

export function verifyAdminSessionValue(value: string | undefined | null): string | null {
  if (!value) return null;

  const [emailB64, sig] = value.split(".");
  if (!emailB64 || !sig) return null;

  const email = Buffer.from(emailB64, "base64url").toString();
  const expected = Buffer.from(sign(email));
  const actual = Buffer.from(sig);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  return email;
}
