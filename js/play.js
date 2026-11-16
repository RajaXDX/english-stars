/* ============================================================
   play.js — the full-screen activities: word quiz, matching game,
   spelling, grammar quiz, flashcards, and the review challenges.
   ============================================================ */
"use strict";

const PRAISE = () => shuffle([T("أحسنت!","أحسنتِ!"), "صح! رائع", "ممتاز!", "برافو!", "إجابة صحيحة!"])[0];

/* ---------- the session frame: close button, progress bar, question area, feedback sheet ---------- */
function openSession(ctx){
  show(`<div class="session" style="--c:var(--c${ctx.color||3})">
    <header class="s-top"><button class="icon-btn" id="sClose" aria-label="إغلاق">${ICON.close}</button>
      <div class="track" role="progressbar" aria-label="التقدّم" aria-valuemin="0" aria-valuemax="100"><i id="sFill"></i></div>
      <span class="s-score" aria-label="إجابات صحيحة"><span aria-hidden="true">✔</span> <b id="sScore">0</b></span></header>
    <main class="s-body" id="sBody"></main>
    <footer class="s-foot" id="sFoot" hidden></footer></div>`, "session");
  $("#sClose").onclick = () => back(ctx.exit);
  let keyFn = null;
  const onKey = e => { if(!keyFn || e.metaKey || e.ctrlKey || e.altKey) return;
    if((e.key==="Enter" || e.key===" ") && e.target.closest("button, a, input")) return;      // let the focused button handle it
    keyFn(e); };
  document.addEventListener("keydown", onKey);
  onLeave(()=>document.removeEventListener("keydown", onKey));
  const foot = $("#sFoot");
  return {
    body: $("#sBody"),
    alive: () => document.body.contains(foot),
    keys: fn => { keyFn = fn; },
    progress: p => { $("#sFill").style.width = clamp(p*100,0,100)+"%"; $(".track").setAttribute("aria-valuenow", Math.round(p*100)); },
    score: n => { $("#sScore").textContent = n; },
    /* slide-up sheet that says right / wrong and waits for "continue" */
    feedback(ok, html, next){
      foot.className = "s-foot " + (ok ? "ok" : "no"); foot.hidden = false;
      foot.innerHTML = `<div class="fb"><span class="fb-icon" aria-hidden="true">${ok ? "✔" : "✖"}</span><div class="fb-text" role="status">${html}</div></div>
        <button class="btn block ${ok ? "good" : "bad"}" id="sNext">متابعة</button>`;
      const btn = $("#sNext"); let used = false;
      const done = () => { if(used) return; used = true; keyFn = null; foot.hidden = true; hush(); next(); };
      btn.onclick = done; btn.focus({preventScroll:true});
      keyFn = e => { if(e.key==="Enter" || e.key===" "){ e.preventDefault(); done(); } };
    },
    hideTop(){ $(".s-top").hidden = true; foot.hidden = true; keyFn = null; }
  };
}

