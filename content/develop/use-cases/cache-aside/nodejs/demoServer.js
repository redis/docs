#!/usr/bin/env node
"use strict";

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { createClient } = require("redis");
const { RedisCache } = require("./cache");
const { MockPrimaryStore } = require("./primary");

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    port: 8080,
    redisHost: "localhost",
    redisPort: 6379,
    ttl: 30,
    primaryLatencyMs: 150,
  };

  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--port":
        config.port = Number.parseInt(args[++i], 10);
        break;
      case "--redis-host":
        config.redisHost = args[++i];
        break;
      case "--redis-port":
        config.redisPort = Number.parseInt(args[++i], 10);
        break;
      case "--ttl":
        config.ttl = Number.parseInt(args[++i], 10);
        break;
      case "--primary-latency-ms":
        config.primaryLatencyMs = Number.parseInt(args[++i], 10);
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
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function htmlPage(productIds, primaryLatencyMs, cacheTtl) {
  const options = productIds
    .map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Cache-Aside Demo</title>
  <style>
    :root {
      --bg: #f6f1e8; --panel: #fffaf2; --ink: #1f2933; --accent: #b8572f;
      --accent-dark: #8f421f; --muted: #5d6b75; --line: #e7d9c6;
      --ok: #d7f0de; --warn: #f7dfd7; --hit: #c9e7d2; --miss: #f5d6c6;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Georgia, "Times New Roman", serif; color: var(--ink);
      background: radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%); min-height: 100vh; }
    main { max-width: 980px; margin: 0 auto; padding: 48px 20px 72px; }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 52rem; font-size: 1.1rem; color: var(--muted); }
    .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: 28px; }
    .panel { background: rgba(255, 250, 242, 0.92); border: 1px solid var(--line);
      border-radius: 18px; padding: 22px; box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08); }
    .panel h2 { margin-top: 0; margin-bottom: 10px; }
    .pill { display: inline-block; border-radius: 999px; background: #efe2cf;
      color: var(--accent-dark); padding: 6px 10px; font-size: 0.9rem; margin-bottom: 12px; }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select { width: 100%; padding: 10px 12px; border-radius: 10px;
      border: 1px solid #cfbca6; font: inherit; background: white; }
    button { appearance: none; border: 0; border-radius: 999px; background: var(--accent);
      color: white; padding: 11px 18px; font: inherit; cursor: pointer; margin-right: 8px; margin-top: 12px; }
    button.secondary { background: #38424a; }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge { display: inline-block; border-radius: 6px; padding: 3px 8px; font-size: 0.85rem; font-weight: bold; }
    .badge.hit { background: var(--hit); color: #1d4a2c; }
    .badge.miss { background: var(--miss); color: #6b3220; }
    #status { margin-top: 20px; padding: 14px 16px; border-radius: 14px; display: none; }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    @media (max-width: 600px) { main { padding-top: 28px; } button { width: 100%; } }
  </style>
</head>
<body>
  <main>
    <div class="pill">node-redis + Node.js standard http module</div>
    <h1>Redis Cache-Aside Demo</h1>
    <p class="lede">
      Read product records through Redis. The first read of any key falls
      through to a deliberately slow primary store (${primaryLatencyMs} ms per
      read); subsequent reads come from Redis until the ${cacheTtl}-second TTL
      expires or the entry is invalidated. The stampede test fires concurrent
      reads at a cold key to show a single-flight Lua lock funnelling them
      down to one primary read.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Read a product</h2>
        <label for="product-id">Product ID</label>
        <select id="product-id">${options}</select>
        <button id="read-button">Read through cache</button>
        <button id="invalidate-button" class="secondary">Invalidate cache</button>
        <p>Read once to populate the cache, then again to see the hit. Wait
        for the TTL to pass or click <em>Invalidate</em> to force a miss.</p>
      </section>

      <section class="panel">
        <h2>Update a field</h2>
        <p>Updating writes to the primary and deletes the cache entry, so the
        next read sees the new value.</p>
        <label for="update-field">Field</label>
        <select id="update-field">
          <option value="name">name</option>
          <option value="price_cents">price_cents</option>
          <option value="stock">stock</option>
        </select>
        <label for="update-value">New value</label>
        <input id="update-value" value="999">
        <button id="update-button">Apply update</button>
      </section>

      <section class="panel">
        <h2>Stampede test</h2>
        <p>Invalidates the selected key, then fires N concurrent reads. With
        single-flight enabled, only one of those reads should hit the primary.</p>
        <label for="stampede-concurrency">Concurrent readers</label>
        <input id="stampede-concurrency" type="number" value="20" min="2" max="50">
        <button id="stampede-button">Run stampede test</button>
      </section>

      <section class="panel">
        <h2>Cache stats</h2>
        <div id="stats-view">Loading...</div>
        <button id="reset-button" class="secondary">Reset counters</button>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Last result</h2>
        <div id="result-view"><p>Read a product to see the cached record and timing.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const productSelect = document.getElementById("product-id");
    const updateField = document.getElementById("update-field");
    const updateValue = document.getElementById("update-value");
    const stampedeConcurrency = document.getElementById("stampede-concurrency");
    const statsView = document.getElementById("stats-view");
    const resultView = document.getElementById("result-view");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) { statusBox.textContent = message; statusBox.className = kind; }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
    function renderStats(stats) {
      if (!stats) { statsView.textContent = "(no data)"; return; }
      statsView.innerHTML = \`
        <dl>
          <dt>Hits</dt><dd>\${stats.hits}</dd>
          <dt>Misses</dt><dd>\${stats.misses}</dd>
          <dt>Hit rate</dt><dd>\${stats.hit_rate_pct}%</dd>
          <dt>Stampedes suppressed</dt><dd>\${stats.stampedes_suppressed}</dd>
          <dt>Primary reads (total)</dt><dd>\${stats.primary_reads_total}</dd>
          <dt>Primary read latency</dt><dd>\${stats.primary_read_latency_ms} ms</dd>
        </dl>\`;
    }
    function renderRead(data) {
      if (!data || !data.record) { resultView.innerHTML = "<p>(no record)</p>"; return; }
      const r = data.record;
      const badge = data.hit
        ? '<span class="badge hit">cache hit</span>'
        : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = \`
        <p>\${badge} &nbsp; Redis read: <strong>\${data.redis_latency_ms} ms</strong>
           &nbsp; Total: <strong>\${data.total_latency_ms} ms</strong>
           &nbsp; TTL remaining: <strong>\${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>\${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>\${escapeHtml(r.name ?? "")}</dd>
          <dt>price_cents</dt><dd>\${escapeHtml(r.price_cents ?? "")}</dd>
          <dt>stock</dt><dd>\${escapeHtml(r.stock ?? "")}</dd>
        </dl>\`;
    }
    function renderStampede(data) {
      const hits = data.results.filter((r) => r.hit).length;
      const misses = data.results.length - hits;
      resultView.innerHTML = \`
        <p>Fired <strong>\${data.concurrency}</strong> concurrent reads in
           <strong>\${data.elapsed_ms}</strong> ms.</p>
        <p>Cache misses: <strong>\${misses}</strong> &nbsp;
           Cache hits: <strong>\${hits}</strong> &nbsp;
           Primary reads: <strong>\${data.primary_reads}</strong></p>
        <p>With stampede protection, primary reads should be 1 even though all
           \${data.concurrency} callers raced for a cold key. Without it,
           every concurrent miss would query the primary independently.</p>\`;
    }
    async function loadStats() {
      const r = await fetch("/stats"); renderStats(await r.json());
    }
    document.getElementById("read-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch(\`/read?id=\${encodeURIComponent(id)}\`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
      renderRead(d); renderStats(d.stats);
      setStatus(d.hit ? "Served from Redis." : "Loaded from primary and cached.", "ok");
    });
    document.getElementById("invalidate-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch("/invalidate", { method: "POST", body: new URLSearchParams({ id }) });
      const d = await r.json();
      renderStats(d.stats);
      setStatus(d.deleted ? "Cache key deleted." : "No cache entry to delete.", "ok");
    });
    document.getElementById("update-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch("/update", {
        method: "POST",
        body: new URLSearchParams({ id, field: updateField.value, value: updateValue.value }),
      });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
      renderStats(d.stats); setStatus("Primary updated; cache invalidated.", "ok");
    });
    document.getElementById("stampede-button").addEventListener("click", async () => {
      const id = productSelect.value;
      setStatus("Running stampede test...", "ok");
      const r = await fetch("/stampede", {
        method: "POST",
        body: new URLSearchParams({ id, concurrency: stampedeConcurrency.value }),
      });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Test failed.", "error"); return; }
      renderStampede(d); renderStats(d.stats);
      setStatus(\`Stampede complete: \${d.primary_reads} primary read(s) for \${d.concurrency} concurrent callers.\`, "ok");
    });
    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      renderStats(await r.json()); setStatus("Counters reset.", "ok");
    });
    loadStats();
  </script>
</body>
</html>
`;
}

function buildStats(cache, primary) {
  const stats = cache.stats();
  stats.primary_reads_total = primary.reads();
  stats.primary_read_latency_ms = primary.readLatencyMs;
  return stats;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

async function handleRead(url, cache, primary) {
  const id = url.searchParams.get("id") || "";
  if (!id) return { status: 400, body: { error: "Missing 'id' query parameter." } };
  const started = process.hrtime.bigint();
  const { record, hit, redisLatencyMs } = await cache.get(id, (k) => primary.read(k));
  const totalMs = Number(process.hrtime.bigint() - started) / 1e6;
  if (!record) return { status: 404, body: { error: `No record for '${id}'.` } };
  return {
    status: 200,
    body: {
      id,
      record,
      hit,
      redis_latency_ms: Math.round(redisLatencyMs * 100) / 100,
      total_latency_ms: Math.round(totalMs * 100) / 100,
      ttl_remaining: await cache.ttlRemaining(id),
      stats: buildStats(cache, primary),
    },
  };
}

async function handleStampede(form, cache, primary) {
  const id = form.get("id") || "";
  let concurrency = Number.parseInt(form.get("concurrency") || "20", 10);
  if (!Number.isFinite(concurrency)) concurrency = 20;
  concurrency = Math.max(2, Math.min(50, concurrency));
  if (!id) return { status: 400, body: { error: "Missing 'id'." } };

  await cache.invalidate(id);
  const before = primary.reads();
  const started = process.hrtime.bigint();
  const promises = [];
  for (let i = 0; i < concurrency; i += 1) {
    promises.push(cache.get(id, (k) => primary.read(k)));
  }
  const settled = await Promise.all(promises);
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  const after = primary.reads();
  return {
    status: 200,
    body: {
      id,
      concurrency,
      primary_reads: after - before,
      elapsed_ms: Math.round(elapsedMs * 100) / 100,
      results: settled.map((r) => ({
        hit: r.hit,
        redis_latency_ms: Math.round(r.redisLatencyMs * 100) / 100,
        found: r.record !== null,
      })),
      stats: buildStats(cache, primary),
    },
  };
}

async function main() {
  const config = parseArgs();
  const client = createClient({
    socket: { host: config.redisHost, port: config.redisPort },
  });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();

  const cache = new RedisCache({ redisClient: client, ttl: config.ttl });
  const primary = new MockPrimaryStore({ readLatencyMs: config.primaryLatencyMs });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    try {
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        const html = htmlPage(primary.listIds(), primary.readLatencyMs, cache.ttl);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }
      if (req.method === "GET" && url.pathname === "/products") {
        sendJson(res, 200, { products: primary.listIds() });
        return;
      }
      if (req.method === "GET" && url.pathname === "/read") {
        const r = await handleRead(url, cache, primary);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "GET" && url.pathname === "/stats") {
        sendJson(res, 200, buildStats(cache, primary));
        return;
      }
      if (req.method === "POST" && url.pathname === "/invalidate") {
        const form = new URLSearchParams(await readBody(req));
        const id = form.get("id") || "";
        if (!id) { sendJson(res, 400, { error: "Missing 'id'." }); return; }
        const deleted = await cache.invalidate(id);
        sendJson(res, 200, { id, deleted, stats: buildStats(cache, primary) });
        return;
      }
      if (req.method === "POST" && url.pathname === "/update") {
        const form = new URLSearchParams(await readBody(req));
        const id = form.get("id") || "";
        const field = form.get("field") || "";
        const value = form.get("value") || "";
        if (!id || !field) { sendJson(res, 400, { error: "Missing 'id' or 'field'." }); return; }
        if (!primary.updateField(id, field, value)) {
          sendJson(res, 404, { error: "Unknown product." });
          return;
        }
        await cache.invalidate(id);
        sendJson(res, 200, { id, field, value, stats: buildStats(cache, primary) });
        return;
      }
      if (req.method === "POST" && url.pathname === "/stampede") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleStampede(form, cache, primary);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/reset") {
        cache.resetStats();
        primary.resetReads();
        sendJson(res, 200, buildStats(cache, primary));
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    } catch (err) {
      console.error("Request error:", err);
      sendJson(res, 500, { error: err.message || "Internal error" });
    }
  });

  server.listen(config.port, () => {
    console.log(`Redis cache-aside demo server listening on http://127.0.0.1:${config.port}`);
    console.log(`Using Redis at ${config.redisHost}:${config.redisPort} with cache TTL ${config.ttl}s`);
    console.log(`Mock primary read latency: ${config.primaryLatencyMs} ms`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
