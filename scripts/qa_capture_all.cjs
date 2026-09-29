/* Capture multiple scroll-position screenshots for visual QA. */
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9281;
const URL = 'http://localhost:4321/';
const W = 1440, H = 900;

const SHOTS = [
  ['qa_s_projects', 1045],
  ['qa_s_why', 3292],
  ['qa_s_services', 4640],
  ['qa_s_showreel', 6156],
  ['qa_s_testimonials', 7872],
  ['qa_s_text', 9040],
  ['qa_s_case', 9815],
  ['qa_s_pricing', 10850],
  ['qa_s_team', 12415],
  ['qa_s_faq', 13394],
  ['qa_s_blog', 14314],
  ['qa_s_cta', 15330],
];

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}
const http = require('http');
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
    '--window-size=' + W + ',' + H, '--hide-scrollbars',
    '--user-data-dir=C:/temp/ssq-' + Date.now(), 'about:blank'
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
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL });
    await sleep(9000);
    for (const [name, scroll] of SHOTS) {
      await send('Runtime.evaluate', { expression: 'window.scrollTo(0, ' + scroll + ')' });
      await sleep(1200);
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      fs.writeFileSync(name + '.png', Buffer.from(shot.result.data, 'base64'));
      console.log('saved ' + name + '.png @' + scroll);
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
