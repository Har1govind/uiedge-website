/* Measure live footer section structure. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9286;

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
    '--user-data-dir=C:/temp/f3-' + Date.now(), 'about:blank'
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
    await send('Page.navigate', { url: 'https://fabrica.framer.media/' });
    await sleep(9000);
    const expr = `(() => {
      const out = [];
      const total = document.documentElement.scrollHeight;
      const all = [...document.querySelectorAll('[data-framer-name]')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top > total - 1800;
      });
      for (const el of all) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const t = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 50);
        out.push(el.getAttribute('data-framer-name') + ' y=' + Math.round(r.top) + ' h=' + Math.round(r.height) +
          ' fs=' + cs.fontSize + ' fw=' + cs.fontWeight + ' bg=' + cs.backgroundColor + ' | ' + t);
      }
      return out.join('\\n');
    })()`;
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(res.result.result.value || 'NOT FOUND');
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
