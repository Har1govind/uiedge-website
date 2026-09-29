/* CDP: header element visibility + scroll behavior */
const http = require('http');
const { spawn } = require('child_process');
const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9227;

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

async function run(width) {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + PORT, '--window-size=' + width + ',900',
    '--user-data-dir=C:/temp/fabrica-h2-' + width + '-' + Date.now(), 'about:blank'
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
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await send('Page.navigate', { url: 'https://fabrica.framer.media/' });
    await sleep(7000);
    const top = await evalJs(`(() => {
      const h = document.querySelector('header');
      const vis = (el) => { if (!el) return null; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { display: s.display, visibility: s.visibility, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x) }; };
      const hamburger = h ? h.querySelector('[data-framer-name="Button container"]') : null;
      const ctaLink = h ? [...h.querySelectorAll('a')].find(a => /let's talk|let’s talk/i.test(a.textContent)) : null;
      const navLinks = h ? h.querySelectorAll('nav a') : [];
      const visibleNav = [...navLinks].filter(a => { const s = getComputedStyle(a); return s.display !== 'none' && a.getBoundingClientRect().width > 0 && a.textContent.trim() !== 'fabrica®'; }).map(a => ({ t: a.textContent.trim(), fs: getComputedStyle(a).fontSize, x: Math.round(a.getBoundingClientRect().x) }));
      return {
        headerPos: getComputedStyle(h).position,
        headerH: h.getBoundingClientRect().height,
        hamburger: vis(hamburger),
        cta: ctaLink ? vis(ctaLink) : null,
        visibleNavLinks: visibleNav,
        heroTopPadding: (() => { const s = document.querySelector('main section, main'); return s ? getComputedStyle(s).paddingTop : null; })()
      };
    })()`);
    console.log('=== WIDTH ' + width + ' (top) ===');
    console.log(JSON.stringify(top, null, 2));
    // scroll down 800px and re-check header
    await evalJs(`window.scrollTo(0, 800); true`);
    await sleep(1200);
    const scrolled = await evalJs(`(() => {
      const h = document.querySelector('header');
      return { scrollY: window.scrollY, headerTop: h.getBoundingClientRect().top, headerPos: getComputedStyle(h).position, headerBg: getComputedStyle(h).backgroundColor };
    })()`);
    console.log('--- after scroll 800 ---');
    console.log(JSON.stringify(scrolled, null, 2));
    ws.close();
  } finally { chrome.kill(); }
}
run(parseInt(process.argv[2] || '1440', 10)).catch((e) => { console.error(e); process.exit(1); });
