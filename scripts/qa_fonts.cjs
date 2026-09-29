/* Measure computed font sizes of headings on a page. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9237;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);

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
    '--remote-debugging-port=' + PORT,
    '--window-size=' + WIDTH + ',900',
    '--user-data-dir=C:/temp/fonts-cdp-' + WIDTH + '-' + Date.now(),
    'about:blank'
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
    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.result && r.result.exceptionDetails) return 'EXC: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300);
      return r.result && r.result.result ? r.result.result.value : undefined;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 500 });
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const els = [...document.querySelectorAll('h1,h2,h3')];
        const out = [];
        for (const el of els.slice(0, 30)) {
          const t = (el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 40);
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          out.push(t + ' || fs=' + cs.fontSize + ' fw=' + cs.fontWeight + ' lh=' + cs.lineHeight + ' ls=' + cs.letterSpacing + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' y=' + Math.round(r.y));
        }
        return 'COUNT=' + els.length + '\\n' + out.join('\\n');
      })()`,
      returnByValue: true
    });
    const out = raw && raw.result && raw.result.result ? raw.result.result.value : JSON.stringify(raw);
    console.log(out || '(no output)');
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
