/* Check viewport size, body width, scrollWidth, and content margins. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9240;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);

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
    '--window-size=' + WIDTH + ',900',
    '--user-data-dir=C:/temp/vp-cdp-' + WIDTH + '-' + Date.now(),
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
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 500 });
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const out = [];
        out.push('innerWidth=' + window.innerWidth + ' innerHeight=' + window.innerHeight);
        out.push('scrollWidth=' + document.documentElement.scrollWidth + ' body.scrollWidth=' + document.body.scrollWidth);
        out.push('body rect w=' + Math.round(document.body.getBoundingClientRect().width) + ' x=' + Math.round(document.body.getBoundingClientRect().x));
        const root = document.querySelector('#main, main, [data-framer-name], .framer-root') || document.body;
        const r = root.getBoundingClientRect();
        out.push('root tag=' + root.tagName + '.' + (root.className||'').toString().slice(0,40) + ' x=' + Math.round(r.x) + ' w=' + Math.round(r.width));
        const first = document.body.querySelector('section, header, footer');
        if (first) { const fr = first.getBoundingClientRect(); out.push('first sec ' + (first.getAttribute('data-framer-name')||'') + ' x=' + Math.round(fr.x) + ' w=' + Math.round(fr.width)); }
        return out.join('\\n');
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
