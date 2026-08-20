"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/questions";

type Answers = Record<string, string | string[]>;

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  switch (question.type) {
    case "short-text":
      return (
        <input
          type="text"
          required={question.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />
      );
    case "long-text":
      return (
        <textarea
          required={question.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />
      );
    case "single-select":
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-3 has-checked:border-neutral-900"
            >
              <input
                type="radio"
                name={question.key}
                required={question.required}
                checked={value === option}
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    case "multi-select": {
      const selected = (value as string[]) ?? [];
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-3 has-checked:border-neutral-900"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, option]);
                  } else {
                    onChange(selected.filter((o) => o !== option));
                  }
                }}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }
  }
}

export function QuestionnaireFlow({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, final: true }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      return;
    }

    router.push("/thank-you");
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">A few real questions</h1>
        <p className="mt-2 text-neutral-500">No profile to obsess over. Just answer honestly.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {questions.map((q) => (
            <div key={q.key}>
              <label className="mb-2 block font-medium">{q.label}</label>
              {q.helperText && (
                <p className="mb-2 text-sm text-neutral-400">{q.helperText}</p>
              )}
              <QuestionField
                question={q}
                value={answers[q.key]}
                onChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [q.key]: value }))
                }
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-neutral-900 px-4 py-3 text-base font-medium text-white disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
