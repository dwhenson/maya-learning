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
- `tiles.js`: `TileBuilder.mount(el, {a, b, letter, sign, onDone})`. Algebra tiles: build a row, drag copies, count. `sign: -1` adds red −1 tiles (tray offers +1 and −1, so picking the sign is part of the task)
- `distribute.js`: `Distribute.mount(el, {rounds, generate})`; `Distribute.single(a,b,L)` for a(x + b), `Distribute.minus(a,b,L,numberFirst)` for a(x − b) / a(b − x). A `sign: "-"` term is drawn with its minus inside the term box ("the minus sticks to its term")
- `sort.js`: `Sort.mount(el, {bins, cards})`. Drag cards into bins
- `area-model.js`: `AreaModel.render(el, {outer, parts, reveal, showTotal})`. A part with `take: true` is a striped piece cut out of the previous one (a(x − b))
- `hops.js`: `Hops.mount(el, {times, step, onDone})`. Frog hops on a number line to show 4 × (−3) = −12
- `expr.js`: reads typed answers like "3x + 12" (single letter terms only for now; extend for x², negatives already work)
- `practice.js`: `Practice.mount(el, {goal, generate})`; generator gives prompt, answer (shown exactly as written, so write it in the question's order), optional diagnose/explain
- `quiz.js`: `.quiz[data-answer][data-why]` multiple choice
- `numberline.js`: `NumberLine.render(el, {from, to, label})`. A hop on a number line (used in practice explains for directed numbers)
- `factor.js`: `RowDeal.mount(el, {xs, ones, letter})` deals tiles into equal rows (factorising as sharing); `Factorise.mount(el, {rounds, generate})` + `Factorise.round(h, p, q, L, minus)` drag the HCF outside the bracket
- `triangle.js`: `TrianglePlay` (drag corners, angles sum to 180°), `Balance` (solve a·x + b = c by doing the same to both sides), `TriangleEq` (angles → equation → collect → balance → check); `TriangleEq.draw(svg, pts, labels)`
- `percent.js`: `PercentBar.mount(el, {rounds:[{item, price, change}]})` stretchy 10%-block price bar (price hidden until she picks it); `PercentBar.money(n)`
- `busstop.js`: `BusStop.demo(el, {d, n})` worked example; `BusStop.game(el, {onLevel, onDone})` 6 levels × 5 sums, number pad, stars, timer, best times (localStorage `busstop:v1`)
- Practice questions can have `promptHTML`, `show`, `before` and `check(text)` for answers Expr can't read (brackets, money, x = …). Tile styles live in course.css.
- `feedback.js`: Netlify Forms "How did it go, Maya?" form (mood + message, no name/email). The form markup must be written in each page's HTML (Netlify only detects static forms); copy it from a lesson and change the hidden `page` value. It replaced the old "Ask Claude" box, because Maya uses the lessons in a browser without Claude. Only works on the live site, not the local server.
- Maya opens lessons by double-clicking `Open Lessons.command` (local no-cache server on :8765 → index.html, so lesson updates show without a hard refresh). That way YouTube plays inside the page; from file:// videos open in a new tab instead.
- To test in the preview pane, run `python3 -m http.server 8765 --bind 127.0.0.1` from the shell (the preview launcher can't read ~/Documents), then use real `left_click_drag` to test drags.

## Extras
- `lessons/extra-negative-numbers.html`: a short negative numbers warm-up (which way, add/subtract, sign rule, times/divide). Linked from Lesson 2 and the home page. Point Maya here whenever directed numbers trip her up.

## Lessons so far (2026-11-24)
1. Brackets are rectangles · 2. Minus inside · 3. Factorising (HCF) · 4. Triangle equations · 5. Percentage change (money) · 6. Bus stop division (game). The home page groups them by topic.
Lessons 3–6 were requested together by the parent; each stands alone. Lesson numbers are just creation order.

## Planned sequence for brackets (adjust to evidence)
1. ✅ Brackets are rectangles: a(x + b), positives only
2. ✅ Minus inside: 4(x − 3). Frog hops for 4 × (−3), red −1 tiles, take-away area piece. Practice is 60% a(x − b), 15% a(b − x), 25% Lesson 1 type
3. Negative outside: −2(x + 5), −2(x − 5). Sign rules for multiplying
4. Expand and simplify: 3(x + 2) + 2(x − 1), and subtracting a bracket
5. Letter outside: x(x + 3), 2y(y − 4)
6. Double brackets with the grid (area model): (x + 2)(x + 3)
Interleave earlier types into each new practice set (spacing).

## Glossary
- No GLOSSARY.md yet. Add "expand" and "term" once Maya has used them correctly.

## App (PWA) on Maya's iPhone 12, landscape only (2026-11-24)
- Maya uses the site as a Home Screen app on an **iPhone 12, held landscape (844 × 390)**. No other phones. Design every new activity so the part she interacts with fits in ~360 px of height; put picture and controls side by side. Shared rules live in course.css under `@media (orientation: landscape) and (max-height: 500px)`; component-specific ones in each component's CSS. Desktop and portrait still work.
- Safe areas: `viewport-fit=cover` + `env(safe-area-inset-*)` padding on `main` and the sound button.
- Every page's `<head>` has the PWA tags (manifest, apple-touch-icon, theme colour, `assets/pwa.js`). Copy them into any new page.
- Offline: `sw.js` (network first, cache fallback). `build.sh` (Netlify build) copies public files to dist/, stamps sw.js with the commit, and writes `precache.json` listing every file, so new lessons are cached automatically. Videos and the feedback form need internet (the video pop-up says so offline).
- Fonts are self-hosted in assets/fonts (latin subset, OFL). Icon source: icons/icon.svg (rendered with `qlmanage`, resized with `sips`).
- Home Screen app storage is separate from Safari's, so stars/progress made in Safari don't carry over.

## Publishing
- Live site: https://maya-learning.netlify.app (Netlify, deploys automatically on every push to `main`)
- Repo: https://github.com/dwhenson/maya-learning (public, by the parent's choice)
- `build.sh` (run by netlify.toml) copies only `index.html`, `manifest.webmanifest`, `sw.js`, `lessons/`, `assets/`, `reference/`, `icons/` into `dist/`, so NOTES, MISSION, RESOURCES and learning records are in the repo but NOT on the website. Add any new public folder to the `cp` line in build.sh.
- After a new lesson: add it to `index.html`, commit, `git push`. Live in about a minute.
- **Maya's feedback:** Netlify dashboard → site maya-learning → Forms → `feedback`. Read these before planning each new lesson, and record anything useful in a learning record.
