const fs = require("fs");
const css = fs.readFileSync("reference/live.css", "utf8");

const classes = process.argv.slice(2);
for (const cls of classes) {
  // match .framer-ugBOm .framer-X or .framer-X { ... } — find all occurrences
  const re = new RegExp('[\\.\\}]?' + cls + '\\{[^}]*\\}', "g");
  let m, found = 0;
  while ((m = re.exec(css)) && found < 2) {
    console.log("=== " + cls + " #" + (found + 1) + " ===");
    console.log(m[0].slice(0, 700));
    console.log();
    found++;
  }
  if (!found) console.log("=== " + cls + ": NOT FOUND ===");
}
