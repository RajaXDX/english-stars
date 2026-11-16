/* ============================================================
   core.js — lesson data, saved progress, sounds and small helpers.
   Everything here is shared by the screens (ui.js) and the games (play.js).
   ============================================================ */
"use strict";

/* ---------- lesson data (filled by data/g*.js through GRADE()) ---------- */
const STAGES = [
  {id:"p", ar:"المرحلة الابتدائية", en:"Primary"},
  {id:"m", ar:"المرحلة المتوسطة", en:"Intermediate"},
  {id:"s", ar:"المرحلة الثانوية", en:"Secondary"}
];
const COLORS = 6;                       // number of accent colours in app.css (--c1 … --c6)

GRADES.sort((a,b)=>a.n-b.n);
GRADES.forEach(g=>{
  g.short = g.n<=6 ? g.n : g.n<=9 ? g.n-6 : g.n-9;          // grade number inside its stage
  g.units.forEach((u,i)=>{
    u.c = (i % COLORS) + 1;
    u.key = g.id + "-" + u.id;
    u.grade = g;
    u.pic = u.pic || "📘";
    u.label = /^\d+$/.test(u.num) ? "Unit " + u.num : u.num==="W" ? "Welcome" : "Intro";
    u.words = u.words.map(w => typeof w === "string" ? w.split("|") : w).map(w => [w[0], w[1], w[2]||""]);
    u.quiz = u.quiz.map(q => typeof q === "string" ? q.split("|") : q);
  });
});
const gradeById = id => GRADES.find(g=>g.id===id);
const unitByKey = key => { for(const g of GRADES){ const u = g.units.find(x=>x.key===key); if(u) return u; } return null; };
const gradeWords = g => { const seen = new Set(), out = [];
  g.units.forEach(u=>u.words.forEach(w=>{ const k = w[0].toLowerCase(); if(!seen.has(k)){ seen.add(k); out.push(w); } }));
  return out; };

/* ---------- activities ----------
   Each unit is a short path of 7 steps. "learn" steps are ticked once opened/finished,
   "play" steps give up to 3 stars each. */
const STEPS = [
  {id:"words",   kind:"learn", icon:"📖", ar:"الكلمات",        sub:"كلمات الوحدة بالصوت والصورة"},
  {id:"cards",   kind:"learn", icon:"🃏", ar:"بطاقات الحفظ",    sub:"قلب البطاقة واختبار الذاكرة"},
  {id:"wquiz",   kind:"play",  icon:"🎯", ar:"تحدي الكلمات",    sub:"أسئلة بالصورة والصوت والمعنى"},
  {id:"match",   kind:"play",  icon:"🧩", ar:"لعبة التوصيل",    sub:"توصيل كل كلمة بمعناها"},
  {id:"spell",   kind:"play",  icon:"🔤", ar:"التهجئة",         sub:"ترتيب الحروف لكتابة الكلمة"},
  {id:"grammar", kind:"learn", icon:"💡", ar:"القاعدة",         sub:"شرح مبسّط مع أمثلة"},
  {id:"gquiz",   kind:"play",  icon:"🏆", ar:"تحدي القواعد",    sub:"إكمال الجملة بالكلمة المناسبة"}
];
const SCORED = STEPS.filter(s=>s.kind==="play").map(s=>s.id);
const stepById = id => STEPS.find(s=>s.id===id);
const UNIT_MAX = SCORED.length * 3;

/* ---------- helpers ---------- */
const $ = (s, root) => (root||document).querySelector(s);
const $$ = (s, root) => [...(root||document).querySelectorAll(s)];
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a; };
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clamp = (n,a,b) => Math.max(a, Math.min(b, n));
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- saved progress (this device only) ---------- */
const STORE_KEY = "nujoom-v2";          // same key as the first website, so nobody loses their stars
let store = {name:"", gender:"", grade:"", avatar:"🌟", stars:{}, seen:{}, weak:{}, xp:0, days:{}, goal:50,
             theme:"auto", sound:true, slow:false, badges:[], onboarded:false};
