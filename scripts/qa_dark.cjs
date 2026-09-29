/* Find theme toggle on live site and dump colors after toggling. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9234;
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
    '--user-data-dir=C:/temp/dark-cdp-' + WIDTH + '-' + Date.now(),
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
    await sleep(7000);

    // Find buttons and click any theme-toggle-like element
    const before = await evalJs(`(() => {
      const h = document.querySelector('header');
      const cs = getComputedStyle(h);
      const btns = [...document.querySelectorAll('button, [data-highlight="true"], [tabindex="0"]')]
        .filter(el => el.getBoundingClientRect().width > 0)
        .slice(0, 30)
        .map(el => ({
          tag: el.tagName,
          name: el.getAttribute('data-framer-name'),
          cls: (el.className || '').toString().slice(0, 60),
          rect: [Math.round(el.getBoundingClientRect().x), Math.round(el.getBoundingClientRect().y), Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)],
          bg: getComputedStyle(el).backgroundColor,
        }));
      return { headerBg: cs.backgroundColor, btns };
    })()`);
    console.log('BEFORE', JSON.stringify(before, null, 1));

    // Click the element with name matching theme/toggle or the one at top-right with small size
    await evalJs(`(() => {
      const candidates = [...document.querySelectorAll('[data-highlight="true"], [tabindex="0"]')];
      // prefer elements named with theme|toggle|dark|light
      let target = candidates.find(el => /theme|toggle|dark|light/i.test(el.getAttribute('data-framer-name') || ''));
      if (!target) {
        // fallback: small square buttons in header
        const h = document.querySelector('header');
        target = [...(h ? h.querySelectorAll('[data-highlight="true"], [tabindex="0"]') : [])].find(el => {
          const r = el.getBoundingClientRect();
          return r.width < 60 && r.height < 60;
        });
      }
      if (target) {
        target.click();
        return 'clicked ' + (target.getAttribute('data-framer-name') || target.className.toString().slice(0,40));
      }
      return 'no target';
    })()`);
    await sleep(2000);

    const after = await evalJs(`(() => {
      const h = document.querySelector('header');
      const cs = getComputedStyle(h);
      const b = document.body;
      return {
        headerBg: cs.backgroundColor,
        bodyBg: getComputedStyle(b).backgroundColor,
        scheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        localStorage: Object.keys(localStorage),
        htmlStyle: document.documentElement.getAttribute('style'),
        bodyClass: b.className,
      };
    })()`);
    console.log('AFTER', JSON.stringify(after, null, 1));
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
