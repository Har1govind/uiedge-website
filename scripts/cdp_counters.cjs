// Reads final values of the animated counters by scrolling sections into view.
const http = require("http");

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port: 9223, path }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(e); }
      });
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
  if (!page) { console.error("No page target"); process.exit(1); }

  const { ws, send } = await connect(page.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: "https://fabrica.framer.media/" });
  await new Promise((r) => setTimeout(r, 5000));

  // Scroll through the page in steps, waiting for counters to animate
  const { result } = await send("Runtime.evaluate", {
    expression: `(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const sections = ['Advantages', 'Text'];
      const out = [];
      for (const name of sections) {
        const sec = document.querySelector('[data-framer-name="' + name + '"]');
        if (!sec) continue;
        sec.scrollIntoView({ block: 'center' });
        await wait(6000);
        // grab all text nodes with numbers
        const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT);
        const parts = [];
        while (walker.nextNode()) {
          const t = walker.currentNode.textContent.trim();
          if (t) parts.push(t);
        }
        out.push(name + ' => ' + parts.join(' | '));
      }
      return out.join('\\n=== \\n');
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log(result.value);
  ws.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