try{
  const s = JSON.parse(localStorage.getItem(STORE_KEY)||"null");
  if(s){ store = Object.assign(store, s); if(s.gender && s.onboarded===undefined) store.onboarded = true; }
  else {
    const old = JSON.parse(localStorage.getItem("nujoom-v1")||"null");   // grade-4-only first version
    if(old){ store.name = old.name||""; store.gender = "f"; store.grade = "g4"; store.onboarded = true;
      for(const k in (old.stars||{})) store.stars["g4-"+k] = old.stars[k]; }
  }
}catch(e){}
const save = () => { try{ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }catch(e){} };

/* gendered wording: T("للطالب","للطالبة") */
const T = (m,f) => store.gender==="f" ? f : m;

/* stars */
const getStars = (key, act) => (store.stars[key]||{})[act]||0;
const unitStars = key => SCORED.reduce((n,a)=>n+getStars(key,a),0);
const bigStars = g => getStars(g.id+"-all","wquiz");
const gradeStars = g => g.units.reduce((n,u)=>n+unitStars(u.key),0) + bigStars(g);
const gradeMax = g => g.units.length*UNIT_MAX + 3;
const totalStars = () => { let t=0; for(const u in store.stars) for(const a in store.stars[u]) t+=store.stars[u][a]; return t; };
function setStars(key, act, n){ store.stars[key] = store.stars[key]||{}; if(n > (store.stars[key][act]||0)){ store.stars[key][act]=n; save(); } }

/* steps done in a unit */
const markSeen = (key, act) => { store.seen[key] = store.seen[key]||{}; if(!store.seen[key][act]){ store.seen[key][act]=1; save(); } };
const stepDone = (key, s) => s.kind==="play" ? getStars(key,s.id)>0 : !!(store.seen[key]||{})[s.id];
const unitDone = key => STEPS.filter(s=>stepDone(key,s)).length;
const nextStep = u => STEPS.find(s=>s.id!=="cards" && !stepDone(u.key,s)) || null;
function nextUp(g){                      // what the "continue" button should open
  for(const u of g.units){ const s = nextStep(u); if(s) return {u, s}; }
  return null;
}

/* difficult words: a wrong answer adds the word, two right answers remove it */
function markWord(gid, en, ok){
  const w = store.weak[gid] = store.weak[gid]||{};
  if(!ok) w[en] = 2; else if(w[en]){ if(--w[en] <= 0) delete w[en]; }
  save();
}
const weakWords = g => { const w = store.weak[g.id]||{}; return gradeWords(g).filter(x=>w[x[0]]); };

/* points, daily goal and streak */
const dayKey = d => { d = d||new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate()-n); return dayKey(d); };
const todayXP = () => store.days[dayKey()]||0;
function addXP(n){
  if(n<=0) return;
  store.xp += n; store.days[dayKey()] = todayXP() + n;
  const keys = Object.keys(store.days).sort(); while(keys.length>400) delete store.days[keys.shift()];
  save();
}
function streak(){                      // days in a row, counting today or (if not played yet) yesterday
  let n = 0, i = store.days[dayKey()] ? 0 : 1;
  while(store.days[daysAgo(i)]){ n++; i++; }
  return n;
}
const bestStreak = () => { let best=0, run=0, prev=null;
  Object.keys(store.days).sort().forEach(k=>{ const t = new Date(k+"T00:00").getTime(); run = prev!==null && Math.round((t-prev)/864e5)===1 ? run+1 : 1; prev=t; best=Math.max(best,run); });
  return best; };

