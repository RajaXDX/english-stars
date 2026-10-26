/* ===== Data normalisation ===== */
const STAGES = [
  {id:"p", ar:"المرحلة الابتدائية", en:"Primary", c:2},
  {id:"m", ar:"المرحلة المتوسطة", en:"Intermediate", c:5},
  {id:"s", ar:"المرحلة الثانوية", en:"Secondary", c:3}
];
GRADES.sort((a,b)=>a.n-b.n);
GRADES.forEach(g=>{
  g.units.forEach((u,i)=>{
    u.c = (i % 5) + 1;
    u.key = g.id + "-" + u.id;
    u.words = u.words.map(w => typeof w === "string" ? w.split("|") : w).map(w => [w[0], w[1], w[2]||""]);
    u.quiz = u.quiz.map(q => typeof q === "string" ? q.split("|") : q);
  });
});
const gradeById = id => GRADES.find(g=>g.id===id);

/* ===== helpers ===== */
const $ = s => document.querySelector(s);
const app = $("#app");
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a; };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const ACT = {words:"الكلمات", grammar:"القاعدة", wquiz:"تحدي الكلمات", spell:"التهجئة", gquiz:"تحدي القواعد"};
const SCORED = ["wquiz","spell","gquiz"];

/* ===== storage (per-device convenience; page works without it) ===== */
let store = {name:"", gender:"", grade:"", stars:{}};
try{
  const s = JSON.parse(localStorage.getItem("nujoom-v2")||"null");
  if(s) store = Object.assign(store, s);
  else {
    const old = JSON.parse(localStorage.getItem("nujoom-v1")||"null");   // grade-4-only first version
    if(old){ store.name = old.name||""; store.gender = "f"; store.grade = "g4";
      for(const k in (old.stars||{})) store.stars["g4-"+k] = old.stars[k]; }
  }
}catch(e){}
const save = () => { try{ localStorage.setItem("nujoom-v2", JSON.stringify(store)); }catch(e){} };
const getStars = (key, act) => (store.stars[key]||{})[act]||0;
const unitStars = key => SCORED.reduce((n,a)=>n+getStars(key,a),0);
const gradeStars = g => g.units.reduce((n,u)=>n+unitStars(u.key),0) + getStars(g.id+"-all","wquiz");
const gradeMax = g => g.units.length*9 + 3;
function setStars(key, act, n){ store.stars[key] = store.stars[key]||{}; if(n > (store.stars[key][act]||0)){ store.stars[key][act]=n; save(); } updateTotal(); }
function updateTotal(){ let t=0; for(const u in store.stars) for(const a in store.stars[u]) t+=store.stars[u][a]; $("#totalStars").textContent=t; }
const starsHtml = (n,max) => "<b>"+"★".repeat(n)+"</b>"+"★".repeat(Math.max(0,max-n));

/* gendered wording: T("للطالب","للطالبة") */
const T = (m,f) => store.gender==="f" ? f : m;

/* ===== speech ===== */
let voice = null;
function pickVoice(){
  if(!("speechSynthesis" in window)) return;
  const vs = speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
  const pref = ["Samantha","Google US English","Microsoft Aria","Microsoft Jenny","Microsoft Guy","Zira","Karen","Daniel","Alex"];
  voice = vs.find(v=>pref.some(p=>v.name.includes(p))) || vs.find(v=>/en[-_]US/i.test(v.lang)) || vs[0] || null;
}
if("speechSynthesis" in window){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text, rate){
  if(!("speechSynthesis" in window)){ toast("الصوت غير متاح في هذا المتصفح"); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/___/g,"").replace(/\(.*?\)/g,""));
  u.lang = "en-US"; u.rate = rate||0.85; if(voice) u.voice = voice;
  speechSynthesis.speak(u);
}
const hush = () => { if("speechSynthesis" in window) speechSynthesis.cancel(); };

/* ===== sound effects ===== */
let actx=null;
function beep(ok){
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    const notes = ok ? [659,880] : [300,220];
    notes.forEach((f,i)=>{ const o=actx.createOscillator(), g=actx.createGain(), t0=actx.currentTime+i*.12; o.type="sine"; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.18,t0+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+.2);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0+.22); });
  }catch(e){}
}
let toastT;
function toast(msg){ let t=$(".toast"); if(!t){ t=document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); document.body.appendChild(t); } t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true, 2200); }

