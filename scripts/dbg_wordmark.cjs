/* Measure wordmark / hero title elements. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9247;
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
    '--window-size=1440,900', '--user-data-dir=C:/temp/wm-' + Date.now(), 'about:blank'
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
    await sleep(6000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const out = [];
        const hero = document.querySelector('.hero') || document.body;
        const find = (el, depth) => {
          if (depth > 12) return;
          const tag = el.tagName;
          if (tag === 'TEXTAREA') return;
          const text = (el.children.length === 0 && el.textContent.trim()) ? el.textContent.trim().slice(0, 25) : '';
          const cls = (el.className || '').toString();
          if (text && text.length > 2 && /fabrica|Studio|®/.test(text)) {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            out.push(text + ' [' + tag + ' ' + cls.slice(0, 30) + '] x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' fs=' + cs.fontSize + ' lh=' + cs.lineHeight);
          }
          for (const c of el.children) find(c, depth + 1);
        };
        find(hero, 0);
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
