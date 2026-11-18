/* توليد النطق بأصوات ElevenLabs بنفس أسماء ملفات js/voice.js.
   المفتاح يُقرأ من متغير البيئة ELEVENLABS_API_KEY فقط (لا يُكتب في أي ملف).

   node tools/eleven.mjs --count                 عدد النصوص والحروف فقط (بدون مفتاح)
   node tools/eleven.mjs --voice m --limit 10    تجربة 10 مقاطع
   node tools/eleven.mjs --voice f               الكل (يتخطى الموجود، فيكمل من حيث توقف)
   الخيارات: --out <مجلد> (الافتراضي .eleven/)  --model <id>  --id <voice_id> */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] ?? true); };

/* الأصوات المختارة (أصوات ElevenLabs الجاهزة، أمريكية واضحة) */
const VOICES = { m: { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" }, f: { id: "EXAVITQu4vr4xnJCdOVK", name: "Sarah" } };
const MODEL = arg("model", "eleven_multilingual_v2");

/* ---- نفس البصمة في js/voice.js ---- */
const enc = new TextEncoder();
const norm = t => String(t).replace(/___/g, " ").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
function fnv(str, basis) { let h = basis >>> 0; for (const b of enc.encode(str)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }
const fileId = t => { const k = norm(t).toLowerCase(); return fnv(k, 0x811c9dc5) + fnv(k, 0x050c5d1f); };

/* ---- جمع كل النصوص المنطوقة ---- */
function collect() {
  const grades = [];
  const ctx = vm.createContext({ GRADE: g => grades.push(g) });
  for (let i = 1; i <= 12; i++) vm.runInContext(fs.readFileSync(path.join(ROOT, "data", `g${i}.js`), "utf8"), ctx);
  const map = new Map();
  const add = t => { const n = norm(t); if (n) { const id = fileId(n); if (!map.has(id)) map.set(id, n); } };
  for (const g of grades) for (const u of g.units || []) {
    for (const w of u.words || []) add(String(w).split("|")[0]);
    for (const gr of u.grammar || []) for (const x of gr.ex || []) add(x[0]);
    for (const q of u.quiz || []) { const [s, right] = String(q).split("|"); add(s.replace("___", right)); }
  }
  return map;
}

const texts = collect();
const chars = [...texts.values()].reduce((a, t) => a + t.length, 0);
if (arg("count")) { console.log(`${texts.size} نص، ${chars} حرف لكل صوت`); process.exit(0); }

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY غير موجود"); process.exit(1); }
const vk = arg("voice", "m");
const voiceId = arg("id", VOICES[vk]?.id);
if (!voiceId) { console.error("--voice m أو f"); process.exit(1); }
const outDir = path.resolve(ROOT, arg("out", ".eleven"), vk);
fs.mkdirSync(outDir, { recursive: true });

const todo = [...texts].filter(([id]) => !fs.existsSync(path.join(outDir, id + ".mp3")));
const limit = Number(arg("limit", 0)) || todo.length;
const jobs = todo.slice(0, limit);
const need = jobs.reduce((a, [, t]) => a + t.length, 0);

/* التحقق من الرصيد قبل البدء */
const sub = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": KEY } });
if (sub.ok) {
  const s = await sub.json();
  const left = s.character_limit - s.character_count;
  console.log(`الخطة: ${s.tier} — المتبقي ${left} حرف، المطلوب ${need}`);
  if (need > left && !arg("force")) { console.error("الرصيد لا يكفي. أوقفت قبل البدء."); process.exit(2); }
} else console.log("تعذّر قراءة الرصيد:", sub.status);

console.log(`الصوت ${VOICES[vk]?.name || voiceId} — ${jobs.length} مقطع → ${outDir}`);
let done = 0, failed = 0;
async function one([id, text]) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`, {
      method: "POST",
      headers: { "xi-api-key": KEY, "Content-Type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL, language_code: MODEL.includes("multilingual_v2") ? undefined : "en",
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0, use_speaker_boost: true, speed: 0.95 } })
    });
    if (r.ok) { fs.writeFileSync(path.join(outDir, id + ".mp3"), Buffer.from(await r.arrayBuffer())); done++; return; }
    const body = await r.text();
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 2000 * attempt)); continue; }
    if (r.status === 401 || /quota|credits/i.test(body)) { console.error(`\nتوقف: ${r.status} ${body.slice(0, 200)}`); process.exit(3); }
    console.error(`\nفشل "${text}": ${r.status} ${body.slice(0, 150)}`); failed++; return;
  }
  failed++;
}
const CONC = Number(arg("conc", 3));
let i = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (i < jobs.length) { const j = jobs[i++]; await one(j); if ((done + failed) % 50 === 0) process.stdout.write(`\r${done + failed}/${jobs.length}`); }
}));
console.log(`\nتم: ${done}، فشل: ${failed}`);