/* ---------- results screen ---------- */
function showResults(S, ctx, r){
  const before = todayXP();
  if(ctx.key && ctx.act) setStars(ctx.key, ctx.act, r.stars);
  addXP(r.xp);
  const hitGoal = before < store.goal && todayXP() >= store.goal;
  const fresh = newBadges();
  const u = ctx.u, next = u ? nextStep(u) : null;
  const msg = r.title || (r.stars===3 ? T("ممتاز! أنت نجم","ممتاز! أنتِ نجمة") : r.stars===2 ? T("رائع! أحسنت","رائع! أحسنتِ")
    : r.stars===1 ? T("جيد! تقدر تجيب نجوم أكثر","جيد! تقدرين تجيبين نجوم أكثر") : T("لا بأس، راجع وحاول من جديد","لا بأس، راجعي وحاولي من جديد"));
  S.hideTop();
  S.body.innerHTML = `<div class="result">
    ${r.stars>=2 || r.title ? MASCOT : `<span class="result-pic" aria-hidden="true">💪</span>`}
    <h1>${msg}${store.name ? "، "+esc(store.name) : ""}</h1>
    ${r.noStars ? "" : `<div class="bigstars" aria-label="${r.stars} من 3 نجوم">${[1,2,3].map(i=>`<i class="${i<=r.stars ? "on" : ""}" style="--d:${i*.18}s">★</i>`).join("")}</div>`}
    <div class="pills"><span class="rpill">${r.line}</span><span class="rpill xp"><bdi dir="ltr">+${r.xp}</bdi> نقطة</span></div>
    ${hitGoal ? `<div class="banner">🎯 حققت هدف اليوم!</div>` : ""}
    ${fresh.map(b=>`<div class="banner">${b.icon} وسام جديد: ${b.ar}</div>`).join("")}
    ${r.missed && r.missed.length ? `<div class="missed"><p class="hint">كلمات ${T("راجعها","راجعيها")}:</p>${r.missed.map(w=>`<button class="drow" data-say="${esc(w[0])}"><span class="say sm" aria-hidden="true">${ICON.speak}</span><span class="en">${esc(w[0])}</span><span class="m">${w[1]}</span></button>`).join("")}</div>` : ""}
    <div class="result-actions">
      ${next && next.id!==ctx.act ? `<button class="btn block" id="rNext">التالي: ${next.ar}</button>` : ""}
      <button class="btn block ${next && next.id!==ctx.act ? "soft" : ""}" id="rAgain">${T("العب","العبي")} مرة ثانية</button>
      <button class="btn block ghost" id="rExit">${u ? "رجوع للوحدة" : "رجوع"}</button>
    </div></div>`;
  bindSay(S.body);
  const n = $("#rNext"); if(n) n.onclick = () => replace("/u/"+u.key+"/"+next.id);
  $("#rAgain").onclick = ctx.again;
  $("#rExit").onclick = () => back(ctx.exit);
  window.scrollTo(0,0);
  if((r.stars===3 && !r.noStars) || hitGoal || fresh.length) confetti();
  if(r.stars>=2 || r.title) sfx.win(); else sfx.tap();
}

/* ---------- generic question runner ---------- */
function runQuiz(ctx, qs, render){
  const S = openSession(ctx);
  let i = 0, score = 0; const missed = [];
  (function ask(){
    if(!S.alive()) return;
    if(i >= qs.length){
      const pct = qs.length ? score/qs.length : 0, stars = pct>=.9 ? 3 : pct>=.7 ? 2 : pct>=.4 ? 1 : 0;
      return showResults(S, ctx, {stars, xp: score*3 + stars*5, line:`${score} من ${qs.length} صحيحة`, missed});
    }
    S.progress(i/qs.length); S.body.innerHTML = ""; S.keys(null);
    render(qs[i], S, (ok, info) => {
      if(ok){ score++; sfx.ok(); } else sfx.no();
      S.score(score); S.progress((i+1)/qs.length);
      if(info.word){ markWord(ctx.gid, info.word[0], ok); if(!ok && !missed.includes(info.word)) missed.push(info.word); }
      S.feedback(ok, ok ? `<b>${PRAISE()}</b>${info.note ? `<span>${info.note}</span>` : ""}` : `<b>الإجابة الصحيحة:</b><span>${info.answer}</span>`, () => { i++; ask(); });
    });
  })();
}
/* option buttons shared by the word and grammar quizzes (keys 1–4 work too) */
function bindOptions(S, rightIdx, done){
  const btns = $$(".opt", S.body); let used = false;
  const pick = j => { if(used || !btns[j]) return; used = true;
    const ok = j===rightIdx; btns.forEach(b=>b.disabled = true);
    btns[j].classList.add(ok ? "right" : "wrong"); btns[rightIdx].classList.add("right"); done(ok); };
  btns.forEach((b,j)=>b.onclick = () => pick(j));
  S.keys(e => { const n = "1234".indexOf(e.key); if(n>=0) pick(n); });
}

