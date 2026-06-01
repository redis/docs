#!/usr/bin/env python3
"""
Redis feature-store demo server.

Run this file and visit http://localhost:8085 to watch an online feature
store at work: a batch materialization loads N users with a 24-hour
key-level TTL, a streaming worker overwrites a handful of users' real-time
features every second with a per-field ``HEXPIRE``, and the inference
panel reads any subset of features for any user with ``HMGET`` in a
single round trip.

Use the UI to:

* Bulk-load (re-materialize) the batch features, optionally with a short
  TTL so you can watch a whole entity expire on schedule.
* Pause the streaming worker and watch the streaming fields drop out
  via ``HEXPIRE`` while the batch fields remain populated under the
  longer key-level TTL — the *mixed staleness* story made visible.
* Pull features for one user (``HMGET``) and see the value, per-field
  TTL, and read latency.
* Batch-score N users in one pipelined round trip and see the
  per-entity / per-round-trip latency split.
* Inspect a single user's hash in detail with field-level TTLs.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from build_features import synthesize_users
    from feature_store import (
        DEFAULT_BATCH_FIELDS,
        DEFAULT_STREAMING_FIELDS,
        RedisFeatureStore,
    )
    from streaming_worker import StreamingWorker
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Feature Store Demo</title>
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
    <div class="pill">redis-py + Python standard library HTTP server</div>
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
        <p>Calls <code>HSET</code> + <code>EXPIRE</code> for each user.
          Pipelined so a 500-user load is one round trip per batch.</p>
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
        <p>Pipelined <code>HMGET</code> across N random users. One
          network round trip for the whole batch.</p>
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
      return `<span class="ttl-pos mono">${seconds}s</span>`;
    }

    function renderStore(state) {
      const stats = state.stats || {};
      storeView.innerHTML = `
        <dl>
          <dt>Users in store</dt><dd>${state.entity_count}</dd>
          <dt>Key prefix</dt><dd class="mono">${escapeHtml(state.key_prefix)}*</dd>
          <dt>Batch TTL</dt><dd>${state.batch_ttl_seconds}s</dd>
          <dt>Streaming TTL</dt><dd>${state.streaming_ttl_seconds}s</dd>
          <dt>Batch writes</dt><dd>${stats.batch_writes_total ?? 0}</dd>
          <dt>Streaming writes</dt><dd>${stats.streaming_writes_total ?? 0}</dd>
          <dt>Reads</dt><dd>${stats.reads_total ?? 0}</dd>
          <dt>Fields returned</dt><dd>${stats.read_fields_total ?? 0}</dd>
        </dl>
      `;
    }

    function renderWorker(state) {
      const w = state.worker || {};
      const badge = w.paused
        ? '<span class="badge paused">paused</span>'
        : w.running
          ? '<span class="badge running">running</span>'
          : '<span class="badge expired">stopped</span>';
      workerView.innerHTML = `
        <p>${badge} <span class="mono">ticks=${w.tick_count ?? 0}
          writes=${w.writes_count ?? 0}</span></p>
      `;
    }

    function populateUserSelects(ids) {
      for (const sel of [readUserSelect, inspectUserSelect]) {
        const previous = sel.value;
        sel.innerHTML = ids.map((id) =>
          `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`
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
        return `<label>
          <input type="checkbox" name="field" value="${escapeHtml(f)}" ${checked}>
          <span class="badge ${kind}">${kind}</span>
          <span class="mono">${escapeHtml(f)}</span>
        </label>`;
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
        `Materialized ${d.loaded} user(s) with a ${d.ttl_seconds}s key-level TTL in ${d.elapsed_ms.toFixed(1)} ms.`,
        "ok",
      );
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop every user from the store?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Reset failed.", "error"); return; }
      setStatus(`Reset. Dropped ${d.deleted} user(s).`, "ok");
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
        return `<tr>
          <td><span class="badge ${kind}">${kind}</span> <span class="mono">${escapeHtml(name)}</span></td>
          <td class="mono">${value === undefined || value === null
            ? '<span class="badge expired">missing</span>'
            : escapeHtml(value)}</td>
          <td>${ttlLabel(ttl)}</td>
        </tr>`;
      }).join("");
      readResult.innerHTML = `
        <p><strong>HMGET</strong> ${escapeHtml(user)} (${d.requested.length} field(s))
          returned ${d.returned_count} value(s) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>.
          Key-level TTL: ${ttlLabel(d.key_ttl_seconds)}.</p>
        ${d.requested.length === 0 ? "" :
          `<table>
            <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`}
      `;
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
      const rows = (d.sample || []).map((row) => `
        <tr>
          <td class="mono">${escapeHtml(row.id)}</td>
          <td>${row.field_count}</td>
        </tr>`).join("");
      batchResult.innerHTML = `
        <p>Pipelined <code>HMGET</code> across <strong>${d.entity_count}</strong> users
          (${d.field_count} field(s) each) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>
          (~${perEntity.toFixed(3)} ms / user, one network round trip total).</p>
        ${(d.sample || []).length === 0 ? "" :
          `<h3>Sample</h3>
           <table>
             <thead><tr><th>user</th><th>fields returned</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`}
      `;
    });

    document.getElementById("inspect-button").addEventListener("click", async () => {
      const user = inspectUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const params = new URLSearchParams({ user });
      const r = await fetch(`/inspect?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Inspect failed.", "error"); return; }
      const rows = (d.fields || []).map((f) => `
        <tr>
          <td><span class="badge ${classifyField(f.name)}">${classifyField(f.name)}</span>
              <span class="mono">${escapeHtml(f.name)}</span></td>
          <td class="mono">${escapeHtml(f.value)}</td>
          <td>${ttlLabel(f.ttl_seconds)}</td>
        </tr>`).join("");
      inspectResult.innerHTML = d.exists === false
        ? `<p><span class="badge expired">missing</span> <code>${escapeHtml(user)}</code> isn't in the store. Either it was never materialized or its key-level TTL expired.</p>`
        : `<p>Key-level TTL: ${ttlLabel(d.key_ttl_seconds)} &nbsp; (${d.fields.length} field(s))</p>
           <table>
             <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`;
    });

    renderFieldPicker();
    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
"""


