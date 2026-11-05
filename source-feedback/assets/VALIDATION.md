# Asset validation

- heart-break.svg: valid SVG XML; all vector references resolve; no embedded bitmaps.
- confetti-right.svg: valid SVG XML; all vector references resolve; no embedded bitmaps.
- incorrect-cross.svg: valid SVG XML; all vector references resolve; no embedded bitmaps.
- correct-check.svg: valid SVG XML; all vector references resolve; no embedded bitmaps.
- confetti-left.svg: valid SVG XML; all vector references resolve; no embedded bitmaps.
- correct-check-static.svg: valid SVG XML; all vector references resolve; no embedded bitmaps.
- Heart sample 120ms: geometry rendered; visible artwork stays inside 192×192 canvas.
- Heart sample 280ms: geometry rendered; visible artwork stays inside 192×192 canvas.
- Heart sample 450ms: geometry rendered; visible artwork stays inside 192×192 canvas.
- Heart sample 650ms: geometry rendered; visible artwork stays inside 192×192 canvas.
- correct-chime.wav: mono PCM 44.1kHz/16-bit; 0.300s; peak 7876/32767; no clipping; silent endpoints.
- incorrect-tone.wav: mono PCM 44.1kHz/16-bit; 0.280s; peak 7424/32767; no clipping; silent endpoints.
- Confetti pair contains exactly ten particle shapes; each one-shot ends at 700ms including its delay.
- Preview JavaScript passes node --check syntax validation.

Limitations: browser installation was unavailable in this environment. CSS animation playback, subjective audio quality, React runtime behavior and integration in the target app remain to be checked there. The heart images inspected here are sampled geometry renders, not browser screenshots.
