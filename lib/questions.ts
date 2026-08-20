// Config-driven questionnaire, transcribed from content/gcu-questionnaire.md.
// Edit that file for the source-of-truth copy; keep this in sync with it —
// the generic renderer (components/questionnaire-flow.tsx) reads only this.
export type QuestionType =
  | "short_text"
  | "long_text"
  | "date"
  | "single_select"
  | "multi_select"
  | "scale"
  | "photo_upload";

export type Question = {
  key: string;
  type: QuestionType;
  label: string;
  helperText?: string;
  options?: string[]; // static options for single_select / multi_select
  optionsSource?: "schools" | "locations"; // dynamic options fetched from Supabase; "Other" appended in the UI
  allowOtherFreeText?: boolean; // last option "Other" reveals a free-text input
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  minPhotos?: number;
  maxPhotos?: number;
  required?: boolean;
};

export type QuestionSection = {
  title: string;
  questions: Question[];
};

export const QUESTIONNAIRE_SECTIONS: QuestionSection[] = [
  {
    title: "About you",
    questions: [
      { key: "full_name", type: "short_text", label: "Full name", required: true },
      { key: "birth_date", type: "date", label: "Birth date", required: true },
      {
        key: "gender_identity",
        type: "single_select",
        label: "Gender identity",
        options: ["Male", "Female"],
        required: true,
      },
      { key: "linkedin_profile", type: "short_text", label: "Your LinkedIn profile", required: true },
      {
        key: "instagram_handle",
        type: "short_text",
        label: "Instagram @handle or other social media (optional)",
      },
      { key: "occupation_industry", type: "short_text", label: "Occupation / Company / Industry" },
      {
        key: "education",
        type: "single_select",
        label: "Where did you do your undergrad?",
        optionsSource: "schools",
        allowOtherFreeText: true,
        required: true,
      },
      { key: "languages_spoken", type: "short_text", label: "Languages you speak" },
      {
        key: "height",
        type: "short_text",
        label: "Your height (in meters)",
        helperText: "e.g. 1.75",
      },
      {
        key: "photos",
        type: "photo_upload",
        label: "Please share a few photos of you — face and body",
        minPhotos: 4,
        maxPhotos: 6,
        required: true,
      },
    ],
  },
  {
    title: "What are you looking for",
    questions: [
      {
        key: "relationship_goal",
        type: "single_select",
        label: "What are you looking for?",
        options: ["Marriage", "Serious relationship / partnership", "Casual dating / short term", "Unsure"],
        required: true,
      },
      {
        key: "interested_in_meeting",
        type: "single_select",
        label: "Who are you interested in meeting?",
        options: ["Women", "Men"],
        required: true,
      },
      { key: "youngest_age", type: "short_text", label: "What is the youngest age you would seriously consider dating?", required: true },
      { key: "oldest_age", type: "short_text", label: "What is the oldest age you would seriously consider dating?", required: true },
      {
        key: "based_in",
        type: "single_select",
        label: "Where are you based?",
        optionsSource: "locations",
        allowOtherFreeText: true,
        required: true,
      },
      {
        key: "match_radius",
        type: "single_select",
        label: "Where should I match you with?",
        options: ["Only my city", "Only my country", "Open to anywhere"],
        required: true,
      },
      { key: "hometown", type: "short_text", label: "Hometown" },
    ],
  },
  {
    title: "Lifestyle",
    questions: [
      { key: "smokes", type: "single_select", label: "Do you smoke?", options: ["Yes", "Sometimes", "No"], required: true },
      { key: "drinks_alcohol", type: "single_select", label: "Do you drink alcohol?", options: ["Yes", "Sometimes", "No"], required: true },
      {
        key: "recreational_drugs",
        type: "single_select",
        label: "Do you use recreational drugs? Including weed, MDMA, etc.",
        options: ["Yes", "Sometimes", "No"],
        required: true,
      },
      {
        key: "about_yourself",
        type: "long_text",
        label: "Tell me about yourself.",
        helperText:
          "Share your story and lifestyle — hometown, hobbies, interests, fitness level, work, pets, dietary preferences, relationship structure, and whatever else you'd want your match to know.",
        required: true,
      },
      { key: "values_that_matter", type: "long_text", label: "Values that are important to you", required: true },
    ],
  },
  {
    title: "Preferences for a match",
    questions: [
      {
        key: "political_views_open_to",
        type: "multi_select",
        label: "Political views of your match",
        options: ["Open to any", "Moderate", "Liberal", "Conservative"],
      },
      {
        key: "religion_open_to",
        type: "multi_select",
        label: "What religion or spiritual background would you be open to dating?",
        options: ["No religion", "Christian", "Catholic", "Jewish"],
      },
      {
        key: "religious_observance_level",
        type: "scale",
        label: "How religious or spiritually observant would you like your match to be?",
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: "Not religious / not observant",
        scaleMaxLabel: "Very observant, religion is central to their life",
      },
      {
        key: "open_to_kids",
        type: "single_select",
        label: "If the match has kids",
        options: ["I am open to date matches with kids", "I am not open to matches with kids"],
      },
      { key: "must_haves", type: "long_text", label: "Must-haves in a partner", required: true },
      { key: "nice_to_haves", type: "long_text", label: "Nice-to-haves in a partner", required: true },
      { key: "deal_breakers", type: "long_text", label: "Deal breakers", required: true },
      {
        key: "usually_drawn_to",
        type: "long_text",
        label: "Who are you usually drawn to?",
        helperText: "Personality, energy, lifestyle, emotional style, ambition, creativity, warmth, etc.",
      },
      {
        key: "anything_else",
        type: "long_text",
        label: "Anything else?",
        helperText: "In case I missed something like height or whatever is important for you, share it here.",
      },
    ],
  },
];

export const QUESTIONNAIRE: Question[] = QUESTIONNAIRE_SECTIONS.flatMap((s) => s.questions);
