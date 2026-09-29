/* CDP: find non-transparent background layers inside each section */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9226;

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
    '--remote-debugging-port=' + PORT, '--window-size=1440,900',
    '--user-data-dir=C:/temp/fabrica-cdp4-' + Date.now(), 'about:blank'
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
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'https://fabrica.framer.media/' });
    await sleep(7000);
    const state = await evalJs(`(() => {
      const out = [];
      document.querySelectorAll('main > section, footer').forEach((sec) => {
        const secName = sec.getAttribute('data-framer-name') || sec.tagName;
        const layers = [];
        // walk descendants, collect elements with non-transparent bg covering most of section
        const walk = (el, depth) => {
          if (depth > 6) return;
          const cs = getComputedStyle(el);
          const bg = cs.backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const r = el.getBoundingClientRect();
            const sr = sec.getBoundingClientRect();
            const cover = (r.width / sr.width) * (r.height / sr.height);
            if (cover > 0.5 && r.height > 50) {
              layers.push({ name: el.getAttribute('data-framer-name') || el.tagName, bg, cover: Math.round(cover * 100) });
            }
          }
          for (const c of el.children) walk(c, depth + 1);
        };
        for (const c of sec.children) walk(c, 0);
        out.push({ section: secName, layers });
      });
      return out;
    })()`);
    console.log(JSON.stringify(state, null, 2));
    ws.close();
  } finally { chrome.kill(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
