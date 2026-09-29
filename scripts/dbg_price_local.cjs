/* Measure local pricing internals. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9380;
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
    '--user-data-dir=C:/temp/prc-' + Date.now(), 'about:blank'
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
    await send('Page.navigate', { url: URL });
    await sleep(8000);
    const expr = `(() => {
      const sec = document.querySelector('section.pricing');
      const sb = sec.getBoundingClientRect();
      const out = { sec: Math.round(sb.height) };
      const head = sec.querySelector('.pricing__head');
      const h = head.getBoundingClientRect();
      out.head = { y: Math.round(h.top - sb.top), h: Math.round(h.height), mb: getComputedStyle(head).marginBottom };
      const card = sec.querySelector('.pricing');
      const c = card.getBoundingClientRect();
      out.card = { y: Math.round(c.top - sb.top), h: Math.round(c.height), gap: getComputedStyle(card).gap };
      const table = sec.querySelector('.pricing__table');
      const t = table.getBoundingClientRect();
      out.table = { y: Math.round(t.top - sb.top), h: Math.round(t.height), gap: getComputedStyle(table).gap };
      const top = sec.querySelector('.pricing__top');
      const tp = top.getBoundingClientRect();
      out.top = { y: Math.round(tp.top - sb.top), h: Math.round(tp.height) };
      const pcard = sec.querySelector('.pricing__card');
      const pc = pcard.getBoundingClientRect();
      out.pcard = { y: Math.round(pc.top - sb.top), h: Math.round(pc.height) };
      const quote = sec.querySelector('.pricing__quote');
      const q = quote.getBoundingClientRect();
      out.quote = { y: Math.round(q.top - sb.top), h: Math.round(q.height), pt: getComputedStyle(quote).paddingTop };
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
