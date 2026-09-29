const http = require("http");
function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: 9223, path }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on("error", reject);
  });
}
async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  return { ws, send };
}
(async () => {
  const targets = await getJSON("/json");
  const page = targets.find((t) => t.type === "page");
  const { ws, send } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: "https://fabrica.framer.media/" });
  await new Promise((r) => setTimeout(r, 6000));
  const { result } = await send("Runtime.evaluate", {
    expression: `(() => {
      const names = ['Hero','Clients','Projects','Advantages','Services','Showreel','Testimonials','Text','Bento','Pricing','Team','FAQ','Blog'];
      const out = [];
      let lastY = 0;
      for (const name of names) {
        const sec = [...document.querySelectorAll('[data-framer-name="' + name + '"]')].find(s => s.tagName === 'SECTION' || s.tagName === 'FOOTER' || s.tagName === 'HEADER') || document.querySelector('[data-framer-name="' + name + '"]');
        if (!sec) { out.push(name + ': NOT FOUND'); continue; }
        const r = sec.getBoundingClientRect();
        const docTop = r.top + window.scrollY;
        const gap = Math.round(docTop - lastY);
        out.push(name + ': y=' + Math.round(docTop) + ' h=' + Math.round(r.height) + ' (gap from prev: ' + gap + ')');
        lastY = docTop + r.height;
      }
      out.push('TOTAL PAGE: ' + document.body.scrollHeight);
      return out.join('\\n');
    })()`,
    returnByValue: true,
  });
  console.log(result.value);
  ws.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
