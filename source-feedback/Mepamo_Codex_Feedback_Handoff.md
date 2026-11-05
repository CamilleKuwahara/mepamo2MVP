# Mepamo 2.0 — lesson feedback and lesson-node popover
Implementation handoff · November 4, 2026

## Task for Codex
Implement the approved UI and motion below in the existing mepamo app. First inspect the repository instructions, framework, lesson renderer, answer validation, progress persistence, sound settings, and learning-path components. Reuse existing components and design tokens where appropriate. Deliver working behavior, not screenshots embedded as UI.

This handoff defines presentation and interaction changes. Preserve existing grading, lesson content, saved progress, unlock rules, and energy/life accounting. Do not introduce new penalties, XP awards, retry rules, or a new currency. The heart is the approved visual reaction; it does not authorize changing the resource model.

## Reference files
| Reference | Purpose |
| --- | --- |
| references/01-correct-answer.png | Correct-answer appearance during the confetti burst |
| references/02-lesson-popover.png | Compact node-anchored lesson preview |
| references/03-incorrect-answer.png | Wrong and correct answer highlighting; whole-heart first frame |
| references/04-heart-storyboard.png | Whole heart → crack → split → fade |

These are visual references, not source assets or literal responsive measurements. Follow the behavior and timing below where a still image is ambiguous. Do not recreate image-generation textures or distortions. Use crisp native UI and editable vectors. The previously rejected mascot/Fuji/button SVG pack is not part of this handoff.

## Supplied implementation assets — use directly
The handoff now includes actual assets in assets/. Use these instead of reconstructing the artwork from reference images.

| Files | Required use |
| --- | --- |
| assets/heart-break.svg | Intact heart → crack → two halves → fade, 750ms; no circle/halo |
| assets/correct-check.svg | Correct-answer status, 180ms pop |
| assets/correct-check-static.svg | Reveal the correct answer after a mistake without a success pop |
| assets/incorrect-cross.svg | Wrong-answer status, restrained 180ms pop |
| assets/confetti-left.svg + assets/confetti-right.svg | Use together: five particles each, ten total, gone by 700ms |
| assets/correct-chime.wav + assets/incorrect-tone.wav | Original short sound assets; respect mute settings |
| assets/feedback.css | Card bounce, decorative placement, popover styling |
| assets/LessonPopover.tsx | Editable React popover component; adapt to the repository |
| assets/preview.html | Standalone replay page with sound buttons and reduced-motion preview |
| assets/README.md | Exact mounting, cleanup, sizing and accessibility instructions |
| assets/VALIDATION.md | Checks actually completed and remaining runtime checks |

The heart SVG canvas is 192×192 with motion margins. Render the img at 104×104 CSS px: the visible heart is approximately 67px wide. A stable 112px feedback slot holds it. Confetti SVG canvases are 160×140 each: do not stretch a single burst across the entire card. The popover is actual HTML/CSS/React rather than an SVG screenshot. Keep the white background and existing typography.

Asset checks cover SVG structure, sampled vector frames, particle count, preview JavaScript syntax and audio encoding/clipping. Browser playback and target-app integration still need verification. Follow assets/VALIDATION.md rather than assuming the screenshots prove runtime behavior.

## 1. Answer feedback: shared behavior
Keep the white lesson page, question, answer choices, header/progress, and teal Continue button. Replace the large success/error explanation panel with feedback on the answer choices themselves.

- Before submission, preserve the existing selection and submission behavior.
- After validation, show the result immediately and lock the graded response.
- Keep one leading status icon per relevant answer card; replace its radio indicator with that icon.
- Remove the redundant success banner, repeated correct-answer sentence, and footer motivational slogan.
- Make explanations optional on both correct and incorrect answers through a small “Why?” disclosure below the choices, collapsed by default.
- Opening Why? reveals the existing explanation, with sources/further reading nested inside when available. It does not regrade or replay motion. If explanation content is absent, do not invent it or show an empty disclosure.
- Keep Continue enabled as soon as the answer result is available. Never require watching an animation, opening an explanation, or waiting for sound to finish.
- Reset explanation and transient feedback when the question changes. Cancel outgoing effects before displaying the next question.
- No automatic advance. Keep the correct answer visible until Continue is used.

### Correct result
Selected correct card: pale mint fill, teal border, one white check in a solid teal circle at the leading edge. Other cards remain neutral. Omit the trailing “Correct” label because the check and state already communicate success.

