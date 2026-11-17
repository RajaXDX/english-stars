/* ============================================================
   نجوم الإنجليزي — الواجهة
   يعتمد على: GRADES (من data/*.js) و Store (js/store.js)
   ============================================================ */

/* ---------------- البيانات ---------------- */
const STAGES = [
  { id: "p", ar: "الابتدائي", long: "المرحلة الابتدائية", c: 2 },
  { id: "m", ar: "المتوسط", long: "المرحلة المتوسطة", c: 5 },
  { id: "s", ar: "الثانوي", long: "المرحلة الثانوية", c: 3 }
];
GRADES.sort((a, b) => a.n - b.n);
const WORD_INDEX = {};
GRADES.forEach(g => {
  g.units.forEach((u, i) => {
    u.c = (i % 5) + 1;
    u.key = g.id + "-" + u.id;
    u.words = u.words.map(w => typeof w === "string" ? w.split("|") : w).map(w => [w[0], w[1], w[2] || ""]);
    u.quiz = u.quiz.map(q => typeof q === "string" ? q.split("|") : q);
    u.words.forEach(w => { WORD_INDEX[wordId(g, u, w)] = { g, u, w }; });
  });
});
function wordId(g, u, w) { return g.id + "|" + u.id + "|" + w[0]; }
const gradeById = id => GRADES.find(g => g.id === id);
const unitOf = (g, uid) => g && g.units.find(u => u.id === uid);
const stageOf = g => STAGES.find(s => s.id === g.stage);
const gradeShortNum = g => g.n <= 6 ? g.n : g.n <= 9 ? g.n - 6 : g.n - 9;

const STEP_META = {
  words:   { n: 1, t: "تعلّم الكلمات",       icon: "📖", d: "بطاقات الكلمات ومعانيها مع النطق" },
  listen:  { n: 2, t: "استمع وراجع النطق",   icon: "🎧", d: "اسمع الكلمة واختر الصحيحة" },
  grammar: { n: 3, t: "القاعدة",             icon: "✏️", d: "شرح القاعدة وأمثلة مسموعة" },
  wquiz:   { n: 4, t: "تحدي الكلمات",        icon: "🎯", d: "صور ومعانٍ واستماع" },
  spell:   { n: 4, t: "التهجئة",             icon: "🔤", d: "رتّب الحروف لتكتب الكلمة" },
  gquiz:   { n: 4, t: "تحدي القواعد",        icon: "🧩", d: "اختر الكلمة المناسبة للفراغ" },
  summary: { n: 5, t: "النتيجة والمراجعة",   icon: "🏁", d: "نجومك وما يحتاج مراجعة" }
};

/* ---------------- أدوات ---------------- */
const $ = s => document.querySelector(s);
const app = $("#app");
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const en = (t, cls = "") => `<span class="en ${cls}" lang="en" dir="ltr">${esc(t)}</span>`;
const T = (m, f) => (Store.profile() && Store.profile().gender === "f") ? f : m;
const starsHtml = (n, max) => `<span class="stars" role="img" aria-label="${n} من ${max} نجوم"><b>${"★".repeat(n)}</b>${"★".repeat(Math.max(0, max - n))}</span>`;
const ICON = {
  speaker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
  slow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 9.5c-1.3 0-2.4.7-3 1.8A6.5 6.5 0 0 0 4 14v1h-.5a1 1 0 0 0 0 2H6l1 2h2l-.5-2h5l-.5 2h2l1-2h1.5a3.5 3.5 0 0 0 3.5-3.5V12a2.5 2.5 0 0 0-2-2.5zM20 12a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.3 5.3 8 6.7l5.3 5.3L8 17.3l1.3 1.4L16 12z"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>'
};

/* الألوان تُعرض كبطاقة لون واضحة بدل الإيموجي */
const SWATCH = { "🔴": "#E53935", "🔵": "#1E66D0", "🟢": "#2E9E48", "🟡": "#F6C915", "🟠": "#F08A24", "🟣": "#8E44AD", "⚫": "#1B1B1B", "⚪": "#FFFFFF", "🟤": "#8B5A2B", "🩷": "#F48FB1" };
function picHtml(w, cls = "") {
  if (!w[2]) return "";
  if (SWATCH[w[2]]) return `<span class="swatch ${cls}" role="img" aria-label="${esc("بطاقة لون: " + w[1])}" style="--sw:${SWATCH[w[2]]}"></span>`;
  return `<span class="pic ${cls}" role="img" aria-label="${esc("صورة: " + w[1])}">${w[2]}</span>`;
}

let toastT;
function toast(msg, ms = 2600) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms);
}
function banner(id, html, kind = "") {
  let b = document.getElementById(id);
  if (!html) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("div"); b.id = id; b.className = "banner " + kind; b.setAttribute("role", "status"); $("#banners").appendChild(b); }
  b.innerHTML = html;
  return b;
}

/* ---------------- الصوت ---------------- */
const Speech = (() => {
  const supported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  let voice = null, checked = false;
  function pick() {
    if (!supported) return;
    const vs = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
    const pref = ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Microsoft Guy", "Zira", "Karen", "Daniel", "Alex"];
    voice = vs.find(v => pref.some(p => v.name.includes(p))) || vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0] || null;
    if (vs.length) checked = true;
  }
  if (supported) { pick(); speechSynthesis.onvoiceschanged = pick; }
  function say(text, slow) {
    if (!supported) { toast("الصوت غير متاح في هذا المتصفح. جرّب Chrome أو Safari."); return false; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/___/g, " ").replace(/\(.*?\)/g, ""));
    u.lang = "en-US"; u.rate = slow ? 0.55 : Store.rate; if (voice) u.voice = voice;
    speechSynthesis.speak(u);
    return true;
  }
  const stop = () => { if (supported) speechSynthesis.cancel(); };
  const hasEnglish = () => !supported ? false : (checked ? !!voice : true);
  return { supported, say, stop, hasEnglish };
})();
/* زر استماع + زر نطق بطيء */
function sayButtons(text, label = "استماع") {
  return `<span class="saygroup"><button class="say" data-say="${esc(text)}" aria-label="${label}: ${esc(text)}">${ICON.speaker}</button><button class="say slow" data-say="${esc(text)}" data-slow="1" aria-label="نطق بطيء: ${esc(text)}" title="نطق بطيء">${ICON.slow}</button></span>`;
}
function wireSay(root) {
  root.querySelectorAll("[data-say]").forEach(b => b.onclick = e => { e.stopPropagation(); Speech.say(b.dataset.say, !!b.dataset.slow); });
}

/* ---------------- مؤثرات ---------------- */
let actx = null;
function beep(ok) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    (ok ? [659, 880] : [300, 220]).forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * .12;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.16, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .2);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + .22);
    });
  } catch (e) {}
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv = $("#confetti"), ctx = cv.getContext("2d"); cv.hidden = false; cv.width = innerWidth; cv.height = innerHeight;
  const cs = getComputedStyle(document.documentElement);
  const cols = ["--c1", "--c2", "--c3", "--c4", "--c5", "--sun"].map(v => cs.getPropertyValue(v).trim());
  const ps = Array.from({ length: 110 }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, r: Math.random() * 6, s: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
  let f = 0;
  (function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .1; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (++f < 160) requestAnimationFrame(draw); else { ctx.clearRect(0, 0, cv.width, cv.height); cv.hidden = true; }
  })();
}
function celebrateBadges() {
  const fresh = Store.checkBadges();
  if (fresh.length) { toast(`🏅 شارة جديدة: ${fresh.map(b => b.name).join("، ")}`, 3500); confetti(); }
  updateStars();
}
function updateStars() { $("#totalStars").textContent = Store.profile() ? Store.totalStars() : 0; }

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
  const old = document.querySelector("#brandHome svg");
  if (old && old.dataset.stage !== (stage || "p")) {
    const t = document.createElement("template"); t.innerHTML = STAGE_LOGO[stage || "p"];
    const svg = t.content.firstChild; svg.dataset.stage = stage || "p"; old.replaceWith(svg);
  }
}

/* ============================================================
   البداية: خطوتان — (1) اختيار الصف، (2) طالب/طالبة + اسم
   ============================================================ */
