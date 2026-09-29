/* Debug: dump raw Runtime.evaluate result. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9238;
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
    '--user-data-dir=C:/temp/dbg-cdp-' + Date.now(),
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
    await sleep(9000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const h2 = [...document.querySelectorAll('h2')].find(h => h.textContent.trim() === 'Projects.');
        if (!h2) return 'no projects h2';
        const cs = getComputedStyle(h2);
        const r = h2.getBoundingClientRect();
        let walk = h2;
        const chain = [];
        while (walk) {
          const c = getComputedStyle(walk);
          if (c.transform && c.transform !== 'none') chain.push(walk.tagName + '.' + (walk.className||'').toString().slice(0,30) + ' tf=' + c.transform);
          walk = walk.parentElement;
        }
        return 'h2 cs fs=' + cs.fontSize + ' lh=' + cs.lineHeight + ' rect w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + '\\n' + chain.join('\\n');
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify(raw, null, 2).slice(0, 3000));
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
