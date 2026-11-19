/* ============================================================
   ولي الأمر
   - كل طالب له رمز من 6 خانات في «ملفي».
   - نفس الجهاز: ولي الأمر يكتب الرمز فيرتبط بملف الطالب ويرى تقدمه مباشرة.
   - جهاز آخر: الطالب يرسل «رابط التقرير» (يحمل ملخص تقدمه ورمزه)،
     فيفتحه ولي الأمر على جواله ويُحفظ عنده. إرسال الرابط مرة أخرى يحدّث التقرير.
     لا يوجد خادم: لا تُرسل أي بيانات إلا عبر الرابط الذي يرسله الطالب بنفسه.
   ============================================================ */

/* ---------------- ملخص التقدم (نفس الشكل للملف المحلي والرابط) ---------------- */
function parentSnap(p) {
  return Store.viewAs(p.id, () => {
    const units = [];
    GRADES.forEach(g => g.units.forEach(u => {
      if (g.id !== p.grade && !p.done[u.key] && !p.stars[u.key]) return;
      units.push([u.key, Store.STEPS.filter(s => Store.isDone(u.key, s)).length, Store.unitStars(u.key)]);
    }));
    const active = Object.keys(p.days).filter(k => p.days[k].w || p.days[k].a.length).sort();
    const cut = new Date(); cut.setDate(cut.getDate() - 13);
    const w = Store.weekly();
    return {
      v: 1, c: p.code, n: p.name || "", s: p.gender, gr: p.grade, at: Date.now(),
      t: Store.totalStars(), wl: Object.keys(p.learned).length,
      la: active[active.length - 1] || "", d14: active.filter(k => k >= Store.dayKey(cut)).length,
      wa: w.acts, wg: w.goal, wk: w.active,
      b: Object.keys(p.badges).length,
      u: units,
      r: Object.keys(p.review).filter(id => WORD_INDEX[id]).sort((a, b) => p.review[b].misses - p.review[a].misses).slice(0, 15).map(id => [id, p.review[id].misses])
    };
  });
}
const b64e = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)));
function parentLink(p) { return new URL("parent.html", location.href).href.split("#")[0] + "#parent/add/" + b64e(JSON.stringify(parentSnap(p))); }
function readSnap(str) {
  try {
    const s = JSON.parse(b64d(str));
    if (s && s.v === 1 && /^[A-Z0-9]{6}$/.test(s.c) && Array.isArray(s.u) && Array.isArray(s.r)) return s;
  } catch (e) {}
  return null;
}
const showCode = c => c ? c.slice(0, 3) + "-" + c.slice(3) : "";
const kidName = s => s.n || (s.s === "f" ? "الطالبة" : "الطالب");
const arDate = (d, opt = { weekday: "long", day: "numeric", month: "long" }) => new Date(d).toLocaleDateString("ar-SA-u-nu-latn", opt);

/* كل الطلاب المتابَعين: المرتبطون على هذا الجهاز (مباشر) + المضافون برابط */
function parentKids() {
  const live = Store.linked().map(p => ({ live: true, id: p.id, snap: parentSnap(p) }));
  const codes = new Set(live.map(k => k.snap.c));
  const shared = Object.values(Store.parent.snaps || {}).filter(s => !codes.has(s.c)).map(s => ({ live: false, id: s.c, snap: s }));
  return [...live, ...shared];
}

