/* Full local hero layout dump. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9260;
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
    '--window-size=1440,900', '--user-data-dir=C:/temp/hf-' + Date.now(), 'about:blank'
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
    await sleep(7000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.querySelector('.hero');
        if (!sec) return 'no .hero';
        const out = [];
        const sel = ['.hero','.hero__bg','.hero__bg-video','.hero__first','.hero__content','.hero__top','.hero__company','.hero__title','.hero__wordmark','.hero__wordmark-text','.hero__reg','.hero__studio-row','.hero__studio','.hero__services','.hero__pill','.hero__icons','.hero__plus','.hero__bottom','.hero__text','.hero__headline','.hero__copyright','.hero__card','.hero__card-media','.hero__card-body','.hero__card-cta','.hero__clients','.hero__clients-head','.hero__clients-logos','.hero__clients-tile'];
        for (const s of sel) {
          const els = sec.querySelectorAll(s);
          els.forEach((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            out.push(s + ' x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' disp=' + cs.display + ' fs=' + cs.fontSize + ' fw=' + cs.fontWeight + ' lh=' + cs.lineHeight + ' ls=' + cs.letterSpacing + ' txt=' + (el.textContent||'').trim().replace(/\\s+/g,' ').slice(0,20));
          });
        }
        return out.join('\\n');
      })()`,
      returnByValue: true
    });
    console.log(raw.result.result.value || raw.result.result.description);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
