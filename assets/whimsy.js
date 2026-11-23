/*
 * Whimsy: small playful animations in the spirit of Josh Comeau's work
 * (springy "boops", sparkles, gentle spring entrances). All of it switches off
 * when the learner's device asks for reduced motion.
 *
 * Automatic (just include the script):
 *   - [data-boop="rotate:12 scale:1.1 y:-3"]  springy wiggle on hover, then settles back
 *   - buttons, quiz options, tiles, chips      get a small default boop
 *   - .card                                    springs up into view as you scroll
 *   - any .feedback that turns "good"          sparkles + a little bounce
 *   - quiz option marked .right                sparkles
 *   - [data-sparkles]                          a few gentle sparkles that keep twinkling
 *
 * By hand:
 *   Whimsy.sparkle(el, 12)    one burst of sparkles around an element
 *   Whimsy.boop(el, {rotate, scale, x, y})
 */
(function () {
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLOURS = ["#ffc93c", "#ff5c8a", "#6c4ce0", "#10b3a3"];
  const SPRING = "cubic-bezier(.34, 1.56, .64, 1)";
  const css = `
  .wh-spark { position:fixed; pointer-events:none; z-index:1500; width:var(--s); height:var(--s);
    animation: wh-spark .9s ${SPRING} forwards; }
  .wh-spark svg { width:100%; height:100%; display:block; animation: wh-spin .9s linear forwards; }
  @keyframes wh-spark { 0% { transform:scale(0) } 45% { transform:scale(1) } 100% { transform:scale(0) } }
  @keyframes wh-spin { from { rotate:0deg } to { rotate:180deg } }
  .wh-twinkle { position:absolute; pointer-events:none; animation: wh-spark 1.1s ${SPRING} forwards; }
  [data-sparkles] { position:relative; display:inline-block; }
  .wh-enter { opacity:0; transform: translateY(28px) scale(.97); }
  .wh-entered { opacity:1; transform:none; transition: opacity .5s ease, transform .7s ${SPRING}; }
  @media print { .wh-enter { opacity:1 !important; transform:none !important; } }
  .wh-bounce { animation: wh-bounce .6s ${SPRING}; }
  @keyframes wh-bounce { 0% { transform:scale(.92) } 50% { transform:scale(1.03) } 100% { transform:scale(1) } }
  .wh-jelly { animation: wh-jelly .7s ${SPRING}; }
  @keyframes wh-jelly { 0% { transform:scale(1,1) } 30% { transform:scale(1.18,.86) } 50% { transform:scale(.9,1.1) } 70% { transform:scale(1.05,.97) } 100% { transform:scale(1,1) } }`;

  function star(colour) {
    return `<svg viewBox="0 0 68 68" aria-hidden="true"><path fill="${colour}" d="M26.5 25.5C19.0043 33.3697 0 34 0 34C0 34 19.1013 35.3684 26.5 43.5C33.234 50.901 34 68 34 68C34 68 36.9884 50.7065 44.5 43.5C51.6431 36.647 68 34 68 34C68 34 51.6947 32.0939 44.5 25.5C36.5605 18.2235 34 0 34 0C34 0 33.6591 17.9837 26.5 25.5Z"/></svg>`;
  }

  // One burst of sparkles scattered around an element.
  function sparkle(el, n = 10) {
    if (reduced() || !el) return;
    const r = el.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "wh-spark";
      const size = 10 + Math.random() * 14;
      s.style.setProperty("--s", size + "px");
      // Spread around the edges, a little outside the box.
      const edge = Math.random();
      const x = r.left - 10 + Math.random() * (r.width + 20);
      const y = edge < .5 ? r.top - 12 + Math.random() * 18 : r.bottom - 6 + Math.random() * 18;
      s.style.left = (Math.random() < .25 ? (Math.random() < .5 ? r.left - 16 : r.right + 4) : x) - size / 2 + "px";
      s.style.top = (Math.random() < .25 ? r.top + Math.random() * r.height : y) - size / 2 + "px";
      s.style.animationDelay = Math.random() * .25 + "s";
      s.innerHTML = star(COLOURS[i % COLOURS.length]);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }

  // Springy "boop": move/rotate/scale, then spring back after a moment.
  function boop(el, o = {}) {
    if (reduced() || el._booping) return;
    el._booping = true;
    const prevT = el.style.transition, prevX = el.style.transform;
    el.style.transition = `transform .18s ${SPRING}`;
    el.style.transform = `translate(${o.x || 0}px, ${o.y || 0}px) rotate(${o.rotate || 0}deg) scale(${o.scale || 1})`;
    setTimeout(() => {
      el.style.transition = `transform .45s ${SPRING}`;
      el.style.transform = prevX;
      setTimeout(() => { el.style.transition = prevT; el._booping = false; }, 450);
    }, 160);
  }
  function parseBoop(str) {
    const o = {};
    String(str || "").split(/\s+/).forEach(p => { const [k, v] = p.split(":"); if (k && v) o[k] = parseFloat(v); });
    return o;
  }
  const DEFAULT_BOOP = "button, .tile, .st-card, .journey a, .ds-chip, .bubble, .link-card .icon";

  function onHover(e) {
    const el = e.target.closest && e.target.closest("[data-boop], " + DEFAULT_BOOP);
    if (!el || el.disabled || el.classList.contains("drag-ghost")) return;
    if (el.matches(".journey a, .bubble")) return boop(el, el.dataset.boop ? parseBoop(el.dataset.boop) : { rotate: 10, scale: 1.12 });
    boop(el, el.dataset.boop ? parseBoop(el.dataset.boop) : { y: -3, rotate: (Math.random() < .5 ? -1 : 1) * 3 });
  }

  // Gentle, repeating twinkles around [data-sparkles].
  function twinkle(host) {
    if (reduced()) return;
    const add = () => {
      if (!document.body.contains(host)) return;
      const s = document.createElement("span");
      s.className = "wh-twinkle";
      const size = 8 + Math.random() * 12;
      s.style.width = s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.marginLeft = s.style.marginTop = -size / 2 + "px";
      s.innerHTML = star(COLOURS[Math.floor(Math.random() * COLOURS.length)]);
      host.appendChild(s);
      setTimeout(() => s.remove(), 1200);
      setTimeout(add, 350 + Math.random() * 700);
    };
    add();
  }

  function init() {
    if (!document.getElementById("whimsy-css")) {
      const st = document.createElement("style"); st.id = "whimsy-css"; st.textContent = css; document.head.appendChild(st);
    }
    document.addEventListener("pointerover", onHover);
    document.querySelectorAll("[data-sparkles]").forEach(twinkle);

    // Cards spring into view.
    if (!reduced() && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("wh-entered"); io.unobserve(en.target); }
      }), { threshold: .12 });
      document.querySelectorAll(".card").forEach(c => {
        const r = c.getBoundingClientRect();
        if (r.top > innerHeight) { c.classList.add("wh-enter"); io.observe(c); }
      });
    }

    // Celebrate any feedback box that turns "good", and right quiz answers.
    const mo = new MutationObserver(muts => muts.forEach(m => {
      const el = m.target;
      if (!(el instanceof HTMLElement)) return;
      const inQuiz = el.closest && el.closest(".quiz");   // the quiz plays its own sounds
      if (el.classList.contains("feedback") && el.classList.contains("bad") && el.innerHTML.trim() && !inQuiz) {
        const now = Date.now();
        if (now - (el._lastBoop || 0) < 400) return;
        el._lastBoop = now;
        if (window.Sound) Sound.play("wrong");
      }
      if (el.classList.contains("feedback") && el.classList.contains("good") && el.innerHTML.trim()) {
        const now = Date.now();
        if (now - (el._lastSpark || 0) < 400) return;   // one celebration per update
        el._lastSpark = now;
        if (window.Sound && !inQuiz) Sound.play("correct");
        el.classList.remove("wh-bounce"); void el.offsetWidth; el.classList.add("wh-bounce");
        sparkle(el, 8);
      }
      if (m.type === "attributes" && el.matches(".quiz li button.right") && !el._sparkled) {
        el._sparkled = true; sparkle(el, 10);
        el.classList.add("wh-jelly");
      }
      if (m.type === "attributes" && el.matches(".ds-slot.filled, .tb-row.pop-in") && !el._sparkled) {
        el._sparkled = true; sparkle(el, 6);
      }
    }));
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  }

  window.Whimsy = { sparkle, boop };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
