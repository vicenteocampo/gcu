"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "checking" | "code" | "email";

function Header() {
  return (
    <>
      <p className="text-xs uppercase tracking-widest text-neutral-400">
        Gente Como Uno
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">GCU</h1>
      <p className="mt-3 text-neutral-500">
        No swiping. No browsing. One curated match, every week.
      </p>
    </>
  );
}

function SignUpFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") ?? "";

  const [step, setStep] = useState<Step>(refParam ? "checking" : "code");
  const [referralCode, setReferralCode] = useState(refParam);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!refParam) return;

    (async () => {
      const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(refParam)}`);
      const data = await res.json();

      if (data.valid) {
        setStep("email");
      } else {
        setCodeError("That invite link isn't valid anymore. Enter a code below.");
        setStep("code");
      }
    })();
  }, [refParam]);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError(null);
    setCheckingCode(true);

    const res = await fetch(`/api/referral/validate?code=${encodeURIComponent(codeInput)}`);
    const data = await res.json();

    setCheckingCode(false);

    if (!data.valid) {
      setCodeError("That code isn't valid.");
      return;
    }

    setReferralCode(codeInput.trim().toUpperCase());
    router.replace(`/?ref=${encodeURIComponent(codeInput.trim().toUpperCase())}`);
    setStep("email");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, referralCode }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      return;
    }

    const params = new URLSearchParams({ email });
    if (referralCode) params.set("ref", referralCode);
    router.push(`/verify?${params.toString()}`);
  }

  if (step === "checking") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <Header />
        </div>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <Header />

          <form onSubmit={handleCodeSubmit} className="mt-8 space-y-3">
            <p className="text-sm text-neutral-500">
              GCU is invite-only. Enter your invite code to continue.
            </p>
            <input
              type="text"
              required
              placeholder="Invite code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-4 py-3 text-base uppercase outline-none focus:border-neutral-900"
            />
            {codeError && <p className="text-sm text-red-600">{codeError}</p>}
            <button
              type="submit"
              disabled={checkingCode}
              className="w-full rounded-md bg-neutral-900 px-4 py-3 text-base font-medium text-white transition disabled:opacity-50"
            >
              {checkingCode ? "Checking..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <Header />

        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-900"
          />
          {referralCode && (
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
