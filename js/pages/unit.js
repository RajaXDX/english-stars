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
      <span class="ic" aria-hidden="true">${done ? ICON.check : icon(m.icon)}</span>
      <span class="body"><b>${m.t}</b><span class="small muted">${m.d}</span></span>
      <span class="end">${scored ? starsHtml(Store.getStars(u.key, step), 3) : ""}${step === next ? `<span class="pill">${T("التالي", "التالي")}</span>` : done ? '<span class="sr">منجزة</span>' : ""}</span></a></li>`;
  };
  app.innerHTML = `<div class="stack" style="--c:var(--c${u.c});--t:var(--t${u.c})">
    <header class="uhead"><span class="unum lg">${esc(u.num)}</span><div><h1>${en(u.en)}</h1><p>${u.ar}</p><p class="small muted">${u.words.length} كلمة${lessonsOf(u).length > 1 ? ` في ${lessonsOf(u).length} دروس` : ""} · ${starsHtml(Store.unitStars(u.key), 9)}</p></div></header>
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

/* ---- الخطوة 1: الكلمات ----
   الوحدات الطويلة تُقسَّم إلى دروس صغيرة (حوالي 12 كلمة) يظهر واحد منها في كل مرة. */
const LESSON_SIZE = 12;
function lessonsOf(u) {
  const n = u.words.length;
  if (n <= LESSON_SIZE + 4) return [[0, n]];
  const count = Math.ceil(n / LESSON_SIZE), size = Math.ceil(n / count);   // دروس متقاربة الحجم
  return Array.from({ length: count }, (_, k) => [k * size, Math.min(n, (k + 1) * size)]).filter(([a, b]) => b > a);
}
const lessonMemo = {};      // آخر درس فُتح في كل وحدة (لهذه الجلسة)
function stepWords(g, u, shell) {
  const lessons = lessonsOf(u), multi = lessons.length > 1;
  const learned = i => { const p = Store.profile(); return !!(p && p.learned && p.learned[wordId(g, u, u.words[i])]); };
  const heard = new Set();
  let cur = Math.min(lessonMemo[u.key] || 0, lessons.length - 1);
  let timer = null, hideAr = false;
  const label = T("اسمع", "اسمعي") + (multi ? " الدرس" : " الكل");
  function stopAll() { if (timer) { clearTimeout(timer); timer = null; } Speech.stop(); }

  function draw() {
    lessonMemo[u.key] = cur;
    const [a, b] = lessons[cur], last = cur === lessons.length - 1;
    const lessonDone = ([x, y]) => { for (let i = x; i < y; i++) if (!heard.has(i) && !learned(i)) return false; return true; };
    app.innerHTML = shell(`
      <h1 class="h2">${icon("cards-outline")} تعلّم الكلمات</h1>
      <p class="muted">${T("اضغط", "اضغطي")} على البطاقة ${T("لتسمع", "لتسمعي")} الكلمة، وزر السلحفاة للنطق البطيء.${multi ? ` كلمات هذه الوحدة مقسّمة على ${lessons.length} دروس.` : ""}</p>
      ${multi ? `<nav class="lessons" aria-label="دروس الوحدة"><ol>${lessons.map((L, k) =>
        `<li><button type="button" data-l="${k}" aria-current="${k === cur ? "step" : "false"}" class="${lessonDone(L) ? "done" : ""}"><b>الدرس ${k + 1}</b><small>${L[1] - L[0]} كلمة${lessonDone(L) ? " ✓" : ""}</small></button></li>`).join("")}</ol></nav>` : ""}
      <div class="toolbar"><button class="btn ghost sm" id="toggleAr" aria-pressed="${hideAr}">${hideAr ? "إظهار المعنى" : "إخفاء المعنى"}</button><button class="btn sm" id="playAll">${label}</button>
        <span class="small muted" id="heard" aria-live="polite"></span></div>
      <ul class="cards ${hideAr ? "hide-ar" : ""}" id="cards">${u.words.slice(a, b).map((w, j) => `<li class="card wcard ${w[2] ? "" : "noe"}">
        <button class="wbtn" data-i="${a + j}" aria-label="${esc(w[0])}، ${esc(w[1])}. اضغط للاستماع">${picHtml(w)}<span class="en w" lang="en" dir="ltr">${esc(w[0])}</span><span class="m">${w[1]}</span></button>
        <button class="say slow mini" data-say="${esc(w[0])}" data-slow="1" aria-label="نطق بطيء: ${esc(w[0])}">${ICON.slow}</button></li>`).join("")}</ul>
      ${!Speech.supported ? `<p class="note">الصوت غير متاح في هذا المتصفح، لكن ${T("تقدر", "تقدرين")} ${T("تتعلم", "تتعلمين")} الكلمات ومعانيها.</p>` : ""}
      <div class="actions">
        ${cur > 0 ? `<button class="btn ghost" id="prevL">→ الدرس ${cur}</button>` : `<a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a>`}
        ${last ? `<button class="btn primary" id="doneWords">${T("أنهيت الكلمات", "أنهيتُ الكلمات")} ← التالي</button>`
               : `<button class="btn primary" id="nextL">الدرس ${cur + 2} ←</button>`}
      </div>`);
    const cards = $("#cards");
    const paintHeard = () => { $("#heard").textContent = `${T("سمعت", "سمعتِ")} ${heard.size} من ${u.words.length}`; };
    const mark = i => {
      heard.add(i); Store.learnWord(wordId(g, u, u.words[i])); paintHeard();
      if (heard.size === u.words.length && Store.markDone(u.key, "words")) toast(icon("check-circle") + " أنهيت خطوة الكلمات");
    };
    if (heard.size) paintHeard();
    cards.querySelectorAll(".wbtn").forEach(btn => btn.onclick = () => {
      cards.querySelectorAll(".playing").forEach(x => x.classList.remove("playing"));
      btn.parentElement.classList.add("playing"); Speech.say(u.words[btn.dataset.i][0]); mark(+btn.dataset.i);
    });
    wireSay(cards);
    $("#toggleAr").onclick = e => { hideAr = cards.classList.toggle("hide-ar"); e.currentTarget.textContent = hideAr ? "إظهار المعنى" : "إخفاء المعنى"; e.currentTarget.setAttribute("aria-pressed", hideAr); };
    $("#playAll").onclick = e => {
      const btn = e.currentTarget;
      if (timer) { stopAll(); btn.textContent = label; return; }
      btn.textContent = "إيقاف"; let i = a;
      const step = () => {
        const els = cards.querySelectorAll(".wcard"); els.forEach(x => x.classList.remove("playing"));
        if (i >= b || !document.body.contains(cards)) { timer = null; btn.textContent = label; return; }
        const el = els[i - a]; el.classList.add("playing"); el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        Speech.say(u.words[i][0]); mark(i); i++; timer = setTimeout(step, 1800);
      };
      step();
    };
    const goLesson = k => { stopAll(); cur = k; draw(); };
    app.querySelectorAll("[data-l]").forEach(x => x.onclick = () => goLesson(+x.dataset.l));
    const pv = $("#prevL"); if (pv) pv.onclick = () => goLesson(cur - 1);
    const nx = $("#nextL"); if (nx) nx.onclick = () => goLesson(cur + 1);
    const dn = $("#doneWords");
    if (dn) dn.onclick = () => { Store.markDone(u.key, "words"); celebrateBadges(); go(stepRoute(g, u, "listen")); };
    focusMain();
  }
  draw();
}