/* ===== confetti ===== */
function confetti(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cv=$("#confetti"), ctx=cv.getContext("2d"); cv.hidden=false; cv.width=innerWidth; cv.height=innerHeight;
  const cs=getComputedStyle(document.documentElement); const cols=["--c1","--c2","--c3","--c4","--c5","--sun"].map(v=>cs.getPropertyValue(v).trim());
  const ps=Array.from({length:120},()=>({x:Math.random()*cv.width, y:-20-Math.random()*cv.height*.5, vx:(Math.random()-.5)*3, vy:2+Math.random()*3, r:Math.random()*6, s:5+Math.random()*6, c:cols[Math.floor(Math.random()*cols.length)], star:Math.random()<.3}));
  let f=0; (function draw(){ ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.r+=.1; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c;
      if(p.star){ ctx.font=(p.s*2.4)+"px sans-serif"; ctx.fillText("★",0,0);} else ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); ctx.restore(); });
    if(++f<170) requestAnimationFrame(draw); else { ctx.clearRect(0,0,cv.width,cv.height); cv.hidden=true; } })();
}

function setHash(h){ try{ history.replaceState(null,"", h ? "#"+h : location.pathname+location.search); }catch(e){} }
function setFoot(g){
  $("#foot").innerHTML = g && g.book
    ? `محتوى ${g.ar} مبني على كلمات وقواعد كتاب <span class="en">${esc(g.book)}</span>. ${T("اضغط","اضغطي")} على أي كلمة ${T("لتسمع","لتسمعي")} نطقها.`
    : g ? `محتوى ${g.ar} مبني على مستوى الصف في المنهج السعودي. ${T("اضغط","اضغطي")} على أي كلمة ${T("لتسمع","لتسمعي")} نطقها.`
    : "تعلّم الإنجليزي بالصوت والصورة، واجمع النجوم في التحديات.";
}

/* ===== GENDER GATE ===== */
function renderGate(){
  hush(); setHash(""); setFoot(null);
  app.innerHTML = `<section class="gate">
    <h2>أهلاً وسهلاً في نجوم الإنجليزي!</h2>
    <p>قبل ما نبدأ، من أنت؟</p>
    <div class="pick">
      <button data-g="m"><span aria-hidden="true">👦</span>طالب</button>
      <button data-g="f"><span aria-hidden="true">👧</span>طالبة</button>
    </div></section>`;
  app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ store.gender=b.dataset.g; save(); renderHome(); });
}

/* ===== HOME: grade picker ===== */
function renderHome(){
  if(!store.gender) return renderGate();
  hush(); setHash(""); setFoot(null);
  const name = store.name;
  const last = gradeById(store.grade);
  const gcard = g => { const st = STAGES.find(s=>s.id===g.stage);
    return `<button class="unit grade" style="--c:var(--c${st.c});--t:var(--t${st.c})" data-grade="${g.id}">
      <span class="num">${g.n<=6 ? g.n : g.n<=9 ? g.n-6 : g.n-9}</span>
      <span class="ar">${g.ar}</span>
      ${g.book ? `<span class="badge en">${esc(g.book)}</span>` : ""}
      <span class="sub">${g.units.length} وحدات · ${gradeStars(g)} من ${gradeMax(g)} ★</span></button>`; };
  app.innerHTML = `<div class="wrap">
    <section class="hello">
      <div><h2>${name ? "أهلاً يا "+esc(name)+"!" : T("أهلاً يا بطل!","أهلاً يا بطلة!")}</h2>
      <p>${T("اختر صفك","اختاري صفك")}، ${T("وتعلّم","وتعلّمي")} كلمات كل وحدة وقاعدتها، ثم ${T("اجمع","اجمعي")} النجوم في التحديات.</p></div>
      <form class="namebox" id="nameForm">
        <label for="nameIn" hidden>الاسم</label>
        <input id="nameIn" placeholder="${T("اكتب اسمك","اكتبي اسمك")}" value="${esc(name)}" maxlength="20" autocomplete="off">
        <button class="btn" type="submit">${name ? "تغيير" : "حفظ"}</button>
        <div class="seg" role="group" aria-label="طالب أو طالبة">
          <button type="button" data-g="m" aria-pressed="${store.gender==="m"}">طالب</button>
          <button type="button" data-g="f" aria-pressed="${store.gender==="f"}">طالبة</button>
        </div>
      </form>
    </section>
    ${last ? `<div class="row" style="justify-content:flex-start"><button class="btn" id="resume">${T("كمّل","كمّلي")} في ${last.ar} ←</button></div>` : ""}
    ${STAGES.map(s=>`<div class="part-label">${s.ar} <small class="en">${s.en}</small></div>
      <div class="grid grades">${GRADES.filter(g=>g.stage===s.id).map(gcard).join("")}</div>`).join("")}
  </div>`;
  app.querySelectorAll("[data-grade]").forEach(b=>b.onclick=()=>openGrade(b.dataset.grade));
  app.querySelectorAll(".seg [data-g]").forEach(b=>b.onclick=()=>{ store.gender=b.dataset.g; save(); renderHome(); });
  const r = $("#resume"); if(r) r.onclick = () => openGrade(last.id);
  $("#nameForm").onsubmit = e => { e.preventDefault(); store.name = $("#nameIn").value.trim(); save(); renderHome(); toast(store.name ? "أهلاً يا "+store.name+"!" : "تم الحفظ"); };
}

