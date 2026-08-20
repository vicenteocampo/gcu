// Config-driven questionnaire. No real questions yet — drop them in here
// once provided, the renderer at app/questionnaire handles all four types.
export type QuestionType = "single-select" | "multi-select" | "short-text" | "long-text";

export type Question = {
  key: string;
  type: QuestionType;
  label: string;
  helperText?: string;
  options?: string[]; // required for single-select / multi-select
  required?: boolean;
};

// TODO: replace with the real question set once provided.
export const QUESTIONNAIRE: Question[] = [
  {
    key: "example_single_select",
    type: "single-select",
    label: "Example single-select question — replace me",
    options: ["Option A", "Option B", "Option C"],
    required: true,
  },
  {
    key: "example_long_text",
    type: "long-text",
    label: "Example long-text question — replace me",
    required: true,
  },
];
