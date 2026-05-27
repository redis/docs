#!/usr/bin/env node
/**
 * Redis pub/sub demo server.
 *
 * Run this file and visit http://localhost:8096 to publish messages to
 * named channels, watch in-process subscribers (exact-match and pattern)
 * receive them in real time, and inspect Redis' own view of the active
 * channels via PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB NUMPAT.
 */

"use strict";

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { createClient } = require("redis");

const { RedisPubSubHub } = require("./pubsub_hub");

// A small set of seed subscriptions so the demo has something to show on
// first load. Users can add or remove subscriptions live from the UI.
const DEFAULT_SUBSCRIPTIONS = [
  { name: "orders-listener", kind: "channel", target: "orders:new" },
  { name: "billing-listener", kind: "channel", target: "billing:invoice" },
  { name: "all-notifications", kind: "pattern", target: "notifications:*" },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    host: "127.0.0.1",
    port: 8096,
    redisHost: "localhost",
    redisPort: 6379,
  };

  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--host":
        config.host = args[i + 1];
        i += 1;
        break;
      case "--port":
        config.port = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      case "--redis-host":
        config.redisHost = args[i + 1];
        i += 1;
        break;
      case "--redis-port":
        config.redisPort = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      default:
        break;
    }
  }
  return config;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function readForm(req) {
  const body = await readBody(req);
  const params = new URLSearchParams(body);
  const result = {};
  for (const [key, value] of params.entries()) {
    if (!(key in result)) {
      result[key] = value;
    }
  }
  return result;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

async function buildState(hub) {
  const subs = hub.subscriptions();
  // Collect every exact-match channel mentioned by any subscription so
  // the NUMSUB report is useful in the UI without an extra round trip
  // per channel.
  const exactSet = new Set();
  for (const sub of subs) {
    if (!sub.isPattern) {
      for (const target of sub.targets) {
        exactSet.add(target);
      }
    }
  }
  const exactChannels = Array.from(exactSet).sort();

  const [activeChannels, numsub, stats] = await Promise.all([
    hub.activeChannels(),
    hub.channelSubscriberCounts(exactChannels),
    hub.stats(),
  ]);

  return {
    subscriptions: subs.map((sub) => ({
      ...sub.toJSON(),
      messages: sub.messages(15).map((m) => m.toJSON()),
    })),
    active_channels: activeChannels,
    numsub,
    stats,
  };
}

async function seedDefaultSubscriptions(hub) {
  for (const entry of DEFAULT_SUBSCRIPTIONS) {
    try {
      if (entry.kind === "pattern") {
        await hub.psubscribe(entry.name, [entry.target]);
      } else {
        await hub.subscribe(entry.name, [entry.target]);
      }
    } catch (_err) {
      // Already present from a previous reset cycle.
    }
  }
}

async function handlePublish(req, res, hub) {
  const params = await readForm(req);
  const channel = (params.channel || "").trim();
  const body = (params.message || "").trim();
  let count = Number.parseInt(params.count || "1", 10);
  if (!Number.isFinite(count)) {
    count = 1;
  }
  count = Math.max(1, Math.min(20, count));

  if (!channel) {
    sendJson(res, 400, { error: "channel is required" });
    return;
  }
  if (!body) {
    sendJson(res, 400, { error: "message is required" });
    return;
  }

  // Wrap the user's text in a small envelope so the subscriber side has
  // a stable shape (`body`, `seq`, `of`) to render.
  const delivered = [];
  for (let i = 0; i < count; i += 1) {
    const n = await hub.publish(channel, {
      body,
      seq: i + 1,
      of: count,
    });
    delivered.push(n);
  }

  sendJson(res, 200, {
    channel,
    publishes: count,
    delivered,
    state: await buildState(hub),
  });
}

async function handleSubscribe(req, res, hub) {
  const params = await readForm(req);
  const name = (params.name || "").trim();
  const kind = (params.kind || "channel").trim();
  const targetsRaw = (params.target || "").trim();

  if (!name) {
    sendJson(res, 400, { error: "name is required" });
    return;
  }
  if (!targetsRaw) {
    sendJson(res, 400, { error: "target is required" });
    return;
  }
  if (kind !== "channel" && kind !== "pattern") {
    sendJson(res, 400, { error: "kind must be 'channel' or 'pattern'" });
    return;
  }

  // Allow comma-separated targets so one subscription can cover several
  // channels (the helper binds each one).
  const targets = targetsRaw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  try {
    if (kind === "pattern") {
      await hub.psubscribe(name, targets);
    } else {
      await hub.subscribe(name, targets);
    }
  } catch (err) {
    sendJson(res, 400, { error: err.message });
    return;
  }

  sendJson(res, 200, await buildState(hub));
}

async function handleUnsubscribe(req, res, hub) {
  const params = await readForm(req);
  const name = (params.name || "").trim();
  if (!name) {
    sendJson(res, 400, { error: "name is required" });
    return;
  }
  const removed = await hub.unsubscribe(name);
  sendJson(res, 200, { removed, state: await buildState(hub) });
}

async function handleReset(req, res, hub) {
  await hub.shutdown();
  hub.resetStats();
  await seedDefaultSubscriptions(hub);
  sendJson(res, 200, await buildState(hub));
}

function htmlPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Pub/Sub Demo</title>
  <style>
    :root {
      --bg: #f6f1e8;
      --panel: #fffaf2;
      --ink: #1f2933;
      --accent: #b8572f;
      --accent-dark: #8f421f;
      --muted: #5d6b75;
      --line: #e7d9c6;
      --ok: #d7f0de;
      --warn: #f7dfd7;
      --hit: #c9e7d2;
      --miss: #f5d6c6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 28px;
    }
    .panel {
      background: rgba(255, 250, 242, 0.92);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);
    }
    .panel h2 { margin-top: 0; margin-bottom: 10px; }
    .pill {
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #cfbca6;
      font: inherit;
      background: white;
    }
    button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      background: var(--accent);
      color: white;
      padding: 11px 18px;
      font: inherit;
      cursor: pointer;
      margin-right: 8px;
      margin-top: 12px;
    }
    button.secondary { background: #38424a; }
    button.tiny {
      padding: 4px 10px;
      font-size: 0.85rem;
      margin: 0 0 0 8px;
    }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    .badge.channel { background: #f4e4c1; color: #5e4514; }
    .badge.pattern { background: var(--miss); color: #6b3220; }
    .badge.alive { background: var(--hit); color: #1d4a2c; }
    .badge.dead { background: #f0c2bc; color: #6b1f1c; }
    .sub-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #fffdf8;
    }
    .sub-card h3 { margin: 0 0 6px; font-size: 1.05rem; }
    .sub-card .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 8px; }
    .message-list { list-style: none; padding: 0; margin: 6px 0 0; max-height: 180px; overflow-y: auto; }
    .message-list li {
      border: 1px dashed #ddccb1;
      border-radius: 8px;
      padding: 6px 10px;
      margin-bottom: 6px;
      background: #fdf6e9;
      font-size: 0.9rem;
    }
    .message-list li .meta { color: var(--muted); font-size: 0.8rem; }
    pre {
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
    }
    #status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    @media (max-width: 600px) {
      main { padding-top: 28px; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">node-redis + Node.js standard http module</div>
    <h1>Redis Pub/Sub Demo</h1>
    <p class="lede">
      Publish messages to named channels and watch in-process subscribers receive them in
      real time through Redis. Exact-match subscribers register with <code>SUBSCRIBE</code>;
      pattern subscribers use <code>PSUBSCRIBE</code> with glob syntax
      (<code>notifications:*</code>, <code>orders:*</code>). Redis' own view of active
      subscribers &mdash; <code>PUBSUB CHANNELS</code>, <code>PUBSUB NUMSUB</code>,
      <code>PUBSUB NUMPAT</code> &mdash; is shown in the inspection panel.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Publish a message</h2>
        <label for="pub-channel">Channel</label>
        <input id="pub-channel" value="orders:new" list="channel-suggestions">
        <datalist id="channel-suggestions">
          <option value="orders:new">
          <option value="billing:invoice">
          <option value="notifications:email">
          <option value="notifications:push">
          <option value="cache:invalidate:products">
          <option value="chat:lobby">
        </datalist>
        <label for="pub-message">Message body</label>
        <input id="pub-message" value="hello, world">
        <label for="pub-count">How many copies</label>
        <input id="pub-count" type="number" value="1" min="1" max="20">
        <button id="publish-button">Publish</button>
      </section>

      <section class="panel">
        <h2>Add a subscriber</h2>
        <label for="sub-name">Name</label>
        <input id="sub-name" value="orders-bot">
        <label for="sub-kind">Subscription kind</label>
        <select id="sub-kind">
          <option value="channel">Exact channel (SUBSCRIBE)</option>
          <option value="pattern">Pattern (PSUBSCRIBE)</option>
        </select>
        <label for="sub-target">Channel or pattern (comma-separated for multiple)</label>
        <input id="sub-target" value="orders:new" placeholder="orders:new or orders:*">
        <button id="subscribe-button">Subscribe</button>
        <button id="reset-button" class="secondary">Reset</button>
      </section>

      <section class="panel">
        <h2>Server-side view</h2>
        <p class="meta" style="margin-top:0;color:var(--muted);">
          From <code>PUBSUB CHANNELS</code> / <code>PUBSUB NUMSUB</code> /
          <code>PUBSUB NUMPAT</code>. Pattern subscribers do not appear in
          <code>PUBSUB CHANNELS</code>; they are counted by <code>PUBSUB NUMPAT</code>.
        </p>
        <div id="server-view">Loading...</div>
      </section>

      <section class="panel">
        <h2>Hub stats</h2>
        <div id="stats-view">Loading...</div>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Active subscribers <span id="sub-count" class="badge alive">0</span></h2>
        <div id="subscribers"></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[c]);
    }

    function renderStats(stats) {
      const view = document.getElementById("stats-view");
      if (!stats) { view.textContent = "(no data)"; return; }
      const perChannel = Object.entries(stats.channel_published || {})
        .map(([ch, n]) => \`\${escapeHtml(ch)}: \${n}\`).join(", ") || "(none)";
      view.innerHTML = \`
        <dl>
          <dt>Published total</dt><dd>\${stats.published_total}</dd>
          <dt>Redis delivered total</dt><dd>\${stats.delivered_total}</dd>
          <dt>Received total (this process)</dt><dd>\${stats.received_total}</dd>
          <dt>Active subscriptions</dt><dd>\${stats.active_subscriptions}</dd>
          <dt>Pattern subscriptions (server)</dt><dd>\${stats.pattern_subscriptions}</dd>
          <dt>Per-channel publishes</dt><dd>\${perChannel}</dd>
        </dl>
      \`;
    }

    function renderServerView(state) {
      const view = document.getElementById("server-view");
      const channels = state.active_channels || [];
      const numsub = state.numsub || {};
      const channelsHtml = channels.length
        ? channels.map((c) => \`<li><strong>\${escapeHtml(c)}</strong> &middot; <span class=meta>\${numsub[c] ?? 0} subscriber(s)</span></li>\`).join("")
        : "<li><span class=meta>(no active exact-match channels)</span></li>";
      view.innerHTML = \`
        <ul class="message-list">\${channelsHtml}</ul>
      \`;
    }

    function renderSubscribers(subscriptions) {
      const wrap = document.getElementById("subscribers");
      const count = document.getElementById("sub-count");
      count.textContent = subscriptions.length;
      if (!subscriptions.length) {
        wrap.innerHTML = "<p class=meta>(no active subscribers &mdash; add one to start)</p>";
        return;
      }
      wrap.innerHTML = subscriptions.map((sub) => {
        const kind = sub.is_pattern ? "pattern" : "channel";
        const targets = sub.targets.map((t) => escapeHtml(t)).join(", ");
        const messages = (sub.messages || []).map((m) => {
          const payload = typeof m.payload === "object" ? JSON.stringify(m.payload) : String(m.payload ?? "");
          const ch = m.pattern
            ? \`\${escapeHtml(m.channel)} <span class=meta>(via \${escapeHtml(m.pattern)})</span>\`
            : escapeHtml(m.channel);
          return \`<li>
            <strong>\${ch}</strong>
            <div class=meta>\${escapeHtml(payload)}</div>
          </li>\`;
        }).join("");
        return \`<div class="sub-card">
          <h3>\${escapeHtml(sub.name)}
            <span class="badge \${kind}">\${kind}</span>
            <span class="badge \${sub.alive ? "alive" : "dead"}">\${sub.alive ? "live" : "stopped"}</span>
            <button class="tiny secondary" data-unsubscribe="\${escapeHtml(sub.name)}">Unsubscribe</button>
          </h3>
          <div class=meta>Listening to: \${targets} &middot; received \${sub.received_total} message(s)</div>
          <ul class="message-list">\${messages || '<li><span class=meta>(no messages yet)</span></li>'}</ul>
        </div>\`;
      }).join("");
      wrap.querySelectorAll("button[data-unsubscribe]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const body = new URLSearchParams({ name: btn.dataset.unsubscribe });
          await fetch("/unsubscribe", { method: "POST", body });
          setStatus(\`Unsubscribed \${btn.dataset.unsubscribe}.\`, "ok");
          refresh();
        });
      });
    }

    async function refresh() {
      const response = await fetch("/state");
      const state = await response.json();
      renderStats(state.stats);
      renderServerView(state);
      renderSubscribers(state.subscriptions || []);
    }

    document.getElementById("publish-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        channel: document.getElementById("pub-channel").value,
        message: document.getElementById("pub-message").value,
        count: document.getElementById("pub-count").value,
      });
      const response = await fetch("/publish", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Publish failed.", "error"); return; }
      const delivered = (data.delivered || []).reduce((a, b) => a + b, 0);
      setStatus(\`Published \${data.publishes} message(s) to \${data.channel}; Redis delivered \${delivered} time(s).\`, "ok");
      refresh();
    });

    document.getElementById("subscribe-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        name: document.getElementById("sub-name").value,
        kind: document.getElementById("sub-kind").value,
        target: document.getElementById("sub-target").value,
      });
      const response = await fetch("/subscribe", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Subscribe failed.", "error"); return; }
      setStatus("Subscriber added.", "ok");
      refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      await fetch("/reset", { method: "POST" });
      setStatus("Hub reset — default subscribers re-seeded.", "ok");
      refresh();
    });

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>`;
}

async function main() {
  const config = parseArgs();
  const redisUrl = `redis://${config.redisHost}:${config.redisPort}`;
  const client = createClient({ url: redisUrl });
  client.on("error", (err) => {
    console.error("[redis] error:", err.message);
  });
  await client.connect();

  const hub = new RedisPubSubHub(client);
  await seedDefaultSubscriptions(hub);

  const server = http.createServer(async (req, res) => {
    try {
      const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const path = parsed.pathname;

      if (req.method === "GET" && (path === "/" || path === "/index.html")) {
        sendHtml(res, 200, htmlPage());
        return;
      }
      if (req.method === "GET" && path === "/state") {
        sendJson(res, 200, await buildState(hub));
        return;
      }
      if (req.method === "POST" && path === "/publish") {
        await handlePublish(req, res, hub);
        return;
      }
      if (req.method === "POST" && path === "/subscribe") {
        await handleSubscribe(req, res, hub);
        return;
      }
      if (req.method === "POST" && path === "/unsubscribe") {
        await handleUnsubscribe(req, res, hub);
        return;
      }
      if (req.method === "POST" && path === "/reset") {
        await handleReset(req, res, hub);
        return;
      }
      sendNotFound(res);
    } catch (err) {
      console.error("[demo] handler error:", err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: err.message });
      } else {
        res.end();
      }
    }
  });

  server.listen(config.port, config.host, () => {
    console.log(
      `Redis pub/sub demo server listening on http://${config.host}:${config.port}`,
    );
    console.log(`Using Redis at ${config.redisHost}:${config.redisPort}`);
    console.log(
      `Seeded ${DEFAULT_SUBSCRIPTIONS.length} default subscription(s)`,
    );
  });

  const shutdown = async () => {
    console.log("\n[demo] shutting down");
    try {
      await hub.shutdown();
    } catch (_err) {
      // best effort
    }
    server.close(async () => {
      try {
        await client.quit();
      } catch (_err) {
        // ignore
      }
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[demo] fatal:", err);
  process.exit(1);
});
