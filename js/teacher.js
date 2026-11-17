/* ============================================================
   صفحة المعلمين — مستقلة عن تطبيق الطلاب (لا حساب ولا تقدم).
   - الرئيسية: اختيار المرحلة والصف ثم الوحدة.
   - دليل الوحدة: كل الكلمات بالأيقونة والمعنى والنطق، شرح القواعد،
     وأسئلة القواعد مع الإجابات. قابل للطباعة.
   - العرض في الفصل: شرائح بملء الشاشة (كلمات، قواعد، مسابقة للفصل)
     مع إظهار المعنى/الإجابة، والتنقل بالأسهم ولوحة المفاتيح.
   المسارات: #  ·  #g/<grade>  ·  #u/<grade>/<unit>  ·  #show/<grade>/<unit>/<all|words|grammar|quiz>
   ============================================================ */
(() => {
  const STAGES = [
    { id: "p", ar: "المرحلة الابتدائية", short: "الابتدائي" },
    { id: "m", ar: "المرحلة المتوسطة", short: "المتوسط" },
    { id: "s", ar: "المرحلة الثانوية", short: "الثانوي" }
  ];
  GRADES.sort((a, b) => a.n - b.n);
  GRADES.forEach(g => g.units.forEach((u, i) => {
    u.c = (i % 5) + 1;
    u.words = u.words.map(w => typeof w === "string" ? w.split("|") : w).map(w => [w[0], w[1], (w[2] && EMOJI_ICON[w[2]]) || ""]);
    u.quiz = u.quiz.map(q => typeof q === "string" ? q.split("|") : q);
  }));
  const gradeById = id => GRADES.find(g => g.id === id);
  const shortNum = g => g.n <= 6 ? g.n : g.n <= 9 ? g.n - 6 : g.n - 9;
  const $ = s => document.querySelector(s);
  const app = $("#t-app");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const en = (t, cls = "") => `<span class="en ${cls}" lang="en" dir="ltr">${esc(t)}</span>`;
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pic = (w, cls = "") => !w[2] ? "" : w[2][0] === "#"
    ? `<span class="swatch ${cls}" role="img" aria-label="${esc("لون: " + w[1])}" style="--sw:${w[2]}"></span>`
    : `<span class="pic ${cls}" role="img" aria-label="${esc("صورة: " + w[1])}">${icon(w[2])}</span>`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem("t-" + k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("t-" + k, v); } catch (e) {} }
  };

  /* ---------- النطق: الصوت المسجّل إن وُجد، وإلا صوت المتصفح ---------- */
  const enc = new TextEncoder();
  const norm = t => String(t).replace(/___/g, " ").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  const fnv = (str, basis) => { let h = basis >>> 0; for (const b of enc.encode(str)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); };
  const fileId = t => { const k = norm(t).toLowerCase(); return fnv(k, 0x811c9dc5) + fnv(k, 0x050c5d1f); };
  let current = null;
  function stopSay() {
    if (current) { current.pause(); current.src = ""; current = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }
  function browserSay(text, slow) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(norm(text));
    u.lang = "en-US"; u.rate = slow ? 0.6 : 0.85;
    const v = speechSynthesis.getVoices().find(x => /^en[-_]US/i.test(x.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  function say(text, slow) {
    if (!norm(text)) return;
    stopSay();
    const a = new Audio(`audio/${store.get("voice", "m")}/${fileId(text)}.mp3`);
    a.playbackRate = slow ? 0.75 : 1; a.preservesPitch = true;
    current = a;
    let fell = false;
    const fallback = () => { if (fell || current !== a) return; fell = true; current = null; browserSay(text, slow); };
    a.onerror = fallback;
    const p = a.play(); if (p && p.catch) p.catch(err => { if (!err || err.name !== "NotAllowedError") fallback(); });
  }
  const sayBtn = (text, label = "استماع") => `<button class="say" type="button" data-say="${esc(text)}" aria-label="${label}: ${esc(text)}">${icon("volume-high")}</button>`;
  function wireSay(root) { root.querySelectorAll("[data-say]").forEach(b => b.onclick = e => { e.stopPropagation(); say(b.dataset.say); }); }

  function setStage(st) { if (st) document.documentElement.dataset.stage = st; else delete document.documentElement.dataset.stage; }
  function chrome(title, back) {
    $("#tTitle").textContent = title;
    const b = $("#tBack"); b.hidden = !back; b.onclick = back ? () => { location.hash = back; } : null;
    document.title = `${title} · نجوم الإنجليزي`;
  }
  $("#tBack").innerHTML = icon("chevron-right");
  $("#tLogo").innerHTML = icon("human-male-board");

  /* ---------- الرئيسية ---------- */
  function renderHome(stageId) {
    const st = stageId || store.get("stage", "p");
    store.set("stage", st);
    setStage(st);
    chrome("صفحة المعلمين", null);
    app.innerHTML = `<div class="stack">
      <section class="t-hero">
        <span class="t-hero-ic">${icon("human-male-board")}</span>
        <div><h1>صفحة المعلمين</h1>
        <p class="muted">أدوات جاهزة لدرس الإنجليزي من الأول الابتدائي إلى الثالث الثانوي، مبنية على كتب المنهج الرسمية.</p></div>
      </section>
      <div class="t-feats">
        <div class="card"><span class="ic">${icon("presentation")}</span><div><b>العرض في الفصل</b><p class="small muted">شرائح بملء الشاشة للكلمات والقواعد، ومسابقة للفصل كله مع إظهار الإجابة.</p></div></div>
        <div class="card"><span class="ic">${icon("book-education")}</span><div><b>دليل الوحدة</b><p class="small muted">كل كلمات الوحدة بالمعنى والنطق، وشرح القواعد، والأسئلة مع الإجابات. قابل للطباعة.</p></div></div>
      </div>
      <div class="seg wide" role="group" aria-label="المرحلة">${STAGES.map(s => `<button type="button" data-stage="${s.id}" aria-pressed="${s.id === st}">${s.short}</button>`).join("")}</div>
      <div class="t-grades">${GRADES.filter(g => g.stage === st).map((g, i) => `<a class="gtile" href="#g/${g.id}" style="--c:var(--c${(i % 5) + 1});--t:var(--t${(i % 5) + 1})"><b>${shortNum(g)}</b><span>${g.ar}</span>${g.book ? `<small>${esc(g.book)}</small>` : ""}<small class="muted">${g.units.length} وحدات</small></a>`).join("")}</div>
      <section class="card t-voice">
        <h2 class="h3">${icon("volume-high")} صوت النطق</h2>
        <div class="seg" role="group" aria-label="صوت النطق">
          <button type="button" data-voice="m" aria-pressed="${store.get("voice", "m") === "m"}">صوت رجالي</button>
          <button type="button" data-voice="f" aria-pressed="${store.get("voice", "m") === "f"}">صوت نسائي</button>
        </div>
        <button class="btn ghost sm" type="button" id="tryVoice">${icon("play")} تجربة</button>
      </section>
    </div>`;
    app.querySelectorAll("[data-stage]").forEach(b => b.onclick = () => renderHome(b.dataset.stage));
    app.querySelectorAll("[data-voice]").forEach(b => b.onclick = () => { store.set("voice", b.dataset.voice); renderHome(st); });
    $("#tryVoice").onclick = () => say("Welcome to English class!");
  }

  /* ---------- وحدات الصف ---------- */
  function renderGrade(g) {
    setStage(g.stage);
    store.set("stage", g.stage);
    chrome(g.ar, "");
    const parts = [...new Set(g.units.map(u => u.part || 0))];
    const partName = x => x === 1 ? "الجزء الأول" : x === 2 ? "الجزء الثاني" : "";
    app.innerHTML = `<div class="stack">
      <section class="card grade-head" style="--c:var(--c5);--t:var(--t5)"><div><h1 class="h2">${g.ar}</h1><p class="muted small">${g.book ? `كتاب ${en(g.book)} · ` : ""}${g.units.length} وحدات</p></div></section>
      ${parts.map(x => `${partName(x) ? `<h2 class="part">${partName(x)}</h2>` : ""}
        <ul class="t-units">${g.units.filter(u => (u.part || 0) === x).map(u => `<li class="t-urow" style="--c:var(--c${u.c});--t:var(--t${u.c})">
          <span class="unum">${esc(u.num)}</span>
          <div class="body"><span class="en t" lang="en" dir="ltr">${esc(u.en)}</span><span class="small">${u.ar}</span><span class="small muted">${u.words.length} كلمة · ${u.quiz.length} أسئلة قواعد</span></div>
          <div class="acts"><a class="btn sm" href="#show/${g.id}/${u.id}/all">${icon("presentation")} عرض</a><a class="btn ghost sm" href="#u/${g.id}/${u.id}">${icon("book-education")} الدليل</a></div>
        </li>`).join("")}</ul>`).join("")}
    </div>`;
  }

  /* ---------- دليل الوحدة ---------- */
  function renderGuide(g, u) {
    setStage(g.stage);
    chrome(`${u.en}`, `g/${g.id}`);
    const hideAr = store.get("hideAr", "0") === "1";
    app.innerHTML = `<div class="stack t-guide${hideAr ? " hide-ar" : ""}" style="--c:var(--c${u.c});--t:var(--t${u.c})">
      <header class="uhead"><span class="unum lg">${esc(u.num)}</span><div><h1 lang="en" dir="ltr">${esc(u.en)}</h1><p>${u.ar}</p><p class="small muted">${g.ar}${g.book ? ` · ${en(g.book)}` : ""}</p></div></header>
      <div class="toolbar t-tools">
        <a class="btn" href="#show/${g.id}/${u.id}/all">${icon("presentation")} العرض الكامل</a>
        <a class="btn ghost sm" href="#show/${g.id}/${u.id}/words">${icon("cards-outline")} الكلمات فقط</a>
        <a class="btn ghost sm" href="#show/${g.id}/${u.id}/grammar">${icon("pencil-ruler")} القواعد فقط</a>
        <a class="btn ghost sm" href="#show/${g.id}/${u.id}/quiz">${icon("trophy")} مسابقة الفصل</a>
        <button class="btn ghost sm" type="button" id="togAr">${icon(hideAr ? "eye" : "eye-off")} ${hideAr ? "إظهار" : "إخفاء"} المعاني</button>
        <button class="btn ghost sm" type="button" id="doPrint">${icon("printer")} طباعة</button>
      </div>

      <section class="card" aria-labelledby="wT">
        <h2 id="wT" class="h3">${icon("cards-outline")} كلمات الوحدة <small class="muted">(${u.words.length})</small></h2>
        <div class="tablewrap"><table class="t-words">
          <thead><tr><th>#</th><th>صورة</th><th>الكلمة</th><th>المعنى</th><th class="np">نطق</th></tr></thead>
          <tbody>${u.words.map((w, i) => `<tr><td class="n">${i + 1}</td><td>${pic(w, "sm")}</td><td>${en(w[0], "w")}</td><td class="ar">${w[1]}</td><td class="np">${sayBtn(w[0])}</td></tr>`).join("")}</tbody>
        </table></div>
      </section>

      <section class="card" aria-labelledby="gT">
        <h2 id="gT" class="h3">${icon("pencil-ruler")} القواعد</h2>
        ${u.grammar.map(gr => grammarHtml(gr)).join("")}
      </section>

      <section class="card" aria-labelledby="qT">
        <h2 id="qT" class="h3">${icon("puzzle")} أسئلة القواعد والإجابات <small class="muted">(${u.quiz.length})</small></h2>
        <ol class="t-quiz">${u.quiz.map(q => { const [s, right, ...wrong] = q; const parts = s.split("___");
          return `<li><p class="en" lang="en" dir="ltr">${esc(parts[0])}<b class="ans">${esc(right)}</b>${esc(parts[1] || "")}</p>
            <p class="small muted">الخيارات: ${shuffle([right, ...wrong]).map(o => en(o, o === right ? "ok" : "")).join(" · ")}</p></li>`; }).join("")}</ol>
      </section>
    </div>`;
    wireSay(app);
    $("#togAr").onclick = () => { store.set("hideAr", hideAr ? "0" : "1"); renderGuide(g, u); };
    $("#doPrint").onclick = () => window.print();
  }
  function grammarHtml(gr) {
    const t = gr.table;
    return `<article class="t-gblock"><h3>${gr.t}</h3><p>${gr.p}</p>
      ${t ? `<div class="tablewrap"><table><thead><tr>${t.head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((c, i) => `<td${(t.en || []).includes(i) ? ' class="en" lang="en" dir="ltr"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      <ul class="examples">${gr.ex.map(x => `<li>${sayBtn(x[0])}${en(x[0])}<span class="tr">${x[1]}</span></li>`).join("")}</ul></article>`;
  }

  /* ---------- العرض في الفصل ---------- */
  const show = { slides: [], i: 0, revealed: false, back: "" };
  function buildSlides(g, u, mode) {
    const S = [];
    S.push({ type: "title", g, u, mode });
    if (mode === "all" || mode === "words") {
      S.push({ type: "section", t: "الكلمات", sub: `${u.words.length} كلمة`, ic: "cards-outline" });
      u.words.forEach((w, i) => S.push({ type: "word", w, i, n: u.words.length }));
    }
    if (mode === "all" || mode === "grammar") {
      S.push({ type: "section", t: "القواعد", sub: u.grammar.map(x => x.t.replace(/<[^>]+>/g, "")).join(" · "), ic: "pencil-ruler" });
      u.grammar.forEach(gr => S.push({ type: "grammar", gr }));
    }
    if (mode === "all" || mode === "quiz") {
      S.push({ type: "section", t: "مسابقة الفصل", sub: `${u.quiz.length} أسئلة. اقرأ السؤال، وبعد ما يجاوب الطلاب اضغط «إظهار الإجابة».`, ic: "trophy" });
      shuffle(u.quiz).forEach((q, i) => S.push({ type: "quiz", q, opts: shuffle(q.slice(1)), i, n: u.quiz.length }));
    }
    S.push({ type: "end", g, u });
    return S;
  }
  function openShow(g, u, mode) {
    setStage(g.stage);
    show.slides = buildSlides(g, u, mode); show.i = 0; show.revealed = false; show.back = `u/${g.id}/${u.id}`;
    const el = $("#show");
    el.style.setProperty("--c", `var(--c${u.c})`); el.style.setProperty("--t", `var(--t${u.c})`);
    $("#showTitle").innerHTML = `${en(u.en)} · ${g.ar}`;
    el.hidden = false; document.body.classList.add("showing");
    paint();
    $("#showNext").focus();
  }
  function closeShow() {
    stopSay();
    $("#show").hidden = true; document.body.classList.remove("showing");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    location.hash = show.back;
  }
  function needsReveal(s) { return s.type === "word" || s.type === "quiz"; }
  function paint() {
    const s = show.slides[show.i], box = $("#slide");
    $("#showCount").textContent = `${show.i + 1} / ${show.slides.length}`;
    $("#showProg").style.width = `${(show.i + 1) / show.slides.length * 100}%`;
    $("#showPrev").disabled = show.i === 0;
    $("#showNext").innerHTML = show.i === show.slides.length - 1 ? `${icon("close")} إنهاء` : `التالي ${icon("chevron-left")}`;
    const rv = $("#showReveal");
    rv.hidden = !needsReveal(s) || show.revealed;
    rv.innerHTML = s.type === "quiz" ? `${icon("eye")} إظهار الإجابة` : `${icon("translate")} إظهار المعنى`;
    box.className = `slide s-${s.type}${show.revealed ? " revealed" : ""}`;
    if (s.type === "title") {
      box.innerHTML = `<span class="unum xl">${esc(s.u.num)}</span><h2 lang="en" dir="ltr">${esc(s.u.en)}</h2><p class="ar-big">${s.u.ar}</p>
        <p class="muted">${s.g.ar}${s.g.book ? ` · ${en(s.g.book)}` : ""}</p>
        <p class="hint">${icon("lightbulb-on")} استخدم الأسهم للتنقل، والمسافة لإظهار المعنى أو الإجابة، وحرف F لملء الشاشة.</p>`;
    } else if (s.type === "section") {
      box.innerHTML = `<span class="sec-ic">${icon(s.ic)}</span><h2>${s.t}</h2><p class="muted">${esc(s.sub)}</p>`;
    } else if (s.type === "word") {
      const w = s.w;
      box.innerHTML = `<p class="muted small">كلمة ${s.i + 1} من ${s.n}</p>
        ${w[2] ? `<div class="w-pic">${pic(w, "xxl")}</div>` : ""}
        <h2 class="w-en" lang="en" dir="ltr">${esc(w[0])}</h2>
        <div class="w-say">${sayBtn(w[0])}<button class="say slow" type="button" data-slow="${esc(w[0])}" aria-label="نطق بطيء">${icon("timer-sand") || "½"}</button></div>
        <p class="w-ar">${show.revealed ? w[1] : `<span class="masked">إظهار المعنى</span>`}</p>`;
      box.querySelector("[data-slow]").onclick = e => { e.stopPropagation(); say(w[0], true); };
      const m = box.querySelector(".masked"); if (m) m.onclick = reveal;
    } else if (s.type === "grammar") {
      box.innerHTML = grammarHtml(s.gr);
    } else if (s.type === "quiz") {
      const [sent, right] = s.q, parts = sent.split("___");
      box.innerHTML = `<p class="muted small">سؤال ${s.i + 1} من ${s.n}</p>
        <h2 class="q-sent" lang="en" dir="ltr">${esc(parts[0])}<span class="blank">${show.revealed ? esc(right) : "&nbsp;"}</span>${esc(parts[1] || "")}</h2>
        <ol class="q-opts">${s.opts.map((o, k) => `<li class="${show.revealed ? (o === right ? "right" : "dim") : ""}"><span class="key">${"ABC"[k]}</span>${en(o)}</li>`).join("")}</ol>`;
    } else if (s.type === "end") {
      box.innerHTML = `<span class="sec-ic">${icon("party-popper")}</span><h2>انتهى العرض</h2><p class="muted">${esc(s.u.en)} · ${s.u.ar}</p>
        <div class="actions tight"><button class="btn ghost" type="button" id="again">${icon("repeat")} من البداية</button><button class="btn" type="button" id="endClose">${icon("close")} إغلاق</button></div>`;
      $("#again").onclick = () => { show.i = 0; show.revealed = false; paint(); };
      $("#endClose").onclick = closeShow;
    }
    wireSay(box);
    if (s.type === "word") say(s.w[0]);
  }
  function reveal() {
    const s = show.slides[show.i];
    if (!needsReveal(s) || show.revealed) return false;
    show.revealed = true; paint();
    if (s.type === "quiz") say(s.q[0].replace("___", s.q[1]));
    return true;
  }
  function go(d) {
    const n = show.i + d;
    if (n < 0) return;
    if (n >= show.slides.length) return closeShow();
    show.i = n; show.revealed = false; paint();
  }
  function toggleFull() {
    const el = $("#show");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }
  $("#showPrev").innerHTML = `${icon("chevron-right")} السابق`;
  $("#showPrev").onclick = () => go(-1);
  $("#showNext").onclick = () => go(1);
  $("#showReveal").onclick = reveal;
  $("#showClose").innerHTML = icon("close"); $("#showClose").onclick = closeShow;
  $("#showFull").innerHTML = icon("fullscreen"); $("#showFull").onclick = toggleFull;
  document.addEventListener("fullscreenchange", () => { $("#showFull").innerHTML = icon(document.fullscreenElement ? "fullscreen-exit" : "fullscreen"); });
  document.addEventListener("keydown", e => {
    if ($("#show").hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowLeft" || e.key === "PageDown") { e.preventDefault(); go(1); }          /* الاتجاه من اليمين لليسار: اليسار = التالي */
    else if (e.key === "ArrowRight" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    else if (e.key === " " || e.key === "Enter") { if (e.target.closest("button, a") && e.key === "Enter") return; e.preventDefault(); if (!reveal()) go(1); }
    else if (e.key === "f" || e.key === "F") toggleFull();
    else if (e.key === "Escape" && !document.fullscreenElement) closeShow();
  });

  /* ---------- التوجيه ---------- */
  function route() {
    stopSay();
    const parts = decodeURIComponent((location.hash || "").slice(1)).split("/");
    const g = gradeById(parts[1]), u = g && g.units.find(x => x.id === parts[2]);
    if (parts[0] !== "show" && !$("#show").hidden) { $("#show").hidden = true; document.body.classList.remove("showing"); }
    if (parts[0] === "g" && g) renderGrade(g);
    else if (parts[0] === "u" && u) renderGuide(g, u);
    else if (parts[0] === "show" && u) { if (!document.querySelector(".t-guide")) renderGuide(g, u); openShow(g, u, ["words", "grammar", "quiz"].includes(parts[3]) ? parts[3] : "all"); }
    else renderHome();
    if (parts[0] !== "show") { window.scrollTo({ top: 0 }); app.focus({ preventScroll: true }); }
  }
  window.addEventListener("hashchange", route);
  route();
})();
