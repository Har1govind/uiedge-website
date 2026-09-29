/* Measure the local .why section internals. (CDP, no deps) */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9268;
const URL = process.argv[2] || 'http://localhost:4321/';

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
    '--window-size=1425,900', '--hide-scrollbars',
    '--user-data-dir=C:/temp/why-' + Date.now(), 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(3500);
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1425, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL });
    await sleep(7000);
    const expr = `(() => {
      const sec = document.querySelector('.why');
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y + window.scrollY), w: Math.round(b.width), h: Math.round(b.height), fs: el.tagName === 'H2' ? getComputedStyle(el).fontSize : null }; };
      const out = { section: r(sec) };
      const els = sec.querySelectorAll('h2, p, .why__eyebrow, [class*="stat"], [class*="cta"], [class*="grid"], [class*="top"], [class*="content"], [class*="item"]');
      els.forEach((el) => {
        const b = el.getBoundingClientRect();
        const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : el.tagName;
        out[cls + ':' + (el.tagName)] = { y: Math.round(b.y + window.scrollY), h: Math.round(b.height), w: Math.round(b.width), fs: el.tagName === 'H2' || el.tagName === 'P' ? getComputedStyle(el).fontSize : '' };
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
