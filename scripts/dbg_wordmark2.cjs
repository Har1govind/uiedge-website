/* Measure local hero wordmark geometry. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9253;
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
    '--window-size=1440,900', '--user-data-dir=C:/temp/lw-' + Date.now(), 'about:blank'
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
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
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
    await sleep(7000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const wm = document.querySelector('.hero__wordmark-text');
        const r = wm ? wm.getBoundingClientRect() : null;
        const cs = wm ? getComputedStyle(wm) : null;
        const top = document.querySelector('.hero__top');
        const tr = top ? top.getBoundingClientRect() : null;
        const wmEl = document.querySelector('.hero__wordmark');
        const wr = wmEl ? wmEl.getBoundingClientRect() : null;
        return JSON.stringify({
          wordmark: r ? {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),fs:cs.fontSize,transform:cs.transform} : null,
          wordmarkWrap: wr ? {x:Math.round(wr.x),y:Math.round(wr.y),w:Math.round(wr.width),h:Math.round(wr.height)} : null,
          top: tr ? {x:Math.round(tr.x),y:Math.round(tr.y),w:Math.round(tr.width),h:Math.round(tr.height)} : null,
          viewport: window.innerWidth + 'x' + window.innerHeight,
          docWidth: document.documentElement.scrollWidth
        }, null, 1);
      })()`,
      returnByValue: true
    });
    console.log(raw.result.result.value || raw.result.result.description);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
