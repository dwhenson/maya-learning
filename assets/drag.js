/*
 * Drag: tiny drag-and-drop helper that works with mouse, pen and touch.
 *
 *   Drag.attach(el, {
 *     targets: () => [elements you can drop on],
 *     onDrop(target, el) { return false to reject (it snaps back) },
 *     onTap(el)            // optional: a tap/click without moving (keyboard-free fallback)
 *   });
 *
 * While dragging, targets get .drop-ready and the one under the pointer gets .drop-over
 * (styled in course.css). The original gets .drag-source; a floating copy follows the pointer.
 */
(function () {
  function attach(el, opts) {
    el.classList.add("draggable");
    el.addEventListener("pointerdown", e => {
      if (e.button !== 0 || el.dataset.locked === "1") return;
      e.preventDefault();
      const start = el.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY;
      const dx = sx - start.left, dy = sy - start.top;
      let ghost = null, over = null, moved = false;
      const targets = opts.targets ? opts.targets() : [];

      const hitTest = (x, y) => targets.find(t => {
        const r = t.getBoundingClientRect();
        return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
      });

      const move = ev => {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!moved) {
          moved = true;
          ghost = el.cloneNode(true);
          ghost.classList.add("drag-ghost");
          ghost.classList.remove("drag-source", "drop-ready", "drop-over");
          Object.assign(ghost.style, {
            position: "fixed", left: start.left + "px", top: start.top + "px",
            width: start.width + "px", height: start.height + "px", margin: 0, zIndex: 1000, pointerEvents: "none",
            transform: "", transition: ""
          });
          document.body.appendChild(ghost);
          el.classList.add("drag-source");
          document.documentElement.classList.add("is-dragging");
          if (window.Sound) Sound.play("pick");
          targets.forEach(t => t.classList.add("drop-ready"));
        }
        ghost.style.left = ev.clientX - dx + "px";
        ghost.style.top = ev.clientY - dy + "px";
        const hit = hitTest(ev.clientX, ev.clientY);
        if (hit !== over) {
          if (over) over.classList.remove("drop-over");
          over = hit;
          if (over) over.classList.add("drop-over");
        }
      };

      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        document.removeEventListener("pointercancel", up);
        if (!moved) { if (opts.onTap) opts.onTap(el); return; }
        targets.forEach(t => t.classList.remove("drop-ready", "drop-over"));
        el.classList.remove("drag-source");
        document.documentElement.classList.remove("is-dragging");
        const accepted = over ? opts.onDrop(over, el) !== false : false;
        if (accepted) { ghost.remove(); if (window.Sound) Sound.play("drop"); return; }
        // Snap back to where it came from.
        const back = el.getBoundingClientRect();
        ghost.style.transition = "left .25s ease, top .25s ease";
        ghost.style.left = back.left + "px";
        ghost.style.top = back.top + "px";
        setTimeout(() => ghost.remove(), 260);
      };

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      document.addEventListener("pointercancel", up);
    });
  }

  window.Drag = { attach };
})();
