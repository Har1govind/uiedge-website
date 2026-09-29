/* CDP screenshot helper using Node's built-in WebSocket (Node >= 22) */
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9231;
const URL = process.argv[2] || 'http://localhost:4321/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);
const OUT = process.argv[4] || 'qa_screen.png';

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
    '--user-data-dir=C:/temp/qa-cdp-' + WIDTH + '-' + Date.now(),
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
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 500 });
    await send('Page.navigate', { url: URL });
    await sleep(7000);
    // Give scroll-reveal animations time to settle by scrolling through
    const { result } = await send('Runtime.evaluate', {
      expression: `(async () => {
        // force reveal: set all elements with opacity 0 to visible and scroll
        const els = document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]');
        els.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
        const h = document.body.scrollHeight;
        for (let y = 0; y <= h; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
        return document.body.scrollHeight;
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('scrollHeight:', result?.result?.value);
    await sleep(1500);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, fromSurface: true });
    if (shot.data) {
      fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
      console.log('saved', OUT);
    } else {
      console.log('no screenshot data');
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
