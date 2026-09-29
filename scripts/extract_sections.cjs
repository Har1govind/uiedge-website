const fs = require("fs");
const html = fs.readFileSync("reference/live-dom-1440.html", "utf8");

// Find all top-level <section>/<header>/<footer> elements inside <main> + header + footer
const names = [
  "Hero", "Clients", "Projects", "Advantages", "Services", "Showreel",
  "Testimonials", "Text", "Bento", "Pricing", "Team", "FAQ", "Blog",
];

// locate main element
const mainStart = html.indexOf("<main");
const mainEnd = html.indexOf("</main>");
const main = html.slice(mainStart, mainEnd);

for (const name of names) {
  const re = new RegExp('<section[^>]*data-framer-name="' + name + '"[^>]*>');
  const m = main.match(re);
  if (!m) { console.log("=== " + name + ": NOT FOUND ==="); continue; }
  const start = mainStart + m.index;
  // find the matching close — walk forward to the end of this section
  const fromIdx = m.index;
  // find next </section> after this (sections don't nest here)
  const closeIdx = main.indexOf("</section>", fromIdx);
  const sectionHtml = main.slice(fromIdx, closeIdx + 10);
  console.log("=== " + name + " (chars " + sectionHtml.length + ") ===");
  console.log(sectionHtml.slice(0, 4000));
  console.log("\n");
}
