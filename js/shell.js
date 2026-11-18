/* الإطار والتنقل: الشريط العلوي والسفلي، التوجيه بين الصفحات، واجهة كل مرحلة */
/* ---------------- الإطار والتنقل ---------------- */
let renderToken = 0;
function chrome({ title = "", back = null, tab = null, hideNav = false } = {}) {
  $("#barTitle").textContent = title;
  const b = $("#barBack");
  b.hidden = !back; b.onclick = back ? () => go(back) : null;
  $("#bottomNav").hidden = hideNav;
  document.body.classList.toggle("no-nav", hideNav);
  document.querySelectorAll("#bottomNav a").forEach(a => a.setAttribute("aria-current", a.dataset.tab === tab ? "page" : "false"));
  document.title = title ? `${title} · نجوم الإنجليزي` : "نجوم الإنجليزي";
  updateStars();
}
function go(h) { if (location.hash === "#" + h) route(); else location.hash = h; }
function focusMain() {
  const h = app.querySelector("h1, h2");
  if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  window.scrollTo({ top: 0 });
}
const stepRoute = (g, u, step) => `u/${g.id}/${u.id}/${step}`;

function route() {
  Speech.stop();
  const token = ++renderToken;
  let h = decodeURIComponent((location.hash || "").slice(1));
  /* روابط النسخة السابقة */
  let m;
  if ((m = h.match(/^(g\d+)$/))) h = "learn/" + m[1];
  else if ((m = h.match(/^(g\d+)-big$/))) h = "big/" + m[1];
  else if ((m = h.match(/^(g\d+)-(\w+)$/))) h = `u/${m[1]}/${m[2]}`;

  /* ولي الأمر: رابط التقرير يعمل دائماً، ووضع ولي الأمر له صفحاته */
  const hp = h.split("/");
  document.body.classList.toggle("parent-mode", Store.mode === "parent");
  if (hp[0] === "parent" && hp[1] === "add" && hp[2]) { document.body.classList.add("parent-mode"); return receiveParentLink(hp[2]); }
  if (Store.mode === "parent" && h !== "welcome") {
    if (hp[0] === "parent" && hp[1] === "r") return renderParentReport(hp[2] || "");
    if (h !== "parent") history.replaceState(null, "", "#parent");
    return renderParent();
  }
  const p = Store.profile();
  if (!p || !p.gender || !p.grade) { if (h !== "welcome") { history.replaceState(null, "", "#welcome"); } return renderWelcome(); }
  const parts = h.split("/");
  const vg = ["learn", "u", "big"].includes(parts[0]) ? gradeById(parts[1]) : null;
  applyStage((vg || gradeById(p.grade) || {}).stage || "p");
  try {
    switch (parts[0]) {
      case "learn": return renderLearn(parts[1] || p.grade);
      case "u": {
        const g = gradeById(parts[1]), u = unitOf(g, parts[2]);
        if (!u) return renderHome();
        if (!parts[3]) return renderUnit(g, u);
        return renderStep(g, u, parts[3], token);
      }
      case "big": { const g = gradeById(parts[1]) || gradeById(p.grade); return renderBig(g, token); }
      case "review": return renderReview(parts[1] || "", token);
      case "challenges": return renderChallenges();
      case "awards": return renderAwards();
      case "profile": return renderProfile();
      case "report": return renderReport();
      case "welcome": return renderWelcome(true);
      default: return renderHome();
    }
  } finally { celebrateBadges(); }
}
const alive = token => token === renderToken;
document.querySelectorAll("[data-ic]").forEach(el => { el.innerHTML = icon(el.dataset.ic); });

/* ============================================================
   واجهة لكل مرحلة: شعار وألوان وخط يناسب العمر
   ============================================================ */
const STAGE_LOGO = {
  p: MASCOT,
  m: '<svg viewBox="0 0 100 100" class="mascot" aria-hidden="true"><path d="M50 8c14 10 20 28 18 50H32C30 36 36 18 50 8z" fill="#EEF7FA" stroke="#0E2A3B" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="36" r="9" fill="#22C3D8" stroke="#0E2A3B" stroke-width="4"/><path d="M32 46l-12 16v10l13-6zM68 46l12 16v10l-13-6z" fill="#FF6B8E" stroke="#0E2A3B" stroke-width="4" stroke-linejoin="round"/><path d="M38 66h24l-4 8H42z" fill="#0E2A3B"/><path d="M42 76q8 18 16 0q-4 6-8 14q-4-8-8-14z" fill="#FFC21A" stroke="#E09A00" stroke-width="3" stroke-linejoin="round"/></svg>',
  s: '<svg viewBox="0 0 100 100" class="mascot" aria-hidden="true"><rect x="8" y="8" width="84" height="84" rx="24" fill="#4F4FCC"/><rect x="8" y="8" width="84" height="84" rx="24" fill="url(#sg)" opacity=".35"/><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><text x="50" y="64" text-anchor="middle" font-family="Readex Pro, Fredoka, sans-serif" font-weight="700" font-size="40" fill="#fff">Aa</text><path d="M72 22l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#FFCB3D"/></svg>'
};
const STAGE_TAG = { p: "ألعاب وصور وأصوات", m: "مغامرات وتحديات", s: "تعلّم بأسلوب عصري" };
const STAGE_HELLO = { p: "يلا نلعب ونتعلّم!", m: "جاهز للمغامرة؟", s: "مرحباً بك" };
function applyStage(stage) {
  const r = document.documentElement;
  if (stage) r.dataset.stage = stage; else delete r.dataset.stage;
  /* شعار الموقع في الرأس ثابت لكل المراحل؛ شعارات المراحل تظهر في بطاقاتها فقط */
}
