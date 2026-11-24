/*
 * Sort: drag cards into bins (e.g. "Correct" / "Oops") with instant feedback.
 *
 *   Sort.mount(el, {
 *     bins: [ { id: "right", label: "✅ Correct" }, { id: "wrong", label: "🙈 Oops" } ],
 *     cards: [ { html: "3(x + 4) = 3x + 12", bin: "right", why: "…shown after a correct drop" ,
 *                hint: "…shown after a wrong drop (don't give the answer away)" } ],
 *     onDone() {}
 *   });
 * Tap a card, then tap a bin, also works. Needs drag.js.
 */
(function () {
  const css = `
  .st-deck { display:flex; flex-wrap:wrap; gap:.6rem; justify-content:center; min-height:3.4rem; padding:.4rem; }
  .st-card { background:var(--surface); border:2px solid var(--rule); border-radius:14px; padding:.5rem .9rem;
    font:800 1.15rem var(--serif); box-shadow:0 3px 0 var(--rule); }
  .st-card.selected { border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
  .st-bins { display:grid; grid-template-columns:repeat(auto-fit, minmax(9.5rem, 1fr)); gap:.8rem; margin-top:.8rem; }
  .st-bin { border-radius:18px; padding:.7rem; min-height:7rem; background:var(--bg); border:2px dashed var(--rule); cursor:pointer; }
  .st-bin[data-bin="right"] { background:var(--good-soft); }
  .st-bin[data-bin="wrong"] { background:var(--pop-soft); }
  .st-bin[data-bin="half"] { background:color-mix(in srgb, var(--sun) 22%, var(--surface)); }
  .st-binlabel { font:600 1.1rem var(--display); text-align:center; margin-bottom:.4rem; }
  .st-binbody { display:flex; flex-direction:column; gap:.35rem; align-items:center; }
  .st-binbody .st-card { font-size:.95rem; padding:.25rem .6rem; box-shadow:none; cursor:default; }
  @media (max-width:520px){ .st-bins{ grid-template-columns:1fr } .st-bin{ min-height:5rem } }`;

  function mount(el, opts) {
    if (!document.getElementById("sort-css")) {
      const s = document.createElement("style"); s.id = "sort-css"; s.textContent = css; document.head.appendChild(s);
    }
    let left = opts.cards.length, slips = 0, selected = null;
    el.innerHTML = `
      <div class="st-deck"></div>
      <div class="st-bins">${opts.bins.map(b =>
        `<div class="st-bin" data-bin="${b.id}"><div class="st-binlabel">${b.label}</div><div class="st-binbody"></div></div>`).join("")}</div>
      <div class="feedback" aria-live="polite"></div>`;
    const deck = el.querySelector(".st-deck"), fb = el.querySelector(".feedback");
    const bins = [...el.querySelectorAll(".st-bin")];

    const order = opts.cards.map((c, i) => i).sort(() => Math.random() - .5);
    order.forEach(i => {
      const c = opts.cards[i];
      const card = document.createElement("div");
      card.className = "st-card"; card.innerHTML = c.html; card.dataset.i = i;
      deck.appendChild(card);
      Drag.attach(card, {
        targets: () => bins,
        onDrop: bin => place(card, bin),
        onTap: () => {
          if (selected) selected.classList.remove("selected");
          selected = selected === card ? null : card;
          if (selected) selected.classList.add("selected");
        }
      });
    });
    bins.forEach(bin => bin.addEventListener("click", () => { if (selected) { place(selected, bin); } }));

    function place(card, bin) {
      const c = opts.cards[+card.dataset.i];
      card.classList.remove("selected"); selected = null;
      if (bin.dataset.bin !== c.bin) {
        slips++;
        fb.className = "feedback bad"; fb.innerHTML = "Hmm, not that one. " + (c.hint || "");
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        return false;
      }
      card.dataset.locked = "1"; card.classList.remove("draggable", "shake");
      bin.querySelector(".st-binbody").appendChild(card);
      card.classList.add("pop-in");
      left--;
      fb.className = "feedback good"; fb.innerHTML = "✅ <strong>" + (window.Lesson ? Lesson.praise() : "Yes!") + "</strong> " + (c.why || "");
      if (!left) {
        fb.innerHTML += `<br><strong>All sorted${window.Lesson ? ", " + Lesson.name : ""}${slips ? "" : ", with no slips"}! 🎉</strong> Scroll down for your turn 👇`;
        deck.innerHTML = "";
        if (window.Celebrate) Celebrate.burst();
        if (opts.onDone) opts.onDone();
      }
      return true;
    }
  }

  window.Sort = { mount };
})();
