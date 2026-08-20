"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignUpFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") ?? "";

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState(refParam);
  const [needsCode, setNeedsCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, referralCode }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.code === "invite_code_required") {
        // needsCode still reflects the pre-submit render here, so this
        // correctly distinguishes "first time" from "retried with a bad code".
        setError(needsCode ? "That code isn't valid." : "GCU is invite-only — enter your code.");
        setNeedsCode(true);
      } else {
        setError("Something went wrong. Try again.");
      }
      return;
    }

    const params = new URLSearchParams({ email });
    if (referralCode) params.set("ref", referralCode);
    router.push(`/verify?${params.toString()}`);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          Gente Como Uno
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">GCU</h1>
        <p className="mt-3 text-neutral-500">
          No swiping. No browsing. One curated match, every week.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
          />
          {needsCode && (
            <input
              type="text"
              required
              placeholder="Invite code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-4 py-3 text-base uppercase outline-none focus:border-neutral-900"
            />
          )}
          {!needsCode && referralCode && (
            <p className="text-xs text-neutral-400">
              Invited with code <span className="font-mono">{referralCode}</span>
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 px-4 py-3 text-base font-medium text-white transition disabled:opacity-50"
          >
            {loading ? "Sending code..." : "Get my code"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <SignUpFlow />
    </Suspense>
  );
}
