"use client";

import { useState } from "react";

// One-liner shared alongside the code on "copy code + message" — Vicente
// wants to review this copy before it ships to production.
function inviteMessage(referralCode: string, referralLink: string) {
  return `Te invito a GCU — un círculo de matchmaking selectivo y solo por invitación, para latinoamericanos de las top 30 universidades de USA. Un match por semana, sin swipes, sin perfiles públicos. Únete con mi código: ${referralCode} → ${referralLink}`;
}

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-4 py-3 ${
        done ? "border-neutral-900" : "border-neutral-300"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          done ? "bg-neutral-900 text-white" : "border border-neutral-300 text-transparent"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <span className={done ? "text-neutral-900" : "text-neutral-500"}>{label}</span>
    </div>
  );
}

export function ReferralProgress({
  referralCode,
  referralCount,
  activated,
  hasMale,
  hasFemale,
  siteUrl,
}: {
  referralCode: string;
  referralCount: number;
  activated: boolean;
  hasMale: boolean;
  hasFemale: boolean;
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
              You won&apos;t start receiving matches until you bring in one man and one woman
              who join and finish the questionnaire.
            </p>

            <div className="mt-6 space-y-2 text-left">
              <ChecklistItem label="One man" done={hasMale} />
              <ChecklistItem label="One woman" done={hasFemale} />
            </div>
            {referralCount > 0 && (
              <p className="mt-2 text-xs text-neutral-400">
                {referralCount} {referralCount === 1 ? "person has" : "people have"} signed up
                with your code so far.
              </p>
            )}

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
