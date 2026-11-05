# mepamo

A local, browser-based learning prototype built from the Mepamo visual PDF and the supplied Japanese World Heritage content ZIP. No deployment, account, or backend.

## Run

From this directory, with Node.js 22.12+:

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173. Stop with Ctrl+C.

```powershell
npm run build
npm test
```

The browser tests use the installed Windows Chrome executable configured in playwright.config.ts. Adjust that path on another computer. Production output is in dist/ and can be served by any static HTTP server. Do not open index.html directly from disk.

## Implemented

- Five lessons with all ten original teaching cards and 25 guided activities.
- Content array order and stable IDs preserved, including non-numeric question ordering.
- Two PDF-specified adaptations: JC-L01-Q2 sorting and JC-L03-Q3 one-to-one matching. The remaining 23 guided items and all ten final questions are unchanged.
- Choice and multipart drafts, full-draft gating, correct solutions and explanations, no forced retries, sequential unlocks, reviews, and end-of-content state.
- Ten-question final check with editable navigation, delayed feedback, objective breakdowns, review links, preserved first result, and practice attempts.
- Unlimited lessons and practice. One completed lesson or final check meets the daily goal; a missed calendar day breaks the streak without changing saved learning progress.
- Clicking current or completed path nodes opens an anchored, nonmodal Start, Resume, or Review popover. The current node has a rotating highlight that respects reduced-motion preferences.
- Same-browser progress, feedback resumption, daily qualification, local-date streaks, local events, visible storage failures, and confirmed reset.
- Responsive layouts, keyboard-operable activities, visible focus, locally bundled Nunito and Inter fonts, reduced-motion support.
- Question screens reserve viewport space for the action footer. All 23 guided single-choice questions were checked at 1280×540, 1440×800, and 390×844 without scrolling; longer explanations and unusually small windows can scroll within the content area while keeping the footer visible.

## Source and artwork

The supplied JSON is copied without edits to src/content.json. The original package is retained under source-content/. Activity adaptations and their explanations are separate in src/model.ts. The original content package's historical content-authoring-only instructions were treated as provenance; the user's current request was to build a website.

The ZIP supplied in this conversation contains content rather than the full visual handoff bundle. It does not include runtime-content.json, standalone transparent art, ACCEPTANCE_CHECKLIST.md, or qa/validate_content.py. The PDF supplied the visual and behavior requirements. The new asset kit in public/assets/mepamo/ contains 49 SVG reconstructions, transparent 2x PNG exports, a preview board, an asset index, geometry data, and component CSS. It was authored from the later supplied asset board and instructions at the user’s request. These are new reconstructions, not the missing original files. The app uses these SVG nodes and icons and real CSS controls. The mascot and Fuji have since been replaced with the supplied animated SVG artwork described below. Regenerate with node scripts/create-assets.mjs. PDF reference renders are in references/.

## Verification

TypeScript and Vite production build pass. Playwright exercises the whole course, wrong answers, editable multipart work, reloads, final resumption, score 8/10 with an objective at 0/2, first-result preservation, review unlocking, incomplete submission, keyboard interaction, local-day transitions, storage failure, corrupt data preservation, unlimited learning, and path popups. Structural checks verify the original content, counts, ordering, source IDs, and objective coverage. These replace the unavailable Python content validator. Screenshots are saved in test-results/ at 1440, 768, and 390 pixels.

## Limits

Progress belongs to this browser and content version; there is no cross-device sync. Clearing browser data removes progress. Device-clock changes affect streak dates. Unfinished drafts are retained separately for each lesson. Completed lessons and final results are retained. Content is the supplied draft, and the review target is provisional. Neither completion nor a score establishes certification readiness or validated learning outcomes.


## Supplied animated artwork

Original files are preserved in source-artwork/. The mascot’s drawing is copied to src/assets/mepamo_mascot_waving.svg without its embedded script or unscoped stylesheet; its colors, gradients, outlines and grey shadow remain unchanged. The head contour and two cream eye-panel paths were subsequently rounded to match the supplied close-up reference; both arms were then changed to rounded brown strokes with mint hands. Other paths, including the mouth, remain unchanged. Fuji is copied unchanged to public/assets/mepamo/artwork/mepamo_fuji_animated.svg.

- src/components/MepamoMascot.ts renders the mascot inline, generates unique SVG IDs, and uses the supplied 9-unit horizontal / 7-unit vertical tracking formula with inverse screen coordinates and requestAnimationFrame. It ignores touch movement, resets on page exit/blur/hidden state, and removes listeners and cancels pending frames when destroyed.
- src/components/MepamoFuji.ts renders the external CSS-animated SVG as a responsive image with an accessible label.
- src/components/artwork.css scopes the 2.4-second mascot wave and greeting animations and disables them and pupil easing for reduced motion. Fuji retains its supplied 3.6-second, 7-unit sun animation and reduced-motion rule.
- src/components/mountArtwork.ts mounts the artwork after src/main.ts renders a screen and provides cleanup before each replacement. The original artwork slot dimensions are retained; the drawings keep their supplied aspect ratios.

Usage: the mascot appears below the daily goal on Home at 180px width and on lesson completion at 120px. Fuji appears once beside the Home path in its existing 160px slot. Components support decorative mode or accessible labels. No animation library is used. tests/artwork.spec.ts verifies artwork geometry, page-wide tracking at multiple scales, touch exclusion, reset/cleanup, unique IDs, animation positions/timing, and reduced motion.

