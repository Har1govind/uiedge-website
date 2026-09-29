/* Measure hero sub-layout: Top, Icons, Bottom, Clients, BG. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9248;
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
    '--window-size=1440,900', '--user-data-dir=C:/temp/hg-' + Date.now(), 'about:blank'
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
    await sleep(9000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const isLive = ${JSON.stringify(URL.includes('framer'))};
        const sec = isLive
          ? [...document.querySelectorAll('section')].find(s => s.getAttribute('data-framer-name') === 'Hero')
          : document.querySelector('.hero');
        if (!sec) return 'no hero';
        const names = ['Top','Company','Title','Studio','Services','Icons','Bottom','Text','Clients','Static','Container','Logo','BG'];
        const out = [];
        const walk = (el, depth) => {
          if (depth > 5) return;
          const n = el.getAttribute('data-framer-name');
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (n) out.push('  '.repeat(depth) + '[' + n + '] x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' disp=' + cs.display + ' pos=' + cs.position + ' tf=' + cs.transform.slice(0, 60));
          for (const c of el.children) walk(c, depth + 1);
        };
        walk(sec, 0);
        // Also grab the wordmark svg rects
        const svgs = sec.querySelectorAll('svg');
        out.push('--- svgs: ' + svgs.length);
        svgs.forEach((s, i) => {
          const r = s.getBoundingClientRect();
          if (r.width > 10 && r.height > 10) out.push('  svg#' + i + ' x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' vw=' + s.getAttribute('viewBox'));
        });
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
