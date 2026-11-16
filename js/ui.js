/* ============================================================
   ui.js — the app shell and every "reading" screen:
   welcome, home, grades, unit, words, grammar, review, awards, profile.
   ============================================================ */
"use strict";

const view = $("#view");

/* ---------- navigation ----------
   Screens are addresses after the # (for example #/u/g4-u1/words), so the phone's
   back button and shared links just work. */
let navIndex = -1;                       // where we are in this tab's history
let cleanups = [];
const onLeave = fn => cleanups.push(fn);
function leaveScreen(){ hush(); stopConfetti(); cleanups.forEach(f=>{ try{ f(); }catch(e){} }); cleanups = []; }
function replace(path){ try{ history.replaceState({i:Math.max(navIndex,0)}, "", "#"+path); }catch(e){} route(); }
function back(fallback){ if(navIndex > 0) history.back(); else replace(fallback); }

/* ---------- shell pieces ---------- */
function setMode(mode, tab){
  document.body.dataset.mode = mode;                       // "tabs" | "page" | "session" | "welcome"
  $$(".tabbar a").forEach(a=>{ if(a.dataset.tab===tab) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
}
const chips = () => `<div class="chips">
  <a class="chip fire${streak() ? "" : " off"}" href="#/awards" aria-label="${streak()} أيام متتالية"><span aria-hidden="true">🔥</span><b>${streak()}</b></a>
  <a class="chip star" href="#/awards" aria-label="${totalStars()} نجمة"><span aria-hidden="true">⭐</span><b>${totalStars()}</b></a></div>`;
const topTabs = title => `<header class="top"><a class="brand" href="#/" aria-label="الصفحة الرئيسية">${MASCOT}<span>${title||"نجوم الإنجليزي"}</span></a>${chips()}</header>`;
const topPage = (title, sub) => `<header class="top page"><button class="icon-btn" id="backBtn" aria-label="رجوع">${ICON.back}</button>
  <div class="top-title"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</div>${chips()}</header>`;
function show(html, mode, tab){
  leaveScreen(); setMode(mode, tab);
  view.innerHTML = html; view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter");
  window.scrollTo(0,0);
}
const bindBack = fallback => { const b = $("#backBtn"); if(b) b.onclick = () => back(fallback); };
const bar = (n, max) => `<span class="bar" role="img" aria-label="${n} من ${max}"><i style="width:${max ? clamp(n/max*100,0,100) : 0}%"></i></span>`;
const speakBtn = (text, cls) => `<button class="say ${cls||""}" data-say="${esc(text)}" aria-label="استماع">${ICON.speak}</button>`;
const bindSay = root => $$("[data-say]", root).forEach(b=>b.onclick = e => { e.stopPropagation(); say(b.dataset.say); });

/* ---------- WELCOME (first visit) ---------- */
function screenWelcome(step){
  step = step||1;
  const dots = `<div class="dots" aria-hidden="true">${[1,2,3].map(i=>`<i class="${i===step?"on":""}"></i>`).join("")}</div>`;
  if(step===1){
    show(`<section class="welcome">${MASCOT}
      <h1>نجوم الإنجليزي</h1>
      <p class="lead">تعلّم كلمات وقواعد كتابك المدرسي، والعب واجمع النجوم ⭐</p>
      <h2>أهلاً وسهلاً! من أنت؟</h2>
      <div class="pick2">
        <button data-g="m"><span aria-hidden="true">👦</span>طالب</button>
        <button data-g="f"><span aria-hidden="true">👧</span>طالبة</button>
      </div>${dots}</section>`, "welcome");
    $$("[data-g]").forEach(b=>b.onclick = () => { store.gender = b.dataset.g; save(); screenWelcome(2); });
  }
  if(step===2){
    show(`<section class="welcome">
      <div class="avatar xl" id="avBig">${store.avatar}</div>
      <h2>${T("ما اسمك يا بطل؟","ما اسمك يا بطلة؟")}</h2>
      <form id="nameForm" class="stack">
        <input class="input big" id="nameIn" placeholder="${T("اكتب اسمك","اكتبي اسمك")}" value="${esc(store.name)}" maxlength="20" autocomplete="off" aria-label="الاسم">
        <p class="hint">${T("اختر","اختاري")} صورتك</p>
        <div class="avatars">${AVATARS.map(a=>`<button type="button" class="avatar${a===store.avatar?" on":""}" data-av="${a}">${a}</button>`).join("")}</div>
        <button class="btn block" type="submit">التالي</button>
      </form>${dots}</section>`, "welcome");
    $$("[data-av]").forEach(b=>b.onclick = () => { store.avatar = b.dataset.av; $$("[data-av]").forEach(x=>x.classList.toggle("on", x===b)); $("#avBig").textContent = store.avatar; });
    $("#nameForm").onsubmit = e => { e.preventDefault(); store.name = $("#nameIn").value.trim(); save(); screenWelcome(3); };
  }
  if(step===3){
    show(`<section class="welcome wide">
      <h2>${store.name ? "أهلاً يا "+esc(store.name)+"! " : ""}في أي صف ${T("أنت","أنتِ")}؟</h2>
      ${gradePicker()}${dots}</section>`, "welcome");
    $$("[data-grade]").forEach(b=>b.onclick = () => { store.grade = b.dataset.grade; store.onboarded = true; save(); replace("/"); });
  }
}
const gradePicker = () => STAGES.map(s=>`<h3 class="section">${s.ar} <small class="en">${s.en}</small></h3>
  <div class="grades">${GRADES.filter(g=>g.stage===s.id).map(g=>`<button class="gcard${g.id===store.grade?" on":""}" data-grade="${g.id}" style="--c:var(--c${(g.n-1)%COLORS+1})">
    <span class="gnum en">${g.short}</span>
    <span class="gbody"><b>${g.ar}</b>${g.book ? `<small class="en">${esc(g.book)}</small>` : ""}${bar(gradeStars(g), gradeMax(g))}</span></button>`).join("")}</div>`).join("");

/* ---------- HOME ---------- */
function screenHome(){
  const g = gradeById(store.grade); if(!g) return replace("/grades");
  const next = nextUp(g), xp = todayXP(), pct = clamp(xp/store.goal*100, 0, 100);
  const days = ["ح","ن","ث","ر","خ","ج","س"];
  const week = [6,5,4,3,2,1,0].map(n=>{ const d = new Date(); d.setDate(d.getDate()-n);
    return `<span class="day${store.days[dayKey(d)] ? " on" : ""}${n===0 ? " today" : ""}"><i>${store.days[dayKey(d)] ? "✓" : ""}</i>${days[d.getDay()]}</span>`; }).join("");
  const ucard = u => { const done = unitDone(u.key), st = unitStars(u.key);
    return `<a class="ucard${next && next.u===u ? " next" : ""}" href="#/u/${u.key}" style="--c:var(--c${u.c})">
      <span class="ring" style="--p:${done/STEPS.length*100}"><span aria-hidden="true">${u.pic}</span></span>
      <span class="ubody"><small class="en">${u.label}</small><b class="en">${esc(u.en)}</b><span>${u.ar}</span></span>
      <span class="umeta">${st===UNIT_MAX ? "<span class='crown' aria-hidden='true'>👑</span>" : ""}<span class="count" dir="ltr"><i>★</i> ${st}/${UNIT_MAX}</span></span></a>`; };
  const parts = [...new Set(g.units.map(u=>u.part||0))];
  const partName = p => p===1 ? "الجزء الأول" : p===2 ? "الجزء الثاني" : "الوحدات";
  show(`${topTabs()}
    <section class="hello">
      <a class="avatar lg" href="#/me" aria-label="حسابي">${store.avatar}</a>
      <div><h1>${store.name ? "أهلاً يا "+esc(store.name)+"!" : T("أهلاً يا بطل!","أهلاً يا بطلة!")}</h1>
        <a class="gradechip" href="#/grades">${g.ar}${g.book ? ` · <span class="en">${esc(g.book)}</span>` : ""} <span aria-hidden="true">▾</span></a></div>
    </section>
    <section class="today card">
      <div class="goal" style="--p:${pct}"><span><b>${xp}</b><small dir="ltr">/ ${store.goal}</small></span></div>
      <div class="today-body">
        <b>${xp>=store.goal ? "🎉 حققت هدف اليوم!" : xp ? `باقي ${store.goal-xp} نقطة لهدف اليوم` : T("ابدأ تعلّم اليوم","ابدئي تعلّم اليوم")}</b>
        <div class="week">${week}</div>
      </div>
    </section>
    ${next ? `<a class="continue" href="#/u/${next.u.key}/${next.s.id}" style="--c:var(--c${next.u.c})">
      <span class="c-pic" aria-hidden="true">${next.u.pic}</span>
      <span class="c-body"><small>${gradeStars(g) || unitDone(next.u.key) ? T("كمّل من حيث توقفت","كمّلي من حيث توقفتِ") : T("ابدأ من هنا","ابدئي من هنا")}</small>
        <b class="en">${esc(next.u.en)}</b><span>${next.s.icon} ${next.s.ar}</span></span>
      <span class="c-go">${T("ابدأ","ابدئي")}</span></a>`
    : `<div class="card center"><b>👑 أنهيت كل وحدات ${g.ar}!</b><p class="hint">${T("جرّب","جرّبي")} التحدي الكبير أو ${T("راجع","راجعي")} الكلمات.</p></div>`}
    ${parts.map(p=>`<h2 class="section">${partName(p)}${p ? ` <small class="en">Part ${p}</small>` : ""}</h2>
      <div class="ulist">${g.units.filter(u=>(u.part||0)===p).map(ucard).join("")}</div>`).join("")}
    <a class="bigcard" href="#/big"><span class="b-pic" aria-hidden="true">🏆</span>
      <span class="c-body"><b class="en">The Big Challenge</b><span>التحدي الكبير: ١٥ سؤالاً من كل الوحدات</span></span>${starRow(bigStars(g),3)}</a>
    <p class="foot">${g.book ? `محتوى ${g.ar} مبني على كلمات وقواعد كتاب <span class="en">${esc(g.book)}</span>.` : `محتوى ${g.ar} مبني على مستوى الصف في المنهج السعودي.`}</p>`, "tabs", "home");
}

/* ---------- GRADES ---------- */
function screenGrades(){
  show(`${topPage(T("اختر صفك","اختاري صفك"))}${gradePicker()}`, "page");
  bindBack("/");
  $$("[data-grade]").forEach(b=>b.onclick = () => { store.grade = b.dataset.grade; save(); replace("/"); });
}

/* ---------- UNIT: the path of steps ---------- */
function screenUnit(u){
  const g = u.grade, next = nextStep(u), st = unitStars(u.key);
  if(store.grade !== g.id){ store.grade = g.id; save(); }
  show(`${topPage(g.ar, g.book ? `<span class="en">${esc(g.book)}</span>` : "")}
    <div style="--c:var(--c${u.c})" class="stack">
    <section class="uhero">
      <span class="uhero-pic" aria-hidden="true">${u.pic}</span>
      <div><small class="en">${u.label}</small><h1 class="en">${esc(u.en)}</h1><p>${u.ar}</p></div>
      <div class="uhero-meta"><span>${u.words.length} كلمة</span><span dir="ltr">★ ${st} / ${UNIT_MAX}</span></div>
      ${bar(unitDone(u.key), STEPS.length)}
    </section>
    <nav class="path" aria-label="خطوات الوحدة">${STEPS.map(s=>{ const done = stepDone(u.key, s);
      return `<a class="step${done ? " done" : ""}${next===s ? " next" : ""}" href="#/u/${u.key}/${s.id}">
        <span class="node" aria-hidden="true">${s.icon}${done ? `<i>${ICON.check}</i>` : ""}</span>
        <span class="sbody"><b>${s.ar}</b><small>${s.sub}</small></span>
        ${s.kind==="play" ? starRow(getStars(u.key,s.id),3) : next===s ? "" : `<span class="chev">${ICON.go}</span>`}
        ${next===s ? `<span class="pill">${T("ابدأ","ابدئي")}</span>` : ""}</a>`; }).join("")}</nav></div>`, "page");
  bindBack("/");
}

/* ---------- WORDS ---------- */
function screenWords(u){
  markSeen(u.key, "words");
  const weak = store.weak[u.grade.id]||{};
  show(`${topPage("الكلمات", `<span class="en">${esc(u.en)}</span>`)}
    <div style="--c:var(--c${u.c})" class="stack">
    <div class="tools">
      ${u.words.length>18 ? `<label class="search">${ICON.search}<input id="q" type="search" placeholder="بحث عن كلمة…" autocomplete="off" aria-label="بحث عن كلمة"></label>` : ""}
      <button class="btn soft sm" id="toggleAr" aria-pressed="false">إخفاء المعنى</button>
      <button class="btn soft sm" id="playAll">▶ ${T("اسمع","اسمعي")} الكل</button>
    </div>
    <p class="hint">${T("اضغط","اضغطي")} على أي كلمة ${T("لتسمع","لتسمعي")} نطقها.</p>
    <div class="words" id="cards">${u.words.map((w,i)=>`<button class="word${w[2] ? "" : " noe"}${weak[w[0]] ? " weak" : ""}" data-i="${i}">
      ${w[2] ? `<span class="e" aria-hidden="true">${w[2]}</span>` : ""}<span class="w en">${esc(w[0])}</span><span class="m">${w[1]}</span></button>`).join("")}</div>
    <p class="hint center" id="none" hidden>لا توجد كلمة بهذا الاسم.</p>
    <div class="cta"><a class="btn block" href="#/u/${u.key}/cards" data-replace>التالي: بطاقات الحفظ</a></div></div>`, "page");
  bindBack("/u/"+u.key);
  const cards = $("#cards"), els = $$(".word", cards);
  els.forEach(c=>c.onclick = () => { els.forEach(x=>x.classList.remove("playing")); c.classList.add("playing"); say(u.words[c.dataset.i][0]); });
  $("#toggleAr").onclick = e => { const h = cards.classList.toggle("hide-ar"); e.target.textContent = h ? "إظهار المعنى" : "إخفاء المعنى"; e.target.setAttribute("aria-pressed", h); };
  const q = $("#q");
  if(q) q.oninput = () => { const v = q.value.trim().toLowerCase(); let n = 0;
    els.forEach(c=>{ const w = u.words[c.dataset.i], hit = !v || w[0].toLowerCase().includes(v) || w[1].includes(v); c.hidden = !hit; if(hit) n++; });
    $("#none").hidden = n>0; };
  let timer = null; const btn = $("#playAll"), label = btn.textContent;
  const stop = () => { clearTimeout(timer); timer = null; hush(); btn.textContent = label; els.forEach(x=>x.classList.remove("playing")); };
  btn.onclick = () => {
    if(timer) return stop();
    btn.textContent = "■ إيقاف"; const list = els.filter(c=>!c.hidden); let i = 0;
    (function step(){ els.forEach(x=>x.classList.remove("playing"));
      if(i>=list.length) return stop();
      list[i].classList.add("playing"); list[i].scrollIntoView({block:"center", behavior: reducedMotion() ? "auto" : "smooth"});
      say(u.words[list[i].dataset.i][0]); i++; timer = setTimeout(step, store.slow ? 2400 : 1800); })();
  };
  onLeave(()=>clearTimeout(timer));
}

/* ---------- GRAMMAR ---------- */
function screenGrammar(u){
  markSeen(u.key, "grammar");
  show(`${topPage("القاعدة", `<span class="en">${esc(u.en)}</span>`)}
    <div style="--c:var(--c${u.c})" class="stack">${u.grammar.map(gr=>{
      let table = "";
      if(gr.table){ const en = gr.table.en||[]; table = `<div class="gtable"><table><thead><tr>${gr.table.head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${
        gr.table.rows.map(r=>`<tr>${r.map((c,i)=>`<td${en.includes(i) ? ' class="en"' : ''}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
      return `<article class="card gblock"><h2>${gr.t}</h2><p>${gr.p}</p>${table}
        <div class="ex">${gr.ex.map(x=>`<div class="exrow">${speakBtn(x[0])}<span class="en">${esc(x[0])}</span><span class="tr">${x[1]}</span></div>`).join("")}</div></article>`;
    }).join("")}
    <div class="cta"><a class="btn block" href="#/u/${u.key}/gquiz" data-replace>${T("جاهز؟ ابدأ","جاهزة؟ ابدئي")} تحدي القواعد</a></div></div>`, "page");
  bindBack("/u/"+u.key); bindSay(view);
}

/* ---------- REVIEW ---------- */
function screenReview(){
  const g = gradeById(store.grade); if(!g) return replace("/grades");
  const weak = weakWords(g), all = gradeWords(g);
  const unitOf = {}; g.units.forEach(u=>u.words.forEach(w=>{ if(!unitOf[w[0]]) unitOf[w[0]] = u; }));
  show(`${topTabs("المراجعة")}
    <div class="stack">
    <a class="rcard${weak.length ? "" : " off"}" ${weak.length ? 'href="#/review/weak"' : ""} style="--c:var(--c1)">
      <span class="r-pic" aria-hidden="true">💪</span>
      <span class="c-body"><b>كلماتي الصعبة</b><span>${weak.length ? `${weak.length} ${weak.length>2 && weak.length<11 ? "كلمات" : "كلمة"} تحتاج تمريناً` : "لا توجد كلمات صعبة الآن. ممتاز! 🎉"}</span></span>
      ${weak.length ? `<span class="pill">${T("تمرّن","تمرّني")}</span>` : ""}</a>
    <a class="rcard" href="#/review/quick" style="--c:var(--c5)">
      <span class="r-pic" aria-hidden="true">⚡</span>
      <span class="c-body"><b>مراجعة سريعة</b><span>١٠ أسئلة من الوحدات التي ${T("درستها","درستِها")}</span></span><span class="chev">${ICON.go}</span></a>
    <a class="rcard" href="#/big" style="--c:var(--c2)">
      <span class="r-pic" aria-hidden="true">🏆</span>
      <span class="c-body"><b class="en">The Big Challenge</b><span>التحدي الكبير لكل وحدات ${g.ar}</span></span>${starRow(bigStars(g),3)}</a>
    <h2 class="section">قاموسي <small>${all.length} كلمة في ${g.ar}</small></h2>
    <label class="search">${ICON.search}<input id="q" type="search" placeholder="${T("ابحث","ابحثي")} بالإنجليزي أو بالعربي…" autocomplete="off" aria-label="بحث في القاموس"></label>
    <div class="dict" id="dict"></div></div>`, "tabs", "review");
  const dict = $("#dict"), q = $("#q");
  const row = w => `<button class="drow" data-say="${esc(w[0])}"><span class="say sm" aria-hidden="true">${ICON.speak}</span>
    <span class="en">${esc(w[0])}</span><span class="m">${w[1]}</span><small class="en">${unitOf[w[0]].label}</small></button>`;
  const paint = () => { const v = q.value.trim().toLowerCase();
    const list = v ? all.filter(w=>w[0].toLowerCase().includes(v) || w[1].includes(v)).slice(0,40) : (weak.length ? weak : all).slice(0,8);
    dict.innerHTML = list.length ? (v ? "" : `<p class="hint">${weak.length ? "كلماتك الصعبة:" : "أمثلة من كلمات الصف:"}</p>`) + list.map(row).join("") : `<p class="hint center">لا توجد نتائج.</p>`;
    bindSay(dict); };
  q.oninput = paint; paint();
}

/* ---------- AWARDS ---------- */
function screenAwards(){
  const g = gradeById(store.grade), got = BADGES.filter(b=>b.ok());
  newBadges();
  show(`${topTabs("إنجازاتي")}
    <div class="stack">
    <div class="stats">
      <div class="stat"><span aria-hidden="true">⭐</span><b>${totalStars()}</b><small>نجمة</small></div>
      <div class="stat"><span aria-hidden="true">🔥</span><b>${streak()}</b><small>أيام متتالية</small></div>
      <div class="stat"><span aria-hidden="true">⚡</span><b>${store.xp}</b><small>نقطة</small></div>
      <div class="stat"><span aria-hidden="true">🏅</span><b>${got.length}</b><small>وسام</small></div>
    </div>
    ${g ? `<div class="card"><div class="split"><b>تقدمي في ${g.ar}</b><span class="count" dir="ltr"><i>★</i> ${gradeStars(g)} / ${gradeMax(g)}</span></div>${bar(gradeStars(g), gradeMax(g))}</div>` : ""}
    <h2 class="section">الأوسمة <small>${got.length} من ${BADGES.length}</small></h2>
    <div class="badges">${BADGES.map(b=>`<div class="badge${b.ok() ? " on" : ""}"><span aria-hidden="true">${b.icon}</span><b>${b.ar}</b><small>${b.sub}</small></div>`).join("")}</div></div>`, "tabs", "awards");
}

/* ---------- PROFILE ---------- */
let installEvent = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvent = e; const b = $("#install"); if(b) b.hidden = false; });
function screenMe(){
  const g = gradeById(store.grade);
  const seg = (name, opts, cur) => `<div class="seg" role="group">${opts.map(o=>`<button type="button" data-set="${name}" data-v="${o[0]}" aria-pressed="${String(o[0])===String(cur)}">${o[1]}</button>`).join("")}</div>`;
  show(`${topTabs("حسابي")}
    <div class="stack">
    <section class="card profile">
      <div class="avatar xl">${store.avatar}</div>
      <form id="nameForm" class="row"><input class="input" id="nameIn" placeholder="${T("اكتب اسمك","اكتبي اسمك")}" value="${esc(store.name)}" maxlength="20" autocomplete="off" aria-label="الاسم">
        <button class="btn sm" type="submit">حفظ</button></form>
      <div class="avatars">${AVATARS.map(a=>`<button type="button" class="avatar${a===store.avatar ? " on" : ""}" data-av="${a}" aria-label="صورة ${a}">${a}</button>`).join("")}</div>
    </section>
    <section class="card settings">
      <div class="set"><span>أنا</span>${seg("gender", [["m","طالب"],["f","طالبة"]], store.gender)}</div>
      <a class="set link" href="#/grades"><span>صفّي</span><b>${g ? g.ar : "—"} <span class="chev">${ICON.go}</span></b></a>
      <div class="set"><span>هدفي اليومي</span>${seg("goal", [[30,"خفيف 30"],[50,"عادي 50"],[100,"قوي 100"]], store.goal)}</div>
    </section>
    <section class="card settings">
      <div class="set"><span>المظهر</span>${seg("theme", [["auto","تلقائي"],["light","فاتح ☀️"],["dark","داكن 🌙"]], store.theme)}</div>
      <div class="set"><span>المؤثرات الصوتية</span>${seg("sound", [[true,"تشغيل"],[false,"إيقاف"]], store.sound)}</div>
      <div class="set"><span>سرعة النطق</span>${seg("slow", [[false,"عادية"],[true,"بطيئة 🐢"]], store.slow)}</div>
    </section>
    <button class="btn block" id="install" ${installEvent ? "" : "hidden"}>📲 تثبيت التطبيق على الجهاز</button>
    <button class="btn ghost block danger" id="reset">مسح كل التقدّم</button>
    <p class="foot">تقدّمك محفوظ على هذا الجهاز فقط، ولا نجمع أي بيانات.</p></div>
    <dialog id="confirm"><form method="dialog" class="stack center"><span class="dlg-pic" aria-hidden="true">🗑️</span><b>مسح كل النجوم والنقاط؟</b>
      <p class="hint">لا يمكن التراجع عن هذه الخطوة.</p>
      <div class="row"><button class="btn ghost" value="no">إلغاء</button><button class="btn danger" value="yes">نعم، امسح</button></div></form></dialog>`, "tabs", "me");
  $$("[data-av]").forEach(b=>b.onclick = () => { store.avatar = b.dataset.av; save(); screenMe(); });
  $("#nameForm").onsubmit = e => { e.preventDefault(); store.name = $("#nameIn").value.trim(); save(); toast(store.name ? "أهلاً يا "+store.name+"!" : "تم الحفظ"); };
  $$("[data-set]").forEach(b=>b.onclick = () => { const k = b.dataset.set, v = b.dataset.v;
    store[k] = k==="goal" ? +v : (k==="sound"||k==="slow") ? v==="true" : v; save(); applyTheme();
    if(k==="slow") say("Hello!"); if(k==="sound" && store.sound) sfx.ok();
    screenMe(); });
  $("#install").onclick = async () => { if(!installEvent) return; installEvent.prompt(); await installEvent.userChoice; installEvent = null; $("#install").hidden = true; };
  const dlg = $("#confirm");
  $("#reset").onclick = () => dlg.showModal();
  dlg.onclose = () => { if(dlg.returnValue==="yes"){ Object.assign(store, {stars:{}, seen:{}, weak:{}, xp:0, days:{}, badges:[]}); save(); toast("تم مسح التقدّم"); screenMe(); } };
}

/* ---------- ROUTER ---------- */
function route(){
  const st = history.state;
  if(st && typeof st.i === "number") navIndex = st.i;
  else { navIndex++; try{ history.replaceState({i:navIndex}, ""); }catch(e){} }

  if(!store.onboarded) return screenWelcome(store.gender ? (store.grade ? 3 : 2) : 1);
  let h = decodeURIComponent((location.hash||"").slice(1));
  const old = h.match(/^(g\d+)(?:-(.+))?$/);                 // links from the first website: #g4, #g4-u1, #g4-big
  if(old && gradeById(old[1])){ store.grade = old[1]; save();
    h = !old[2] ? "/" : old[2]==="big" ? "/big" : "/u/"+old[1]+"-"+old[2]; }
  const p = h.replace(/^\//,"").split("/");
  const g = gradeById(store.grade);
  if(p[0]==="u"){ const u = unitByKey(p[1]);
    if(u){ const act = p[2];
      if(!act) return screenUnit(u);
      if(act==="words") return screenWords(u);
      if(act==="grammar") return screenGrammar(u);
      if(PLAY[act]) return PLAY[act](u);
    } }
  if(p[0]==="grades") return screenGrades();
  if(p[0]==="review" && g){ if(p[1]==="weak") return startWeak(g); if(p[1]==="quick") return startQuick(g); return screenReview(); }
  if(p[0]==="big" && g) return startBig(g);
  if(p[0]==="awards") return screenAwards();
  if(p[0]==="me") return screenMe();
  screenHome();
}
