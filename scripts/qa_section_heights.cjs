/* Measure top-level section boxes (y, height) on a page via CDP. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9377;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const DARK = process.argv[3] === 'dark';

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
    '--user-data-dir=C:/temp/sh-' + Date.now(), 'about:blank'
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1908, height: 900, deviceScaleFactor: 1, mobile: false });
    if (DARK) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const total = document.documentElement.scrollHeight;
        const out = ['PAGE_H=' + total];
        const texts = ['About us', 'Testimonials', 'Why choose us', 'Services.', 'Projects.', 'Experiences.', 'Pricing.', 'FAQ.', 'Simple pricing'];
        for (const t of texts) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const txt = walker.currentNode.textContent.trim();
            if (txt === t) {
              let el = walker.currentNode.parentElement;
              let cur = el;
              // walk up to a likely section container (>1100 wide, tall)
              for (let i = 0; i < 8 && cur; i++) {
                const r = cur.getBoundingClientRect();
                if (r.width > 1100 && r.height > 300) break;
                cur = cur.parentElement;
              }
              const r = cur ? cur.getBoundingClientRect() : { top: 0, height: 0 };
              out.push(t + ': top=' + Math.round(r.top) + ' h=' + Math.round(r.height));
              break;
            }
          }
        }
        // hero
        const hero = document.querySelector('[data-framer-name="First screen"], [data-framer-name="Hero"]');
        if (hero) {
          const r = hero.getBoundingClientRect();
          out.push('HERO: top=' + Math.round(r.top) + ' h=' + Math.round(r.height));
        }
        return out.join('\\n');
      })()`,
      returnByValue: true
    });
    console.log(res.result.result.value || 'NOT FOUND');
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
