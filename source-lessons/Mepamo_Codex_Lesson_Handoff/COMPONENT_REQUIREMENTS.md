# Reusable lesson question components

## Shared integration contract

The existing lesson engine remains responsible for navigation, progress, persistence, scoring, sound preferences, and explanation display. The new question components manage the answer draft and expose answer readiness and a submitted answer to the engine. Reuse an existing equivalent contract if one is present; do not introduce a second lesson engine.

Suggested boundary:

- Inputs: question data, current answer draft, current evaluation, disabled state, motion preference, and resolved asset references.
- Events: draft changed, readiness changed, submit requested, and matching attempt evaluated where immediate feedback applies.
- Normalize results as `unanswered`, `draft`, `correct`, or `incorrect`; retain format-specific payloads underneath.
- Key ephemeral state by question ID. Reset on an actual question change, not on every render. Do not auto-advance when a tile is selected or a pair is completed.
- Grade by stable IDs. The supplied authored arrays identify answers; clone them before presentation shuffling. Never mutate answer-key arrays.
- Render only learner content in the interface. `sources`, `editor_note`, `points_policy`, `visual_direction`, and manifest status are implementation/editorial metadata.

## A. Multiple choice

Data: `options[]` with stable `id` and short `label`; `correct_option_id`.

1. Display one prompt and 2–4 short answer choices using existing raised answer buttons.
2. A tap/keyboard action selects exactly one choice. The learner can change it before grading.
3. Selected is an ungraded state: pale mint and teal border; no correctness icon yet.
4. Enable the existing Check action once an option is selected.
5. Grade once, retain the chosen answer, identify the correct answer after a mistake, and show the supplied explanation through the current feedback/Why design.
6. After evaluation, answers are locked and the footer becomes Continue according to the existing engine.

## B. Word-bank fill in the blank

Data: `prompt` containing one `___` for each blank, `tiles[]`, `blanks[]`, and `blank_order`.

1. Replace each `___` with a real accessible blank slot; render the word/phrase tiles as a separate wrapping bank underneath.
2. Treat each tile label as indivisible, including “Emperor Meiji” or “religious statues.” Do not split phrases into individual words.
3. Support tapping a bank tile to fill the active/next empty slot. Tapping a placed tile returns it to its original bank location. Allow changing a slot deliberately.
4. Support drag-and-drop as an enhancement, with clear target indication. Tapping and keyboard controls must work without dragging.
5. A placed tile disappears from the bank; optionally leave its neutral placeholder so the bank does not jump around.
6. Keep tile IDs stable and enforce single use. Do not duplicate a tile when moving it between slots.
7. Enable Check only when every slot is filled.
8. For `blank_order: fixed`, compare each slot with its `correct_tile_id`.
9. For `blank_order: interchangeable`, compare the selected correct-tile set with the expected set, ignoring their placement order. Either ordering of equivalent “A and B” answers is correct. This version contains no mixed ordered/interchangeable subgroups.
10. After grading, retain the learner's placement and show the supplied explanation. Show a correct placement after an error without silently rewriting the learner's original answer before it is acknowledged.

## C. Match pairs, including pictures and stickers

Data: `pairs[]`, each with `id`, `left.text`, optional `left.asset_id`, and `right.text`; `rounds[]` lists pair IDs for each round.

1. Display 2–3 pairs in two columns. Shuffle the left and right presentation independently once per round.
2. Cards can contain text, an image/sticker with its visible name, or a mixture. Preserve visible names in the provided image-assisted tasks; do not turn them into unsupported image-only tests.
3. Tap an item on either side and then an item on the other side. Same-side selection changes the pending choice.
4. A correct pair gives immediate small check feedback and becomes subdued/locked, while remaining readable.
5. A mismatch gives a brief nudge and accessible “Try another pair” feedback; reset the attempted selection without clearing earlier correct pairs. Use the lesson's supplied explanation when needed; do not invent distractor-specific facts.
6. Resolve pair identity by the shared pair ID, not text, card position, or picture filename.
7. Keep images within uniform card dimensions using `object-fit: contain` for stickers and an appropriate stable crop for photos. Do not crop away the landmark feature needed for learning.
8. Missing asset: retain the correct visible text label, optionally with a quiet image placeholder. Avoid broken-image icons or making the activity impossible. Asset slots remain marked incomplete in the finish report.
9. In a multi-round question, progress to the next round only through the existing footer action. Only after the final round is complete should the question count toward question progress. Shinkansen Q6 has two rounds (3 pairs + 2 pairs) but is **one** question.
10. Respect the existing app policy for whether a wrong pair affects energy or score. Emit an attempt event if needed; do not invent penalties. Prevent final completion being emitted more than once.
11. Explain/Why remains usable. Do not add a new competing explanation modal.

