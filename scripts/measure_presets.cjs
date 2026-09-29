const fs = require("fs");

const css = fs.readFileSync("reference/live.css", "utf8");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

const presets = [
  "1n1wh7h", "2s58fc", "txwsq6", "9v8dhs", "1oueo73", "1mf8d9g",
  "1qnjizk", "1rii1wr", "1yvd34u", "xgn84q", "4vuy4n", "1hin0ji",
  "hik9eh", "1wi7vce", "t6j6v0",
];

const mediaHeaders = [
  "min-width:1200px",
  "min-width:810px and max-width:1199.98px",
  "max-width:809.98px",
  "max-width:1199px and min-width:810px",
  "max-width:809px and min-width:0px",
];

// ---- 1. preset font-size across breakpoints ----
console.log("=== PRESET FONT SIZES ===");
for (const p of presets) {
  const out = [];
  // base definition (no media query) — first match of ".framer-styles-preset-p:not("
  const baseRe = new RegExp(
    'preset-' + p + ':not\\([^)]*\\)[^{]*\\{[^}]*?--framer-font-size:([^;]+)'
  );
  const base = css.match(baseRe);
  if (base) out.push("base:" + base[1]);

  for (const q of mediaHeaders) {
    const re = new RegExp(
      "@media\\s*\\(\\s*" + q.replace(/[()]/g, "") + "\\s*\\)\\s*\\{[^}]*?preset-" +
      p + "[^}]*?--framer-font-size:([^;]+)"
    );
    const m = css.match(re);
    if (m) out.push("mq(" + q.replace(/ and /g, "&").replace(/[()]/g, "") + "):" + m[1]);
  }
  console.log(p.padEnd(9), out.join(" | ") || "none");
}

// ---- 2. heading presets from the live DOM (search around each heading text) ----
console.log("\n=== HEADINGS (from live DOM) ===");
const headings = [
  "Projects.", "Pricing.", "Experiences.", "FAQ.", "Services.",
  "Why choose us", "What we do", "No generic websites",
];
for (const t of headings) {
  const i = html.indexOf(">" + t);
  if (i < 0) { console.log(t.padEnd(22), "NOT FOUND"); continue; }
  // walk backwards up to 2500 chars to find the nearest <h1/h2/... or element with data-framer-name
  const before = html.slice(Math.max(0, i - 2500), i);
  const tag = (before.match(/<(h[1-6]|p)\b[^>]*class="[^"]*preset-[a-z0-9]+/g) || []).pop() || "";
  const preset = (tag.match(/preset-([a-z0-9]+)/) || [])[1] || "";
  // find the style attribute of the nearest rich text container
  const styleMatch = before.match(/style="([^"]*--framer-font-size:[^"]*)"/g);
  const style = styleMatch ? styleMatch[styleMatch.length - 1] : "";
  const fs = (style.match(/--framer-font-size:([^;]+)/) || [])[1] || "";
  const w = (style.match(/--framer-font-weight:([^;]+)/) || [])[1] || "";
  const ls = (style.match(/--framer-letter-spacing:([^;]+)/) || [])[1] || "";
  const lh = (style.match(/--framer-line-height:([^;]+)/) || [])[1] || "";
  const font = (style.match(/--framer-font-family:&quot;([^&]+)/) || [])[1] || "";
  console.log(
    t.padEnd(22),
    ("preset-" + preset).padEnd(18),
    "size:" + fs, "w:" + w, "ls:" + ls, "lh:" + lh, "font:" + font
  );
}