/* ---------- word questions: picture → word, listen → choice, word → meaning, meaning → word ---------- */
function makeWordQs(targets, pool){
  return targets.map((w,k)=>{
    const hasPic = !!w[2];
    let type = hasPic ? ["pic","listen","meaning"][k%3] : ["meaning","listen","reverse"][k%3];
    let cands = pool.filter(x=>x[0]!==w[0] && x[1]!==w[1]);
    if((type==="pic" || type==="listen") && hasPic){ const withPic = cands.filter(x=>x[2] && x[2]!==w[2]); if(withPic.length>=3) cands = withPic; else type = "meaning"; }
    return {type, w, opts: shuffle([w, ...shuffle(cands).slice(0,3)])};
  });
}
function renderWordQ(q, S, done){
  const w = q.w, picListen = q.type==="listen" && !!w[2];
  let head = "", cls = "";
  if(q.type==="pic"){ head = `<h2 class="q-ask">ما اسم هذه الصورة بالإنجليزي؟</h2><div class="q-pic" aria-hidden="true">${w[2]}</div><div class="q-sub">${w[1]}</div>`; cls = "en"; }
  if(q.type==="listen"){ head = `<h2 class="q-ask">${T("استمع واختر","استمعي واختاري")} ${picListen ? "الصورة" : "الكلمة"} الصحيحة</h2><button class="bigsay" id="hear" aria-label="استماع للكلمة">${ICON.speak}</button>`; cls = picListen ? "emo" : "en"; }
  if(q.type==="meaning"){ head = `<h2 class="q-ask">ما معنى هذه الكلمة؟</h2><button class="q-word en" id="hear">${esc(w[0])} <span class="say sm" aria-hidden="true">${ICON.speak}</span></button>`; }
  if(q.type==="reverse"){ head = `<h2 class="q-ask">كيف نقول هذا بالإنجليزي؟</h2><div class="q-ar">${w[1]}</div>`; cls = "en"; }
  const label = o => q.type==="pic" || q.type==="reverse" ? esc(o[0]) : q.type==="listen" ? (picListen ? o[2] : esc(o[0])) : o[1];
  S.body.innerHTML = `<div class="q">${head}<div class="opts${picListen ? " pics" : ""}">${q.opts.map((o,j)=>`<button class="opt ${cls}"><kbd>${j+1}</kbd>${label(o)}</button>`).join("")}</div></div>`;
  if(q.type==="listen" || q.type==="meaning") setTimeout(()=>{ if(S.alive()) say(w[0]); }, 300);
  const h = $("#hear"); if(h) h.onclick = () => say(w[0]);
  bindOptions(S, q.opts.indexOf(w), ok => { say(w[0]);
    done(ok, {word:w, note:`<span class="en">${esc(w[0])}</span> = ${w[1]}`, answer:`<span class="en">${esc(w[0])}</span> = ${w[1]}`}); });
}
function startWordQuiz(u){
  const ctx = {u, gid:u.grade.id, key:u.key, act:"wquiz", color:u.c, exit:"/u/"+u.key, again:()=>startWordQuiz(u)};
  runQuiz(ctx, makeWordQs(shuffle(u.words).slice(0,10), u.words), renderWordQ);
}
function startBig(g){
  const pool = gradeWords(g);
  runQuiz({gid:g.id, key:g.id+"-all", act:"wquiz", color:2, exit:"/", again:()=>startBig(g)}, makeWordQs(shuffle(pool).slice(0,15), pool), renderWordQ);
}
function startWeak(g){
  const weak = weakWords(g); if(!weak.length) return replace("/review");
  runQuiz({gid:g.id, color:1, exit:"/review", again:()=>startWeak(g)}, makeWordQs(shuffle(weak).slice(0,10), gradeWords(g)), renderWordQ);
}
function startQuick(g){
  let units = g.units.filter(u=>unitDone(u.key)>0); if(!units.length) units = g.units.slice(0,1);
  const pool = []; units.forEach(u=>u.words.forEach(w=>{ if(!pool.some(x=>x[0]===w[0])) pool.push(w); }));
  runQuiz({gid:g.id, color:5, exit:"/review", again:()=>startQuick(g)}, makeWordQs(shuffle(pool).slice(0,10), pool.length>=8 ? pool : gradeWords(g)), renderWordQ);
}

