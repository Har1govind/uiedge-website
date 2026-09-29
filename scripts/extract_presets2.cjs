const fs = require("fs");
const css = fs.readFileSync("reference/live.css", "utf8");

// Tokenize CSS: find each .framer-styles-preset-X rule and the enclosing media query
const names = [
  "1n1wh7h", "2s58fc", "txwsq6", "9v8dhs", "1oueo73", "1mf8d9g", "1qnjizk",
  "1rii1wr", "1yvd34u", "xgn84q", "4vuy4n", "1hin0ji", "hik9eh",
];

// Walk the CSS with a simple stack to track media query scope
const rules = [];
const re = /(@media[^{]+{|[.}][^{}]*\{)/g;
let stack = [];
let lastMatch = 0;
const matches = [];
let m;
while ((m = re.exec(css)) !== null) {
  matches.push({ idx: m.index, text: m[0] });
}
// Rebuild: find rules for presets and print with media context
for (let i = 0; i < matches.length; i++) {
  const tok = matches[i].text;
  if (tok.startsWith("@media")) {
    stack.push(tok);
    continue;
  }
  // this is a rule start; find if it contains a preset name
  const ruleStart = matches[i].idx;
  // rule end = matching close brace; use scan
  let depth = 0;
  let j = ruleStart;
  while (j < css.length) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") { depth--; if (depth === 0) break; }
    j++;
  }
  const rule = css.slice(ruleStart, j + 1);
  const head = rule.slice(0, rule.indexOf("{"));
  if (/framer-styles-preset-/.test(head)) {
    const preset = (head.match(/framer-styles-preset-([a-z0-9]+)/) || [])[1];
    if (preset && names.includes(preset)) {
      const media = stack.length ? stack[stack.length - 1] : "base";
      const fs = (rule.match(/--framer-font-size:([^;]+)/) || [])[1];
      const fw = (rule.match(/--framer-font-weight:([^;]+)/) || [])[1];
      const lh = (rule.match(/--framer-line-height:([^;]+)/) || [])[1];
      const ls = (rule.match(/--framer-letter-spacing:([^;]+)/) || [])[1];
      const ff = (rule.match(/--framer-font-family:"([^"]+)/) || [])[1];
      console.log(`${preset}  ${media}  size:${fs} weight:${fw} lh:${lh} ls:${ls} family:${ff}`);
    }
  }
  // pop media queries whose brace closed
  // count braces in this rule
  const opens = (rule.match(/{/g) || []).length;
  const closes = (rule.match(/}/g) || []).length;
  if (stack.length && closes > opens) {
    stack.pop();
  }
}
