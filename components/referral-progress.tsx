"use client";

import { useState } from "react";

// One-liner shared alongside the code on "copy code + message" — Vicente
// wants to review this copy before it ships to production.
function inviteMessage(referralCode: string, referralLink: string) {
  return `I'm inviting you to GCU — a selective, invite-only matchmaking circle. One real match a week, no swiping. Join with my code: ${referralCode} → ${referralLink}`;
}

export function ReferralProgress({
  referralCode,
  referralCount,
  activated,
  siteUrl,
}: {
  referralCode: string;
  referralCount: number;
  activated: boolean;
  siteUrl: string;
}) {
  const [copiedWhat, setCopiedWhat] = useState<"code" | "message" | null>(null);
  const referralLink = `${siteUrl}/?ref=${referralCode}`;

  async function handleCopyCode() {
    await navigator.clipboard.writeText(referralCode);
    setCopiedWhat("code");
    setTimeout(() => setCopiedWhat(null), 2000);
  }

  async function handleCopyMessage() {
    await navigator.clipboard.writeText(inviteMessage(referralCode, referralLink));
    setCopiedWhat("message");
    setTimeout(() => setCopiedWhat(null), 2000);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-sm">
        {activated ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">You&apos;re activated</h1>
            <p className="mt-3 text-neutral-500">
              Both referrals are in. We&apos;ll email you when your first match is ready.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              Bring two people in
            </h1>
            <p className="mt-3 text-neutral-500">
              Before matches start, get 2 people to join with your code.
            </p>

            <div className="mt-6 flex justify-center gap-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-12 rounded-full ${
                    i < referralCount ? "bg-neutral-900" : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-neutral-400">{referralCount}/2</p>

            <div className="mt-8 rounded-md border border-neutral-300 px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-neutral-400">
                Your code
              </p>
              <p className="mt-1 font-mono text-xl tracking-widest">{referralCode}</p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleCopyCode}
                className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-900"
              >
                {copiedWhat === "code" ? "Code copied" : "Copy code only"}
              </button>
              <button
                onClick={handleCopyMessage}
                className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
              >
                {copiedWhat === "message" ? "Message copied" : "Copy code + message"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
