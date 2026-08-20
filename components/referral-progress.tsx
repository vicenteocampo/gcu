"use client";

import { useState } from "react";

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
  const [copied, setCopied] = useState(false);
  const referralLink = `${siteUrl}/?ref=${referralCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

            <button
              onClick={handleCopy}
              className="mt-4 w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
            >
              {copied ? "Link copied" : "Copy invite link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
