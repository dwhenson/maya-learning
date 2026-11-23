/*
 * Quiz: multiple-choice questions with instant feedback.
 *
 * Markup:
 *   <div class="quiz" data-answer="2" data-why="Explanation shown after answering">
 *     <p>Question text</p>
 *     <ol><li>Option</li><li>Option</li><li>Option</li><li>Option</li></ol>
 *   </div>
 * data-answer is 0-based. data-hint is the nudge after a first wrong try (don't give the answer away);
 * the learner gets a second go, and the answer plus data-why is shown after that.
 * Runs on DOMContentLoaded (or call Quiz.init()).
 * Keep options the same length and vary the correct position.
 */
(function () {
  const css = `
  .quiz { background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
  .quiz > p:first-child { margin-top: 0; }
  .quiz ol { list-style: none; padding: 0; margin: .5rem 0 0; display: grid; gap: .5rem; }
  .quiz li button { width: 100%; text-align: left; background: var(--bg); color: var(--ink); border: 1px solid var(--rule);
    font: 1.05rem var(--serif); padding: .55rem .85rem; }
  .quiz li button:hover:not(:disabled) { border-color: var(--accent); }
  .quiz li button.right { background: var(--good-soft); border-color: var(--good); opacity: 1; }
  .quiz li button.wrong { background: var(--bad-soft); border-color: var(--bad); opacity: 1; }
  .quiz .letter { font: 600 .8rem var(--sans); color: var(--muted); margin-right: .6rem; }
  .quiz-score { font: 500 .95rem var(--sans); text-align: center; color: var(--muted); }`;

  function init(root) {
    root = root || document;
    if (!document.getElementById("quiz-css")) {
      const s = document.createElement("style"); s.id = "quiz-css"; s.textContent = css; document.head.appendChild(s);
    }
    const quizzes = [...root.querySelectorAll(".quiz:not([data-ready])")];
    let answered = 0, right = 0, second = 0;
    const score = root.querySelector(".quiz-score");
    quizzes.forEach(q => {
      q.dataset.ready = "1";
      const answer = +q.dataset.answer;
      let tries = 0;
      const items = [...q.querySelectorAll("li")];
      const fb = document.createElement("div"); fb.className = "feedback"; fb.setAttribute("aria-live", "polite");
      q.appendChild(fb);
      items.forEach((li, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.innerHTML = `<span class="letter">${"ABCD"[i]}</span>${li.innerHTML}`;
        li.innerHTML = ""; li.appendChild(b);
        b.addEventListener("click", () => {
          const buttons = items.map(x => x.querySelector("button"));
          const ok = i === answer;
          tries++;
          const S = n => { if (window.Sound) Sound.play(n); };
          S("select");
          const praise = window.Lesson ? Lesson.praise() : "Yes!";
          if (!ok && tries < 2) {
            // First miss: cross out this option and give a nudge, not the answer.
            b.classList.add("wrong"); b.disabled = true;
            fb.className = "feedback bad";
            fb.innerHTML = `<strong>Not quite${window.Lesson ? ", " + Lesson.name : ""}.</strong> ` +
              (q.dataset.hint || "Have a think and try again.") + " <strong>Have another go!</strong>";
            setTimeout(() => S("hint"), 90);
            return;
          }
          buttons.forEach(x => x.disabled = true);
          buttons[answer].classList.add("right");
          if (!ok) b.classList.add("wrong");
          fb.className = "feedback " + (ok ? "good" : "bad");
          fb.innerHTML = ok
            ? `<strong>${praise}</strong> ${tries > 1 ? "Got it on the second go. " : ""}${q.dataset.why || ""}`
            : `<strong>No worries${window.Lesson ? ", " + Lesson.name : ""}, the answer was ${"ABCD"[answer]}.</strong> ${q.dataset.why || ""}`;
          setTimeout(() => S(ok ? "correct" : "reveal"), 90);
          answered++; if (ok && tries === 1) right++; if (ok && tries > 1) second++;
          if (answered === quizzes.length) {
            if (score) score.textContent = right === quizzes.length
              ? `🌟 All ${quizzes.length} right first time. Perfect!`
              : `Out of ${quizzes.length}: ${right} right first time` + (second ? `, ${second} on the second go` : "") + ".";
            setTimeout(() => {
              if (right === quizzes.length && window.Celebrate) Celebrate.burst();   // confetti + fanfare
              else S("done");
              if (score) { score.classList.remove("pop-in"); void score.offsetWidth; score.classList.add("pop-in"); }
            }, 650);
            document.dispatchEvent(new CustomEvent("quiz:finished", { detail: { right, second, total: quizzes.length } }));
          }
        });
      });
    });
  }

  window.Quiz = { init };
  document.addEventListener("DOMContentLoaded", () => init());
})();
