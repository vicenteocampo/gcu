"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingCard } from "@/lib/content";

export function OnboardingFlow({ cards }: { cards: OnboardingCard[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const isLastCard = step === cards.length - 1;

  async function handleNext() {
    if (!isLastCard) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/questionnaire");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex gap-1.5">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">{cards[step].title}</h1>
        <p className="mt-3 text-neutral-500">{cards[step].body}</p>

        <div className="mt-10 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-500 disabled:opacity-0"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isLastCard ? (loading ? "Starting..." : "Continue") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
