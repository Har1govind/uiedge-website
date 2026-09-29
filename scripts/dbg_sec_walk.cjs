/* Walk a named section and print its internal box tree. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9371;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const W = parseInt(process.argv[3] || '1425', 10);
const NAME = process.argv[4] || 'Services';
const MAXD = parseInt(process.argv[5] || '5', 10);

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
    '--window-size=' + W + ',900', '--hide-scrollbars',
    '--user-data-dir=C:/temp/wk-' + Date.now(), 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(3000);
  try {
    const tabs = await getJSON('/json');
    const tab = tabs.find((t) => t.type === 'page') || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => ws.onopen = r);
    let id = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    };
    const send = (method, params = {}) => new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await send('Page.navigate', { url: URL });
    await sleep(10000);
    const expr = `(() => {
      const isLive = ${/fabrica\.framer/.test(URL) ? 'true' : 'false'};
      let sec;
      if (isLive) {
        sec = [...document.querySelectorAll('section[data-framer-name]')].find(s => s.getAttribute('data-framer-name') === ${JSON.stringify(NAME)});
      } else {
        const map = { Services: 'section.services', Team: 'section.team', Pricing: 'section.pricing', Blog: 'section.blog', Testimonials: 'section.testimonials', Projects: 'section.projects', Showreel: 'section.showreel-sec', FAQ: 'section.faq' };
        sec = document.querySelector(map[${JSON.stringify(NAME)}]);
      }
      if (!sec) return 'SECTION NOT FOUND: ' + ${JSON.stringify(NAME)};
      const sb = sec.getBoundingClientRect();
      const out = [];
      const walk = (el, depth) => {
        if (depth > ${MAXD}) return;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        out.push({
          d: depth,
          tag: el.tagName,
          name: el.getAttribute && el.getAttribute('data-framer-name'),
          cls: (el.className || '').toString().split(' ').slice(0, 2).join(' '),
          y: Math.round(r.top - sb.top),
          h: Math.round(r.height),
          w: Math.round(r.width),
          gap: cs.gap,
          pT: cs.paddingTop,
          pB: cs.paddingBottom,
          kids: el.children.length
        });
        for (const c of el.children) walk(c, depth + 1);
      };
      walk(sec, 0);
      return JSON.stringify(out, null, 1);
    })()`;
    const raw = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(raw.result.result.value);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
