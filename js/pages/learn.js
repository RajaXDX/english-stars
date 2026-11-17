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
    <a class="card link" href="#big/${g.id}" style="--c:var(--brand)"><span class="ic" aria-hidden="true">${icon("trophy")}</span><div><b>التحدي الكبير</b><p class="small muted">كلمات من كل وحدات ${g.ar}</p></div>${starsHtml(Store.getStars(g.id + "-all", "wquiz"), 3)}</a>
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
