// لقطات صفحة المتجر بمقاسات آيفون الدقيقة، من نسخة www/ في «وضع التطبيق».
// يحتاج: puppeteer-core (خارج المشروع) + Chrome، وسيرفر على www/:
//   python -m http.server 8251 --directory www
//   NODE_PATH=<مجلد فيه puppeteer-core>/node_modules node tools/store-shots.cjs store/screenshots
const fs = require("node:fs");
const path = require("node:path");
const puppeteer = require("puppeteer-core");
const OUT = process.argv[2] || "store/screenshots";
const BASE = "http://localhost:8251/";
const DEVICES = [
  { tag: "6.9", w: 440, h: 956 },   // 1320×2868
  { tag: "6.5", w: 414, h: 896 }    // 1242×2688
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  // صفحة اختبار مؤقتة تحاكي التطبيق (بلا عامل خدمة ولا زر «تثبيت»)
  const www = path.join(__dirname, "..", "www");
  const test = path.join(www, "__shots.html");
  fs.writeFileSync(test, fs.readFileSync(path.join(www, "index.html"), "utf8")
    .replace("<head>", "<head><script>window.Capacitor={isNativePlatform:()=>true};</script>"));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: "new", args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
  try {
    for (const d of DEVICES) {
      fs.mkdirSync(path.join(OUT, d.tag), { recursive: true });
      const page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148");
      await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      await page.goto(BASE + "__shots.html", { waitUntil: "networkidle0" });
      await page.evaluate(() => { localStorage.clear(); });
      await page.goto(BASE + "__shots.html", { waitUntil: "networkidle0" });
      await page.evaluate(() => { Store.createProfile({ name: "سارة", gender: "f", grade: "g4" }); });
      const shot = async (n, hash, prep) => {
        await page.evaluate(h => { location.hash = h; }, hash);
        await sleep(900);
        if (prep) { await page.evaluate(prep); await sleep(900); }
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: path.join(OUT, d.tag, `${n}.png`) });
        console.log(d.tag, n);
      };
      await shot("1-home", "home");
      await shot("2-words", "u/g4/u1/words", () => { const c = document.querySelector(".wcard, .card.word, [data-word]"); c && c.scrollIntoView({ block: "center" }); });
      await shot("3-listen", "u/g4/u1/listen", () => { const b = document.querySelector("#qStart"); b && b.click(); });
      await shot("4-grammar", "u/g4/u1/grammar");
      await shot("5-learn", "learn/g4");
      await page.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(test, { force: true });
  }
})().catch(e => { console.error(e); process.exit(1); });
