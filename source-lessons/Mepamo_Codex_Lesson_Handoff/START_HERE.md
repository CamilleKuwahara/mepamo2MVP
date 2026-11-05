# Codex task: implement Mepamo Essential lessons and four question formats

The website already has UI components and a lesson shell. It does **not** have this new lesson content or all the question-type components. This package supplies the content and implementation requirements; it is not prebuilt application code.

All lesson text is included here. Codex does not need earlier chat messages or the earlier lesson documents to reconstruct the course.

## Deliverable

Integrate the included Essential course (Units 1–7) and implement the four reusable question formats **inside the existing lesson website**. Reuse the current layout, theme, and shared components. Finish an end-to-end working course rather than only creating static component examples.

Start by inspecting repository instructions, project framework, existing lesson route, lesson state, current question renderer, answer styles, shared footer actions, audio preferences, and progress persistence. Use the project's conventions. No repository was available when this handoff was authored, so component names and data adapters below are conceptual, not claims about existing files.

## Files and authority

| File | Use |
|---|---|
| `lesson-content.json` | Authoritative content data: all intros, questions, options/tiles, correct answers, recaps, teaching order, and source IDs. |
| `LESSON_CONTENT.md` | Human-readable complete content, equivalent to the JSON. |
| `COMPONENT_REQUIREMENTS.md` | Behavior, UI states, integration boundaries, and acceptance checks. |
| `asset-manifest.json` | Required/suggested visual references and explicit fallback labels; actual image files are not included. |
| `QUESTION_TYPE_ASSIGNMENTS.md` | Editorial rationale and question-format map. Its teaching additions are **already merged** into `lesson-content.json`; do not append them a second time. |
| `validate_content.py` | Local integrity check for the supplied content data. |

If editorial notes differ from the final machine-readable question, use `lesson-content.json` for display, grading, and sequence, then document the discrepancy. Never reconstruct correct answers by guessing from option order or filenames.

## Implement in this order

1. Inspect and reuse the current lesson shell and grading/progress mechanisms. Keep existing course data and routes intact; add this course through the existing content registration pattern.
2. Import `lesson-content.json` through a small adapter if its schema differs from the current app. Keep content separate from components. Preserve stable content IDs; map them to existing identifiers where appropriate.
3. Add/reuse reusable renderers for `multiple_choice`, `word_bank`, `match_pairs`, and `ordering`.
4. Render each lesson using its explicit `steps` array: introduction, questions, any later introduction, then recap. Introductions and recaps are not scored questions. `before_question` tells where each teaching block belongs.
5. Connect grading and completion to existing progress and persistence. A question counts once; one match does not count as one whole question. Disable repeat submission during transitions.
6. Resolve available visual assets against `asset-manifest.json`. Use correctly identified existing assets if available. Otherwise render the supplied text fallback and record the missing asset; continue implementing the full interaction. Do not fetch or generate unrelated images, invent image URLs, or use a visually misleading substitute.
7. Verify all four interactions, complete at least one representative lesson per format, and confirm ordering coverage in all seven units. Run relevant existing checks and the content validator.

## Preserve the current website

- Keep the website's content width, alignment, responsive breakpoints, header, logo, exit control, sound control, progress bar, and footer layout.
- Keep the question title, instructions, explanation/Why component, and existing app typography conventions.
- Keep the primary action at the bottom right on desktop. Retain the existing mobile layout rather than wrapping the lesson in a phone mockup.
- Extend existing components locally. No global button restyling, site redesign, new subscription flow, unrelated refactor, or changes to other courses.
- Preserve existing energy/streak/scoring/audio policy. If the policy cannot represent a new format, adapt its integration at the boundary and describe the change; do not silently invent a new reward model.

## Known content decisions

- The package has **33 lessons, 195 questions, and 65 introduction sections**.
- Tokyo has the user's supplied **3 questions**; all other lessons have 6. Keep this exception. Do not duplicate questions merely to reach six.
- Ordering counts are **1 in each of Units 1–6, and 5 in Unit 7**: 11 total.
- Unit 1's Shinkansen ordering question includes a visible sample itinerary. It is not a claim that every journey must follow that route.
- The Tokyo Tower teaching sentence and the five new sequence-teaching sentences are already inserted in the correct introductions.
- Text is suitable for editorial implementation review; this package does not claim learner-tested memory outcomes or exam accreditation.
- Twenty-one visual asset slots are listed. No photograph/sticker binaries are bundled. This is the only visual completion gap; the supplied text fallback should keep every question usable.

## Finish report

Report files changed, how the new data connects to existing lesson state, which interactions were verified, the checks run, and unresolved asset slots. Distinguish a working text fallback from a completed photo/sticker version. Do not claim images, animation, persistence, or keyboard operation were tested if they were not.
