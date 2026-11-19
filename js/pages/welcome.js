/* ============================================================
   البداية: (1) طالب/طالبة أو ولي أمر، ثم للطالب: (2) اللغة (3) الصف (4) طالب/طالبة + اسم (5) الإعدادات.
   ولي الأمر: يكتب رمز الطالب (من «ملفي» في جهاز الطالب) ثم ينتقل لصفحته
   ============================================================ */
const LANGS = [
  { id: "en", name: "الإنجليزية", native: "English", mark: "En", ready: true },
  { id: "fr", name: "الفرنسية", native: "Français", mark: "Fr" },
  { id: "zh", name: "الصينية", native: "中文", mark: "中" },
  { id: "es", name: "الإسبانية", native: "Español", mark: "Es" }
];
function renderWelcome(editing) {
  chrome({ title: "", hideNav: true });
  const p = Store.profile();
  const st = {
    lang: (p && p.lang) || "en", gender: (p && p.gender) || "", grade: (p && p.grade) || "", name: (p && p.name) || "",
    step: (p && p.grade && editing === true) ? 4 : editing === "new" ? 2 : 1
  };
  const TOTAL = 5;
  const draw = () => [null, stepRole, stepLang, stepGrade, stepMe, stepSettings, stepParent][st.step]();
  const progress = () => `<div class="ob-progress" role="progressbar" aria-label="خطوات البداية" aria-valuemin="1" aria-valuemax="${TOTAL}" aria-valuenow="${st.step}">
      ${st.step > 1 ? `<button type="button" class="iconbtn ob-back" id="obBack" aria-label="الخطوة السابقة"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.3 5.3 8 6.7l5.3 5.3L8 17.3l1.3 1.4L16 12z"/></svg></button>` : ""}
      <ol>${Array.from({ length: TOTAL }, (_, i) => `<li class="${i + 1 < st.step ? "done" : i + 1 === st.step ? "now" : ""}"></li>`).join("")}</ol>
      <span class="small muted">الخطوة ${st.step} من ${TOTAL}</span></div>`;
  const wireBack = () => { const b = $("#obBack"); if (b) b.onclick = () => { st.step--; draw(); }; };

  /* (1) من أنت؟ */
  function stepRole() {
    applyStage(null);
    app.innerHTML = `<section class="welcome">${progress()}
      <div class="hero">${MASCOT}<h1>أهلاً بك في نجوم الإنجليزي</h1><p>من أنت؟</p></div>
      <div class="ob-roles">
        <button type="button" class="ob-lang ob-role" data-role="student"><span class="mark" aria-hidden="true">${icon("human-male")}${icon("human-female")}</span>
          <span class="txt"><b>طالب / طالبة</b><small>أتعلّم الكلمات والقواعد وأجمع النجوم</small></span></button>
        <button type="button" class="ob-lang ob-role parent" data-role="parent"><span class="mark" aria-hidden="true">${icon("human-male-female-child")}</span>
          <span class="txt"><b>ولي أمر</b><small>أتابع تقدم ابني أو بنتي برمز الطالب</small></span></button>
      </div></section>`;
    app.querySelector('[data-role="student"]').onclick = () => { Store.setMode("student"); st.step = 2; draw(); };
    app.querySelector('[data-role="parent"]').onclick = () => { Store.setMode("parent"); location.href = "parent.html#parent"; };
    focusMain();
  }

  /* ولي الأمر: الاسم ورمز الطالب */
  function stepParent() {
    applyStage(null);
    app.innerHTML = `<section class="welcome">
      <div class="ob-progress"><button type="button" class="iconbtn ob-back" id="obBack" aria-label="رجوع"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.3 5.3 8 6.7l5.3 5.3L8 17.3l1.3 1.4L16 12z"/></svg></button><span class="small muted">ولي الأمر</span></div>
      <div class="hero"><span class="ic big" aria-hidden="true">${icon("human-male-female-child")}</span><h1>ربط حساب الطالب</h1>
        <p>اكتب رمز الطالب. تجده في جهاز الطالب: «ملفي» ← «رمز ولي الأمر».</p></div>
      <form id="paForm" class="card form" novalidate>
        <label class="field" for="paName">اسمك <small>(اختياري)</small><input id="paName" maxlength="20" autocomplete="off" value="${esc(Store.parent.name)}"></label>
        <label class="field" for="paCode">رمز الطالب<input id="paCode" class="code-input" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" dir="ltr" placeholder="ABC-123"></label>
        <p class="small" id="paMsg" aria-live="polite"></p>
        <button class="btn primary block" type="submit">ربط ومتابعة</button>
        <p class="small muted">الطالب على جهاز آخر؟ اطلب منه من «ملفي» ← «إرسال التقرير لولي الأمر»، وافتح الرابط على جهازك.</p>
        <button type="button" class="btn ghost block" id="paSkip">متابعة بدون ربط</button>
      </form></section>`;
    $("#obBack").onclick = () => { st.step = 1; draw(); };
    $("#paCode").oninput = e => { const c = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); e.target.value = c.length > 3 ? c.slice(0, 3) + "-" + c.slice(3) : c; };
    const enter = () => { Store.setParentName($("#paName").value.trim()); Store.setMode("parent"); go("parent"); };
    $("#paSkip").onclick = enter;
    $("#paForm").onsubmit = e => {
      e.preventDefault();
      const r = Store.linkByCode($("#paCode").value), msg = $("#paMsg");
      if (!r.error || r.error === "already") { toast(`تم الربط: ${r.profile.name || (r.profile.gender === "f" ? "الطالبة" : "الطالب")}`); return enter(); }
      msg.className = "small bad-text";
      msg.textContent = r.error === "short" ? "الرمز 6 خانات، مثل ABC-123."
        : "ما لقينا طالباً بهذا الرمز على هذا الجهاز. إذا كان الطالب على جهاز آخر، اطلب منه «رابط التقرير»، أو اضغط «متابعة بدون ربط».";
    };
    focusMain();
  }

  /* (2) اللغة */
  function stepLang() {
    applyStage(null);
    app.innerHTML = `<section class="welcome">${progress()}
      <div class="hero">${MASCOT}<h1>أي لغة تبي تتعلّم؟</h1><p>اختر اللغة، وبعدها نختار صفك.</p></div>
      <div class="ob-langs" role="radiogroup" aria-label="اللغة">
        ${LANGS.map(l => `<button type="button" class="ob-lang" role="radio" data-lang="${l.id}" aria-checked="${l.id === st.lang}" ${l.ready ? "" : 'aria-disabled="true" disabled'}>
          <span class="mark" lang="${l.id}" aria-hidden="true">${l.mark}</span>
          <span class="txt"><b>${l.name}</b><small lang="${l.id}">${l.native}</small></span>
          ${l.ready ? `<span class="pill good">متاحة</span>` : `<span class="pill soon">قريباً</span>`}</button>`).join("")}
      </div>
      <p class="small muted center">نعمل على إضافة لغات أخرى. حالياً المحتوى متاح بالإنجليزية فقط.</p>
      <button class="btn primary block" id="obNext">التالي ←</button></section>`;
    app.querySelectorAll(".ob-lang:not([disabled])").forEach(b => b.onclick = () => {
      st.lang = b.dataset.lang; app.querySelectorAll(".ob-lang").forEach(x => x.setAttribute("aria-checked", x === b));
    });
    wireBack();
    $("#obNext").onclick = () => { st.step = 3; draw(); };
    focusMain();
  }

  /* (3) الصف */
  function stepGrade() {
    applyStage(null);
    app.innerHTML = `<section class="pick-grade">${progress()}
      <div class="hero">${MASCOT}<h1>في أي صف أنت؟</h1><p>اختر صفك، ولكل مرحلة واجهة تناسبها.</p></div>
      ${STAGES.map(s => `<section class="stage-block" data-look="${s.id}" aria-labelledby="sb-${s.id}">
        <header><span class="logo">${STAGE_LOGO[s.id]}</span><div><h2 id="sb-${s.id}">${s.ar}</h2><p>${STAGE_TAG[s.id]}</p></div></header>
        <div class="gtiles">${GRADES.filter(g => g.stage === s.id).map((g, i) => `<button type="button" class="gtile" data-grade="${g.id}" aria-pressed="${g.id === st.grade}" style="--c:var(--c${(i % 5) + 1});--t:var(--t${(i % 5) + 1})"><b>${gradeShortNum(g)}</b><span>${g.ar}</span>${g.book ? `<small>${esc(g.book)}</small>` : ""}</button>`).join("")}</div>
      </section>`).join("")}
    </section>`;
    wireBack();
    app.querySelectorAll("[data-grade]").forEach(b => b.onclick = () => { st.grade = b.dataset.grade; st.step = 4; draw(); });
    focusMain();
  }

  /* (4) طالب/طالبة + الاسم */
  function stepMe() {
    const g = gradeById(st.grade);
    applyStage(g.stage);
    app.innerHTML = `<section class="welcome">${progress()}
      <div class="hero">${STAGE_LOGO[g.stage]}<h1>${STAGE_HELLO[g.stage]}</h1><p>عرّفنا بنفسك. بدون حساب وبدون بيانات شخصية.</p></div>
      <form id="wForm" class="card form" novalidate>
        <div class="chosen"><div><span class="logo">${STAGE_LOGO[g.stage].replace('class="mascot"', 'class="mini"')}</span><div><small class="muted">صفّي</small><br><b>${g.ar}</b></div></div>
          <button type="button" class="btn ghost sm" id="wChange">تغيير الصف</button></div>
        <fieldset><legend>أنا…</legend>
          <div class="choice2">
            <button type="button" data-g="m" aria-pressed="false"><span aria-hidden="true">${icon("human-male")}</span>طالب</button>
            <button type="button" data-g="f" aria-pressed="false"><span aria-hidden="true">${icon("human-female")}</span>طالبة</button>
          </div>
          <p class="small muted">يحدد صوت النطق: صوت رجالي للطالب وصوت نسائي للطالبة.</p>
        </fieldset>
        <label class="field" for="wName">الاسم <small>(اختياري، يظهر لك فقط)</small>
          <input id="wName" maxlength="20" autocomplete="off" value="${esc(st.name)}" placeholder="مثلاً: سارة">
        </label>
        <button class="btn primary block" id="wGo" type="submit" disabled>التالي ←</button>
        <p class="muted small" id="wHint" aria-live="polite">اختر «طالب» أو «طالبة» للمتابعة.</p>
      </form></section>`;
    wireBack();
    const paint = () => {
      app.querySelectorAll("[data-g]").forEach(b => b.setAttribute("aria-pressed", b.dataset.g === st.gender));
      $("#wGo").disabled = !(st.gender && st.grade);
      $("#wHint").hidden = !$("#wGo").disabled;
    };
    app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { st.gender = b.dataset.g; paint(); });
    $("#wName").oninput = e => { st.name = e.target.value; };
    $("#wChange").onclick = () => { st.step = 3; draw(); };
    paint();
    $("#wForm").onsubmit = e => {
      e.preventDefault();
      if (!(st.gender && st.grade)) return;
      st.name = $("#wName").value.trim(); st.step = 5; draw();
    };
    focusMain();
  }

  /* (5) الإعدادات: سرعة الصوت والمظهر — تُطبَّق فوراً */
  function stepSettings() {
    const g = gradeById(st.grade);
    applyStage(g.stage);
    const fem = st.gender === "f";
    const opt = (attr, val, cur, label) => `<button type="button" ${attr}="${val}" aria-pressed="${val === cur}">${label}</button>`;
    app.innerHTML = `<section class="welcome">${progress()}
      <div class="hero">${STAGE_LOGO[g.stage]}<h1>إعداداتك</h1><p>${fem ? "تقدرين" : "تقدر"} ${fem ? "تغيّرينها" : "تغيّرها"} بعدين من «ملفي».</p></div>
      <div class="card form">
        <fieldset><legend>سرعة النطق</legend>
          <div class="seg wide" role="group" aria-label="سرعة النطق">${opt("data-rate", "0.85", Store.rate >= 0.8 ? "0.85" : "0.65", "عادية")}${opt("data-rate", "0.65", Store.rate >= 0.8 ? "0.85" : "0.65", "أبطأ")}</div>
          <button type="button" class="btn ghost sm" id="obTry">${fem ? "جرّبي" : "جرّب"} الصوت</button>
        </fieldset>
        <fieldset><legend>المظهر</legend>
          <div class="seg wide" role="group" aria-label="المظهر">${opt("data-theme-set", "light", Store.theme, "فاتح")}${opt("data-theme-set", "dark", Store.theme, "ليلي")}${opt("data-theme-set", "auto", Store.theme, "حسب الجهاز")}</div>
        </fieldset>
        <button class="btn primary block" id="obStart">${fem ? "ابدئي" : "ابدأ"} التعلّم</button>
      </div></section>`;
    wireBack();
    app.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => {
      Store.setRate(+b.dataset.rate); app.querySelectorAll("[data-rate]").forEach(x => x.setAttribute("aria-pressed", x === b));
    });
    app.querySelectorAll("[data-theme-set]").forEach(b => b.onclick = () => {
      Store.setTheme(b.dataset.themeSet); app.querySelectorAll("[data-theme-set]").forEach(x => x.setAttribute("aria-pressed", x === b));
    });
    $("#obTry").onclick = () => {
      Speech.genderHint = st.gender;                 /* الصوت حسب طالب/طالبة المختار قبل الحفظ */
      Speech.say("Hello! Welcome to English Stars.");
    };
    $("#obStart").onclick = () => {
      const fields = { gender: st.gender, grade: st.grade, name: st.name, lang: st.lang };
      if (p && editing !== "new") Store.updateProfile(fields); else Store.createProfile(fields);
      delete Speech.genderHint;
      Store.setMode("student");
      go("home");
    };
    focusMain();
  }
  draw();
}

