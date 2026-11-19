/* ============================================================
   Narration — تشغيل النطق المسجّل مسبقاً، وصوت الجهاز الإنجليزي بديلاً فقط.
   - speak(text, {slow, meaning, onError}) → Promise<boolean>: تُحل عند انتهاء المقطع فعلاً
     (true)، أو عند الإلغاء/الخطأ (false). لا يُفترض طول ثابت للمقطع.
   - stop(): يوقف أي صوت، ويلغي كل طلب سابق (لا يعود صوت قديم للتشغيل بعد الإلغاء).
   - يتوقف تلقائياً عند إخفاء التبويب أو مغادرة الصفحة.
   - الملف: audio/<m|f>/<id>.mp3 من audio/manifest.js (مفتاح العبارة من NarrationText.key).
   - البديل: صوت إنجليزي من الجهاز (يفضّل en-US). لا يُستخدم صوت عربي لتعليم الإنجليزية أبداً.
   ============================================================ */
(function (root) {
  const NT = root.NarrationText;
  const SLOW_RATE = 0.8;                      // «أبطأ»: نفس التسجيل أبطأ مع حفظ طبقة الصوت
  let player = null;                           // عنصر واحد يُعاد استخدامه (أفضل للجوال)
  let cancelCurrent = null;
  let generation = 0;

  const MSG = {
    tap: "اضغط زر الاستماع لتشغيل الصوت.",
    none: "تعذّر تشغيل الصوت على هذا الجهاز. جرّب متصفحاً آخر مثل Chrome أو Safari.",
    noEnglish: "لا يوجد صوت إنجليزي على هذا الجهاز، والتسجيل غير متاح الآن.",
    retry: "تعذّر تشغيل الصوت. اضغط زر الاستماع للمحاولة مرة أخرى."
  };

  function voiceDir() {
    const sp = root.Speech;
    if (sp && (sp.genderHint === "m" || sp.genderHint === "f")) return sp.genderHint;
    try { const p = root.Store && root.Store.profile(); if (p && (p.gender === "m" || p.gender === "f")) return p.gender; } catch (e) {}
    return "f";
  }

  /* مسار التسجيل لعبارة، مع تفضيل صوت المتعلّم ثم الصوت الآخر إن لم يوجد */
  function clipUrl(text, meaning) {
    const lib = root.NARRATION_AUDIO;
    if (!lib || !lib.clips || !NT) return null;
    const entry = lib.clips[NT.key(text, meaning)];
    if (!entry) return null;
    const v = voiceDir(), ids = typeof entry === "string" ? { m: entry, f: entry } : { m: entry[0], f: entry[1] };
    const dir = ids[v] ? v : (ids.m ? "m" : "f");
    return `audio/${dir}/${ids[dir]}.mp3`;
  }

  function stop() {
    generation++;
    if (cancelCurrent) cancelCurrent();
    try { if (root.speechSynthesis) root.speechSynthesis.cancel(); } catch (e) {}
  }

  /* أفضل صوت إنجليزي في الجهاز (en-US أولاً). يرجع null إذا لا يوجد صوت إنجليزي */
  function pickVoice(voices) {
    const prefer = [/natural|neural|premium|enhanced/i, /Google US English/i, /Samantha|Aria|Jenny|Ava|Emma/i, /Alex|Zira|Guy|Andrew/i];
    const score = v => (/^en[-_]US$/i.test(v.lang) ? 100 : 0) + prefer.reduce((s, re, i) => s + (re.test(v.name) ? 20 - i * 4 : 0), 0);
    return (voices || []).filter(v => /^en(?:[-_]|$)/i.test(v.lang)).sort((a, b) => score(b) - score(a))[0] || null;
  }

  function speak(text, options = {}) {
    stop();
    const request = generation;
    const cleaned = NT ? NT.clean(text) : String(text || "").trim();
    if (!cleaned || !/[a-z]/i.test(cleaned)) return Promise.resolve(false);
    const slow = !!options.slow;
    const onError = options.onError || (m => { if (typeof root.toast === "function") root.toast(m); });

    return new Promise(resolve => {
      let settled = false, usingDevice = false, cleanup = () => {};
      const live = () => !settled && request === generation;
      function finish(ok) {
        if (settled) return;
        settled = true; cleanup(); cancelCurrent = null; resolve(ok);
      }
      function fail(message) { if (!settled && request === generation) onError(message); finish(false); }
      cancelCurrent = () => finish(false);

      /* ---- البديل: صوت الجهاز الإنجليزي ---- */
      function deviceVoice() {
        if (usingDevice || !live()) return;
        usingDevice = true; cleanup(); cleanup = () => {};
        const synth = root.speechSynthesis;
        if (!synth || !root.SpeechSynthesisUtterance) return fail(MSG.none);
        let utter = null, timer = 0, started = false;
        cleanup = () => {
          clearTimeout(timer);
          if (synth.removeEventListener) synth.removeEventListener("voiceschanged", start);
          if (utter) utter.onend = utter.onerror = null;
        };
        function start() {
          if (started || !live()) return;
          const voice = pickVoice(synth.getVoices());
          if (!voice) return;                                   // ننتظر وصول الأصوات
          started = true; clearTimeout(timer);
          if (synth.removeEventListener) synth.removeEventListener("voiceschanged", start);
          utter = new root.SpeechSynthesisUtterance(NT ? NT.spoken(text) : cleaned);
          utter.voice = voice; utter.lang = voice.lang;
          utter.rate = slow ? 0.72 : 0.9; utter.pitch = 1;
          utter.onend = () => finish(true);
          utter.onerror = () => fail(MSG.retry);
          timer = setTimeout(() => { try { synth.cancel(); } catch (e) {} fail(MSG.retry); }, Math.max(15000, cleaned.length * 160));
          try { if (synth.resume) synth.resume(); synth.speak(utter); } catch (e) { fail(MSG.retry); }
        }
        if (synth.addEventListener) synth.addEventListener("voiceschanged", start);
        timer = setTimeout(() => fail(MSG.noEnglish), 1800);   // الأصوات قد تصل متأخرة
        start();
      }

      /* ---- التسجيل المسبق ---- */
      const url = clipUrl(text, options.meaning);
      if (!url || !root.Audio) return deviceVoice();
      try {
        player = player || new root.Audio();
        player.preload = "auto";
        player.src = url;
        player.playbackRate = slow ? SLOW_RATE : 1;
        player.defaultPlaybackRate = player.playbackRate;
        player.preservesPitch = player.mozPreservesPitch = player.webkitPreservesPitch = true;
        let watchdog = setTimeout(deviceVoice, 12000);           // ملف لا يبدأ ولا ينتهي → البديل
        const onMeta = () => {                                    // بعد معرفة الطول: مهلة تناسب المقطع
          clearTimeout(watchdog);
          const d = isFinite(player.duration) ? player.duration : 10;
          watchdog = setTimeout(deviceVoice, d / player.playbackRate * 1000 + 6000);
        };
        cleanup = () => {
          clearTimeout(watchdog);
          player.onended = player.onerror = null;
          player.removeEventListener && player.removeEventListener("loadedmetadata", onMeta);
          try { player.pause(); } catch (e) {}
        };
        player.addEventListener && player.addEventListener("loadedmetadata", onMeta);
        player.onended = () => finish(true);
        player.onerror = () => deviceVoice();
        const pending = player.play();
        if (pending && pending.catch) pending.catch(err => {
          if (!live()) return;
          if (err && err.name === "NotAllowedError") fail(MSG.tap);   // سياسة التشغيل التلقائي
          else if (err && err.name === "AbortError") return;
          else deviceVoice();
        });
      } catch (e) { deviceVoice(); }
    });
  }

  /* أوقف الصوت عند إخفاء التبويب أو مغادرة الصفحة */
  if (root.document && root.addEventListener) {
    root.document.addEventListener("visibilitychange", () => { if (root.document.hidden) stop(); });
    root.addEventListener("pagehide", stop);
  }

  root.Narration = { speak, stop, clipUrl, pickVoice, SLOW_RATE };
})(typeof globalThis !== "undefined" ? globalThis : this);
