import { createAdminClient } from "@/lib/supabase/admin";

// Sign-up is invite-only: a code is valid if it matches an existing
// profile's referral_code, or the bootstrap code (for the very first
// invitees, before any real profiles exist). Server-only.
export async function isValidInviteCode(code: string | null | undefined): Promise<boolean> {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return false;

  if (
    process.env.BOOTSTRAP_INVITE_CODE &&
    normalized === process.env.BOOTSTRAP_INVITE_CODE.trim().toUpperCase()
  ) {
    return true;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("referral_code", normalized)
    .limit(1);

  return Boolean(data && data.length > 0);
}