On the initial validated result only, synchronize:
1. Card highlight.
2. Checkmark pop.
3. Short bright chime, once.
4. Subtle selected-card bounce.
5. Local mint/teal/gold confetti.

### Incorrect result
- Selected wrong card: pale coral fill, coral border, leading white × in a solid coral circle, small trailing “Your answer” label.
- Correct card: pale mint fill, teal border, leading white check in a solid teal circle, small trailing “Correct answer” label.
- Other cards remain neutral.
- Fade the correct-card state in over about 150–200 ms. The × can appear with a restrained pop.
- Play a short, soft incorrect-answer tone once. No success chime, confetti, or celebratory card bounce.
- Play the whole-heart-to-broken-heart sequence described below.
- Red background is confined to the selected wrong card. The heart has NO background circle, halo, panel, backdrop, or full-page red fill.

## 2. Correct-answer animation
All timing is relative to validated result arrival. These are implementation targets, not measurements of Duolingo.

| Element | Motion | Timing |
| --- | --- | --- |
| Card | Scale uniformly 1 → 1.02 → 1; restrained ease-out settle | 0–250 ms |
| Checkmark | Scale 0.7 → 1.08 → 1, opacity 0 → 1 | 0–180 ms |
| Confetti | Exactly 8–12 pieces total, divided between the two upper card corners; burst outward/up, rotate, then fall and fade | Start by 100 ms; entirely gone by 700 ms |
| Sound | One short bright chime at comfortable volume | At result onset |

Use mostly small rounded paper rectangles, with optional sparse stars. Suggested colors: mint #B5EAD3, teal #116B6A, gold #FDBD2B. Keep the effect local to the selected card and clear of text. No full-screen shower and no looping.

Animate transforms/opacity on a visual layer without changing layout measurements. Neighboring cards, text, and the footer must not jump. Scale only the selected card, never the entire page. Reduce scale slightly on narrow screens if necessary to prevent edge clipping. Remove temporary shadow/lift after settling; leave the mint state and check.

## 3. Incorrect-answer heart animation
A coral-red whole heart appears first, THEN cracks and breaks into exactly two halves. Never start with an already broken heart.

| Phase | Timing | Required behavior |
| --- | --- | --- |
| Appear | 0–180 ms | Intact heart pops in, with no crack or seam visible |
| Crack | 180–350 ms | Zigzag crack reveals from the top valley toward the bottom tip |
| Split | 350–550 ms | Matching halves separate around 8–12 px total and tilt outward about 8° |
| Fade | 550–750 ms | Halves drift down slightly and fade to zero opacity; remove effect |

Implementation guidance:
- Use the supplied assets/heart-break.svg, which has two matching vector clip regions. Keep a complete intact heart visible until the crack stage to avoid an unintended initial seam.
- Preserve the same silhouette and dimensions across phases. A small entrance scale is allowed; no morph into a different heart shape.
- Heart width: approximately 64–80 CSS px. The screenshot/storyboard enlarges it to communicate the design.
- Position it at the horizontal center of the main lesson content, in the open feedback area below the choices, as in the reference. This is not a full-screen modal or a viewport-centered overlay over the question text.
- Keep that feedback area stable and allow sufficient vertical clearance on mobile. Do not push the footer or answer cards when the heart appears/disappears.
- The effect must never cover answer text, Why?, or Continue. Decorative layer uses pointer-events:none.
- Pure white/transparent space behind the heart. No red circle, glow, full-screen tint, confetti, or screen shake.
- Play once per validated incorrect response, then disappear. Keep the answer highlights visible.
- Do not add a life counter or “−1 heart” text unless that behavior already exists in the app.

## 4. Lesson-path popover
Replace the centered lesson-preview modal with a compact popover anchored to the selected path node.

### Appearance
- Deep teal background, white text, rounded corners, subtle shadow if needed.
- Small triangular pointer aimed at the selected node.
- Approximately 300–320 CSS px wide on desktop, clamped to the viewport on smaller screens; use content-driven height.
- Left-aligned title, lesson position, saved activity count, and one full-width white CTA with teal text.
- Example resumed lesson:
  - Read the buildings
  - Lesson 3 of 5
  - 1 of 5 activities completed
  - Resume lesson ›
