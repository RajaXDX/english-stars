/* ============================================================
   main.js — starts the app.
   ============================================================ */
"use strict";

/* static icons of the tab bar */
$("#icoHome").innerHTML = ICON.home; $("#icoReview").innerHTML = ICON.review;
$("#icoAwards").innerHTML = ICON.award; $("#icoMe").innerHTML = ICON.user;
$("#railBrand").innerHTML = MASCOT + "<span>نجوم الإنجليزي</span>";

applyTheme();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

/* links marked data-replace swap the current screen instead of stacking a new one,
   so "back" returns to the unit and not to the lesson you just left */
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-replace]");
  if(a){ e.preventDefault(); replace(a.getAttribute("href").slice(1)); }
});

window.addEventListener("hashchange", route);
route();

/* offline support (only when served from a website, not when opened as a file) */
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(()=>{}));
}
