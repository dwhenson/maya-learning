/*
 * Service worker: makes Maya's Maths work offline.
 *
 * On install it caches every file listed in /precache.json (written by build.sh on Netlify).
 * Every request then goes to the network first, so new lessons show up straight away,
 * and falls back to the cached copy when there's no signal (or the network is very slow).
 * YouTube videos and the feedback form still need the internet.
 */
const VERSION = "__BUILD__";            // replaced with the commit id at build time
const CACHE = "maya-maths-" + VERSION;
const FALLBACK = ["/", "/index.html", "/manifest.webmanifest", "/assets/course.css"];
const TIMEOUT = 4000;                   // ms before we give up on a slow network

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let files = FALLBACK;
    try {
      const res = await fetch("/precache.json", { cache: "no-store" });
      if (res.ok) files = ["/", ...(await res.json())];
    } catch (e) { /* local preview: no list, cache as we go */ }
    // Add one by one so a single missing file doesn't stop the rest.
    await Promise.all(files.map(f => cache.add(new Request(f, { cache: "reload" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // YouTube, form posts: leave alone
  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error("slow")), TIMEOUT))
    ]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") {
      const home = await cache.match("/index.html") || await cache.match("/");
      if (home) return home;
    }
    return new Response("Offline, and this page isn't saved yet.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
