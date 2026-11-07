# Lessons 2-5 integration

The handoff records are adapted into the existing Essential course IDs essential-1-2 through essential-1-5. Each lesson has four interleaved modules, five topic practices, the prescribed review block, and the existing completion flow. Existing Lesson One source files and assets are unchanged.

## Reused components and contracts

- Existing lesson shell, theme variables, typography, word-bank and text-choice renderers, keyboard controls, sound preference, feedback sounds, grading, local progress, daily qualification and completion events.
- The established Lesson One responsive layout is reused through a scoped discovery class. Matching adds an explicit-check assignment variant; the previous matching format remains available to other lessons.
- Review appearances have separate instance IDs and responses; canonical IDs retain the original question, key and feedback.
- Existing attempts for the four replaced lessons are archived in legacyDiscoveryAttempts. Completed lesson IDs, other courses, dates and event history are retained.
- The Unit 1 check is available after the five lessons. It does not add a pass threshold or change the next unit's unlock rules. The attempt persists its seed, seven canonical IDs, all answer orders, drafts, evaluations and completion flag. Explicit retries archive the previous check attempt.

## Approved Tokyo alias substitutions

The current Tokyo lesson does not contain the handoff's capital-choice or tower-matching questions. The user approved these substitutions on this task:

- T1: q2-ieyasu (Ieyasu's role).
- T2: q1-edo (the existing Edo word bank, exact concept match).
- T5: q3-tokyo-tower (Tokyo Tower's broadcasting purpose).

All three reuse existing canonical question data, without editing Lesson One.

## Narration integration and remaining dependency

All 16 modules now use Lesson One's transcript tokens, playback controls and audio-clock player. The shared player accepts a validated discovery clip resolver; it never mounts on questions, reviews or the unit check. Real ended events use the established 750 ms delay. Unmount, mute, pause and manual navigation cancel pending transitions; a captured lesson/module identity guards advancement. Failed playback can be retried. Missing media disables Play, Replay and seeking while leaving Back/Next available and showing a concise status.

**Recordings ready: 0/16.** No synthesis or listening review was performed. The original voice is Piper en_US-lessac-medium, documented in source-lessons/tokyo-reviewed/docs/AUDIO_AND_MOTION.md. Its runtime and model are not bundled or installed in the searched workspace, Downloads, local Programs or Codex directories. No new recordings or alignment data were supplied. Browser speech and estimated cue timers are deliberately not used. No credentials are required for the documented local Piper engine; the missing dependencies are its executable/model and a real alignment workflow.

### Completing the media package

Generate one recording per module from the exact narration in lessons-2-5.json using Piper en_US-lessac-medium. Align the finished recording to that script using a real forced aligner, then listen and inspect pronunciation and synchronization. Preserve the scripts, including Japanese names and numerals.

Replace each missing record in narration.json with status ready, the existing SHA-256 scriptHash (UTF-8, no normalization), voice en_US-lessac-medium, src under /lessons-2-5/audio/, audioHash (SHA-256 of actual file bytes), measured duration in seconds, timingSource aligned-audio or provider-word-times, words and cues. Each cues[index] is [startSeconds,endSeconds] for words[index]. Use transcriptWords from src/tokyo/transcript.ts; punctuation stays outside token spans, and 3,776 remains one token spanning all its spoken words. No empty or placeholder source is provided for missing records.

Runtime validation rejects stale scripts, different voices, token mismatch, missing cues, invalid/nonmonotonic timings and cues past duration. The narration tests verify file hashes for ready entries. Before release, also verify measured browser duration and listen to every ready recording; metadata validity is not evidence of speech accuracy. Lesson One retains its existing trailing-highlight convention, assets and transcript content.

## Validation

See tests/discovery.spec.ts for selection coverage and persistence, assignment matching and corrections, per-appearance review grading, migration, all 31 artwork checksums, and correct/incorrect complete flows at desktop and narrow-phone sizes. Existing Essential and Tokyo regression suites cover neighboring lessons and Lesson One.
