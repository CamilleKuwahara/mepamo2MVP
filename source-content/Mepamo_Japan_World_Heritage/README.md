# mepamo — Japan World Heritage content

Start with Japan_World_Heritage_Lessons.md for the full readable course. The JSON file contains the same teaching content and answer keys as structured data for later use.

The current request is content authoring only. Do not create website code, change UI designs, or generate images from this pack.

Scope: five lessons; two teaching passages and five guided questions per lesson; one ten-question final check; one optional reflection. The course is written in English and uses five real Japanese World Heritage properties.

This content replaces Scrum as the current MVP placeholder topic. The earlier design handoff used an eight-question check; this course has TEN final questions, two per objective. Use the new course data for counts and content. Do not reuse Scrum lesson completions or scores for this course.

Use the stable course, lesson, question, option, and objective IDs. Score using correctOptionId. Guided feedback appears after each answer. Final feedback appears after full submission. The provisional 8/10 learning target is a review signal and does not block completion.

No UI or website implementation is included. No designs or images have been changed.

## Required question progression

Every lesson has five questions in a fixed easy-to-hard order. Start with direct recall or recognition; finish with the most demanding comparison, application, or causal reasoning item. The final check also progresses from easier items to the most demanding scenario.

Use the questions array as authored, or each item's explicit order field. Do not randomize questions or sort by stable question ID. The stable IDs remain unchanged even when a question moves. Correctness remains keyed to correctOptionId. Difficulty ranks are intended author judgments to refine with learner testing.
