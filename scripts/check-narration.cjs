// فحص مكتبة النطق: node scripts/check-narration.cjs [--decode]
//  - كل عبارة في المنهج لها مدخل في audio/manifest.js، وكل ملف مذكور موجود وله رأس MP3 صحيح
//  - --decode: يفك ترميز كل ملف بـ ffprobe ويتأكد أن مدته معقولة (أبطأ)
//  - لا تكرار: عبارة واحدة = مفتاح واحد؛ الكلمات متعددة النطق لها مفاتيح بالمعنى ونطق مُراجَع
// يخرج برمز 1 عند أي خطأ. التحذيرات لا تُفشل الفحص.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const ctx = vm.createContext({});
ctx.globalThis = ctx;
vm.runInContext(fs.readFileSync(path.join(root, "audio", "manifest.js"), "utf8"), ctx);
const lib = ctx.NARRATION_AUDIO;
const entries = JSON.parse(execFileSync(process.execPath, [path.join(__dirname, "collect-narration.cjs")], { maxBuffer: 64 << 20 }));
const decode = process.argv.includes("--decode");

const errors = [], warnings = [];
const files = new Map();                 // path → keys
const isMp3 = buf => (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0);

const keys = new Set();
for (const e of entries) {
  if (keys.has(e.key)) errors.push(`duplicate key ${e.key}`);
  keys.add(e.key);
  const c = lib.clips[e.key];
  if (!c) { errors.push(`no recording for "${e.text}" (${e.key})`); continue; }
  const ids = typeof c === "string" ? { m: c, f: c } : { m: c[0], f: c[1] };
  for (const v of ["m", "f"]) {
    if (!ids[v]) { warnings.push(`no ${v} voice for ${e.key}`); continue; }
    if (!/^[a-f0-9]{16}$/.test(ids[v])) { errors.push(`bad file id ${ids[v]} for ${e.key}`); continue; }
    const p = path.join("audio", v, ids[v] + ".mp3");
    if (!files.has(p)) files.set(p, []);
    files.get(p).push(e.key);
  }
  if (e.pos && !e.arpabet) errors.push(`homograph without reviewed pronunciation: ${e.key}`);
}
for (const k of Object.keys(lib.clips)) if (!keys.has(k)) warnings.push(`manifest entry not in the curriculum: ${k}`);

let checked = 0;
for (const [p, ks] of files) {
  const abs = path.join(root, p);
  if (!fs.existsSync(abs)) { errors.push(`missing file ${p} (${ks[0]})`); continue; }
  const st = fs.statSync(abs);
  if (st.size < 1200) { errors.push(`empty or tiny file ${p} (${ks[0]})`); continue; }
  const fd = fs.openSync(abs, "r"); const head = Buffer.alloc(4); fs.readSync(fd, head, 0, 4, 0); fs.closeSync(fd);
  if (!isMp3(head)) errors.push(`not an MP3: ${p}`);
  if (decode) {
    try {
      const d = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", abs], { encoding: "utf8" }));
      if (!(d > 0.2 && d < 60)) errors.push(`unusual duration ${d}s: ${p} (${ks[0]})`);
    } catch (err) { errors.push(`cannot decode ${p}`); }
  }
  checked++;
}

/* كلمات متعددة النطق: كل معنى يحتاج تسجيلاً خاصاً */
const bySense = {};
for (const e of entries) if (e.pos) { const w = e.key.split("::")[0]; (bySense[w] = bySense[w] || []).push(e.key); }
for (const [w, ks] of Object.entries(bySense)) if (ks.length > 1) {
  const fileOf = k => JSON.stringify(lib.clips[k]);
  if (new Set(ks.map(fileOf)).size < ks.length) warnings.push(`"${w}" senses ${ks.join(" / ")} share one recording — regenerate with the reviewed pronunciation`);
}
/* عبارات تتكرر في عدة أنشطة تُستخدم بتسجيل واحد */
const shared = entries.filter(e => e.kinds.length > 1 || e.grades.length > 1).length;

console.log(`${entries.length} phrases · ${checked} files checked${decode ? " (decoded)" : ""} · ${shared} phrases reused across activities or grades`);
for (const w of warnings.slice(0, 15)) console.log("warning: " + w);
if (warnings.length > 15) console.log(`… ${warnings.length - 15} more warnings`);
if (errors.length) { for (const e of errors.slice(0, 30)) console.error("ERROR: " + e); console.error(`${errors.length} errors`); process.exit(1); }
console.log("narration library OK");
