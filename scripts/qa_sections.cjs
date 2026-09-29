/* Extract section-by-section text + key styles from a live page for comparison. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9233;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);
const OUT = process.argv[4] || 'sections_live.txt';

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
    '--user-data-dir=C:/temp/sec-cdp-' + WIDTH + '-' + Date.now(),
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
      const sections = [...document.querySelectorAll('section')];
      const out = [];
      for (const sec of sections) {
        const r = sec.getBoundingClientRect();
        if (r.height < 40) continue;
        const name = sec.getAttribute('data-framer-name') || (sec.className || '').toString().split(' ').slice(0,2).join('.') || sec.id || sec.tagName;
        const texts = [...sec.querySelectorAll('p, h1, h2, h3, span, a')]
          .filter(el => el.childElementCount === 0 && el.textContent.trim())
          .map(el => el.textContent.trim())
          .filter((t, i, arr) => arr.indexOf(t) === i)
          .slice(0, 60);
        out.push('=== ' + name + ' (y=' + Math.round(r.top + scrollY) + ' h=' + Math.round(r.height) + ') ===');
        out.push(texts.join(' | '));
        out.push('');
      }
      return out.join('\\n');
    })()`);
    require('fs').writeFileSync(OUT, out);
    console.log('written', OUT, 'bytes', out.length);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
