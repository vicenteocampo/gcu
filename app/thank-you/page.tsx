import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ThankYouPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("eligibility_status")
    .eq("id", user!.id)
    .single();

  const isEligible = profile?.eligibility_status === "eligible";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-sm">
        {isEligible ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re in the pool</h1>
            <p className="mt-3 text-neutral-500">
              Thanks for finishing the questionnaire. One more step before matches start.
            </p>
            <Link
              href="/referral"
              className="mt-8 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Continue
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re under review</h1>
            <p className="mt-3 text-neutral-500">
              Thanks for finishing the questionnaire. Your profile needs a quick manual review
              before matching starts — you&apos;ll hear back soon.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
