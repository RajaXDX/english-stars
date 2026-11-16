/* Service worker: keeps a copy of the app on the device so it opens without internet.
   Change VERSION whenever you publish new files, so old copies are replaced. */
const VERSION = "nujoom-app-1";
const FILES = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/core.js", "js/ui.js", "js/play.js", "js/main.js",
  "data/g1.js", "data/g2.js", "data/g3.js", "data/g4.js", "data/g5.js", "data/g6.js",
  "data/g7.js", "data/g8.js", "data/g9.js", "data/g10.js", "data/g11.js", "data/g12.js",
  "assets/fonts/readex-pro-arabic-wght-normal.woff2", "assets/fonts/readex-pro-latin-wght-normal.woff2",
  "assets/fonts/fredoka-latin-wght-normal.woff2",
  "assets/icons/icon.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* answer from the saved copy right away, and refresh that copy in the background */
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, {ignoreSearch:true});
    const fresh = fetch(req).then(res => { if(res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || fresh;
  }));
});
