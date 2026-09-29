/* Dump local CTA + footer geometry. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9290;

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
    '--user-data-dir=C:/temp/lb-' + Date.now(), 'about:blank'
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
    await send('Page.navigate', { url: 'http://localhost:4321/' });
    await sleep(9000);
    const expr = `(() => {
      const out = [];
      const total = document.documentElement.scrollHeight;
      const all = [...document.querySelectorAll('main *, .site-footer, .site-footer *')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top > total - 2200;
      });
      const seen = new Set();
      for (const el of all) {
        if (seen.has(el)) continue;
        seen.add(el);
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const t = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 34);
        const bg = cs.backgroundColor;
        const cls = typeof el.className === 'string' ? el.className.split(' ').filter((c) => c.startsWith('cta') || c.startsWith('site-footer') || c === 'btn' || c === 'card' || c.startsWith('container')).join('.') : '';
        if (!cls && !el.classList.contains('site-footer') && !el.classList.contains('cta')) continue;
        out.push('.' + cls + ' y=' + Math.round(r.top) + ' h=' + Math.round(r.height) + ' w=' + Math.round(r.width) +
          ' fs=' + cs.fontSize + ' bg=' + bg + (bg === 'rgb(255, 255, 255)' ? ' <<WHITE' : '') + ' | ' + t);
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
