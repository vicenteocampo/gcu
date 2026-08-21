<!--
GCU Questionnaire — question config.
Format: each question has a key (used as questionnaire_responses.question_key),
a type, the prompt text, and options where relevant. Claude Code: turn this into
a JSON/TS config array that the generic questionnaire renderer consumes — don't
hardcode these in components.

Types used: short_text, long_text, date, single_select, multi_select, ranked_select, scale, photo_upload

Some questions double as eligibility/matching signals — flagged inline.
-->

## Section 1 — About you

- **full_name** (short_text, required) — "Full name"
- **birth_date** (date, required) — "Birth date"
- **gender_identity** (single_select, required) — "Gender identity"
  - Options: Male, Female
- **linkedin_profile** (short_text, required) — "Your LinkedIn profile"
- **instagram_handle** (short_text, optional) — "Instagram @handle or other social media (optional)"
- **occupation_industry** (short_text) — "Occupation / Company / Industry"
- **education** (single_select, required, ELIGIBILITY-LINKED) — "Where did you do your undergrad?"
  - Options: pulled dynamically from `content/eligible-schools.md` / the `schools` Supabase table, plus a final "Other" option
  - If "Other" is selected: don't reject — flag `school_on_list = false` on the profile. Combined with the LatAm geography gate, this determines whether the user is auto-eligible or goes to "on hold" (see Eligibility section in the main prompt).
- **languages_spoken** (short_text) — "Languages you speak"
- **height** (short_text) — "Your height (in meters)", e.g. 1.75
- **photos** (photo_upload, required, 4–6 images) — "Please share a few photos of you: face and body"

## Section 2 — What are you looking for

- **relationship_goal** (multi_select, required) — "What are you looking for?"
  - Options: Marriage, Serious relationship / partnership, Casual dating / short term, Unsure
- **interested_in_meeting** (single_select, required) — "Who are you interested in meeting?"
  - Options: Women, Men (no "Other" option)
- **youngest_age** (short_text, required) — "What is the youngest age you would seriously consider dating?"
- **oldest_age** (short_text, required) — "What is the oldest age you would seriously consider dating?"
- **based_in** (single_select, required, ELIGIBILITY-RELATED) — "Where are you based?"
  - Options: pulled dynamically from `content/gcu-locations.md` / a `locations` Supabase table (closed list, no open free-text), ending in "Other"
  - If "Other" is selected: flag `location_on_list = false` — same "on hold" treatment as an unrecognized school.
- **match_radius** (ranked_select, required) — "Where should I match you with?" — tap to rank only the ones you'd consider, in preference order; you don't have to rank all of them
  - Options: Only my city, Only my country, Open to anywhere
- **hometown** (short_text) — "Hometown"

## Section 3 — Lifestyle

- **smokes** (single_select, required) — "Do you smoke?"
  - Options: Yes, Sometimes, No
- **drinks_alcohol** (single_select, required) — "Do you drink alcohol?"
  - Options: Yes, Sometimes, No
- **recreational_drugs** (single_select, required) — "Do you use recreational drugs? Including weed, MDMA, etc."
  - Options: Yes, Sometimes, No
- **about_yourself** (long_text, required) — "Tell me about yourself. Share your story and lifestyle: hometown, hobbies, interests, fitness level, work, pets, dietary preferences, relationship structure, and whatever else you'd want your match to know."
- **values_that_matter** (long_text, required) — "Values that are important to you"

## Section 4 — Preferences for a match

- **political_views_open_to** (multi_select) — "Political views of your match"
  - Options: Open to any, Moderate, Liberal, Conservative
- **religion_open_to** (multi_select) — "What religion or spiritual background would you be open to dating?"
  - Options: No religion, Christian, Catholic, Jewish
- **religious_observance_level** (scale 1–5) — "How religious or spiritually observant would you like your match to be?"
  - 1 = Not religious/not observant, 5 = Very observant and religion is central to their life
- **open_to_kids** (single_select) — "If the match has kids"
  - Options: I am open to date matches with kids, I am not open to matches with kids
- **must_haves** (long_text, required) — "Must-haves in a partner"
- **nice_to_haves** (long_text, required) — "Nice-to-haves in a partner"
- **deal_breakers** (long_text, required) — "Deal breakers"
- **usually_drawn_to** (long_text) — "Who are you usually drawn to? Personality, energy, lifestyle, emotional style, ambition, creativity, warmth, etc."
- **anything_else** (long_text, optional) — "Anything else? In case I missed something like height or whatever is important for you, share it here."

## Section 5 — Consent (final page before submit)

Framed around Vicente personally (solo matchmaker), not a company. Adapt wording, not a copy-paste of Roy's — but same structure:

- I give Vicente permission to review and store the information I provided and use it for the purpose of matchmaking
- I give Vicente permission to share an anonymized version of my profile for the purpose of matchmaking
- I give Vicente permission to reach out to me if there's a match
- I understand introductions are not guaranteed
- I understand matchmaking does not guarantee a match, date, relationship, chemistry, compatibility, or outcome
- I am responsible for my own dating decisions and personal safety
- I understand Vicente does not conduct formal background checks unless explicitly stated in writing
- I agree not to share, copy, or forward private information about other participants without permission
- I confirm the information I provided is accurate to the best of my knowledge and will inform Vicente of any changes

All boxes required to submit.
