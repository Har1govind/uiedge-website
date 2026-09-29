/* CDP: dump per-section computed styles on the live Fabrica site */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9225;

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
    '--remote-debugging-port=' + PORT, '--window-size=1440,900',
    '--user-data-dir=C:/temp/fabrica-cdp3-' + Date.now(), 'about:blank'
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
    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      return r.result ? r.result.value : undefined;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'https://fabrica.framer.media/' });
    await sleep(7000);
    const state = await evalJs(`(() => {
      const out = [];
      const sels = ['main', 'header', 'footer'];
      document.querySelectorAll('main, header, footer, section').forEach((el) => {
        const name = el.getAttribute('data-framer-name') || el.tagName;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        out.push({
          name,
          tag: el.tagName,
          y: Math.round(r.top), h: Math.round(r.height),
          bg: cs.backgroundColor,
          color: cs.color,
          radius: cs.borderRadius,
          padding: cs.paddingTop + ' ' + cs.paddingRight + ' ' + cs.paddingBottom + ' ' + cs.paddingLeft
        });
      });
      return out;
    })()`);
    console.log(JSON.stringify(state, null, 2));
    ws.close();
  } finally { chrome.kill(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
