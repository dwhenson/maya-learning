/*
 * NumberLine: draws a move along a number line, e.g. −2 + 5 → 3.
 *
 *   NumberLine.render(el, { from: -2, to: 3, label: "+5" });
 *
 * A purple dot marks the start, a pink arrow hops to the end, and the end number is ringed.
 * Scales to the width of its box (SVG viewBox). Colours come from course.css.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const neg = n => (n < 0 ? "−" + Math.abs(n) : String(n));

  function render(el, opts) {
    const { from, to } = opts;
    const lo = Math.min(from, to, 0) - 1, hi = Math.max(from, to, 0) + 1;
    const span = hi - lo, every = span > 24 ? 5 : span > 14 ? 2 : 1;
    const W = 480, H = 120, pad = 22, y = 82;
    const X = v => pad + ((v - lo) / span) * (W - pad * 2);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;display:block;margin:.4rem auto" role="img"
      aria-label="Number line: start at ${neg(from)}, move to ${neg(to)}">
      <defs><marker id="nl-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" style="fill:var(--pop)"/></marker></defs>
      <line x1="${pad - 8}" x2="${W - pad + 8}" y1="${y}" y2="${y}" style="stroke:var(--ink);stroke-width:2.5"/>`;
    for (let v = lo; v <= hi; v++) {
      const major = v % every === 0;
      s += `<line x1="${X(v)}" x2="${X(v)}" y1="${y - (major ? 7 : 4)}" y2="${y + (major ? 7 : 4)}" style="stroke:var(--muted);stroke-width:1.5"/>`;
      if (major || v === from || v === to) s += `<text x="${X(v)}" y="${y + 26}" text-anchor="middle"
        style="fill:${v === 0 ? "var(--ink)" : "var(--muted)"};font:700 15px var(--sans)">${neg(v)}</text>`;
    }
    const x0 = X(from), x1 = X(to), mid = (x0 + x1) / 2;
    s += `<path d="M ${x0} ${y - 6} Q ${mid} ${y - 70} ${x1} ${y - 6}" fill="none" marker-end="url(#nl-head)"
            style="stroke:var(--pop);stroke-width:3;stroke-linecap:round"/>
          <text x="${mid}" y="${y - 44}" text-anchor="middle" style="fill:var(--pop);font:800 16px var(--sans)">${opts.label || ""}</text>
          <circle cx="${x0}" cy="${y}" r="6" style="fill:var(--accent)"/>
          <circle cx="${x1}" cy="${y}" r="9" style="fill:none;stroke:var(--pop);stroke-width:3"/>
        </svg>`;
    el.innerHTML = s;
  }

  window.NumberLine = { render };
})();
