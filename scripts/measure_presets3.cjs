const fs = require("fs");
const css = fs.readFileSync("reference/live.css", "utf8");

const presets = [
  "1n1wh7h", "2s58fc", "txwsq6", "9v8dhs", "1oueo73", "1mf8d9g",
  "1qnjizk", "1rii1wr", "1yvd34u", "xgn84q", "4vuy4n", "1hin0ji", "hik9eh",
];

// Walk the CSS, capture every @media block with balanced braces
function extractMediaBlocks(css) {
  const blocks = [];
  const re = /@media/g;
  let m;
  while ((m = re.exec(css))) {
    const start = m.index;
    const brace = css.indexOf("{", start);
    if (brace < 0) continue;
    const header = css.slice(start, brace);
    // find matching close brace
    let depth = 0;
    let i = brace;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    blocks.push({ header, body: css.slice(brace + 1, i) });
    re.lastIndex = i + 1;
  }
  return blocks;
}

function label(header) {
  if (header.includes("min-width: 1200px")) return ">=1200";
  if (header.includes("min-width: 810px") && header.includes("max-width: 1199")) return "810-1199";
  if (header.includes("max-width: 809")) return "<=809";
  if (header.includes("max-width: 1199")) return "<=1199";
  return "other";
}

const blocks = extractMediaBlocks(css);
const byBp = new Map();
for (const b of blocks) {
  const l = label(b.header);
  if (!byBp.has(l)) byBp.set(l, []);
  byBp.get(l).push(b.body);
}

function findSize(body, p) {
  // preset may be referenced with the class OR via a parent-scoped selector containing "preset-"+p
  const re = new RegExp("preset-" + p + '[^{}]*\\{[^}]*?--framer-font-size:([^;]+)');
  const m = body.match(re);
  return m ? m[1] : null;
}

for (const p of presets) {
  const out = [];
  const baseRe = new RegExp('preset-' + p + ':not\\([^)]*\\)[^{]*\\{[^}]*?--framer-font-size:([^;]+)');
  const base = css.match(baseRe);
  if (base) out.push("base:" + base[1]);
  for (const bp of ["810-1199", "<=809", ">=1200"]) {
    const bodies = byBp.get(bp) || [];
    let found = null;
    for (const body of bodies) {
      found = findSize(body, p);
      if (found) break;
    }
    if (found) out.push(bp + ":" + found);
  }
  console.log(p.padEnd(9), out.join(" | ") || "none");
}
