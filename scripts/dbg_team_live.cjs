/* Extract live Team section text + card info. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9381;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
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
    '--user-data-dir=C:/temp/tml-' + Date.now(), 'about:blank'
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
    await sleep(12000);
    const expr = `(() => {
      const sec = [...document.querySelectorAll('section[data-framer-name]')].find(s => s.getAttribute('data-framer-name') === 'Team');
      if (!sec) return 'NOT FOUND';
      const out = [];
      const walk = (el, depth) => {
        if (depth > 8) return;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const name = el.getAttribute && el.getAttribute('data-framer-name');
        const txt = el.children.length === 0 && el.textContent.trim() ? el.textContent.trim().slice(0, 60) : '';
        if (name || txt) {
          out.push({ d: depth, n: name || '', tag: el.tagName, y: Math.round(r.top - sec.getBoundingClientRect().top), h: Math.round(r.height), w: Math.round(r.width), gap: cs.gap, txt });
        }
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
