const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

// Find the section element for Services (the <section> with data-framer-name="Services")
const names = [...html.matchAll(/<section[^>]*data-framer-name="([^"]+)"[^>]*>/g)].map((m) => ({
  name: m[1],
  idx: m.index,
}));
const svc = names.find((n) => n.name === "Services");
const nxt = names.find((n) => n.name === "Showreel");
const seg = html.slice(svc.idx, nxt.idx);

// Print structure: every div with data-framer-name + bg + radius + border
let depth = 0;
const re = /<div[^>]*>|<\/div>/g;
let m;
let out = [];
while ((m = re.exec(seg))) {
  const t = m[0];
  if (t.startsWith("</div>")) { depth = Math.max(0, depth - 1); continue; }
  const name = t.match(/data-framer-name="([^"]+)"/)?.[1] || "";
  const cls = t.match(/class="([^"]+)"/)?.[1] || "";
  const bg = t.match(/background-color:\s*([^;"]+)/)?.[1] || "";
  const r = t.match(/border-radius:\s*([^;"]+)/)?.[1] || "";
  const b = t.match(/--border-color:\s*([^;"]+)/)?.[1] || "";
  if (name || bg || r || b) {
    out.push(
      "  ".repeat(Math.max(0, depth)) +
        (name || "div") +
        (bg ? " bg:" + bg.slice(0, 60) : "") +
        (r ? " rad:" + r : "") +
        (b ? " bdr:" + b.slice(0, 40) : "")
    );
    if (out.length > 80) break;
  }
  depth++;
}
console.log(out.join("\n"));
