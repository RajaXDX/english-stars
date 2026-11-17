/* التشغيل: حالة الشبكة والتخزين، التحديثات، وبدء التطبيق. يُحمَّل بعد كل الصفحات */
/* ============================================================
   الشبكة، التخزين، والتحديثات
   ============================================================ */
function netStatus() {
  banner("offline", navigator.onLine ? "" : icon("wifi-off") + " أنت غير متصل بالإنترنت. الوحدات المحفوظة على جهازك تعمل كالمعتاد.", "warn");
}
window.addEventListener("online", netStatus);
window.addEventListener("offline", netStatus);
Store.on(type => {
  if (type === "storage-failed") banner("storage", icon("alert") + " تعذّر حفظ التقدم على هذا الجهاز (قد يكون التصفح الخاص مفعّلاً أو المساحة ممتلئة). يمكنك المتابعة، لكن النجوم قد لا تبقى بعد إغلاق الصفحة.", "warn");
  if (type === "storage-ok") banner("storage", "");
});
if (!Store.healthy) banner("storage", icon("alert") + " لا يمكن الحفظ على هذا الجهاز (قد يكون التصفح الخاص مفعّلاً). التقدم لن يبقى بعد إغلاق الصفحة.", "warn");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").then(reg => {
    const offer = w => {
      const b = banner("update", `${icon("update")} يوجد تحديث جديد للتطبيق. <button class="btn sm" id="doUpdate">تحديث الآن</button>`);
      b.querySelector("#doUpdate").onclick = () => w.postMessage("skipWaiting");
    };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) offer(w); });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

/* ---------------- تشغيل ---------------- */
$("#brandHome").onclick = () => go(Store.profile() ? "home" : "welcome");
window.addEventListener("hashchange", route);
netStatus();
route();
