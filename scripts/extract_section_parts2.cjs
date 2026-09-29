const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

function clean(seg) {
  return seg.replace(/<[^>]+>/g, " | ").replace(/\s+/g, " ").replace(/\s*\|\s*(\|\s*)+/g, " | ");
}

// Footer (header/footer are separate from main; footer is framer-11bxfef)
const fi = html.indexOf('data-framer-name="Footer"');
console.log("=== FOOTER ===");
if (fi >= 0) console.log(clean(html.slice(fi, fi + 6000)).slice(0, 2500));
else {
  const bi = html.indexOf('framer-11bxfef');
  console.log("no data-framer-name Footer; framer-11bxfef at", bi);
  if (bi >= 0) console.log(clean(html.slice(bi, bi + 6000)).slice(0, 2500));
}
console.log("\n");

const bento = html.indexOf('data-framer-name="Bento"');
console.log("=== BENTO ===");
if (bento >= 0) console.log(clean(html.slice(bento, bento + 12000)).slice(0, 2500));
console.log("\n");

const team = html.indexOf('data-framer-name="Team"');
console.log("=== TEAM ===");
if (team >= 0) console.log(clean(html.slice(team, team + 8000)).slice(0, 2000));
console.log("\n");

const blog = html.indexOf('data-framer-name="Blog"');
console.log("=== BLOG ===");
if (blog >= 0) console.log(clean(html.slice(blog, blog + 7000)).slice(0, 2000));
