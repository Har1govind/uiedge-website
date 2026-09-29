const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

function getSection(name) {
  const i = html.indexOf(`data-framer-name="${name}"`);
  if (i === -1) return null;
  // Find enclosing <section
  const secStart = html.lastIndexOf("<section", i);
  if (secStart === -1) return null;
  return html.slice(secStart);
}

function textOf(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function show(name) {
  const s = getSection(name);
  console.log(`\n========== ${name} ==========`);
  if (!s) return console.log("NOT FOUND");
  // List top-level framer containers + their text
  const regex = /data-framer-name="([^"]+)"[^>]*>([\s\S]*?)(?=<div class="framer-[^"]*" data-framer-name=|<\/section>)/g;
  let m;
  let count = 0;
  while ((m = regex.exec(s)) !== null && count < 40) {
    const label = m[1];
    const content = textOf(m[2]).slice(0, 160);
    if (content) {
      console.log(`  [${label}] ${content}`);
      count++;
    }
  }
}

// FAQ items
console.log("========== FAQ ITEMS ==========");
const faq = getSection("FAQ");
if (faq) {
  const items = faq.match(/data-framer-component-type="RichTextContainer"[^>]*>[\s\S]*?<\/div>/g) || [];
  items.forEach((it, idx) => {
    const t = textOf(it);
    if (t) console.log(`  ${idx}: ${t.slice(0, 300)}`);
  });
}

// Blog
show("Blog");

// Phone
show("Phone");

// Hero bottom: H1 + copyright + CTA card
console.log("\n========== HERO BOTTOM ==========");
const hero = getSection("Hero");
if (hero) {
  const bottom = hero.slice(hero.indexOf("Bottom"));
  console.log(textOf(bottom).slice(0, 2000));
}

// Advantages stats
console.log("\n========== ADVANTAGES ==========");
show("Advantages");

// Services titles
console.log("\n========== SERVICES TITLES ==========");
const services = getSection("Services");
if (services) {
  const titles = services.match(/framer-styles-preset-9v8dhs[^>]*>([^<]+)</g) || [];
  titles.forEach((t) => console.log("  " + t.replace(/[^>]*>/, "").replace(/<$/, "")));
  // Get started buttons
  const btns = services.match(/data-framer-name="Text 1"[^>]*>[\s\S]*?<p[^>]*>([^<]+)</g) || [];
  btns.forEach((b) => console.log("  BTN: " + b.match(/>([^<]+)</)?.[1]));
}

// Showreel steps
console.log("\n========== SHOWREEL STEPS ==========");
const showreel = getSection("Showreel");
if (showreel) {
  const texts = showreel.match(/data-framer-component-type="RichTextContainer"[^>]*>[\s\S]*?<\/div>/g) || [];
  texts.forEach((t) => {
    const x = textOf(t);
    if (x && x.length > 1) console.log("  " + x.slice(0, 200));
  });
}

// Bento
console.log("\n========== BENTO ==========");
show("Bento");

// Pricing card
console.log("\n========== PRICING CARD ==========");
const pricing = getSection("Pricing");
if (pricing) {
  const texts = pricing.match(/data-framer-component-type="RichTextContainer"[^>]*>[\s\S]*?<\/div>/g) || [];
  texts.forEach((t) => {
    const x = textOf(t);
    if (x && x.length > 1) console.log("  " + x.slice(0, 250));
  });
}

// Team
console.log("\n========== TEAM ==========");
show("Team");

// Footer
console.log("\n========== FOOTER ==========");
show("Footer");
