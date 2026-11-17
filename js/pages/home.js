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
      <div><h1>${hello} ${icon("hand-wave", "wave")}</h1><p class="muted">${g.ar}${g.book ? ` · ${en(g.book)}` : ""}</p></div>
      <a class="btn ghost sm" href="#learn/${g.id}">تغيير الصف</a>
    </header>

    <section class="card continue" style="--c:var(--c${u.c});--t:var(--t${u.c})" aria-labelledby="contTitle">
      <p class="eyebrow">${started ? T("أكمل من حيث توقفت", "أكملي من حيث توقفتِ") : T("ابدأ رحلتك", "ابدئي رحلتك")}</p>
      <h2 id="contTitle"><span class="unum">${esc(u.num)}</span> ${en(u.en)}</h2>
      <p class="muted">${u.ar}</p>
      <div class="next"><span aria-hidden="true">${icon(STEP_META[step].icon)}</span><div><b>${step === "summary" ? "الوحدة مكتملة" : "الخطوة التالية"}:</b> ${STEP_META[step].t}</div></div>
      <div class="bar" role="progressbar" aria-label="تقدم الوحدة" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${stepsDone}"><i style="width:${stepsDone / 6 * 100}%"></i></div>
      <a class="btn primary block" href="#${stepRoute(g, u, step)}">${started ? T("أكمل", "أكملي") : T("ابدأ", "ابدئي")} ←</a>
    </section>

    <div class="grid2">
      <section class="card goal" aria-labelledby="goalT">
        <h2 id="goalT" class="h3">${icon("bullseye-arrow")} هدف اليوم</h2>
        <p>${T("تعلّم", "تعلّمي")} ${d.goalWords} كلمات أو ${T("أكمل", "أكملي")} نشاطاً واحداً</p>
        <div class="bar" role="progressbar" aria-label="كلمات اليوم" aria-valuemin="0" aria-valuemax="${d.goalWords}" aria-valuenow="${Math.min(d.words, d.goalWords)}"><i style="width:${Math.min(100, d.words / d.goalWords * 100)}%"></i></div>
        <p class="small">${d.met ? icon("check-circle") + " " + T("أحسنت! حققت هدف اليوم", "أحسنتِ! حققتِ هدف اليوم") : `${d.words} من ${d.goalWords} كلمات · ${d.acts} ${d.acts === 1 ? "نشاط" : "أنشطة"}`}</p>
      </section>
      <section class="card" aria-labelledby="progT">
        <h2 id="progT" class="h3">${icon("star")} تقدّمك في ${g.ar}</h2>
        <p class="big-num">${gp.stars}<small> / ${gp.max} نجمة</small></p>
        <p class="small muted">${gp.done} من ${gp.total} وحدات مكتملة</p>
      </section>
    </div>

    ${due ? `<a class="card link review-card" href="#review"><span class="ic" aria-hidden="true">${icon("repeat")}</span><div><b>${due} ${due === 1 ? "كلمة" : "كلمات"} للمراجعة اليوم</b><p class="small muted">كلمات أخطأت فيها سابقاً. المراجعة تثبّتها.</p></div><span aria-hidden="true">←</span></a>` : ""}

    <section class="card" aria-labelledby="weekT">
      <h2 id="weekT" class="h3">${icon("calendar-week")} هذا الأسبوع</h2>
      ${weekDots(w)}
      <p class="small">${w.met ? icon("trophy") + " حققت هدف الأسبوع!" : `${w.acts} من ${w.goal} أنشطة نحو هدف الأسبوع`}</p>
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
