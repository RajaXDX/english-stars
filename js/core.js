/* نجوم الإنجليزي — الأساسيات: تجهيز البيانات، أدوات عامة، الصوت، المؤثرات.
   يُحمَّل بعد data/*.js و js/icons.js و js/store.js */

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
    u.words = u.words.map(w => typeof w === "string" ? w.split("|") : w).map(w => [w[0], w[1], (w[2] && EMOJI_ICON[w[2]]) || ""]);
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
  words:   { n: 1, t: "تعلّم الكلمات",       icon: "cards-outline", d: "بطاقات الكلمات ومعانيها مع النطق" },
  listen:  { n: 2, t: "استمع وراجع النطق",   icon: "headphones", d: "اسمع الكلمة واختر الصحيحة" },
  grammar: { n: 3, t: "القاعدة",             icon: "pencil-ruler", d: "شرح القاعدة وأمثلة مسموعة" },
  wquiz:   { n: 4, t: "تحدي الكلمات",        icon: "bullseye-arrow", d: "صور ومعانٍ واستماع" },
  spell:   { n: 4, t: "التهجئة",             icon: "alphabetical-variant", d: "رتّب الحروف لتكتب الكلمة" },
  gquiz:   { n: 4, t: "تحدي القواعد",        icon: "puzzle", d: "اختر الكلمة المناسبة للفراغ" },
  summary: { n: 5, t: "النتيجة والمراجعة",   icon: "flag-checkered", d: "نجومك وما يحتاج مراجعة" }
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
/* صور الكلمات: أيقونة مرسومة، والألوان بطاقة لون (القيمة تبدأ بـ #) */
function picHtml(w, cls = "") {
  if (!w[2]) return "";
  if (w[2][0] === "#") return `<span class="swatch ${cls}" role="img" aria-label="${esc("بطاقة لون: " + w[1])}" style="--sw:${w[2]}"></span>`;
  return `<span class="pic ${cls}" role="img" aria-label="${esc("صورة: " + w[1])}">${icon(w[2])}</span>`;
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
  if (fresh.length) { toast(`${icon("medal")} شارة جديدة: ${fresh.map(b => b.name).join("، ")}`, 3500); confetti(); }
  updateStars();
}
function updateStars() { $("#totalStars").textContent = Store.profile() ? Store.totalStars() : 0; }
