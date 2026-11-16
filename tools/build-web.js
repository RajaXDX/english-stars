/* Copies the web app into www/ — the folder the iOS and Android apps load.
   The website itself still runs straight from the repo root; nothing here changes it. */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), out = path.join(root, "www");
const items = ["index.html", "css", "js", "data", "assets"];      // no service worker or manifest: the native app is already offline

fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(out);
for(const item of items) fs.cpSync(path.join(root, item), path.join(out, item), {recursive:true});
console.log("www/ ready:", items.join(", "));