function renderWelcome(editing) {
  chrome({ title: "", hideNav: true });
  const p = Store.profile();
  const st = { gender: (p && p.gender) || "", grade: (p && p.grade) || "", name: (p && p.name) || "", step: (p && p.grade && editing === true) ? 2 : 1 };
  const draw = () => (st.step === 1 ? stepGrade() : stepMe());

  function stepGrade() {
    applyStage(null);
    app.innerHTML = `<section class="pick-grade">
      <div class="hero">${MASCOT}<h1>أهلاً! في أي صف أنت؟</h1><p>اختر صفك لتبدأ، ولكل مرحلة واجهة تناسبها.</p></div>
      ${STAGES.map(s => `<section class="stage-block" data-look="${s.id}" aria-labelledby="sb-${s.id}">
        <header><span class="logo">${STAGE_LOGO[s.id]}</span><div><h2 id="sb-${s.id}">${s.ar}</h2><p>${STAGE_TAG[s.id]}</p></div></header>
        <div class="gtiles">${GRADES.filter(g => g.stage === s.id).map((g, i) => `<button type="button" class="gtile" data-grade="${g.id}" aria-pressed="${g.id === st.grade}" style="--c:var(--c${(i % 5) + 1});--t:var(--t${(i % 5) + 1})"><b>${gradeShortNum(g)}</b><span>${g.ar}</span>${g.book ? `<small>${esc(g.book)}</small>` : ""}</button>`).join("")}</div>
      </section>`).join("")}
    </section>`;
    app.querySelectorAll("[data-grade]").forEach(b => b.onclick = () => { st.grade = b.dataset.grade; st.step = 2; draw(); });
    focusMain();
  }

  function stepMe() {
    const g = gradeById(st.grade);
    applyStage(g.stage);
    app.innerHTML = `<section class="welcome">
      <div class="hero">${STAGE_LOGO[g.stage]}<h1>${STAGE_HELLO[g.stage]}</h1><p>تعلّم كلمات وقواعد منهجك بالصوت والصورة، واجمع النجوم. بدون حساب وبدون بيانات شخصية.</p></div>
      <form id="wForm" class="card form" novalidate>
        <div class="chosen"><div><span class="logo">${STAGE_LOGO[g.stage].replace('class="mascot"', 'class="mini"')}</span><div><small class="muted">صفّي</small><br><b>${g.ar}</b></div></div>
          <button type="button" class="btn ghost sm" id="wChange">تغيير الصف</button></div>
        <fieldset><legend>أنا…</legend>
          <div class="choice2">
            <button type="button" data-g="m" aria-pressed="false"><span aria-hidden="true">👦</span>طالب</button>
            <button type="button" data-g="f" aria-pressed="false"><span aria-hidden="true">👧</span>طالبة</button>
          </div>
        </fieldset>
        <label class="field" for="wName">الاسم <small>(اختياري، يظهر لك فقط)</small>
          <input id="wName" maxlength="20" autocomplete="off" value="${esc(st.name)}" placeholder="مثلاً: سارة">
        </label>
        <button class="btn primary block" id="wGo" type="submit" disabled>ابدأ التعلّم</button>
        <p class="muted small" id="wHint" aria-live="polite">اختر «طالب» أو «طالبة» للمتابعة.</p>
      </form></section>`;
    const paint = () => {
      app.querySelectorAll("[data-g]").forEach(b => b.setAttribute("aria-pressed", b.dataset.g === st.gender));
      $("#wGo").disabled = !(st.gender && st.grade);
      $("#wHint").hidden = !$("#wGo").disabled;
    };
    app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { st.gender = b.dataset.g; paint(); });
    $("#wName").oninput = e => { st.name = e.target.value; };
    $("#wChange").onclick = () => { st.step = 1; draw(); };
    paint();
    $("#wForm").onsubmit = e => {
      e.preventDefault();
      if (!(st.gender && st.grade)) return;
      const fields = { gender: st.gender, grade: st.grade, name: $("#wName").value.trim() };
      if (p && editing !== "new") Store.updateProfile(fields); else Store.createProfile(fields);
      go("home");
    };
    focusMain();
  }
  draw();
}

/* ============================================================
   الرئيسية
   ============================================================ */
function continueTarget(p) {
  let g = gradeById(p.last && p.last.grade) || gradeById(p.grade);
  let u = p.last && p.last.grade === g.id ? unitOf(g, p.last.unit) : null;
  if (u && Store.unitComplete(u.key)) {           // الوحدة اكتملت؟ اقترح التالية
    const i = g.units.indexOf(u); u = g.units[i + 1] || u;
  }
  if (!u) u = g.units.find(x => !Store.unitComplete(x.key)) || g.units[0];
  const step = Store.nextStep(u.key) || "summary";
  return { g, u, step };
}
function gradeProgress(g) {
  const done = g.units.filter(u => Store.unitComplete(u.key)).length;
  const stars = g.units.reduce((n, u) => n + Store.unitStars(u.key), 0) + Store.getStars(g.id + "-all", "wquiz");
  return { done, total: g.units.length, stars, max: g.units.length * 9 + 3 };
}
function renderHome() {
  const p = Store.profile();
  chrome({ title: "الرئيسية", tab: "home" });
  const { g, u, step } = continueTarget(p);
  applyStage(g.stage);
  const started = !!p.last;
  const d = Store.daily(), w = Store.weekly(), gp = gradeProgress(g);
  const due = Store.dueReviews().length;
  const stepsDone = Store.STEPS.filter(s => Store.isDone(u.key, s)).length;
  const hello = p.name ? `أهلاً يا ${esc(p.name)}` : T("أهلاً يا بطل", "أهلاً يا بطلة");
  app.innerHTML = `<div class="stack">
    <header class="hello">
      <div><h1>${hello} 👋</h1><p class="muted">${g.ar}${g.book ? ` · ${en(g.book)}` : ""}</p></div>
      <a class="btn ghost sm" href="#learn/${g.id}">تغيير الصف</a>
    </header>

    <section class="card continue" style="--c:var(--c${u.c});--t:var(--t${u.c})" aria-labelledby="contTitle">
      <p class="eyebrow">${started ? T("أكمل من حيث توقفت", "أكملي من حيث توقفتِ") : T("ابدأ رحلتك", "ابدئي رحلتك")}</p>
      <h2 id="contTitle"><span class="unum">${esc(u.num)}</span> ${en(u.en)}</h2>
      <p class="muted">${u.ar}</p>
      <div class="next"><span aria-hidden="true">${STEP_META[step].icon}</span><div><b>${step === "summary" ? "الوحدة مكتملة" : "الخطوة التالية"}:</b> ${STEP_META[step].t}</div></div>
      <div class="bar" role="progressbar" aria-label="تقدم الوحدة" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${stepsDone}"><i style="width:${stepsDone / 6 * 100}%"></i></div>
      <a class="btn primary block" href="#${stepRoute(g, u, step)}">${started ? T("أكمل", "أكملي") : T("ابدأ", "ابدئي")} ←</a>
    </section>

    <div class="grid2">
      <section class="card goal" aria-labelledby="goalT">
        <h2 id="goalT" class="h3">🎯 هدف اليوم</h2>
        <p>${T("تعلّم", "تعلّمي")} ${d.goalWords} كلمات أو ${T("أكمل", "أكملي")} نشاطاً واحداً</p>
        <div class="bar" role="progressbar" aria-label="كلمات اليوم" aria-valuemin="0" aria-valuemax="${d.goalWords}" aria-valuenow="${Math.min(d.words, d.goalWords)}"><i style="width:${Math.min(100, d.words / d.goalWords * 100)}%"></i></div>
        <p class="small">${d.met ? "✅ " + T("أحسنت! حققت هدف اليوم", "أحسنتِ! حققتِ هدف اليوم") : `${d.words} من ${d.goalWords} كلمات · ${d.acts} ${d.acts === 1 ? "نشاط" : "أنشطة"}`}</p>
      </section>
      <section class="card" aria-labelledby="progT">
        <h2 id="progT" class="h3">⭐ تقدّمك في ${g.ar}</h2>
        <p class="big-num">${gp.stars}<small> / ${gp.max} نجمة</small></p>
        <p class="small muted">${gp.done} من ${gp.total} وحدات مكتملة</p>
      </section>
    </div>

    ${due ? `<a class="card link review-card" href="#review"><span class="ic" aria-hidden="true">🔁</span><div><b>${due} ${due === 1 ? "كلمة" : "كلمات"} للمراجعة اليوم</b><p class="small muted">كلمات أخطأت فيها سابقاً. المراجعة تثبّتها.</p></div><span aria-hidden="true">←</span></a>` : ""}

    <section class="card" aria-labelledby="weekT">
      <h2 id="weekT" class="h3">📅 هذا الأسبوع</h2>
      ${weekDots(w)}
      <p class="small">${w.met ? "🏆 حققت هدف الأسبوع!" : `${w.acts} من ${w.goal} أنشطة نحو هدف الأسبوع`}</p>
    </section>

    <section aria-labelledby="unitsT">
      <div class="row-between"><h2 id="unitsT" class="h3">وحدات ${g.ar}</h2><a href="#learn/${g.id}" class="small">عرض الكل</a></div>
      <div class="hscroll" role="list">${g.units.map(x => unitMini(g, x)).join("")}</div>
    </section>
  </div>`;
  focusMain();
}
function weekDots(w) {
  const names = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  return `<ol class="week" aria-label="أيام التعلّم هذا الأسبوع">${names.map((n, i) => `<li class="${w.active[i] ? "on" : ""} ${i === w.todayIndex ? "today" : ""}"><span aria-hidden="true">${w.active[i] ? "★" : ""}</span><small>${n}</small><span class="sr">${w.active[i] ? "تعلّمت" : "—"}</span></li>`).join("")}</ol>`;
}
function unitMini(g, u) {
  const n = Store.STEPS.filter(s => Store.isDone(u.key, s)).length;
  return `<a role="listitem" class="umini" href="#u/${g.id}/${u.id}" style="--c:var(--c${u.c});--t:var(--t${u.c})">
    <span class="unum">${esc(u.num)}</span><span class="en t" lang="en" dir="ltr">${esc(u.en)}</span>
    <span class="dots" aria-label="${n} من 6 خطوات">${Store.STEPS.map(s => `<i class="${Store.isDone(u.key, s) ? "on" : ""}"></i>`).join("")}</span></a>`;
}