/* badges — worked out from the saved progress */
const BADGES = [
  {id:"first",   icon:"⭐", ar:"أول نجمة",        sub:"الحصول على أول نجمة",                 ok:()=>totalStars()>=1},
  {id:"s10",     icon:"🌟", ar:"جامع النجوم",      sub:"جمع 10 نجوم",                  ok:()=>totalStars()>=10},
  {id:"s50",     icon:"💫", ar:"سماء مضيئة",       sub:"جمع 50 نجمة",                  ok:()=>totalStars()>=50},
  {id:"s100",    icon:"🌠", ar:"مجرّة كاملة",      sub:"جمع 100 نجمة",                 ok:()=>totalStars()>=100},
  {id:"perfect", icon:"👑", ar:"وحدة ذهبية",       sub:"كل نجوم وحدة واحدة",             ok:()=>GRADES.some(g=>g.units.some(u=>unitStars(u.key)===UNIT_MAX))},
  {id:"speller", icon:"🔤", ar:"بطل التهجئة",      sub:"3 نجوم في التهجئة لثلاث وحدات",   ok:()=>Object.values(store.stars).filter(s=>s.spell===3).length>=3},
  {id:"grammar", icon:"💡", ar:"خبير القواعد",     sub:"3 نجوم في القواعد لثلاث وحدات",   ok:()=>Object.values(store.stars).filter(s=>s.gquiz===3).length>=3},
  {id:"big",     icon:"🏆", ar:"التحدي الكبير",    sub:"3 نجوم في التحدي الكبير",        ok:()=>GRADES.some(g=>bigStars(g)===3)},
  {id:"goal",    icon:"🎯", ar:"هدف اليوم",        sub:"تحقيق الهدف اليومي",               ok:()=>Object.values(store.days).some(x=>x>=store.goal)},
  {id:"d3",      icon:"🔥", ar:"ثلاثة أيام",       sub:"التعلّم 3 أيام متتالية",           ok:()=>bestStreak()>=3},
  {id:"d7",      icon:"🚀", ar:"أسبوع كامل",       sub:"التعلّم 7 أيام متتالية",           ok:()=>bestStreak()>=7},
  {id:"xp1000",  icon:"💎", ar:"ألف نقطة",         sub:"جمع 1000 نقطة",                ok:()=>store.xp>=1000}
];
function newBadges(){                   // badges earned since the last check
  const fresh = BADGES.filter(b=>!store.badges.includes(b.id) && b.ok());
  if(fresh.length){ store.badges.push(...fresh.map(b=>b.id)); save(); }
  return fresh;
}

/* ---------- theme ---------- */
function applyTheme(){
  const r = document.documentElement;
  if(store.theme==="auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", store.theme);
  const m = $('meta[name="theme-color"]'); if(m) m.content = getComputedStyle(r).getPropertyValue("--bg").trim();
}

/* ---------- speech ---------- */
/* Inside the iPhone/Android app (Capacitor) we use the phone's own speech engine,
   because Android's in-app browser has no speechSynthesis. On the website we use the browser's. */
const NATIVE = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const nativeTTS = NATIVE && Capacitor.Plugins ? Capacitor.Plugins.TextToSpeech : null;
const canSpeak = "speechSynthesis" in window;
let voice = null;
function pickVoice(){
  const vs = speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));
  const pref = ["Samantha","Google US English","Microsoft Aria","Microsoft Jenny","Microsoft Guy","Zira","Karen","Daniel","Alex"];
  voice = vs.find(v=>pref.some(p=>v.name.includes(p))) || vs.find(v=>/en[-_]US/i.test(v.lang)) || vs[0] || null;
}
if(canSpeak){ pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text){
  const clean = String(text).replace(/___/g,"").replace(/\(.*?\)/g,"");
  if(nativeTTS){ nativeTTS.speak({text:clean, lang:"en-US", rate: store.slow ? .6 : .95}).catch(()=>{}); return; }
  if(!canSpeak){ toast("الصوت غير متاح في هذا المتصفح"); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "en-US"; u.rate = store.slow ? .65 : .88; if(voice) u.voice = voice;
  speechSynthesis.speak(u);
}
const hush = () => { if(nativeTTS) nativeTTS.stop().catch(()=>{}); else if(canSpeak) speechSynthesis.cancel(); };

/* ---------- sound effects ---------- */
let actx = null;
function tone(notes, gap, len){
  if(!store.sound) return;
  try{
    actx = actx || new (window.AudioContext||window.webkitAudioContext)();
    notes.forEach((f,i)=>{ const o=actx.createOscillator(), g=actx.createGain(), t0=actx.currentTime+i*gap; o.type="sine"; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.16,t0+.02); g.gain.exponentialRampToValueAtTime(.0001,t0+len);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0+len+.02); });
  }catch(e){}
}
const sfx = {
  ok:   () => tone([659,880], .11, .2),
  no:   () => { tone([300,220], .12, .2); try{ navigator.vibrate && navigator.vibrate(40); }catch(e){} },
  tap:  () => tone([520], 0, .08),
  win:  () => tone([523,659,784,1047], .12, .28)
};

