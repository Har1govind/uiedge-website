/* CDP layout-inspector: dump section geometry + colors + fonts from a page. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9232;
const URL = process.argv[2] || 'http://localhost:4321/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);
const SCHEME = process.argv[4] || '';

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
    '--user-data-dir=C:/temp/layout-cdp-' + WIDTH + '-' + Date.now(),
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
      if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
    };
    const send = (method, params = {}) => new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    const evalJs = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return r.result ? r.result.value : undefined;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 500 });
    if (SCHEME) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: SCHEME }] });
    await send('Page.navigate', { url: URL });
    await sleep(7000);
    const out = await evalJs(`(() => {
      // force reveal everything
      document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      const h = document.body.scrollHeight;
      const snap = () => {
        const sections = [];
        const seen = new Set();
        document.querySelectorAll('section, header, footer, main > div, main > [class]').forEach((sec) => {
          if (seen.has(sec)) return;
          const r = sec.getBoundingClientRect();
          const cs = getComputedStyle(sec);
          const name = sec.getAttribute('data-framer-name') || sec.id || sec.className.split(' ').slice(0,2).join('.');
          if (r.width < 50 || r.height < 10) return;
          sections.push({
            tag: sec.tagName.toLowerCase(),
            name,
            y: Math.round(r.top + window.scrollY),
            h: Math.round(r.height),
            bg: cs.backgroundColor,
            display: cs.display,
          });
        });
        return { scrollH: document.body.scrollHeight, sections };
      };
      const result = snap();
      return result;
    })()`);
    console.log(JSON.stringify(out, null, 1));
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
