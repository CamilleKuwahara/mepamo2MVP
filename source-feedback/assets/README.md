# Mepamo individual feedback assets

Use these supplied files directly. Do not trace the screenshots or invent replacement heart/confetti artwork. All SVGs contain native vectors and CSS motion, with no bitmap images, scripts, external fonts, or libraries. Audio is original synthesized local PCM WAV.

| File | Use | Lifecycle |
| --- | --- | --- |
| correct-check.svg | Leading correct-answer status | 180ms pop, then stays visible |
| correct-check-static.svg | Revealed correct answer after a mistake | Static, no pop |
| incorrect-cross.svg | Leading wrong-answer status | 180ms pop, then stays visible |
| confetti-left.svg | Five particles from left upper corner | 60ms delay + 640ms burst, then transparent |
| confetti-right.svg | Five particles from right upper corner | 60ms delay + 640ms burst, then transparent |
| heart-break.svg | Whole → crack → split → fade | 750ms, once, then transparent |
| correct-chime.wav | Bright two-note success tone | 300ms |
| incorrect-tone.wav | Soft descending feedback tone | 280ms |
| feedback.css | Card bounce, placement and popover styles | Copy/adapt classes into existing app |
| LessonPopover.tsx | Real React popover with positioning and keyboard dismissal | Reuse/adapt to repository conventions |
| preview.html | Working asset preview and replay controls | Serve locally to load SVG/audio files |

## Integration
Copy SVG/WAV files to the app's public asset directory, for example public/assets/mepamo-feedback/. Reference them with normal img/audio URLs. Never display the reference screenshots as app UI. Use the app's existing typography and grading/progress data.

Use the two confetti files TOGETHER on a correct answer for exactly ten total particles. Keep their 160×140 aspect ratio. feedback.css positions each canvas so its emitter sits at the answer card's upper corner. Render them in a pointer-events:none decorative layer, outside any overflow:hidden answer-card surface. Do not stretch one SVG across the whole answer card. The individual particle drawings remain the same size on all screen sizes.

Render check/cross at 28×28px with alt="" and an accessible status announcement on the host. During wrong-answer feedback, the correct answer's check is informational: use correct-check-static.svg to suppress its celebratory entrance, while the wrong card gets the cross. This avoids celebrating a revealed answer.

Place heart-break.svg in a 104×104px img in a stable 112px-tall feedback slot centered below the choices. Its drawing is about 67px wide inside that canvas. The blank SVG margin provides space for rotation and downward drift. NO circle/halo behind the heart. The heart is genuinely intact before the crack; the two halves use matching vector clip paths. The host slot must not cover Why? or Continue and should not appear/disappear with each result.

Mount transient img assets only on a newly validated answer event. In React, key the transient layer by a stable question/attempt identifier; ordinary rerenders must not change that key. Remove confetti at 700ms and heart at 750ms. A new key/remount starts the one-shot again. Static result icons remain visible. Do not replay restored historical results. Cancel pending cleanup when changing questions, and never let an old cleanup remove a new attempt's effects.

Correct-card scale is supplied in feedback.css as the temporary is-celebrating class, 1 → 1.02 → 1 over 250ms. Only apply it to the selected correct card once. Keep answer measurements, gap, and text size stable. The popover has an opacity-only entrance at full size.

Play the supplied WAVs from the answer-validation event via the existing audio system, respecting mute settings and browser autoplay restrictions. A rejected play() promise should be ignored safely. Stop/reset outgoing sound on navigation. Do not play from an unguarded React effect; that can double-play in development. Do not treat the audio or visual as a new grading/resource event.

Reduced motion is built into every SVG: icons stay visible without popping; heart and confetti are hidden. Apply the host CSS rule too to avoid a decorative empty image. Do not infer sound preference from reduced motion; use the existing mute setting.

## Lesson popover
LessonPopover.tsx is supplied as real editable UI, not an SVG with text. It needs React and react-dom, plus feedback.css. Pass an actual available lesson node as anchor, real title/counts, a stable unique id, and onStart/onClose callbacks. The trigger should have aria-expanded, aria-controls and aria-haspopup="dialog". After trigger activation focus moves to the CTA. Escape returns focus to the node; outside pointer dismissal leaves focus with the clicked target. Parent owns whether it is mounted. Close it before navigating. The component intentionally does not invent completed/locked lesson rules.

Keep placement responsive; do not scale the card to animate. The triangle follows the node, and the popover flips above when needed. On unusually tiny viewports where the whole card cannot fit, allow internal vertical scrolling rather than extending outside the viewport. Run checks in the target app.

## Preview
From this directory run python3 -m http.server 8000, then open http://localhost:8000/preview.html. Replay all visual effects and press each sound button. The page includes a reduced-motion preview toggle. This is a standalone asset demo, not a replacement lesson renderer.

## Validation scope
See VALIDATION.md for checks actually performed. Native vector output and sampled motion frames can be verified without claiming that browser playback, subjective sound quality or app integration has been validated. Final acceptance still includes the full checklist in the main handoff.
