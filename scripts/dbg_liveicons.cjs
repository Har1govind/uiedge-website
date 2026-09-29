/* Measure live hero Icons row + BG card. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9256;
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
    '--window-size=1440,900', '--user-data-dir=C:/temp/li-' + Date.now(), 'about:blank'
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
    await sleep(9000);
    const raw = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = [...document.querySelectorAll('section')].find(s => s.getAttribute('data-framer-name') === 'Hero');
        if (!hero) return 'no hero';
        const out = [];
        const icons = hero.querySelector('[data-framer-name="Icons"]');
        if (icons) {
          out.push('---ICONS---');
          out.push('icons x=' + Math.round(icons.getBoundingClientRect().x) + ' y=' + Math.round(icons.getBoundingClientRect().y) + ' w=' + Math.round(icons.getBoundingClientRect().width) + ' h=' + Math.round(icons.getBoundingClientRect().height) + ' disp=' + getComputedStyle(icons).display + ' gap=' + getComputedStyle(icons).gap);
          icons.querySelectorAll('*').forEach((el) => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.width > 0 && r.height > 0 && (el.getAttribute('data-framer-name') === 'Container' || el.getAttribute('data-framer-name') === 'Variant 1' || el.getAttribute('data-framer-name') === 'V' || el.getAttribute('data-framer-name') === 'H')) {
              out.push('  [' + (el.getAttribute('data-framer-name')||'') + '] x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' bg=' + cs.backgroundColor + ' radius=' + cs.borderRadius + ' disp=' + cs.display);
            }
          });
        }
        const bg = hero.querySelector('[data-framer-name="BG"]');
        if (bg) {
          out.push('---BG---');
          const r = bg.getBoundingClientRect();
          const cs = getComputedStyle(bg);
          out.push('BG x=' + Math.round(r.x) + ' y=' + Math.round(r.y) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) + ' radius=' + cs.borderRadius + ' bg=' + cs.backgroundColor + ' pos=' + cs.position + ' inset=' + cs.top + ' ' + cs.right + ' ' + cs.bottom + ' ' + cs.left);
          const video = bg.querySelector('video');
          if (video) {
            const vr = video.getBoundingClientRect();
            const vcs = getComputedStyle(video);
            out.push('  video x=' + Math.round(vr.x) + ' y=' + Math.round(vr.y) + ' w=' + Math.round(vr.width) + ' h=' + Math.round(vr.height) + ' filter=' + vcs.filter + ' opacity=' + vcs.opacity + ' poster=' + (video.getAttribute('poster')||'').slice(0,60));
          }
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
