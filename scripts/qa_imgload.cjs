/* Check all img naturalWidth on the page. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9265;
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
    '--window-size=1440,900', '--user-data-dir=C:/temp/im-' + Date.now(), 'about:blank'
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
    // scroll to bottom to trigger lazy loading
    for (let y = 0; y <= 20000; y += 1000) {
      await send('Runtime.evaluate', { expression: 'window.scrollTo(0, ' + y + ')' });
      await sleep(120);
    }
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await sleep(2000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const imgs = [...document.querySelectorAll('img')];
        const bad = [];
        const ok = [];
        for (const img of imgs) {
          const src = img.src;
          const entry = src.split('/').slice(-2).join('/') + ' | nw=' + img.naturalWidth + ' nh=' + img.naturalHeight + ' dispW=' + Math.round(img.getBoundingClientRect().width);
          if (!img.complete || img.naturalWidth === 0) bad.push(entry);
          else if (src.includes('portrait') || src.includes('dark-bg') || src.includes('showreel') || src.includes('case-study') || src.includes('newsletter')) ok.push(entry);
        }
        return 'BAD (' + bad.length + '):\\n' + bad.join('\\n') + '\\nKEY:\\n' + ok.join('\\n');
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
