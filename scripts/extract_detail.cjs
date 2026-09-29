const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

function extractBetween(startMarker, endMarker, label, maxLen = 6000) {
  const i = html.indexOf(startMarker);
  if (i < 0) { console.log("=== " + label + ": START NOT FOUND ==="); return; }
  const j = html.indexOf(endMarker, i);
  console.log("=== " + label + " ===");
  console.log(html.slice(i, j > 0 ? Math.min(j, i + maxLen) : i + maxLen));
  console.log("\n");
}

// Hero bottom (H1 + copyright + CTA card)
extractBetween('data-framer-name="Bottom"', 'data-framer-name="BG"', "HERO BOTTOM", 5000);

// Clients section
const cli = html.indexOf('data-framer-name="Clients"');
if (cli < 0) console.log("=== Clients NOT FOUND ===");
else {
  console.log("=== CLIENTS ===");
  console.log(html.slice(cli - 200, cli + 3500));
  console.log("\n");
}
