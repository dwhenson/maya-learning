/*
 * TileBuilder: build a(x + b) out of algebra tiles by dragging.
 *
 *   TileBuilder.mount(el, { a: 3, b: 4, letter: "x", sign: 1, onDone() {} });
 *   sign: -1 builds a(x − b) with red −1 tiles (the tray then offers +1 and −1 tiles).
 *
 * Stage 1: drag x tiles and 1 tiles into row 1 to make (x + b).   (tap a tile in the row to remove it)
 * Stage 2: drag row 1 into the empty rows to make a copies.       (the "a lots of")
 * Stage 3: count the tiles -> a x + ab. The rows form a rectangle: the area model.
 * "New numbers" picks fresh a and b. Needs drag.js; uses Celebrate from lesson.js if present.
 */
(function () {
  const css = `
  .tb-tray { display:flex; gap:.7rem; align-items:center; flex-wrap:wrap; padding:.8rem; background:var(--bg); border-radius:16px; }
  .tb { --u: clamp(24px, 7.2vw, 36px); }   /* one tile unit: shrinks on small phones */
  .tile { display:inline-grid; place-items:center; height:var(--u, 36px); border-radius:9px; border:2px solid; font:800 1.1rem var(--serif); color:var(--ink); flex:none; }
  .tile.tx { width:calc(var(--u, 36px) * 2.55); background:var(--part-a); border-color:var(--part-a-edge); font-style:italic; }
  .tile.t1 { width:var(--u, 36px); background:var(--part-b); border-color:var(--part-b-edge); }
  .tile.tn { width:var(--u, 36px); background:var(--bad-soft); border-color:var(--bad); color:var(--bad); font-size:.95rem; }
  .tb-tray .tile { box-shadow:0 3px 0 rgba(0,0,0,.12); }
  .tb-board { display:flex; gap:.6rem; margin-top:1rem; }
  .tb-side { flex:none; width:2.6rem; display:grid; place-items:center; border-right:3px solid var(--accent); border-radius:0 0 0 0;
    font:700 1.6rem var(--display); color:var(--accent); }
  .tb-side[hidden] { display:none; }
  .tb-rows { flex:1; display:grid; gap:6px; }
  .tb-row { display:flex; align-items:center; gap:.5rem; min-height:50px; border-radius:14px; padding:6px 8px; background:var(--bg); transition:background .2s; }
  .tb-row.empty { background:transparent; border:2px dashed var(--rule); }
  .tb-num { font:800 .75rem var(--sans); color:var(--muted); width:1rem; text-align:center; flex:none; }
  .tb-slot { display:flex; gap:5px; flex-wrap:wrap; flex:1; min-height:36px; align-items:center; }
  .tb-slot .hint { color:var(--muted); font-size:.9rem; }
  .tb-row:first-child:not(.draggable) .tb-slot .tile { cursor:pointer; }
  .tb-handle { margin-left:auto; flex:none; background:var(--pop); color:#fff; font:800 .85rem var(--sans); padding:.35rem .7rem; border-radius:99px; white-space:nowrap; }
  .tb-slot { flex-wrap:nowrap; min-width:0; }
  .tb-row:first-child:not(.draggable) .tb-slot { flex-wrap:wrap; }   /* still building: allow extra tiles to wrap */
  @media (max-width:440px) {
    .tb-num { display:none; }
    .tb-board { gap:.4rem; }
    .tb-side { width:1.8rem; font-size:1.3rem; }
    .tb-row { padding:5px; gap:.3rem; }
    .tb-slot { gap:3px; }
    .tb-handle .word { display:none; }
    .tb-handle { padding:.35rem .5rem; }
    .tb-tray .meta { flex-basis:100%; }
    .tb-count label { font-size:.95rem; }
    .tb-count input.small { width:3.4rem; }
  }
  .tb-count { display:flex; flex-wrap:wrap; gap:.6rem 1rem; align-items:center; justify-content:center; margin-top:1rem; }
  .tb-count label { font-weight:700; display:flex; align-items:center; gap:.4rem; white-space:nowrap; }
  .tb-actions { display:flex; gap:.6rem; justify-content:center; margin-top:1rem; flex-wrap:wrap; }
  .tb-instr { font-weight:600; margin:.2rem 0 .8rem; }`;

  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const ital = s => s.replace(/([a-z])/g, "<i>$1</i>");

  function mount(el, opts) {
    if (!document.getElementById("tiles-css")) {
      const s = document.createElement("style"); s.id = "tiles-css"; s.textContent = css; document.head.appendChild(s);
    }
    let a = opts.a || 3, b = opts.b || 4;
    const L = opts.letter || "x";
    const neg = opts.sign === -1, sg = neg ? "−" : "+", unit = neg ? "n" : "1";
    const CLS = { x: "tx", 1: "t1", n: "tn" }, TXT = { x: L, 1: "1", n: "−1" };
    const tileHTML = (kind, extra = "") => `<span class="tile ${CLS[kind]}"${extra}>${TXT[kind]}</span>`;
    let row, filled, stage, finished = false;

    function start() {
      row = []; filled = 1; stage = 1;
      el.classList.add("tb");
      el.innerHTML = `
        <p class="display" style="margin:.2rem 0 .6rem">Build <span class="m">${a}(${ital(L)} ${sg} ${b})</span></p>
        <p class="tb-instr"></p>
        <div class="tb-tray">
          <div class="tile tx" data-kind="x">${L}</div>
          <div class="tile t1" data-kind="1">1</div>
          ${neg ? '<div class="tile tn" data-kind="n">−1</div>' : ""}
          <span class="meta">👈 drag these into row 1 (or tap them)</span>
        </div>
        <div class="tb-board">
          <div class="tb-side" hidden>${a}</div>
          <div class="tb-rows">
            ${Array.from({ length: a }, (_, i) => `
              <div class="tb-row${i ? " empty" : ""}" data-i="${i}" ${i ? "hidden" : ""}>
                <span class="tb-num">${i + 1}</span><div class="tb-slot">${i ? "" : '<span class="hint">drop tiles here</span>'}</div>
              </div>`).join("")}
          </div>
        </div>
        <div class="tb-count" hidden>
          <label>How many <span class="tile tx" style="width:56px;height:28px">${L}</span> tiles? <input class="answer small" inputmode="numeric"></label>
          <label>How many ${tileHTML(unit, ' style="width:28px;height:28px"')} tiles? <input class="answer small" inputmode="numeric"></label>
          <button class="tb-check">Check</button>
        </div>
        <div class="feedback" aria-live="polite"></div>
        <div class="tb-actions">
          <button class="ghost tb-reset">↺ Start again</button>
          <button class="ghost tb-new">🎲 New numbers</button>
        </div>`;
      say(`<strong>Step 1:</strong> make what's inside the bracket, <span class="m">${ital(L)} ${sg} ${b}</span>, in row 1. Drag tiles from the box above (or tap them). Tap a tile in the row to take it out.`);
      const rows = () => [...el.querySelectorAll(".tb-row")];
      const firstSlot = () => rows()[0].querySelector(".tb-slot");

      el.querySelectorAll(".tb-tray .tile").forEach(t => {
        Drag.attach(t, {
          targets: () => stage === 1 ? [rows()[0]] : [],
          onDrop: () => { add(t.dataset.kind); },
          onTap: () => { if (stage === 1) add(t.dataset.kind); }
        });
      });
      el.querySelector(".tb-reset").onclick = start;
      el.querySelector(".tb-new").onclick = () => {
        let na, nb;
        do { na = rnd(2, 4); nb = rnd(1, 5); } while (na === a && nb === b);
        a = na; b = nb; start();
      };
      el.querySelector(".tb-check").onclick = check;
      el.querySelectorAll(".tb-count input").forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") check(); }));

      function drawRow1() {
        const ORD = { x: 0, 1: 1, n: 2 };
        row.sort((p, q) => ORD[p] - ORD[q]);
        const slot = firstSlot();
        slot.innerHTML = row.length ? row.map(k => tileHTML(k)).join("") : '<span class="hint">drop tiles here</span>';
        slot.querySelectorAll(".tile").forEach((t, i) => {
          t.title = "Tap to remove";
          t.onclick = () => { if (stage === 1) { row.splice(i, 1); drawRow1(); check1(); } };
        });
      }
      function add(kind) {
        if (row.length >= 10) return;
        row.push(kind); drawRow1();
        const last = [...firstSlot().querySelectorAll(".tile")].filter(t => t.classList.contains(CLS[kind])).pop();
        if (last) last.classList.add("pop-in");
        check1();
      }
      function check1() {
        const nx = row.filter(k => k === "x").length, n1 = row.filter(k => k === "1").length, nn = row.filter(k => k === "n").length;
        const want = neg ? nn : n1, other = neg ? n1 : nn;
        let parts = [nx ? (nx === 1 ? L : nx + L) : "", n1 ? String(n1) : ""].filter(Boolean).join(" + ");
        if (nn) parts = parts ? `${parts} − ${nn}` : `−${nn}`;
        parts = parts || "nothing yet";
        if (nx > 1) return say(`Row 1 is <span class="m">${ital(parts)}</span>. The bracket only has <strong>one</strong> <i>${L}</i>. Tap a tile to remove it.`, "bad");
        if (neg && other) return say(`Row 1 has a yellow <strong>+1</strong> tile, but the bracket says <span class="m">− ${b}</span>. Use the red <strong>−1</strong> tiles. Tap the +1 to take it out.`, "bad");
        if (want > b) return say(`Row 1 is <span class="m">${ital(parts)}</span>. That's too many ${neg ? "−1" : "1"} tiles. You need ${b}. Tap one to remove it.`, "bad");
        if (nx === 1 && want === b && !other) return toStage2();
        say(`Row 1 so far: <span class="m">${ital(parts)}</span>. Keep going!`);
      }

      function toStage2() {
        stage = 2;
        el.querySelector(".tb-tray").hidden = true;
        el.querySelector(".tb-side").hidden = false;
        rows().forEach((r, i) => { if (i) r.hidden = false; });
        say(`✅ That's one lot of <span class="m">(${ital(L)} ${sg} ${b})</span>.<br>The <strong>${a}</strong> outside the bracket means <strong>${a} lots</strong>. <strong>Step 2:</strong> drag row 1 (grab the pink ✋ button) into each empty row below 👇`, "good");
        el.querySelector(".tb-instr").innerHTML = "";
        const handle = document.createElement("span");
        handle.className = "tb-handle"; handle.innerHTML = '✋<span class="word"> drag me</span>';
        rows()[0].appendChild(handle);
        const r0 = rows()[0];
        Drag.attach(r0, {
          targets: () => rows().filter(r => r.classList.contains("empty")),
          onDrop: target => { fill(target); },
          onTap: () => { const next = rows().find(r => r.classList.contains("empty")); if (next) fill(next); }
        });
      }
      function fill(target) {
        target.classList.remove("empty");
        target.querySelector(".tb-slot").innerHTML = row.map(k => tileHTML(k)).join("");
        target.classList.add("pop-in");
        filled++;
        if (filled < a) { say(`${filled} lots so far. ${a - filled} to go!`, "good"); return; }
        stage = 3;
        rows()[0].dataset.locked = "1";
        rows()[0].classList.remove("draggable");
        const h = el.querySelector(".tb-handle"); if (h) h.remove();
        el.querySelector(".tb-count").hidden = false;
        say(`🟪 Look, the tiles make a <strong>rectangle</strong>! <strong>Step 3:</strong> count each kind of tile, type the numbers, then press Check.`);
        el.querySelector(".tb-count input").focus({ preventScroll: true });
      }
    }

    function check() {
      const [ix, i1] = [...el.querySelectorAll(".tb-count input")];
      const nx = parseInt(ix.value, 10), n1 = parseInt(i1.value, 10);
      if (isNaN(nx) || isNaN(n1)) return say("Type a number in both boxes.", "bad");
      if (nx !== a) return say(`Count the <i>${L}</i> tiles again: there's one in each row, and there are ${a} rows.`, "bad");
      if (n1 !== a * b) return say(`Count the ${neg ? "red −1" : "1"} tiles again: ${b} in each row, ${a} rows. That's ${a} × ${b}.`, "bad");
      const ones = neg ? `${a * b} red tiles, each worth −1. That's <span class="m">−${a * b}</span>, so the minus stays!` : `<span class="m">${a * b}</span>.`;
      say(`🎉 <strong>${window.Lesson ? Lesson.praise() : "Yes!"}</strong> ${a} lots of <span class="m">(${ital(L)} ${sg} ${b})</span> is <span class="m">${a}${ital(L)}</span> and ${ones}
           <span class="display" style="display:block;margin:.4rem 0 0"><span class="m">${a}(${ital(L)} ${sg} ${b}) = ${a}${ital(L)} ${sg} ${a * b}</span></span>
           Press 🎲 <strong>New numbers</strong> to build another, or scroll down to the next game 👇`, "good");
      if (window.Celebrate) Celebrate.burst();
      if (!finished && opts.onDone) opts.onDone();
      finished = true;
    }

    function say(html, kind) {
      const fb = el.querySelector(".feedback");
      fb.className = "feedback" + (kind ? " " + kind : "");
      if (!kind) { fb.className = "feedback"; fb.style.background = "var(--accent-soft)"; } else fb.style.background = "";
      fb.innerHTML = html;
      if (kind === "bad") { fb.classList.remove("shake"); void fb.offsetWidth; fb.classList.add("shake"); }
    }

    start();
  }

  window.TileBuilder = { mount };
})();
