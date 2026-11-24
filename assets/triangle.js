/*
 * Triangles and equations.
 *
 *   TrianglePlay.mount(el, { onDone })
 *     Drag the corners of a triangle; the three angles update live and always add to 180°.
 *     After a few drags it asks what they always add up to.
 *
 *   Balance.mount(el, { rounds, generate: () => ({ a: 3, b: 30, c: 180, L: "x" }), onDone })
 *     Solve a·L + b = c on a balance scale by picking "do the same to both sides" moves.
 *
 *   TriangleEq.mount(el, { rounds, generate: () => TriangleEq.round(x, [[c1,k1],[c2,k2],[c3,k3]], L), onDone })
 *     Full problem: angles like 2x + 10 on a triangle → drag them into "_ + _ + _ = 180" → collect like terms
 *     → solve on the balance → see every angle and check they add to 180.
 *
 * Needs drag.js for TriangleEq. Uses Sound / Celebrate / Lesson / Whimsy if present.
 */
(function () {
  const css = `
  .tri svg { display:block; width:100%; max-width:420px; height:auto; margin:0 auto; touch-action:none; }
  .tri .corner { cursor:grab; }
  .tri .corner:active, html.is-dragging .tri .corner { cursor:grabbing; }
  .tri-sum { text-align:center; font:800 1.4rem var(--serif); margin:.3rem 0; }
  .tri-sum b { color:var(--pop); }
  .tri-q, .bl-q, .te-q { text-align:center; font-weight:700; margin:.7rem 0 .3rem; }
  .tri-choices, .bl-moves, .te-choices { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; }
  .tri-choices button, .bl-moves button, .te-choices button { font:800 1.15rem var(--serif); background:var(--surface); color:var(--ink); border:2px solid var(--rule); box-shadow:0 3px 0 var(--rule); }
  .tri-choices button:hover, .bl-moves button:hover, .te-choices button:hover { border-color:var(--accent); }

  .bl-scale { position:relative; isolation:isolate; max-width:440px; margin:1.2rem auto 0; padding-top:.5rem; }
  .bl-scale::after { content:""; position:absolute; left:50%; top:.5rem; width:10px; height:calc(100% + 10px); transform:translateX(-50%); background:var(--muted); border-radius:4px; z-index:-1; }
  .bl-beam { position:relative; height:8px; background:var(--ink); border-radius:4px; margin:0 6%; transform-origin:50% 50%; transition:transform .45s cubic-bezier(.3,1.6,.5,1); }
  .bl-beam.wobble { animation:bl-wobble .8s ease; }
  @keyframes bl-wobble { 25% { transform:rotate(-5deg) } 60% { transform:rotate(3deg) } 100% { transform:rotate(0) } }
  .bl-pans { display:flex; justify-content:space-between; gap:1rem; margin-top:-2px; }
  .bl-pan { flex:1; max-width:46%; text-align:center; background:var(--accent-soft); border:3px solid var(--accent); border-top:0; border-radius:0 0 40% 40% / 0 0 60% 60%;
    padding:.8rem .4rem 1.2rem; font:800 1.6rem var(--serif); min-height:4.6rem; display:grid; place-items:center; }
  .bl-pan.right { background:var(--teal-soft); border-color:var(--teal); }
  .bl-base { width:120px; height:10px; background:var(--muted); margin:10px auto .4rem; border-radius:5px; }
  .bl-history { text-align:center; color:var(--muted); font:700 1rem var(--serif); min-height:1.4rem; }
  .bl-stars { text-align:center; font-size:1.3rem; letter-spacing:.2em; }
  @media (prefers-reduced-motion: reduce) { .bl-beam.wobble { animation:none } }
  @media (max-width:520px) { .bl-pan { font-size:1.25rem; min-height:4rem } }

  .te-eq { display:flex; justify-content:center; align-items:center; flex-wrap:wrap; gap:.35rem; font:800 1.4rem var(--serif); margin:.6rem 0; }
  .te-slot { display:inline-grid; place-items:center; min-width:4.2rem; height:2.6rem; padding:0 .4rem; border-radius:12px; border:3px dashed var(--rule); background:var(--surface); color:var(--muted); }
  .te-slot.filled { border-style:solid; border-color:var(--good); background:var(--good-soft); color:var(--ink); }
  .te-chips { display:flex; gap:.6rem; justify-content:center; flex-wrap:wrap; min-height:3rem; }
  .te-chip { background:var(--pop); color:#fff; font:800 1.25rem var(--serif); border-radius:14px; padding:.2rem .8rem; box-shadow:0 4px 0 color-mix(in srgb, var(--pop) 60%, #000); touch-action:none; user-select:none; }
  @media (max-width:520px) { .te-eq { font-size:1.15rem } .te-slot { min-width:3.4rem; height:2.3rem } }
  /* iPhone landscape: picture on the left, what to do on the right */
  @media (orientation: landscape) and (max-height: 500px) {
    .tri-play { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); column-gap:1rem; align-items:center; }
    .tri-play svg { grid-row:1 / span 5; max-height:62vh; }
    .te-stage { display:grid; grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr); column-gap:1rem; align-items:center; }
    .te-stage > svg { grid-row:1 / span 5; max-height:58vh; }
    .te-stage > .te-solve { grid-column:1 / -1; }
    .bl-box, .te-solve { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); column-gap:1rem; align-items:center;
      grid-template-areas:"scale q" "scale moves" "base hist"; }
    .bl-box .bl-scale, .te-solve .bl-scale { grid-area:scale; align-self:end; justify-self:stretch; width:100%; max-width:380px; margin:.4rem auto 0; }
    .bl-box .bl-base, .te-solve .bl-base { grid-area:base; align-self:start; }
    .bl-box .bl-q, .te-solve .bl-q { grid-area:q; }
    .bl-box .bl-moves, .te-solve .bl-moves { grid-area:moves; }
    .bl-box .bl-history, .te-solve .bl-history { grid-area:hist; }
    .bl-pan { font-size:1.3rem; min-height:3.6rem; padding:.5rem .3rem .9rem; }
    .te-eq { font-size:1.2rem; margin:.3rem 0; }
    .te-slot { height:2.3rem; }
  }`;

  function addCSS() {
    if (document.getElementById("triangle-css")) return;
    const s = document.createElement("style"); s.id = "triangle-css"; s.textContent = css; document.head.appendChild(s);
  }
  const NS = "http://www.w3.org/2000/svg";
  const ital = s => String(s).replace(/-/g, "−").replace(/([a-z])/g, "<i>$1</i>");
  const shuffle = arr => arr.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const praise = () => (window.Lesson ? Lesson.praise() : "Yes!");
  const term = (c, L) => (c === 1 ? L : c === -1 ? "-" + L : c + L);
  // "3x + 30", "3x − 30", "3x", "70"
  function expr(c, k, L) {
    if (!c) return String(k);
    const t = term(c, L);
    return k > 0 ? `${t} + ${k}` : k < 0 ? `${t} - ${-k}` : t;
  }
  function say(el, html, kind) {
    const fb = el.querySelector(":scope > .feedback");
    fb.className = "feedback" + (kind ? " " + kind : "");
    fb.style.background = kind || !html ? "" : "var(--accent-soft)";
    fb.innerHTML = html;
    if (kind === "bad") { fb.classList.remove("shake"); void fb.offsetWidth; fb.classList.add("shake"); }
  }
  function choiceButtons(box, options, onPick) {
    box.innerHTML = "";
    options.forEach(o => {
      const b = document.createElement("button");
      b.type = "button"; b.innerHTML = o.html; b.className = "pop-in";
      b.onclick = () => onPick(o, b);
      box.appendChild(b);
    });
  }
  function shakeOff(b) { b.disabled = true; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); }

  /* ---------- drawing ---------- */
  const angleAt = (P, Q, R) => {   // angle at P in degrees
    const a = Math.atan2(Q[1] - P[1], Q[0] - P[0]), b = Math.atan2(R[1] - P[1], R[0] - P[0]);
    let d = Math.abs(a - b) * 180 / Math.PI; if (d > 180) d = 360 - d; return d;
  };
  // Draws a triangle with angle arcs and labels into svg. labels: html-free strings.
  function drawTriangle(svg, pts, labels, colours) {
    svg.innerHTML = "";
    const add = (tag, attrs, style) => {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (style) e.setAttribute("style", style);
      svg.appendChild(e); return e;
    };
    add("polygon", { points: pts.map(p => p.join(",")).join(" ") }, "fill:var(--accent-soft);stroke:var(--ink);stroke-width:3;stroke-linejoin:round");
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    pts.forEach((P, i) => {
      const Q = pts[(i + 1) % 3], R = pts[(i + 2) % 3];
      const a1 = Math.atan2(Q[1] - P[1], Q[0] - P[0]), a2 = Math.atan2(R[1] - P[1], R[0] - P[0]);
      const r = 36;
      let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const s = [P[0] + r * Math.cos(a1), P[1] + r * Math.sin(a1)], e = [P[0] + r * Math.cos(a1 + d), P[1] + r * Math.sin(a1 + d)];
      add("path", { d: `M ${P[0]} ${P[1]} L ${s[0]} ${s[1]} A ${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${e[0]} ${e[1]} Z` },
        `fill:${(colours || [])[i] || "var(--sun)"};opacity:.85;stroke:none`);
      // label: pushed from the corner towards the middle
      const vx = cx - P[0], vy = cy - P[1], len = Math.hypot(vx, vy) || 1;
      const push = Math.min(62, len * .62);
      const t = add("text", { x: P[0] + vx / len * push, y: P[1] + vy / len * push + 6, "text-anchor": "middle" },
        "font:800 17px var(--serif);fill:var(--ink);paint-order:stroke;stroke:var(--accent-soft);stroke-width:5px;stroke-linejoin:round");
      String(labels[i]).split(/([a-z])/).forEach(run => {
        if (!run) return;
        const sp = document.createElementNS(NS, "tspan");
        if (/^[a-z]$/.test(run)) sp.setAttribute("font-style", "italic");
        sp.textContent = run.replace(/-/g, "−");
        t.appendChild(sp);
      });
    });
    return add;
  }

  /* ---------- TrianglePlay ---------- */
  function play(el, opts) {
    addCSS();
    el.classList.add("tri", "tri-play");
    el.innerHTML = `<svg viewBox="0 0 320 230" role="img" aria-label="A triangle with corners you can drag"></svg>
      <p class="tri-sum" aria-live="polite"></p>
      <div class="tri-q"></div><div class="tri-choices"></div>
      <div class="feedback" aria-live="polite"></div>`;
    const svg = el.querySelector("svg");
    let pts = [[40, 200], [285, 195], [120, 40]], drags = 0, asked = false, finished = false;

    function angles() {
      const a = [0, 1, 2].map(i => angleAt(pts[i], pts[(i + 1) % 3], pts[(i + 2) % 3]));
      const r0 = Math.round(a[0]), r1 = Math.round(a[1]);
      return [r0, r1, 180 - r0 - r1];
    }
    function render() {
      const A = angles();
      const add = drawTriangle(svg, pts, A.map(v => v + "°"), ["var(--sun)", "color-mix(in srgb, var(--pop) 50%, transparent)", "color-mix(in srgb, var(--teal) 55%, transparent)"]);
      pts.forEach((P, i) => {
        const c = add("circle", { cx: P[0], cy: P[1], r: 13, class: "corner", "data-i": i, tabindex: 0, role: "button", "aria-label": "Drag this corner" },
          "fill:var(--pop);stroke:var(--surface);stroke-width:3");
        c.addEventListener("pointerdown", e => startDrag(e, i));
      });
      el.querySelector(".tri-sum").innerHTML = `<b>${A[0]}°</b> + <b>${A[1]}°</b> + <b>${A[2]}°</b> = 180°`;
    }
    function startDrag(e, i) {
      e.preventDefault();
      document.documentElement.classList.add("is-dragging");
      if (window.Sound) Sound.play("pick");
      const move = ev => {
        const r = svg.getBoundingClientRect(), k = 320 / r.width;
        pts[i] = [Math.max(12, Math.min(308, (ev.clientX - r.left) * k)), Math.max(12, Math.min(218, (ev.clientY - r.top) * k))];
        // keep it a proper triangle (not squashed flat)
        const area = Math.abs((pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[2][0] - pts[0][0]) * (pts[1][1] - pts[0][1]));
        if (area < 1800) return;
        render();
      };
      const up = () => {
        document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up);
        document.documentElement.classList.remove("is-dragging");
        if (window.Sound) Sound.play("drop");
        drags++;
        if (drags >= 3 && !asked) ask();
        else if (!asked) say(el, `Keep going! Make it tall and thin, or short and wide. ${3 - drags} more drag${3 - drags === 1 ? "" : "s"}.`);
      };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    }
    function ask() {
      asked = true;
      el.querySelector(".tri-q").innerHTML = "What do the three angles <strong>always</strong> add up to?";
      say(el, "");
      choiceButtons(el.querySelector(".tri-choices"), shuffle([90, 180, 270, 360]).map(v => ({ v, html: v + "°" })), (o, b) => {
        if (o.v !== 180) { shakeOff(b); return say(el, "Look at the sum under the triangle. Drag a corner again: does it change?", "bad"); }
        el.querySelector(".tri-q").innerHTML = ""; el.querySelector(".tri-choices").innerHTML = "";
        say(el, `🎉 <strong>${praise()}</strong> However you stretch it, the angles in a triangle <strong>always add up to 180°</strong>. That's the fact we'll use to make equations. Scroll down 👇`, "good");
        if (!finished) { finished = true; if (window.Celebrate) Celebrate.burst(); if (opts.onDone) opts.onDone(); }
      });
    }
    render();
    say(el, "Drag the pink dots to change the triangle. Watch the angles and the total.");
  }

  /* ---------- Balance (solving) ---------- */
  // Runs the solving steps for a·L + b = c inside box (which has .bl-* markup). Calls done(x) at the end.
  function solveIn(el, box, a, b, c, L, done) {
    let left = { a, b }, right = c;
    const beam = box.querySelector(".bl-beam"), lp = box.querySelector(".bl-pan.left"), rp = box.querySelector(".bl-pan.right");
    const hist = box.querySelector(".bl-history"), moves = box.querySelector(".bl-moves"), q = box.querySelector(".bl-q");
    const paint = () => {
      lp.innerHTML = `<span>${ital(expr(left.a, left.b, L))}</span>`; rp.innerHTML = `<span>${right}</span>`;
      [lp, rp].forEach(p => { p.classList.remove("pop-in"); void p.offsetWidth; p.classList.add("pop-in"); });
      beam.classList.remove("wobble"); void beam.offsetWidth; beam.classList.add("wobble");
    };
    paint(); hist.innerHTML = ital(`${expr(a, b, L)} = ${c}`);
    step();
    function step() {
      if (left.b === 0 && left.a === 1) {
        moves.innerHTML = ""; q.innerHTML = "";
        return done(right);
      }
      q.innerHTML = `What should you do to <strong>both sides</strong>?`;
      const opts = [];
      if (left.b !== 0) {
        const k = Math.abs(left.b), right1 = left.b > 0 ? "sub" : "add";
        opts.push({ id: right1, html: `${right1 === "sub" ? "−" : "+"} ${k}`, ok: true });
        opts.push({ id: right1 === "sub" ? "add" : "sub", html: `${right1 === "sub" ? "+" : "−"} ${k}`, ok: false,
          hint: `That makes the ${k} part bigger, not gone! Do the <strong>opposite</strong> of ${left.b > 0 ? "+" : "−"} ${k}.` });
        if (left.a > 1) opts.push({ id: "div", html: `÷ ${left.a}`, ok: false,
          hint: `You can, but then ${k} ÷ ${left.a} gets messy. Get rid of the ${left.b > 0 ? "+" : "−"} ${k} first, so only the <i>${L}</i> part is left.` });
      } else {
        opts.push({ id: "div", html: `÷ ${left.a}`, ok: true });
        opts.push({ id: "subA", html: `− ${left.a}`, ok: false, hint: `<span class="m">${term(left.a, L)}</span> means ${left.a} × <i>${L}</i>. The opposite of × ${left.a} is…?` });
        opts.push({ id: "mul", html: `× ${left.a}`, ok: false, hint: `That makes it bigger! <span class="m">${ital(term(left.a, L))}</span> is ${left.a} × <i>${L}</i>, so do the opposite.` });
      }
      choiceButtons(moves, shuffle(opts), (o, btn) => {
        if (!o.ok) { shakeOff(btn); return say(el, o.hint, "bad"); }
        if (o.id === "sub" || o.id === "add") {
          const k = left.b; right -= k; left.b = 0;
          hist.innerHTML += `<br>${o.html} both sides → ${ital(`${term(left.a, L)} = ${right}`)}`;
        } else {
          right = right / left.a; left.a = 1;
          hist.innerHTML += `<br>${o.html} both sides → ${ital(`${L} = ${right}`)}`;
        }
        if (window.Sound) Sound.play("drop");
        say(el, `✅ ${praise()} Both sides changed the same way, so it still balances.`, "good");
        paint(); step();
      });
    }
  }
  const scaleHTML = `<div class="bl-scale"><div class="bl-beam"></div><div class="bl-pans"><div class="bl-pan left"></div><div class="bl-pan right"></div></div></div>
    <div class="bl-base"></div>
    <div class="bl-q"></div><div class="bl-moves"></div><p class="bl-history"></p>`;

  function balance(el, opts) {
    addCSS();
    const rounds = opts.rounds || 4;
    let n = 0;
    el.innerHTML = `<div class="bl-stars"></div><div class="bl-box">${scaleHTML}</div><div class="feedback" aria-live="polite"></div>
      <div style="text-align:center;margin-top:.6rem"><button type="button" class="bl-next" hidden>Next one ▶</button></div>`;
    const stars = () => { el.querySelector(".bl-stars").textContent = Array.from({ length: rounds }, (_, i) => (i < n ? "⭐" : "☆")).join(""); };
    const next = el.querySelector(".bl-next");
    next.onclick = go;
    function go() {
      next.hidden = true;
      const r = opts.generate();
      el.querySelector(".bl-box").innerHTML = scaleHTML;
      say(el, `Get <i>${r.L}</i> on its own. Whatever you do to one side, do to the other side too.`);
      solveIn(el, el.querySelector(".bl-box"), r.a, r.b, r.c, r.L, x => {
        n++; stars();
        const check = `${r.a === 1 ? "" : r.a + " × "}${x}${r.b ? (r.b > 0 ? " + " + r.b : " − " + -r.b) : ""} = ${r.c} ✓`;
        say(el, `🎉 <span class="m">${ital(r.L)} = ${x}</span>. Check it: <span class="m">${check}</span>`, "good");
        if (n >= rounds) {
          if (window.Celebrate) Celebrate.burst();
          say(el, `🏆 All ${rounds} balanced${window.Lesson ? ", " + Lesson.name : ""}! Undo the + or − first, then the ×. On to the triangles 👇`, "good");
          if (opts.onDone) opts.onDone();
        } else next.hidden = false;
      });
    }
    stars(); go();
  }

  /* ---------- TriangleEq ---------- */
  function round(x, parts, L) {
    const angles = parts.map(([c, k]) => ({ c, k, label: expr(c, k, L), value: c * x + k }));
    return { x, L, angles, C: parts.reduce((s, p) => s + p[0], 0), K: parts.reduce((s, p) => s + p[1], 0) };
  }

  function triangleEq(el, opts) {
    addCSS();
    const rounds = opts.rounds || 3;
    let n = 0;
    el.classList.add("tri");
    el.innerHTML = `<div class="bl-stars"></div><div class="te-stage"></div><div class="feedback" aria-live="polite"></div>
      <div style="text-align:center;margin-top:.6rem"><button type="button" class="te-next" hidden>Next triangle ▶</button></div>`;
    const stage = el.querySelector(".te-stage"), next = el.querySelector(".te-next");
    const stars = () => { el.querySelector(".bl-stars").textContent = Array.from({ length: rounds }, (_, i) => (i < n ? "⭐" : "☆")).join(""); };
    next.onclick = go;
    const PTS = [[35, 200], [290, 200], [115, 35]];

    function go() {
      next.hidden = true;
      const r = opts.generate(), L = r.L;
      stage.innerHTML = `<svg viewBox="0 0 320 230" role="img" aria-label="Triangle with angles ${r.angles.map(a => a.label).join(", ")}"></svg>
        <p class="te-q"></p>
        <div class="te-eq"><span class="te-slot">?</span>+<span class="te-slot">?</span>+<span class="te-slot">?</span>= 180</div>
        <div class="te-chips">${r.angles.map((a, i) => `<span class="te-chip" data-i="${i}">${ital(a.label)}</span>`).join("")}</div>
        <div class="te-choices"></div>
        <div class="te-solve"></div>`;
      const svg = stage.querySelector("svg");
      drawTriangle(svg, PTS, r.angles.map(a => (a.c ? a.label : a.label + "°")));
      stage.querySelector(".te-q").innerHTML = "<strong>Step 1:</strong> the angles add up to 180°. Drag each angle into the equation (or tap it).";
      say(el, "");
      const slots = [...stage.querySelectorAll(".te-slot")];
      let filled = 0;
      stage.querySelectorAll(".te-chip").forEach(chip => {
        const put = slot => {
          slot = slot && !slot.classList.contains("filled") ? slot : slots.find(s => !s.classList.contains("filled"));
          slot.innerHTML = `<span>${chip.innerHTML}</span>`; slot.classList.add("filled", "pop-in");
          chip.remove(); filled++;
          if (filled === 3) collect();
        };
        Drag.attach(chip, { targets: () => slots.filter(s => !s.classList.contains("filled")), onDrop: t => put(t), onTap: () => put(null) });
      });

      function collect() {
        const right = expr(r.C, r.K, L);
        const wrongs = [expr(r.C > 1 ? r.C - 1 : r.C + 1, r.K, L), expr(r.C, r.K ? r.K + (r.K > 0 ? 10 : -10) : 10, L), expr(r.C + 1, r.K, L)]
          .filter((v, i, s) => v !== right && s.indexOf(v) === i).slice(0, 2);
        stage.querySelector(".te-q").innerHTML = `<strong>Step 2:</strong> tidy up the left side. Add the <i>${L}</i> terms together, then the numbers.`;
        choiceButtons(stage.querySelector(".te-choices"), shuffle([right, ...wrongs]).map(v => ({ v, html: ital(v + " = 180") })), (o, b) => {
          if (o.v !== right) {
            shakeOff(b);
            const xs = r.angles.filter(a => a.c).map(a => ital(term(a.c, L))).join(" + ");
            const ks = r.angles.filter(a => a.k).map(a => a.k).join(" + ").replace(/\+ -/g, "− ");
            return say(el, `Count the <i>${L}</i>s: ${xs} = ${ital(term(r.C, L))}. Then the numbers: ${ks || "none"}.`, "bad");
          }
          stage.querySelector(".te-choices").innerHTML = "";
          stage.querySelector(".te-eq").innerHTML = `<span>${ital(`${right} = 180`)}</span>`;
          stage.querySelector(".te-q").innerHTML = `<strong>Step 3:</strong> solve it on the balance.`;
          say(el, `✅ ${praise()} Now get <i>${L}</i> on its own.`, "good");
          const box = stage.querySelector(".te-solve");
          box.innerHTML = scaleHTML;
          solveIn(el, box, r.C, r.K, 180, L, x => finish(x));
        });
      }

      function finish(x) {
        drawTriangle(svg, PTS, r.angles.map(a => a.value + "°"), ["var(--good-soft)", "var(--good-soft)", "var(--good-soft)"]);
        stage.querySelector(".te-q").innerHTML = "";
        n++; stars();
        const rows = r.angles.map(a => a.c ? `<span class="m">${ital(a.label)}</span> → ${a.value}°` : `${a.value}°`).join("<br>");
        say(el, `🎉 <span class="m">${ital(L)} = ${x}</span>. So the angles are:<br>${rows}<br>Check: <span class="m">${r.angles.map(a => a.value).join(" + ")} = 180</span> ✓`, "good");
        if (n >= rounds) {
          if (window.Celebrate) Celebrate.burst();
          say(el, `🏆 ${rounds} triangles solved${window.Lesson ? ", " + Lesson.name : ""}! Add them up, make it = 180, solve. Now try it on your own 👇`, "good");
          if (opts.onDone) opts.onDone();
        } else next.hidden = false;
      }
    }
    stars(); go();
  }

  window.TrianglePlay = { mount: play };
  window.Balance = { mount: balance };
  window.TriangleEq = { mount: triangleEq, round, draw: drawTriangle, expr };
})();