/* ---------------- الصفحة الرئيسية لولي الأمر ---------------- */
function renderParent() {
  chrome({ title: "ولي الأمر", hideNav: true });
  applyStage(null);
  const kids = parentKids();
  const name = Store.parent.name;
  app.innerHTML = `<div class="stack parent">
    <div class="hero small-hero"><span class="ic big" aria-hidden="true">${icon("human-male-female-child")}</span>
      <h1 class="h2">${name ? `أهلاً ${esc(name)}` : "صفحة ولي الأمر"}</h1>
      <p class="muted">تابع تقدم أبنائك وبناتك في نجوم الإنجليزي.</p></div>
    ${kids.length ? kids.map(kidCard).join("") : `<section class="card note-card"><p><b>لم تربط أي طالب بعد.</b> اكتب رمز الطالب بالأسفل.</p></section>`}
    <section class="card form" aria-labelledby="lkH"><h2 class="h3" id="lkH">${icon("link-variant")} ربط طالب</h2>
      <form id="lkForm" class="link-form" novalidate>
        <label class="field" for="lkCode">رمز الطالب <small>(في جهاز الطالب: ملفي ← رمز ولي الأمر)</small>
          <input id="lkCode" class="code-input" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="latin" dir="ltr" placeholder="ABC-123"></label>
        <button class="btn primary" type="submit">ربط</button>
      </form>
      <p class="small" id="lkMsg" aria-live="polite"></p>
      <details class="small muted"><summary>الطالب يستخدم جهازاً آخر؟</summary>
        <p>الرمز يعمل مباشرة إذا كان ملف الطالب على هذا الجهاز. إذا كان على جهاز آخر: من جهاز الطالب افتح «ملفي» ← «إرسال التقرير لولي الأمر»، وأرسل الرابط لك (واتساب مثلاً)، ثم افتحه هنا. لتحديث التقرير يرسل الرابط مرة أخرى.</p></details>
    </section>
    <section class="card"><h2 class="h3">${icon("account")} بياناتي</h2>
      <label class="field" for="pnName">اسمك <small>(اختياري)</small><input id="pnName" maxlength="20" autocomplete="off" value="${esc(name)}"></label>
      <div class="actions tight"><button class="btn ghost sm" id="pnSave">حفظ</button></div></section>
    <a class="btn ghost block" href="index.html" id="toStudent">${icon("swap-horizontal")} الدخول كطالب / طالبة</a>
    <section class="card note-card"><h2 class="h3">${icon("lock")} الخصوصية</h2>
      <p class="small">لا يوجد حساب ولا خادم. بيانات الطلاب تبقى على أجهزتكم، ولا تنتقل إلا عبر الرابط الذي يرسله الطالب بنفسه.</p></section>
  </div>`;

  $("#lkForm").onsubmit = e => {
    e.preventDefault();
    const r = Store.linkByCode($("#lkCode").value), msg = $("#lkMsg");
    if (r.profile && !r.error) { toast(`تم ربط ${kidName({ n: r.profile.name, s: r.profile.gender })}`); return renderParent(); }
    msg.className = "small bad-text";
    msg.textContent = r.error === "short" ? "الرمز 6 خانات، مثل ABC-123."
      : r.error === "already" ? "هذا الطالب مرتبط من قبل."
      : "ما لقينا ملف طالب بهذا الرمز على هذا الجهاز. إذا كان الطالب على جهاز آخر، اطلب منه «رابط التقرير».";
  };
  $("#lkCode").oninput = e => { const c = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); e.target.value = c.length > 3 ? c.slice(0, 3) + "-" + c.slice(3) : c; };
  $("#pnSave").onclick = () => { Store.setParentName($("#pnName").value.trim()); toast("تم الحفظ"); renderParent(); };
  $("#toStudent").onclick = () => { Store.setMode("student"); };
  app.querySelectorAll("[data-unlink]").forEach(b => b.onclick = () => {
    const k = kids.find(x => x.id === b.dataset.unlink); if (!k) return;
    const zone = b.closest(".kid").querySelector(".unzone");
    zone.innerHTML = `<p class="small"><b>إلغاء متابعة ${esc(kidName(k.snap))}؟</b> ${k.live ? "لن يُحذف تقدم الطالب." : "سيُحذف التقرير المحفوظ من هذا الجهاز."}</p>
      <div class="actions tight"><button class="btn danger sm" data-yes>نعم</button><button class="btn ghost sm" data-no>إلغاء</button></div>`;
    zone.querySelector("[data-no]").onclick = renderParent;
    zone.querySelector("[data-yes]").onclick = () => { if (k.live) Store.unlink(k.id); else Store.removeSnap(k.id); renderParent(); };
  });
  focusMain();
}

