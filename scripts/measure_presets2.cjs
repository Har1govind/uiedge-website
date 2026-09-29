const fs = require("fs");
const css = fs.readFileSync("reference/live.css", "utf8");

const presets = [
  "1n1wh7h", "2s58fc", "txwsq6", "9v8dhs", "1oueo73", "1mf8d9g",
  "1qnjizk", "1rii1wr", "1yvd34u", "xgn84q", "4vuy4n", "1hin0ji", "hik9eh",
];

// Split CSS into media-query blocks
const blocks = [];
let re = /(@media[^{]*\{)((?:[^{}]*\{[^{}]*\})*[^{}]*\})/g;
let m;
while ((m = re.exec(css))) {
  blocks.push({ header: m[1].replace(/[{}]/g, "").trim(), body: m[2] });
}

// Group blocks by breakpoint type
function label(header) {
  if (header.includes("min-width: 1200px")) return ">=1200";
  if (header.includes("min-width: 810px") && header.includes("max-width: 1199")) return "810-1199";
  if (header.includes("max-width: 809")) return "<=809";
  if (header.includes("max-width: 1199")) return "<=1199";
  return "other";
}

const byBreakpoint = new Map();
for (const b of blocks) {
  const l = label(b.header);
  if (!byBreakpoint.has(l)) byBreakpoint.set(l, []);
  byBreakpoint.get(l).push(b.body);
}

for (const p of presets) {
  const out = [];
  // base
  const baseRe = new RegExp('preset-' + p + ':not\\([^)]*\\)[^{]*\\{[^}]*?--framer-font-size:([^;]+)');
  const base = css.match(baseRe);
  if (base) out.push("base:" + base[1]);
  for (const bp of ["<=809", "810-1199", ">=1200"]) {
    const bodies = byBreakpoint.get(bp) || [];
    for (const body of bodies) {
      const r = new RegExp('preset-' + p + '[^{]*\\{[^}]*?--framer-font-size:([^;]+)');
      const mm = body.match(r);
      if (mm) {
        out.push(bp + ":" + mm[1]);
        break;
      }
    }
  }
  console.log(p.padEnd(9), out.join(" | ") || "none");
}
