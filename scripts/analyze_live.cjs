/* Analysis helper: extracts facts from reference/live-fabrica.html + reference/live.css + reference/live-dom.html */
const fs = require('fs');

const css = fs.readFileSync('reference/live.css', 'utf8');
const html = fs.readFileSync('reference/live-fabrica.html', 'utf8');
const dom = fs.existsSync('reference/live-dom.html') ? fs.readFileSync('reference/live-dom.html', 'utf8') : html;

function cssRulesFor(sel) {
  // find .framer-xxxx { ... } blocks (top-level, may be in media queries)
  const re = new RegExp('([^{}]*\\.' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^{}]*)\\{([^{}]*)\\}', 'g');
  const out = [];
  let m;
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), body: m[2].trim() });
  return out;
}

function decodeFontSelector(sel) {
  try { return Buffer.from(sel, 'base64').toString('utf8'); } catch { return sel; }
}

const arg = process.argv[2];
const extra = process.argv[3];

if (arg === 'class') {
  for (const c of extra.split(',')) {
    const rules = cssRulesFor(c);
    console.log('=== .' + c + ' (' + rules.length + ' rules)');
    for (const r of rules.slice(0, 5)) console.log('  ' + r.selector.slice(0, 100) + ' { ' + r.body.slice(0, 300) + ' }');
  }
} else if (arg === 'fonts') {
  const seen = new Set();
  const re = /font-selector:([^;]+);/g;
  let m;
  while ((m = re.exec(dom))) {
    const dec = decodeFontSelector(m[1]);
    if (!seen.has(dec)) { seen.add(dec); console.log('FONT SELECTOR:', dec, '(raw:', m[1] + ')'); }
  }
  // inline font-family styles
  const re2 = /--framer-font-family:([^;]+);/g;
  const seen2 = new Set();
  while ((m = re2.exec(dom))) {
    const v = m[1].trim();
    if (!seen2.has(v)) { seen2.add(v); console.log('FONT FAMILY INLINE:', v); }
  }
} else if (arg === 'section') {
  // extract a section by data-framer-name
  const re = new RegExp('<section[^>]*data-framer-name="' + extra + '"[^>]*>([\\s\\S]*?)<\\/section>');
  const m = re.exec(dom);
  if (!m) { console.log('section not found: ' + extra); process.exit(0); }
  console.log(m[1].slice(0, 12000));
} else if (arg === 'texts') {
  // all visible text in document order
  const re = /<p class="framer-text"[^>]*>([^<]*)<\/p>|<h[1-6] class="framer-text"[^>]*>([^<]*)<\/h[1-6]>/g;
  let m;
  const out = [];
  while ((m = re.exec(dom))) {
    const t = (m[1] || m[2] || '').trim();
    if (t) out.push(t);
  }
  console.log(out.join('\n---\n'));
} else {
  console.log('usage: node scripts/analyze_live.cjs <class|fonts|section|texts> <arg>');
}
