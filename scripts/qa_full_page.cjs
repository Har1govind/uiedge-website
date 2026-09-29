/* Capture full-page screenshot at 1425 width. */
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9388;
const URL = process.argv[2] || 'http://localhost:4321/';
const OUT = process.argv[3] || 'full_local.png';

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
    '--window-size=1440,900', '--hide-scrollbars',
    '--user-data-dir=C:/temp/fs-' + Date.now(), 'about:blank'
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
    await sleep(8000);
    // Scroll to bottom to trigger lazy loading
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.documentElement.scrollHeight)' });
    await sleep(1500);
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await sleep(800);
    const total = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
    const h = total.result.result.value;
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: h, scale: 1 } });
    fs.writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
    console.log('saved ' + OUT + ' ' + 1425 + 'x' + h);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
