/*
 * Feedback: a friendly "how did it go?" form that sends to Netlify Forms without leaving the page.
 *
 * Netlify only finds forms that are written in the HTML itself, so each page includes this markup
 * (copy it; change only the "page" value):
 *
 *   <form class="fb-form" name="feedback" method="POST" data-netlify="true" netlify-honeypot="bot-field">
 *     <input type="hidden" name="form-name" value="feedback">
 *     <input type="hidden" name="page" value="Lesson 2: Minus signs inside">
 *     <p hidden><label>Leave this empty: <input name="bot-field"></label></p>
 *     ...fields: radio "feeling", textarea "message"...
 *   </form>
 *
 * Submissions appear in the Netlify dashboard under the site's Forms → feedback.
 * No names or emails are collected on purpose.
 */
(function () {
  const css = `
  .fb-form { margin-top:1.5rem; }
  .fb-form h2 { margin:0; }
  .fb-moods { display:flex; flex-wrap:wrap; gap:.5rem; margin:.6rem 0 .8rem; border:0; padding:0; }
  .fb-moods legend { font-weight:700; margin-bottom:.4rem; padding:0; }
  .fb-moods label { cursor:pointer; }
  .fb-moods input { position:absolute; opacity:0; pointer-events:none; }
  .fb-moods span { display:inline-block; padding:.4rem .8rem; border-radius:99px; border:2px solid var(--rule); background:var(--surface); font-weight:700; transition:transform .15s; }
  .fb-moods input:checked + span { border-color:var(--accent); background:var(--accent-soft); transform:scale(1.06); }
  .fb-moods input:focus-visible + span { outline:3px solid var(--accent); outline-offset:2px; }
  .fb-form textarea { width:100%; min-height:6.5rem; font:inherit; font-size:1.05rem; color:var(--ink); background:var(--surface);
    border:2px solid var(--rule); border-radius:16px; padding:.7rem .9rem; resize:vertical; }
  .fb-form textarea:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 4px var(--accent-soft); }
  .fb-row { display:flex; gap:.8rem; align-items:center; flex-wrap:wrap; margin-top:.7rem; }
  .fb-status { margin:0; font-weight:700; }
  .fb-sent { text-align:center; font-size:1.1rem; }
  @media print { .fb-form { display:none !important; } }`;

  function init() {
    const forms = document.querySelectorAll("form.fb-form");
    if (!forms.length) return;
    if (!document.getElementById("feedback-css")) {
      const s = document.createElement("style"); s.id = "feedback-css"; s.textContent = css; document.head.appendChild(s);
    }
    forms.forEach(form => {
      const status = form.querySelector(".fb-status");
      const say = (html, kind) => { status.innerHTML = html; status.style.color = kind === "bad" ? "var(--bad)" : "var(--muted)"; };
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const data = new FormData(form);
        if (!data.get("feeling") && !String(data.get("message") || "").trim()) {
          say("Pick a face or write something first 🙂", "bad");
          return;
        }
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true; say("Sending…");
        try {
          const res = await fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(data).toString()
          });
          if (!res.ok) throw new Error(res.status);
          const name = window.Lesson ? ", " + Lesson.name : "";
          form.innerHTML = `<p class="fb-sent">💌 <strong>Sent! Thank you${name}.</strong><br>It'll be read before your next lesson is made.</p>`;
          if (window.Sound) Sound.play("done");
          if (window.Whimsy && Whimsy.sparkle) Whimsy.sparkle(form, 10);
        } catch (err) {
          btn.disabled = false;
          say("Hmm, that didn't send. Check the internet and try again, or tell your grown-up.", "bad");
        }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
