/* Measure live site with prefers-color-scheme: dark emulated. */
const http = require('http');
const { spawn } = require('child_process');

const CHROME = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;

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
    '--user-data-dir=C:/temp/dk-' + Date.now(), 'about:blank'
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
    await send('Page.navigate', { url: 'https://fabrica.framer.media/' });
    await sleep(9000);
    const expr = `(() => {
      const out = [];
      const total = document.documentElement.scrollHeight;
      // body bg + key sections
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      out.push('BODY bg=' + bodyBg + ' color=' + getComputedStyle(document.body).color);
      out.push('PAGE_HEIGHT=' + total);
      // find the footer
      const footer = [...document.querySelectorAll('div')].find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 1300 && r.height > 800 && r.top > total - 1800;
      });
      if (footer) {
        const cs = getComputedStyle(footer);
        out.push('FOOTER y=' + Math.round(footer.getBoundingClientRect().top) + ' h=' + Math.round(footer.getBoundingClientRect().height) +
          ' bg=' + cs.backgroundColor + ' color=' + cs.color);
      }
      // CTA Lauren card: find element with text 'Ask directly'
      const ask = [...document.querySelectorAll('div')].find((el) => (el.textContent || '').includes('Ask directly'));
      if (ask) {
        let cur = ask;
        for (let i = 0; i < 6 && cur; i++) {
          const r = cur.getBoundingClientRect();
          const cs = getComputedStyle(cur);
          if (r.width > 200 && r.width < 700) {
            out.push('CTA-CARD y=' + Math.round(r.top) + ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) +
              ' bg=' + cs.backgroundColor + ' color=' + cs.color + ' | ' + (cur.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 30));
            break;
          }
          cur = cur.parentElement;
        }
      }
      // Section backgrounds: dump distinct section-level backgrounds from top to bottom
      const seen = {};
      const divs = [...document.querySelectorAll('div')];
      for (const el of divs) {
        const r = el.getBoundingClientRect();
        if (r.width < 1300 || r.height < 200) continue;
        const cs = getComputedStyle(el);
        const bg = cs.backgroundColor;
        if (bg === 'rgba(0, 0, 0, 0)') continue;
        const key = bg;
        if (!seen[key]) seen[key] = [];
        if (seen[key].length < 3) seen[key].push('y=' + Math.round(r.top) + ' h=' + Math.round(r.height) + ' ' + (el.getAttribute('data-framer-name') || ''));
      }
      for (const [k, v] of Object.entries(seen)) out.push('BG ' + k + ' => ' + v.join(' | '));
      return out.join('\\n');
    })()`;
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    console.log(res.result.result.value || 'NOT FOUND');
    ws.close();
  } finally {
    chrome.kill();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
