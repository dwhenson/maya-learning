/*
 * Expr: reads simple algebra typed by a learner, e.g. "3x + 12", "12+3x", "−2y − 10", "4n".
 *
 *   Expr.parse("3x+12")  -> { x: 3, "1": 12 }   (null if it can't be read)
 *   Expr.equal(a, b)     -> true if the two parsed expressions are the same
 *   Expr.show({x:3,"1":12}, "x") -> "3x + 12"  (letter term first, nice minus signs)
 *   Expr.html(str)       -> the string with letters in italics and proper minus signs
 *
 * Only handles sums of terms like 7, x, 3x, -4y (one letter per term), which is all
 * single-bracket expanding needs. Extend here when lessons need x², xy, etc.
 */
(function () {
  function clean(s) {
    return String(s).toLowerCase()
      .replace(/[\s]/g, "")
      .replace(/[−–—]/g, "-");
  }

  function parse(input) {
    let s = clean(input);
    if (!s) return null;
    if (!/^[+-]/.test(s)) s = "+" + s;
    if (!/^([+-](\d+[a-z]?|[a-z]))+$/.test(s)) return null;
    const out = {};
    let terms = 0;
    s.replace(/([+-])(\d*)([a-z]?)/g, (_, sign, digits, letter) => {
      const n = (digits ? parseInt(digits, 10) : 1) * (sign === "-" ? -1 : 1);
      const key = letter || "1";
      out[key] = (out[key] || 0) + n;
      terms++;
      return "";
    });
    Object.defineProperty(out, "_terms", { value: terms, enumerable: false });
    return out;
  }

  function equal(a, b) {
    if (!a || !b) return false;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) if ((a[k] || 0) !== (b[k] || 0)) return false;
    return true;
  }

  function show(map) {
    const keys = Object.keys(map).filter(k => map[k] !== 0)
      .sort((p, q) => (p === "1") - (q === "1") || p.localeCompare(q));
    if (!keys.length) return "0";
    return keys.map((k, i) => {
      const n = map[k];
      const abs = Math.abs(n);
      const body = k === "1" ? String(abs) : (abs === 1 ? "" : abs) + k;
      if (i === 0) return (n < 0 ? "−" : "") + body;
      return (n < 0 ? " − " : " + ") + body;
    }).join("");
  }

  function html(str) {
    return String(str)
      .replace(/-/g, "−")
      .replace(/([a-z])/gi, "<i>$1</i>");
  }

  window.Expr = { parse, equal, show, html };
})();
