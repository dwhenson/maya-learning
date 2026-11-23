/*
 * Lesson helpers: confetti, the step "journey" bar, and video cards.
 *
 *   Celebrate.burst()          // confetti (skipped if the learner prefers reduced motion)
 *   Lesson.done("tiles")       // ticks <a data-step="tiles"> in .journey and remembers it
 *
 * Videos:  <button class="video" data-yt="VIDEO_ID" data-label="Title · 2 min"></button>
 *   Add class "short" for a YouTube Short (portrait). Clicking opens a pop-up player (modal).
 *   When the lesson is opened straight from disk (file://) YouTube refuses to embed, so the
 *   pop-up shows a "Watch on YouTube" link instead.
 */
(function () {
  const COLOURS = ["#6c4ce0", "#ff5c8a", "#ffc93c", "#10b3a3", "#5ab0ff"];

  // The learner. Set <html data-learner="Name"> to change it.
  const NAME = document.documentElement.dataset.learner || "Maya";
  const PRAISE = ["Yes!", "Nice one, {n}!", "Brilliant!", "Spot on, {n}!", "You've got it!", "Great work, {n}!", "Exactly right!", "Nailed it, {n}!"];
  let lastPraise = -1;
  function praise() {
    let i;
    do { i = Math.floor(Math.random() * PRAISE.length); } while (i === lastPraise);
    lastPraise = i;
    return PRAISE[i].replace("{n}", NAME);
  }

  function burst(n = 70) {
    if (window.Sound) setTimeout(() => Sound.play("fanfare"), 120);
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = COLOURS[i % COLOURS.length];
      c.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
      c.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
      c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
      c.style.animationDelay = Math.random() * .3 + "s";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3800);
    }
  }

  const KEY = "steps:" + location.pathname;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode: fine */ } }

  function done(step) {
    const list = load();
    if (!list.includes(step)) { list.push(step); save(list); }
    paint();
  }
  function paint() {
    const list = load();
    document.querySelectorAll(".journey a[data-step]").forEach(a => a.classList.toggle("done", list.includes(a.dataset.step)));
  }

  // One shared pop-up player (a <dialog>). Closing it removes the iframe, which stops the video.
  let modal = null;
  function getModal() {
    if (modal) return modal;
    modal = document.createElement("dialog");
    modal.className = "video-modal";
    modal.innerHTML = `
      <div class="vm-top"><strong class="vm-title"></strong><button type="button" class="vm-close" aria-label="Close video">✕</button></div>
      <div class="vm-frame"></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".vm-close").addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });   // click the dark backdrop
    modal.addEventListener("close", () => { modal.querySelector(".vm-frame").innerHTML = ""; document.documentElement.style.overflow = ""; });
    return modal;
  }
  function closeModal() {
    if (!modal || !modal.open) return;
    modal.classList.add("closing");
    setTimeout(() => { modal.classList.remove("closing"); modal.close(); }, 180);
  }

  function openVideo(btn) {
    const id = btn.dataset.yt, s = btn.dataset.start, label = btn.dataset.label || "Video";
    const m = getModal();
    m.classList.toggle("short", btn.classList.contains("short"));
    m.querySelector(".vm-title").textContent = label;
    const frame = m.querySelector(".vm-frame");
    if (/^https?:$/.test(location.protocol)) {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1${s ? "&start=" + s : ""}`;
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.title = label;
      frame.appendChild(f);
    } else {
      // Opened straight from disk: YouTube won't play inside the page, so offer a link.
      frame.innerHTML = `
        <div class="vm-fallback" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)">
          <div>
            <p>This video can't play here because the lesson was opened as a file.</p>
            <a class="btn" href="https://www.youtube.com/watch?v=${id}${s ? "&t=" + s + "s" : ""}" target="_blank" rel="noopener">▶ Watch on YouTube</a>
            <p class="meta">Tip: open lessons with <strong>Open Lessons</strong> and videos play right here.</p>
          </div>
        </div>`;
    }
    document.documentElement.style.overflow = "hidden";
    m.showModal();
    m.querySelector(".vm-close").focus();
  }

  function initVideos() {
    document.querySelectorAll("button.video[data-yt]").forEach(btn => {
      const id = btn.dataset.yt;
      btn.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
      btn.setAttribute("aria-label", "Play video: " + (btn.dataset.label || ""));
      btn.innerHTML = `<span class="play">▶</span><span class="vlabel">${btn.dataset.label || ""}</span>`;
      btn.addEventListener("click", () => {
        if (btn.dataset.step) done(btn.dataset.step);
        openVideo(btn);
      });
    });
  }

  window.Celebrate = { burst };
  window.Lesson = { done, praise, name: NAME };
  document.addEventListener("DOMContentLoaded", () => { paint(); initVideos(); });
})();
