/* الأسئلة ومشغّل التحديات (يستخدمه: الوحدة، التحدي الكبير، المراجعة) */
/* ============================================================
   الأسئلة
   ============================================================ */
/* أسئلة الصور للأشياء الملموسة فقط (حيوانات، أطعمة، أدوات، أماكن، ألوان).
   الأيقونات المجردة (وجوه المشاعر، أسهم، أرقام، أشخاص عامّون) تُسأل بالاستماع أو المعنى. */
const ABSTRACT_PIC = /^mdi:(emoticon|arrow|numeric|help|check|close|alert|thumb|hand-|gesture|repeat|sync|shuffle|plus|equal|cancel|skip|fast-forward|history|pause|star-four|shimmer|head-|sleep|chart|approximately|division|infinity|magnify|human|account|face-|heart|lightning|flash|weather-windy|arm-flex|incognito|domino|bullhorn|volume|new-box|tag|link|circle-multiple|clock|timer|calendar)/;
const isConcretePic = v => !!v && (v[0] === "#" || !ABSTRACT_PIC.test(v));
/* items: [{g,u,w}] */
function makeWordQs(g, items, n) {
  return shuffle(items).slice(0, n).map((it, k) => {
    const w = it.w, hasPic = isConcretePic(w[2]);
    let type = hasPic ? ["pic", "listen", "meaning"][k % 3] : ["meaning", "listen", "reverse"][k % 3];
    let cands = items.filter(x => x.w[0] !== w[0] && x.w[1] !== w[1]);
    if (type === "pic" || (type === "listen" && hasPic)) cands = cands.filter(x => isConcretePic(x.w[2]) && x.w[2] !== w[2]);
    if (cands.length < 3) { type = "meaning"; cands = items.filter(x => x.w[0] !== w[0] && x.w[1] !== w[1]); }
    const opts = shuffle([it, ...shuffle(cands).slice(0, 3)]);
    return { type, it, id: wordId(it.g, it.u, w), opts, picListen: type === "listen" && hasPic };
  });
}
function listenQs(g, u) {
  const items = u.words.map(w => ({ g, u, w }));
  return shuffle(items).slice(0, Math.min(8, items.length)).map(it => {
    const cands = items.filter(x => x.w[0] !== it.w[0]);
    return { type: "listen", it, id: wordId(g, u, it.w), opts: shuffle([it, ...shuffle(cands).slice(0, 3)]), picListen: false };
  });
}
function spellQs(g, u) {
  const ok = w => /^[a-z][a-z \-]*$/i.test(w[0]) && w[0].replace(/[^a-z]/gi, "").length >= 3 && w[0].replace(/[^a-z]/gi, "").length <= 13;
  return shuffle(u.words.filter(ok)).slice(0, 6).map(w => ({ type: "spell", it: { g, u, w }, id: wordId(g, u, w) }));
}

/* ============================================================
   مشغّل التحديات: مقدمة ← أسئلة مع تغذية راجعة ← نتيجة
   opts: {title, intro, qs, kind, unit, step, starKey, back, review}
   ============================================================ */
