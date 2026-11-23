# Maya's maths

**Live:** https://maya-learning.netlify.app

Interactive KS3 (Year 8) lessons on expanding brackets: short videos, drag-and-drop algebra tiles, puzzles and quizzes.

- `index.html`: home page listing the lessons
- `lessons/`: one HTML file per lesson
- `assets/`: shared styles and components (tiles, drag and drop, quiz, sounds, animations)
- `reference/`: printable cheat sheet

**Run locally:** double-click `Open Lessons.command` (macOS), or run `python3 -m http.server 8765` and open http://127.0.0.1:8765. Videos only play inside the page when it's served over http, not when opened as a file.

**Deploy:** Netlify builds from `netlify.toml`, which copies only the lesson files into `dist/`.
