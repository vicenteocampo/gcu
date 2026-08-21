import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: files } = await admin.storage.from("photos").list(user.id);
  if (files && files.length > 0) {
    await admin.storage.from("photos").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  // Deleting the auth user cascades to profiles, questionnaire_responses,
  // and email_log (all ON DELETE CASCADE). Anyone this user referred keeps
  // their own profile — referred_by just becomes null (migration 0004).
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
