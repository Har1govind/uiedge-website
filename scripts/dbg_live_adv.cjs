/* Measure live Advantages internals in forced dark mode. (CDP, no deps) */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9361;
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
    '--user-data-dir=C:/temp/adv-' + Date.now(), 'about:blank'
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
      const out = {};
      const walk = (el, depth) => {
        const b = el.getBoundingClientRect();
        const name = el.getAttribute && el.getAttribute('data-framer-name');
        const label = (name ? name + ' ' : '') + el.tagName + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
        const isText = el.querySelector && el.querySelector('p, h1, h2, h3');
        const txt = (el.textContent || '').trim().slice(0, 40).replace(/\\n/g, ' ');
        out[label + (depth)] = { y: Math.round(b.y + window.scrollY), h: Math.round(b.height), w: Math.round(b.width), t: txt.slice(0, 34) };
        if (depth < 2 && el.children && el.children.length > 0) {
          for (const c of el.children) walk(c, depth + 1);
        }
      };
      const sec = document.querySelector('section[data-framer-name="Advantages"]');
      if (sec) walk(sec, 0);
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
