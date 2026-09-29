/* Measure live Services accordion item internals (trigger + panel). */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9372;
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
    '--user-data-dir=C:/temp/si-' + Date.now(), 'about:blank'
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
      const sec = [...document.querySelectorAll('section[data-framer-name]')].find(s => s.getAttribute('data-framer-name') === 'Services');
      if (!sec) return 'NOT FOUND';
      const items = [...sec.querySelectorAll('[data-framer-name*="open"], [data-framer-name="Desktop "]')];
      const out = [];
      sec.querySelectorAll('.framer-1hh6mhy-container [data-framer-name], .framer-1hh6mhy-container [data-highlight]').forEach((it) => {
        const r = it.getBoundingClientRect();
        const cs = getComputedStyle(it);
        out.push({
          name: it.getAttribute('data-framer-name'),
          y: Math.round(r.top - sec.getBoundingClientRect().top),
          h: Math.round(r.height),
          pT: cs.paddingTop, pB: cs.paddingBottom, gap: cs.gap
        });
      });
      // text metrics of the name + number + desc
      const texts = [];
      sec.querySelectorAll('.framer-1hh6mhy-container p').forEach((p) => {
        const cs = getComputedStyle(p);
        const r = p.getBoundingClientRect();
        texts.push({ t: p.textContent.trim().slice(0, 24), fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing, lh: cs.lineHeight, y: Math.round(r.top - sec.getBoundingClientRect().top), h: Math.round(r.height) });
      });
      return JSON.stringify({ items: out, texts: texts.slice(0, 16) }, null, 1);
    })()`;
    const raw = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(raw.result.result.value);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
