// يجمع كل النصوص المنطوقة من ملفات المنهج نفسها (data/g1–g12.js) — لا توجد قائمة كلمات منفصلة.
// الناتج JSON مرتّب بالمفتاح: [{key, text, file, legacy, pos, arpabet, kinds, grades}]
//   key      مفتاح التسجيل (NarrationText.key)        text    النص كما يُنطق (NarrationText.spoken)
//   file     اسم الملف المطلوب: NarrationText.fileId(key) + ".mp3"
//   legacy   اسم التسجيل القديم لنفس النص (قبل المفاتيح)، لقراءة التسجيلات الحالية
//   pos      نوع الكلمة متعددة النطق (v/n/a) أو null
//   arpabet  نطق مُراجَع بصيغة CMU ARPAbet للكلمات متعددة النطق، لوسم <phoneme> عند التوليد
//   kinds    word | example | quiz | ui               grades الصفوف التي يظهر فيها
// الاستخدام: node scripts/collect-narration.cjs [--stats]
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const NT = require("../js/narration-text.js");

const root = path.join(__dirname, "..");
const grades = [];
const context = vm.createContext({ GRADE: g => grades.push(g) });
for (let n = 1; n <= 12; n++) {
  vm.runInContext(fs.readFileSync(path.join(root, "data", `g${n}.js`), "utf8"), context);
}

/* نطق مُراجَع للكلمات المفردة متعددة النطق (يطابق المعنى في المنهج) */
const ARPABET = {
  "close::v": "K L OW1 Z", "close::a": "K L OW1 S", "live::v": "L IH1 V", "live::a": "L AY1 V",
  "wind::n": "W IH1 N D", "wind::v": "W AY1 N D", "read::v": "R IY1 D", "wound::n": "W UW1 N D",
  "desert::n": "D EH1 Z ER0 T", "graduate::v": "G R AE1 JH UW0 EY2 T", "graduate::n": "G R AE1 JH UW0 AH0 T",
  "produce::v": "P R AH0 D UW1 S", "conduct::v": "K AH0 N D AH1 K T", "import::v": "IH0 M P AO1 R T",
  "estimate::v": "EH1 S T AH0 M EY2 T", "transport::v": "T R AE0 N S P AO1 R T", "extract::v": "IH0 K S T R AE1 K T",
  "reject::v": "R IH0 JH EH1 K T", "refund::n": "R IY1 F AH0 N D", "suspect::n": "S AH1 S P EH0 K T",
  "content::n": "K AA1 N T EH0 N T", "conflict::n": "K AA1 N F L IH0 K T", "survey::n": "S ER1 V EY0",
  "discount::n": "D IH1 S K AW0 N T", "impact::n": "IH1 M P AE0 K T", "subject::n": "S AH1 B JH IH0 K T",
  "address::n": "AE1 D R EH0 S", "console::n": "K AA1 N S OW0 L", "deliberate::a": "D IH0 L IH1 B ER0 AH0 T"
};

const clips = new Map();
let refs = 0;
function add(value, meaning, gid, kind) {
  const key = NT.key(value, meaning);
  if (!key || !/[a-z]/i.test(key)) return;
  refs++;
  const e = clips.get(key) || { key, text: NT.spoken(value, kind === "word"), file: NT.fileId(key) + ".mp3",
    legacy: NT.legacyId(value) + ".mp3", pos: NT.sense(value, meaning), kinds: new Set(), grades: new Set() };
  e.kinds.add(kind); e.grades.add(gid);
  clips.set(key, e);
}

for (const g of grades) for (const u of g.units) {
  for (const w of u.words) {
    const [en, ar] = typeof w === "string" ? w.split("|") : w;
    add(en, ar, g.id, "word");
  }
  for (const rule of u.grammar || []) for (const ex of rule.ex || []) add(ex[0], null, g.id, "example");
  for (const q of u.quiz || []) {
    const [s, right] = typeof q === "string" ? q.split("|") : q;
    add(s.replace("___", right), null, g.id, "quiz");
  }
}
/* نصوص الواجهة التي تُنطق (زر «جرّب الصوت») */
add("Hello! Welcome to English Stars.", null, "ui", "ui");

const out = [...clips.values()]
  .map(e => ({ key: e.key, text: e.text, file: e.file, legacy: e.legacy, pos: e.pos,
    arpabet: e.pos ? (ARPABET[e.key] || null) : null, kinds: [...e.kinds].sort(), grades: [...e.grades].sort() }))
  .sort((a, b) => a.key.localeCompare(b.key));

const missing = out.filter(e => e.pos && !e.arpabet).map(e => e.key);
if (missing.length) { console.error("Homographs without a reviewed pronunciation: " + missing.join(", ")); process.exit(1); }
if (process.argv.includes("--stats")) {
  console.error(`${refs} references → ${out.length} unique recordings`);
}
process.stdout.write(JSON.stringify(out, null, 1));
