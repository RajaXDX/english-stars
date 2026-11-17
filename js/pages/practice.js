/* ============================================================
   التحدي الكبير والمراجعة
   ============================================================ */
function renderBig(g, token) {
  chrome({ title: "التحدي الكبير", back: "challenges", tab: "challenges" });
  app.innerHTML = `<div class="stack"><div id="pane"></div></div>`;
  const items = g.units.flatMap(u => u.words.map(w => ({ g, u, w })));
  runQuiz($("#pane"), token, {
    title: `التحدي الكبير: ${g.ar}`, intro: `15 سؤالاً من كلمات كل الوحدات.`,
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
    $("#pane").innerHTML = `<section class="card center"><h1 class="h2">${icon("repeat")} المراجعة</h1>
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
    title: "مراجعة الكلمات", intro: `كلمات أخطأت فيها سابقاً. كل إجابة صحيحة تؤجّل الكلمة لموعد مراجعة لاحق، وبعد عدة مرات صحيحة تخرج من القائمة.`,
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
    <a class="card link review-card" href="#review"><span class="ic" aria-hidden="true">${icon("repeat")}</span><div><b>مراجعة الكلمات</b><p class="small muted">${due ? `${due} ${due === 1 ? "كلمة مستحقة" : "كلمات مستحقة"} اليوم` : allR ? "لا شيء مستحق اليوم" : "تظهر هنا الكلمات التي تخطئ فيها"}</p></div><span aria-hidden="true">←</span></a>
    <a class="card link" href="#big/${g.id}"><span class="ic" aria-hidden="true">${icon("trophy")}</span><div><b>التحدي الكبير: ${g.ar}</b><p class="small muted">15 سؤالاً من كل الوحدات</p></div>${starsHtml(Store.getStars(g.id + "-all", "wquiz"), 3)}</a>
    <section><h2 class="h3">تحديات ${T("تنتظرك", "تنتظرك")} في ${g.ar}</h2>
      <ul class="list cards-list">${pending.slice(0, 8).map(({ u, s }) => `<li><a class="card link" href="#${stepRoute(g, u, s)}" style="--c:var(--c${u.c});--t:var(--t${u.c})"><span class="unum">${esc(u.num)}</span><div><b>${STEP_META[s].t}</b><p class="small muted">${en(u.en)}</p></div>${starsHtml(Store.getStars(u.key, s), 3)}</a></li>`).join("") || `<li class="muted">${icon("party-popper")} ${T("حصلت", "حصلتِ")} على كل النجوم في ${g.ar}!</li>`}</ul></section>
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
    <section class="card"><h2 class="h3">${icon("trophy")} هدف الأسبوع</h2>
      <p>${T("أكمل", "أكملي")} ${w.goal} أنشطة هذا الأسبوع. يبدأ الهدف من جديد كل أحد.</p>
      <div class="bar" role="progressbar" aria-label="تقدم هدف الأسبوع" aria-valuemin="0" aria-valuemax="${w.goal}" aria-valuenow="${Math.min(w.acts, w.goal)}"><i style="width:${Math.min(100, w.acts / w.goal * 100)}%"></i></div>
      <p class="small">${w.met ? icon("party-popper") + " تحقق الهدف!" : `${w.acts} من ${w.goal}`} · ${w.stars} نجمة هذا الأسبوع</p>
      ${weekDots(w)}</section>
    <section><h2 class="h3">الشارات</h2>
      <ul class="badges">${Store.BADGES.map(b => { const got = p.badges[b.id]; return `<li class="badge ${got ? "got" : ""}"><span class="bi" aria-hidden="true">${icon(b.icon)}</span><b>${b.name}</b><span class="small">${got ? icon("check-bold") + " حصلت عليها" : b.how}</span></li>`; }).join("")}</ul></section>
  </div>`;
  focusMain();
}
