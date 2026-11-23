/*
 * Hops: "4 × (−3) means 4 hops of −3" on a number line.
 *
 *   Hops.mount(el, { times: 4, step: -3, onDone() {} });
 *
 * The frog starts at 0. The learner taps "Hop" (or the frog, or drags the frog left/right)
 * once per hop. After the last hop they pick where it landed, then see times × (step) = answer.
 * "New hops" picks fresh numbers (times 2–5, step −1 to −5). Uses Sound / Celebrate / Lesson if present.
 */
(function () {
  const css = `
  .hp-sum { text-align:center; font:800 1.8rem var(--serif); margin:.2rem 0 .4rem; }
  .hp-line { position:relative; height:150px; margin:0 .6rem; }
  .hp-axis { position:absolute; left:0; right:0; bottom:38px; height:3px; background:var(--ink); border-radius:2px; }
  .hp-tick { position:absolute; bottom:32px; width:2px; height:14px; background:var(--muted); transform:translateX(-1px); }
  .hp-tick.major { height:20px; bottom:29px; background:var(--ink); }
  .hp-num { position:absolute; bottom:4px; transform:translateX(-50%); font:700 .95rem var(--sans); color:var(--muted); white-space:nowrap; }
  .hp-num.zero { color:var(--ink); }
  .hp-arcs { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
  .hp-arcs text { font:800 15px var(--sans); }
  .hp-frog { position:absolute; bottom:44px; font-size:2.2rem; line-height:1; transform:translateX(-50%); transition:left .5s cubic-bezier(.3,.7,.4,1);
    touch-action:none; user-select:none; z-index:2; }
  .hp-frog > span { display:inline-block; }
  .hp-frog.jump > span { animation:hp-jump .5s cubic-bezier(.3,.7,.4,1); }
  @keyframes hp-jump { 0%{transform:translateY(0) scale(1,1)} 15%{transform:translateY(0) scale(1.15,.85)} 50%{transform:translateY(-46px) scale(.95,1.08)} 85%{transform:translateY(0) scale(1.1,.9)} 100%{transform:translateY(0) scale(1)} }
  @media (prefers-reduced-motion: reduce) { .hp-frog { transition:none } .hp-frog.jump > span { animation:none } }
  .hp-bar { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; align-items:center; margin-top:.4rem; }
  .hp-count { font-weight:700; color:var(--muted); }
  .hp-q { text-align:center; font-weight:700; margin:.8rem 0 .3rem; }
  .hp-choices { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; }
  .hp-choices button { font:800 1.3rem var(--serif); background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); min-width:4.5rem; }
  .hp-choices button:hover { border-color:var(--accent); }
  .hp-actions { text-align:center; margin-top:.8rem; }
  @media (max-width:520px) { .hp-num { font-size:.8rem } .hp-sum { font-size:1.5rem } }`;

  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const neg = n => (n < 0 ? "−" + Math.abs(n) : String(n));
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

  function mount(el, opts) {
    if (!document.getElementById("hops-css")) {
      const s = document.createElement("style"); s.id = "hops-css"; s.textContent = css; document.head.appendChild(s);
    }
    let times = opts.times || 4, step = opts.step || -3, hops, finished = false;

    function start() {
      hops = 0;
      const end = times * step;
      const lo = Math.min(0, end) - 1, hi = Math.max(0, end) + 1;
      const pos = v => ((v - lo) / (hi - lo)) * 100;
      let ticks = "";
      for (let v = lo; v <= hi; v++) {
        const major = v === 0 || v % Math.abs(step) === 0;
        ticks += `<span class="hp-tick${major ? " major" : ""}" style="left:${pos(v)}%"></span>`;
        if (major) ticks += `<span class="hp-num${v === 0 ? " zero" : ""}" style="left:${pos(v)}%">${neg(v)}</span>`;
      }
      el.innerHTML = `
        <p class="hp-sum"><span class="m">${times} × (${neg(step)})</span></p>
        <div class="hp-line">
          <svg class="hp-arcs" aria-hidden="true"></svg>
          <div class="hp-axis"></div>${ticks}
          <div class="hp-frog" role="img" aria-label="Frog at 0" title="Tap me, or drag me, to hop"><span>🐸</span></div>
        </div>
        <div class="hp-bar"><button class="hp-hop">🐸 Hop ${neg(step)}</button><span class="hp-count"></span></div>
        <div class="hp-q"></div><div class="hp-choices"></div>
        <div class="feedback" aria-live="polite"></div>
        <div class="hp-actions"><button class="ghost hp-new">🎲 New hops</button></div>`;
      const $ = s => el.querySelector(s);
      const frog = $(".hp-frog");
      frog.style.left = pos(0) + "%";
      count();
      say(`<span class="m">${times} × (${neg(step)})</span> means <strong>${times} hops</strong> of <span class="m">${neg(step)}</span>. Tap <strong>Hop</strong> (or tap the frog) ${times} times.`);

      const hop = () => {
        if (hops >= times) return;
        const from = hops * step;
        hops++;
        const to = hops * step;
        frog.style.left = pos(to) + "%";
        frog.classList.remove("jump"); void frog.offsetWidth; frog.classList.add("jump");
        frog.setAttribute("aria-label", "Frog at " + neg(to));
        if (window.Sound) Sound.play("pick");
        setTimeout(() => { if (window.Sound) Sound.play("drop"); }, 420);
        arc(from, to);
        count();
        if (hops === times) { $(".hp-hop").disabled = true; setTimeout(ask, 550); }
        else say(`${hops} hop${hops > 1 ? "s" : ""} done. ${times - hops} to go!`);
      };
      $(".hp-hop").onclick = hop;

      // Tap the frog to hop; dragging it sideways also counts as a hop.
      let sx = null;
      frog.addEventListener("pointerdown", e => { sx = e.clientX; frog.setPointerCapture(e.pointerId); });
      frog.addEventListener("pointerup", e => { if (sx !== null) { sx = null; hop(); } });
      frog.addEventListener("pointercancel", () => { sx = null; });

      $(".hp-new").onclick = () => {
        let nt, ns;
        do { nt = rnd(2, 5); ns = -rnd(1, 5); } while (nt === times && ns === step);
        times = nt; step = ns; start();
      };

      function count() { $(".hp-count").textContent = `${hops} of ${times} hops`; }

      function arc(from, to) {
        const svg = $(".hp-arcs"), box = $(".hp-line").getBoundingClientRect();
        const x0 = pos(from) / 100 * box.width, x1 = pos(to) / 100 * box.width, y = box.height - 40;
        const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", `M ${x0} ${y} Q ${(x0 + x1) / 2} ${y - 70} ${x1} ${y}`);
        p.setAttribute("fill", "none"); p.setAttribute("stroke-width", "3"); p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-dasharray", "5 6");
        p.style.stroke = "var(--bad)";
        svg.appendChild(p);
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", (x0 + x1) / 2); t.setAttribute("y", y - 40); t.setAttribute("text-anchor", "middle");
        t.style.fill = "var(--bad)"; t.textContent = neg(step);
        svg.appendChild(t);
      }

      function ask() {
        const right = times * step;
        $(".hp-q").innerHTML = `Where did the frog land? So what is <span class="m">${times} × (${neg(step)})</span>?`;
        say("");
        const wrongs = [-right, right - step, times + step].filter((v, i, a) => v !== right && a.indexOf(v) === i).slice(0, 2);
        shuffle([right, ...wrongs]).forEach(v => {
          const b = document.createElement("button");
          b.type = "button"; b.textContent = neg(v); b.className = "pop-in";
          b.onclick = () => {
            if (v === right) {
              $(".hp-q").innerHTML = ""; $(".hp-choices").innerHTML = "";
              say(`🎉 <strong>${window.Lesson ? Lesson.praise() : "Yes!"}</strong> ${times} hops of <span class="m">${neg(step)}</span> lands on <span class="m">${neg(right)}</span>.
                <span class="display" style="display:block;margin:.4rem 0 0"><span class="m">${times} × (${neg(step)}) = ${neg(right)}</span></span>
                Every hop goes the <strong>minus</strong> way, so the answer is <strong>negative</strong>. Try 🎲 <strong>New hops</strong>, or scroll down 👇`, "good");
              if (!finished) { finished = true; if (window.Celebrate) Celebrate.burst(); if (opts.onDone) opts.onDone(); }
            } else {
              b.disabled = true;
              b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
              say(v > 0 ? "Look where the frog is sitting. Is that on the plus side or the minus side of 0?"
                        : `Count the hops: ${times} hops, each one ${Math.abs(step)} to the left. Multiply, don't add!`, "bad");
            }
          };
          $(".hp-choices").appendChild(b);
        });
      }

      function say(html, kind) {
        const fb = $(".feedback");
        fb.className = "feedback" + (kind ? " " + kind : "");
        fb.style.background = kind || !html ? "" : "var(--accent-soft)";
        fb.innerHTML = html;
      }
    }

    start();
  }

  window.Hops = { mount };
})();
