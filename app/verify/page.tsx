"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const referralCode = searchParams.get("ref") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, referralCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Invalid code. Try again.");
      return;
    }

    const supabase = createClient();
    // TODO: verify this token_hash/type pairing against a live Supabase
    // project — admin.generateLink(type: "magiclink") + verifyOtp is the
    // documented pattern for custom OTP flows, but worth a smoke test.
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: data.tokenHash,
      type: "magiclink",
    });

    if (verifyError) {
      setLoading(false);
      setError("Could not verify. Try again.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, questionnaire_completed")
      .eq("id", user!.id)
      .single();

    setLoading(false);

    if (!profile?.onboarding_completed) {
      router.push("/onboarding");
    } else if (!profile?.questionnaire_completed) {
      router.push("/questionnaire");
    } else {
      router.push("/account");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
        <p className="mt-2 text-neutral-500">
          We sent an 8-digit code to <span className="font-medium">{email}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            required
            placeholder="12345678"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-md border border-neutral-300 px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-neutral-900"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length !== 8}
            className="w-full rounded-md bg-neutral-900 px-4 py-3 text-base font-medium text-white transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
