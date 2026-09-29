/* Inspect live site section parents / gap structure. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9366;
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
    '--user-data-dir=C:/temp/par-' + Date.now(), 'about:blank'
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
      const secs = [...document.querySelectorAll('section[data-framer-name]')];
      if (!secs.length) return 'NO SECTIONS';
      const sec = secs.find((s) => s.getAttribute('data-framer-name') === 'Projects') || secs[0];
      const chain = [];
      let cur = sec;
      for (let i = 0; i < 6 && cur; i++) {
        const cs = getComputedStyle(cur);
        const r = cur.getBoundingClientRect();
        chain.push({
          tag: cur.tagName,
          cls: (cur.className || '').toString().slice(0, 40),
          display: cs.display,
          flexDir: cs.flexDirection,
          gap: cs.gap,
          padTop: cs.paddingTop,
          padBottom: cs.paddingBottom,
          y: Math.round(r.top),
          h: Math.round(r.height),
          kids: cur.children.length
        });
        cur = cur.parentElement;
      }
      // also the gap between two consecutive sections
      const idx = secs.findIndex((s) => s === sec);
      const nxt = secs[idx + 1];
      const gaps = [];
      for (let i = 0; i < secs.length - 1; i++) {
        const a = secs[i].getBoundingClientRect();
        const b = secs[i + 1].getBoundingClientRect();
        gaps.push(secs[i].getAttribute('data-framer-name') + '->' + secs[i + 1].getAttribute('data-framer-name') + ':' + Math.round(b.top - (a.top + a.height)));
      }
      return JSON.stringify({ chain, gaps }, null, 1);
    })()`;
    const raw = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(raw.result.result.value);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
