/* Measure all text elements in the hero / first section. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9239;
const URL = process.argv[2] || 'https://fabrica.framer.media/';

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
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + PORT,
    '--window-size=1440,900',
    '--user-data-dir=C:/temp/hero-cdp-' + Date.now(),
    'about:blank'
  ], { stdio: 'ignore' });
  await sleep(2500);
  try {
    const tabs = await getJSON('/json');
    const tab = tabs.find((t) => t.type === 'page') || tabs[0];
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => ws.onopen = r);
    let id = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    };
    const send = (method, params = {}) => new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const walk = document.body;
        const out = [];
        const visit = (el, depth) => {
          if (depth > 40) return;
          if (el.nodeType === 1 && el.children.length === 0 && el.textContent.trim()) {
            const cs = getComputedStyle(el);
            const fs = parseFloat(cs.fontSize);
            if (fs >= 20) {
              const r = el.getBoundingClientRect();
              out.push(JSON.stringify({ t: el.textContent.trim().slice(0, 60), fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }));
            }
          }
          for (const c of el.children) visit(c, depth + 1);
        };
        visit(document.body, 0);
        return out.join('\\n');
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(raw, null, 2).slice(0, 6000));
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