function kidCard(k) {
  const s = k.snap, g = gradeById(s.gr) || {};
  const gu = s.u.filter(x => x[0].startsWith(s.gr + "-"));
  const done = gu.filter(x => x[1] >= 6).length;
  return `<article class="card kid" aria-labelledby="k-${esc(k.id)}">
    <header class="row-between"><h2 class="h3" id="k-${esc(k.id)}">${icon(s.s === "f" ? "human-female" : "human-male")} ${esc(kidName(s))}</h2>
      <span class="pill">${esc(g.ar || "")}</span></header>
    <ul class="kstats">
      <li><b>★ ${s.t}</b><span>النجوم</span></li>
      <li><b>${s.wl}</b><span>كلمات تعلّمها</span></li>
      <li><b>${done}/${gu.length}</b><span>وحدات مكتملة</span></li>
      <li><b>${s.d14}</b><span>أيام تعلّم (أسبوعان)</span></li>
    </ul>
    <p class="small">هذا الأسبوع: ${s.wa} أنشطة (الهدف ${s.wg}) ${s.wa >= s.wg ? icon("check-bold") : ""} · آخر نشاط: ${s.la ? arDate(s.la + "T12:00:00") : "لا يوجد"}</p>
    <p class="small muted">${k.live ? `${icon("link-variant")} مرتبط على هذا الجهاز، يتحدّث تلقائياً` : `${icon("clock-outline")} تقرير بتاريخ ${arDate(s.at, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}. يتحدّث عندما يرسل الطالب رابطاً جديداً.`}</p>
    <div class="actions tight"><a class="btn primary sm" href="#parent/r/${encodeURIComponent(k.id)}">التقرير الكامل</a><button class="btn ghost sm" data-unlink="${esc(k.id)}">إلغاء المتابعة</button></div>
    <div class="unzone"></div>
  </article>`;
}

/* ---------------- التقرير الكامل لطالب ---------------- */
function renderParentReport(id) {
  const k = parentKids().find(x => x.id === id);
  if (!k) return go("parent");
  chrome({ title: "التقرير", back: "parent", hideNav: true });
  const s = k.snap;
  const byGrade = {};
  s.u.forEach(([key, steps, stars]) => { const gid = key.split("-")[0]; (byGrade[gid] = byGrade[gid] || []).push({ key, steps, stars }); });
  const days = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
  app.innerHTML = `<div class="stack">
    <h1 class="h2">${icon("clipboard-text")} تقرير ${esc(kidName(s))}</h1>
    <p class="small muted">${k.live ? "بيانات مباشرة من هذا الجهاز." : `حسب آخر رابط أرسله الطالب: ${arDate(s.at, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}`}</p>
    <section class="card"><h2 class="h3">هذا الأسبوع</h2>
      <ol class="week" aria-label="أيام التعلّم هذا الأسبوع">${(s.wk || []).map((on, i) => `<li class="${on ? "on" : ""}"><span aria-hidden="true">${on ? "★" : ""}</span><small>${days[i]}<span class="sr">${on ? ": تعلّم" : ": لا نشاط"}</span></small></li>`).join("")}</ol>
      <p class="small">الأنشطة: ${s.wa} (الهدف ${s.wg}) · الشارات: ${s.b} · النجوم: ★ ${s.t}</p></section>
    ${Object.keys(byGrade).map(gid => {
      const g = gradeById(gid); if (!g) return "";
      return `<section class="card"><h2 class="h3">${g.ar} ${g.book ? `· ${en(g.book)}` : ""}</h2>
        <div class="tablewrap"><table class="report"><thead><tr><th scope="col">الوحدة</th><th scope="col">الخطوات</th><th scope="col">النجوم</th></tr></thead><tbody>
        ${byGrade[gid].map(x => { const u = unitOf(g, x.key.slice(gid.length + 1)); return u ? `<tr><td><span class="en" lang="en" dir="ltr">${esc(u.num)}. ${esc(u.en)}</span></td><td>${x.steps}/6</td><td>${x.stars}/9</td></tr>` : ""; }).join("")}
        </tbody></table></div></section>`;
    }).join("")}
    <section class="card"><h2 class="h3">كلمات تحتاج مراجعة (${s.r.length})</h2>
      ${s.r.length ? `<ul class="weak">${s.r.map(([wid, miss]) => { const o = WORD_INDEX[wid]; return o ? `<li>${en(o.w[0])}<span class="tr">${o.w[1]}</span><span class="small muted">${o.g.ar} · وحدة ${esc(o.u.num)} · أخطاء: ${miss}</span></li>` : ""; }).join("")}</ul>` : `<p class="muted">لا توجد.</p>`}</section>
  </div>`;
  focusMain();
}

/* ---------------- استقبال رابط التقرير ---------------- */
function receiveParentLink(str) {
  const s = readSnap(str);
  history.replaceState(null, "", "#parent");
  if (!s) { Store.setMode("parent"); toast("الرابط غير صالح أو ناقص"); return renderParent(); }
  const mine = Store.profiles().find(p => p.code === s.c);
  if (mine) { Store.setMode("parent"); const r = Store.linkByCode(s.c); toast(r.error === "already" ? "هذا الطالب مرتبط من قبل" : `تم ربط ${kidName(s)}`); return renderParent(); }
  const had = Store.parent.snaps && Store.parent.snaps[s.c];
  Store.saveSnap(s); Store.setMode("parent");
  toast(had ? `تم تحديث تقرير ${kidName(s)}` : `تمت إضافة ${kidName(s)}`);
  renderParent();
}
