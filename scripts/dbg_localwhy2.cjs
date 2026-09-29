/* Measure local StatsSection (.why) internals via CDP. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9363;
const URL = process.argv[2] || 'http://localhost:4321/';
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
    '--user-data-dir=C:/temp/lw-' + Date.now(), 'about:blank'
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
    await sleep(8000);
    const expr = `(() => {
      const out = {};
      const sec = document.querySelector('.why');
      if (!sec) return 'NO .why';
      const b = sec.getBoundingClientRect();
      out.sec = { y: Math.round(b.top), h: Math.round(b.height), pt: getComputedStyle(sec).paddingTop, pb: getComputedStyle(sec).paddingBottom };
      const shell = sec.querySelector('.why__shell');
      if (shell) { const s = shell.getBoundingClientRect(); out.shell = { y: Math.round(s.top), h: Math.round(s.height), gap: getComputedStyle(shell).gap }; }
      const top = sec.querySelector('.why__top');
      if (top) { const t = top.getBoundingClientRect(); out.top = { y: Math.round(t.top), h: Math.round(t.height) }; }
      const content = sec.querySelector('.why__content');
      if (content) { const c = content.getBoundingClientRect(); out.content = { y: Math.round(c.top), h: Math.round(c.height), gap: getComputedStyle(content).gap }; }
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
