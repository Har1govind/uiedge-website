// Extracts visible-ish text from a static HTML dump: strips script/style/svg,
// decodes entities, collapses whitespace, prints one text node per line.
const fs = require("fs");
const file = process.argv[2];
let html = fs.readFileSync(file, "utf8");

html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
html = html.replace(/<svg[\s\S]*?<\/svg>/gi, "");
html = html.replace(/<!--[\s\S]*?-->/g, "");

// Split on tag boundaries, keep only text chunks
const chunks = html.split(/</).map((c) => c.replace(/^[^>]*>/, ""));
const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));

const seen = new Set();
for (const c of chunks) {
  const text = decode(c).replace(/\s+/g, " ").trim();
  if (text.length < 2) continue;
  if (seen.has(text)) continue;
  seen.add(text);
  console.log(text);
}