/* ===== GRADE: unit list ===== */
function openGrade(gid){
  const g = gradeById(gid); if(!g) return renderHome();
  hush(); store.grade = g.id; save(); setHash(g.id); setFoot(g);
  const card = u => `<button class="unit" style="--c:var(--c${u.c});--t:var(--t${u.c})" data-unit="${u.id}">
      ${u.pic ? `<span class="pic" aria-hidden="true">${u.pic}</span>` : ""}
      <span class="num">${esc(u.num)}</span>
      <h3>${esc(u.en)}</h3><span class="ar">${u.ar}</span>
      <span class="stars" aria-label="${unitStars(u.key)} من 9 نجمات">${starsHtml(unitStars(u.key),9)}</span></button>`;
  const parts = [...new Set(g.units.map(u=>u.part||0))];
  const partName = p => p===1 ? "الجزء الأول" : p===2 ? "الجزء الثاني" : "";
  app.innerHTML = `<div class="wrap">
    <div class="bar"><button class="back" id="back">→ كل الصفوف</button></div>
    <section class="hello"><div><h2>${g.ar}</h2>
      <p>${g.book ? `كتاب <span class="en">${esc(g.book)}</span> · ` : ""}${g.units.length} وحدات · ${gradeStars(g)} من ${gradeMax(g)} نجمة</p></div></section>
    ${parts.map(p=>`${partName(p) ? `<div class="part-label">${partName(p)} <small class="en">Part ${p}</small></div>` : ""}
      <div class="grid">${g.units.filter(u=>(u.part||0)===p).map(card).join("")}</div>`).join("")}
    <div class="grid">
      <button class="unit big" style="--c:var(--brand);--t:var(--sun-soft)" id="bigBtn">
        <div style="display:flex;flex-direction:column;gap:4px"><h3 style="text-align:right">The Big Challenge</h3><span class="ar">التحدي الكبير: كلمات من كل وحدات ${g.ar}</span></div>
        <span class="stars">${starsHtml(getStars(g.id+"-all","wquiz"),3)}</span></button>
    </div></div>`;
  $("#back").onclick = renderHome;
  $("#bigBtn").onclick = () => startBig(g);
  app.querySelectorAll("[data-unit]").forEach(b=>b.onclick=()=>openUnit(g.id, b.dataset.unit, "words"));
  window.scrollTo({top:0});
}

