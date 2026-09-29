const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

const section = process.argv[2];
const next = process.argv[3];
const needle = process.argv[4] || "";

const i = html.indexOf(`data-framer-name="${section}"`);
const j = next ? html.indexOf(`data-framer-name="${next}"`, i) : -1;
let seg = html.slice(i, j > 0 ? j : i + 40000);

let idx = needle ? seg.indexOf(needle) : seg.length;
if (idx < 0) idx = seg.length;

// walk back to find the enclosing white card — look for nearest container with border-radius 18 or 14
// Find all card-like elements: background-color: rgb(255, 255, 255)
const whiteCards = [...seg.matchAll(/<div[^>]*background-color: rgb\(255, 255, 255\)[^>]*>/g)].map((m) => m.index);
const relevant = whiteCards.filter((w) => w < idx + 3000).filter((w) => w > idx - 6000);
console.log("=== WHITE CARD STARTS near needle ===");
for (const w of relevant.slice(-4)) {
  console.log("--- card at", w, "---");
  const tag = seg.slice(w, w + 300);
  console.log(tag);
}
console.log("=== CONTEXT AROUND NEEDLE ===");
console.log(seg.slice(Math.max(0, idx - 1500), idx + 800));
