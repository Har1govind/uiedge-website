const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

// Find the hero's Bottom by searching for the H1 text
const h1i = html.indexOf("No generic websites");
if (h1i < 0) { console.log("H1 NOT FOUND"); process.exit(0); }
// Go back to the enclosing 'data-framer-name="Bottom"'
const before = html.slice(Math.max(0, h1i - 3000), h1i);
const bottomIdx = before.lastIndexOf('data-framer-name="Bottom"');
const start = before.lastIndexOf("<", bottomIdx);
// forward to find the end of hero (next '</section>' or 'data-framer-name="BG"')
const seg = html.slice(h1i - 1500, h1i + 8000);
console.log(seg.slice(0, 8000));
