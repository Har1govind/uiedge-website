/* Precise section geometry: local (BEM classes) vs live (data-framer-name).
   Usage: node scripts/qa_precise.cjs <url> [width]
   Local selectors: .hero, section.projects, section.services, section.showreel-sec,
                    section.testimonials, .bento, section.pricing, .team, section.faq, .blog, footer
   Live selectors: data-framer-name sections.
*/
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9362;
const URL = process.argv[2];
const W = parseInt(process.argv[3] || '1425', 10);

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
    '--window-size=' + W + ',900', '--hide-scrollbars',
    '--user-data-dir=C:/temp/prc-' + Date.now(), 'about:blank'
  ], { stdio: 'ignore' });
  await sleep(3000);
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
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
    await send('Page.navigate', { url: URL });
    await sleep(10000);
    const isLive = /fabrica\.framer/.test(URL);
    const expr = `(() => {
      const out = { total: document.documentElement.scrollHeight };
      const box = (el, key) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        out[key] = { y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) };
      };
      if (${isLive ? 'true' : 'false'}) {
        const map = {
          'Hero': 'hero', 'Projects': 'projects', 'Advantages': 'advantages',
          'Services': 'services', 'Showreel': 'showreel', 'Testimonials': 'testimonials',
          'Text': 'text', 'Bento': 'bento', 'Pricing': 'pricing', 'Team': 'team',
          'FAQ': 'faq', 'Blog': 'blog', 'CTA': 'cta'
        };
        document.querySelectorAll('section[data-framer-name], div[data-framer-name]').forEach((s) => {
          const n = s.getAttribute('data-framer-name');
          const key = map[n];
          if (key && !out[key]) box(s, key);
        });
        // footer = last
        const all = [...document.querySelectorAll('body > div, body > footer')];
        const f = document.querySelector('footer');
        if (f) box(f, 'footer');
      } else {
        box(document.querySelector('main .hero, .hero'), 'hero');
        box(document.querySelector('section.projects'), 'projects');
        box(document.querySelector('section.why, .advantages, section[class*="why"]'), 'advantages');
        box(document.querySelector('section.services'), 'services');
        box(document.querySelector('section.showreel-sec'), 'showreel');
        box(document.querySelector('section.testimonials'), 'testimonials');
        box(document.querySelector('.bento, section.bento'), 'bento');
        box(document.querySelector('section.pricing'), 'pricing');
        box(document.querySelector('section.team, .team'), 'team');
        box(document.querySelector('section.faq'), 'faq');
        box(document.querySelector('section.blog'), 'blog');
        box(document.querySelector('footer'), 'footer');
      }
      return JSON.stringify(out, null, 1);
    })()`;
    const raw = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(raw.result.result.value);
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
