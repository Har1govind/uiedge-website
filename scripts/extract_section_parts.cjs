const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

function seg(name, nextName) {
  const i = html.indexOf('data-framer-name="' + name + '"');
  if (i < 0) return null;
  const j = nextName ? html.indexOf('data-framer-name="' + nextName + '"', i) : -1;
  return { start: i, text: html.slice(i, j > 0 ? j : i + 20000) };
}

const adv = seg("Advantages", "Services");
console.log("=== ADVANTAGES (texts) ===");
if (adv) {
  const texts = [...adv.text.matchAll(/data-framer-component-type="RichTextContainer"[^>]*>(.*?)<\/div>/gs)].slice(0,20);
  // simpler: all text between tags
  const clean = adv.text.replace(/<[^>]+>/g, " | ").replace(/\s+/g, " ").replace(/\s*\|\s*(\|\s*)+/g, " | ");
  console.log(clean.slice(0, 2000));
}
console.log("\n");

const testi = seg("Testimonials", "Text");
console.log("=== TESTIMONIALS (texts) ===");
if (testi) {
  const clean = testi.text.replace(/<[^>]+>/g, " | ").replace(/\s+/g, " ").replace(/\s*\|\s*(\|\s*)+/g, " | ");
  console.log(clean.slice(0, 2500));
}
console.log("\n");

const pricing = seg("Pricing", "Team");
console.log("=== PRICING (texts) ===");
if (pricing) {
  const clean = pricing.text.replace(/<[^>]+>/g, " | ").replace(/\s+/g, " ").replace(/\s*\|\s*(\|\s*)+/g, " | ");
  console.log(clean.slice(0, 2500));
}
