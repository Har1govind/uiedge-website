const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

const section = process.argv[2];
const next = process.argv[3];
const needle = process.argv[4] || "";
const back = parseInt(process.argv[5] || "5600", 10);
const forward = parseInt(process.argv[6] || "600", 10);

const i = html.indexOf(`data-framer-name="${section}"`);
const j = next ? html.indexOf(`data-framer-name="${next}"`, i) : -1;
let seg = html.slice(i, j > 0 ? j : i + 40000);

let idx = needle ? seg.indexOf(needle) : seg.length;
if (idx < 0) idx = seg.length;
const start = seg.lastIndexOf("<div", Math.max(0, idx - back));
const chunk = seg.slice(start, Math.min(seg.length, idx + forward));

let depth = 0;
const re = /<div[^>]*>|<\/div>/g;
let m;
while ((m = re.exec(chunk))) {
  const t = m[0];
  if (t.startsWith("</div>")) { depth = Math.max(0, depth - 1); continue; }
  const name = t.match(/data-framer-name="([^"]+)"/)?.[1] || "";
  const bg = t.match(/background-color:\s*([^;"]+)/)?.[1] || "";
  const r = t.match(/border-radius:\s*([^;"]+)/)?.[1] || "";
  const cls = t.match(/class="([^"]+)"/)?.[1] || "";
  const preset = cls.match(/preset-([a-z0-9]+)/)?.[1] || "";
  if (name || bg || preset) {
    console.log(
      "  ".repeat(Math.max(0, depth)) +
        (name || "div") +
        (bg ? " bg:" + bg : "") +
        (r ? " rad:" + r : "") +
        (preset ? " [" + preset + "]" : "")
    );
  }
  depth++;
}
