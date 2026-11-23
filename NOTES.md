# Notes

## Learner and preferences
- Learner: Maya, Year 8 (KS3, UK). Works through lessons **on her own**; Claude answers follow-up questions.
- The parent set this up. Priority is a **strong mental model** plus practice, with no deadline. Explain *why* before *how*.
- British English and UK school language: "expand", "simplify", "term", "like terms", "multiply out".
- **Personal:** address Maya by name (hero greeting, praise via `Lesson.praise()`, finish messages). Set `<html data-learner="Maya">`. Story characters in questions (e.g. Sam) stay other people.
- Quizzes: a wrong first answer gets a hint (`data-hint`) and a second go; reveal only after the second miss.
- Subtle sound effects (`sounds.js`, with a mute toggle; the quiz has its own select/hint/correct/reveal/done sounds) and grab/grabbing cursors on anything draggable.
- **Feedback 2026-11-23 (from parent):** reading-heavy lessons don't work. Wanted: much more hands-on interaction (drag things around), short videos embedded (BBC Bitesize, YouTube Shorts etc.), friendly formatting for a 12-year-old, and whimsical animations in the spirit of Josh Comeau's work. Every lesson should be mostly *doing*, with only a line or two of text per step.

- Instructions: every activity says **How to play** in one line, mentions the tap alternative to dragging, defines any new word (e.g. "term") before using it, and ends with a pointer to what's next.

- **Responsive:** every page must work from 320 px phones (portrait and landscape) up to desktop, with no sideways scroll. Tiles size with `--u` (clamp), long sums get a `<br>` rather than overflowing, and the video pop-up fits the viewport height. Check each new lesson at 320, 375, 768 and 1280 px.

## Teaching approach
- The area model (rectangle) is the main mental model for every bracket lesson, from single brackets through to double brackets (the grid method is the same picture).
- Self-check habit: substitute x = 10 into the question and the answer. Reinforce it in every lesson.
- Each lesson: knowledge → typed practice with instant feedback (practice.js) → quiz from memory (quiz.js).

## Lesson shape (since lesson 1 v2)
Step cards with a sticky emoji "journey" bar: 🎬 watch (short video) → 🧱 build (tiles) → 👉 drag game → 🕵️ sort/spot the mistake → ✏️ typed practice → 🧠 quiz from memory. 1-2 sentences of text per card.

## Components (./assets)
- `course.css`: friendly theme (Fredoka + Nunito, lavender/pink/teal), cards, journey bar, video cards, light/dark, print
- `lesson.js`: `Lesson.done(step)` ticks the journey bar (localStorage); `Celebrate.burst()` confetti; `button.video[data-yt]` video cards open in a pop-up player (modal); from file:// the pop-up shows a 'Watch on YouTube' link instead
- `whimsy.js`: auto springy hover "boops", sparkles on good feedback / right answers, spring-in cards, `[data-sparkles]` twinkles. Respects reduced motion
- `sounds.js`: `Sound.play(name)` (pick, drop, tap, correct, wrong, fanfare), Web Audio synth, mute toggle, remembered per browser. Include before lesson.js
- `drag.js`: `Drag.attach(el, {targets, onDrop, onTap})`. Pointer events, so mouse and touch both work, and tap works as a fallback
- `tiles.js`: `TileBuilder.mount(el, {a, b, letter, onDone})`. Algebra tiles: build a row, drag copies, count
- `distribute.js`: `Distribute.mount(el, {rounds, generate})`; `Distribute.single(a,b,L)`. Drag the multiplier onto each term with rainbow arrows; terms support `sign` for negatives later
- `sort.js`: `Sort.mount(el, {bins, cards})`. Drag cards into bins
- `area-model.js`: `AreaModel.render(el, {outer, parts, reveal, showTotal})`
- `expr.js`: reads typed answers like "3x + 12" (single letter terms only for now; extend for x², negatives already work)
- `practice.js`: `Practice.mount(el, {goal, generate})`; generator gives prompt, answer, optional diagnose/explain
- `quiz.js`: `.quiz[data-answer][data-why]` multiple choice
- Maya opens lessons by double-clicking `Open Lessons.command` (local no-cache server on :8765 → index.html, so lesson updates show without a hard refresh). That way YouTube plays inside the page; from file:// videos open in a new tab instead.
- To test in the preview pane, run `python3 -m http.server 8765 --bind 127.0.0.1` from the shell (the preview launcher can't read ~/Documents), then use real `left_click_drag` to test drags.

## Planned sequence (adjust to evidence)
1. ✅ Brackets are rectangles: a(x + b), positives only
2. Minus inside: 4(x − 3). Area model with a "take away" piece
3. Negative outside: −2(x + 5), −2(x − 5). Sign rules for multiplying
4. Expand and simplify: 3(x + 2) + 2(x − 1), and subtracting a bracket
5. Letter outside: x(x + 3), 2y(y − 4)
6. Double brackets with the grid (area model): (x + 2)(x + 3)
Interleave earlier types into each new practice set (spacing).

## Glossary
- No GLOSSARY.md yet. Add "expand" and "term" once Maya has used them correctly.
