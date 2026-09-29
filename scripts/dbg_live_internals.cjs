/* Measure live section internals: rows, gaps, first-level children. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9368;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const W = parseInt(process.argv[3] || '1425', 10);
const WHICH = process.argv[4] || 'Services,Team,Pricing,Blog,Testimonials,Projects,Showreel,FAQ';

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
    '--user-data-dir=C:/temp/int-' + Date.now(), 'about:blank'
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
    const want = WHICH.split(',');
    const expr = `(() => {
      const out = {};
      document.querySelectorAll('section[data-framer-name]').forEach((sec) => {
        const n = sec.getAttribute('data-framer-name');
        if (!want.includes(n)) return;
        const sb = sec.getBoundingClientRect();
        const cs = getComputedStyle(sec);
        const kids = [];
        sec.querySelectorAll(':scope > *').forEach((d) => {
          const kb = d.getBoundingClientRect();
          const kcs = getComputedStyle(d);
          const grand = [];
          d.querySelectorAll(':scope > *').forEach((g) => {
            const gb = g.getBoundingClientRect();
            grand.push({ cls: (g.className || g.getAttribute('data-framer-name') || '').toString().split(' ')[0].slice(0, 22), y: Math.round(gb.top - sb.top), h: Math.round(gb.height), w: Math.round(gb.width) });
          });
          kids.push({
            cls: (d.className || d.getAttribute('data-framer-name') || '').toString().split(' ')[0].slice(0, 22),
            y: Math.round(kb.top - sb.top), h: Math.round(kb.height), w: Math.round(kb.width),
            gap: kcs.gap, pT: kcs.paddingTop, pB: kcs.paddingBottom,
            grand
          });
        });
        out[n] = { h: Math.round(sb.height), gap: cs.gap, kids };
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
