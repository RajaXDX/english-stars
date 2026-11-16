/* Service worker — يجعل التطبيق يعمل دون اتصال.
   - كل ملفات التطبيق وبيانات الصفوف الـ12 تُحفظ عند التثبيت، فتعمل كل الوحدات دون إنترنت.
   - الملفات تُعرض من الحفظ فوراً وتُحدَّث في الخلفية عند توفر الاتصال.
   - عند نشر نسخة جديدة: غيّر VERSION، فيظهر للطالب زر «تحديث الآن». */
const VERSION = "v1-2026-11-16";
const CACHE = "nujoom-" + VERSION;
const FONTS = "nujoom-fonts";
const CORE = [
  "./", "index.html", "offline.html", "css/app.css", "js/store.js", "js/app.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
  ...Array.from({ length: 12 }, (_, i) => `data/g${i + 1}.js`)
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("nujoom-") && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* الخطوط: من الحفظ أولاً */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }
      catch (err) { return new Response("", { status: 504 }); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  /* فتح الصفحة: الشبكة أولاً ثم النسخة المحفوظة ثم صفحة عدم الاتصال */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => { caches.open(CACHE).then(c => c.put("index.html", res.clone())); return res; })
        .catch(async () => (await caches.match("index.html")) || (await caches.match("offline.html")))
    );
    return;
  }

  /* بقية الملفات: من الحفظ فوراً، مع تحديث في الخلفية */
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response("", { status: 504 });
  }));
});