/* ============================================================
   التعلّم: المراحل والصفوف والوحدات
   ============================================================ */
function renderLearn(gid) {
  const p = Store.profile();
  const g = gradeById(gid) || gradeById(p.grade);
  chrome({ title: "التعلّم", tab: "learn" });
  const gp = gradeProgress(g);
  const parts = [...new Set(g.units.map(u => u.part || 0))];
  const partName = x => x === 1 ? "الجزء الأول" : x === 2 ? "الجزء الثاني" : "";
  app.innerHTML = `<div class="stack">
    <h1 class="sr">التعلّم</h1>
    <div class="seg wide" role="group" aria-label="المرحلة">${STAGES.map(s => `<button data-stage="${s.id}" aria-pressed="${s.id === g.stage}">${s.ar}</button>`).join("")}</div>
    <div class="chips" role="group" aria-label="الصف">${GRADES.filter(x => x.stage === g.stage).map(x => `<a class="chip" href="#learn/${x.id}" aria-current="${x.id === g.id ? "true" : "false"}">${x.ar}${x.id === p.grade ? ' <span aria-label="صفّي">★</span>' : ""}</a>`).join("")}</div>
    <section class="card grade-head" style="--c:var(--c${stageOf(g).c});--t:var(--t${stageOf(g).c})">
      <div><h2>${g.ar}</h2><p class="muted small">${g.book ? `كتاب ${en(g.book)} · ` : ""}${g.units.length} وحدات · ${gp.stars} / ${gp.max} ★</p></div>
      ${g.id === p.grade ? `<span class="pill">صفّي</span>` : `<button class="btn ghost sm" id="setMine">اجعله صفّي</button>`}
    </section>
    ${parts.map(x => `${partName(x) ? `<h3 class="part">${partName(x)}</h3>` : ""}
      <ul class="units">${g.units.filter(u => (u.part || 0) === x).map(u => unitRow(g, u)).join("")}</ul>`).join("")}
    <a class="card link" href="#big/${g.id}" style="--c:var(--brand)"><span class="ic" aria-hidden="true">🏆</span><div><b>التحدي الكبير</b><p class="small muted">كلمات من كل وحدات ${g.ar}</p></div>${starsHtml(Store.getStars(g.id + "-all", "wquiz"), 3)}</a>
  </div>`;
  app.querySelectorAll("[data-stage]").forEach(b => b.onclick = () => go("learn/" + GRADES.find(x => x.stage === b.dataset.stage).id));
  const sm = $("#setMine"); if (sm) sm.onclick = () => { Store.updateProfile({ grade: g.id }); toast(`صار صفّك: ${g.ar}`); renderLearn(g.id); };
  focusMain();
}
function unitRow(g, u) {
  const n = Store.STEPS.filter(s => Store.isDone(u.key, s)).length, full = n === 6;
  return `<li><a class="urow" href="#u/${g.id}/${u.id}" style="--c:var(--c${u.c});--t:var(--t${u.c})">
    <span class="unum">${esc(u.num)}</span>
    <span class="body"><span class="en t" lang="en" dir="ltr">${esc(u.en)}</span><span class="ar small">${u.ar}</span>
      <span class="dots" aria-label="${n} من 6 خطوات منجزة">${Store.STEPS.map(s => `<i class="${Store.isDone(u.key, s) ? "on" : ""}"></i>`).join("")}</span></span>
    <span class="end">${full ? `<span class="done" aria-label="مكتملة">${ICON.check}</span>` : ""}${starsHtml(Store.unitStars(u.key), 9)}</span></a></li>`;
}

/* ============================================================
   الوحدة: خطوات متسلسلة
   ============================================================ */
function renderUnit(g, u) {
  chrome({ title: `${g.ar} · ${u.num}`, back: "learn/" + g.id, tab: "learn" });
  Store.setLast({ grade: g.id, unit: u.id, step: null });
  const next = Store.nextStep(u.key) || "summary";
  const item = (step) => {
    const m = STEP_META[step], done = step === "summary" ? Store.unitComplete(u.key) : Store.isDone(u.key, step);
    const scored = Store.SCORED.includes(step);
    return `<li><a class="step ${done ? "is-done" : ""} ${step === next ? "is-next" : ""}" href="#${stepRoute(g, u, step)}">
      <span class="ic" aria-hidden="true">${done ? ICON.check : m.icon}</span>
      <span class="body"><b>${m.t}</b><span class="small muted">${m.d}</span></span>
      <span class="end">${scored ? starsHtml(Store.getStars(u.key, step), 3) : ""}${step === next ? `<span class="pill">${T("التالي", "التالي")}</span>` : done ? '<span class="sr">منجزة</span>' : ""}</span></a></li>`;
  };
  app.innerHTML = `<div class="stack" style="--c:var(--c${u.c});--t:var(--t${u.c})">
    <header class="uhead"><span class="unum lg">${esc(u.num)}</span><div><h1>${en(u.en)}</h1><p>${u.ar}</p><p class="small muted">${u.words.length} كلمة · ${starsHtml(Store.unitStars(u.key), 9)}</p></div></header>
    <ol class="steps">
      <li class="grp"><span class="n">1</span><ul>${item("words")}</ul></li>
      <li class="grp"><span class="n">2</span><ul>${item("listen")}</ul></li>
      <li class="grp"><span class="n">3</span><ul>${item("grammar")}</ul></li>
      <li class="grp"><span class="n">4</span><ul>${item("wquiz")}${item("spell")}${item("gquiz")}</ul></li>
      <li class="grp"><span class="n">5</span><ul>${item("summary")}</ul></li>
    </ol>
    <a class="btn primary block" href="#${stepRoute(g, u, next)}">${next === "summary" ? "عرض النتيجة" : T("ابدأ: ", "ابدئي: ") + STEP_META[next].t} ←</a>
  </div>`;
  focusMain();
}
/* زر «الخطوة التالية» في آخر كل خطوة */
function nextButtons(g, u, current) {
  const order = ["words", "listen", "grammar", "wquiz", "spell", "gquiz", "summary"];
  const nx = order[order.indexOf(current) + 1];
  return `<div class="actions"><a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a>${nx ? `<a class="btn primary" href="#${stepRoute(g, u, nx)}">التالي: ${STEP_META[nx].t} ←</a>` : ""}</div>`;
}

