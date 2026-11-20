// ينزّل خطوط Google المستخدمة في index.html مرة واحدة إلى fonts/ ليحزمها التطبيق
// فيعمل دون اتصال ولا يطلب أي شيء من خوادم Google. الخطوط برخصة SIL OFL.
// التشغيل: node tools/fetch-fonts.cjs   (يُعاد فقط عند تغيير الخطوط في index.html)
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const href = (html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/) || [])[1];
if (!href) throw new Error("لا يوجد رابط خطوط Google في index.html");
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
(async () => {
  const out = path.join(root, "fonts");
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
  let css = await (await fetch(href.replace(/&amp;/g, "&"), { headers: { "User-Agent": UA } })).text();
  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+/g) || [])];
  let n = 0, bytes = 0;
  for (const u of urls) {
    const name = u.split("/").slice(-3).join("-").replace(/[^a-zA-Z0-9._-]/g, "");
    const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
    if (buf.length < 1000) throw new Error("ملف خط تالف: " + u);
    fs.writeFileSync(path.join(out, name), buf); bytes += buf.length; n++;
    css = css.split(u).join(name);
  }
  fs.writeFileSync(path.join(out, "fonts.css"), "/* مولَّد بـ tools/fetch-fonts.cjs — لا تعدّله يدوياً */\n" + css);
  console.log(`fonts/: ${n} files, ${(bytes / 1024).toFixed(0)} KB`);
})().catch(e => { console.error(e.message); process.exit(1); });