class FeatureStoreDemo:
    """Demo orchestrator: feature store + streaming worker + housekeeping."""

    def __init__(
        self,
        store: RedisFeatureStore,
        worker: StreamingWorker,
        default_user_count: int,
        seed: int,
    ) -> None:
        self.store = store
        self.worker = worker
        self.default_user_count = default_user_count
        self.seed = seed

    def materialize(self, count: int, ttl_seconds: int) -> dict:
        rows = synthesize_users(count, seed=self.seed)
        start = time.perf_counter()
        loaded = self.store.bulk_load(rows, ttl_seconds=ttl_seconds)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return {"loaded": loaded, "ttl_seconds": ttl_seconds, "elapsed_ms": elapsed_ms}

    def reset(self) -> dict:
        # Pause the streaming worker around the DEL sweep so a concurrent
        # tick can't recreate a user that was just enumerated for deletion
        # (streaming HSET creates the key if it's missing, and that would
        # leave behind a streaming-only hash with no key-level TTL).
        # pause() only stops *future* ticks; wait_for_idle() flushes any
        # tick that's already mid-write before the DEL sweep runs.
        was_paused = self.worker.is_paused
        if self.worker.is_running and not was_paused:
            self.worker.pause()
        try:
            if self.worker.is_running:
                self.worker.wait_for_idle()
            deleted = self.store.reset()
            self.store.reset_stats()
            self.worker.reset_stats()
        finally:
            if self.worker.is_running and not was_paused:
                self.worker.resume()
        return {"deleted": deleted}

    def toggle_worker(self) -> dict:
        if not self.worker.is_running:
            self.worker.start()
        if self.worker.is_paused:
            self.worker.resume()
        else:
            self.worker.pause()
        return {"paused": self.worker.is_paused, "running": self.worker.is_running}