function renderStep(g, u, step, token) {
  if (!STEP_META[step]) return renderUnit(g, u);
  chrome({ title: STEP_META[step].t, back: `u/${g.id}/${u.id}`, tab: "learn" });
  if (step !== "summary") Store.setLast({ grade: g.id, unit: u.id, step });
  const shell = inner => `<div class="stack" style="--c:var(--c${u.c});--t:var(--t${u.c})">
    <p class="crumb small muted">الخطوة ${STEP_META[step].n} من 5 · ${en(u.en)}</p>${inner}</div>`;
  if (step === "words") return stepWords(g, u, shell);
  if (step === "grammar") return stepGrammar(g, u, shell);
  if (step === "summary") return stepSummary(g, u, shell);
  app.innerHTML = shell(`<div id="pane"></div>`);
  const pane = $("#pane");
  if (step === "listen") return runQuiz(pane, token, {
    title: "استمع وراجع النطق", intro: `${T("ستسمع", "ستسمعين")} كلمة من الوحدة، ${T("واختر", "واختاري")} كتابتها الصحيحة. ${T("تقدر", "تقدرين")} ${T("تعيد", "تعيدين")} الصوت أو ${T("تبطّئه", "تبطّئينه")}.`,
    qs: listenQs(g, u), kind: "listen", unit: { g, u }, step: "listen", back: `u/${g.id}/${u.id}`
  });
  if (step === "wquiz") return runQuiz(pane, token, {
    title: "تحدي الكلمات", intro: `أسئلة متنوعة: ${T("سمِّ", "سمّي")} الصورة، ${T("واختر", "واختاري")} المعنى، ${T("واستمع", "واستمعي")} للكلمة.`,
    qs: makeWordQs(g, u.words.map(w => ({ g, u, w })), Math.min(10, u.words.length)), kind: "word", unit: { g, u }, step: "wquiz", starKey: u.key, back: `u/${g.id}/${u.id}`
  });
  if (step === "spell") return runQuiz(pane, token, {
    title: "التهجئة", intro: `${T("رتّب", "رتّبي")} الحروف ${T("لتكتب", "لتكتبي")} الكلمة. لك ثلاث محاولات لكل كلمة، وزر «ساعدني» يضع الحرف التالي.`,
    qs: spellQs(g, u), kind: "spell", unit: { g, u }, step: "spell", starKey: u.key, back: `u/${g.id}/${u.id}`
  });
  if (step === "gquiz") return runQuiz(pane, token, {
    title: "تحدي القواعد", intro: `${T("اختر", "اختاري")} الكلمة المناسبة للفراغ في كل جملة. ${T("راجع", "راجعي")} القاعدة قبل البدء إن ${T("احتجت", "احتجتِ")}.`,
    qs: shuffle(u.quiz).map(q => ({ type: "gram", s: q[0], right: q[1], opts: shuffle(q.slice(1)) })), kind: "gram", unit: { g, u }, step: "gquiz", starKey: u.key, back: `u/${g.id}/${u.id}`
  });
}

/* ---- الخطوة 1: الكلمات ---- */
function stepWords(g, u, shell) {
  app.innerHTML = shell(`
    <h1 class="h2">📖 تعلّم الكلمات</h1>
    <p class="muted">${T("اضغط", "اضغطي")} على البطاقة ${T("لتسمع", "لتسمعي")} الكلمة، وزر السلحفاة للنطق البطيء.</p>
    <div class="toolbar"><button class="btn ghost sm" id="toggleAr" aria-pressed="false">إخفاء المعنى</button><button class="btn sm" id="playAll">${T("اسمع", "اسمعي")} الكل</button>
      <span class="small muted" id="heard" aria-live="polite"></span></div>
    <ul class="cards" id="cards">${u.words.map((w, i) => `<li class="card wcard ${w[2] ? "" : "noe"}">
      <button class="wbtn" data-i="${i}" aria-label="${esc(w[0])}، ${esc(w[1])}. اضغط للاستماع">${picHtml(w)}<span class="en w" lang="en" dir="ltr">${esc(w[0])}</span><span class="m">${w[1]}</span></button>
      <button class="say slow mini" data-say="${esc(w[0])}" data-slow="1" aria-label="نطق بطيء: ${esc(w[0])}">${ICON.slow}</button></li>`).join("")}</ul>
    ${!Speech.supported ? `<p class="note">الصوت غير متاح في هذا المتصفح، لكن ${T("تقدر", "تقدرين")} ${T("تتعلم", "تتعلمين")} الكلمات ومعانيها.</p>` : ""}
    <div class="actions"><a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a><button class="btn primary" id="doneWords">${T("أنهيت الكلمات", "أنهيتُ الكلمات")} ← التالي</button></div>`);
  const heard = new Set(), cards = $("#cards");
  const mark = i => {
    heard.add(i); Store.learnWord(wordId(g, u, u.words[i]));
    $("#heard").textContent = `${T("سمعت", "سمعتِ")} ${heard.size} من ${u.words.length}`;
    if (heard.size === u.words.length && Store.markDone(u.key, "words")) toast("✅ أنهيت خطوة الكلمات");
  };
  cards.querySelectorAll(".wbtn").forEach(b => b.onclick = () => {
    cards.querySelectorAll(".playing").forEach(x => x.classList.remove("playing"));
    b.parentElement.classList.add("playing"); Speech.say(u.words[b.dataset.i][0]); mark(+b.dataset.i);
  });
  wireSay(cards);
  $("#toggleAr").onclick = e => { const h = cards.classList.toggle("hide-ar"); e.currentTarget.textContent = h ? "إظهار المعنى" : "إخفاء المعنى"; e.currentTarget.setAttribute("aria-pressed", h); };
  let timer = null;
  const label = T("اسمع", "اسمعي") + " الكل";
  $("#playAll").onclick = e => {
    const btn = e.currentTarget;
    if (timer) { clearTimeout(timer); timer = null; Speech.stop(); btn.textContent = label; return; }
    btn.textContent = "إيقاف"; let i = 0;
    const step = () => {
      const els = cards.querySelectorAll(".wcard"); els.forEach(x => x.classList.remove("playing"));
      if (i >= u.words.length || !document.body.contains(cards)) { timer = null; btn.textContent = label; return; }
      els[i].classList.add("playing"); els[i].scrollIntoView({ block: "nearest", behavior: "smooth" });
      Speech.say(u.words[i][0]); mark(i); i++; timer = setTimeout(step, 1800);
    };
    step();
  };
  $("#doneWords").onclick = () => { Store.markDone(u.key, "words"); celebrateBadges(); go(stepRoute(g, u, "listen")); };
  focusMain();
}

