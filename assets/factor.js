/*
 * Factorising components (expanding backwards).
 *
 *   RowDeal.mount(el, { xs: 6, ones: 9, letter: "x", onDone() {} });
 *     A pile of algebra tiles (6 x tiles, 9 one tiles). Tap "Deal into 2 / 3 / 4… rows" and the tiles are
 *     dealt out like cards. Equal rows = a factorisation; the most rows that work = fully factorised (the HCF).
 *
 *   Factorise.mount(el, { rounds: 5, generate: () => Factorise.round(3, 2, 5, "x"), onDone() {} });
 *     6x + 15 = ⬚(⬚ + ⬚): drag a number chip into the outside box (or tap it), then pick each inside term.
 *     round(h, p, q, L, minus) builds h·p L ± h·q with HCF h.
 *
 * Both reuse the tile styles from tiles.js (load tiles.js first) and drag.js.
 */
(function () {
  const css = `
  .rd-pile { display:flex; flex-wrap:wrap; gap:5px; justify-content:center; padding:.8rem; background:var(--bg); border-radius:16px; min-height:3rem; }
  .rd { --u: clamp(22px, 6.4vw, 32px); }
  .rd-buttons { display:flex; flex-wrap:wrap; gap:.5rem; justify-content:center; margin:.9rem 0 .4rem; }
  .rd-buttons button.tried { opacity:.55; }
  .rd-rows { display:grid; gap:6px; margin-top:.6rem; }
  .rd-row { display:flex; flex-wrap:wrap; gap:4px; align-items:center; padding:5px 8px; border-radius:12px; background:var(--bg); min-height:calc(var(--u) + 10px); }
  .rd-row.ok { background:var(--good-soft); }
  .rd-row.uneven { background:var(--bad-soft); }
  .rd-row .lbl { margin-left:auto; font:800 .95rem var(--serif); color:var(--muted); white-space:nowrap; padding-left:.4rem; }
  .rd .tile { animation:rd-in .35s cubic-bezier(.3,1.6,.5,1) both; }
  @keyframes rd-in { from { transform:translateY(-14px) scale(.6); opacity:0 } }
  @media (prefers-reduced-motion: reduce) { .rd .tile { animation:none } }

  .fz-expr { text-align:center; font:800 2rem var(--serif); margin:.4rem 0 .2rem; }
  .fz-line { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:.3rem; font:800 2rem var(--serif); margin:.3rem 0 .8rem; }
  .fz-slot { display:inline-grid; place-items:center; min-width:3rem; height:3rem; padding:0 .5rem; border-radius:12px; border:3px dashed var(--rule); color:var(--muted); background:var(--surface); }
  .fz-slot.out { border-color:var(--pop); }
  .fz-slot.filled { border-style:solid; border-color:var(--good); color:var(--good); background:var(--good-soft); }
  .fz-slot.active { border-color:var(--accent); background:var(--accent-soft); }
  .fz-chips { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; min-height:3.2rem; }
  .fz-chip { background:var(--pop); color:#fff; font:800 1.5rem var(--serif); border-radius:14px; padding:.15rem .9rem; box-shadow:0 4px 0 color-mix(in srgb, var(--pop) 60%, #000); user-select:none; touch-action:none; }
  .fz-chip.used { opacity:.35; }
  .fz-q { text-align:center; font-weight:700; margin:.7rem 0 .3rem; }
  .fz-choices { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; }
  .fz-choices button { font:800 1.3rem var(--serif); background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); min-width:4.5rem; }
  .fz-choices button:hover { border-color:var(--accent); }
  .fz-next { text-align:center; margin-top:.8rem; }
  @media (max-width:520px) { .fz-line, .fz-expr { font-size:1.5rem } .fz-slot { height:2.5rem; min-width:2.5rem } }`;

  function addCSS() {
    if (document.getElementById("factor-css")) return;
    const s = document.createElement("style"); s.id = "factor-css"; s.textContent = css; document.head.appendChild(s);
  }
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const ital = s => String(s).replace(/-/g, "−").replace(/([a-z])/g, "<i>$1</i>");
  const term = (c, L) => (c === 1 ? L : c + L);
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const praise = () => (window.Lesson ? Lesson.praise() : "Yes!");
  function say(el, html, kind) {
    const fb = el.querySelector(".feedback");
    fb.className = "feedback" + (kind ? " " + kind : "");
    fb.style.background = kind || !html ? "" : "var(--accent-soft)";
    fb.innerHTML = html;
    if (kind === "bad") { fb.classList.remove("shake"); void fb.offsetWidth; fb.classList.add("shake"); }
  }

  /* ---------- RowDeal ---------- */
  function rowDeal(el, opts) {
    addCSS();
    const PUZZLES = [[6, 9], [4, 8], [6, 12], [10, 15], [8, 12], [9, 6]];
    let xs = opts.xs || 6, ones = opts.ones || 9, finished = false;
    const L = opts.letter || "x";

    function start() {
      const h = gcd(xs, ones), tried = new Set();
      el.classList.add("rd", "tb");
      el.innerHTML = `
        <p class="display" style="margin:.2rem 0 .6rem"><span class="m">${xs}${ital(L)} + ${ones}</span></p>
        <div class="rd-pile"></div>
        <div class="rd-buttons">${[2, 3, 4, 5, 6].map(k => `<button type="button" class="ghost" data-k="${k}">🃏 ${k} rows</button>`).join("")}</div>
        <div class="rd-rows"></div>
        <div class="feedback" aria-live="polite"></div>
        <div class="fz-next"><button type="button" class="ghost rd-new">🎲 New tiles</button></div>`;
      const pile = el.querySelector(".rd-pile"), rowsBox = el.querySelector(".rd-rows");
      pile.innerHTML = `<span class="tile tx">${L}</span>`.repeat(xs) + `<span class="tile t1">1</span>`.repeat(ones);
      say(el, `Here are <strong>${xs}</strong> <i>${L}</i> tiles and <strong>${ones}</strong> one tiles. Deal them into equal rows. Every row must be exactly the same. Which numbers of rows work?`);

      el.querySelectorAll(".rd-buttons button").forEach(b => b.onclick = () => deal(+b.dataset.k, b));
      el.querySelector(".rd-new").onclick = () => {
        let p; do { p = PUZZLES[Math.floor(Math.random() * PUZZLES.length)]; } while (p[0] === xs && p[1] === ones);
        [xs, ones] = p; start();
      };

      function deal(k, btn) {
        tried.add(k); btn.classList.add("tried");
        pile.hidden = true;
        // Deal like cards: x tiles first, then the ones, one to each row in turn.
        const rows = Array.from({ length: k }, () => ({ x: 0, one: 0 }));
        for (let i = 0; i < xs; i++) rows[i % k].x++;
        for (let i = 0; i < ones; i++) rows[(xs + i) % k].one++;
        const even = xs % k === 0 && ones % k === 0;
        let delay = 0;
        rowsBox.innerHTML = rows.map(r => {
          const tiles = `<span class="tile tx" style="animation-delay:${(delay += 25)}ms">${L}</span>`.repeat(r.x) +
            Array.from({ length: r.one }, () => `<span class="tile t1" style="animation-delay:${(delay += 25)}ms">1</span>`).join("");
          return `<div class="rd-row ${even ? "ok" : "uneven"}">${tiles}<span class="lbl">${ital(r.x ? term(r.x, L) : "")}${r.x && r.one ? " + " : ""}${r.one || ""}</span></div>`;
        }).join("");
        if (window.Sound) Sound.play(even ? "drop" : "wrong");
        if (!even) {
          const which = xs % k && ones % k ? `the <i>${L}</i> tiles or the 1 tiles` : xs % k ? `the ${xs} <i>${L}</i> tiles` : `the ${ones} one tiles`;
          return say(el, `🙈 Uneven rows! ${k} doesn't share ${which} equally. Try another number.`, "bad");
        }
        const inside = `${term(xs / k, L)} + ${ones / k}`;
        if (k < h) return say(el, `✅ That works: ${k} rows of <span class="m">(${ital(inside)})</span>, so <span class="m">${xs}${ital(L)} + ${ones} = ${k}(${ital(inside)})</span>.<br>But can you find <strong>more rows</strong> that still work?`, "good");
        say(el, `🎉 <strong>${praise()}</strong> ${k} equal rows of <span class="m">(${ital(inside)})</span>. That's the <strong>most rows</strong> that work, so it's fully factorised:
          <span class="display" style="display:block;margin:.4rem 0 0"><span class="m">${xs}${ital(L)} + ${ones} = ${k}(${ital(inside)})</span></span>
          ${k} is the <strong>highest common factor</strong> of ${xs} and ${ones}. Try 🎲 <strong>New tiles</strong>, or scroll down 👇`, "good");
        if (window.Celebrate) Celebrate.burst();
        if (!finished) { finished = true; if (opts.onDone) opts.onDone(); }
      }
    }
    start();
  }

  /* ---------- Factorise (drag the HCF out) ---------- */
  function round(h, p, q, L, minus) {
    const sg = minus ? "-" : "+";
    const a = h * p, b = h * q;
    const divisors = n => Array.from({ length: n }, (_, i) => i + 1).filter(d => d > 1 && n % d === 0);
    let chips = new Set([h]);
    divisors(h).forEach(d => chips.add(d));                                   // smaller common factors
    shuffle([...divisors(a), ...divisors(b)].filter(d => !chips.has(d))).slice(0, 2).forEach(d => chips.add(d));  // one-sided ones
    chips = shuffle([...chips].slice(0, 4));
    if (!chips.includes(h)) chips[0] = h;
    const first = { right: term(p, L), choices: shuffle([term(p, L), term(a, L), term(p + h, L)].filter((v, i, s) => s.indexOf(v) === i)) };
    const second = { right: String(q), choices: shuffle([String(q), String(b), String(Math.abs(b - h) || q + 1)].filter((v, i, s) => s.indexOf(v) === i)) };
    return { h, a, b, L, sg, chips, first, second };
  }

  function factorise(el, opts) {
    addCSS();
    const rounds = opts.rounds || 5;
    let n = 0, q, stage, slipped, firstTry = 0;
    el.innerHTML = `
      <div class="ds-stars" style="text-align:center;font-size:1.3rem;letter-spacing:.2em"></div>
      <div class="fz-expr"></div>
      <div class="fz-line"></div>
      <div class="fz-chips"></div>
      <div class="fz-q"></div><div class="fz-choices"></div>
      <div class="feedback" aria-live="polite"></div>
      <div class="fz-next"><button type="button" hidden>Next one ▶</button></div>`;
    const $ = s => el.querySelector(s);
    const nextBtn = $(".fz-next button");
    nextBtn.onclick = newRound;
    const stars = () => { $(".ds-stars").textContent = Array.from({ length: rounds }, (_, i) => (i < n ? "⭐" : "☆")).join(""); };

    function newRound() {
      q = opts.generate(); stage = "out"; slipped = false; nextBtn.hidden = true;
      $(".fz-expr").innerHTML = `${term(q.a, ital(q.L))} ${q.sg === "-" ? "−" : "+"} ${q.b}`;
      $(".fz-line").innerHTML = `= <span class="fz-slot out" data-s="out">?</span>( <span class="fz-slot" data-s="first">?</span> ${q.sg === "-" ? "−" : "+"} <span class="fz-slot" data-s="second">?</span> )`;
      $(".fz-q").innerHTML = ""; $(".fz-choices").innerHTML = "";
      $(".fz-chips").innerHTML = q.chips.map(c => `<span class="fz-chip" data-v="${c}">${c}</span>`).join("");
      say(el, `Which number goes <strong>outside</strong>? Drag a pink number into the pink box (or tap it). Pick the <strong>biggest</strong> number that goes into <strong>both</strong> ${q.a} and ${q.b}.`);
      el.querySelectorAll(".fz-chip").forEach(chip => Drag.attach(chip, {
        targets: () => (stage === "out" ? [$(".fz-slot.out")] : []),
        onDrop: () => tryOut(chip),
        onTap: () => { if (stage === "out") tryOut(chip); }
      }));
    }

    function tryOut(chip) {
      const k = +chip.dataset.v;
      if (q.a % k || q.b % k) {
        slipped = true;
        chip.classList.add("used");
        const miss = q.a % k ? q.a : q.b;
        say(el, `${k} doesn't go into ${miss} (${miss} ÷ ${k} isn't a whole number). It has to go into <strong>both</strong>.`, "bad");
        return false;
      }
      if (k < q.h) {
        slipped = true;
        chip.classList.add("used");
        say(el, `${k} goes into both, nice! But there's a <strong>bigger</strong> number that goes into both ${q.a} and ${q.b}. Try again.`, "bad");
        return false;
      }
      stage = "first";
      const slot = $(".fz-slot.out"); slot.textContent = k; slot.classList.add("filled", "pop-in");
      $(".fz-chips").innerHTML = "";
      ask("first");
      return true;
    }

    function ask(which) {
      const part = q[which];
      el.querySelectorAll(".fz-slot").forEach(s => s.classList.toggle("active", s.dataset.s === which));
      const whole = which === "first" ? term(q.a, q.L) : q.b;
      $(".fz-q").innerHTML = `What goes in the box? <span class="m">${q.h} × ? = ${ital(String(whole))}</span>`;
      say(el, which === "first" ? `✅ ${praise()} ${q.h} goes outside. Now: what times ${q.h} makes <span class="m">${ital(term(q.a, q.L))}</span>?` : "");
      $(".fz-choices").innerHTML = "";
      part.choices.forEach(c => {
        const b = document.createElement("button");
        b.type = "button"; b.innerHTML = ital(c); b.className = "pop-in";
        b.onclick = () => {
          if (c !== part.right) {
            slipped = true; b.disabled = true;
            b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
            return say(el, `Check it: ${q.h} × ${ital(c)} = ${ital(String(which === "first" ? term(q.h * parseInt(c || "1", 10) || q.h, q.L) : q.h * +c))}. We need ${ital(String(whole))}.`, "bad");
          }
          const slot = el.querySelector(`.fz-slot[data-s="${which}"]`);
          slot.innerHTML = `<span>${ital(c)}</span>`; slot.classList.remove("active"); slot.classList.add("filled", "pop-in");
          if (which === "first") return ask("second");
          done();
        };
        $(".fz-choices").appendChild(b);
      });
    }

    function done() {
      $(".fz-q").innerHTML = ""; $(".fz-choices").innerHTML = "";
      n++; if (!slipped) firstTry++;
      stars();
      const sg = q.sg === "-" ? "−" : "+";
      const ans = `${q.h}(${ital(q.first.right)} ${sg} ${q.second.right})`;
      say(el, `🎉 <span class="m">${ital(term(q.a, q.L))} ${sg} ${q.b} = ${ans}</span><br>Check by expanding: <span class="m">${q.h} × ${ital(q.first.right)} = ${ital(term(q.a, q.L))}</span> and <span class="m">${q.h} × ${q.second.right} = ${q.b}</span> ✓`, "good");
      if (n >= rounds) {
        if (window.Celebrate) Celebrate.burst();
        say(el, `🏆 All ${rounds} done${window.Lesson ? ", " + Lesson.name : ""}${firstTry === rounds ? ", with no slips. Amazing!" : "!"} Biggest number outside, then divide to find what's inside. On to the next game 👇`, "good");
        if (opts.onDone) opts.onDone();
      } else { nextBtn.hidden = false; nextBtn.focus({ preventScroll: true }); }
    }

    stars();
    newRound();
  }

  window.RowDeal = { mount: rowDeal };
  window.Factorise = { mount: factorise, round, gcd };
})();
