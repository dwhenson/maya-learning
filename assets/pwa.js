/*
 * App mode: registers the offline service worker (sw.js) and marks <html class="standalone">
 * when Maya opens the app from her Home Screen, so CSS can tidy things up for full screen.
 */
(function () {
  const standalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  if (standalone) document.documentElement.classList.add("standalone");
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* offline support is a bonus */ });
    });
  }
})();