/* ---- الخطوة 3: القاعدة ---- */
function stepGrammar(g, u, shell) {
  app.innerHTML = shell(`<h1 class="h2">✏️ القاعدة</h1>${u.grammar.map(gr => {
    let table = "";
    if (gr.table) {
      const encols = gr.table.en || [];
      table = `<div class="tablewrap"><table><thead><tr>${gr.table.head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${gr.table.rows.map(r => `<tr>${r.map((c, i) => encols.includes(i) ? `<td lang="en" dir="ltr" class="en">${esc(c)}</td>` : `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return `<article class="card gblock"><h2 class="h3">${gr.t}</h2><p>${gr.p}</p>${table}
      <ul class="examples">${gr.ex.map(x => `<li>${sayButtons(x[0], "استمع للمثال")}<span class="en" lang="en" dir="ltr">${esc(x[0])}</span><span class="tr">${x[1]}</span></li>`).join("")}</ul></article>`;
  }).join("")}
  <div class="actions"><a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a><button class="btn primary" id="doneGram">${T("فهمت القاعدة", "فهمتُ القاعدة")} ← التحديات</button></div>`);
  wireSay(app);
  $("#doneGram").onclick = () => { Store.markDone(u.key, "grammar"); celebrateBadges(); go(stepRoute(g, u, "wquiz")); };
  focusMain();
}

/* ---- الخطوة 5: النتيجة والمراجعة ---- */
function stepSummary(g, u, shell) {
  const prefix = g.id + "|" + u.id + "|";
  const weak = Store.allReviews(prefix).map(id => WORD_INDEX[id]).filter(Boolean);
  const total = Store.unitStars(u.key);
  const nextU = g.units[g.units.indexOf(u) + 1];
  const rows = Store.SCORED.map(s => `<li><a href="#${stepRoute(g, u, s)}"><span>${STEP_META[s].icon} ${STEP_META[s].t}</span>${Store.isDone(u.key, s) ? starsHtml(Store.getStars(u.key, s), 3) : `<span class="small muted">لم ${T("تبدأه", "تبدئيه")} بعد</span>`}</a></li>`).join("");
  app.innerHTML = shell(`<h1 class="h2">🏁 النتيجة والمراجعة</h1>
    <section class="card center"><p class="big-num">${total}<small> / 9 نجوم</small></p>${starsHtml(total, 9)}
      <p>${Store.unitComplete(u.key) ? "🎉 " + T("أكملت كل خطوات الوحدة!", "أكملتِ كل خطوات الوحدة!") : `${T("أنجزت", "أنجزتِ")} ${Store.STEPS.filter(s => Store.isDone(u.key, s)).length} من 6 خطوات`}</p></section>
    <section class="card"><h2 class="h3">نتائج التحديات</h2><ul class="list">${rows}</ul></section>
    <section class="card"><h2 class="h3">كلمات تحتاج مراجعة</h2>
      ${weak.length ? `<ul class="weak">${weak.map(x => `<li>${sayButtons(x.w[0])}${en(x.w[0])}<span class="tr">${x.w[1]}</span></li>`).join("")}</ul>
      <a class="btn primary block" href="#review/${encodeURIComponent(g.id + "|" + u.id)}">${T("راجع", "راجعي")} هذه الكلمات (${weak.length})</a>`
      : `<p class="muted">لا توجد كلمات تحتاج مراجعة في هذه الوحدة. ممتاز!</p>`}</section>
    <div class="actions"><a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a>${nextU ? `<a class="btn primary" href="#u/${g.id}/${nextU.id}">الوحدة التالية ←</a>` : `<a class="btn primary" href="#big/${g.id}">التحدي الكبير ←</a>`}</div>`);
  wireSay(app);
  focusMain();
}

/* ============================================================
   الأسئلة
   ============================================================ */
/* items: [{g,u,w}] */
function makeWordQs(g, items, n) {
  return shuffle(items).slice(0, n).map((it, k) => {
    const w = it.w, hasPic = !!w[2];
    let type = hasPic ? ["pic", "listen", "meaning"][k % 3] : ["meaning", "listen", "reverse"][k % 3];
    let cands = items.filter(x => x.w[0] !== w[0] && x.w[1] !== w[1]);
    if (type === "pic" || (type === "listen" && hasPic)) cands = cands.filter(x => x.w[2] && x.w[2] !== w[2]);
    if (cands.length < 3) { type = "meaning"; cands = items.filter(x => x.w[0] !== w[0] && x.w[1] !== w[1]); }
    const opts = shuffle([it, ...shuffle(cands).slice(0, 3)]);
    return { type, it, id: wordId(it.g, it.u, w), opts, picListen: type === "listen" && hasPic };
  });
}
function listenQs(g, u) {
  const items = u.words.map(w => ({ g, u, w }));
  return shuffle(items).slice(0, Math.min(8, items.length)).map(it => {
    const cands = items.filter(x => x.w[0] !== it.w[0]);
    return { type: "listen", it, id: wordId(g, u, it.w), opts: shuffle([it, ...shuffle(cands).slice(0, 3)]), picListen: false };
  });
}
function spellQs(g, u) {
  const ok = w => /^[a-z][a-z \-]*$/i.test(w[0]) && w[0].replace(/[^a-z]/gi, "").length >= 3 && w[0].replace(/[^a-z]/gi, "").length <= 13;
  return shuffle(u.words.filter(ok)).slice(0, 6).map(w => ({ type: "spell", it: { g, u, w }, id: wordId(g, u, w) }));
}

/* ============================================================
   مشغّل التحديات: مقدمة ← أسئلة مع تغذية راجعة ← نتيجة
   opts: {title, intro, qs, kind, unit, step, starKey, back, review}
   ============================================================ */
function runQuiz(pane, token, cfg) {
  const qs = cfg.qs;
  if (!qs.length) { pane.innerHTML = `<div class="card center"><p>لا توجد أسئلة كافية هنا.</p><a class="btn" href="#${cfg.back}">رجوع</a></div>`; return; }
  const best = cfg.starKey ? Store.getStars(cfg.starKey, cfg.step) : null;
  pane.innerHTML = `<section class="card intro center">
    <h1 class="h2">${cfg.title}</h1><p>${cfg.intro}</p>
    <ul class="facts"><li><b>${qs.length}</b> ${qs.length > 10 ? "سؤالاً" : "أسئلة"}</li>${cfg.starKey ? `<li>حتى <b>3</b> نجوم</li><li>${T("أفضل نتيجتك", "أفضل نتيجتك")}: ${starsHtml(best, 3)}</li>` : `<li>بدون نجوم، للتدريب</li>`}</ul>
    <button class="btn primary block" id="qStart">${T("ابدأ", "ابدئي")}</button></section>`;
  $("#qStart").onclick = () => play();
  focusMain();

  let i = 0, score = 0, finished = false;
  const misses = [];
  function play() {
    if (!alive(token)) return;
    if (i >= qs.length) return finish();
    const q = qs[i];
    pane.innerHTML = `<section class="card playc">
      <div class="prog"><span>${i + 1} / ${qs.length}</span><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div><span class="star" aria-label="${score} إجابات صحيحة">★ ${score}</span></div>
      <div id="qbody" class="qbody"></div>
      <div class="feedback" id="fb" aria-live="assertive"></div>
      <button class="btn primary block" id="qNext" hidden>${i + 1 < qs.length ? "التالي" : "النتيجة"} ←</button></section>`;
    let answered = false;
    const answer = (ok, rightText) => {
      if (answered) return; answered = true;          // يمنع احتساب الإجابة مرتين
      if (ok) score++; else misses.push(q);
      Store.recordAnswer(ok);
      if (q.id) {
        if (cfg.review) Store.reviewResult(q.id, ok);
        else if (ok) Store.learnWord(q.id);
        else Store.addMistake(q.id);
      }
      beep(ok);
      const fb = $("#fb");
      fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = ok ? "✔ " + shuffle([T("أحسنت!", "أحسنتِ!"), "إجابة صحيحة!", "ممتاز!", "رائع!"])[0]
                        : `✘ الإجابة الصحيحة: ${en(rightText)}`;
      const nb = $("#qNext"); nb.hidden = false; nb.focus({ preventScroll: true });
      nb.onclick = () => { i++; play(); };
    };
    renderQuestion(q, $("#qbody"), answer);
  }
  function finish() {
    if (finished) return; finished = true;
    const pct = score / qs.length, st = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .4 ? 1 : 0;
    let res = null;
    if (cfg.starKey) res = Store.setStars(cfg.starKey, cfg.step, st);
    if (cfg.unit && cfg.step) Store.markDone(cfg.unit.u.key, cfg.step);
    else if (cfg.step === "big") Store.markDone(cfg.starKey, "wquiz");
    const msg = st === 3 ? T("ممتاز! أنت نجم", "ممتاز! أنتِ نجمة") : st === 2 ? T("رائع! أحسنت", "رائع! أحسنتِ") : st === 1 ? "بداية جيدة!" : "كل محاولة تعلّمك شيئاً";
    const name = Store.profile().name;
    const missList = misses.map(q => q.type === "gram"
      ? `<li><span class="en" lang="en" dir="ltr">${esc(q.s.replace("___", "[" + q.right + "]"))}</span></li>`
      : `<li>${sayButtons(q.it.w[0])}${en(q.it.w[0])}<span class="tr">${q.it.w[1]}</span></li>`).join("");
    const { g, u } = cfg.unit || {};
    pane.innerHTML = `<section class="card result center">${st >= 2 ? STAGE_LOGO[document.documentElement.dataset.stage || "p"] : ""}
      <h1 class="h2">${msg}${name ? "، " + esc(name) : ""}</h1>
      ${cfg.starKey ? `<div class="bigstars">${starsHtml(st, 3)}</div>` : ""}
      <p><b>${score}</b> من <b>${qs.length}</b> إجابات صحيحة</p>
      ${res ? (res.gained ? `<p class="pill good">+${res.gained} ${res.gained === 1 ? "نجمة جديدة" : "نجوم جديدة"}</p>` : res.before >= st && res.before ? `<p class="small muted">أفضل نتيجة لك ${res.best} نجوم. النجوم تُحتسب مرة واحدة لأفضل محاولة.</p>` : "") : ""}
      </section>
      ${misses.length ? `<section class="card"><h2 class="h3">${cfg.kind === "gram" ? "جمل تحتاج مراجعة" : "كلمات تحتاج مراجعة"}</h2><ul class="weak">${missList}</ul>
        ${cfg.kind !== "gram" && !cfg.review ? `<p class="small muted">${T("أضفناها", "أضفناها")} لقائمة المراجعة في الرئيسية.</p>` : ""}</section>` : ""}
      <div class="actions">
        <button class="btn ghost" id="again">إعادة المحاولة</button>
        ${u ? `<a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a>` : `<a class="btn ghost" href="#${cfg.back}">رجوع</a>`}
        ${u ? nextLink(g, u, cfg.step) : ""}
      </div>`;
    wireSay(pane);
    $("#again").onclick = () => route();
    if (st === 3) confetti();
    beep(st >= 2);
    celebrateBadges();
    focusMain();
  }
}
function nextLink(g, u, step) {
  const order = ["listen", "wquiz", "spell", "gquiz", "summary"];
  let nx = order[order.indexOf(step) + 1];
  if (step === "listen") nx = Store.isDone(u.key, "grammar") ? "wquiz" : "grammar";
  return nx ? `<a class="btn primary" href="#${stepRoute(g, u, nx)}">التالي: ${STEP_META[nx].t} ←</a>` : "";
}

function renderQuestion(q, box, answer) {
  if (q.type === "gram") return qGram(q, box, answer);
  if (q.type === "spell") return qSpell(q, box, answer);
  const w = q.it.w;
  let head = "", labelOf;
  if (q.type === "pic") {
    head = `<p class="ask">ما اسم هذه الصورة بالإنجليزي؟</p><div class="qpic">${picHtml(w, "xl")}</div><p class="muted">${w[1]}</p>`;
    labelOf = o => en(o.w[0]);
  } else if (q.type === "listen") {
    head = `<p class="ask">${T("استمع واختر", "استمعي واختاري")} ${q.picListen ? "الصورة" : "الكلمة"} الصحيحة</p>
      <div class="listen"><button class="bigsay" id="hear" aria-label="استمع للكلمة">${ICON.speaker}</button><button class="say slow" id="hearSlow" aria-label="استمع ببطء">${ICON.slow}</button></div>`;
    labelOf = o => q.picListen ? picHtml(o.w, "opt-pic") : en(o.w[0]);
  } else if (q.type === "meaning") {
    head = `<p class="ask">ما معنى هذه الكلمة؟</p><div class="qword">${en(w[0])} ${sayButtons(w[0])}</div>`;
    labelOf = o => esc(o.w[1]);
  } else {
    head = `<p class="ask">كيف نقولها بالإنجليزي؟</p><p class="qar">${w[1]}</p>`;
    labelOf = o => en(o.w[0]);
  }
  box.innerHTML = head + `<div class="opts" role="group" aria-label="الخيارات">${q.opts.map((o, j) => `<button class="opt" data-j="${j}">${labelOf(o)}</button>`).join("")}</div>`;
  wireSay(box);
  const h = box.querySelector("#hear"), hs = box.querySelector("#hearSlow");
  if (h) { h.onclick = () => Speech.say(w[0]); hs.onclick = () => Speech.say(w[0], true); setTimeout(() => Speech.say(w[0]), 300); }
  const btns = [...box.querySelectorAll(".opt")], right = q.opts.findIndex(o => o.w[0] === w[0]);
  btns.forEach(b => b.onclick = () => {
    const ok = +b.dataset.j === right;
    btns.forEach(x => { x.disabled = true; });
    b.classList.add(ok ? "right" : "wrong"); btns[right].classList.add("right");
    b.setAttribute("aria-label", (ok ? "صحيح: " : "خطأ: ") + b.textContent);
    Speech.say(w[0]);
    answer(ok, w[0]);
  });
}
function qGram(q, box, answer) {
  const parts = q.s.split("___");
  box.innerHTML = `<p class="ask">${T("اختر", "اختاري")} الإجابة المناسبة للفراغ</p>
    <p class="sentence" lang="en" dir="ltr">${esc(parts[0])}<span class="blank" aria-label="فراغ">&nbsp;</span>${esc(parts[1] || "")}</p>
    <div class="opts three" role="group" aria-label="الخيارات">${q.opts.map((o, j) => `<button class="opt" data-j="${j}" lang="en" dir="ltr">${esc(o)}</button>`).join("")}</div>`;
  const btns = [...box.querySelectorAll(".opt")], right = q.opts.indexOf(q.right);
  btns.forEach(b => b.onclick = () => {
    const ok = +b.dataset.j === right;
    btns.forEach(x => x.disabled = true);
    b.classList.add(ok ? "right" : "wrong"); btns[right].classList.add("right");
    box.querySelector(".blank").textContent = q.right;
    Speech.say(q.s.replace("___", q.right));
    answer(ok, q.right);
  });
}
function qSpell(q, box, answer) {
  const word = q.it.w[0], target = word.replace(/[^a-z]/gi, "").toLowerCase(), letters = target.split("");
  let mix; do { mix = shuffle(letters); } while (mix.join("") === target && new Set(letters).size > 1);
  let typed = [], tries = 0, over = false;
  const slots = [...word].map(ch => /[a-z]/i.test(ch) ? `<span class="slot"></span>` : `<span class="gap"></span>`).join("");
  box.innerHTML = `<p class="ask">${T("رتّب", "رتّبي")} الحروف ${T("لتكتب", "لتكتبي")} الكلمة</p>
    ${q.it.w[2] ? `<div class="qpic">${picHtml(q.it.w, "lg")}</div>` : ""}
    <div class="qline"><span class="qar">${q.it.w[1]}</span>${sayButtons(word)}</div>
    <div class="slots" id="slots" dir="ltr" aria-label="الحروف المختارة" aria-live="polite">${slots}</div>
    <div class="tiles" id="tiles" dir="ltr" role="group" aria-label="الحروف">${mix.map((l, j) => `<button class="tile" data-j="${j}" aria-label="حرف ${l}">${l}</button>`).join("")}</div>
    <div class="actions tight"><button class="btn ghost sm" id="undo">مسح حرف</button><button class="btn ghost sm" id="hint">${T("ساعدني", "ساعديني")}</button></div>
    <p class="small muted" id="tries" aria-live="polite"></p>`;
  wireSay(box);
  setTimeout(() => Speech.say(word), 300);
  const slotsEl = box.querySelector("#slots"), slotEls = [...slotsEl.querySelectorAll(".slot")], tiles = [...box.querySelectorAll(".tile")];
  const paint = () => slotEls.forEach((s, k) => { s.textContent = typed[k] != null ? mix[typed[k]] : ""; s.classList.toggle("full", typed[k] != null); });
  function end(ok) {
    over = true; tiles.forEach(t => t.disabled = true);
    if (ok) slotsEl.classList.add("ok"); else slotEls.forEach((s, k) => { s.textContent = target[k]; s.classList.add("full"); });
    Speech.say(word); answer(ok, word);
  }
  function check() {
    if (typed.map(j => mix[j]).join("") === target) return end(tries < 2);
    tries++; slotsEl.classList.remove("shake"); void slotsEl.offsetWidth; slotsEl.classList.add("shake");
    if (tries >= 3) return end(false);
    box.querySelector("#tries").textContent = `${T("قريب! حاول", "قريبة! حاولي")} مرة ثانية (${3 - tries} ${3 - tries === 1 ? "محاولة" : "محاولات"})`;
    typed = []; tiles.forEach(t => t.disabled = false); paint();
  }
  tiles.forEach(t => t.onclick = () => { if (over) return; typed.push(+t.dataset.j); t.disabled = true; paint(); if (typed.length === letters.length) check(); });
  box.querySelector("#undo").onclick = () => { if (over || !typed.length) return; tiles[typed.pop()].disabled = false; paint(); };
  box.querySelector("#hint").onclick = () => {
    if (over) return;
    typed.forEach(j => tiles[j].disabled = false);
    const keep = []; for (let k = 0; k < typed.length; k++) { if (mix[typed[k]] === target[k]) keep.push(typed[k]); else break; }
    if (keep.length >= letters.length) return;
    keep.push(mix.findIndex((l, idx) => l === target[keep.length] && !keep.includes(idx)));
    typed = keep; typed.forEach(x => tiles[x].disabled = true); tries = Math.max(tries, 1); paint();
    if (typed.length === letters.length) check();
  };
}

/* ============================================================
   التحدي الكبير والمراجعة
   ============================================================ */
function renderBig(g, token) {
  chrome({ title: "التحدي الكبير", back: "challenges", tab: "challenges" });
  app.innerHTML = `<div class="stack"><div id="pane"></div></div>`;
  const items = g.units.flatMap(u => u.words.map(w => ({ g, u, w })));
  runQuiz($("#pane"), token, {
    title: `🏆 التحدي الكبير: ${g.ar}`, intro: `15 سؤالاً من كلمات كل الوحدات.`,
    qs: makeWordQs(g, items, 15), kind: "word", step: "big", starKey: g.id + "-all", back: "challenges"
  });
}
function renderReview(filter, token) {
  chrome({ title: "المراجعة", back: filter ? null : "challenges", tab: "challenges" });
  if (filter) { const [gid, uid] = filter.split("|"); chrome({ title: "المراجعة", back: `u/${gid}/${uid}/summary`, tab: "learn" }); }
  const prefix = filter ? filter + "|" : "";
  let ids = Store.dueReviews(prefix);
  if (!ids.length && filter) ids = Store.allReviews(prefix);
  const items = ids.map(id => WORD_INDEX[id]).filter(Boolean);
  app.innerHTML = `<div class="stack"><div id="pane"></div></div>`;
  if (!items.length) {
    $("#pane").innerHTML = `<section class="card center"><h1 class="h2">🔁 المراجعة</h1>
      <p>${Store.allReviews().length ? "لا توجد كلمات مستحقة للمراجعة اليوم. عُد غداً!" : "لا توجد كلمات للمراجعة بعد. الكلمات التي تخطئ فيها في التحديات تظهر هنا."}</p>
      <a class="btn primary" href="#home">الرئيسية</a></section>`;
    return focusMain();
  }
  const pool = Object.values(WORD_INDEX);
  const qs = shuffle(items).slice(0, 10).map((it, k) => {
    const type = ["meaning", "listen", "reverse"][k % 3];
    const same = pool.filter(x => x.g === it.g && x.u === it.u && x.w[0] !== it.w[0] && x.w[1] !== it.w[1]);
    const cands = same.length >= 3 ? same : pool.filter(x => x.g === it.g && x.w[0] !== it.w[0]);
    return { type, it, id: wordId(it.g, it.u, it.w), opts: shuffle([it, ...shuffle(cands).slice(0, 3)]), picListen: false };
  });
  runQuiz($("#pane"), token, {
    title: "🔁 مراجعة الكلمات", intro: `كلمات أخطأت فيها سابقاً. كل إجابة صحيحة تؤجّل الكلمة لموعد مراجعة لاحق، وبعد عدة مرات صحيحة تخرج من القائمة.`,
    qs, kind: "word", review: true, back: filter ? `u/${filter.replace("|", "/")}/summary` : "challenges"
  });
}

/* ============================================================
   تبويب التحديات
   ============================================================ */
function renderChallenges() {
  const p = Store.profile(), g = gradeById(p.grade);
  chrome({ title: "التحديات", tab: "challenges" });
  const due = Store.dueReviews().length, allR = Store.allReviews().length;
  const pending = [];
  g.units.forEach(u => Store.SCORED.forEach(s => { if (Store.getStars(u.key, s) < 3) pending.push({ u, s }); }));
  app.innerHTML = `<div class="stack">
    <h1 class="h2">التحديات</h1>
    <a class="card link review-card" href="#review"><span class="ic" aria-hidden="true">🔁</span><div><b>مراجعة الكلمات</b><p class="small muted">${due ? `${due} ${due === 1 ? "كلمة مستحقة" : "كلمات مستحقة"} اليوم` : allR ? "لا شيء مستحق اليوم" : "تظهر هنا الكلمات التي تخطئ فيها"}</p></div><span aria-hidden="true">←</span></a>
    <a class="card link" href="#big/${g.id}"><span class="ic" aria-hidden="true">🏆</span><div><b>التحدي الكبير: ${g.ar}</b><p class="small muted">15 سؤالاً من كل الوحدات</p></div>${starsHtml(Store.getStars(g.id + "-all", "wquiz"), 3)}</a>
    <section><h2 class="h3">تحديات ${T("تنتظرك", "تنتظرك")} في ${g.ar}</h2>
      <ul class="list cards-list">${pending.slice(0, 8).map(({ u, s }) => `<li><a class="card link" href="#${stepRoute(g, u, s)}" style="--c:var(--c${u.c});--t:var(--t${u.c})"><span class="unum">${esc(u.num)}</span><div><b>${STEP_META[s].t}</b><p class="small muted">${en(u.en)}</p></div>${starsHtml(Store.getStars(u.key, s), 3)}</a></li>`).join("") || `<li class="muted">🎉 ${T("حصلت", "حصلتِ")} على كل النجوم في ${g.ar}!</li>`}</ul></section>
  </div>`;
  focusMain();
}

/* ============================================================
   الإنجازات
   ============================================================ */
function renderAwards() {
  const p = Store.profile();
  chrome({ title: "الإنجازات", tab: "awards" });
  const w = Store.weekly(), learned = Object.keys(p.learned).length;
  const units = Object.keys(p.done).filter(k => Store.unitComplete(k)).length;
  const acc = p.stats.answers ? Math.round(p.stats.correct / p.stats.answers * 100) : 0;
  app.innerHTML = `<div class="stack">
    <h1 class="h2">الإنجازات</h1>
    <div class="stats4">
      <div class="card stat"><b>${Store.totalStars()}</b><span>نجمة</span></div>
      <div class="card stat"><b>${learned}</b><span>كلمة تعلّمتها</span></div>
      <div class="card stat"><b>${units}</b><span>وحدة مكتملة</span></div>
      <div class="card stat"><b>${acc}%</b><span>دقة الإجابات</span></div>
    </div>
    <section class="card"><h2 class="h3">🏆 هدف الأسبوع</h2>
      <p>${T("أكمل", "أكملي")} ${w.goal} أنشطة هذا الأسبوع. يبدأ الهدف من جديد كل أحد.</p>
      <div class="bar" role="progressbar" aria-label="تقدم هدف الأسبوع" aria-valuemin="0" aria-valuemax="${w.goal}" aria-valuenow="${Math.min(w.acts, w.goal)}"><i style="width:${Math.min(100, w.acts / w.goal * 100)}%"></i></div>
      <p class="small">${w.met ? "🎉 تحقق الهدف!" : `${w.acts} من ${w.goal}`} · ${w.stars} نجمة هذا الأسبوع</p>
      ${weekDots(w)}</section>
    <section><h2 class="h3">الشارات</h2>
      <ul class="badges">${Store.BADGES.map(b => { const got = p.badges[b.id]; return `<li class="badge ${got ? "got" : ""}"><span class="bi" aria-hidden="true">${b.icon}</span><b>${b.name}</b><span class="small">${got ? "✔ حصلت عليها" : b.how}</span></li>`; }).join("")}</ul></section>
  </div>`;
  focusMain();
}

/* ============================================================
   الملف الشخصي والإعدادات
   ============================================================ */
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
function renderProfile() {
  const p = Store.profile();
  chrome({ title: "ملفي", tab: "profile" });
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  app.innerHTML = `<div class="stack">
    <h1 class="h2">ملفي</h1>
    <form class="card form" id="pForm">
      <label class="field" for="pName">الاسم <small>(اختياري)</small><input id="pName" maxlength="20" value="${esc(p.name)}" autocomplete="off"></label>
      <fieldset><legend>أنا</legend><div class="seg"><button type="button" data-g="m" aria-pressed="${p.gender === "m"}">طالب</button><button type="button" data-g="f" aria-pressed="${p.gender === "f"}">طالبة</button></div></fieldset>
      <label class="field" for="pGrade">صفّي<select id="pGrade">${STAGES.map(s => `<optgroup label="${s.long}">${GRADES.filter(g => g.stage === s.id).map(g => `<option value="${g.id}" ${g.id === p.grade ? "selected" : ""}>${g.ar}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <button class="btn primary" type="submit">حفظ</button>
    </form>
    <section class="card"><h2 class="h3">🔊 الصوت</h2>
      <div class="seg" role="group" aria-label="سرعة النطق"><button data-rate="0.85" aria-pressed="${Store.rate >= 0.8}">سرعة عادية</button><button data-rate="0.65" aria-pressed="${Store.rate < 0.8}">أبطأ</button></div>
      <p class="small muted">${Speech.recorded ? "النطق بصوت بشري مسجّل: رجالي للطلاب ونسائي للطالبات. كل مقطع يُحفظ بعد أول استماع ويعمل بعدها دون اتصال." : Speech.supported ? "يُستخدم صوت جهازك للنطق، ويعمل غالباً دون اتصال." : "الصوت غير متاح في هذا المتصفح. جرّب Chrome أو Safari."}</p>
      <button class="btn ghost sm" data-say="Hello! Welcome to English Stars.">جرّب الصوت</button></section>
    <section class="card"><h2 class="h3">👨‍👩‍👧 طلاب هذا الجهاز</h2>
      <ul class="list">${Store.profiles().map(x => `<li class="row-between"><span>${x.gender === "f" ? "👧" : "👦"} ${esc(x.name || (x.gender === "f" ? "طالبة" : "طالب"))} · <span class="small muted">${(gradeById(x.grade) || {}).ar || ""} · ★ ${countStars(x)}</span></span>
        ${x.id === p.id ? `<span class="pill">الحالي</span>` : `<button class="btn ghost sm" data-switch="${x.id}">تبديل</button>`}</li>`).join("")}</ul>
      <a class="btn ghost block" href="#welcome" id="addStudent">+ إضافة طالب آخر</a></section>
    <a class="card link" href="#report"><span class="ic" aria-hidden="true">📋</span><div><b>تقرير ولي الأمر والمعلم</b><p class="small muted">الوحدات المكتملة والكلمات التي تحتاج مراجعة</p></div><span aria-hidden="true">←</span></a>
    <section class="card"><h2 class="h3">📲 تثبيت التطبيق</h2>
      ${standalone ? `<p>التطبيق مثبّت على جهازك ✔</p>`
        : installPrompt ? `<p class="small">${T("ثبّت", "ثبّتي")} نجوم الإنجليزي على الشاشة الرئيسية ${T("ليفتح", "ليفتح")} كتطبيق ويعمل دون اتصال.</p><button class="btn primary" id="install">تثبيت التطبيق</button>`
        : isIOS ? `<p class="small">في Safari: ${T("اضغط", "اضغطي")} زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».</p>`
        : `<p class="small">من قائمة المتصفح ${T("اختر", "اختاري")} «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>`}</section>
    <section class="card note-card"><h2 class="h3">🔒 أين يُحفظ تقدمك؟</h2>
      <p class="small">على هذا الجهاز فقط، داخل المتصفح. لا يوجد حساب ولا تُرسل أي بيانات. إذا ${T("مسحت", "مسحتِ")} بيانات المتصفح أو ${T("استخدمت", "استخدمتِ")} التصفح الخاص قد يضيع التقدم. المزامنة بين الأجهزة غير متاحة حالياً.</p>
      <div id="delZone"><button class="btn danger sm" id="del">حذف بيانات هذا الطالب</button></div></section>
  </div>`;
  let gender = p.gender;
  app.querySelectorAll("#pForm [data-g]").forEach(b => b.onclick = () => { gender = b.dataset.g; app.querySelectorAll("#pForm [data-g]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("#pForm").onsubmit = e => { e.preventDefault(); Store.updateProfile({ name: $("#pName").value.trim(), gender, grade: $("#pGrade").value }); toast("تم الحفظ"); renderProfile(); };
  app.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => { Store.setRate(+b.dataset.rate); renderProfile(); });
  wireSay(app);
  app.querySelectorAll("[data-switch]").forEach(b => b.onclick = () => { Store.switchProfile(b.dataset.switch); toast("تم التبديل"); go("home"); });
  $("#addStudent").onclick = e => { e.preventDefault(); history.pushState(null, "", "#welcome"); renderWelcome("new"); };
  const ins = $("#install"); if (ins) ins.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderProfile(); };
  $("#del").onclick = () => {
    $("#delZone").innerHTML = `<p class="small"><b>متأكد؟</b> سيُحذف تقدم ${esc(p.name || "هذا الطالب")} ونجومه من هذا الجهاز نهائياً.</p>
      <div class="actions tight"><button class="btn danger sm" id="delYes">نعم، احذف</button><button class="btn ghost sm" id="delNo">إلغاء</button></div>`;
    $("#delNo").onclick = renderProfile;
    $("#delYes").onclick = () => { Store.removeProfile(p.id); toast("تم الحذف"); go(Store.profile() ? "home" : "welcome"); };
  };
  focusMain();
}
function countStars(prof) { let t = 0; for (const k in prof.stars) for (const a in prof.stars[k]) t += prof.stars[k][a]; return t; }

/* ============================================================
   تقرير ولي الأمر / المعلم (من بيانات هذا الجهاز فقط)
   ============================================================ */
function renderReport() {
  const p = Store.profile();
  chrome({ title: "التقرير", back: "profile", tab: "profile" });
  const touched = GRADES.filter(g => g.units.some(u => p.done[u.key] || p.stars[u.key]) || p.grade === g.id);
  const reviewItems = Object.keys(p.review).map(id => ({ id, r: p.review[id], x: WORD_INDEX[id] })).filter(o => o.x).sort((a, b) => b.r.misses - a.r.misses);
  const last = p.last ? new Date(p.last.at) : null;
  const lastDays = Object.keys(p.days).filter(k => p.days[k].w || p.days[k].a.length).sort().slice(-14);
  app.innerHTML = `<div class="stack">
    <h1 class="h2">📋 تقرير ${esc(p.name || (p.gender === "f" ? "الطالبة" : "الطالب"))}</h1>
    <p class="small muted">آخر نشاط: ${last ? last.toLocaleDateString("ar-SA-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }) : "لا يوجد"} · أيام التعلّم (آخر أسبوعين): ${lastDays.length}</p>
    ${touched.map(g => {
      const gp = gradeProgress(g);
      return `<section class="card"><h2 class="h3">${g.ar} ${g.book ? `· ${en(g.book)}` : ""}</h2>
        <p class="small">${gp.done} من ${gp.total} وحدات مكتملة · ${gp.stars} / ${gp.max} نجمة</p>
        <div class="tablewrap"><table class="report"><thead><tr><th scope="col">الوحدة</th><th scope="col">الخطوات</th><th scope="col">النجوم</th></tr></thead><tbody>
        ${g.units.map(u => `<tr><td><span class="en" lang="en" dir="ltr">${esc(u.num)}. ${esc(u.en)}</span></td><td>${Store.STEPS.filter(s => Store.isDone(u.key, s)).length}/6</td><td>${Store.unitStars(u.key)}/9</td></tr>`).join("")}
        </tbody></table></div></section>`;
    }).join("")}
    <section class="card"><h2 class="h3">كلمات تحتاج مراجعة (${reviewItems.length})</h2>
      ${reviewItems.length ? `<ul class="weak">${reviewItems.slice(0, 40).map(o => `<li>${en(o.x.w[0])}<span class="tr">${o.x.w[1]}</span><span class="small muted">${o.x.g.ar} · وحدة ${esc(o.x.u.num)} · أخطاء: ${o.r.misses}</span></li>`).join("")}</ul>` : `<p class="muted">لا توجد.</p>`}</section>
    <section class="card note-card"><h2 class="h3">ℹ️ عن هذا التقرير</h2>
      <p class="small">يعرض التقرير بيانات هذا الجهاز فقط. متابعة المعلم عن بُعد، وتقارير الفصل، ومزامنة التقدم بين الأجهزة تحتاج خادماً وحسابات، وهي غير متوفرة حالياً.</p></section>
  </div>`;
  focusMain();
}

/* ============================================================
   الشبكة، التخزين، والتحديثات
   ============================================================ */
function netStatus() {
  banner("offline", navigator.onLine ? "" : "📴 أنت غير متصل بالإنترنت. الوحدات المحفوظة على جهازك تعمل كالمعتاد.", "warn");
}
window.addEventListener("online", netStatus);
window.addEventListener("offline", netStatus);
Store.on(type => {
  if (type === "storage-failed") banner("storage", "⚠️ تعذّر حفظ التقدم على هذا الجهاز (قد يكون التصفح الخاص مفعّلاً أو المساحة ممتلئة). يمكنك المتابعة، لكن النجوم قد لا تبقى بعد إغلاق الصفحة.", "warn");
  if (type === "storage-ok") banner("storage", "");
});
if (!Store.healthy) banner("storage", "⚠️ لا يمكن الحفظ على هذا الجهاز (قد يكون التصفح الخاص مفعّلاً). التقدم لن يبقى بعد إغلاق الصفحة.", "warn");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").then(reg => {
    const offer = w => {
      const b = banner("update", `✨ يوجد تحديث جديد للتطبيق. <button class="btn sm" id="doUpdate">تحديث الآن</button>`);
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
