/*
 * PercentBar: a price as a bar of ten 10% blocks. Drag the handle to stretch it (increase)
 * or shrink it (decrease), then pick the new price.
 *
 *   PercentBar.mount(el, {
 *     rounds: [ { item: "👟 Trainers", price: 40, change: 20 }, { item: "🎧 Headphones", price: 60, change: -30 } ],
 *     onDone() {}
 *   });
 *
 * The bar runs from 50% to 150% in 10% steps. Keyboard: focus the handle, use ← →.
 * Also exports PercentBar.money(n) → "£4.50" / "£48".
 */
(function () {
  const css = `
  .pb-task { text-align:center; font-weight:700; font-size:1.1rem; margin:.3rem 0 .2rem; }
  .pb-tag { display:inline-block; background:var(--sun); color:#2a2340; font:800 1.2rem var(--display); padding:.2rem .9rem .2rem 1.3rem; border-radius:8px 18px 18px 8px; position:relative; margin:.3rem 0; }
  .pb-tag::before { content:""; position:absolute; left:.45rem; top:50%; width:.45rem; height:.45rem; border-radius:50%; background:var(--surface); transform:translateY(-50%); }
  .pb-wrap { position:relative; margin:2.2rem .4rem .6rem; height:58px; touch-action:none; }
  .pb-track { position:absolute; inset:0; display:flex; }
  .pb-block { flex:none; height:100%; border:2px solid var(--surface); border-radius:8px; display:grid; place-items:center; font:800 .8rem var(--sans); color:#2a2340; transition:background .15s, opacity .15s; }
  .pb-block.base { background:var(--part-a); }
  .pb-block.extra { background:var(--pop); color:#fff; }
  .pb-block.gone { background:repeating-linear-gradient(45deg, var(--bad-soft) 0 6px, transparent 6px 12px); border:2px dashed var(--bad); color:var(--bad); }
  .pb-block.empty { background:transparent; border:2px dashed var(--rule); color:transparent; }
  .pb-handle { position:absolute; top:-10px; bottom:-10px; width:26px; margin-left:-13px; border-radius:13px; background:var(--accent); border:3px solid var(--surface);
    box-shadow:0 3px 10px rgba(0,0,0,.2); cursor:grab; display:grid; place-items:center; color:#fff; font-weight:800; font-size:.8rem; }
  .pb-handle:active, html.is-dragging .pb-handle { cursor:grabbing; }
  .pb-handle:focus-visible { outline:3px solid var(--pop); outline-offset:2px; }
  .pb-hundred { position:absolute; top:-1.7rem; font:800 .8rem var(--sans); color:var(--muted); transform:translateX(-50%); white-space:nowrap; }
  .pb-hundred::after { content:""; position:absolute; left:50%; top:1.2rem; height:calc(58px + 1rem); border-left:2px dotted var(--muted); }
  .pb-read { text-align:center; font:800 1.4rem var(--serif); margin:.8rem 0 .2rem; }
  .pb-read b { color:var(--pop); }
  .pb-key { text-align:center; color:var(--muted); font-weight:700; }
  .pb-q { text-align:center; font-weight:700; margin:.7rem 0 .3rem; }
  .pb-choices { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; }
  .pb-choices button { font:800 1.2rem var(--serif); background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); min-width:5rem; }
  .pb-choices button:hover { border-color:var(--accent); }
  .pb-stars { text-align:center; font-size:1.3rem; letter-spacing:.2em; }
  .pb-next { text-align:center; margin-top:.6rem; }
  @media (orientation: landscape) and (max-height: 500px) { .pb-wrap { margin-top:1.8rem } .pb-read { font-size:1.2rem; margin:.5rem 0 0 } .pb-task { font-size:1rem } }
  @media (max-width:520px) { .pb-handle { width:16px; margin-left:-8px; font-size:0; border-width:2px } .pb-block { font-size:.6rem } .pb-wrap { height:48px } .pb-hundred::after { height:calc(48px + 1rem) } }`;

  const money = n => {
    const r = Math.round(n * 100) / 100;
    return "£" + (Number.isInteger(r) ? r : r.toFixed(2));
  };
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const praise = () => (window.Lesson ? Lesson.praise() : "Yes!");

  function mount(el, opts) {
    if (!document.getElementById("percent-css")) {
      const s = document.createElement("style"); s.id = "percent-css"; s.textContent = css; document.head.appendChild(s);
    }
    const rounds = opts.rounds, MIN = 50, MAX = 150, STEPS = 15;   // 15 blocks of 10% across the track
    let n = 0, r, pct, locked, revealed, slips = 0;

    el.innerHTML = `
      <div class="pb-stars"></div>
      <p class="pb-task"></p>
      <div class="pb-wrap"><div class="pb-track"></div><span class="pb-hundred">100%</span>
        <div class="pb-handle" role="slider" tabindex="0" aria-label="Percentage of the old price" aria-valuemin="${MIN}" aria-valuemax="${MAX}">⇔</div></div>
      <p class="pb-read" aria-live="polite"></p>
      <p class="pb-key"></p>
      <div class="pb-q"></div><div class="pb-choices"></div>
      <div class="feedback" aria-live="polite"></div>
      <div class="pb-next"><button type="button" hidden>Next one ▶</button></div>`;
    const $ = s => el.querySelector(s);
    const wrap = $(".pb-wrap"), track = $(".pb-track"), handle = $(".pb-handle"), nextBtn = $(".pb-next button");
    const blockW = 100 / STEPS;
    track.innerHTML = Array.from({ length: STEPS }, (_, i) => `<span class="pb-block" style="width:${blockW}%"></span>`).join("");
    $(".pb-hundred").style.left = 10 * blockW + "%";
    nextBtn.onclick = start;

    function say(html, kind) {
      const fb = $(".feedback");
      fb.className = "feedback" + (kind ? " " + kind : "");
      fb.style.background = kind || !html ? "" : "var(--accent-soft)";
      fb.innerHTML = html;
    }
    const stars = () => { $(".pb-stars").textContent = rounds.map((_, i) => (i < n ? "⭐" : "☆")).join(""); };

    function paint() {
      const tenth = r.price / 10;
      [...track.children].forEach((b, i) => {
        const blockPct = (i + 1) * 10;
        b.className = "pb-block " + (blockPct <= Math.min(pct, 100) ? "base" : blockPct <= 100 ? "gone" : blockPct <= pct ? "extra" : "empty");
        b.textContent = blockPct <= Math.max(pct, 100) ? money(tenth) : "";
      });
      handle.style.left = (pct / 10) * blockW + "%";
      handle.setAttribute("aria-valuenow", pct);
      handle.setAttribute("aria-valuetext", pct + "%");
      const diff = pct - 100;
      $(".pb-read").innerHTML = diff === 0 ? `100% = <b>${money(r.price)}</b>`
        : `${pct}% <span class="meta">(${diff > 0 ? "+" : "−"}${Math.abs(diff)}%)</span>` + (revealed ? ` = <b>${money(r.price * pct / 100)}</b>` : "");
    }

    function start() {
      r = rounds[n]; pct = 100; locked = false; revealed = false; nextBtn.hidden = true;
      const up = r.change > 0;
      $(".pb-task").innerHTML = `<span class="pb-tag">${r.item} ${money(r.price)}</span><br>${r.text || (up ? `The price goes <span style="color:var(--pop)">up ${r.change}%</span>.` : `Sale! <span style="color:var(--pop)">${-r.change}% off</span>.`)}`;
      $(".pb-key").innerHTML = `Each block is 10% of ${money(r.price)}, which is <strong>${money(r.price / 10)}</strong>.`;
      $(".pb-q").innerHTML = ""; $(".pb-choices").innerHTML = "";
      say(`Drag the purple handle ${up ? "right to <strong>add</strong>" : "left to <strong>take away</strong>"} blocks. Stop at the new price.`);
      paint();
    }

    function setPct(p, fromDrag) {
      if (locked) return;
      p = Math.max(MIN, Math.min(MAX, Math.round(p / 10) * 10));
      if (p !== pct) { pct = p; paint(); if (window.Sound) Sound.play("select"); }
      if (!fromDrag) check();
    }

    function check() {
      const target = 100 + r.change;
      if (pct === 100) return;
      if (pct !== target) {
        slips++;
        const dir = r.change > 0 ? "up" : "down";
        if ((pct > 100) !== (r.change > 0)) return say(`Wrong way! The price goes <strong>${dir}</strong>, so ${dir === "up" ? "add blocks (drag right)" : "take blocks away (drag left)"}.`, "bad");
        return say(`That's ${Math.abs(pct - 100)}%. You need ${Math.abs(r.change)}%, which is ${Math.abs(r.change) / 10} block${Math.abs(r.change) === 10 ? "" : "s"}.`, "bad");
      }
      locked = true;
      const newPrice = r.price * target / 100, step = r.price / 10, k = Math.abs(r.change) / 10;
      say(`✅ ${target}% of the old price. Now, what's the new price?`, "good");
      $(".pb-q").innerHTML = `${r.item.split(" ").slice(1).join(" ")}: ${money(r.price)} ${r.change > 0 ? "+" : "−"} ${k} × ${money(step)} = ?`;
      const wrongs = [r.price + (r.change > 0 ? -1 : 1) * k * step, r.change > 0 ? r.price + Math.abs(r.change) : r.price - Math.abs(r.change), k * step]
        .filter((v, i, s) => v > 0 && Math.abs(v - newPrice) > .001 && s.findIndex(w => Math.abs(w - v) < .001) === i).slice(0, 2);
      $(".pb-choices").innerHTML = "";
      shuffle([newPrice, ...wrongs]).forEach(v => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = money(v); b.className = "pop-in";
        b.onclick = () => {
          if (Math.abs(v - newPrice) > .001) {
            slips++; b.disabled = true; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
            return say(Math.abs(v - k * step) < .001 ? `${money(v)} is how much it ${r.change > 0 ? "goes up" : "comes off"}. ${r.change > 0 ? "Add it to" : "Take it from"} ${money(r.price)}.`
              : `Look at the bar: ${target / 10} blocks of ${money(step)}.`, "bad");
          }
          $(".pb-q").innerHTML = ""; $(".pb-choices").innerHTML = "";
          revealed = true; paint();
          n++; stars();
          say(`🎉 <strong>${praise()}</strong> ${money(r.price)} ${r.change > 0 ? "+" : "−"} ${money(k * step)} = <strong>${money(newPrice)}</strong>. That's ${target}% of the old price, or <span class="m">${money(r.price)} × ${target / 100}</span>.`, "good");
          if (n >= rounds.length) {
            if (window.Celebrate) Celebrate.burst();
            say(`🏆 All done${window.Lesson ? ", " + Lesson.name : ""}${slips ? "" : ", no slips"}! Going up adds blocks, going down takes them away. Scroll down for the next game 👇`, "good");
            if (opts.onDone) opts.onDone();
          } else nextBtn.hidden = false;
        };
        $(".pb-choices").appendChild(b);
      });
    }

    // Dragging the handle (or tapping anywhere on the bar).
    const fromX = x => { const b = wrap.getBoundingClientRect(); return ((x - b.left) / b.width) * STEPS * 10; };
    wrap.addEventListener("pointerdown", e => {
      if (locked) return;
      e.preventDefault();
      document.documentElement.classList.add("is-dragging");
      if (window.Sound) Sound.play("pick");
      setPct(fromX(e.clientX), true);
      const move = ev => setPct(fromX(ev.clientX), true);
      const up = () => {
        document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up);
        document.documentElement.classList.remove("is-dragging");
        check();
      };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    });
    handle.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setPct(pct + 10); }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setPct(pct - 10); }
    });

    stars(); start();
  }

  window.PercentBar = { mount, money };
})();