## D. Put in order

Data: `items[]`, `correct_order[]`, and `ordering_basis`; an optional `visible_context` stays available above the cards.

1. Render the event/step cards with numbered **positions**, not answer numbers permanently attached to an item.
2. Shuffle presentation at the start. For this prototype, if shuffling leaves a multi-item sequence fully correct, reshuffle once or rotate it; document this policy rather than treating initial presentation order as the answer.
3. Support drag reordering plus accessible Move up / Move down buttons or an equivalent fully keyboard-operable control.
4. Position numbers update when cards move. Item IDs and text remain unchanged.
5. Enable Check when the complete arrangement is available. Do not require a meaningless move just to enable it.
6. Compare the entire arranged ID list against `correct_order`. Two-card progressions are intentional in some beginner lessons.
7. Show clear correct/incorrect feedback through the shared system. Do not silently reorder the learner's cards before showing the result; a separate explained correct order is acceptable.
8. Keep the Shinkansen example itinerary visible for its supported task. Other cards deliberately omit dates that would give away recall answers.
9. Unit 7 uses neutral feedback, no confetti or celebratory sound. A topic's seriousness does not require a separate question component; use the unit's `feedback_mode`.

## Introductions and recaps

- All teaching content is supplied. Render the `steps` sequence exactly, including the second introduction mid-lesson.
- Use the existing informational screen/card pattern; add a small reusable intro body only if none exists. This is not a request for a new onboarding flow.
- Support the limited Markdown emphasis and paragraphs in introduction text using existing safe rendering conventions; do not show literal `**` characters or evaluate raw markup as code.
- `suggested_intro_assets` may be shown with the related text. Missing media must not hide the facts needed to answer.
- Match-card visual names should be introduced before the matching question. Prefer reusing the same corresponding asset in the lesson's introduction; this does not create a new scored step.
- Recaps are short memory summaries, not extra questions. Do not invent XP, completion accuracy, or learning claims.

## Visual styling and motion

Keep the current desktop layout and shared typography. Style the four interaction areas to match the existing raised buttons:

- Primary teal: use existing tokens, fallback `#116B6A`.
- Choice surface: existing white/light surface; border fallback `#DCE3E1`.
- Selected, ungraded: mint-tinted surface, teal outline, visible selection indicator.
- Roughly 14px corner radius, 2px border, and 3–4px downward shadow; keep layout dimensions stable.
- Retain existing success/error colors, icons, and correctness labels. Do not communicate status by color alone.
- Press: move down about 2px and reduce shadow by the same amount over 80–100ms; restore on release.
- Selection colors: 120–160ms transition.
- Correct: one subtle check pop, 180–220ms. Incorrect: one small 2–3px nudge, no more than about 200ms.
- Animations run once on an actual answer/attempt event, not every re-render or when opening Why.
- Reuse already implemented sound/feedback assets. Honor Sound on/off. Do not create duplicate sound playback or another feedback component.
- Respect reduced motion: omit movement and scale while preserving immediate state changes.
- Keep hover rules limited to hover-capable inputs. Provide visible keyboard focus and touch targets around 44px or larger.

## Validation required

Run checks suited to the actual repository. At minimum verify:

1. All 33 lessons are discoverable through the course path; intros, questions, and recaps render in order.
2. Each unit contains at least one ordering question, and course counts remain 195 questions.
3. Correct and incorrect single-choice submissions, locked graded state, and duplicate-submit protection.
4. Word-bank placement, return, cross-slot moves, keyboard/tap support, and duplicate-tile prevention.
5. Fixed-slot questions reject wrong placements; interchangeable-slot questions accept swapped correct tiles.
6. Matching handles either-side selection, mismatches, persistent correct pairs, and image fallbacks.
7. The five-pair Shinkansen review completes only after both rounds; progress increments once.
8. Ordering works with drag and accessible buttons, and evaluates stable IDs rather than labels.
9. Feedback does not advance automatically; Continue advances once.
10. Sound toggle, Why component, exit/resume, persistence, progress, and other existing courses still work.
11. Desktop layout is preserved; at 320px mobile width there is no clipped text or horizontal overflow.
12. Reduced-motion preference removes movement; Unit 7 remains restrained.

Prefer focused behavioral tests for these new interactions over snapshots that only repeat markup. Do not claim repository validation before running it in the actual repository.