class FeatureStoreDemoHandler(BaseHTTPRequestHandler):
    """HTTP handler. State is hung off class attributes."""

    store: RedisFeatureStore | None = None
    worker: StreamingWorker | None = None
    demo: FeatureStoreDemo | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return
        if parsed.path == "/state":
            self._send_json(self._build_state(), 200)
            return
        if parsed.path == "/inspect":
            self._handle_inspect(parse_qs(parsed.query))
            return
        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/bulk-load":
            self._handle_bulk_load()
            return
        if parsed.path == "/reset":
            self._send_json(self.demo.reset(), 200)
            return
        if parsed.path == "/worker/toggle":
            self._send_json(self.demo.toggle_worker(), 200)
            return
        if parsed.path == "/read":
            self._handle_read()
            return
        if parsed.path == "/batch-read":
            self._handle_batch_read()
            return
        self.send_error(404)

    # ---- POST handlers --------------------------------------------------

    def _handle_bulk_load(self) -> None:
        params = self._read_form_data()
        count = max(1, min(2000, int(params.get("count", ["200"])[0] or "200")))
        ttl = max(5, min(172_800, int(params.get("ttl", ["86400"])[0] or "86400")))
        self._send_json(self.demo.materialize(count, ttl), 200)

    def _handle_read(self) -> None:
        params = self._read_form_data()
        user = (params.get("user", [""])[0] or "").strip()
        if not user:
            self._send_json({"error": "user is required"}, 400)
            return
        fields = [f for f in params.get("field", []) if f]
        start = time.perf_counter()
        values = self.store.get_features(user, fields) if fields else {}
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        ttls = self.store.field_ttls_seconds(user, fields) if fields else {}
        key_ttl = self.store.key_ttl_seconds(user)
        self._send_json(
            {
                "requested": fields,
                "values": values,
                "ttls": ttls,
                "key_ttl_seconds": key_ttl,
                "returned_count": len(values),
                "elapsed_ms": elapsed_ms,
            },
            200,
        )

    def _handle_batch_read(self) -> None:
        params = self._read_form_data()
        count = max(1, min(500, int(params.get("count", ["100"])[0] or "100")))
        fields = [f for f in params.get("field", []) if f]
        if not fields:
            fields = list(DEFAULT_STREAMING_FIELDS) + ["risk_segment"]
        ids = self.store.list_entity_ids(limit=2000)
        if len(ids) > count:
            ids = ids[:count]
        start = time.perf_counter()
        rows = self.store.batch_get_features(ids, fields)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        sample = [
            {"id": uid, "field_count": len(rows.get(uid, {}))}
            for uid in ids[:10]
        ]
        self._send_json(
            {
                "entity_count": len(ids),
                "field_count": len(fields),
                "elapsed_ms": elapsed_ms,
                "sample": sample,
            },
            200,
        )

    def _handle_inspect(self, query: dict[str, list[str]]) -> None:
        user = (query.get("user", [""])[0] or "").strip()
        if not user:
            self._send_json({"error": "user is required"}, 400)
            return
        full = self.store.get_features(user, field_names=None)
        if not full:
            key_ttl = self.store.key_ttl_seconds(user)
            self._send_json(
                {"exists": False, "key_ttl_seconds": key_ttl},
                200,
            )
            return
        # Iterate the known schema (batch + streaming) plus any
        # extras the hash happens to carry. This makes expired
        # streaming fields surface as ttl_seconds=-2 in the UI
        # instead of silently disappearing, which is exactly the
        # debugging view someone hits "Inspect" for.
        all_names = list(DEFAULT_BATCH_FIELDS) + list(DEFAULT_STREAMING_FIELDS)
        for n in full:
            if n not in all_names:
                all_names.append(n)
        ttls = self.store.field_ttls_seconds(user, all_names)
        key_ttl = self.store.key_ttl_seconds(user)
        fields = sorted(
            [
                {"name": n, "value": full.get(n, ""),
                 "ttl_seconds": ttls.get(n, -2)}
                for n in all_names
            ],
            key=lambda r: r["name"],
        )
        self._send_json(
            {
                "exists": True,
                "key_ttl_seconds": key_ttl,
                "fields": fields,
            },
            200,
        )

    # ---- State assembly -------------------------------------------------

    def _build_state(self) -> dict:
        # The dropdown only needs a manageable list — cap at 500 — but the
        # displayed user count should be the real total, not the cap, or the
        # UI silently understates how many users are in the store.
        ids = self.store.list_entity_ids(limit=500)
        return {
            "key_prefix": self.store.key_prefix,
            "batch_ttl_seconds": self.store.batch_ttl_seconds,
            "streaming_ttl_seconds": self.store.streaming_ttl_seconds,
            "entity_count": self.store.count_entities(),
            "entity_ids": ids,
            "stats": self.store.stats(),
            "worker": self.worker.stats(),
        }

    # ---- HTTP plumbing --------------------------------------------------

    def _read_form_data(self) -> dict[str, list[str]]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8")
        return parse_qs(raw_body)

    def _send_html(self, html: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def _send_json(self, payload: dict, status: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stderr.write(f"[demo] {format % args}\n")

    def _html_page(self) -> str:
        return (
            HTML_TEMPLATE
            .replace("__KEY_PREFIX__", self.store.key_prefix)
            .replace("__STREAM_TTL__", str(self.store.streaming_ttl_seconds))
            .replace("__USERS_PER_TICK__", str(self.worker.users_per_tick))
            .replace("__BATCH_FIELDS_JSON__",
                     json.dumps(list(DEFAULT_BATCH_FIELDS)))
            .replace("__STREAM_FIELDS_JSON__",
                     json.dumps(list(DEFAULT_STREAMING_FIELDS)))
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis feature-store demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8085, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--key-prefix", default="fs:user:",
        help="Hash key prefix for each user.",
    )
    parser.add_argument(
        "--batch-ttl-seconds", type=int, default=24 * 60 * 60,
        help="Default key-level TTL applied by bulk-load (default 24h).",
    )
    parser.add_argument(
        "--streaming-ttl-seconds", type=int, default=5 * 60,
        help="Per-field TTL applied to streaming features (default 5m).",
    )
    parser.add_argument(
        "--users-per-tick", type=int, default=5,
        help="How many users the streaming worker touches per tick.",
    )
    parser.add_argument(
        "--seed-users", type=int, default=200,
        help="Number of users to materialize on startup.",
    )
    parser.add_argument(
        "--no-reset",
        dest="reset_on_start",
        action="store_false",
        help=(
            "Keep any existing data under --key-prefix instead of dropping"
            " it on startup. By default the demo wipes the prefix so each"
            " run starts from a clean state."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    store = RedisFeatureStore(
        redis_client=redis_client,
        key_prefix=args.key_prefix,
        batch_ttl_seconds=args.batch_ttl_seconds,
        streaming_ttl_seconds=args.streaming_ttl_seconds,
    )
    worker = StreamingWorker(
        store=store, users_per_tick=args.users_per_tick,
    )
    demo = FeatureStoreDemo(
        store=store, worker=worker,
        default_user_count=args.seed_users, seed=42,
    )

    if args.reset_on_start:
        print(
            f"Dropping any existing users under '{args.key_prefix}*'"
            " for a clean demo run (pass --no-reset to keep them)."
        )
        store.reset()
        store.reset_stats()
    seeded = demo.materialize(args.seed_users, args.batch_ttl_seconds)["loaded"]

    worker.start()

    FeatureStoreDemoHandler.store = store
    FeatureStoreDemoHandler.worker = worker
    FeatureStoreDemoHandler.demo = demo

    print(f"Redis feature-store demo server listening on http://{args.host}:{args.port}")
    print(
        f"Using Redis at {args.redis_host}:{args.redis_port}"
        f" with key prefix '{args.key_prefix}'"
        f" (batch TTL {args.batch_ttl_seconds}s,"
        f" streaming TTL {args.streaming_ttl_seconds}s)"
    )
    print(f"Materialized {seeded} user(s); streaming worker running.")

    server = ThreadingHTTPServer((args.host, args.port), FeatureStoreDemoHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        worker.stop()


if __name__ == "__main__":
    main()
