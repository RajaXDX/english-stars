// يجمع ملفات الموقع في www/ ليحزمها Capacitor داخل تطبيق iOS.
// الموقع نفسه لا يحتاج أي بناء؛ هذا نسخ فقط، وحاجز يمنع شحن ما لا يلزم
// (node_modules، ios، أدوات التوليد، .eleven وغيرها).
// التشغيل: node tools/build-www.cjs
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const www = path.join(root, "www");

// كل ملف/مجلد جديد يحتاجه الموقع يجب أن يُضاف هنا وإلا غاب عن التطبيق.
const FILES = ["index.html", "parent.html", "offline.html", "privacy.html", "manifest.webmanifest"];
const DIRS = ["css", "js", "data", "icons", "audio", "fonts"];
const SKIP = new Set([".DS_Store", "Thumbs.db", "desktop.ini", "voices.json"]);

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www);
let count = 0, bytes = 0;
const copy = (src, dst) => { fs.copyFileSync(src, dst); count++; bytes += fs.statSync(src).size; };

for (const d of DIRS) {
  const src = path.join(root, d);
  if (!fs.existsSync(src)) throw new Error("مجلد مفقود: " + d + (d === "fonts" ? " — شغّل node tools/fetch-fonts.cjs" : ""));
  (function walk(s, t) {
    fs.mkdirSync(t, { recursive: true });
    for (const e of fs.readdirSync(s, { withFileTypes: true })) {
      if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
      e.isDirectory() ? walk(path.join(s, e.name), path.join(t, e.name)) : copy(path.join(s, e.name), path.join(t, e.name));
    }
  })(src, path.join(www, d));
}

// الخطوط من fonts/ بدل Google: التطبيق لا يطلب شيئاً من الشبكة.
const FONT_LINKS = /\s*<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>|<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">/g;
for (const f of FILES) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) throw new Error("ملف مفقود: " + f);
  let s = fs.readFileSync(src, "utf8");
  if (f.endsWith(".html")) {
    s = s.replace(FONT_LINKS, m => m.includes("css2") ? '<link rel="stylesheet" href="fonts/fonts.css">' : "");
    if (/fonts\.(googleapis|gstatic)\.com/.test(s)) throw new Error("بقي رابط خطوط خارجي في " + f);
    // كل ملف يشير إليه الـHTML يجب أن يكون داخل الحزمة
    for (const [, ref] of s.matchAll(/(?:src|href)="([^"#:]+)"/g))
      if (!fs.existsSync(path.join(www, ref)) && !FILES.includes(ref)) throw new Error(`${f} يشير إلى ${ref} وهو غير موجود في www/`);
  }
  fs.writeFileSync(path.join(www, f), s); count++; bytes += Buffer.byteLength(s);
}

// لا أسرار ولا ملفات توليد داخل الحزمة
const banned = [];
(function scan(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, e.name);
  if (e.isDirectory()) scan(p); else if (/\.(p8|p12|mobileprovision|cer|env|onnx)$|^entries\.json$/i.test(e.name)) banned.push(p);
} })(www);
if (banned.length) throw new Error("ملفات ممنوعة في www/: " + banned.join(", "));

console.log(`www/: ${count} files, ${(bytes / 1048576).toFixed(1)} MB`);
