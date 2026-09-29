/* Measure project grid card sizes on local or live. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9378;
const URL = process.argv[2] || 'http://localhost:4321/';
const W = parseInt(process.argv[3] || '1425', 10);

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
    '--user-data-dir=C:/temp/gr-' + Date.now(), 'about:blank'
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
    const isLive = /fabrica\.framer/.test(URL);
    const expr = `(() => {
      let grid;
      if (${isLive ? 'true' : 'false'}) {
        const sec = [...document.querySelectorAll('section[data-framer-name]')].find(s => s.getAttribute('data-framer-name') === 'Projects');
        grid = sec ? sec.querySelector('[data-framer-name] ~ *, .framer-aeexdy') : null;
        // fall back: find the grid (the block with many cards)
        if (!grid || grid.children.length < 3) {
          grid = [...sec.querySelectorAll('div')].find((d) => d.children.length >= 5 && d.children[0] && d.children[0].querySelector('img, svg'));
        }
      } else {
        grid = document.querySelector('.projects__grid');
      }
      if (!grid) return 'GRID NOT FOUND';
      const sb = grid.getBoundingClientRect();
      const out = { h: Math.round(sb.height), cards: [] };
      grid.children.forEach((c, i) => {
        if (i > 8) return;
        const r = c.getBoundingClientRect();
        out.cards.push({ i, y: Math.round(r.top - sb.top), h: Math.round(r.height), w: Math.round(r.width) });
      });
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
