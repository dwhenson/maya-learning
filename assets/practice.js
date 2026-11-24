/*
 * Practice: an endless typed-answer drill with instant feedback.
 *
 *   Practice.mount(el, {
 *     goal: 8,                       // correct answers needed to finish
 *     generate: () => ({
 *       prompt: "3(x + 4)",          // plain text; letters get italicised
 *       answer: "3x + 12",           // checked with Expr.equal, so any order is fine
 *       diagnose(parsed) { return "html hint" | null },   // optional: spot a known mistake
 *       explain(box) { ... }         // optional: draw a worked explanation into box
 *     }),
 *     onFinish() {},
 *     example: "<span class='m'>−7</span>",  // optional: how to type an answer, shown if it can't be read
 *     before: "=",                           // optional: what sits in front of the answer box ("£", "x =")
 *     inputmode: "decimal"                   // optional: phone keyboard hint
 *   });
 *
 * For answers Expr can't read (brackets, money, x = 50), a question can bring its own checker:
 *   { prompt / promptHTML, show: "html of the answer",
 *     check(text) { return null (can't read it) | { ok: true, tidy: "optional html" } | { ok: false, hint: "html" } } }
 * promptHTML (any HTML, e.g. a drawing) replaces the plain-text prompt.
 *
 * Needs expr.js. Uses the .box / .feedback / input.answer styles in course.css.
 */
(function () {
  function mount(el, opts) {
    const goal = opts.goal || 8;
    let correct = 0, attempts = 0, current = null, locked = false;
    const recent = [];

    el.innerHTML = `
      <div class="box practice">
        <div class="meta practice-progress" aria-live="polite"></div>
        <p class="display practice-prompt" style="margin:.75rem 0 1rem"></p>
        <form class="practice-form" style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;align-items:center">
          <span class="m practice-before" style="font-size:1.3rem">${opts.before || "="}</span>
          <input class="answer"${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""} autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer">
          <button type="submit">Check</button>
        </form>
        <div class="feedback" aria-live="polite"></div>
        <div class="practice-explain"></div>
        <div style="text-align:center;margin-top:.9rem"><button class="ghost practice-next" hidden>Next question →</button></div>
      </div>`;
    const $ = s => el.querySelector(s);
    const input = $("input"), fb = $(".feedback"), explain = $(".practice-explain"), next = $(".practice-next");

    function progress() {
      const dots = Array.from({ length: goal }, (_, i) => i < correct ? "●" : "○").join(" ");
      $(".practice-progress").innerHTML =
        `<span style="letter-spacing:.15em;color:var(--good)">${dots}</span> &nbsp; ${correct} of ${goal} correct`;
    }

    function newQuestion(first) {
      let q, tries = 0;
      do { q = opts.generate(); tries++; } while (recent.includes(q.prompt) && tries < 20);
      recent.push(q.prompt); if (recent.length > 6) recent.shift();
      current = q; locked = false;
      $(".practice-prompt").innerHTML = q.promptHTML || `<span class="m">${Expr.html(q.prompt)}</span>`;
      $(".practice-before").innerHTML = q.before || opts.before || "=";
      input.value = ""; input.disabled = false; fb.className = "feedback"; fb.innerHTML = "";
      explain.innerHTML = ""; next.hidden = true;
      if (first !== true) input.focus();
    }

    $(".practice-form").addEventListener("submit", e => {
      e.preventDefault();
      if (locked) return;
      if (current.check) return checkCustom();
      const parsed = Expr.parse(input.value);
      if (!parsed) {
        fb.className = "feedback bad";
        fb.innerHTML = `I can't read that yet. Type it like ${opts.example || '<span class="m">3<i>x</i> + 12</span>'} (use - for minus).`;
        return;
      }
      attempts++;
      locked = true; input.disabled = true;
      const target = Expr.parse(current.answer);
      if (Expr.equal(parsed, target)) {
        correct++;
        fb.className = "feedback good";
        const untidy = parsed._terms > Object.values(target).filter(v => v).length;
        fb.innerHTML = untidy
          ? `Correct! Tidy it up as <span class="m">${Expr.html(current.answer)}</span> by collecting the numbers.`
          : `${window.Lesson ? Lesson.praise() : "Correct!"} <span class="m">${Expr.html(current.prompt)} = ${Expr.html(current.answer)}</span>`;
      } else {
        fb.className = "feedback bad";
        const hint = current.diagnose ? current.diagnose(parsed) : null;
        fb.innerHTML = (hint ? hint + "<br>" : "Not quite. ") +
          `The answer is <span class="m">${Expr.html(current.answer)}</span>.`;
        if (current.explain) current.explain(explain);
      }
      finishAnswer();
    });

    // Questions with their own checker (brackets, money, equations).
    function checkCustom() {
      const r = current.check(input.value);
      if (!r) {
        fb.className = "feedback bad";
        fb.innerHTML = `I can't read that yet. Type it like ${opts.example || current.show}.`;
        return;
      }
      attempts++;
      locked = true; input.disabled = true;
      const shownPrompt = current.promptHTML ? "" : `<span class="m">${Expr.html(current.prompt)}</span> = `;
      if (r.ok) {
        correct++;
        fb.className = "feedback good";
        fb.innerHTML = r.tidy || `${window.Lesson ? Lesson.praise() : "Correct!"} ${shownPrompt}<span class="m">${current.show}</span>`;
      } else {
        fb.className = "feedback bad";
        fb.innerHTML = (r.hint ? r.hint + "<br>" : "Not quite. ") + `The answer is <span class="m">${current.show}</span>.`;
        if (current.explain) current.explain(explain);
      }
      finishAnswer();
    }

    function finishAnswer() {
      progress();
      if (correct >= goal) {
        next.hidden = true;
        const done = document.createElement("p");
        done.className = "feedback good";
        const who = window.Lesson ? ", " + Lesson.name : "";
        done.innerHTML = `<strong>🎉 Done${who}! ${goal} correct in ${attempts} tries.</strong> ` +
          (attempts === goal ? "A perfect run!" : "Slips are how it sticks. Come back tomorrow and see if you can beat it.");
        el.querySelector(".practice").appendChild(done);
        if (opts.onFinish) opts.onFinish({ correct, attempts });
      } else {
        next.hidden = false; next.focus();
      }
    }
    next.addEventListener("click", () => newQuestion());

    progress();
    newQuestion(true);
  }

  window.Practice = { mount };
})();
