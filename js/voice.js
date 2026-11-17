/* ============================================================
   Voice — نطق بشري مسجّل مسبقاً بدل صوت المتصفح الآلي.
   - كل كلمة وجملة لها ملف MP3 في audio/m (صوت رجالي: Andrew)
     و audio/f (صوت نسائي: Emma)، حسب اختيار «طالب» أو «طالبة».
   - اسم الملف بصمة (hash) للنص، بنفس طريقة أداة التوليد،
     فلا نحتاج قائمة ملفات.
   - إذا لم يوجد ملف لنص ما، يرجع لصوت المتصفح كما كان.
   يُحمَّل بعد js/app.js ويستبدل Speech.say و Speech.stop.
   ============================================================ */
(() => {
  if (typeof Speech === "undefined") return;
  const enc = new TextEncoder();
  const norm = t => String(t).replace(/___/g, " ").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  function fnv(str, basis) {
    let h = basis >>> 0;
    for (const b of enc.encode(str)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, "0");
  }
  const fileId = t => { const k = norm(t).toLowerCase(); return fnv(k, 0x811c9dc5) + fnv(k, 0x050c5d1f); };
  const voiceDir = () => {
    try { const p = Store.profile(); return p && p.gender === "f" ? "f" : "m"; } catch (e) { return "m"; }
  };
  const BASE_RATE = 0.85;           /* سرعة الإعداد الافتراضية تقابل سرعة التسجيل الطبيعية */

  const browserSay = Speech.say, browserStop = Speech.stop;
  let current = null;

  function stop() {
    if (current) { current.pause(); current.src = ""; current = null; }
    browserStop();
  }
  function say(text, slow) {
    if (!norm(text)) return false;
    stop();
    const a = new Audio(`audio/${voiceDir()}/${fileId(text)}.mp3`);
    let rate = 1;
    try { rate = slow ? 0.7 : Math.min(1.5, Math.max(0.5, Store.rate / BASE_RATE)); } catch (e) {}
    a.playbackRate = rate;
    a.preservesPitch = true;
    current = a;
    let fellBack = false;
    const fallback = () => { if (fellBack || current !== a) return; fellBack = true; current = null; browserSay(text, slow); };
    a.onerror = fallback;
    const p = a.play();
    if (p && p.catch) p.catch(err => { if (err && err.name === "NotAllowedError") return; fallback(); });
    return true;
  }

  Speech.say = say;
  Speech.stop = stop;
  Speech.hasEnglish = () => true;
  Speech.supported = true;
  Speech.recorded = true;
  window.Voice = { say, stop, fileId };
})();
