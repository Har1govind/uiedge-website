/* CDP inspector using Node's built-in WebSocket (Node >= 22) */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9224;
const URL = process.argv[2] || 'https://fabrica.framer.media/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);
const SCHEME = process.argv[4] || ''; // 'dark' | 'light' | '' (no emulation)

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
    '--user-data-dir=C:/temp/fabrica-cdp2-' + WIDTH + '-' + Date.now(),
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
      const r = await send('Runtime.evaluate', { expression, returnByValue: true });
      return r.result ? r.result.value : undefined;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 900, deviceScaleFactor: 1, mobile: WIDTH < 500 });
    if (SCHEME) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: SCHEME }] });
    }
    await send('Page.navigate', { url: URL });
    await sleep(7000);

    const state = await evalJs(`(() => {
      const q = (s) => document.querySelector(s);
      const cs = (el) => el ? getComputedStyle(el) : null;
      const h = q('header');
      const m = q('main');
      const b = document.body;
      const hcs = cs(h), mcs = cs(m), bcs = cs(b);
      const navLinks = h ? [...h.querySelectorAll('nav a')].filter(a => a.textContent.trim()).map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href'), fs: getComputedStyle(a.querySelector('p')||a).fontSize, weight: getComputedStyle(a.querySelector('p')||a).fontWeight })) : [];
      const menuBtn = h ? h.querySelector('[data-framer-name="Button container"]') : null;
      const toggleBtn = [...document.querySelectorAll('[data-framer-name]')].filter(e => /theme|toggle|dark|light/i.test(e.getAttribute('data-framer-name'))).map(e => e.getAttribute('data-framer-name'));
      return {
        scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        header: h ? { height: h.getBoundingClientRect().height, top: h.getBoundingClientRect().top, position: hcs.position, bg: hcs.backgroundColor, blur: hcs.backdropFilter, color: hcs.color } : null,
        main: m ? { bg: mcs.backgroundColor, color: mcs.color, paddingTop: mcs.paddingTop } : null,
        body: { bg: bcs.backgroundColor, color: bcs.color, margin: bcs.margin },
        navLinks,
        menuBtnPresent: !!menuBtn,
        themeCandidates: toggleBtn,
        htmlClass: document.documentElement.className,
        viewport: innerWidth
      };
    })()`);
    console.log(JSON.stringify(state, null, 2));
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
