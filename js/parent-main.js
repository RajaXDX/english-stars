/* تشغيل صفحة ولي الأمر المستقلة (parent.html).
   تستخدم نفس صفحات js/pages/parent.js ونفس التخزين (Store) على الجهاز،
   لكن بمسارات خاصة بها، بدون الشريط السفلي ولا صفحات الطالب.
   المسارات: #parent  ·  #parent/r/<id> (التقرير الكامل)  ·  #parent/add/<snap> (رابط التقرير من الطالب) */
route = function parentRoute() {
  Speech.stop();
  ++renderToken;
  const hp = decodeURIComponent((location.hash || "").slice(1)).split("/");
  document.body.classList.add("parent-mode");
  if (hp[0] === "parent" && hp[1] === "add" && hp[2]) return receiveParentLink(hp[2]);
  if (hp[0] === "parent" && hp[1] === "r") return renderParentReport(hp[2] || "");
  if (location.hash !== "#parent") history.replaceState(null, "", "#parent");
  renderParent();
};

if (!Store.healthy) banner("storage", icon("alert") + " لا يمكن الحفظ على هذا الجهاز (قد يكون التصفح الخاص مفعّلاً).", "warn");
if ("serviceWorker" in navigator && location.protocol !== "file:" && !IS_APP) navigator.serviceWorker.register("sw.js").catch(() => {});
$("#brandHome").onclick = () => go("parent");
window.addEventListener("hashchange", route);
route();