/* ---------- grammar quiz ---------- */
function startGrammarQuiz(u){
  const ctx = {u, gid:u.grade.id, key:u.key, act:"gquiz", color:u.c, exit:"/u/"+u.key, again:()=>startGrammarQuiz(u)};
  const qs = shuffle(u.quiz).map(q=>({s:q[0], right:q[1], opts:shuffle(q.slice(1))}));
  runQuiz(ctx, qs, (q, S, done) => {
    const parts = q.s.split("___");
    S.body.innerHTML = `<div class="q"><h2 class="q-ask">${T("اختر","اختاري")} الإجابة المناسبة للفراغ</h2>
      <p class="sentence en">${esc(parts[0])}<span class="blank">&nbsp;</span>${esc(parts[1]||"")}</p>
      <div class="opts one">${q.opts.map((o,j)=>`<button class="opt en"><kbd>${j+1}</kbd>${esc(o)}</button>`).join("")}</div></div>`;
    bindOptions(S, q.opts.indexOf(q.right), ok => {
      const full = q.s.replace("___", q.right);
      $(".blank", S.body).textContent = q.right; $(".blank", S.body).classList.add("filled"); say(full);
      done(ok, {answer:`<span class="en">${esc(full.replace(/\s*\(.*?\)/g,""))}</span>`});
    });
  });
}

/* ---------- spelling: letters only; spaces and hyphens are shown as gaps ---------- */
function startSpell(u){
  const ctx = {u, gid:u.grade.id, key:u.key, act:"spell", color:u.c, exit:"/u/"+u.key, again:()=>startSpell(u)};
  const fits = w => { const n = w[0].replace(/[^a-z]/gi,"").length; return /^[a-z][a-z \-]*$/i.test(w[0]) && n>=3 && n<=13; };
  runQuiz(ctx, shuffle(u.words.filter(fits)).slice(0,6), (w, S, done) => {
    const word = w[0], target = word.replace(/[^a-z]/gi,"").toLowerCase(), letters = target.split("");
    let mix; do { mix = shuffle(letters); } while(mix.join("")===target && new Set(letters).size>1);
    let typed = [], tries = 0, over = false;
    S.body.innerHTML = `<div class="q"><h2 class="q-ask">${T("رتّب","رتّبي")} الحروف ${T("لتكتب","لتكتبي")} الكلمة</h2>
      ${w[2] ? `<div class="q-pic sm" aria-hidden="true">${w[2]}</div>` : ""}
      <div class="row center"><span class="q-ar sm">${w[1]}</span><button class="say" id="hear" aria-label="استماع">${ICON.speak}</button></div>
      <div class="slots" id="slots" style="--n:${Math.max(...word.split(/[^a-z]+/i).map(x=>x.length))}">${word.split(/[^a-z]+/i).filter(Boolean).map(part=>`<span class="wgroup">${`<span class="slot"></span>`.repeat(part.length)}</span>`).join("")}</div>
      <div class="tiles">${mix.map(l=>`<button class="tile en">${l}</button>`).join("")}</div>
      <div class="row center"><button class="btn soft sm" id="undo">⌫ مسح حرف</button><button class="btn soft sm" id="hint">💡 ${T("ساعدني","ساعديني")}</button></div>
      <p class="q-note" id="note" role="status"></p></div>`;
    const slots = $("#slots"), slotEls = $$(".slot", slots), tiles = $$(".tile", S.body), note = $("#note");
    $("#hear").onclick = () => say(word);
    setTimeout(()=>{ if(S.alive()) say(word); }, 300);
    const paint = () => slotEls.forEach((s,k)=>{ s.textContent = typed[k]!=null ? mix[typed[k]] : ""; s.classList.toggle("full", typed[k]!=null); });
    const end = ok => { over = true; tiles.forEach(t=>t.disabled = true); say(word);
      if(!ok) slotEls.forEach((s,k)=>{ s.textContent = target[k]; s.classList.add("full"); }); else slots.classList.add("ok");
      done(ok, {word:w, note:`<span class="en">${esc(word)}</span> = ${w[1]}`, answer:`<span class="en">${esc(word)}</span> = ${w[1]}`}); };
    function check(){
      if(typed.map(j=>mix[j]).join("")===target) return end(tries<2);
      tries++; slots.classList.remove("no"); void slots.offsetWidth; slots.classList.add("no");
      if(tries>=3) return end(false);
      sfx.no(); note.textContent = T("قريب! حاول مرة ثانية","قريبة! حاولي مرة ثانية"); typed = []; tiles.forEach(t=>t.disabled = false); paint();
    }
    const put = j => { if(over || tiles[j].disabled) return; typed.push(j); tiles[j].disabled = true; note.textContent = ""; paint(); if(typed.length===letters.length) check(); };
    const undo = () => { if(over || !typed.length) return; tiles[typed.pop()].disabled = false; paint(); };
    tiles.forEach((t,j)=>t.onclick = () => put(j));
    $("#undo").onclick = undo;
    $("#hint").onclick = () => { if(over) return;
      typed.forEach(j=>tiles[j].disabled = false);
      const keep = []; for(let k=0;k<typed.length;k++){ if(mix[typed[k]]===target[k]) keep.push(typed[k]); else break; }
      const k = keep.length; if(k>=letters.length) return;
      keep.push(mix.findIndex((l,idx)=>l===target[k] && !keep.includes(idx)));
      typed = keep; typed.forEach(x=>tiles[x].disabled = true); tries = Math.max(tries,1); paint(); say(word);
      if(typed.length===letters.length) check(); };
    S.keys(e => { if(e.key==="Backspace"){ e.preventDefault(); return undo(); }
      const j = tiles.findIndex(t=>!t.disabled && t.textContent===e.key.toLowerCase()); if(j>=0) put(j); });
  });
}

