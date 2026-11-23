/*
 * Sound: subtle sound effects, synthesised with the Web Audio API (no audio files).
 *
 *   Sound.play("pick" | "drop" | "tap" | "correct" | "wrong" | "fanfare" | "select" | "hint" | "reveal" | "done")
 *
 * Adds a small 🔊 / 🔇 button in the bottom corner; the choice is remembered per browser.
 * Automatic: whimsy.js plays "correct"/"wrong" when a .feedback box turns good/bad,
 * drag.js plays "pick"/"drop", Celebrate.burst() plays "fanfare", and plain buttons "tap".
 * Sounds only start after the learner has clicked something (browsers require that).
 */
(function () {
  const KEY = "sound:on";
  let ctx = null;
  let on = true;
  try { on = localStorage.getItem(KEY) !== "0"; } catch (e) { /* default on */ }

  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // One soft note with a quick fade in and a gentle fade out.
  function tone(c, freq, at, dur, o = {}) {
    const t = c.currentTime + at;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const vol = o.vol || .06;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t); osc.stop(t + dur + .02);
  }

  const SOUNDS = {
    pick:    c => tone(c, 540, 0, .08, { type: "triangle", vol: .04, to: 760 }),
    drop:    c => tone(c, 420, 0, .11, { vol: .07, to: 240 }),
    tap:     c => tone(c, 700, 0, .05, { type: "triangle", vol: .025 }),
    correct: c => { tone(c, 784, 0, .14, { vol: .05 }); tone(c, 1175, .085, .26, { vol: .05 }); },
    wrong:   c => tone(c, 240, 0, .2, { type: "triangle", vol: .05, to: 170 }),
    fanfare: c => [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * .085, i === 3 ? .45 : .16, { type: "triangle", vol: .045 })),
    select:  c => tone(c, 880, 0, .045, { type: "triangle", vol: .03 }),
    hint:    c => { tone(c, 392, 0, .14, { type: "triangle", vol: .045 }); tone(c, 330, .1, .2, { type: "triangle", vol: .04 }); },
    reveal:  c => { tone(c, 523, 0, .18, { vol: .04 }); tone(c, 659, .12, .28, { vol: .035 }); },
    done:    c => [659, 784, 988].forEach((f, i) => tone(c, f, i * .1, i === 2 ? .4 : .14, { vol: .04 }))
  };

  let last = {};
  function play(name) {
    if (!on || !SOUNDS[name]) return;
    const now = Date.now();
    if (now - (last[name] || 0) < 120) return;   // don't stack the same sound
    last[name] = now;
    try { const c = audio(); if (c) SOUNDS[name](c); } catch (e) { /* sound is optional */ }
  }

  function button() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sound-toggle";
    const paint = () => {
      b.textContent = on ? "🔊" : "🔇";
      b.setAttribute("aria-label", on ? "Sound on. Click to mute" : "Sound off. Click to turn on");
      b.setAttribute("aria-pressed", String(on));
      b.title = on ? "Sound on" : "Sound off";
    };
    b.addEventListener("click", () => {
      on = !on;
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* fine */ }
      paint();
      if (on) play("tap");
    });
    paint();
    document.body.appendChild(b);
  }

  // A soft tap for ordinary buttons. Ones whose result has its own sound are skipped.
  const QUIET = ".quiz button, .ds-choices button, .hp-hop, .hp-choices button, .tb-check, .practice-form button, .sound-toggle, .video";
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest && e.target.closest("button, summary");
    if (el && !el.matches(QUIET) && !el.disabled) play("tap");
  });

  window.Sound = { play };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", button); else button();
})();
