/* CDP: dump live site header state at a given viewport width */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9223;

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function wsSend(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const h = { id, method, params };
    const onMsg = (raw) => {
      const m = JSON.parse(raw.data);
      if (m.id === id) {
        ws.removeListener('message', onMsg);
        if (m.error) reject(new Error(JSON.stringify(m.error)));
        else resolve(m.result);
      }
    };
    ws.on('message', onMsg);
    ws.send(JSON.stringify(h));
  });
}

async function main() {
  const width = parseInt(process.argv[2] || '1440', 10);
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + PORT,
    '--window-size=' + width + ',900',
    '--user-data-dir=C:/temp/fabrica-cdp-' + width,
    'about:blank'
  ], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  try {
    const tabs = await getJSON('/json');
    const tab = tabs.find((t) => t.type === 'page') || tabs[0];
    const WebSocket = require('ws');
    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => ws.on('open', r));
    let id = 0;
    const send = (m, p) => wsSend(ws, ++id, m, p);
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await send('Page.navigate', { url: 'https://fabrica.framer.media/' });
    await new Promise((r) => setTimeout(r, 6000));
    const expr = `(() => {
      const h = document.querySelector('header');
      if (!h) return { error: 'no header' };
      const cs = getComputedStyle(h);
      const rect = h.getBoundingClientRect();
      const links = [...h.querySelectorAll('a')].filter(a => a.textContent.trim());
      const navLinks = [...h.querySelectorAll('nav a')].filter(a => a.textContent.trim());
      const allText = [...h.querySelectorAll('a,button')].map(a => a.textContent.trim()).filter(Boolean);
      const menuBtn = h.querySelector('[data-framer-name="Button container"]');
      const logo = h.querySelector('[data-framer-name="Link"]');
      return {
        height: rect.height,
        top: rect.top,
        position: cs.position,
        bg: cs.backgroundColor,
        backdropFilter: cs.backdropFilter,
        linkCount: links.length,
        navLinkTexts: navLinks.map(a => a.textContent.trim()),
        allTexts: allText.slice(0, 20),
        logoText: logo ? logo.textContent.trim() : null,
        logoRect: logo ? (() => { const r = logo.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })() : null,
        menuBtnPresent: !!menuBtn,
        bodyBg: getComputedStyle(document.body).backgroundColor,
        viewport: window.innerWidth
      };
    })()`;
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(JSON.stringify(res.result.value, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