/* ---------- toast ---------- */
let toastT;
function toast(msg){
  let t = $(".toast");
  if(!t){ t=document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(()=>t.hidden=true, 2600);
}

/* ---------- confetti ---------- */
let confettiRun = 0;
const stopConfetti = () => { confettiRun++; const cv = $("#confetti"); if(cv) cv.hidden = true; };
function confetti(){
  if(reducedMotion()) return;
  const run = ++confettiRun;
  const cv=$("#confetti"), ctx=cv.getContext("2d"); cv.hidden=false; cv.width=innerWidth; cv.height=innerHeight;
  const cs=getComputedStyle(document.documentElement); const cols=["--c1","--c2","--c3","--c4","--c5","--sun"].map(v=>cs.getPropertyValue(v).trim());
  const ps=Array.from({length:130},()=>({x:Math.random()*cv.width, y:-20-Math.random()*cv.height*.5, vx:(Math.random()-.5)*3, vy:2+Math.random()*3, r:Math.random()*6, s:5+Math.random()*6, c:cols[Math.floor(Math.random()*cols.length)], star:Math.random()<.3}));
  let f=0; (function draw(){
    if(run!==confettiRun) return;
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.r+=.1; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle=p.c;
      if(p.star){ ctx.font=(p.s*2.4)+"px sans-serif"; ctx.fillText("★",0,0);} else ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); ctx.restore(); });
    if(++f<180) requestAnimationFrame(draw); else cv.hidden=true; })();
}

/* ---------- icons & mascot ---------- */
const MASCOT = '<svg viewBox="0 0 100 100" class="mascot" aria-hidden="true"><path fill="#FFC21A" stroke="#E09A00" stroke-width="4" stroke-linejoin="round" d="M50 6l12.6 26.4 28.9 3.6-21.2 20 5.5 28.6L50 70.6 24.2 84.6l5.5-28.6-21.2-20 28.9-3.6z"/><ellipse cx="40" cy="45" rx="4.5" ry="6" fill="#2A2152"/><ellipse cx="60" cy="45" rx="4.5" ry="6" fill="#2A2152"/><circle cx="41.5" cy="43" r="1.6" fill="#fff"/><circle cx="61.5" cy="43" r="1.6" fill="#fff"/><circle cx="32" cy="55" r="4" fill="#FF7FA6" opacity=".7"/><circle cx="68" cy="55" r="4" fill="#FF7FA6" opacity=".7"/><path d="M41 56q9 9 18 0" fill="none" stroke="#2A2152" stroke-width="3.5" stroke-linecap="round"/></svg>';
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
  home:  svg('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>'),
  review:svg('<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>'),
  award: svg('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/>'),
  user:  svg('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5"/>'),
  back:  svg('<path d="M9 5l7 7-7 7"/>'),          // points "back" in a right-to-left page
  go:    svg('<path d="M15 5l-7 7 7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  search:svg('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>')
};
const AVATARS = ["🌟","🦊","🐼","🦁","🐯","🐨","🦄","🐬","🦅","🐢","🚀","⚽","🎮","🎨","📚","🌙"];
const starRow = (n, max) => `<span class="stars" aria-label="${n} من ${max} نجوم">${"<i class='on'>★</i>".repeat(n)}${"<i>★</i>".repeat(Math.max(0,max-n))}</span>`;