- Use real lesson metadata and progress. Use “Start lesson” for an unstarted available lesson and “Resume lesson” for an in-progress lesson. Preserve the existing completed/locked-lesson behavior.
- Do not repeat the star icon inside the popover or include “Pick up right where you left off.”
- Page remains white, sharp, and fully visible. Remove modal backdrop, blur, and dimming.

### Interaction and positioning
- Clicking/tapping an available node opens its popover.
- Same node toggles it closed; another node changes the active popover. Only one open at a time.
- Outside click/tap and Escape close it. CTA opens/resumes the lesson using existing routing and saved progress.
- Place below the node by default, above if space is insufficient. Shift horizontally to stay within viewport gutters; arrow must still point to the node.
- Overlay the path without shifting its layout. Avoid clipping from scroll containers; use the existing positioning solution or a portal if needed.
- Recalculate position on scroll, resize, and orientation changes. Do not hijack scrolling.
- Fade opacity over 120–150 ms at final size. NO scale, zoom, stretching, layout morph, backdrop animation, or blurred text.
- Starting a lesson must not stretch the popover into the lesson screen. Use a stable route change or the existing simple page fade.

## 5. Styling, accessibility, and lifecycle
Suggested palette; reuse suitable existing tokens and verify contrast:
| Role | Color |
| --- | --- |
| Primary teal | #116B6A |
| Mascot mint / confetti | #B5EAD3 |
| Correct background | #EFF9F4 |
| Gold confetti | #FDBD2B |
| Coral heart | #FF6B5E |
| Wrong background | #FFF2EE |
| Dark error text | #A83224 |
| Page | #FFFFFF |

- Preserve the app's existing rounded typography/Nunito where available; no screenshots as backgrounds, heavy gradients, or texture.
- Keep answer heights content-driven with consistent spacing. Long answers and trailing labels must wrap without collision or truncation.
- Keep Continue visible/reachable without covering content; account for mobile safe areas and shorter viewports.
- Identify results with icons and accessible text, not color alone. Announce one concise result through a polite live region.
- Confetti and heart are decorative and hidden from screen readers.
- Why? must be a real keyboard-operable disclosure with aria-expanded and an associated panel.
- Popover trigger exposes its open state. Keep CTA reachable by keyboard. Escape returns focus to the triggering node; avoid trapping focus as though it were a blocking modal.
- Respect prefers-reduced-motion: keep static result indicators, omit confetti/bounce/heart sequence, and show/hide the popover without motion.
- Respect existing mute/sound settings. Reuse existing sound assets/system if possible; if absent, add lightweight local or synthesized tones with safe browser audio handling. Sound failure must never interrupt the lesson. No remote sound dependencies.
- Trigger effects from a validated answer event with a stable question/attempt identifier, not a generic render effect. Prevent duplicate audio/particles on rerender, development Strict Mode, disclosure toggle, resize, or restored results.
- Cancel animation handles, timers, particles, and sounds on question change, navigation, and unmount. Fast Continue must not carry feedback onto the next question.
- No new animation library unless the existing stack cannot reasonably support this. Reuse the current motion system or native CSS/SVG/Web Animations.

## 6. Acceptance checks
Verify in the running app, not only by reading code:
- Correct result has mint card + one check; subtle bounce; one chime; 8–12 local particles gone by 700 ms.
- Wrong result distinguishes both chosen and correct answers; optional Why? remains collapsed.
- Heart is visibly whole first, then cracks, splits, and disappears by about 750 ms. No circular background behind it.
- Continue works during either animation; next question has no leftover effects.
- No duplicate grading, reward, resource deduction, animation, or sound.
- Explanation toggles do not replay feedback; sources remain accessible inside the optional panel.
- Popover is attached to the right node, stays in bounds near every edge, closes correctly, and resumes actual saved progress.
- No background blur/dimming or stretched page/popover transitions.
- Desktop and narrow mobile widths (including about 390 px), short screens, long answer text, keyboard navigation, reduced motion, and muted sound work.
- Correct feedback and the popover do not shift surrounding layout; transient heart space does not cause a jump.
- Run relevant existing checks. Add focused regression coverage for event deduplication/state reset and positioning where supported; avoid tests that simply mirror CSS constants.

## 7. Completion report
Report the files changed, behavior implemented, checks actually run, and any remaining limitations. Include screenshots of correct and incorrect states and an interaction recording if the environment supports it. Do not claim motion or audio was verified if it was only statically inspected.

