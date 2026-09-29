/* CDP: dump bounding boxes + key computed styles for top-level sections + headings on a URL. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = Number(process.env.CDP_PORT || 9231);
const URL = process.argv[2];
if (!URL) { console.error('usage: node cdp_measure.cjs <url>'); process.exit(1); }

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
    '--remote-debugging-port=' + PORT, '--window-size=1440,1000',
    '--user-data-dir=C:/temp/fabrica-cdp-' + Date.now() + '-' + PORT, 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(1800);
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
      if (r.exceptionDetails) return { error: r.exceptionDetails.text };
      return r.result ? r.result.value : undefined;
    };
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL });
    await sleep(6000);
    const state = await evalJs(`(() => {
      const out = [];
      const main = document.querySelector('main') || document.body;
      const kids = Array.from(main.children);
      kids.forEach((el, i) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        out.push({
          i, tag: el.tagName, cls: (el.className+'').slice(0,60),
          y: Math.round(r.top + window.scrollY), h: Math.round(r.height),
          bg: cs.backgroundColor, padTop: cs.paddingTop, padBottom: cs.paddingBottom,
        });
      });
      const headings = Array.from(document.querySelectorAll('h1, h2')).slice(0,6).map(h => {
        const cs = getComputedStyle(h);
        const r = h.getBoundingClientRect();
        return { tag: h.tagName, text: h.textContent.trim().slice(0,40), fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, fontWeight: cs.fontWeight, y: Math.round(r.top+window.scrollY), x: Math.round(r.left) };
      });
      const container = document.querySelector('.container, [class*=container]');
      const contCs = container ? getComputedStyle(container) : null;
      return {
        docHeight: document.documentElement.scrollHeight,
        containerPad: contCs ? contCs.paddingLeft : null,
        containerMax: contCs ? contCs.maxWidth : null,
        sections: out,
        headings,
      };
    })()`);
    console.log(JSON.stringify(state, null, 2));
    ws.close();
  } finally { chrome.kill(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
