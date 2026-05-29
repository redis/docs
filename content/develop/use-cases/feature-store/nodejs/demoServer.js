#!/usr/bin/env node
"use strict";

/**
 * Redis feature-store demo server (Node.js).
 *
 * Run this file and visit http://localhost:8086 to watch an online
 * feature store at work: a batch materialization loads N users with a
 * 24-hour key-level TTL, a streaming worker overwrites a handful of
 * users' real-time features every second with a per-field `HEXPIRE`,
 * and the inference panel reads any subset of features for any user
 * with `HMGET` in a single round trip.
 *
 * Use the UI to:
 *
 *   - Bulk-load (re-materialize) the batch features, optionally with a
 *     short TTL so you can watch a whole entity expire on schedule.
 *   - Pause the streaming worker and watch the streaming fields drop
 *     out via `HEXPIRE` while the batch fields remain populated under
 *     the longer key-level TTL — the *mixed staleness* story made
 *     visible.
 *   - Pull features for one user (`HMGET`) and see the value, per-field
 *     TTL, and read latency.
 *   - Batch-score N users in one round trip and see the per-entity /
 *     per-round-trip latency split.
 *   - Inspect a single user's hash in detail with field-level TTLs.
 */

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { performance } = require("perf_hooks");
const { createClient } = require("redis");

const {
  FeatureStore,
  DEFAULT_BATCH_FIELDS,
  DEFAULT_STREAMING_FIELDS,
} = require("./featureStore");
const { StreamingWorker } = require("./streamingWorker");
const { synthesizeUsers } = require("./buildFeatures");


