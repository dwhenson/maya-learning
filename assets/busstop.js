/*
 * BusStop: short division (the "bus stop" method) as a game.
 *
 *   BusStop.demo(el, { d: 7, n: 896 })      // worked example: tap "Next step" to see each stop
 *   BusStop.game(el, { onLevel(i), onDone() })
 *     Six levels of 5 sums. At each digit: "How many 7s in 18?" → tap the number pad (or type a digit).
 *     Some levels also ask what's left over (the carry). Stars per level (fewer slips = more stars),
 *     a timer with best times, and levels unlock in order. Progress is saved in this browser.
 *
 * Uses Sound / Celebrate / Lesson / Whimsy if present.
 */
(function () {
  const css = `
  .bs-sum { display:flex; justify-content:center; margin:1.2rem 0 .4rem; }
  .bs-grid { display:grid; grid-auto-flow:column; position:relative; font:800 2.3rem/1 var(--serif); padding-top:2.6rem; }
  .bs-d { align-self:end; padding:.25rem .55rem .2rem 0; color:var(--accent); }
  .bs-col { display:grid; grid-template-rows:auto auto; justify-items:center; min-width:2.6rem; }
  .bs-ans { height:2.7rem; display:grid; place-items:center; color:var(--good); border-bottom:4px solid var(--ink); width:100%; }
  .bs-col:first-of-type .bs-ans { border-radius:0; }
  .bs-dig { position:relative; height:2.9rem; display:grid; place-items:center; width:100%; border-left:0; }
  .bs-col.first .bs-dig { border-left:4px solid var(--ink); }
  .bs-col.first .bs-ans { border-left:4px solid transparent; }
  .bs-carry { position:absolute; left:.05rem; top:.05rem; font-size:.95rem; color:var(--pop); animation:bs-fly .45s cubic-bezier(.3,1.5,.5,1) both; }
  @keyframes bs-fly { from { transform:translate(-1.6rem,-.6rem) scale(1.6); opacity:0 } }
  .bs-col.now .bs-dig { background:var(--sun); border-radius:10px; }
  .bs-col.now .bs-ans { background:color-mix(in srgb, var(--sun) 35%, transparent); }
  .bs-rem { align-self:end; padding:0 0 .2rem .5rem; color:var(--good); font-size:1.6rem; white-space:nowrap; }
  .bs-bus { position:absolute; top:-.1rem; font-size:2rem; transition:left .55s cubic-bezier(.4,1.4,.5,1); transform:translateX(-50%) scaleX(-1); pointer-events:none; }
  .bs-bus.go { animation:bs-bounce .55s ease; }
  @keyframes bs-bounce { 30% { margin-top:-6px } 60% { margin-top:2px } }
  @media (prefers-reduced-motion: reduce) { .bs-bus { transition:none } .bs-carry { animation:none } .bs-bus.go { animation:none } }
  .bs-q { text-align:center; font-weight:800; font-size:1.2rem; min-height:1.8rem; margin:.3rem 0; }
  .bs-q .m { font-size:1.35rem; }
  .bs-pad { display:grid; grid-template-columns:repeat(5, minmax(0, 3.6rem)); gap:.45rem; justify-content:center; margin:.6rem 0; }
  .bs-pad button { font:800 1.5rem var(--serif); padding:.55rem 0; background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); }
  .bs-pad button:hover { border-color:var(--accent); }
  .bs-pad.wide { grid-template-columns:repeat(5, minmax(0, 3.6rem)); }
  .bs-help { display:flex; gap:.5rem; justify-content:center; flex-wrap:wrap; align-items:center; }
  .bs-table { text-align:center; font:700 1.05rem var(--serif); color:var(--muted); letter-spacing:.02em; margin:.3rem 0; word-spacing:.3rem; }
  .bs-levels { display:flex; flex-wrap:wrap; gap:.45rem; justify-content:center; margin-bottom:.6rem; }
  .bs-levels button { background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); font:700 .9rem var(--sans); padding:.4rem .7rem; line-height:1.25; }
  .bs-levels button small { display:block; font-size:.75rem; letter-spacing:.05em; }
  .bs-levels button.on { border-color:var(--accent); background:var(--accent-soft); }
  .bs-levels button:disabled { opacity:.5; }
  .bs-status { display:flex; justify-content:space-between; flex-wrap:wrap; gap:.4rem; font-weight:700; color:var(--muted); font-size:.95rem; }
  .bs-status .streak { color:var(--pop); }
  .bs-next { text-align:center; margin-top:.6rem; }
  @media (max-width:520px) { .bs-grid { font-size:1.8rem } .bs-col { min-width:2.1rem } .bs-pad button { font-size:1.25rem; padding:.45rem 0 } }
  /* iPhone landscape: the sum on the left, the number pad on the right, all on one screen */
  @media (orientation: landscape) and (max-height: 500px) {
    .bs-game { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); column-gap:1.2rem; align-items:center;
      grid-template-areas:"levels levels" "status status" "box pad" "q help" "table table" "fb fb" "next next"; }
    .bs-game > .bs-levels { grid-area:levels; flex-wrap:nowrap; overflow-x:auto; justify-content:flex-start; margin-bottom:.3rem; padding-bottom:4px; }
    .bs-game > .bs-levels button { flex:none; padding:.25rem .55rem; font-size:.8rem; }
    .bs-game > .bs-levels button small { font-size:.68rem; }
    .bs-game > .bs-status { grid-area:status; }
    .bs-game > .bs-box { grid-area:box; }
    .bs-game > .bs-q { grid-area:q; font-size:1.05rem; }
    .bs-game > .bs-pad { grid-area:pad; margin:0; }
    .bs-game > .bs-help { grid-area:help; }
    .bs-game > .bs-table { grid-area:table; }
    .bs-game > .feedback { grid-area:fb; }
    .bs-game > .bs-next { grid-area:next; }
    .bs-sum { margin:.3rem 0; }
    .bs-grid { font-size:2rem; padding-top:2.2rem; }
    .bs-pad { grid-template-columns:repeat(5, minmax(0, 3.3rem)); gap:.4rem; }
    .bs-pad button { font-size:1.35rem; padding:.5rem 0; }
  }`;

  function addCSS() {
    if (document.getElementById("busstop-css")) return;
    const s = document.createElement("style"); s.id = "busstop-css"; s.textContent = css; document.head.appendChild(s);
  }
  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const praise = () => (window.Lesson ? Lesson.praise() : "Yes!");
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* fine */ } }
  };

  // Work out every stop of n ÷ d: [{ cur, q, left }]
  function stops(d, n) {
    const digits = String(n).split("").map(Number);
    let carry = 0;
    return digits.map(g => {
      const cur = carry * 10 + g, q = Math.floor(cur / d), left = cur - q * d;
      carry = left;
      return { digit: g, carry: cur - g, cur, q, left };
    });
  }

  // Draws the bus stop. Returns helpers to fill it in.
  function drawSum(box, d, n) {
    const digits = String(n).split("");
    box.innerHTML = `<div class="bs-sum"><div class="bs-grid">
      <span class="bs-bus" aria-hidden="true">🚌</span>
      <div class="bs-d">${d}</div>
      ${digits.map((g, i) => `<div class="bs-col${i ? "" : " first"}" data-i="${i}"><div class="bs-ans"></div><div class="bs-dig">${g}</div></div>`).join("")}
      <div class="bs-rem"></div>
    </div></div>`;
    const cols = [...box.querySelectorAll(".bs-col")], bus = box.querySelector(".bs-bus"), grid = box.querySelector(".bs-grid");
    return {
      cols,
      at(i) {
        cols.forEach((c, j) => c.classList.toggle("now", j === i));
        if (i < 0 || i >= cols.length) return;
        const g = grid.getBoundingClientRect(), c = cols[i].getBoundingClientRect();
        bus.style.left = c.left - g.left + c.width / 2 + "px";
        bus.classList.remove("go"); void bus.offsetWidth; bus.classList.add("go");
      },
      answer(i, q) { const a = cols[i].querySelector(".bs-ans"); a.textContent = q; a.classList.remove("pop-in"); void a.offsetWidth; a.classList.add("pop-in"); },
      carry(i, c) { if (i < cols.length && c) cols[i].querySelector(".bs-dig").insertAdjacentHTML("beforeend", `<span class="bs-carry">${c}</span>`); },
      rem(r) { box.querySelector(".bs-rem").textContent = r ? `r ${r}` : ""; }
    };
  }

  /* ---------- Worked example ---------- */
  function demo(el, opts) {
    addCSS();
    const d = opts.d || 7, n = opts.n || 896;
    el.innerHTML = `<div class="bs-box"></div><p class="bs-q" aria-live="polite"></p>
      <div class="bs-next"><button type="button" class="bs-step">Next step ▶</button> <button type="button" class="ghost bs-again" hidden>↺ Watch again</button></div>`;
    const steps = stops(d, n);
    let i, sum;
    const q = el.querySelector(".bs-q"), stepBtn = el.querySelector(".bs-step"), again = el.querySelector(".bs-again");
    function reset() {
      i = 0; sum = drawSum(el.querySelector(".bs-box"), d, n); stepBtn.hidden = false; again.hidden = true;
      requestAnimationFrame(() => sum.at(0));
      q.innerHTML = `<span class="m">${n} ÷ ${d}</span>. The ${d} waits outside the bus stop. The bus visits each digit in turn.`;
    }
    stepBtn.onclick = () => {
      if (i >= steps.length) return;
      const s = steps[i];
      sum.at(i);
      sum.answer(i, s.q);
      const how = s.q ? `${s.q} × ${d} = ${s.q * d}` : `${d} is too big`;
      let text = `Stop ${i + 1}: how many ${d}s in <span class="m">${s.cur}</span>? <strong>${s.q}</strong> (${how}).`;
      if (s.left && i < steps.length - 1) { text += ` ${s.left} left over, so it hops to the next digit.`; sum.carry(i + 1, s.left); }
      else if (s.left) { text += ` ${s.left} left over: that's the <strong>remainder</strong>.`; sum.rem(s.left); }
      else text += " Nothing left over.";
      i++;
      if (i < steps.length) setTimeout(() => sum.at(i), 650);
      else {
        const ans = String(Math.floor(n / d)), r = n % d;
        text += `<br>🎉 <span class="m">${n} ÷ ${d} = ${ans}${r ? " r " + r : ""}</span>`;
        stepBtn.hidden = true; again.hidden = false;
        if (opts.onDone) opts.onDone();
      }
      q.innerHTML = text;
      if (window.Sound) Sound.play("drop");
    };
    again.onclick = reset;
    reset();
  }

  /* ---------- The game ---------- */
  const LEVELS = [
    { name: "Warm-up", tip: "No hopping yet", make: () => { const d = rnd(2, 4); let q; do { q = rnd(111, 333); } while (String(q * d).length !== 3 || stops(d, q * d).some(s => s.left || s.q === 0)); return [d, q * d]; } },
    { name: "Hop on", tip: "Leftovers hop along", askLeft: true, make: () => { const d = rnd(3, 6); let n; do { n = d * rnd(20, 166); } while (n < 100 || n > 999 || +String(n)[0] < d || !stops(d, n).some(s => s.left)); return [d, n]; } },
    { name: "Too small", tip: "First digit too small", askLeft: true, make: () => { const d = rnd(4, 9); let n; do { n = d * rnd(12, 249); } while (n < 100 || n > 999 || +String(n)[0] >= d); return [d, n]; } },
    { name: "Leftovers", tip: "Remainders", make: () => { const d = rnd(3, 9); let n; do { n = d * rnd(15, 140) + rnd(1, d - 1); } while (n < 100 || n > 999); return [d, n]; } },
    { name: "Big numbers", tip: "4 digits", make: () => { const d = rnd(3, 9); let n; do { n = d * rnd(100, 1111) + (Math.random() < .5 ? rnd(1, d - 1) : 0); } while (n < 1000 || n > 9999); return [d, n]; } },
    { name: "Boss 🦖", tip: "Zeros sneak in", make: () => { const d = rnd(6, 9); let n; do { n = d * rnd(102, 1099) + rnd(0, d - 1); } while (n < 1000 || n > 9999 || !stops(d, n).some(s => s.q === 0)); return [d, n]; } }
  ];
  const PER_LEVEL = 5;

  function game(el, opts) {
    addCSS();
    el.classList.add("bs-game");
    const KEY = "busstop:" + (opts.id || "v1");
    let saved = store.get(KEY, { stars: [], best: [] });
    let level, sumNo, slips, levelSlips, d, n, steps, i, phase, sum, t0, timer, streak = 0, busy = false;

    el.innerHTML = `
      <div class="bs-levels" role="group" aria-label="Levels"></div>
      <div class="bs-status"><span class="bs-lv"></span><span class="streak"></span><span class="bs-time">⏱ 0:00</span></div>
      <div class="bs-box"></div>
      <p class="bs-q" aria-live="polite"></p>
      <div class="bs-pad"></div>
      <div class="bs-help"><button type="button" class="ghost bs-tt">🧮 Show the times table</button></div>
      <p class="bs-table" hidden></p>
      <div class="feedback" aria-live="polite"></div>
      <div class="bs-next"><button type="button" hidden>Next sum ▶</button></div>`;
    const $ = s => el.querySelector(s);
    const pad = $(".bs-pad"), q = $(".bs-q"), nextBtn = $(".bs-next button"), table = $(".bs-table");
    pad.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(v => `<button type="button" data-v="${v}" aria-label="${v}">${v}</button>`).join("");
    pad.querySelectorAll("button").forEach(b => b.onclick = () => press(+b.dataset.v));
    $(".bs-tt").onclick = () => { table.hidden = !table.hidden; paintTable(); };
    nextBtn.onclick = () => (sumNo >= PER_LEVEL ? startLevel(Math.min(level + 1, LEVELS.length - 1)) : newSum());
    document.addEventListener("keydown", e => {
      if (!/^[0-9]$/.test(e.key) || /input|textarea/i.test(document.activeElement.tagName)) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || phase === "done") return;
      press(+e.key);
    });

    function say(html, kind) {
      const fb = $(".feedback");
      fb.className = "feedback" + (kind ? " " + kind : "");
      fb.style.background = kind || !html ? "" : "var(--accent-soft)";
      fb.innerHTML = html;
      if (kind === "bad") { fb.classList.remove("shake"); void fb.offsetWidth; fb.classList.add("shake"); }
    }
    function paintTable() { table.innerHTML = `${d}× table: ` + Array.from({ length: 9 }, (_, k) => d * (k + 1)).join(", "); $(".bs-tt").textContent = table.hidden ? `🧮 Show the ${d}× table` : `🙈 Hide the ${d}× table`; }
    function paintLevels() {
      const box = $(".bs-levels");
      box.innerHTML = LEVELS.map((L, k) => {
        const st = saved.stars[k] || 0, open = k === 0 || (saved.stars[k - 1] || 0) > 0;
        return `<button type="button" data-k="${k}" class="${k === level ? "on" : ""}" ${open ? "" : "disabled"}>${open ? "" : "🔒 "}${k + 1}. ${L.name}<small>${st ? "⭐".repeat(st) + "☆".repeat(3 - st) : open ? L.tip : "locked"}</small></button>`;
      }).join("");
      box.querySelectorAll("button").forEach(b => b.onclick = () => startLevel(+b.dataset.k));
    }
    function tick() {
      const s = Math.floor((Date.now() - t0) / 1000);
      $(".bs-time").textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    }

    function startLevel(k) {
      level = k; sumNo = 0; levelSlips = 0;
      clearInterval(timer); t0 = Date.now(); timer = setInterval(tick, 1000); tick();
      paintLevels();
      newSum();
    }
    function newSum() {
      [d, n] = LEVELS[level].make();
      steps = stops(d, n); i = 0; phase = "q"; slips = 0; busy = false;
      nextBtn.hidden = true;
      sum = drawSum($(".bs-box"), d, n);
      requestAnimationFrame(() => sum.at(0));
      $(".bs-lv").textContent = `Level ${level + 1} · sum ${sumNo + 1} of ${PER_LEVEL}`;
      if (!table.hidden) paintTable(); else $(".bs-tt").textContent = `🧮 Show the ${d}× table`;
      say("");
      ask();
    }
    function ask() {
      const s = steps[i];
      if (phase === "q") q.innerHTML = `How many <span class="m">${d}</span>s go into <span class="m">${s.cur}</span>?`;
      else q.innerHTML = `<span class="m">${s.q} × ${d} = ${s.q * d}</span>. How many are left over from <span class="m">${s.cur}</span>?`;
    }

    function press(v) {
      if (busy || phase === "done" || !steps) return;
      if (window.Sound) Sound.play("select");
      const s = steps[i];
      if (phase === "q") {
        if (v !== s.q) return miss(v > s.q
          ? `<span class="m">${v} × ${d} = ${v * d}</span>. That's more than ${s.cur}. Try smaller.`
          : `<span class="m">${v} × ${d} = ${v * d}</span>. There's room for more ${d}s in ${s.cur}. Try bigger.`);
        sum.answer(i, v);
        if (window.Sound) Sound.play("drop");
        const last = i === steps.length - 1;
        if (s.left && (LEVELS[level].askLeft || last)) { phase = "left"; say(""); return ask(); }
        return afterLeft();
      }
      // phase "left"
      if (v !== s.left) return miss(`Take away: <span class="m">${s.cur} − ${s.q * d}</span> = ?`);
      afterLeft();
    }
    function miss(html) {
      slips++; levelSlips++; streak = 0; $(".streak").textContent = "";
      say(html, "bad");
    }
    function afterLeft() {
      const s = steps[i], last = i === steps.length - 1;
      say("");
      if (!last) {
        if (s.left) sum.carry(i + 1, s.left);
        i++; phase = "q"; busy = true;
        setTimeout(() => { busy = false; sum.at(i); ask(); }, 380);
        return;
      }
      if (s.left) sum.rem(s.left);
      finishSum();
    }
    function finishSum() {
      phase = "done"; sum.at(-1);
      sumNo++; streak++;
      $(".streak").textContent = streak >= 3 ? `🔥 ${streak} in a row` : "";
      const ans = Math.floor(n / d), r = n % d;
      q.innerHTML = `<span class="m">${n} ÷ ${d} = ${ans}${r ? " r " + r : ""}</span>`;
      if (sumNo < PER_LEVEL) {
        say(`🎉 ${slips ? "Got it!" : praise()} ${PER_LEVEL - sumNo} more to finish the level.`, "good");
        nextBtn.textContent = "Next sum ▶"; nextBtn.hidden = false; nextBtn.focus({ preventScroll: true });
        return;
      }
      clearInterval(timer); tick();
      const secs = Math.round((Date.now() - t0) / 1000);
      const stars = levelSlips === 0 ? 3 : levelSlips <= 3 ? 2 : 1;
      const before = saved.best[level], best = before ? Math.min(before, secs) : secs;
      saved.stars[level] = Math.max(saved.stars[level] || 0, stars);
      saved.best[level] = best;
      store.set(KEY, saved);
      paintLevels();
      const time = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      const record = before && secs < before ? ` 🏅 New best time: ${time(secs)}!` : before ? ` Your best is ${time(best)}.` : "";
      const lastLevel = level === LEVELS.length - 1;
      say(`🏆 <strong>Level ${level + 1} done${window.Lesson ? ", " + Lesson.name : ""}!</strong> ${"⭐".repeat(stars)}${"☆".repeat(3 - stars)} in ${time(secs)}.${record}
        ${stars < 3 ? "<br>No slips gets 3 stars. Play it again any time." : ""}${lastLevel ? "<br>🦖 You beat the boss! Try for 3 stars on every level." : ""}`, "good");
      if (window.Celebrate) Celebrate.burst();
      if (opts.onLevel) opts.onLevel(level);
      if (lastLevel && opts.onDone) opts.onDone();
      nextBtn.textContent = lastLevel ? "Play the boss again ▶" : `Level ${level + 2} ▶`;
      nextBtn.hidden = false;
    }

    // Start on the first level without stars.
    const first = LEVELS.findIndex((_, k) => !saved.stars[k]);
    startLevel(first < 0 ? 0 : first);
  }

  window.BusStop = { demo, game, stops };
})();
