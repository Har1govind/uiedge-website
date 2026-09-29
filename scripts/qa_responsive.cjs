/* Capture the local page at desktop/tablet/mobile widths + scroll offsets. (CDP, no deps) */
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9267;
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
    '--window-size=1425,900', '--hide-scrollbars',
    '--user-data-dir=C:/temp/res-' + Date.now(), 'about:blank'
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

    const vps = [
      { name: 'desktop', width: 1425, height: 900, scrolls: [0, 3200, 11000, 17000] },
      { name: 'tablet', width: 768, height: 900, scrolls: [0, 800, 3500, 9000] },
      { name: 'mobile', width: 390, height: 844, scrolls: [0, 800, 2800, 7000] },
    ];
    for (const vp of vps) {
      await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: URL });
      await sleep(6500);
      for (const s of vp.scrolls) {
        await send('Runtime.evaluate', { expression: 'window.scrollTo(0, ' + s + ')' });
        await sleep(1200);
        const file = 'qa_r_' + vp.name + '_' + s + '.png';
        const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
        fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
        console.log('saved ' + file);
      }
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
