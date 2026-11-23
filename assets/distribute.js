/*
 * Distribute: drag the number outside the bracket onto each term inside it.
 * Each drop draws a "rainbow" arrow and asks the learner to pick the product.
 *
 *   Distribute.mount(el, {
 *     rounds: 5,
 *     generate: () => Distribute.single(3, 4, "x", false),   // a(x + b); Distribute.minus(...) gives a(x − b)
 *        // or build your own round:
 *        // { outside: "3", terms: [ { show: "x", product: "3x", choices: [...], hint: "..." },
 *        //                          { sign: "+", show: "4", product: "12", choices: [...], hint: "..." } ] }
 *        // A term with sign "-" is drawn with its minus stuck inside the term box ("the sign belongs to the term"),
 *        // and its product is the signed result, e.g. "-12".
 *     onDone() {}
 *   });
 * Needs drag.js and expr.js. Uses Celebrate from lesson.js if present.
 */
(function () {
  const css = `
  .ds-stars { text-align:center; font-size:1.3rem; letter-spacing:.2em; min-height:1.8rem; }
  .ds-wrap { position:relative; padding-top:56px; margin:.2rem auto 0; width:fit-content; max-width:100%; }
  .ds-arcs { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
  .ds-expr { display:flex; align-items:center; gap:.35rem; font:800 2.2rem var(--serif); }
  .ds-chip { background:var(--pop); color:#fff; border-radius:14px; padding:.05rem .65rem; box-shadow:0 4px 0 color-mix(in srgb, var(--pop) 60%, #000); }
  .ds-term { border-radius:12px; padding:.05rem .5rem; background:var(--bg); border:2px solid var(--rule); cursor:pointer; transition:background .2s; }
  .ds-term.neg { color:var(--bad); }
  .ds-term.done { background:var(--good-soft); border-color:var(--good); cursor:default; }
  .ds-term.active { background:var(--accent-soft); border-color:var(--accent); }
  .ds-paren { font-weight:400; color:var(--muted); }
  .ds-answer { text-align:center; font:800 1.8rem var(--serif); margin:1rem 0 .3rem; }
  .ds-slot { display:inline-block; min-width:3.2rem; padding:.05rem .4rem; border-bottom:3px dotted var(--rule); }
  .ds-slot.filled { border-bottom-color:transparent; color:var(--good); }
  .ds-q { text-align:center; font-weight:700; margin:.6rem 0 .3rem; }
  .ds-choices { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; min-height:3rem; }
  .ds-choices button { font:800 1.3rem var(--serif); background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); min-width:5rem; }
  .ds-choices button:hover { border-color:var(--accent); }
  .ds-next { text-align:center; margin-top:.8rem; }
  @media (max-width:520px){ .ds-expr{ font-size:1.7rem } .ds-answer{ font-size:1.4rem } }`;

  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const ital = s => String(s).replace(/-/g, "−").replace(/([a-z])/g, "<i>$1</i>");

  // A round for a(L + b), positives only. numberFirst gives a(b + L).
  function single(a, b, L, numberFirst) {
    const letterTerm = { show: L, product: a + L, choices: [a + L, L, `${a} + ${L}`],
      hint: `${a} × ${L} means ${a} lots of ${L}. We write it as ${a}${L}.` };
    let wrongs = [a + b, b, a * b + a].filter(v => v !== a * b);
    const numberTerm = { show: String(b), product: String(a * b), choices: [String(a * b), String(wrongs[0]), String(wrongs[1])],
      hint: `${a} × ${b} means ${a} lots of ${b}. Multiply, don't add!` };
    const terms = numberFirst ? [numberTerm, { ...letterTerm, sign: "+" }] : [letterTerm, { ...numberTerm, sign: "+" }];
    return { outside: String(a), terms };
  }

  // A round for a(L − b), or a(b − L) when numberFirst. The minus sticks to the second term.
  function minus(a, b, L, numberFirst) {
    const pick2 = (right, list) => [...new Set(list.map(String))].filter(v => v !== String(right)).slice(0, 2);
    if (!numberFirst) {
      const letterTerm = { show: L, product: a + L, choices: [a + L, L, `${a} + ${L}`],
        hint: `${a} × ${L} means ${a} lots of ${L}. We write it as ${a}${L}.` };
      const right = `-${a * b}`;
      const numberTerm = { sign: "-", show: String(b), product: right,
        choices: [right, ...pick2(right, [a * b, `-${a + b}`, `-${b}`])],
        hint: `The minus sticks to the ${b}, so this is ${a} lots of −${b}. Multiply ${a} × ${b}, and keep the minus.` };
      return { outside: String(a), terms: [letterTerm, numberTerm] };
    }
    const numberTerm = { show: String(b), product: String(a * b),
      choices: [String(a * b), ...pick2(a * b, [a + b, b, a * b + a])],
      hint: `${a} × ${b} means ${a} lots of ${b}. Multiply, don't add!` };
    const right = `-${a}${L}`;
    const letterTerm = { sign: "-", show: L, product: right, choices: [right, a + L, `-${L}`],
      hint: `The minus sticks to the ${L}, so this is ${a} lots of −${L}. Keep the minus.` };
    return { outside: String(a), terms: [numberTerm, letterTerm] };
  }

  function mount(el, opts) {
    if (!document.getElementById("distribute-css")) {
      const s = document.createElement("style"); s.id = "distribute-css"; s.textContent = css; document.head.appendChild(s);
    }
    const rounds = opts.rounds || 5;
    let round = 0, firstTry = 0, q, done, active, slipped;

    el.innerHTML = `
      <div class="ds-stars" aria-label="Rounds completed"></div>
      <div class="ds-wrap"><svg class="ds-arcs" aria-hidden="true"></svg><div class="ds-expr"></div></div>
      <div class="ds-answer"></div>
      <div class="ds-q"></div>
      <div class="ds-choices"></div>
      <div class="feedback" aria-live="polite"></div>
      <div class="ds-next"><button hidden>Next one ▶</button></div>`;
    const $ = s => el.querySelector(s);
    const nextBtn = $(".ds-next button");
    nextBtn.onclick = newRound;
    window.addEventListener("resize", drawArcs);

    function stars() {
      $(".ds-stars").textContent = Array.from({ length: rounds }, (_, i) => i < round ? "⭐" : "☆").join("");
    }

    function newRound() {
      q = opts.generate(); done = []; active = null; slipped = false;
      nextBtn.hidden = true;
      $(".ds-expr").innerHTML =
        `<span class="ds-chip">${ital(q.outside)}</span><span class="ds-paren">(</span>` +
        q.terms.map((t, i) => t.sign === "-"
          ? `<span class="ds-term neg" data-i="${i}">−${ital(t.show)}</span>`
          : (t.sign ? `<span>${t.sign}</span>` : "") + `<span class="ds-term" data-i="${i}">${ital(t.show)}</span>`).join("") +
        `<span class="ds-paren">)</span>`;
      $(".ds-answer").innerHTML = "= " + q.terms.map((t, i) =>
        (i ? ` ${t.sign === "-" ? "−" : "+"} ` : "") + `<span class="ds-slot" data-i="${i}">?</span>`).join("");
      $(".ds-q").innerHTML = ""; $(".ds-choices").innerHTML = "";
      say(`Drag the <strong style="color:var(--pop)">${ital(q.outside)}</strong> onto each term inside the bracket 👆`);
      drawArcs();
      const chip = $(".ds-chip");
      const terms = () => [...el.querySelectorAll(".ds-term")].filter(t => !done.includes(+t.dataset.i));
      Drag.attach(chip, {
        targets: terms,
        onDrop: target => { pick(+target.dataset.i); },
        onTap: () => say(`Hold and drag the ${ital(q.outside)} onto a term inside the bracket.`)
      });
      el.querySelectorAll(".ds-term").forEach(t => t.addEventListener("click", () => {
        if (!done.includes(+t.dataset.i)) pick(+t.dataset.i);
      }));
    }

    function pick(i) {
      active = i;
      el.querySelectorAll(".ds-term").forEach(t => t.classList.toggle("active", +t.dataset.i === i));
      drawArcs();
      const t = q.terms[i];
      const shown = t.sign === "-" ? `(−${ital(t.show)})` : ital(t.show);
      $(".ds-q").innerHTML = `What is <span class="m">${ital(q.outside)} × ${shown}</span>?`;
      $(".ds-choices").innerHTML = "";
      shuffle(t.choices).forEach(c => {
        const b = document.createElement("button");
        b.type = "button"; b.innerHTML = ital(c); b.className = "pop-in";
        b.onclick = () => choose(i, c, b);
        $(".ds-choices").appendChild(b);
      });
      say("");
    }

    function choose(i, c, btn) {
      const t = q.terms[i];
      if (Expr.equal(Expr.parse(c), Expr.parse(t.product))) {
        done.push(i); active = null;
        const term = el.querySelector(`.ds-term[data-i="${i}"]`);
        term.classList.remove("active"); term.classList.add("done");
        const slot = el.querySelector(`.ds-slot[data-i="${i}"]`);
        slot.innerHTML = ital(t.product.replace(/^-/, "")); slot.classList.add("filled", "pop-in");
        $(".ds-q").innerHTML = ""; $(".ds-choices").innerHTML = "";
        drawArcs();
        if (done.length < q.terms.length) return say(`✅ ${window.Lesson ? Lesson.praise() : "Yes!"} Now drag the <strong style="color:var(--pop)">${ital(q.outside)}</strong> onto the other term.`, "good");
        round++; if (!slipped) firstTry++;
        stars();
        const signed = (t, i, key) => (i ? ` ${t.sign === "-" ? "−" : "+"} ` : "") + String(t[key]).replace(/^-/, "");
        const whole = `${q.outside}(${q.terms.map((t, i) => signed(t, i, "show")).join("")}) = ` +
          q.terms.map((t, i) => signed(t, i, "product")).join("");
        say(`🎉 <span class="m">${ital(whole)}</span><br>The ${ital(q.outside)} reached <strong>every</strong> term${q.terms.some(t => t.sign === "-") ? ", and the minus stayed with its term" : ""}. Press <strong>Next one</strong>.`, "good");
        if (round >= rounds) {
          if (window.Celebrate) Celebrate.burst();
          say(`🏆 All ${rounds} done${window.Lesson ? ", " + Lesson.name : ""}${firstTry === rounds ? ", with no slips. Amazing!" : "!"} You've got the idea: the outside number multiplies everything inside. On to the next game 👇`, "good");
          if (opts.onDone) opts.onDone();
        } else { nextBtn.hidden = false; nextBtn.focus({ preventScroll: true }); }
      } else {
        slipped = true;
        btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
        btn.disabled = true;
        say("Not that one. " + t.hint, "bad");
      }
    }

    // Rainbow arrows from the outside number to each term that's done or active.
    function drawArcs() {
      const svg = $(".ds-arcs"), wrap = $(".ds-wrap"), chip = $(".ds-chip");
      if (!svg || !chip) return;
      svg.innerHTML = "";
      const W = wrap.getBoundingClientRect(), C = chip.getBoundingClientRect();
      const x0 = C.left + C.width / 2 - W.left, y0 = C.top - W.top - 2;
      [...done, ...(active !== null ? [active] : [])].forEach(i => {
        const T = el.querySelector(`.ds-term[data-i="${i}"]`).getBoundingClientRect();
        const x1 = T.left + T.width / 2 - W.left, y1 = T.top - W.top - 2;
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", `M ${x0} ${y0} Q ${(x0 + x1) / 2} ${Math.min(y0, y1) - 60} ${x1} ${y1}`);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-width", "3");
        p.setAttribute("stroke-linecap", "round");
        p.style.stroke = done.includes(i) ? "var(--good)" : "var(--pop)";
        if (!done.includes(i)) p.setAttribute("stroke-dasharray", "6 6");
        svg.appendChild(p);
        const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        head.setAttribute("cx", x1); head.setAttribute("cy", y1); head.setAttribute("r", 4.5);
        head.style.fill = p.style.stroke;
        svg.appendChild(head);
      });
    }

    function say(html, kind) {
      const fb = $(".feedback");
      fb.className = "feedback" + (kind ? " " + kind : "");
      fb.style.background = kind ? "" : "var(--accent-soft)";
      fb.innerHTML = html;
      if (!html) fb.style.background = "";
    }

    stars();
    newRound();
  }

  window.Distribute = { mount, single, minus };
})();
