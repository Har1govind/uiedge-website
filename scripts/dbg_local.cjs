/* Dump hero inner styles. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9243;

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
    '--window-size=1440,900', '--user-data-dir=C:/temp/hs-' + Date.now(), 'about:blank'
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
    await send('Page.navigate', { url: 'http://localhost:4321/' });
    await sleep(6000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.querySelector('section.hero');
        const inner = sec.querySelector('.hero__inner');
        const cs = getComputedStyle(inner);
        const secCS = getComputedStyle(sec);
        const r = inner.getBoundingClientRect();
        return 'hero sec: disp=' + secCS.display + ' align=' + secCS.alignItems + ' justify=' + secCS.justifyContent + ' w=' + sec.getBoundingClientRect().width +
          '\\ninner: disp=' + cs.display + ' width=' + cs.width + ' flex=' + cs.flex + ' maxW=' + cs.maxWidth + ' margin=' + cs.margin +
          ' rect w=' + r.width + ' x=' + r.x +
          '\\nsec children: ' + [...sec.children].map(c => c.tagName + '.' + (c.className||'').toString().slice(0,30)).join(', ');
      })()`,
      returnByValue: true
    });
    console.log(raw.result.result.value);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
