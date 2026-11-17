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
            <button type="button" data-g="m" aria-pressed="false"><span aria-hidden="true">${icon("human-male")}</span>طالب</button>
            <button type="button" data-g="f" aria-pressed="false"><span aria-hidden="true">${icon("human-female")}</span>طالبة</button>
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