/* ---------- matching game: tap a word, then its meaning ---------- */
function startMatch(u){
  const ctx = {u, gid:u.grade.id, key:u.key, act:"match", color:u.c, exit:"/u/"+u.key, again:()=>startMatch(u)};
  const S = openSession(ctx);
  const uniq = []; shuffle(u.words).forEach(w=>{ if(w[0].length<=22 && !uniq.some(x=>x[1]===w[1] || x[0]===w[0])) uniq.push(w); });
  const per = 5, rounds = Math.min(2, Math.floor(uniq.length/per)) || 1, total = Math.min(uniq.length, rounds*per);
  let round = 0, matched = 0, mistakes = 0; const missed = [];
  (function play(){
    if(!S.alive()) return;
    if(round >= rounds){
      const stars = mistakes<=1 ? 3 : mistakes<=3 ? 2 : mistakes<=6 ? 1 : 0;
      return showResults(S, ctx, {stars, xp: total*2 + stars*5, line: mistakes ? `${mistakes} ${mistakes>2 && mistakes<11 ? "أخطاء" : "خطأ"}` : "بدون أي خطأ!", missed});
    }
    const set = uniq.slice(round*per, round*per+per), left = shuffle(set), right = shuffle(set);
    S.body.innerHTML = `<div class="q"><h2 class="q-ask">${T("وصّل","وصّلي")} كل كلمة بمعناها</h2>
      <div class="match"><div class="mcol">${left.map(w=>`<button class="mtile en" data-side="a" data-w="${esc(w[0])}">${esc(w[0])}</button>`).join("")}</div>
      <div class="mcol">${right.map(w=>`<button class="mtile" data-side="b" data-w="${esc(w[0])}">${w[2] ? `<span aria-hidden="true">${w[2]}</span> ` : ""}${w[1]}</button>`).join("")}</div></div></div>`;
    let sel = null, done = 0;
    $$(".mtile", S.body).forEach(t=>t.onclick = () => {
      if(t.classList.contains("done")) return;
      if(t.dataset.side==="a") say(t.dataset.w);
      if(!sel || sel.dataset.side===t.dataset.side){ if(sel) sel.classList.remove("sel"); sel = sel===t ? null : t; if(sel) sel.classList.add("sel"); return; }
      const a = sel, b = t; sel = null; a.classList.remove("sel");
      const w = set.find(x=>x[0]===(a.dataset.side==="a" ? a : b).dataset.w);
      if(a.dataset.w===b.dataset.w){
        [a,b].forEach(x=>{ x.classList.add("done"); x.disabled = true; }); sfx.ok(); say(a.dataset.w);
        matched++; done++; S.score(matched); S.progress(matched/total); markWord(ctx.gid, w[0], true);
        if(done===set.length) setTimeout(()=>{ round++; play(); }, 700);
      } else {
        mistakes++; sfx.no(); markWord(ctx.gid, w[0], false); if(!missed.includes(w)) missed.push(w);
        [a,b].forEach(x=>{ x.classList.remove("bad"); void x.offsetWidth; x.classList.add("bad"); setTimeout(()=>x.classList.remove("bad"), 450); });
      }
    });
  })();
}

