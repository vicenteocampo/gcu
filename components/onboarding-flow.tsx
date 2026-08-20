"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingCard } from "@/lib/content";
import { LATAM_COUNTRIES } from "@/lib/latam-countries";

type School = { id: number; name: string };

export function OnboardingFlow({
  cards,
  schools,
}: {
  cards: OnboardingCard[];
  schools: School[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0..cards.length-1 = cards, cards.length = eligibility form
  const totalSteps = cards.length + 1;

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [isOtherSchool, setIsOtherSchool] = useState(false);
  const [schoolOther, setSchoolOther] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCardStep = step < cards.length;

  async function handleEligibilitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/profile/eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        country,
        schoolId: isOtherSchool ? null : schoolId ? Number(schoolId) : null,
        schoolOther: isOtherSchool ? schoolOther : null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      return;
    }

    router.push("/questionnaire");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>

        {isCardStep ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              {cards[step].title}
            </h1>
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
                onClick={() => setStep((s) => s + 1)}
                className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                {step === cards.length - 1 ? "Continue" : "Next"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">
              A couple quick facts
            </h1>
            <p className="mt-2 text-neutral-500">
              This determines whether you&apos;re eligible for matches.
            </p>

            <form onSubmit={handleEligibilitySubmit} className="mt-8 space-y-4">
              <input
                type="text"
                required
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
              />

              <select
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
              >
                <option value="" disabled>
                  Country (nationality or residency)
                </option>
                {LATAM_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__other__">Other</option>
              </select>

              {!isOtherSchool ? (
                <select
                  required
                  value={schoolId}
                  onChange={(e) => {
                    if (e.target.value === "__other__") {
                      setIsOtherSchool(true);
                      setSchoolId("");
                    } else {
                      setSchoolId(e.target.value);
                    }
                  }}
                  className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                >
                  <option value="" disabled>
                    Undergraduate school
                  </option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value="__other__">Other</option>
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Your undergraduate school"
                    value={schoolOther}
                    onChange={(e) => setSchoolOther(e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsOtherSchool(false);
                      setSchoolOther("");
                    }}
                    className="text-xs text-neutral-400 underline"
                  >
                    Choose from list instead
                  </button>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-neutral-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Continue"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
