"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question, QuestionSection } from "@/lib/questions";
import { createClient } from "@/lib/supabase/client";

type AnswerValue = string | string[];
type Answers = Record<string, AnswerValue>;

function SingleSelectField({
  question,
  options,
  value,
  onChange,
}: {
  question: Question;
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const hasOther = options.includes("Other");
  const displayOptions = question.allowOtherFreeText && !hasOther ? [...options, "Other"] : options;
  const selectableOptions = hasOther ? options.filter((o) => o !== "Other") : options;
  const isOtherSelected = value !== undefined && !selectableOptions.includes(value) && value !== "";
  const [otherText, setOtherText] = useState(isOtherSelected ? value ?? "" : "");
  const [showOther, setShowOther] = useState(isOtherSelected);

  return (
    <div className="space-y-2">
      {displayOptions.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-4 py-3 has-checked:border-neutral-900"
        >
          <input
            type="radio"
            name={question.key}
            required={question.required}
            checked={option === "Other" ? showOther : value === option}
            onChange={() => {
              if (option === "Other") {
                setShowOther(true);
                onChange(otherText);
              } else {
                setShowOther(false);
                onChange(option);
              }
            }}
          />
          {option}
        </label>
      ))}
      {showOther && (
        <input
          type="text"
          required={question.required}
          placeholder="Please specify"
          value={otherText}
          onChange={(e) => {
            setOtherText(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />
      )}
    </div>
  );
}

function MultiSelectField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}) {
  const selected = value ?? [];
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
              if (e.target.checked) onChange([...selected, option]);
              else onChange(selected.filter((o) => o !== option));
            }}
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function RankedSelectField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}) {
  const ranked = value ?? [];

  function toggle(option: string) {
    if (ranked.includes(option)) {
      onChange(ranked.filter((o) => o !== option));
    } else {
      onChange([...ranked, option]);
    }
  }

  return (
    <div className="space-y-2">
      {question.options?.map((option) => {
        const rank = ranked.indexOf(option);
        const isRanked = rank !== -1;
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left ${
              isRanked ? "border-neutral-900" : "border-neutral-300"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                isRanked ? "bg-neutral-900 text-white" : "border border-neutral-300 text-transparent"
              }`}
            >
              {isRanked ? rank + 1 : "·"}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

function ScaleField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const min = question.scaleMin ?? 1;
  const max = question.scaleMax ?? 5;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div className="flex justify-between gap-2">
        {values.map((n) => (
          <label
            key={n}
            className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md border border-neutral-300 py-3 has-checked:border-neutral-900"
          >
            <input
              type="radio"
              name={question.key}
              required={question.required}
              checked={value === String(n)}
              onChange={() => onChange(String(n))}
              className="sr-only"
            />
            {n}
          </label>
        ))}
      </div>
      {(question.scaleMinLabel || question.scaleMaxLabel) && (
        <div className="mt-2 flex justify-between text-xs text-neutral-400">
          <span>{question.scaleMinLabel}</span>
          <span>{question.scaleMaxLabel}</span>
        </div>
      )}
    </div>
  );
}

function PhotoUploadField({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}) {
  const urls = value ?? [];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const max = question.maxPhotos ?? 6;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      setError("Not signed in.");
      return;
    }

    const newUrls: string[] = [];
    for (const file of Array.from(files).slice(0, max - urls.length)) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    onChange([...urls, ...newUrls]);
    setUploading(false);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt="" className="aspect-square w-full rounded-md object-cover" />
        ))}
      </div>
      {urls.length < max && (
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500">
          {uploading ? "Uploading..." : `Add photos (${urls.length}/${max})`}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {question.minPhotos && urls.length < question.minPhotos && (
        <p className="mt-1 text-xs text-neutral-400">
          At least {question.minPhotos} photos required.
        </p>
      )}
    </div>
  );
}

function QuestionField({
  question,
  dynamicOptions,
  value,
  onChange,
}: {
  question: Question;
  dynamicOptions: string[];
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  switch (question.type) {
    case "short_text":
      return (
        <input
          type="text"
          required={question.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />
      );
    case "long_text":
      return (
        <textarea
          required={question.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />
      );
    case "date":
      return (
        <input
          type="date"
          required={question.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
        />
      );
    case "single_select":
      return (
        <SingleSelectField
          question={question}
          options={question.optionsSource ? dynamicOptions : question.options ?? []}
          value={value as string | undefined}
          onChange={onChange}
        />
      );
    case "multi_select":
      return (
        <MultiSelectField
          question={question}
          value={value as string[] | undefined}
          onChange={onChange}
        />
      );
    case "ranked_select":
      return (
        <RankedSelectField
          question={question}
          value={value as string[] | undefined}
          onChange={onChange}
        />
      );
    case "scale":
      return <ScaleField question={question} value={value as string | undefined} onChange={onChange} />;
    case "photo_upload":
      return (
        <PhotoUploadField
          question={question}
          value={value as string[] | undefined}
          onChange={onChange}
        />
      );
  }
}

export function QuestionnaireFlow({
  sections,
  schools,
  locations,
  consentStatements,
}: {
  sections: QuestionSection[];
  schools: string[];
  locations: string[];
  consentStatements: string[];
}) {
  const router = useRouter();
  const totalSteps = sections.length + 1; // + consent
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState<boolean[]>(consentStatements.map(() => false));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConsentStep = step === sections.length;

  async function saveSectionAnswers(sectionAnswers: Answers) {
    await fetch("/api/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: sectionAnswers }),
    });
  }

  async function handleSectionSubmit(e: React.FormEvent, section: QuestionSection) {
    e.preventDefault();

    // Checkbox groups can't express "at least one checked" via native HTML
    // `required` (that only constrains individual checkboxes), and file
    // inputs can't express "at least N files" — both checked here instead.
    for (const q of section.questions) {
      if (q.type === "photo_upload" && q.required && q.minPhotos) {
        const count = (answers[q.key] as string[] | undefined)?.length ?? 0;
        if (count < q.minPhotos) {
          setError(`Please add at least ${q.minPhotos} photos.`);
          return;
        }
      }
      if ((q.type === "multi_select" || q.type === "ranked_select") && q.required) {
        const count = (answers[q.key] as string[] | undefined)?.length ?? 0;
        if (count < 1) {
          setError(`Please select at least one option for "${q.label}".`);
          return;
        }
      }
    }
    setError(null);

    const sectionAnswers: Answers = {};
    for (const q of section.questions) {
      if (answers[q.key] !== undefined) sectionAnswers[q.key] = answers[q.key];
    }
    await saveSectionAnswers(sectionAnswers);
    setStep((s) => s + 1);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (consent.some((c) => !c)) return;

    setError(null);
    setLoading(true);

    const res = await fetch("/api/questionnaire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: {}, final: true }),
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
        <div className="mb-8 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-neutral-900" : "bg-neutral-200"}`}
            />
          ))}
        </div>

        {!isConsentStep ? (
          <form onSubmit={(e) => handleSectionSubmit(e, sections[step])} className="space-y-8">
            <h1 className="text-2xl font-semibold tracking-tight">{sections[step].title}</h1>

            {sections[step].questions.map((q) => (
              <div key={q.key}>
                <label className="mb-2 block font-medium">{q.label}</label>
                {q.helperText && <p className="mb-2 text-sm text-neutral-400">{q.helperText}</p>}
                <QuestionField
                  question={q}
                  dynamicOptions={q.optionsSource === "schools" ? schools : locations}
                  value={answers[q.key]}
                  onChange={(value) => setAnswers((prev) => ({ ...prev, [q.key]: value }))}
                />
              </div>
            ))}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-500 disabled:opacity-0"
              >
                Back
              </button>
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
              >
                Next
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <h1 className="text-2xl font-semibold tracking-tight">One last thing</h1>
            <p className="text-neutral-500">Please confirm each of the following:</p>

            <div className="space-y-3">
              {consentStatements.map((statement, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={consent[i]}
                    onChange={(e) =>
                      setConsent((prev) => prev.map((c, idx) => (idx === i ? e.target.checked : c)))
                    }
                    className="mt-1"
                  />
                  <span>{statement}</span>
                </label>
              ))}
            </div>

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
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
