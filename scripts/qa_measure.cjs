/* Measure detailed layout of a specific section on the live site. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9235;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const SECTION = process.argv[3] || 'Team';
const WIDTH = parseInt(process.argv[4] || '1440', 10);

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
    '--user-data-dir=C:/temp/meas-cdp-' + WIDTH + '-' + Date.now(),
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
    await send('Page.navigate', { url: URL });
    await sleep(8000);
    const out = await evalJs(`(() => {
      const sec = [...document.querySelectorAll('section')].find(s => s.getAttribute('data-framer-name') === '${SECTION}' || (s.className && s.className.toString().includes('${SECTION.toLowerCase()}')));
      if (!sec) return 'SECTION NOT FOUND';
      const lines = [];
      const dump = (el, depth) => {
        if (depth > 6) return;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const name = el.getAttribute('data-framer-name');
        const text = (el.childElementCount === 0 && el.textContent.trim()) ? el.textContent.trim().slice(0, 40) : '';
        if (name || text || (r.width > 0 && (depth < 3))) {
          lines.push('  '.repeat(depth) + (name ? '[' + name + ']' : '') + (text ? ' "' + text + '"' : '') + ' x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' bg=' + cs.backgroundColor + ' fs=' + (el.childElementCount===0 ? cs.fontSize : '') + ' fw=' + (el.childElementCount===0 ? cs.fontWeight : '') + ' ls=' + (el.childElementCount===0 ? cs.letterSpacing : '') + ' lh=' + (el.childElementCount===0 ? cs.lineHeight : ''));
        }
        for (const child of el.children) dump(child, depth + 1);
      };
      dump(sec, 0);
      return lines.join('\\n');
    })()`);
    console.log(out);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
