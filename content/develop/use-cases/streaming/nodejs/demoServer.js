#!/usr/bin/env node
"use strict";

/**
 * Redis streaming demo server.
 *
 * Run this file and visit http://localhost:8083 to watch a Redis Stream
 * in action: producers append events to a single stream, two independent
 * consumer groups read the same stream at their own pace, and within
 * the `notifications` group two consumers share the work.
 *
 * Use the UI to:
 *
 *   - Produce events into the stream.
 *   - Watch each consumer group's last-delivered ID, PEL count, and
 *     the consumers inside it.
 *   - Drop the next N messages from a chosen consumer to simulate a
 *     crash mid-processing, then run XAUTOCLAIM to reassign the stuck
 *     entries to a healthy consumer.
 *   - Replay any ID range with XRANGE to confirm the history is
 *     independent of consumer-group state.
 *   - Trim the stream with XTRIM to bound retention.
 */

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { createClient } = require("redis");

const { EventStream } = require("./eventStream");
const { ConsumerWorker } = require("./consumerWorker");

const EVENT_TYPES = [
  "order.placed",
  "order.paid",
  "order.shipped",
  "order.cancelled",
];

const DEFAULT_GROUPS = {
  notifications: ["worker-a", "worker-b"],
  analytics: ["worker-c"],
};

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Streaming Demo</title>
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
    .badge.ack { background: var(--ok); color: #1d4a2c; }
    .badge.drop { background: var(--warn); color: #6b3220; }
    .badge.idle { background: #e6e0f0; color: #43326a; }
    .group { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
    .group:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .consumers { margin-top: 6px; }
    .consumer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .consumer-row .name { font-weight: bold; min-width: 90px; }
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
    <h1>Redis Streaming Demo</h1>
    <p class="lede">
      Producers append events to a single Redis Stream
      (<code>__STREAM_KEY__</code>). Two consumer groups read the same
      stream independently: <code>notifications</code> shares its work
      across two consumers, <code>analytics</code> processes the full
      flow on its own. Acknowledge with <code>XACK</code>, recover
      crashed deliveries with <code>XAUTOCLAIM</code>, replay any range
      with <code>XRANGE</code>, and bound retention with <code>XTRIM</code>.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Stream state</h2>
        <div id="stream-view">Loading...</div>
        <button id="refresh-button" class="secondary">Refresh</button>
        <button id="reset-button" class="danger">Reset demo (drop stream and re-seed)</button>
      </section>

      <section class="panel">
        <h2>Produce events</h2>
        <p>Events are appended with <code>XADD</code> with an approximate
        <code>MAXLEN ~ __MAXLEN__</code> retention cap.</p>
        <label for="produce-count">How many</label>
        <input id="produce-count" type="number" min="1" max="500" value="10">
        <label for="produce-type">Event type</label>
        <select id="produce-type">
          <option value="">(random)</option>
          <option value="order.placed">order.placed</option>
          <option value="order.paid">order.paid</option>
          <option value="order.shipped">order.shipped</option>
          <option value="order.cancelled">order.cancelled</option>
        </select>
        <button id="produce-button">Produce</button>
      </section>

      <section class="panel">
        <h2>Replay range (XRANGE)</h2>
        <p>Reads a slice of history. Replay is independent of any
        consumer group &mdash; no cursors move, no acks happen.</p>
        <label for="replay-start">Start ID</label>
        <input id="replay-start" value="-">
        <label for="replay-end">End ID</label>
        <input id="replay-end" value="+">
        <label for="replay-count">Limit</label>
        <input id="replay-count" type="number" min="1" max="500" value="20">
        <button id="replay-button">Replay</button>
      </section>

      <section class="panel">
        <h2>Trim retention (XTRIM)</h2>
        <p>Cap the stream length. Approximate trimming releases whole
        macro-nodes, which is much cheaper than exact trimming.</p>
        <label for="trim-maxlen">MAXLEN ~</label>
        <input id="trim-maxlen" type="number" min="0" value="100">
        <button id="trim-button" class="secondary">XTRIM</button>
      </section>

      <section class="panel wide">
        <h2>Consumer groups</h2>
        <div id="groups-view">Loading...</div>
      </section>

      <section class="panel wide">
        <h2>Pending entries (XPENDING)</h2>
        <p>Entries delivered to a consumer that haven't been acked yet.
        Idle time &ge; <code>__CLAIM_IDLE__</code> ms is eligible for
        <code>XAUTOCLAIM</code>.</p>
        <div id="pending-view">Loading...</div>
        <div class="row">
          <select id="autoclaim-target"></select>
          <button id="autoclaim-button" class="secondary">XAUTOCLAIM to selected</button>
        </div>
      </section>

      <section class="panel wide">
        <h2>Last result</h2>
        <div id="result-view"><p>Produce events, replay a range, or trigger an autoclaim to see results.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const streamView = document.getElementById("stream-view");
    const groupsView = document.getElementById("groups-view");
    const pendingView = document.getElementById("pending-view");
    const resultView = document.getElementById("result-view");
    const autoclaimTarget = document.getElementById("autoclaim-target");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderStream(state) {
      const stream = state.stream || {};
      const tail = state.tail || [];
      const tailRows = tail.map((entry) => \`
        <tr>
          <td class="mono">\${escapeHtml(entry.id)}</td>
          <td>\${escapeHtml(entry.fields.type)}</td>
          <td class="mono">\${escapeHtml(entry.fields.order_id || "")}</td>
          <td>\${escapeHtml(entry.fields.amount || "")}</td>
          <td class="mono">\${escapeHtml(entry.fields.customer || "")}</td>
        </tr>\`).join("");
      streamView.innerHTML = \`
        <dl>
          <dt>Length</dt><dd>\${stream.length ?? 0}</dd>
          <dt>First ID</dt><dd class="mono">\${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
          <dt>Last ID</dt><dd class="mono">\${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
          <dt>Produced</dt><dd>\${state.stats.produced_total ?? 0}</dd>
          <dt>Acked</dt><dd>\${state.stats.acked_total ?? 0}</dd>
          <dt>Claimed</dt><dd>\${state.stats.claimed_total ?? 0}</dd>
        </dl>
        <h3>Tail (most recent)</h3>
        \${tail.length === 0 ? "<p>(empty)</p>" :
          \`<table>
             <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
             <tbody>\${tailRows}</tbody>
           </table>\`}
      \`;
    }

    function renderGroups(state) {
      const groups = state.groups || [];
      if (groups.length === 0) {
        groupsView.innerHTML = "<p>No groups.</p>";
        return;
      }
      // Preserve any text the user has typed into an add-consumer input
      // (and which one was focused) so the 1.5s auto-refresh doesn't wipe it.
      const addWorkerValues = {};
      let focusedGroup = null;
      let focusedSelectionStart = null;
      groupsView.querySelectorAll("input[id^='addworker-']").forEach((input) => {
        const group = input.id.slice("addworker-".length);
        addWorkerValues[group] = input.value;
        if (document.activeElement === input) {
          focusedGroup = group;
          focusedSelectionStart = input.selectionStart;
        }
      });
      groupsView.innerHTML = groups.map((g) => {
        const consumers = (g.consumers_detail || []).map((c) => {
          const recent = (c.recent || []).slice(0, 3).map((m) => \`
            <span class="mono" title="\${escapeHtml(JSON.stringify(m.fields))}">
              <span class="badge \${m.acked ? "ack" : "drop"}">\${m.acked ? "ack" : "drop"}</span>
              \${escapeHtml(m.id)} \${escapeHtml(m.type)}
            </span>\`).join(" &nbsp; ");
          const badges = [];
          if (c.paused) badges.push('<span class="badge idle">paused</span>');
          if (c.crash_queued > 0) badges.push(\`<span class="badge drop">will drop \${c.crash_queued}</span>\`);
          return \`
            <div class="consumer-row">
              <span class="name">\${escapeHtml(c.name)}</span>
              <span class="mono">pending=\${c.pending} idle=\${c.idle_ms}ms processed=\${c.processed} reaped=\${c.reaped ?? 0}</span>
              \${badges.join(" ")}
              <button class="small secondary" data-action="crash" data-group="\${escapeHtml(g.name)}" data-name="\${escapeHtml(c.name)}">Crash next 3</button>
              <button class="small danger" data-action="remove" data-group="\${escapeHtml(g.name)}" data-name="\${escapeHtml(c.name)}">Remove</button>
            </div>
            \${recent ? \`<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">\${recent}</div>\` : ""}\`;
        }).join("");
        return \`
          <div class="group">
            <h3>\${escapeHtml(g.name)}
              <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                pending=\${g.pending} lag=\${g.lag ?? "?"} last_delivered=\${escapeHtml(g.last_delivered_id)}
              </span>
            </h3>
            <div class="consumers">\${consumers || "<em>(no consumers)</em>"}</div>
            <div class="row" style="max-width: 360px; margin-top: 6px;">
              <input id="addworker-\${escapeHtml(g.name)}" placeholder="new-worker-name">
              <button class="small" data-action="add" data-group="\${escapeHtml(g.name)}">Add consumer</button>
            </div>
          </div>\`;
      }).join("");

      // Restore the typed text (and focus) into the add-consumer inputs.
      for (const [group, value] of Object.entries(addWorkerValues)) {
        const input = document.getElementById(\`addworker-\${group}\`);
        if (input) input.value = value;
      }
      if (focusedGroup) {
        const input = document.getElementById(\`addworker-\${focusedGroup}\`);
        if (input) {
          input.focus();
          if (focusedSelectionStart !== null) {
            try { input.setSelectionRange(focusedSelectionStart, focusedSelectionStart); } catch (_) {}
          }
        }
      }

      // Populate the autoclaim-target dropdown with every (group, consumer)
      const previous = autoclaimTarget.value;
      const options = [];
      for (const g of groups) {
        for (const c of g.consumers_detail || []) {
          options.push(\`<option value="\${escapeHtml(g.name)}|\${escapeHtml(c.name)}">\${escapeHtml(g.name)} &rarr; \${escapeHtml(c.name)}</option>\`);
        }
      }
      autoclaimTarget.innerHTML = options.join("");
      if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
        autoclaimTarget.value = previous;
      }
    }

    function renderPending(state) {
      const rows = (state.pending || []).map((p) => \`
        <tr>
          <td class="mono">\${escapeHtml(p.group)}</td>
          <td class="mono">\${escapeHtml(p.consumer)}</td>
          <td class="mono">\${escapeHtml(p.id)}</td>
          <td>\${p.idle_ms} ms</td>
          <td>\${p.deliveries}</td>
        </tr>\`).join("");
      pendingView.innerHTML = (state.pending || []).length === 0
        ? "<p>(no entries currently pending)</p>"
        : \`<table>
             <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
             <tbody>\${rows}</tbody>
           </table>\`;
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStream(state);
      renderGroups(state);
      renderPending(state);
    }

    document.getElementById("refresh-button").addEventListener("click", refresh);

    document.getElementById("produce-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("produce-count").value, 10) || 1;
      const type = document.getElementById("produce-type").value;
      const body = new URLSearchParams({ count, type });
      const r = await fetch("/produce", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Produce failed.", "error"); return; }
      setStatus(\`Produced \${d.produced} event(s).\`, "ok");
      resultView.innerHTML = \`<p>Produced <strong>\${d.produced}</strong> events. New IDs:</p>
        <pre class="mono">\${d.ids.map(escapeHtml).join("\\n")}</pre>\`;
      await refresh();
    });

    document.getElementById("replay-button").addEventListener("click", async () => {
      const params = new URLSearchParams({
        start: document.getElementById("replay-start").value,
        end: document.getElementById("replay-end").value,
        count: document.getElementById("replay-count").value,
      });
      const r = await fetch(\`/replay?\${params.toString()}\`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
      setStatus(\`Replayed \${d.entries.length} entry/entries (XRANGE).\`, "ok");
      const rows = d.entries.map((e) => \`
        <tr>
          <td class="mono">\${escapeHtml(e.id)}</td>
          <td>\${escapeHtml(e.fields.type)}</td>
          <td class="mono">\${escapeHtml(e.fields.order_id || "")}</td>
          <td>\${escapeHtml(e.fields.amount || "")}</td>
        </tr>\`).join("");
      resultView.innerHTML = \`
        <p>XRANGE \${escapeHtml(d.start)} &rarr; \${escapeHtml(d.end)} (limit \${d.limit})</p>
        \${d.entries.length === 0 ? "<p>(no entries)</p>" :
          \`<table>
            <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
            <tbody>\${rows}</tbody>
           </table>\`}\`;
    });

    document.getElementById("trim-button").addEventListener("click", async () => {
      const maxlen = document.getElementById("trim-maxlen").value;
      const body = new URLSearchParams({ maxlen });
      const r = await fetch("/trim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
      setStatus(\`XTRIM removed \${d.deleted} entr\${d.deleted === 1 ? "y" : "ies"}.\`, "ok");
      await refresh();
    });

    document.getElementById("autoclaim-button").addEventListener("click", async () => {
      const target = autoclaimTarget.value;
      if (!target) { setStatus("No consumer selected.", "error"); return; }
      const [group, consumer] = target.split("|");
      const body = new URLSearchParams({ group, consumer });
      const r = await fetch("/autoclaim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Autoclaim failed.", "error"); return; }
      const deletedCount = (d.deleted || []).length;
      const msg = deletedCount
        ? \`\${group}/\${consumer} reaped \${d.claimed} entry/entries and processed \${d.processed}; \${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.\`
        : \`\${group}/\${consumer} reaped \${d.claimed} entry/entries and processed \${d.processed}.\`;
      setStatus(msg, "ok");
      const deletedBlock = deletedCount
        ? \`<h3>Deleted IDs (payload already trimmed &mdash; removed from PEL by Redis)</h3>
           <p class="mono">\${(d.deleted || []).map(escapeHtml).join(", ")}</p>
           <p>In production these would also be routed to a dead-letter store for offline inspection.</p>\`
        : "";
      resultView.innerHTML = \`
        <p><strong>\${escapeHtml(group)}/\${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
           into itself with <code>min_idle_time = \${d.min_idle_ms} ms</code>,
           claimed <strong>\${d.claimed}</strong> stuck entry/entries, processed
           <strong>\${d.processed}</strong>, and acked them.</p>
        \${d.claimed === 0 ? "<p>(nothing was idle enough yet &mdash; try again after a few seconds)</p>" : ""}
        \${deletedBlock}\`;
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop the stream and re-seed the default groups?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      setStatus(\`Reset. \${d.consumers} consumer(s) re-seeded.\`, "ok");
      await refresh();
    });

    document.body.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button[data-action]");
      if (!t) return;
      const action = t.dataset.action;
      const group = t.dataset.group;
      if (action === "crash") {
        const name = t.dataset.name;
        const body = new URLSearchParams({ group, name, count: "3" });
        await fetch("/crash", { method: "POST", body });
        setStatus(\`Queued next 3 deliveries to \${group}/\${name} for drop.\`, "ok");
        await refresh();
      } else if (action === "remove") {
        const name = t.dataset.name;
        if (!confirm(\`Remove \${group}/\${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.\`)) return;
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/remove-worker", { method: "POST", body });
        const d = await r.json();
        if (!d.removed) {
          setStatus(d.message || \`Could not remove \${group}/\${name} (\${d.reason || "unknown"}).\`, "error");
        } else if (d.handed_over_count > 0) {
          setStatus(\`Removed \${group}/\${name}. Handed \${d.handed_over_count} pending entr\${d.handed_over_count === 1 ? "y" : "ies"} over to \${d.handed_over_to}.\`, "ok");
        } else {
          setStatus(\`Removed \${group}/\${name} (no pending entries to hand over).\`, "ok");
        }
        await refresh();
      } else if (action === "add") {
        const input = document.getElementById(\`addworker-\${group}\`);
        const name = (input.value || "").trim();
        if (!name) { setStatus("Enter a consumer name.", "error"); return; }
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/add-worker", { method: "POST", body });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
        input.value = "";
        setStatus(\`Added \${group}/\${name}.\`, "ok");
        await refresh();
      }
    });

    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
`;

/**
 * In-memory registry of consumer workers across all groups.
 *
 * The Node.js event loop dispatches HTTP handlers one at a time, but
 * each handler may `await` Redis calls, so add/remove operations can
 * interleave around `await` points. The registry's mutations are
 * intentionally short and bracketed by a single Redis round trip, so
 * we don't add an explicit lock — but we always snapshot the
 * registry into a local array before iterating asynchronously.
 */
class StreamingDemo {
  /**
   * @param {object} options
   * @param {EventStream} options.stream
   * @param {() => Promise<import("redis").RedisClientType>} options.makeClient
   *        Factory that returns a fresh, connected Redis client. Each
   *        consumer worker uses its own client because `XREADGROUP BLOCK`
   *        parks the connection.
   * @param {number} options.maxlenApprox
   * @param {number} options.claimMinIdleMs
   * @param {string} options.streamKey
   */
  constructor({
    stream,
    makeClient,
    maxlenApprox,
    claimMinIdleMs,
    streamKey,
  }) {
    this.stream = stream;
    this.makeClient = makeClient;
    this.maxlenApprox = maxlenApprox;
    this.claimMinIdleMs = claimMinIdleMs;
    this.streamKey = streamKey;
    /** @type {Map<string, {worker: ConsumerWorker, client: import("redis").RedisClientType}>} */
    this.workers = new Map();
    /** @type {Set<string>} names currently being constructed by addWorker. */
    this._inFlight = new Set();
  }

  _key(group, name) {
    return `${group}|${name}`;
  }

  async seed(groups) {
    for (const [group, names] of Object.entries(groups)) {
      await this.stream.ensureGroup(group, "0-0");
      for (const name of names) {
        await this.addWorker(group, name);
      }
    }
    return Object.values(groups).reduce((sum, list) => sum + list.length, 0);
  }

  /**
   * @returns {Promise<boolean>}
   */
  async addWorker(group, name) {
    const key = this._key(group, name);
    // Reserve the name atomically before the first `await`. Without
    // this, two concurrent `addWorker(group, name)` calls would both
    // pass the duplicate check before either inserted into
    // `this.workers`, both proceed through ensureGroup + makeClient +
    // worker.start, and both call `this.workers.set(...)` — leaving
    // two live ConsumerWorkers for the same name with one of them
    // leaking (its client never gets closed because the Map only
    // holds the second entry). `_inFlight` is checked alongside
    // `this.workers` so the duplicate check is atomic against
    // concurrent callers on the single-threaded event loop.
    if (this.workers.has(key) || this._inFlight.has(key)) return false;
    this._inFlight.add(key);
    let client;
    try {
      await this.stream.ensureGroup(group, "0-0");

      // Each worker owns its own Redis client because XREADGROUP BLOCK
      // parks the connection. Sharing the main client across workers
      // would serialise their reads through one socket. The blocking
      // client only carries the `xReadGroup` call; XACK, XAUTOCLAIM,
      // and stats updates go through the shared `this.stream` so the
      // counters aggregate.
      client = await this.makeClient();
      const blockingStream = new EventStream({
        redisClient: client,
        streamKey: this.streamKey,
        maxlenApprox: this.maxlenApprox,
        claimMinIdleMs: this.claimMinIdleMs,
      });
      const worker = new ConsumerWorker({
        stream: this.stream,
        blockingStream,
        group,
        name,
      });
      worker.start();
      this.workers.set(key, { worker, client });
      return true;
    } catch (err) {
      // Best-effort cleanup of any partially-opened client.
      if (client) {
        try { await client.quit(); } catch { /* ignore */ }
      }
      throw err;
    } finally {
      this._inFlight.delete(key);
    }
  }

  /**
   * Remove a consumer safely.
   *
   * `XGROUP DELCONSUMER` destroys the consumer's PEL entries outright,
   * so any pending message it still owned would become unreachable.
   * Before deleting, hand its PEL off to another consumer in the
   * same group with `XCLAIM`. Without a peer consumer to take over,
   * refuse to delete and leave the worker in place so the user can
   * add a peer first.
   *
   * @returns {Promise<{removed: boolean, reason?: string, message?: string, handed_over_to?: string, handed_over_count?: number}>}
   */
  async removeWorker(group, name) {
    const key = this._key(group, name);
    const entry = this.workers.get(key);
    if (!entry) {
      return { removed: false, reason: "not-found" };
    }

    const peers = [];
    for (const [k, v] of this.workers) {
      if (k === key) continue;
      if (v.worker.group === group) peers.push(v.worker.name);
    }
    if (peers.length === 0) {
      return {
        removed: false,
        reason: "no-peer",
        message:
          `${group}/${name} still owns pending entries and is the only ` +
          "consumer in its group; add another consumer first so its " +
          "PEL can be handed over before deletion.",
      };
    }

    const handoverTarget = peers[0];

    // Run the handover BEFORE removing the worker from the registry.
    // XGROUP DELCONSUMER destroys the source's pending list, so any
    // handover failure must abort the removal — leaving the worker in
    // place lets the user retry once the underlying Redis issue is
    // resolved. The worker keeps consuming during the handover;
    // XCLAIM with MIN-IDLE-TIME 0 races acks gracefully (anything the
    // worker acks during the window is gone from XPENDING and isn't
    // moved).
    let claimed;
    try {
      claimed = await this.stream.handoverPending(group, name, handoverTarget);
    } catch (err) {
      return {
        removed: false,
        reason: "handover-failed",
        message:
          `Handover from ${group}/${name} to ${handoverTarget} failed ` +
          `before XGROUP DELCONSUMER could run: ${err.message}. ` +
          `${group}/${name} is still in the group; retry the remove or ` +
          "investigate the Redis error before deleting (DELCONSUMER would " +
          "destroy the source consumer's pending entries).",
      };
    }

    // Handover succeeded; now safe to remove from the registry, stop
    // the worker, close its blocking client, and destroy the consumer
    // record in Redis.
    this.workers.delete(key);
    await entry.worker.stop();
    try {
      await entry.client.quit();
    } catch {
      // ignore close errors
    }
    await this.stream.deleteConsumer(group, name);
    return {
      removed: true,
      handed_over_to: handoverTarget,
      handed_over_count: claimed,
    };
  }

  /**
   * @param {string} group
   * @param {string} name
   */
  getWorker(group, name) {
    const entry = this.workers.get(this._key(group, name));
    return entry ? entry.worker : null;
  }

  /**
   * Stable list of `{group, name, worker}` for iteration outside of
   * mutation paths.
   */
  workersSnapshot() {
    const list = [];
    for (const [, v] of this.workers) {
      list.push({ group: v.worker.group, name: v.worker.name, worker: v.worker });
    }
    return list;
  }

  async stopAll() {
    const entries = Array.from(this.workers.values());
    this.workers.clear();
    await Promise.all(
      entries.map(async (entry) => {
        await entry.worker.stop();
        try {
          await entry.client.quit();
        } catch {
          // ignore
        }
      }),
    );
  }

  async reset() {
    await this.stopAll();
    await this.stream.deleteStream();
    this.stream.resetStats();
    return this.seed(DEFAULT_GROUPS);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    host: "127.0.0.1",
    port: 8083,
    redisHost: "localhost",
    redisPort: 6379,
    streamKey: "demo:events:orders",
    maxlen: 2000,
    claimIdleMs: 5000,
    resetOnStart: true,
  };

  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--host":
        config.host = args[++i];
        break;
      case "--port":
        config.port = Number.parseInt(args[++i], 10);
        break;
      case "--redis-host":
        config.redisHost = args[++i];
        break;
      case "--redis-port":
        config.redisPort = Number.parseInt(args[++i], 10);
        break;
      case "--stream-key":
        config.streamKey = args[++i];
        break;
      case "--maxlen":
        config.maxlen = Number.parseInt(args[++i], 10);
        break;
      case "--claim-idle-ms":
        config.claimIdleMs = Number.parseInt(args[++i], 10);
        break;
      case "--no-reset":
        config.resetOnStart = false;
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

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

function fakePayload() {
  const customers = ["alice", "bob", "carol", "dan", "erin"];
  const orderId = `o-${Math.floor(1000 + Math.random() * 9000)}`;
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const amount = (5 + Math.random() * 245).toFixed(2);
  return { order_id: orderId, customer, amount };
}

function htmlPage(stream) {
  return HTML_TEMPLATE.replace("__STREAM_KEY__", stream.streamKey)
    .replace("__MAXLEN__", String(stream.maxlenApprox))
    .replace("__CLAIM_IDLE__", String(stream.claimMinIdleMs));
}

// --------------------------------------------------------------------
// Request handlers
// --------------------------------------------------------------------

async function handleProduce(form, stream) {
  let count = Number.parseInt(form.get("count") || "1", 10);
  if (!Number.isFinite(count) || count < 1) count = 1;
  if (count > 500) count = 500;
  const eventType = (form.get("type") || "").trim();
  const events = [];
  for (let i = 0; i < count; i += 1) {
    const picked =
      eventType || EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    events.push([picked, fakePayload()]);
  }
  const ids = await stream.produceBatch(events);
  return { status: 200, body: { produced: ids.length, ids } };
}

async function handleAddWorker(form, demo) {
  const group = (form.get("group") || "").trim();
  const name = (form.get("name") || "").trim();
  if (!group || !name) {
    return { status: 400, body: { error: "group and name are required" } };
  }
  const added = await demo.addWorker(group, name);
  if (!added) {
    return { status: 409, body: { error: `${group}/${name} already exists` } };
  }
  return { status: 200, body: { group, name } };
}

async function handleRemoveWorker(form, demo) {
  const group = (form.get("group") || "").trim();
  const name = (form.get("name") || "").trim();
  const result = await demo.removeWorker(group, name);
  const status =
    result.removed || result.reason === "not-found" ? 200 : 409;
  return { status, body: result };
}

async function handleCrash(form, demo) {
  const group = (form.get("group") || "").trim();
  const name = (form.get("name") || "").trim();
  const count = Number.parseInt(form.get("count") || "1", 10) || 1;
  const worker = demo.getWorker(group, name);
  if (!worker) {
    return {
      status: 404,
      body: { error: `unknown consumer ${group}/${name}` },
    };
  }
  worker.crashNext(count);
  return { status: 200, body: { queued: count } };
}

async function handleAutoclaim(form, demo, stream) {
  const group = (form.get("group") || "").trim();
  const consumer = (form.get("consumer") || "").trim();
  if (!group || !consumer) {
    return {
      status: 400,
      body: { error: "group and consumer are required" },
    };
  }
  const worker = demo.getWorker(group, consumer);
  if (!worker) {
    return {
      status: 404,
      body: { error: `unknown consumer ${group}/${consumer}` },
    };
  }
  // `reapIdlePel` runs XAUTOCLAIM(self) + process + ack. `deletedIds`
  // are PEL entries whose stream payload was already trimmed by
  // `MAXLEN ~` before the sweep ran. Redis 7+ removes them from the
  // PEL inside XAUTOCLAIM itself, so the caller doesn't have to XACK
  // them; in production they would be routed to a dead-letter store
  // for offline inspection.
  const result = await worker.reapIdlePel();
  return {
    status: 200,
    body: {
      claimed: result.claimed,
      processed: result.processed,
      deleted: result.deletedIds,
      min_idle_ms: stream.claimMinIdleMs,
    },
  };
}

async function handleTrim(form, stream) {
  const maxlen = Number.parseInt(form.get("maxlen") || "0", 10) || 0;
  const deleted = await stream.trimMaxlen(maxlen);
  return { status: 200, body: { deleted, maxlen } };
}

async function handleReplay(url, stream) {
  const start = url.searchParams.get("start") || "-";
  const end = url.searchParams.get("end") || "+";
  let limit = Number.parseInt(url.searchParams.get("count") || "20", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 500) limit = 500;
  const entries = await stream.replay(start, end, limit);
  return {
    status: 200,
    body: {
      start,
      end,
      limit,
      entries: entries.map(([id, fields]) => ({ id, fields })),
    },
  };
}

async function buildState(stream, demo) {
  const [streamInfo, groups, tailEntries] = await Promise.all([
    stream.infoStream(),
    stream.infoGroups(),
    // XREVRANGE returns the *newest* N entries (in reverse order) — the
    // tail view wants the most recent activity, not the head of history.
    stream.redis.xRevRange(stream.streamKey, "+", "-", { COUNT: 10 }),
  ]);

  const groupsDetail = [];
  const pendingRows = [];
  const workersSnapshot = demo.workersSnapshot();

  for (const group of groups) {
    const name = group.name;
    const consumerInfoRaw = await stream.infoConsumers(name);
    const consumerInfo = new Map(consumerInfoRaw.map((c) => [c.name, c]));
    const consumersDetail = [];
    for (const entry of workersSnapshot) {
      if (entry.group !== name) continue;
      const info = consumerInfo.get(entry.name) || {};
      const status = entry.worker.status();
      consumersDetail.push({
        ...status,
        pending: info.pending || 0,
        idle_ms: info.idle_ms || 0,
        recent: entry.worker.recent(),
      });
    }
    // Also include consumers that exist in Redis but not in our
    // in-process registry (e.g. orphaned after a restart).
    for (const [cName, info] of consumerInfo) {
      if (!consumersDetail.some((c) => c.name === cName)) {
        consumersDetail.push({
          name: cName,
          group: name,
          processed: 0,
          reaped: 0,
          crashed_drops: 0,
          paused: false,
          crash_queued: 0,
          alive: false,
          pending: info.pending || 0,
          idle_ms: info.idle_ms || 0,
          recent: [],
        });
      }
    }
    consumersDetail.sort((a, b) => a.name.localeCompare(b.name));
    groupsDetail.push({ ...group, consumers_detail: consumersDetail });

    const pending = await stream.pendingDetail(name, 50);
    for (const row of pending) {
      pendingRows.push({
        group: name,
        consumer: row.consumer,
        id: row.id,
        idle_ms: row.idleMs,
        deliveries: row.deliveries,
      });
    }
  }

  const tail = [];
  for (const entry of tailEntries || []) {
    if (entry && entry.id) tail.push({ id: entry.id, fields: entry.message || {} });
  }

  return {
    stream: streamInfo,
    tail,
    groups: groupsDetail,
    pending: pendingRows,
    stats: stream.stats(),
  };
}

async function main() {
  const config = parseArgs();

  const makeClient = async () => {
    const client = createClient({
      socket: { host: config.redisHost, port: config.redisPort },
    });
    client.on("error", (err) => console.error("Redis error:", err.message || err));
    await client.connect();
    return client;
  };

  const mainClient = await makeClient();
  const stream = new EventStream({
    redisClient: mainClient,
    streamKey: config.streamKey,
    maxlenApprox: config.maxlen,
    claimMinIdleMs: config.claimIdleMs,
  });
  const demo = new StreamingDemo({
    stream,
    makeClient,
    maxlenApprox: config.maxlen,
    claimMinIdleMs: config.claimIdleMs,
    streamKey: config.streamKey,
  });

  if (config.resetOnStart) {
    console.log(
      `Deleting any existing data at key '${config.streamKey}'` +
        " for a clean demo run (pass --no-reset to keep it).",
    );
    await stream.deleteStream();
  }
  const seeded = await demo.seed(DEFAULT_GROUPS);

  console.log(
    `Redis streaming demo server listening on http://${config.host}:${config.port}`,
  );
  console.log(
    `Using Redis at ${config.redisHost}:${config.redisPort}` +
      ` with stream key '${config.streamKey}' (MAXLEN ~ ${config.maxlen})`,
  );
  console.log(
    `Seeded ${seeded} consumer(s) across ${Object.keys(DEFAULT_GROUPS).length} group(s)`,
  );

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    try {
      if (
        req.method === "GET" &&
        (url.pathname === "/" || url.pathname === "/index.html")
      ) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(htmlPage(stream));
        return;
      }
      if (req.method === "GET" && url.pathname === "/state") {
        const state = await buildState(stream, demo);
        sendJson(res, 200, state);
        return;
      }
      if (req.method === "GET" && url.pathname === "/replay") {
        const r = await handleReplay(url, stream);
        sendJson(res, r.status, r.body);
        return;
      }

      if (req.method === "POST" && url.pathname === "/produce") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleProduce(form, stream);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/add-worker") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleAddWorker(form, demo);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/remove-worker") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleRemoveWorker(form, demo);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/crash") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleCrash(form, demo);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/autoclaim") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleAutoclaim(form, demo, stream);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/trim") {
        const form = new URLSearchParams(await readBody(req));
        const r = await handleTrim(form, stream);
        sendJson(res, r.status, r.body);
        return;
      }
      if (req.method === "POST" && url.pathname === "/reset") {
        const count = await demo.reset();
        sendJson(res, 200, { consumers: count });
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    } catch (err) {
      console.error("Request error:", err);
      sendJson(res, 500, { error: (err && err.message) || "Internal error" });
    }
  });

  const shutdown = async () => {
    console.log("\nShutting down...");
    await demo.stopAll();
    server.close();
    try {
      await mainClient.quit();
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  server.listen(config.port, config.host);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