const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Feature Store Demo (Node.js)</title>
  <style>
    :root {
      --bg: #eef3f1;
      --panel: #ffffff;
      --ink: #1d2730;
      --accent: #267d6b;
      --accent-dark: #1a594c;
      --muted: #5c6770;
      --line: #d4dfdb;
      --ok: #d2ecdf;
      --warn: #f8e0d0;
      --pill: #d9ebe6;
      --batch: #e6e0f0;
      --stream: #d9ebe6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #f3faf7, transparent 32rem),
        linear-gradient(180deg, #ecf2f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main { max-width: 1080px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 58rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid; gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 24px;
    }
    .panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill {
      display: inline-block; border-radius: 999px;
      background: var(--pill); color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px;
    }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small { padding: 5px 10px; font-size: 0.85rem; margin-top: 4px; }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.batch { background: var(--batch); color: #43326a; }
    .badge.stream { background: var(--stream); color: #1d4a2c; }
    .badge.expired { background: var(--warn); color: #6b3220; }
    .badge.untracked { background: #eceff1; color: #3b4951; }
    .badge.running { background: var(--ok); color: #1d4a2c; }
    .badge.paused { background: var(--warn); color: #6b3220; }
    .ttl-pos { color: #1a594c; font-weight: bold; }
    .ttl-neg { color: #6b3220; }
    .field-list { display: flex; gap: 6px 12px; flex-wrap: wrap; }
    .field-list label {
      display: inline-flex; align-items: center; gap: 4px;
      margin: 0; font-weight: normal; font-size: 0.9rem;
    }
    .field-list input { width: auto; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">node-redis + Node.js standard http module</div>
    <h1>Redis Feature Store Demo</h1>
    <p class="lede">
      A small fraud-scoring feature store. Each user is one Redis hash
      at <code>__KEY_PREFIX__{id}</code> with a batch-materialized
      <span class="badge batch">batch</span> half (daily aggregates,
      24-hour key-level <code>EXPIRE</code>) and a streaming
      <span class="badge stream">streaming</span> half (real-time
      signals, <code>__STREAM_TTL__</code>s per-field <code>HEXPIRE</code>).
      Inference reads any subset with one <code>HMGET</code>; batch
      scoring pipelines <code>HMGET</code> across N users.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Store state</h2>
        <div id="store-view">Loading...</div>
      </section>

      <section class="panel">
        <h2>Materialize batch features</h2>
        <p>Calls <code>HSET</code> + <code>EXPIRE</code> for each user
          inside a <code>multi()</code>, so the whole batch ships in
          one round trip.</p>
        <label for="bulk-count">How many users</label>
        <input id="bulk-count" type="number" min="1" max="2000" value="200">
        <label for="bulk-ttl">Key-level TTL (seconds)</label>
        <input id="bulk-ttl" type="number" min="5" max="172800" value="86400">
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Drop the TTL to e.g. 30 s and watch entities disappear on
          schedule — the same thing that happens if a daily refresher
          fails.
        </p>
        <button id="bulk-button">Bulk-load</button>
        <button id="reset-button" class="danger">Reset (drop every user)</button>
      </section>

      <section class="panel">
        <h2>Streaming worker</h2>
        <p>Picks <code>__USERS_PER_TICK__</code> users per tick, writes the
          streaming features, applies <code>HEXPIRE</code>
          <code>__STREAM_TTL__</code>s per field. Pause it and the
          streaming fields drop out via per-field TTL while the batch
          fields stay populated.</p>
        <div id="worker-view"></div>
        <button id="worker-pause-button" class="secondary">Pause / resume</button>
      </section>

      <section class="panel wide">
        <h2>Inference read (HMGET)</h2>
        <p>Pick a user and a feature subset. One <code>HMGET</code>
          round trip returns whatever the model needs.</p>
        <div class="row">
          <div>
            <label for="read-user">User</label>
            <select id="read-user"></select>
          </div>
          <div>
            <label>&nbsp;</label>
            <button id="read-button" class="secondary">Read features</button>
          </div>
        </div>
        <h3>Feature subset</h3>
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Tick to include in the <code>HMGET</code>. Per-field TTL is
          shown next to each field in the result table.
        </p>
        <div id="read-fields" class="field-list"></div>
        <div id="read-result" style="margin-top: 16px;">
          <p>Pick a user and click <strong>Read features</strong>.</p>
        </div>
      </section>

      <section class="panel">
        <h2>Batch scoring</h2>
        <p>Pipelined <code>HMGET</code> across N random users via
          <code>multi()</code>. One network round trip for the whole
          batch.</p>
        <label for="batch-count">How many users</label>
        <input id="batch-count" type="number" min="1" max="500" value="100">
        <button id="batch-button" class="secondary">Pipeline HMGET</button>
        <div id="batch-result" style="margin-top: 14px;">
          <p>(no batch read yet)</p>
        </div>
      </section>

      <section class="panel">
        <h2>Inspect one user</h2>
        <p><code>HGETALL</code> plus per-field <code>HTTL</code> and
          key-level <code>TTL</code>. Useful for spotting which
          streaming fields have already expired.</p>
        <label for="inspect-user">User</label>
        <select id="inspect-user"></select>
        <button id="inspect-button">Inspect</button>
        <div id="inspect-result" style="margin-top: 14px;">
          <p>(pick a user and click Inspect)</p>
        </div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const BATCH_FIELDS = __BATCH_FIELDS_JSON__;
    const STREAM_FIELDS = __STREAM_FIELDS_JSON__;

    const storeView = document.getElementById("store-view");
    const workerView = document.getElementById("worker-view");
    const readUserSelect = document.getElementById("read-user");
    const inspectUserSelect = document.getElementById("inspect-user");
    const readFieldsBox = document.getElementById("read-fields");
    const readResult = document.getElementById("read-result");
    const batchResult = document.getElementById("batch-result");
    const inspectResult = document.getElementById("inspect-result");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function classifyField(name) {
      if (BATCH_FIELDS.includes(name)) return "batch";
      if (STREAM_FIELDS.includes(name)) return "stream";
      return "other";
    }

    function ttlLabel(seconds) {
      if (seconds === -2) return '<span class="badge expired">missing</span>';
      if (seconds === -1) return '<span class="badge untracked">no TTL</span>';
      return \`<span class="ttl-pos mono">\${seconds}s</span>\`;
    }

    function renderStore(state) {
      const stats = state.stats || {};
      storeView.innerHTML = \`
        <dl>
          <dt>Users in store</dt><dd>\${state.entity_count}</dd>
          <dt>Key prefix</dt><dd class="mono">\${escapeHtml(state.key_prefix)}*</dd>
          <dt>Batch TTL</dt><dd>\${state.batch_ttl_seconds}s</dd>
          <dt>Streaming TTL</dt><dd>\${state.streaming_ttl_seconds}s</dd>
          <dt>Batch writes</dt><dd>\${stats.batch_writes_total ?? 0}</dd>
          <dt>Streaming writes</dt><dd>\${stats.streaming_writes_total ?? 0}</dd>
          <dt>Reads</dt><dd>\${stats.reads_total ?? 0}</dd>
          <dt>Fields returned</dt><dd>\${stats.read_fields_total ?? 0}</dd>
        </dl>
      \`;
    }

    function renderWorker(state) {
      const w = state.worker || {};
      const badge = w.paused
        ? '<span class="badge paused">paused</span>'
        : w.running
          ? '<span class="badge running">running</span>'
          : '<span class="badge expired">stopped</span>';
      workerView.innerHTML = \`
        <p>\${badge} <span class="mono">ticks=\${w.tick_count ?? 0}
          writes=\${w.writes_count ?? 0}</span></p>
      \`;
    }

    function populateUserSelects(ids) {
      for (const sel of [readUserSelect, inspectUserSelect]) {
        const previous = sel.value;
        sel.innerHTML = ids.map((id) =>
          \`<option value="\${escapeHtml(id)}">\${escapeHtml(id)}</option>\`
        ).join("");
        if (ids.includes(previous)) sel.value = previous;
      }
    }

    function renderFieldPicker() {
      const allFields = [...BATCH_FIELDS, ...STREAM_FIELDS];
      readFieldsBox.innerHTML = allFields.map((f) => {
        const kind = classifyField(f);
        const checked = ["risk_segment", "tx_count_7d", "avg_amount_30d",
                         "tx_count_5m", "failed_logins_15m"].includes(f)
                         ? "checked" : "";
        return \`<label>
          <input type="checkbox" name="field" value="\${escapeHtml(f)}" \${checked}>
          <span class="badge \${kind}">\${kind}</span>
          <span class="mono">\${escapeHtml(f)}</span>
        </label>\`;
      }).join("");
    }

    function selectedReadFields() {
      return Array.from(
        readFieldsBox.querySelectorAll('input[name="field"]:checked')
      ).map((el) => el.value);
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStore(state);
      renderWorker(state);
      populateUserSelects(state.entity_ids || []);
    }

    document.getElementById("bulk-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("bulk-count").value, 10) || 1;
      const ttl = parseInt(document.getElementById("bulk-ttl").value, 10) || 86400;
      const body = new URLSearchParams({ count, ttl });
      const r = await fetch("/bulk-load", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Bulk-load failed.", "error"); return; }
      setStatus(
        \`Materialized \${d.loaded} user(s) with a \${d.ttl_seconds}s key-level TTL in \${d.elapsed_ms.toFixed(1)} ms.\`,
        "ok",
      );
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop every user from the store?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Reset failed.", "error"); return; }
      setStatus(\`Reset. Dropped \${d.deleted} user(s).\`, "ok");
      await refresh();
    });

    document.getElementById("worker-pause-button").addEventListener("click", async () => {
      const r = await fetch("/worker/toggle", { method: "POST" });
      const d = await r.json();
      setStatus(d.paused ? "Streaming worker paused." : "Streaming worker resumed.", "ok");
      await refresh();
    });

    document.getElementById("read-button").addEventListener("click", async () => {
      const user = readUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const fields = selectedReadFields();
      const body = new URLSearchParams();
      body.set("user", user);
      for (const f of fields) body.append("field", f);
      const r = await fetch("/read", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
      const rows = (d.requested || []).map((name) => {
        const value = d.values[name];
        const ttl = d.ttls[name];
        const kind = classifyField(name);
        return \`<tr>
          <td><span class="badge \${kind}">\${kind}</span> <span class="mono">\${escapeHtml(name)}</span></td>
          <td class="mono">\${value === undefined || value === null
            ? '<span class="badge expired">missing</span>'
            : escapeHtml(value)}</td>
          <td>\${ttlLabel(ttl)}</td>
        </tr>\`;
      }).join("");
      readResult.innerHTML = \`
        <p><strong>HMGET</strong> \${escapeHtml(user)} (\${d.requested.length} field(s))
          returned \${d.returned_count} value(s) in
          <strong>\${d.elapsed_ms.toFixed(2)} ms</strong>.
          Key-level TTL: \${ttlLabel(d.key_ttl_seconds)}.</p>
        \${d.requested.length === 0 ? "" :
          \`<table>
            <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
            <tbody>\${rows}</tbody>
          </table>\`}
      \`;
    });

    document.getElementById("batch-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("batch-count").value, 10) || 1;
      const fields = selectedReadFields();
      const body = new URLSearchParams();
      body.set("count", count);
      for (const f of fields) body.append("field", f);
      const r = await fetch("/batch-read", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Batch read failed.", "error"); return; }
      const perEntity = d.entity_count === 0 ? 0 : d.elapsed_ms / d.entity_count;
      const rows = (d.sample || []).map((row) => \`
        <tr>
          <td class="mono">\${escapeHtml(row.id)}</td>
          <td>\${row.field_count}</td>
        </tr>\`).join("");
      batchResult.innerHTML = \`
        <p>Pipelined <code>HMGET</code> across <strong>\${d.entity_count}</strong> users
          (\${d.field_count} field(s) each) in
          <strong>\${d.elapsed_ms.toFixed(2)} ms</strong>
          (~\${perEntity.toFixed(3)} ms / user, one network round trip total).</p>
        \${(d.sample || []).length === 0 ? "" :
          \`<h3>Sample</h3>
           <table>
             <thead><tr><th>user</th><th>fields returned</th></tr></thead>
             <tbody>\${rows}</tbody>
           </table>\`}
      \`;
    });

    document.getElementById("inspect-button").addEventListener("click", async () => {
      const user = inspectUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const params = new URLSearchParams({ user });
      const r = await fetch(\`/inspect?\${params.toString()}\`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Inspect failed.", "error"); return; }
      const rows = (d.fields || []).map((f) => \`
        <tr>
          <td><span class="badge \${classifyField(f.name)}">\${classifyField(f.name)}</span>
              <span class="mono">\${escapeHtml(f.name)}</span></td>
          <td class="mono">\${escapeHtml(f.value)}</td>
          <td>\${ttlLabel(f.ttl_seconds)}</td>
        </tr>\`).join("");
      inspectResult.innerHTML = d.exists === false
        ? \`<p><span class="badge expired">missing</span> <code>\${escapeHtml(user)}</code> isn't in the store. Either it was never materialized or its key-level TTL expired.</p>\`
        : \`<p>Key-level TTL: \${ttlLabel(d.key_ttl_seconds)} &nbsp; (\${d.fields.length} field(s))</p>
           <table>
             <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
             <tbody>\${rows}</tbody>
           </table>\`;
    });

    renderFieldPicker();
    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
`;


class FeatureStoreDemo {
  /**
   * @param {object} options
   * @param {FeatureStore} options.store
   * @param {StreamingWorker} options.worker
   * @param {number} options.seed
   */
  constructor({ store, worker, seed }) {
    this.store = store;
    this.worker = worker;
    this.seed = seed;
  }

  async materialize(count, ttlSeconds) {
    const rows = synthesizeUsers(count, this.seed);
    const start = performance.now();
    const loaded = await this.store.bulkLoad(rows, ttlSeconds);
    const elapsedMs = performance.now() - start;
    return { loaded, ttl_seconds: ttlSeconds, elapsed_ms: elapsedMs };
  }

  async reset() {
    // Pause the streaming worker around the DEL sweep so a concurrent
    // tick can't recreate a user that was just enumerated for deletion
    // (streaming HSET creates the key if it's missing, and that would
    // leave behind a streaming-only hash with no key-level TTL).
    // pause() only blocks *future* ticks — we also have to await
    // waitForIdle() so an already-running tick finishes its
    // updateStreaming loop before we start enumerating keys.
    const wasPaused = this.worker.paused;
    if (this.worker.running) {
      if (!wasPaused) this.worker.pause();
      await this.worker.waitForIdle();
    }
    try {
      const deleted = await this.store.reset();
      this.store.resetStats();
      this.worker.resetStats();
      return { deleted };
    } finally {
      if (this.worker.running && !wasPaused) this.worker.resume();
    }
  }

  toggleWorker() {
    if (!this.worker.running) this.worker.start();
    if (this.worker.paused) this.worker.resume();
    else this.worker.pause();
    return { paused: this.worker.paused, running: this.worker.running };
  }
}


function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}


function sendJson(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}


function sendHtml(res, html, status = 200) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}


function renderHtmlPage(store, worker) {
  return HTML_TEMPLATE
    .replaceAll("__KEY_PREFIX__", store.keyPrefix)
    .replaceAll("__STREAM_TTL__", String(store.streamingTtlSeconds))
    .replaceAll("__USERS_PER_TICK__", String(worker.usersPerTick))
    .replaceAll("__BATCH_FIELDS_JSON__", JSON.stringify([...DEFAULT_BATCH_FIELDS]))
    .replaceAll("__STREAM_FIELDS_JSON__", JSON.stringify([...DEFAULT_STREAMING_FIELDS]));
}


async function handleRequest(req, res, ctx) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const { store, worker, demo } = ctx;

  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      sendHtml(res, renderHtmlPage(store, worker));
      return;
    }
    if (req.method === "GET" && url.pathname === "/state") {
      const ids = await store.listEntityIds(500);
      // listEntityIds caps at 500 for the dropdown; report the true total
      // separately so the UI's "users in store" doesn't silently truncate.
      const entityCount = await store.countEntities();
      sendJson(res, {
        key_prefix: store.keyPrefix,
        batch_ttl_seconds: store.batchTtlSeconds,
        streaming_ttl_seconds: store.streamingTtlSeconds,
        entity_count: entityCount,
        entity_ids: ids,
        stats: store.stats(),
        worker: worker.statsSnapshot(),
      });
      return;
    }
    if (req.method === "GET" && url.pathname === "/inspect") {
      const user = (url.searchParams.get("user") || "").trim();
      if (!user) { sendJson(res, { error: "user is required" }, 400); return; }
      const full = await store.getFeatures(user, null);
      if (Object.keys(full).length === 0) {
        const keyTtl = await store.keyTtlSeconds(user);
        sendJson(res, { exists: false, key_ttl_seconds: keyTtl });
        return;
      }
      const fieldNames = Object.keys(full);
      const ttls = await store.fieldTtlsSeconds(user, fieldNames);
      const keyTtl = await store.keyTtlSeconds(user);
      const fields = fieldNames
        .map((name) => ({ name, value: full[name], ttl_seconds: ttls[name] ?? -1 }))
        .sort((a, b) => a.name.localeCompare(b.name));
      sendJson(res, {
        exists: true,
        key_ttl_seconds: keyTtl,
        fields,
      });
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(404).end();
      return;
    }

    const body = await readBody(req);
    const params = new URLSearchParams(body);

    if (url.pathname === "/bulk-load") {
      const count = Math.max(1, Math.min(2000, Number(params.get("count") || "200")));
      const ttl = Math.max(5, Math.min(172_800, Number(params.get("ttl") || "86400")));
      sendJson(res, await demo.materialize(count, ttl));
      return;
    }
    if (url.pathname === "/reset") {
      sendJson(res, await demo.reset());
      return;
    }
    if (url.pathname === "/worker/toggle") {
      sendJson(res, demo.toggleWorker());
      return;
    }
    if (url.pathname === "/read") {
      const user = (params.get("user") || "").trim();
      if (!user) { sendJson(res, { error: "user is required" }, 400); return; }
      const fields = params.getAll("field").filter((f) => f);
      const start = performance.now();
      const values = fields.length ? await store.getFeatures(user, fields) : {};
      const elapsedMs = performance.now() - start;
      const ttls = fields.length ? await store.fieldTtlsSeconds(user, fields) : {};
      const keyTtl = await store.keyTtlSeconds(user);
      sendJson(res, {
        requested: fields,
        values,
        ttls,
        key_ttl_seconds: keyTtl,
        returned_count: Object.keys(values).length,
        elapsed_ms: elapsedMs,
      });
      return;
    }
    if (url.pathname === "/batch-read") {
      const count = Math.max(1, Math.min(500, Number(params.get("count") || "100")));
      let fields = params.getAll("field").filter((f) => f);
      if (fields.length === 0) {
        fields = [...DEFAULT_STREAMING_FIELDS, "risk_segment"];
      }
      let ids = await store.listEntityIds(2000);
      if (ids.length > count) ids = ids.slice(0, count);
      const start = performance.now();
      const rows = await store.batchGetFeatures(ids, fields);
      const elapsedMs = performance.now() - start;
      const sample = ids.slice(0, 10).map((id) => ({
        id,
        field_count: Object.keys(rows[id] || {}).length,
      }));
      sendJson(res, {
        entity_count: ids.length,
        field_count: fields.length,
        elapsed_ms: elapsedMs,
        sample,
      });
      return;
    }

    res.writeHead(404).end();
  } catch (err) {
    console.error(`[demo] ${req.method} ${url.pathname} failed:`, err);
    sendJson(res, { error: err.message || "internal error" }, 500);
  }
}


function parseArgs(argv) {
  const opts = {
    host: "127.0.0.1",
    port: 8086,
    redisHost: "localhost",
    redisPort: 6379,
    keyPrefix: "fs:user:",
    batchTtlSeconds: 24 * 60 * 60,
    streamingTtlSeconds: 5 * 60,
    usersPerTick: 5,
    seedUsers: 200,
    resetOnStart: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[i + 1];
    switch (arg) {
      case "--host": opts.host = next(); i += 1; break;
      case "--port": opts.port = Number(next()); i += 1; break;
      case "--redis-host": opts.redisHost = next(); i += 1; break;
      case "--redis-port": opts.redisPort = Number(next()); i += 1; break;
      case "--key-prefix": opts.keyPrefix = next(); i += 1; break;
      case "--batch-ttl-seconds":
        opts.batchTtlSeconds = Number(next()); i += 1; break;
      case "--streaming-ttl-seconds":
        opts.streamingTtlSeconds = Number(next()); i += 1; break;
      case "--users-per-tick":
        opts.usersPerTick = Number(next()); i += 1; break;
      case "--seed-users": opts.seedUsers = Number(next()); i += 1; break;
      case "--no-reset": opts.resetOnStart = false; break;
      case "-h":
      case "--help":
        console.log(
          "Usage: node demoServer.js [--host H] [--port P] " +
            "[--redis-host H] [--redis-port P] [--key-prefix PFX] " +
            "[--batch-ttl-seconds S] [--streaming-ttl-seconds S] " +
            "[--users-per-tick N] [--seed-users N] [--no-reset]",
        );
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(2);
    }
  }
  return opts;
}


async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const client = createClient({
    socket: { host: opts.redisHost, port: opts.redisPort },
  });
  client.on("error", (err) => console.error("Redis client error:", err));
  await client.connect();

  const store = new FeatureStore({
    redisClient: client,
    keyPrefix: opts.keyPrefix,
    batchTtlSeconds: opts.batchTtlSeconds,
    streamingTtlSeconds: opts.streamingTtlSeconds,
  });
  const worker = new StreamingWorker({
    store,
    usersPerTick: opts.usersPerTick,
  });
  const demo = new FeatureStoreDemo({ store, worker, seed: 42 });

  if (opts.resetOnStart) {
    console.log(
      `Dropping any existing users under '${opts.keyPrefix}*' for a` +
        " clean demo run (pass --no-reset to keep them).",
    );
    await store.reset();
    store.resetStats();
  }
  const { loaded: seeded } = await demo.materialize(
    opts.seedUsers,
    opts.batchTtlSeconds,
  );

  worker.start();

  const server = http.createServer((req, res) => {
    handleRequest(req, res, { store, worker, demo }).catch((err) => {
      console.error("[demo] handler crashed:", err);
      try { res.writeHead(500).end(); } catch (_) { /* socket already closed */ }
    });
  });

  await new Promise((resolve) => server.listen(opts.port, opts.host, resolve));
  console.log(
    `Redis feature-store demo server listening on http://${opts.host}:${opts.port}`,
  );
  console.log(
    `Using Redis at ${opts.redisHost}:${opts.redisPort}` +
      ` with key prefix '${opts.keyPrefix}'` +
      ` (batch TTL ${opts.batchTtlSeconds}s,` +
      ` streaming TTL ${opts.streamingTtlSeconds}s)`,
  );
  console.log(`Materialized ${seeded} user(s); streaming worker running.`);

  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    await worker.stop();
    server.close();
    await client.quit();
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}


if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
