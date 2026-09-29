/* Dump live hero Top/Company subtree geometry. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9273;
const URL = process.argv[2] || 'https://fabrica.framer.media/';

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
    '--user-data-dir=C:/temp/c2-' + Date.now(), 'about:blank'
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
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    const expr = `(() => {
      const out = [];
      const seen = new Set();
      function walk(el, depth) {
        if (depth > 8 || seen.has(el)) return;
        seen.add(el);
        const r = el.getBoundingClientRect();
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role') || '';
        const name = el.getAttribute('data-framer-name') || '';
        const t = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 24);
        if (tag === 'svg' || role === 'heading' || name || (tag === 'div' && t && r.width > 40 && r.height > 12)) {
          out.push('  '.repeat(depth) + tag + ' name=' + name + ' role=' + role +
            ' x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) +
            ' | ' + t);
        }
        for (const c of el.children) walk(c, depth + 1);
      }
      // find the hero Top row
      const all = document.querySelectorAll('div');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 1300 && r.height > 200 && r.height < 400 && el.querySelectorAll('svg').length >= 3) {
          walk(el, 0);
          break;
        }
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