/* ---- الخطوة 3: القاعدة ---- */
function stepGrammar(g, u, shell) {
  app.innerHTML = shell(`<h1 class="h2">${icon("pencil-ruler")} القاعدة</h1>${u.grammar.map(gr => {
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
  const rows = Store.SCORED.map(s => `<li><a href="#${stepRoute(g, u, s)}"><span class="ilabel">${icon(STEP_META[s].icon)} ${STEP_META[s].t}</span>${Store.isDone(u.key, s) ? starsHtml(Store.getStars(u.key, s), 3) : `<span class="small muted">لم ${T("تبدأه", "تبدئيه")} بعد</span>`}</a></li>`).join("");
  app.innerHTML = shell(`<h1 class="h2">${icon("flag-checkered")} النتيجة والمراجعة</h1>
    <section class="card center"><p class="big-num">${total}<small> / 9 نجوم</small></p>${starsHtml(total, 9)}
      <p>${Store.unitComplete(u.key) ? icon("party-popper") + " " + T("أكملت كل خطوات الوحدة!", "أكملتِ كل خطوات الوحدة!") : `${T("أنجزت", "أنجزتِ")} ${Store.STEPS.filter(s => Store.isDone(u.key, s)).length} من 6 خطوات`}</p></section>
    <section class="card"><h2 class="h3">نتائج التحديات</h2><ul class="list">${rows}</ul></section>
    <section class="card"><h2 class="h3">كلمات تحتاج مراجعة</h2>
      ${weak.length ? `<ul class="weak">${weak.map(x => `<li>${sayButtons(x.w[0])}${en(x.w[0])}<span class="tr">${x.w[1]}</span></li>`).join("")}</ul>
      <a class="btn primary block" href="#review/${encodeURIComponent(g.id + "|" + u.id)}">${T("راجع", "راجعي")} هذه الكلمات (${weak.length})</a>`
      : `<p class="muted">لا توجد كلمات تحتاج مراجعة في هذه الوحدة. ممتاز!</p>`}</section>
    <div class="actions"><a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a>${nextU ? `<a class="btn primary" href="#u/${g.id}/${nextU.id}">الوحدة التالية ←</a>` : `<a class="btn primary" href="#big/${g.id}">التحدي الكبير ←</a>`}</div>`);
  wireSay(app);
  focusMain();
}
