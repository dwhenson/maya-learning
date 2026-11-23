/*
 * AreaModel: draws a bracket as a rectangle split into pieces.
 *
 *   AreaModel.render(el, {
 *     outer: { label: "3", size: 3 },                 // the multiplier (height)
 *     parts: [ { label: "x", size: 5.5, product: "3x" },
 *              { label: "4", size: 4,   product: "12" } ],
 *     reveal: true,     // products start as "?" and are revealed on click
 *     showTotal: true   // writes "area = 3x + 12" underneath once all pieces are shown
 *   });
 *
 * Minus inside, e.g. 4(x − 3): give the piece { label: "3", size: 3, product: "-12", take: true }.
 * It is cut out of the right-hand end of the piece before it (striped, "take away"),
 * with its width labelled underneath. The total then reads "area = 4x − 12".
 *
 * Letters in labels are set in italic automatically. Colours come from course.css.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const FILLS = ["var(--part-a)", "var(--part-b)", "var(--part-c)"];

  function mathText(parent, str, attrs, plainPrefix) {
    const t = document.createElementNS(NS, "text");
    for (const k in attrs) t.setAttribute(k, attrs[k]);
    t.style.fill = "var(--ink)";
    t.style.fontFamily = "var(--serif)";
    if (plainPrefix) {
      const s0 = document.createElementNS(NS, "tspan");
      s0.textContent = plainPrefix;
      t.appendChild(s0);
    }
    // Split into letter / non-letter runs; letters go italic.
    String(str).split(/([a-z]+)/i).forEach(run => {
      if (!run) return;
      const s = document.createElementNS(NS, "tspan");
      if (/^[a-z]+$/i.test(run)) s.setAttribute("font-style", "italic");
      s.textContent = run.replace(/-/g, "−");
      t.appendChild(s);
    });
    parent.appendChild(t);
    return t;
  }

  function render(el, opts) {
    el.innerHTML = "";
    el.classList.add("area-model");
    const maxW = opts.maxWidth || 440;
    const hasTake = opts.parts.some(p => p.take);
    const padL = 44, padT = 36, padB = (opts.showTotal ? 44 : 10) + (hasTake ? 28 : 0), padR = 6;
    const totalSize = opts.parts.reduce((s, p) => s + (p.take ? 0 : p.size), 0);
    const unit = Math.min(opts.unit || 30, maxW / totalSize);
    const h = Math.max(56, Math.min(170, opts.outer.size * unit));
    const w = totalSize * unit;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${padL + w + padR} ${padT + h + padB}`);
    svg.setAttribute("width", padL + w + padR);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label",
      `Rectangle ${opts.outer.label} tall, split into widths ${opts.parts.map(p => p.label).join(" and ")}`);

    // Outer (height) label with a bracket line
    const line = document.createElementNS(NS, "path");
    line.setAttribute("d", `M ${padL - 10} ${padT} v ${h}`);
    line.style.stroke = "var(--muted)"; line.style.strokeWidth = 1.5;
    svg.appendChild(line);
    mathText(svg, opts.outer.label, { x: padL - 18, y: padT + h / 2 + 7, "text-anchor": "end", "font-size": 22 });

    // Stripes for take-away pieces.
    if (hasTake) {
      const defs = document.createElementNS(NS, "defs");
      defs.innerHTML = `<pattern id="am-stripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" style="fill:var(--bad-soft)"></rect><line x1="0" y1="0" x2="0" y2="8" style="stroke:var(--bad);stroke-width:3"></line></pattern>`;
      svg.appendChild(defs);
    }
    const revealed = [];
    let x = padL;
    opts.parts.forEach((p, i) => {
      const pw = p.size * unit;
      if (p.take) {
        // Cut out of the right end of the piece before it.
        const tx = x - pw;
        const g = document.createElementNS(NS, "g");
        const r = document.createElementNS(NS, "rect");
        r.setAttribute("x", tx); r.setAttribute("y", padT); r.setAttribute("width", pw); r.setAttribute("height", h);
        r.style.fill = "url(#am-stripes)"; r.style.stroke = "var(--bad)"; r.style.strokeWidth = 2; r.setAttribute("stroke-dasharray", "6 4");
        g.appendChild(r);
        const tag = mathText(g, p.product, { x: tx + pw / 2, y: padT + h / 2 + 9, "text-anchor": "middle", "font-size": 24, "font-weight": 800 });
        tag.style.fill = "var(--bad)"; tag.style.stroke = "var(--surface)"; tag.style.strokeWidth = 5; tag.style.paintOrder = "stroke";
        tag.setAttribute("stroke-linejoin", "round");
        svg.appendChild(g);
        const tick = document.createElementNS(NS, "path");
        tick.setAttribute("d", `M ${tx + 3} ${padT + h + 10} h ${pw - 6}`);
        tick.style.stroke = "var(--bad)"; tick.style.strokeWidth = 1.5;
        svg.appendChild(tick);
        const wl = mathText(svg, p.label, { x: tx + pw / 2, y: padT + h + 28, "text-anchor": "middle", "font-size": 18 }, "take ");
        wl.style.fill = "var(--bad)";
        revealed[i] = true;
        return;
      }
      const next = opts.parts[i + 1];
      const cut = next && next.take ? next.size * unit : 0;   // room taken by a cut-out piece
      const x0 = x; // freeze this piece's left edge for the click handler
      // width label
      const tick = document.createElementNS(NS, "path");
      tick.setAttribute("d", `M ${x + 3} ${padT - 10} h ${pw - 6}`);
      tick.style.stroke = "var(--muted)"; tick.style.strokeWidth = 1.5;
      svg.appendChild(tick);
      mathText(svg, p.label, { x: x + pw / 2, y: padT - 17, "text-anchor": "middle", "font-size": 20 });

      const g = document.createElementNS(NS, "g");
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", x); r.setAttribute("y", padT);
      r.setAttribute("width", pw); r.setAttribute("height", h);
      r.style.fill = FILLS[i % FILLS.length];
      r.style.stroke = "var(--ink)"; r.style.strokeWidth = 1.5;
      g.appendChild(r);
      const label = mathText(g, opts.reveal ? "?" : p.product,
        { x: x + (pw - cut) / 2, y: padT + h / 2 + 9, "text-anchor": "middle", "font-size": 26 });
      revealed[i] = !opts.reveal;
      if (opts.reveal) {
        g.style.cursor = "pointer";
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", `Reveal the area of the ${p.label} piece`);
        const show = () => {
          if (revealed[i]) return;
          revealed[i] = true;
          label.remove();
          mathText(g, p.product, { x: x0 + (pw - cut) / 2, y: padT + h / 2 + 9, "text-anchor": "middle", "font-size": 26 });
          maybeTotal();
        };
        g.addEventListener("click", show);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
      }
      svg.appendChild(g);
      x += pw;
    });

    function maybeTotal() {
      if (!opts.showTotal || revealed.some(r => !r)) return;
      const total = opts.parts.map(p => p.product).join(" + ").replace(/\+ -/g, "− ");
      mathText(svg, total, { x: padL + w / 2, y: padT + h + 34 + (hasTake ? 28 : 0), "text-anchor": "middle", "font-size": 22 }, "area = ");
    }
    maybeTotal();
    el.appendChild(svg);
  }

  window.AreaModel = { render };
})();
