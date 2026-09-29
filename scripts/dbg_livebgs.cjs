/* Measure background colors at specific scroll positions on the live dark site. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9401;
const URL = process.argv[2] || 'https://fabrica.framer.media/';

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
    '--user-data-dir=C:/temp/lb-' + Date.now(), 'about:blank'
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
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    // Sample the pixel color at specific document y positions via elementFromPoint is unreliable;
    // instead find section-level divs with full width and their bg.
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const out = [];
        const total = document.documentElement.scrollHeight;
        out.push('PAGE_H=' + total);
        const divs = [...document.querySelectorAll('div')];
        const matches = [];
        for (const el of divs) {
          const r = el.getBoundingClientRect();
          if (r.width < 1400) continue;
          const cs = getComputedStyle(el);
          const bg = cs.backgroundColor;
          if (bg === 'rgba(0, 0, 0, 0)') continue;
          if (r.height < 60) continue;
          matches.push({ y: r.top, h: r.height, bg, name: el.getAttribute('data-framer-name') || '', text: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 24) });
        }
        matches.sort((a, b) => a.y - b.y);
        for (const m of matches) {
          if (m.y < total - 1900 || m.h < 100) continue;
          out.push('y=' + Math.round(m.y) + ' h=' + Math.round(m.h) + ' bg=' + m.bg + ' ' + m.name + ' | ' + m.text);
        }
        return out.join('\\n');
      })()`,
      returnByValue: true
    });
    console.log(raw.result.result.value || 'NOT FOUND');
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