function runQuiz(pane, token, cfg) {
  const qs = cfg.qs;
  if (!qs.length) { pane.innerHTML = `<div class="card center"><p>لا توجد أسئلة كافية هنا.</p><a class="btn" href="#${cfg.back}">رجوع</a></div>`; return; }
  const best = cfg.starKey ? Store.getStars(cfg.starKey, cfg.step) : null;
  pane.innerHTML = `<section class="card intro center">
    <h1 class="h2">${cfg.title}</h1><p>${cfg.intro}</p>
    <ul class="facts"><li><b>${qs.length}</b> ${qs.length > 10 ? "سؤالاً" : "أسئلة"}</li>${cfg.starKey ? `<li>حتى <b>3</b> نجوم</li><li>${T("أفضل نتيجتك", "أفضل نتيجتك")}: ${starsHtml(best, 3)}</li>` : `<li>بدون نجوم، للتدريب</li>`}</ul>
    <button class="btn primary block" id="qStart">${T("ابدأ", "ابدئي")}</button></section>`;
  $("#qStart").onclick = () => play();
  focusMain();

  let i = 0, score = 0, finished = false;
  const misses = [];
  function play() {
    if (!alive(token)) return;
    if (i >= qs.length) return finish();
    const q = qs[i];
    pane.innerHTML = `<section class="card playc">
      <div class="prog"><span>${i + 1} / ${qs.length}</span><div class="bar"><i style="width:${i / qs.length * 100}%"></i></div><span class="star" aria-label="${score} إجابات صحيحة">★ ${score}</span></div>
      <div id="qbody" class="qbody"></div>
      <div class="feedback" id="fb" aria-live="assertive"></div>
      <button class="btn primary block" id="qNext" hidden>${i + 1 < qs.length ? "التالي" : "النتيجة"} ←</button></section>`;
    let answered = false;
    const answer = (ok, rightText) => {
      if (answered) return; answered = true;          // يمنع احتساب الإجابة مرتين
      if (ok) score++; else misses.push(q);
      Store.recordAnswer(ok);
      if (q.id) {
        if (cfg.review) Store.reviewResult(q.id, ok);
        else if (ok) Store.learnWord(q.id);
        else Store.addMistake(q.id);
      }
      beep(ok);
      const fb = $("#fb");
      fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = ok ? icon("check-bold") + " " + shuffle([T("أحسنت!", "أحسنتِ!"), "إجابة صحيحة!", "ممتاز!", "رائع!"])[0]
                        : `${icon("close-thick")} الإجابة الصحيحة: ${en(rightText)}`;
      const nb = $("#qNext"); nb.hidden = false; nb.focus({ preventScroll: true });
      nb.onclick = () => { i++; play(); };
    };
    renderQuestion(q, $("#qbody"), answer);
  }
  function finish() {
    if (finished) return; finished = true;
    const pct = score / qs.length, st = pct >= .9 ? 3 : pct >= .7 ? 2 : pct >= .4 ? 1 : 0;
    let res = null;
    if (cfg.starKey) res = Store.setStars(cfg.starKey, cfg.step, st);
    if (cfg.unit && cfg.step) Store.markDone(cfg.unit.u.key, cfg.step);
    else if (cfg.step === "big") Store.markDone(cfg.starKey, "wquiz");
    const msg = st === 3 ? T("ممتاز! أنت نجم", "ممتاز! أنتِ نجمة") : st === 2 ? T("رائع! أحسنت", "رائع! أحسنتِ") : st === 1 ? "بداية جيدة!" : "كل محاولة تعلّمك شيئاً";
    const name = Store.profile().name;
    const missList = misses.map(q => q.type === "gram"
      ? `<li><span class="en" lang="en" dir="ltr">${esc(q.s.replace("___", "[" + q.right + "]"))}</span></li>`
      : `<li>${sayButtons(q.it.w[0])}${en(q.it.w[0])}<span class="tr">${q.it.w[1]}</span></li>`).join("");
    const { g, u } = cfg.unit || {};
    pane.innerHTML = `<section class="card result center">${st >= 2 ? STAGE_LOGO[document.documentElement.dataset.stage || "p"] : ""}
      <h1 class="h2">${msg}${name ? "، " + esc(name) : ""}</h1>
      ${cfg.starKey ? `<div class="bigstars">${starsHtml(st, 3)}</div>` : ""}
      <p><b>${score}</b> من <b>${qs.length}</b> إجابات صحيحة</p>
      ${res ? (res.gained ? `<p class="pill good">+${res.gained} ${res.gained === 1 ? "نجمة جديدة" : "نجوم جديدة"}</p>` : res.before >= st && res.before ? `<p class="small muted">أفضل نتيجة لك ${res.best} نجوم. النجوم تُحتسب مرة واحدة لأفضل محاولة.</p>` : "") : ""}
      </section>
      ${misses.length ? `<section class="card"><h2 class="h3">${cfg.kind === "gram" ? "جمل تحتاج مراجعة" : "كلمات تحتاج مراجعة"}</h2><ul class="weak">${missList}</ul>
        ${cfg.kind !== "gram" && !cfg.review ? `<p class="small muted">${T("أضفناها", "أضفناها")} لقائمة المراجعة في الرئيسية.</p>` : ""}</section>` : ""}
      <div class="actions">
        <button class="btn ghost" id="again">إعادة المحاولة</button>
        ${u ? `<a class="btn ghost" href="#u/${g.id}/${u.id}">العودة للوحدة</a>` : `<a class="btn ghost" href="#${cfg.back}">رجوع</a>`}
        ${u ? nextLink(g, u, cfg.step) : ""}
      </div>`;
    wireSay(pane);
    $("#again").onclick = () => route();
    if (st === 3) confetti();
    beep(st >= 2);
    celebrateBadges();
    focusMain();
  }
}
function nextLink(g, u, step) {
  const order = ["listen", "wquiz", "spell", "gquiz", "summary"];
  let nx = order[order.indexOf(step) + 1];
  if (step === "listen") nx = Store.isDone(u.key, "grammar") ? "wquiz" : "grammar";
  return nx ? `<a class="btn primary" href="#${stepRoute(g, u, nx)}">التالي: ${STEP_META[nx].t} ←</a>` : "";
}