/* ===== UNIT ===== */
function openUnit(gid, uid, tab){
  const g = gradeById(gid); const u = g && g.units.find(x=>x.id===uid); if(!u) return renderHome();
  hush(); setHash(u.key); setFoot(g);
  const tabs = Object.keys(ACT).map(k=>`<button class="tab" role="tab" aria-selected="${k===tab}" data-tab="${k}">${ACT[k]}${SCORED.includes(k)?` <span class="mini">${"★".repeat(getStars(u.key,k))}</span>`:""}</button>`).join("");
  app.innerHTML = `<div class="wrap" style="--c:var(--c${u.c});--t:var(--t${u.c})">
    <div class="bar"><button class="back" id="back">→ وحدات ${g.ar}</button></div>
    <section class="uhead"><span class="num">${esc(u.num)}</span><div style="min-width:0"><h2>${esc(u.en)}</h2><p>${u.ar}</p></div></section>
    <nav class="tabs" role="tablist">${tabs}</nav>
    <section id="pane"></section></div>`;
  $("#back").onclick = () => openGrade(g.id);
  app.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>openUnit(g.id, u.id, b.dataset.tab));
  ({words:paneWords, grammar:paneGrammar, wquiz:startWordQuiz, spell:startSpell, gquiz:startGrammarQuiz})[tab](u, g);
  window.scrollTo({top:0});
}
function paneWords(u){
  const p = $("#pane");
  p.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px">
    <div class="tools"><p class="hint">${T("اضغط","اضغطي")} على البطاقة ${T("لتسمع","لتسمعي")} الكلمة. ${T("جرّب","جرّبي")} إخفاء المعنى ${T("واختبر","واختبري")} نفسك.</p>
      <div class="row"><button class="btn ghost" id="toggleAr">إخفاء المعنى</button><button class="btn" id="playAll">${T("اسمع","اسمعي")} الكل</button></div></div>
    <div class="cards" id="cards">${u.words.map((w,i)=>`<button class="card${w[2]?"":" noe"}" data-i="${i}">${w[2]?`<span class="e" aria-hidden="true">${w[2]}</span>`:""}<span class="w">${esc(w[0])}</span><span class="m">${w[1]}</span></button>`).join("")}</div></div>`;
  const cards = $("#cards");
  cards.querySelectorAll(".card").forEach(c=>c.onclick=()=>{ cards.querySelectorAll(".playing").forEach(x=>x.classList.remove("playing")); c.classList.add("playing"); say(u.words[c.dataset.i][0], .8); });
  $("#toggleAr").onclick = e => { const h = cards.classList.toggle("hide-ar"); e.target.textContent = h ? "إظهار المعنى" : "إخفاء المعنى"; };
  let playing = null; const label = T("اسمع","اسمعي")+" الكل";
  $("#playAll").onclick = e => {
    if(playing){ clearTimeout(playing); playing=null; hush(); e.target.textContent=label; return; }
    e.target.textContent="إيقاف"; let i=0;
    const step = () => { const els=cards.querySelectorAll(".card"); els.forEach(x=>x.classList.remove("playing"));
      if(i>=u.words.length || !document.body.contains(cards)){ playing=null; e.target.textContent=label; return; }
      els[i].classList.add("playing"); els[i].scrollIntoView({block:"nearest", behavior:"smooth"}); say(u.words[i][0], .8); i++; playing=setTimeout(step, 1800); };
    step();
  };
}
function paneGrammar(u, g){
  $("#pane").innerHTML = `<div style="display:flex;flex-direction:column;gap:14px">${u.grammar.map(gr=>{
    let table = "";
    if(gr.table){ const en=gr.table.en||[]; table = `<div class="gtable"><table><thead><tr>${gr.table.head.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${
      gr.table.rows.map(r=>`<tr>${r.map((c,i)=>`<td${en.includes(i)?' class="en"':''}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
    return `<article class="gblock"><h3>${gr.t}</h3><p>${gr.p}</p>${table}
      <div class="ex">${gr.ex.map(x=>`<div class="exrow"><button class="say" data-say="${esc(x[0])}" aria-label="استماع">${SPK}</button><span class="en">${esc(x[0])}</span><span class="tr">${x[1]}</span></div>`).join("")}</div></article>`;
  }).join("")}
  <div class="row"><button class="btn" id="goQuiz">${T("جاهز؟ ابدأ","جاهزة؟ ابدئي")} تحدي القواعد</button></div></div>`;
  $("#pane").querySelectorAll("[data-say]").forEach(b=>b.onclick=()=>say(b.dataset.say, .8));
  $("#goQuiz").onclick = () => openUnit(g.id, u.id, "gquiz");
}

/* ===== generic quiz runner ===== */
function runQuiz({key, act, qs, render, again, home}){
  let i=0, score=0;
  const pane = $("#pane");
  function show(){
    if(i>=qs.length) return finish();
    pane.innerHTML = `<div class="play"><div class="prog"><span>${i+1} / ${qs.length}</span><div class="track"><div class="fill" style="width:${(i/qs.length)*100}%"></div></div><span class="star">★ ${score}</span></div><div id="qbody" style="display:contents"></div></div>`;
    render(qs[i], $("#qbody"), ok => { if(ok) score++; beep(ok); setTimeout(()=>{ if(document.body.contains(pane)){ i++; show(); } }, ok ? 1100 : 2100); });
  }
  function finish(){
    const pct = score/qs.length, st = pct>=.9?3:pct>=.7?2:pct>=.4?1:0;
    setStars(key, act, st);
    const msg = st===3 ? T("ممتاز! أنت نجم","ممتاز! أنتِ نجمة") : st===2 ? T("رائع! أحسنت","رائع! أحسنتِ")
      : st===1 ? T("جيد! حاول مرة ثانية لتحصل على نجوم أكثر","جيد! حاولي مرة ثانية لتحصلي على نجوم أكثر") : T("لا بأس، راجع الكلمات وحاول من جديد","لا بأس، راجعي الكلمات وحاولي من جديد");
    pane.innerHTML = `<div class="play result"><h2>${msg}${store.name? "، "+esc(store.name):""}</h2>
      <div class="bigstars" aria-label="${st} من 3 نجمات">${starsHtml(st,3)}</div>
      <p style="margin:0;font-weight:700">إجابات صحيحة: ${score} من ${qs.length}</p>
      <div class="row"><button class="btn" id="again">${T("العب","العبي")} مرة ثانية</button><button class="btn ghost" id="toHome">رجوع للوحدات</button></div></div>`;
    $("#again").onclick = again; $("#toHome").onclick = home;
    if(st===3) confetti(); beep(st>=2);
    const tb = document.querySelector(`[data-tab="${act}"] .mini`); if(tb) tb.textContent = "★".repeat(getStars(key,act));
  }
  show();
}
function answerButtons(box, isRight, rightIdx, done, rightText){
  const btns = box.querySelectorAll(".opt"), fb = box.querySelector(".feedback");
  btns.forEach(b=>b.onclick=()=>{
    const j=+b.dataset.j, ok=isRight(j);
    btns.forEach(x=>x.disabled=true);
    b.classList.add(ok?"right":"wrong"); btns[rightIdx].classList.add("right");
    fb.className = "feedback "+(ok?"ok":"no");
    fb.innerHTML = ok ? shuffle([T("أحسنت!","أحسنتِ!"),"صح! رائع","ممتاز!","برافو!"])[0] : `الإجابة الصحيحة: <span class="en">${esc(rightText)}</span>`;
    done(ok);
  });
}

/* word quiz: picture → word, listen → choice, word → meaning, meaning → word */
function makeWordQs(pool, n){
  const picked = shuffle(pool).slice(0, n);
  return picked.map((w,k)=>{
    const hasPic = !!w[2];
    let type = hasPic ? ["pic","listen","meaning"][k%3] : ["meaning","listen","reverse"][k%3];
    let cands = pool.filter(x=>x[0]!==w[0] && x[1]!==w[1]);
    if(type!=="meaning" && type!=="reverse" && hasPic) cands = cands.filter(x=>x[2] && x[2]!==w[2]);
    if(cands.length<3){ type="meaning"; cands = pool.filter(x=>x[0]!==w[0] && x[1]!==w[1]); }
    return {type, w, opts:shuffle([w, ...shuffle(cands).slice(0,3)])};
  });
}
function renderWordQ(q, box, done){
  const w=q.w, picListen = q.type==="listen" && !!w[2];
  let head="", cls="";
  if(q.type==="pic"){ head=`<div class="q-ask">ما اسم هذه الصورة بالإنجليزي؟</div><div class="q-pic" aria-hidden="true">${w[2]}</div><div class="hint">${w[1]}</div>`; cls="en"; }
  if(q.type==="listen"){ head=`<div class="q-ask">${T("استمع واختر","استمعي واختاري")} ${picListen?"الصورة":"الكلمة"} الصحيحة</div><button class="bigsay" id="hear" aria-label="استماع للكلمة">${SPK}</button>`; cls=picListen?"emo":"en"; }
  if(q.type==="meaning"){ head=`<div class="q-ask">ما معنى هذه الكلمة؟</div><div class="q-word">${esc(w[0])}</div>`; }
  if(q.type==="reverse"){ head=`<div class="q-ask">كيف نقول هذا بالإنجليزي؟</div><div class="q-ar">${w[1]}</div>`; cls="en"; }
  const label = o => q.type==="pic"||q.type==="reverse" ? esc(o[0]) : q.type==="listen" ? (picListen?o[2]:esc(o[0])) : o[1];
  box.innerHTML = head + `<div class="opts">${q.opts.map((o,j)=>`<button class="opt ${cls}" data-j="${j}">${label(o)}</button>`).join("")}</div><div class="feedback" aria-live="polite"></div>`;
  if(q.type==="listen"||q.type==="meaning") setTimeout(()=>say(w[0]), 250);
  const h = box.querySelector("#hear"); if(h) h.onclick=()=>say(w[0]);
  const qw = box.querySelector(".q-word"); if(qw){ qw.style.cursor="pointer"; qw.onclick=()=>say(w[0]); }
  answerButtons(box, j=>q.opts[j][0]===w[0], q.opts.findIndex(o=>o[0]===w[0]), ok=>{ if(q.type!=="meaning" || ok) say(w[0]); done(ok); }, w[0]);
}
function startWordQuiz(u, g){
  runQuiz({key:u.key, act:"wquiz", qs:makeWordQs(u.words, Math.min(10,u.words.length)), render:renderWordQ,
    again:()=>openUnit(g.id,u.id,"wquiz"), home:()=>openGrade(g.id)});
}
function startBig(g){
  hush(); setHash(g.id+"-big"); setFoot(g);
  app.innerHTML = `<div class="wrap" style="--c:var(--brand);--t:var(--brand-soft)">
    <div class="bar"><button class="back" id="back">→ وحدات ${g.ar}</button></div>
    <section class="uhead"><span class="num">★</span><div><h2>The Big Challenge</h2><p>التحدي الكبير: ١٥ سؤالاً من كل وحدات ${g.ar}</p></div></section>
    <section id="pane"></section></div>`;
  $("#back").onclick = () => openGrade(g.id);
  runQuiz({key:g.id+"-all", act:"wquiz", qs:makeWordQs(g.units.flatMap(u=>u.words), 15), render:renderWordQ,
    again:()=>startBig(g), home:()=>openGrade(g.id)});
}

/* grammar quiz */
function startGrammarQuiz(u, g){
  const qs = shuffle(u.quiz).map(q=>({s:q[0], right:q[1], opts:shuffle(q.slice(1))}));
  runQuiz({key:u.key, act:"gquiz", qs, again:()=>openUnit(g.id,u.id,"gquiz"), home:()=>openGrade(g.id), render:(q, box, done)=>{
    const parts = q.s.split("___");
    box.innerHTML = `<div class="q-ask">${T("اختر","اختاري")} الإجابة المناسبة للفراغ</div>
      <div class="sentence">${esc(parts[0])}<span class="blank">&nbsp;</span>${esc(parts[1]||"")}</div>
      <div class="opts three">${q.opts.map((o,j)=>`<button class="opt en" data-j="${j}">${esc(o)}</button>`).join("")}</div><div class="feedback" aria-live="polite"></div>`;
    answerButtons(box, j=>q.opts[j]===q.right, q.opts.indexOf(q.right), ok=>{
      box.querySelector(".blank").textContent = q.right;
      say(q.s.replace("___", q.right), .85); done(ok);
    }, q.right);
  }});
}

/* spelling: letters only; spaces and hyphens shown as gaps */
function startSpell(u, g){
  const ok = w => /^[a-z][a-z \-]*$/i.test(w[0]) && w[0].replace(/[^a-z]/gi,"").length>=3 && w[0].replace(/[^a-z]/gi,"").length<=13;
  const qs = shuffle(u.words.filter(ok)).slice(0, 6);
  runQuiz({key:u.key, act:"spell", qs, again:()=>openUnit(g.id,u.id,"spell"), home:()=>openGrade(g.id), render:(w, box, done)=>{
    const word = w[0], target = word.replace(/[^a-z]/gi,"").toLowerCase();
    const letters = target.split("");
    let mix; do { mix = shuffle(letters); } while(mix.join("")===target && new Set(letters).size>1);
    let typed=[], tries=0, over=false;
    let slotHtml = ""; for(const ch of word){ slotHtml += /[a-z]/i.test(ch) ? `<span class="slot"></span>` : `<span class="gap"></span>`; }
    box.innerHTML = `<div class="q-ask">${T("رتّب","رتّبي")} الحروف ${T("لتكتب","لتكتبي")} الكلمة</div>
      ${w[2] ? `<div class="q-pic" aria-hidden="true" style="font-size:4rem">${w[2]}</div>` : ""}
      <div class="row" style="align-items:center"><span class="q-ar" style="font-size:1.4rem">${w[1]}</span><button class="say" id="hear" aria-label="استماع">${SPK}</button></div>
      <div class="slots" id="slots">${slotHtml}</div>
      <div class="tiles" id="tiles">${mix.map((l,j)=>`<button class="tile" data-j="${j}">${l}</button>`).join("")}</div>
      <div class="row"><button class="btn ghost" id="undo">مسح حرف</button><button class="btn ghost" id="hint">${T("ساعدني","ساعديني")}</button></div>
      <div class="feedback" aria-live="polite"></div>`;
    const slots=box.querySelector("#slots"), slotEls=[...slots.querySelectorAll(".slot")], tiles=[...box.querySelectorAll(".tile")], fb=box.querySelector(".feedback");
    box.querySelector("#hear").onclick=()=>say(word);
    setTimeout(()=>say(word), 250);
    const paint = () => slotEls.forEach((s,k)=>{ s.textContent = typed[k]!=null ? mix[typed[k]] : ""; s.classList.toggle("full", typed[k]!=null); });
    function check(){
      const guess = typed.map(j=>mix[j]).join("");
      if(guess===target){ over=true; slots.classList.add("ok"); fb.className="feedback ok"; fb.textContent = tries===0 ? "ممتاز! من أول مرة" : T("أحسنت!","أحسنتِ!"); say(word); tiles.forEach(t=>t.disabled=true); done(tries<2); return; }
      tries++; slots.classList.remove("no"); void slots.offsetWidth; slots.classList.add("no");
      if(tries>=3){ over=true; fb.className="feedback no"; fb.innerHTML=`الكلمة هي: <span class="en">${esc(word)}</span>`; slotEls.forEach((s,k)=>{s.textContent=target[k]; s.classList.add("full");}); tiles.forEach(t=>t.disabled=true); say(word); done(false); return; }
      beep(false); fb.className="feedback no"; fb.textContent = T("قريب! حاول مرة ثانية","قريبة! حاولي مرة ثانية"); typed=[]; tiles.forEach(t=>t.disabled=false); paint();
    }
    tiles.forEach(t=>t.onclick=()=>{ if(over) return; typed.push(+t.dataset.j); t.disabled=true; paint(); if(typed.length===letters.length) check(); });
    box.querySelector("#undo").onclick=()=>{ if(over||!typed.length) return; tiles[typed.pop()].disabled=false; paint(); };
    box.querySelector("#hint").onclick=()=>{ if(over) return;
      typed.forEach(j=>tiles[j].disabled=false);
      const keep=[]; for(let k=0;k<typed.length;k++){ if(mix[typed[k]]===target[k]) keep.push(typed[k]); else break; }
      const k = keep.length; if(k>=letters.length) return;
      keep.push(mix.findIndex((l,idx)=>l===target[k] && !keep.includes(idx)));
      typed = keep; typed.forEach(x=>tiles[x].disabled=true); tries = Math.max(tries,1); paint(); say(word);
      if(typed.length===letters.length) check(); };
  }});
}

/* ===== boot ===== */
$("#brandHome").onclick = renderHome;
updateTotal();
window.addEventListener("hashchange", route);
route();
function route(){
  const h = decodeURIComponent((location.hash||"").slice(1));
  if(!store.gender) return renderGate();
  const m = h.match(/^(g\d+)(?:-(.+))?$/);
  if(m && gradeById(m[1])){
    if(!m[2]) return openGrade(m[1]);
    if(m[2]==="big") return startBig(gradeById(m[1]));
    if(gradeById(m[1]).units.some(u=>u.id===m[2])) return openUnit(m[1], m[2], "words");
  }
  renderHome();
}