## Answer feedback handoff

The approved package is retained in source-feedback/. Supplied SVG/WAV files are served from public/assets/mepamo-feedback/. src/components/AnswerFeedback.ts controls event-driven, one-shot feedback and persisted sound muting; src/components/LessonPopover.ts positions the nonmodal node preview. Both are integrated by src/main.ts. Supplied styling is in src/feedback-assets.css, with responsive integration in src/feedback.css; path-interactions.css retains the mint node ring.

Guided answers lock on Check, show leading result indicators, and offer a collapsed Why? disclosure with the original explanations and sources. Correct responses use local confetti; incorrect responses show a brief decorative breaking heart, with no balance or penalty. Continue is immediately available. Sorting and matching preserve their grading and disclose complete mappings in Why?. Final-check answers remain ungraded until the entire check is submitted. Sounds default on, can be muted in the lesson header, and fail silently if browser playback is blocked. Motion is omitted for reduced-motion users. Effects are cleared on navigation and never replay for restored answers.

Feedback regressions cover deduplication, cleanup, optional explanations, mobile popovers, reduced motion, SVG animation phases and actual Chromium audio completion. Durable previews: screenshots/feedback-correct.png, screenshots/feedback-incorrect.png, screenshots/lesson-popover.png. Browser audio playback is checked programmatically, not subjectively auditioned. An interaction video was not recorded because the Playwright video encoder is not installed.

## Essential: Know Japan course

Choose **Essential: Know Japan** on the learning path, or open `http://127.0.0.1:5173/?course=essential`. The original Japanese World Heritage course remains available in the same course selector with its existing content, final check and progress.

The original package is retained under `source-lessons/Mepamo_Codex_Lesson_Handoff/`. `src/essential-content.json` and `src/essential-assets.json` are unchanged copies of its authoritative JSON. The course contains 7 units, 33 lessons, 65 introductions and 195 questions: 98 multiple choice, 62 word bank, 24 matching and 11 ordering. Tokyo retains its three-question exception. Every lesson follows its supplied `steps`, including mid-lesson teaching and the final recap.

Implementation files:

- `src/essential/model.ts`: typed content adapter, draft/readiness/grading operations, one-use word tiles, independent matching-round shuffles, ordering shuffles and save validation. If an ordering shuffle starts fully correct, it is rotated once; answer keys remain untouched.
- `src/essential/questions.ts`: reusable format renderers, safe emphasis/paragraph rendering, optional explanations, source links, and media resolution.
- `src/essential/essential.css`: locally scoped question-format and course-path styles using the existing theme.
- `src/main.ts`: course selection, additional steps in the existing lesson engine, shared shell, anchored lesson previews, draft actions and drag enhancement.
- `src/model.ts`: optional Essential progress within the existing save, preserving older saves. Attempts retain stable lesson/question/tile IDs, step position, evaluations, matching progress and presentation order. Both courses share the existing daily qualification, streak, event logging and storage-error behavior. Completing a matching round does not complete a question. Completing a lesson qualifies the day once, regardless of format. The existing reset clears both courses and now says so explicitly.
- `src/components/AnswerFeedback.ts`: optional restrained feedback for Unit 7 (no celebratory sound, confetti, heart or pop/nudge), with existing sound preference and cleanup elsewhere. `LessonControls.ts` extends keyboard press handling to the new buttons.
- `tests/essential.spec.ts` and `scripts/validate-essential.mjs`: content integrity and browser interaction checks. The Node validator mirrors the supplied Python checks because Python is not installed on this machine; the original Python script remains unchanged.

Tap and keyboard operations are available for every format. Word-bank tiles can be returned or dragged between slots or back to the bank; ordering provides drag and named Move up/down controls. Matching accepts either side first and preserves successful pairs after mismatches and reloads. Shinkansen's two rounds remain one graded question. Why stays optional, and results never auto-advance.

The one existing illustration that correctly resolves a manifest slot is Mount Fuji, using the supplied animated Fuji SVG. The other **20 image slots use the manifest's text fallbacks** and are not completed photo/sticker versions:

`tokyo-city`, `tokyo-tower`, `kyoto-machiya`, `osaka-food-trade`, `shinkansen`, `shibuya-crossing`, `hachiko`, `sensoji`, `nakamise`, `kaminarimon`, `tokyo-skytree`, `meiji-jingu`, `kiyomizudera`, `kinkakuji`, `fushimi-inari`, `gion`, `ramen`, `sushi`, `tempura`, `izakaya`.

No missing image is replaced with unrelated artwork or an invented URL. All activities remain usable with visible text. The Kyoto observation question retains the supplied wooden-townhouse fallback beside the prompt. Missing media and editorial/source metadata are not shown as implementation warnings in learner flows.

Checks include a complete 33-lesson/195-question browser walkthrough, authored teaching order, one-time completion, preservation of heritage progress, wrong-choice/word-bank feedback, fixed and interchangeable slots, keyboard/tap and drag, matching mismatch and multi-round resume, ordering, sound preference, neutral Unit 7, 320px width and reduced motion. Previews are saved under `screenshots/essential-*.png`.
