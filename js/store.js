/* ============================================================
   Store — كل بيانات الطالب في مكان واحد.
   التخزين الحالي: localStorage على الجهاز فقط.
   لإضافة مزامنة سحابية لاحقاً: استبدل backend.read/backend.write
   بخدمة خلفية (مع بقاء localStorage نسخة احتياطية دون اتصال).
   ============================================================ */
const Store = (() => {
  const KEY = "nujoom-v3";
  const backend = {
    read(){ return localStorage.getItem(KEY); },
    write(json){ localStorage.setItem(KEY, json); }
  };

  const SCORED = ["wquiz", "spell", "gquiz"];
  const STEPS = ["words", "listen", "grammar", "wquiz", "spell", "gquiz"];
  const DAILY_WORDS = 5;
  const WEEKLY_ACTS = 5;

  const pad = n => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  /* الأسبوع الدراسي يبدأ الأحد */
  const weekStart = (d = new Date()) => { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return dayKey(s); };
  const uid = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  let data = { version: 3, active: null, profiles: {}, settings: { rate: 0.85 } };
  let healthy = true;
  const listeners = new Set();

  function blankProfile(extra = {}) {
    return Object.assign({
      id: uid(), name: "", gender: "", grade: "", created: Date.now(),
      last: null,          // {grade, unit, step, at}
      stars: {},           // {"g7-u3": {wquiz: 2, ...}}
      done: {},            // {"g7-u3": {words: 1, listen: 1, ...}}
      learned: {},         // {"g7|u3|apple": 1}
      review: {},          // {"g7|u3|apple": {box, due, misses}}
      days: {},            // {"2026-11-16": {w: n, a: [..], s: n}}
      badges: {},          // {id: timestamp}
      stats: { answers: 0, correct: 0, reviewed: 0, weeksMet: 0 },
      weekMet: ""          // آخر أسبوع تحقق فيه الهدف الأسبوعي
    }, extra);
  }

  function load() {
    let raw = null;
    try { raw = backend.read(); } catch (e) { healthy = false; }
    if (raw) {
      try { const d = JSON.parse(raw); if (d && d.profiles) data = Object.assign(data, d); } catch (e) {}
    } else {
      migrateV2();
    }
    if (!data.settings) data.settings = { rate: 0.85 };
    if (data.active && !data.profiles[data.active]) data.active = Object.keys(data.profiles)[0] || null;
  }

  /* نقل التقدم من النسخة السابقة (nujoom-v2) دون فقد النجوم */
  function migrateV2() {
    try {
      const old = JSON.parse(localStorage.getItem("nujoom-v2") || "null")
               || (() => { const v1 = JSON.parse(localStorage.getItem("nujoom-v1") || "null");
                   if (!v1) return null; const s = {}; for (const k in v1.stars || {}) s["g4-" + k] = v1.stars[k];
                   return { name: v1.name, gender: "f", grade: "g4", stars: s }; })();
      if (!old) return;
      const p = blankProfile({ name: old.name || "", gender: old.gender || "", grade: old.grade || "", stars: old.stars || {} });
      for (const key in p.stars) {                      // من حصل على نجوم في تحدٍ فقد أنهاه
        p.done[key] = p.done[key] || {};
        for (const act in p.stars[key]) p.done[key][act] = 1;
      }
      data.profiles[p.id] = p; data.active = p.id; save();
    } catch (e) {}
  }

  function save() {
    try { backend.write(JSON.stringify(data)); if (!healthy) { healthy = true; emit("storage-ok"); } }
    catch (e) { healthy = false; emit("storage-failed"); }
  }
  function emit(type, payload) { listeners.forEach(fn => { try { fn(type, payload); } catch (e) {} }); }

  const P = () => data.profiles[data.active] || null;
  function today() {
    const p = P(), k = dayKey();
    p.days[k] = p.days[k] || { w: 0, a: [], s: 0 };
    return p.days[k];
  }
  function pruneDays(p) {
    const keys = Object.keys(p.days).sort();
    while (keys.length > 70) delete p.days[keys.shift()];
  }

  /* ---------------- الملفات الشخصية ---------------- */
  function createProfile(fields) {
    const p = blankProfile(fields);
    data.profiles[p.id] = p; data.active = p.id; save(); return p;
  }
  function switchProfile(id) { if (data.profiles[id]) { data.active = id; save(); } }
  function removeProfile(id) {
    delete data.profiles[id];
    if (data.active === id) data.active = Object.keys(data.profiles)[0] || null;
    save();
  }
  function updateProfile(fields) { Object.assign(P(), fields); save(); }

  /* ---------------- التقدم ---------------- */
  /* تُحفظ أفضل نتيجة فقط، فلا تُحتسب النجوم مرتين عند الإعادة */
  function setStars(key, act, n) {
    const p = P(); p.stars[key] = p.stars[key] || {};
    const before = p.stars[key][act] || 0;
    const gained = Math.max(0, n - before);
    if (gained) { p.stars[key][act] = n; today().s += gained; }
    save();
    return { gained, best: Math.max(before, n), before };
  }
  function getStars(key, act) { const p = P(); return (p && p.stars[key] && p.stars[key][act]) || 0; }
  function unitStars(key) { return SCORED.reduce((n, a) => n + getStars(key, a), 0); }
  function totalStars() {
    const p = P(); if (!p) return 0; let t = 0;
    for (const k in p.stars) for (const a in p.stars[k]) t += p.stars[k][a];
    return t;
  }

  /* إنهاء خطوة: يُسجَّل النشاط مرة واحدة في اليوم لكل خطوة */
  function markDone(key, step) {
    const p = P(); p.done[key] = p.done[key] || {};
    const first = !p.done[key][step];
    p.done[key][step] = 1;
    const t = today(), id = key + ":" + step;
    if (!t.a.includes(id)) t.a.push(id);
    checkWeek(p); pruneDays(p); save();
    return first;
  }
  const isDone = (key, step) => { const p = P(); return !!(p && p.done[key] && p.done[key][step]); };
  const unitComplete = key => STEPS.every(s => isDone(key, s));
  const nextStep = key => STEPS.find(s => !isDone(key, s)) || null;

  function setLast(last) { P().last = Object.assign({ at: Date.now() }, last); save(); }

  /* كلمة تعلّمها الطالب (استمع إليها أو أجاب عنها صح) */
  function learnWord(id) {
    const p = P();
    if (p.learned[id]) return false;
    p.learned[id] = 1; today().w += 1; save();
    return true;
  }

  /* ---------------- المراجعة (صناديق لايتنر بسيطة) ---------------- */
  const BOX_DAYS = [0, 1, 3, 7];
  function addMistake(id) {
    const p = P(); const r = p.review[id] || { box: 0, misses: 0 };
    r.box = 0; r.misses += 1; r.due = dayKey(); p.review[id] = r; save();
  }
  function reviewResult(id, correct) {
    const p = P(); const r = p.review[id]; if (!r) return;
    if (correct) {
      r.box += 1; p.stats.reviewed += 1;
      if (r.box >= BOX_DAYS.length) delete p.review[id];
      else { const d = new Date(); d.setDate(d.getDate() + BOX_DAYS[r.box]); r.due = dayKey(d); }
    } else { r.box = 0; r.misses += 1; r.due = dayKey(); }
    save();
  }
  function dueReviews(filter) {
    const p = P(); if (!p) return []; const t = dayKey();
    return Object.keys(p.review).filter(id => p.review[id].due <= t && (!filter || id.startsWith(filter)));
  }
  const allReviews = filter => { const p = P(); return p ? Object.keys(p.review).filter(id => !filter || id.startsWith(filter)) : []; };

  function recordAnswer(correct) { const s = P().stats; s.answers += 1; if (correct) s.correct += 1; }

  /* ---------------- الأهداف ---------------- */
  function daily() {
    const p = P(); const t = (p && p.days[dayKey()]) || { w: 0, a: [], s: 0 };
    return { words: t.w, acts: t.a.length, stars: t.s, goalWords: DAILY_WORDS, met: t.w >= DAILY_WORDS || t.a.length >= 1 };
  }
  function weekly() {
    const p = P(); const start = weekStart(); let acts = 0, stars = 0; const active = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start + "T12:00:00"); d.setDate(d.getDate() + i);
      const k = dayKey(d), v = p && p.days[k];
      active.push(!!(v && (v.w || v.a.length)));
      if (v) { acts += v.a.length; stars += v.s; }
    }
    return { acts, stars, goal: WEEKLY_ACTS, met: acts >= WEEKLY_ACTS, active, todayIndex: new Date().getDay() };
  }
  function checkWeek(p) {
    const w = weekly();
    if (w.met && p.weekMet !== weekStart()) { p.weekMet = weekStart(); p.stats.weeksMet += 1; }
  }

  /* ---------------- الشارات ---------------- */
  const BADGES = [
    { id: "first",   icon: "sprout", name: "البداية",         how: "أكمل أول نشاط",                test: p => Object.keys(p.done).length > 0 },
    { id: "perfect", icon: "bullseye-arrow", name: "ثلاث نجوم",        how: "احصل على 3 نجوم في تحدٍ",      test: p => Object.values(p.stars).some(u => Object.values(u).some(n => n >= 3)) },
    { id: "words25", icon: "bookshelf", name: "جامع الكلمات",     how: "تعلّم 25 كلمة",                test: p => Object.keys(p.learned).length >= 25 },
    { id: "words100",icon: "brain", name: "قاموس صغير",       how: "تعلّم 100 كلمة",               test: p => Object.keys(p.learned).length >= 100 },
    { id: "unit",    icon: "flag-checkered", name: "وحدة كاملة",       how: "أكمل كل خطوات وحدة",           test: p => Object.keys(p.done).some(k => STEPS.every(s => p.done[k][s])) },
    { id: "stars25", icon: "star", name: "25 نجمة",          how: "اجمع 25 نجمة",                 test: () => totalStars() >= 25 },
    { id: "stars100",icon: "star-shooting", name: "100 نجمة",         how: "اجمع 100 نجمة",                test: () => totalStars() >= 100 },
    { id: "review",  icon: "repeat", name: "المراجِع",         how: "أجب صح على 10 كلمات في المراجعة", test: p => p.stats.reviewed >= 10 },
    { id: "days3",   icon: "calendar-check", name: "ثلاثة أيام",       how: "تعلّم في 3 أيام مختلفة",        test: p => Object.values(p.days).filter(d => d.w || d.a.length).length >= 3 },
    { id: "week",    icon: "trophy", name: "هدف الأسبوع",      how: "حقق الهدف الأسبوعي مرة",        test: p => p.stats.weeksMet >= 1 }
  ];
  /* تُرجع الشارات الجديدة فقط */
  function checkBadges() {
    const p = P(); if (!p) return []; const fresh = [];
    for (const b of BADGES) if (!p.badges[b.id] && b.test(p)) { p.badges[b.id] = Date.now(); fresh.push(b); }
    if (fresh.length) save();
    return fresh;
  }

  /* المظهر: auto (حسب الجهاز) | light | dark */
  function applyTheme() {
    const t = data.settings.theme || "auto", r = document.documentElement;
    if (t === "auto") delete r.dataset.theme; else r.dataset.theme = t;
  }
  load();
  applyTheme();
  return {
    SCORED, STEPS, BADGES,
    get data() { return data; }, get healthy() { return healthy; },
    profile: P, profiles: () => Object.values(data.profiles),
    createProfile, switchProfile, removeProfile, updateProfile,
    setStars, getStars, unitStars, totalStars,
    markDone, isDone, unitComplete, nextStep, setLast, learnWord,
    addMistake, reviewResult, dueReviews, allReviews, recordAnswer,
    daily, weekly, checkBadges,
    get rate() { return data.settings.rate; }, setRate(r) { data.settings.rate = r; save(); },
    get theme() { return data.settings.theme || "auto"; }, setTheme(t) { data.settings.theme = t; applyTheme(); save(); },
    on(fn) { listeners.add(fn); }, save, dayKey
  };
})();
