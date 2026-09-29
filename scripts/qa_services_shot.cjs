/* Screenshot just the #services section, and check accordion items are collapsed. */
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9241;
const URL = process.argv[2] || 'http://localhost:4321/';
const WIDTH = parseInt(process.argv[3] || '1440', 10);
const OUT = process.argv[4] || 'D:/Projects/UIEdge/qa_s_services.png';

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
    '--window-size=' + WIDTH + ',1200',
    '--user-data-dir=C:/temp/qa-serv-cdp-' + WIDTH + '-' + Date.now(),
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
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 1200, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: URL });
    await sleep(6000);

    // Scroll to services section to trigger reveal, force opacity fixes like other scripts do
    await evalJs(`(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const els = document.querySelectorAll('[style*="opacity: 0"], [style*="opacity:0"]');
      els.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      document.querySelectorAll('.js-reveal').forEach((el) => el.classList.add('is-revealed'));
      const sec = document.getElementById('services');
      if (sec) {
        const y = sec.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      }
      await new Promise(r => setTimeout(r, 400));
      return { scrollY: window.scrollY };
    })()`);
    await sleep(1500);
    // confirm scroll settled (no more movement)
    let prevY = -1, curY = await evalJs('window.scrollY');
    for (let i = 0; i < 10 && curY !== prevY; i++) {
      prevY = curY;
      await sleep(300);
      curY = await evalJs('window.scrollY');
    }
    // fine-tune: correct for any residual offset (e.g. layout shift from lazy images)
    for (let i = 0; i < 5; i++) {
      const topOffset = await evalJs(`(() => {
        const sec = document.getElementById('services');
        return sec.getBoundingClientRect().top;
      })()`);
      if (Math.abs(topOffset) < 1) break;
      await evalJs(`window.scrollBy({ top: ${topOffset}, left: 0, behavior: 'instant' })`);
      await sleep(400);
    }

    const info = await evalJs(`(() => {
      const sec = document.getElementById('services');
      if (!sec) return { error: 'no #services element found' };
      const r = sec.getBoundingClientRect();
      const items = [...sec.querySelectorAll('[class*="accordion"], details, li, [class*="item"]')];
      const texts = [...sec.querySelectorAll('h2,h3,h4,button,summary')].map(e => e.textContent.trim()).filter(Boolean);
      // try to find the 4 top-level accordion rows by looking for elements containing the known titles
      const titles = ['Web design and development','Social media marketing','SEO and content marketing','Branding and identity'];
      const rows = titles.map(t => {
        const el = [...sec.querySelectorAll('*')].find(e => e.childElementCount === 0 && e.textContent.trim() === t);
        if (!el) return { title: t, found: false };
        // walk up to find a row container that likely has expanded/collapsed state
        let node = el;
        let ariaExpanded = null;
        let hasPlus = null;
        for (let i = 0; i < 6 && node; i++) {
          if (node.getAttribute && node.getAttribute('aria-expanded') !== null) {
            ariaExpanded = node.getAttribute('aria-expanded');
          }
          node = node.parentElement;
        }
        return { title: t, found: true, ariaExpanded };
      });
      return {
        rect: { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom },
        scrollY: window.scrollY,
        rows,
      };
    })()`);
    console.log('services info:', JSON.stringify(info, null, 2));

    // Resize the viewport to exactly the section height, then re-align scroll
    // so the section fills the viewport top-to-bottom, and take a plain
    // (unclipped) screenshot — clip-based captureScreenshot was returning
    // blank images in this Chrome build.
    const sectionHeight = Math.ceil(info.rect.height) + 2;
    await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: sectionHeight, deviceScaleFactor: 1, mobile: false });
    await sleep(300);
    for (let i = 0; i < 5; i++) {
      const topOffset = await evalJs(`(() => {
        const sec = document.getElementById('services');
        return sec.getBoundingClientRect().top;
      })()`);
      if (Math.abs(topOffset) < 1) break;
      await evalJs(`window.scrollBy({ top: ${topOffset}, left: 0, behavior: 'instant' })`);
      await sleep(300);
    }
    await sleep(500);

    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    if (shot.data) {
      fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
      console.log('saved', OUT);
    } else {
      console.log('no screenshot data', JSON.stringify(shot));
    }
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