function renderQuestion(q, box, answer) {
  if (q.type === "gram") return qGram(q, box, answer);
  if (q.type === "spell") return qSpell(q, box, answer);
  const w = q.it.w;
  let head = "", labelOf;
  if (q.type === "pic") {
    head = `<p class="ask">ما اسم هذه الصورة بالإنجليزي؟</p><div class="qpic">${picHtml(w, "xl")}</div><p class="muted">${w[1]}</p>`;
    labelOf = o => en(o.w[0]);
  } else if (q.type === "listen") {
    head = `<p class="ask">${T("استمع واختر", "استمعي واختاري")} ${q.picListen ? "الصورة" : "الكلمة"} الصحيحة</p>
      <div class="listen"><button class="bigsay" id="hear" aria-label="استمع للكلمة">${ICON.speaker}</button><button class="say slow" id="hearSlow" aria-label="استمع ببطء">${ICON.slow}</button></div>`;
    labelOf = o => q.picListen ? picHtml(o.w, "opt-pic") : en(o.w[0]);
  } else if (q.type === "meaning") {
    head = `<p class="ask">ما معنى هذه الكلمة؟</p><div class="qword">${en(w[0])} ${sayButtons(w[0])}</div>`;
    labelOf = o => esc(o.w[1]);
  } else {
    head = `<p class="ask">كيف نقولها بالإنجليزي؟</p><p class="qar">${w[1]}</p>`;
    labelOf = o => en(o.w[0]);
  }
  box.innerHTML = head + `<div class="opts" role="group" aria-label="الخيارات">${q.opts.map((o, j) => `<button class="opt" data-j="${j}">${labelOf(o)}</button>`).join("")}</div>`;
  wireSay(box);
  const h = box.querySelector("#hear"), hs = box.querySelector("#hearSlow");
  if (h) { h.onclick = () => Speech.say(w[0]); hs.onclick = () => Speech.say(w[0], true); setTimeout(() => Speech.say(w[0]), 300); }
  const btns = [...box.querySelectorAll(".opt")], right = q.opts.findIndex(o => o.w[0] === w[0]);
  btns.forEach(b => b.onclick = () => {
    const ok = +b.dataset.j === right;
    btns.forEach(x => { x.disabled = true; });
    b.classList.add(ok ? "right" : "wrong"); btns[right].classList.add("right");
    b.setAttribute("aria-label", (ok ? "صحيح: " : "خطأ: ") + b.textContent);
    Speech.say(w[0]);
    answer(ok, w[0]);
  });
}
function qGram(q, box, answer) {
  const parts = q.s.split("___");
  box.innerHTML = `<p class="ask">${T("اختر", "اختاري")} الإجابة المناسبة للفراغ</p>
    <p class="sentence" lang="en" dir="ltr">${esc(parts[0])}<span class="blank" aria-label="فراغ">&nbsp;</span>${esc(parts[1] || "")}</p>
    <div class="opts three" role="group" aria-label="الخيارات">${q.opts.map((o, j) => `<button class="opt" data-j="${j}" lang="en" dir="ltr">${esc(o)}</button>`).join("")}</div>`;
  const btns = [...box.querySelectorAll(".opt")], right = q.opts.indexOf(q.right);
  btns.forEach(b => b.onclick = () => {
    const ok = +b.dataset.j === right;
    btns.forEach(x => x.disabled = true);
    b.classList.add(ok ? "right" : "wrong"); btns[right].classList.add("right");
    box.querySelector(".blank").textContent = q.right;
    Speech.say(q.s.replace("___", q.right));
    answer(ok, q.right);
  });
}
function qSpell(q, box, answer) {
  const word = q.it.w[0], target = word.replace(/[^a-z]/gi, "").toLowerCase(), letters = target.split("");
  let mix; do { mix = shuffle(letters); } while (mix.join("") === target && new Set(letters).size > 1);
  let typed = [], tries = 0, over = false;
  const slots = [...word].map(ch => /[a-z]/i.test(ch) ? `<span class="slot"></span>` : `<span class="gap"></span>`).join("");
  box.innerHTML = `<p class="ask">${T("رتّب", "رتّبي")} الحروف ${T("لتكتب", "لتكتبي")} الكلمة</p>
    ${q.it.w[2] ? `<div class="qpic">${picHtml(q.it.w, "lg")}</div>` : ""}
    <div class="qline"><span class="qar">${q.it.w[1]}</span>${sayButtons(word)}</div>
    <div class="slots" id="slots" dir="ltr" aria-label="الحروف المختارة" aria-live="polite">${slots}</div>
    <div class="tiles" id="tiles" dir="ltr" role="group" aria-label="الحروف">${mix.map((l, j) => `<button class="tile" data-j="${j}" aria-label="حرف ${l}">${l}</button>`).join("")}</div>
    <div class="actions tight"><button class="btn ghost sm" id="undo">مسح حرف</button><button class="btn ghost sm" id="hint">${T("ساعدني", "ساعديني")}</button></div>
    <p class="small muted" id="tries" aria-live="polite"></p>`;
  wireSay(box);
  setTimeout(() => Speech.say(word), 300);
  const slotsEl = box.querySelector("#slots"), slotEls = [...slotsEl.querySelectorAll(".slot")], tiles = [...box.querySelectorAll(".tile")];
  const paint = () => slotEls.forEach((s, k) => { s.textContent = typed[k] != null ? mix[typed[k]] : ""; s.classList.toggle("full", typed[k] != null); });
  function end(ok) {
    over = true; tiles.forEach(t => t.disabled = true);
    if (ok) slotsEl.classList.add("ok"); else slotEls.forEach((s, k) => { s.textContent = target[k]; s.classList.add("full"); });
    Speech.say(word); answer(ok, word);
  }
  function check() {
    if (typed.map(j => mix[j]).join("") === target) return end(tries < 2);
    tries++; slotsEl.classList.remove("shake"); void slotsEl.offsetWidth; slotsEl.classList.add("shake");
    if (tries >= 3) return end(false);
    box.querySelector("#tries").textContent = `${T("قريب! حاول", "قريبة! حاولي")} مرة ثانية (${3 - tries} ${3 - tries === 1 ? "محاولة" : "محاولات"})`;
    typed = []; tiles.forEach(t => t.disabled = false); paint();
  }
  tiles.forEach(t => t.onclick = () => { if (over) return; typed.push(+t.dataset.j); t.disabled = true; paint(); if (typed.length === letters.length) check(); });
  box.querySelector("#undo").onclick = () => { if (over || !typed.length) return; tiles[typed.pop()].disabled = false; paint(); };
  box.querySelector("#hint").onclick = () => {
    if (over) return;
    typed.forEach(j => tiles[j].disabled = false);
    const keep = []; for (let k = 0; k < typed.length; k++) { if (mix[typed[k]] === target[k]) keep.push(typed[k]); else break; }
    if (keep.length >= letters.length) return;
    keep.push(mix.findIndex((l, idx) => l === target[keep.length] && !keep.includes(idx)));
    typed = keep; typed.forEach(x => tiles[x].disabled = true); tries = Math.max(tries, 1); paint();
    if (typed.length === letters.length) check();
  };
}
