/* ============================================================
   الملف الشخصي والإعدادات
   ============================================================ */
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
function renderProfile() {
  const p = Store.profile();
  chrome({ title: "ملفي", tab: "profile" });
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  app.innerHTML = `<div class="stack">
    <h1 class="h2">ملفي</h1>
    <form class="card form" id="pForm">
      <label class="field" for="pName">الاسم <small>(اختياري)</small><input id="pName" maxlength="20" value="${esc(p.name)}" autocomplete="off"></label>
      <fieldset><legend>أنا</legend><div class="seg"><button type="button" data-g="m" aria-pressed="${p.gender === "m"}">طالب</button><button type="button" data-g="f" aria-pressed="${p.gender === "f"}">طالبة</button></div></fieldset>
      <label class="field" for="pGrade">صفّي<select id="pGrade">${STAGES.map(s => `<optgroup label="${s.long}">${GRADES.filter(g => g.stage === s.id).map(g => `<option value="${g.id}" ${g.id === p.grade ? "selected" : ""}>${g.ar}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <button class="btn primary" type="submit">حفظ</button>
    </form>
    <section class="card"><h2 class="h3">${icon("volume-high")} الصوت</h2>
      <div class="seg" role="group" aria-label="سرعة النطق"><button data-rate="0.85" aria-pressed="${Store.rate >= 0.8}">سرعة عادية</button><button data-rate="0.65" aria-pressed="${Store.rate < 0.8}">أبطأ</button></div>
      <p class="small muted">${Speech.recorded ? "النطق بصوت بشري مسجّل: رجالي للطلاب ونسائي للطالبات. كل مقطع يُحفظ بعد أول استماع ويعمل بعدها دون اتصال." : Speech.supported ? "يُستخدم صوت جهازك للنطق، ويعمل غالباً دون اتصال." : "الصوت غير متاح في هذا المتصفح. جرّب Chrome أو Safari."}</p>
      <button class="btn ghost sm" data-say="Hello! Welcome to English Stars.">جرّب الصوت</button></section>
    <section class="card"><h2 class="h3">${icon("account-group")} طلاب هذا الجهاز</h2>
      <ul class="list">${Store.profiles().map(x => `<li class="row-between"><span>${icon(x.gender === "f" ? "human-female" : "human-male")} ${esc(x.name || (x.gender === "f" ? "طالبة" : "طالب"))} · <span class="small muted">${(gradeById(x.grade) || {}).ar || ""} · ★ ${countStars(x)}</span></span>
        ${x.id === p.id ? `<span class="pill">الحالي</span>` : `<button class="btn ghost sm" data-switch="${x.id}">تبديل</button>`}</li>`).join("")}</ul>
      <a class="btn ghost block" href="#welcome" id="addStudent">+ إضافة طالب آخر</a></section>
    <a class="card link" href="#report"><span class="ic" aria-hidden="true">${icon("clipboard-text")}</span><div><b>تقرير ولي الأمر والمعلم</b><p class="small muted">الوحدات المكتملة والكلمات التي تحتاج مراجعة</p></div><span aria-hidden="true">←</span></a>
    <section class="card"><h2 class="h3">${icon("cellphone-arrow-down")} تثبيت التطبيق</h2>
      ${standalone ? `<p>التطبيق مثبّت على جهازك ${icon("check-bold")}</p>`
        : installPrompt ? `<p class="small">${T("ثبّت", "ثبّتي")} نجوم الإنجليزي على الشاشة الرئيسية ${T("ليفتح", "ليفتح")} كتطبيق ويعمل دون اتصال.</p><button class="btn primary" id="install">تثبيت التطبيق</button>`
        : isIOS ? `<p class="small">في Safari: ${T("اضغط", "اضغطي")} زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».</p>`
        : `<p class="small">من قائمة المتصفح ${T("اختر", "اختاري")} «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>`}</section>
    <section class="card note-card"><h2 class="h3">${icon("lock")} أين يُحفظ تقدمك؟</h2>
      <p class="small">على هذا الجهاز فقط، داخل المتصفح. لا يوجد حساب ولا تُرسل أي بيانات. إذا ${T("مسحت", "مسحتِ")} بيانات المتصفح أو ${T("استخدمت", "استخدمتِ")} التصفح الخاص قد يضيع التقدم. المزامنة بين الأجهزة غير متاحة حالياً.</p>
      <div id="delZone"><button class="btn danger sm" id="del">حذف بيانات هذا الطالب</button></div></section>
  </div>`;
  let gender = p.gender;
  app.querySelectorAll("#pForm [data-g]").forEach(b => b.onclick = () => { gender = b.dataset.g; app.querySelectorAll("#pForm [data-g]").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("#pForm").onsubmit = e => { e.preventDefault(); Store.updateProfile({ name: $("#pName").value.trim(), gender, grade: $("#pGrade").value }); toast("تم الحفظ"); renderProfile(); };
  app.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => { Store.setRate(+b.dataset.rate); renderProfile(); });
  wireSay(app);
  app.querySelectorAll("[data-switch]").forEach(b => b.onclick = () => { Store.switchProfile(b.dataset.switch); toast("تم التبديل"); go("home"); });
  $("#addStudent").onclick = e => { e.preventDefault(); history.pushState(null, "", "#welcome"); renderWelcome("new"); };
  const ins = $("#install"); if (ins) ins.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderProfile(); };
  $("#del").onclick = () => {
    $("#delZone").innerHTML = `<p class="small"><b>متأكد؟</b> سيُحذف تقدم ${esc(p.name || "هذا الطالب")} ونجومه من هذا الجهاز نهائياً.</p>
      <div class="actions tight"><button class="btn danger sm" id="delYes">نعم، احذف</button><button class="btn ghost sm" id="delNo">إلغاء</button></div>`;
    $("#delNo").onclick = renderProfile;
    $("#delYes").onclick = () => { Store.removeProfile(p.id); toast("تم الحذف"); go(Store.profile() ? "home" : "welcome"); };
  };
  focusMain();
}
function countStars(prof) { let t = 0; for (const k in prof.stars) for (const a in prof.stars[k]) t += prof.stars[k][a]; return t; }

/* ============================================================
   تقرير ولي الأمر / المعلم (من بيانات هذا الجهاز فقط)
   ============================================================ */
function renderReport() {
  const p = Store.profile();
  chrome({ title: "التقرير", back: "profile", tab: "profile" });
  const touched = GRADES.filter(g => g.units.some(u => p.done[u.key] || p.stars[u.key]) || p.grade === g.id);
  const reviewItems = Object.keys(p.review).map(id => ({ id, r: p.review[id], x: WORD_INDEX[id] })).filter(o => o.x).sort((a, b) => b.r.misses - a.r.misses);
  const last = p.last ? new Date(p.last.at) : null;
  const lastDays = Object.keys(p.days).filter(k => p.days[k].w || p.days[k].a.length).sort().slice(-14);
  app.innerHTML = `<div class="stack">
    <h1 class="h2">${icon("clipboard-text")} تقرير ${esc(p.name || (p.gender === "f" ? "الطالبة" : "الطالب"))}</h1>
    <p class="small muted">آخر نشاط: ${last ? last.toLocaleDateString("ar-SA-u-nu-latn", { weekday: "long", day: "numeric", month: "long" }) : "لا يوجد"} · أيام التعلّم (آخر أسبوعين): ${lastDays.length}</p>
    ${touched.map(g => {
      const gp = gradeProgress(g);
      return `<section class="card"><h2 class="h3">${g.ar} ${g.book ? `· ${en(g.book)}` : ""}</h2>
        <p class="small">${gp.done} من ${gp.total} وحدات مكتملة · ${gp.stars} / ${gp.max} نجمة</p>
        <div class="tablewrap"><table class="report"><thead><tr><th scope="col">الوحدة</th><th scope="col">الخطوات</th><th scope="col">النجوم</th></tr></thead><tbody>
        ${g.units.map(u => `<tr><td><span class="en" lang="en" dir="ltr">${esc(u.num)}. ${esc(u.en)}</span></td><td>${Store.STEPS.filter(s => Store.isDone(u.key, s)).length}/6</td><td>${Store.unitStars(u.key)}/9</td></tr>`).join("")}
        </tbody></table></div></section>`;
    }).join("")}
    <section class="card"><h2 class="h3">كلمات تحتاج مراجعة (${reviewItems.length})</h2>
      ${reviewItems.length ? `<ul class="weak">${reviewItems.slice(0, 40).map(o => `<li>${en(o.x.w[0])}<span class="tr">${o.x.w[1]}</span><span class="small muted">${o.x.g.ar} · وحدة ${esc(o.x.u.num)} · أخطاء: ${o.r.misses}</span></li>`).join("")}</ul>` : `<p class="muted">لا توجد.</p>`}</section>
    <section class="card note-card"><h2 class="h3">${icon("information")} عن هذا التقرير</h2>
      <p class="small">يعرض التقرير بيانات هذا الجهاز فقط. متابعة المعلم عن بُعد، وتقارير الفصل، ومزامنة التقدم بين الأجهزة تحتاج خادماً وحسابات، وهي غير متوفرة حالياً.</p></section>
  </div>`;
  focusMain();
}