/* ---------- flashcards: flip, then "know it" or "again" ---------- */
function startCards(u){
  const ctx = {u, gid:u.grade.id, color:u.c, exit:"/u/"+u.key, again:()=>startCards(u)};
  const S = openSession(ctx);
  const queue = (u.words.length>20 ? shuffle(u.words) : u.words).slice(0,20).map(w=>({w, again:false})), first = queue.length;
  let seen = 0, known = 0;
  (function card(){
    if(!S.alive()) return;
    if(!queue.length){ markSeen(u.key, "cards");
      return showResults(S, ctx, {stars:3, noStars:true, title:T("أحسنت! أنهيت البطاقات","أحسنتِ! أنهيتِ البطاقات"), xp: Math.min(10, Math.ceil(first/2)), line:`${known} من ${first} ${T("تعرفها","تعرفينها")}`}); }
    const c = queue[0], w = c.w;
    S.progress(seen/(seen+queue.length)); S.score(known);
    S.body.innerHTML = `<div class="q"><h2 class="q-ask">${T("هل تعرف معنى الكلمة؟ اضغط البطاقة","هل تعرفين معنى الكلمة؟ اضغطي البطاقة")}</h2>
      <button class="flip" id="flip" aria-label="اقلب البطاقة"><span class="flip-in">
        <span class="face front">${w[2] ? `<span class="q-pic sm" aria-hidden="true">${w[2]}</span>` : ""}<span class="q-word en">${esc(w[0])}</span><small>${T("اضغط لترى المعنى","اضغطي لتري المعنى")}</small></span>
        <span class="face backf"><span class="q-ar">${w[1]}</span><span class="en">${esc(w[0])}</span></span></span></button>
      <div class="row center">${speakBtn(w[0])}</div>
      <div class="two"><button class="btn soft" id="no">🤔 أحتاج مراجعة</button><button class="btn good" id="yes">✔ أعرفها</button></div></div>`;
    bindSay(S.body); setTimeout(()=>{ if(S.alive()) say(w[0]); }, 250);
    const flip = () => $("#flip").classList.toggle("flipped");
    const move = ok => { queue.shift(); seen++;
      if(ok){ if(!c.again) known++; sfx.tap(); } else { markWord(ctx.gid, w[0], false); if(!c.again){ c.again = true; queue.push(c); } }
      card(); };
    $("#flip").onclick = flip; $("#yes").onclick = () => move(true); $("#no").onclick = () => move(false);
    S.keys(e => { if(e.key===" " || e.key==="Enter"){ e.preventDefault(); flip(); } if(e.key==="ArrowLeft") move(true); if(e.key==="ArrowRight") move(false); });
  })();
}

const PLAY = {cards:startCards, wquiz:startWordQuiz, match:startMatch, spell:startSpell, gquiz:startGrammarQuiz};
