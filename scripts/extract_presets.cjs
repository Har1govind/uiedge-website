const fs = require("fs");
const css = fs.readFileSync("reference/live.css", "utf8");

const names = [
  "1n1wh7h", "2s58fc", "txwsq6", "9v8dhs", "1oueo73", "1mf8d9g", "1qnjizk",
  "1rii1wr", "1yvd34u", "xgn84q", "4vuy4n", "1hin0ji", "hik9eh",
];

for (const n of names) {
  const re = new RegExp(`\\.framer-styles-preset-${n}\\s*\\{([^}]*)\\}`, "m");
  const m = css.match(re);
  console.log(`=== ${n} ===`);
  console.log(m ? m[1].trim() : "NOT FOUND");
  console.log();
}
