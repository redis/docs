#!/usr/bin/env ruby
# Redis feature-store demo server (Ruby + redis-rb + WEBrick).
#
# Run with `bundle exec ruby demo_server.rb` and visit
# <http://localhost:8093> to watch an online feature store at work:
# a batch materialization loads N users with a 24-hour key-level TTL,
# a streaming worker overwrites a handful of users' real-time features
# every second with a per-field HEXPIRE, and the inference panel reads
# any subset of features for any user with HMGET in a single round
# trip.

require 'json'
require 'optparse'
require 'redis'
require 'uri'
require 'webrick'
require 'thread'

require_relative 'feature_store'
require_relative 'streaming_worker'
require_relative 'build_features'

# Bundles the FeatureStore + worker with the lifecycle hooks the HTTP
# handlers call into. A single mutex serializes materialize / reset /
# toggle so the worker pause-and-wait-idle dance can't race with a
# concurrent bulk-load.
class FeatureStoreDemo
  def initialize(store:, worker:, seed: 42)
    @store = store
    @worker = worker
    @seed = seed
    @lock = Mutex.new
  end

  def materialize(count, ttl_seconds)
    @lock.synchronize do
      rows = synthesize_users(count, @seed)
      t0 = monotonic_ms
      loaded = @store.bulk_load(rows, ttl_seconds: ttl_seconds)
      elapsed_ms = monotonic_ms - t0
      { loaded: loaded, ttl_seconds: ttl_seconds, elapsed_ms: elapsed_ms }
    end
  end

  # Pause + wait-for-idle around the DEL sweep so a concurrent tick
  # can't recreate a user that was just enumerated for deletion
  # (streaming HSET creates the key if it's missing, leaving a
  # streaming-only hash with no key-level TTL).
  def reset
    @lock.synchronize do
      was_paused = @worker.paused?
      if @worker.running?
        @worker.pause unless was_paused
        @worker.wait_for_idle
      end
      begin
        deleted = @store.reset
        @store.reset_stats
        @worker.reset_stats
        { deleted: deleted }
      ensure
        @worker.resume if @worker.running? && !was_paused
      end
    end
  end

  def toggle_worker
    @lock.synchronize do
      # Three states: stopped -> start (and leave unpaused);
      # running + unpaused -> pause; running + paused -> resume.
      # start clears the paused flag, so a fall-through would pause
      # the worker we just brought back up.
      if !@worker.running?
        @worker.start
      elsif @worker.paused?
        @worker.resume
      else
        @worker.pause
      end
      { paused: @worker.paused?, running: @worker.running? }
    end
  end

  private

  def monotonic_ms
    Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000
  end
end

class FeatureStoreServlet < WEBrick::HTTPServlet::AbstractServlet
  def initialize(server, store, worker, demo, html_page)
    super(server)
    @store = store
    @worker = worker
    @demo = demo
    @html_page = html_page
  end

  def do_GET(req, res)
    case req.path
    when '/', '/index.html'
      res.status = 200
      res['Content-Type'] = 'text/html; charset=utf-8'
      res.body = @html_page
    when '/state'
      json_response(res, 200, build_state)
    when '/inspect'
      handle_inspect(req, res)
    else
      res.status = 404
      res.body = 'Not Found'
    end
  end

  def do_POST(req, res)
    case req.path
    when '/bulk-load' then handle_bulk_load(req, res)
    when '/reset'     then json_response(res, 200, @demo.reset)
    when '/worker/toggle' then json_response(res, 200, @demo.toggle_worker)
    when '/read'      then handle_read(req, res)
    when '/batch-read' then handle_batch_read(req, res)
    else
      res.status = 404
      res.body = 'Not Found'
    end
  end

  private

  def build_state
    ids = @store.list_entity_ids(limit: 500)
    {
      key_prefix: @store.key_prefix,
      batch_ttl_seconds: @store.batch_ttl_seconds,
      streaming_ttl_seconds: @store.streaming_ttl_seconds,
      # list_entity_ids caps at 500 for the UI dropdown; report the
      # true count separately so the page doesn't silently understate
      # how many users are in the store.
      entity_count: @store.count_entities,
      entity_ids: ids,
      stats: @store.stats,
      worker: @worker.stats,
    }
  end

  def handle_inspect(req, res)
    user = (req.query['user'] || '').strip
    return json_response(res, 400, { error: 'user is required' }) if user.empty?

    full = @store.get_features(user, nil)
    key_ttl = @store.key_ttl_seconds(user)
    if full.empty?
      return json_response(res, 200, { exists: false, key_ttl_seconds: key_ttl })
    end
    # Iterate the known schema (batch + streaming) plus any extras
    # the hash carries so expired streaming fields surface as
    # ttl_seconds=-2 in the Inspect view rather than silently
    # disappearing.
    names = FeatureStore::DEFAULT_BATCH_FIELDS + FeatureStore::DEFAULT_STREAMING_FIELDS
    full.each_key { |k| names << k unless names.include?(k) }
    ttls = @store.field_ttls_seconds(user, names)
    fields = names.sort.map do |n|
      { name: n, value: full[n] || '', ttl_seconds: ttls[n] || -2 }
    end
    json_response(res, 200, { exists: true, key_ttl_seconds: key_ttl, fields: fields })
  end

  def handle_bulk_load(req, res)
    form = parse_form(req.body)
    count = clamp(int_or(form['count'], 200), 1, 2000)
    ttl = clamp(int_or(form['ttl'], 86_400), 5, 172_800)
    json_response(res, 200, @demo.materialize(count, ttl))
  end

  def handle_read(req, res)
    form = parse_form(req.body)
    user = first(form['user']).to_s.strip
    return json_response(res, 400, { error: 'user is required' }) if user.empty?
    fields = (form['field'] || []).reject(&:empty?)
    t0 = monotonic_ms
    values = fields.empty? ? {} : @store.get_features(user, fields)
    elapsed_ms = monotonic_ms - t0
    ttls = fields.empty? ? {} : @store.field_ttls_seconds(user, fields)
    key_ttl = @store.key_ttl_seconds(user)
    json_response(res, 200, {
      requested: fields,
      values: values,
      ttls: ttls,
      key_ttl_seconds: key_ttl,
      returned_count: values.size,
      elapsed_ms: elapsed_ms,
    })
  end

  def handle_batch_read(req, res)
    form = parse_form(req.body)
    count = clamp(int_or(form['count'], 100), 1, 500)
    fields = (form['field'] || []).reject(&:empty?)
    fields = FeatureStore::DEFAULT_STREAMING_FIELDS + ['risk_segment'] if fields.empty?
    ids = @store.list_entity_ids(limit: [count * 2, 2000].max)
    ids = ids.first(count) if ids.size > count
    t0 = monotonic_ms
    rows = @store.batch_get_features(ids, fields)
    elapsed_ms = monotonic_ms - t0
    sample = ids.first(10).map do |id|
      { id: id, field_count: (rows[id] || {}).size }
    end
    json_response(res, 200, {
      entity_count: ids.size,
      field_count: fields.size,
      elapsed_ms: elapsed_ms,
      sample: sample,
    })
  end

  # ---------- helpers ----------

  # Parse an application/x-www-form-urlencoded body into a multi-value
  # Hash<String, Array<String>>. URI.decode_www_form preserves
  # repeated keys (field=a&field=b), which is what we need for the
  # inference + batch-read forms. CGI.parse was removed in Ruby 4.
  def parse_form(body)
    out = Hash.new { |h, k| h[k] = [] }
    return out if body.to_s.empty?
    URI.decode_www_form(body.to_s).each { |k, v| out[k] << v }
    out
  end

  def first(values); values.is_a?(Array) ? values.first : values; end
  def int_or(values, default); v = first(values); (v && !v.to_s.empty?) ? v.to_i : default; end
  def clamp(v, lo, hi); v < lo ? lo : (v > hi ? hi : v); end

  def json_response(res, status, payload)
    res.status = status
    res['Content-Type'] = 'application/json'
    res.body = JSON.generate(payload)
  end

  def monotonic_ms
    Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000
  end
end

# ----------------------------------------------------------------------
# HTML page
# ----------------------------------------------------------------------

HTML_TEMPLATE = <<~'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Feature Store Demo (Ruby)</title>
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
    .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-top: 24px; }
    .panel { background: rgba(255, 255, 255, 0.96); border: 1px solid var(--line); border-radius: 16px; padding: 20px; box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07); }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill { display: inline-block; border-radius: 999px; background: var(--pill); color: var(--accent-dark); padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px; }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select { width: 100%; padding: 9px 11px; border-radius: 9px; border: 1px solid #c0d2cc; font: inherit; background: white; }
    button { appearance: none; border: 0; border-radius: 999px; background: var(--accent); color: white; padding: 10px 16px; font: inherit; cursor: pointer; margin-right: 6px; margin-top: 10px; }
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
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; }
    .badge { display: inline-block; border-radius: 6px; padding: 2px 7px; font-size: 0.8rem; font-weight: bold; }
    .badge.batch { background: var(--batch); color: #43326a; }
    .badge.stream { background: var(--stream); color: #1d4a2c; }
    .badge.expired { background: var(--warn); color: #6b3220; }
    .badge.untracked { background: #eceff1; color: #3b4951; }
    .badge.running { background: var(--ok); color: #1d4a2c; }
    .badge.paused { background: var(--warn); color: #6b3220; }
    .ttl-pos { color: #1a594c; font-weight: bold; }
    .ttl-neg { color: #6b3220; }
    .field-list { display: flex; gap: 6px 12px; flex-wrap: wrap; }
    .field-list label { display: inline-flex; align-items: center; gap: 4px; margin: 0; font-weight: normal; font-size: 0.9rem; }
    .field-list input { width: auto; }
    #status { margin-top: 18px; padding: 12px 14px; border-radius: 12px; display: none; }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-rb + WEBrick</div>
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
          through one <code>redis.pipelined</code> block, so the whole
          batch ships in one round trip.</p>
        <label for="bulk-count">How many users</label>
        <input id="bulk-count" type="number" min="1" max="2000" value="200">
        <label for="bulk-ttl">Key-level TTL (seconds)</label>
        <input id="bulk-ttl" type="number" min="5" max="172800" value="86400">
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Drop the TTL to e.g. 30 s and watch entities disappear on
          schedule.
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
          <code>redis.pipelined</code>. One network round trip for the
          whole batch.</p>
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

    function setStatus(message, kind) { statusBox.textContent = message; statusBox.className = kind; }
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
        </dl>`;
    }
    function renderWorker(state) {
      const w = state.worker || {};
      const badge = w.paused
        ? '<span class="badge paused">paused</span>'
        : w.running ? '<span class="badge running">running</span>' : '<span class="badge expired">stopped</span>';
      workerView.innerHTML = `<p>${badge} <span class="mono">ticks=${w.tick_count ?? 0} writes=${w.writes_count ?? 0}</span></p>`;
    }
    function populateUserSelects(ids) {
      for (const sel of [readUserSelect, inspectUserSelect]) {
        const previous = sel.value;
        sel.innerHTML = ids.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join("");
        if (ids.includes(previous)) sel.value = previous;
      }
    }
    function renderFieldPicker() {
      const allFields = [...BATCH_FIELDS, ...STREAM_FIELDS];
      readFieldsBox.innerHTML = allFields.map((f) => {
        const kind = classifyField(f);
        const checked = ["risk_segment", "tx_count_7d", "avg_amount_30d", "tx_count_5m", "failed_logins_15m"].includes(f) ? "checked" : "";
        return `<label><input type="checkbox" name="field" value="${escapeHtml(f)}" ${checked}>
          <span class="badge ${kind}">${kind}</span>
          <span class="mono">${escapeHtml(f)}</span></label>`;
      }).join("");
    }
    function selectedReadFields() {
      return Array.from(readFieldsBox.querySelectorAll('input[name="field"]:checked')).map((el) => el.value);
    }
    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStore(state); renderWorker(state); populateUserSelects(state.entity_ids || []);
    }

    document.getElementById("bulk-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("bulk-count").value, 10) || 1;
      const ttl = parseInt(document.getElementById("bulk-ttl").value, 10) || 86400;
      const body = new URLSearchParams({ count, ttl });
      const r = await fetch("/bulk-load", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Bulk-load failed.", "error"); return; }
      setStatus(`Materialized ${d.loaded} user(s) with a ${d.ttl_seconds}s key-level TTL in ${d.elapsed_ms.toFixed(1)} ms.`, "ok");
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
        const value = d.values[name]; const ttl = d.ttls[name]; const kind = classifyField(name);
        return `<tr>
          <td><span class="badge ${kind}">${kind}</span> <span class="mono">${escapeHtml(name)}</span></td>
          <td class="mono">${value === undefined || value === null ? '<span class="badge expired">missing</span>' : escapeHtml(value)}</td>
          <td>${ttlLabel(ttl)}</td>
        </tr>`;
      }).join("");
      readResult.innerHTML = `
        <p><strong>HMGET</strong> ${escapeHtml(user)} (${d.requested.length} field(s))
          returned ${d.returned_count} value(s) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>.
          Key-level TTL: ${ttlLabel(d.key_ttl_seconds)}.</p>
        ${d.requested.length === 0 ? "" : `<table><thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead><tbody>${rows}</tbody></table>`}`;
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
      const rows = (d.sample || []).map((row) => `<tr><td class="mono">${escapeHtml(row.id)}</td><td>${row.field_count}</td></tr>`).join("");
      batchResult.innerHTML = `
        <p>Pipelined <code>HMGET</code> across <strong>${d.entity_count}</strong> users
          (${d.field_count} field(s) each) in <strong>${d.elapsed_ms.toFixed(2)} ms</strong>
          (~${perEntity.toFixed(3)} ms / user, one network round trip total).</p>
        ${(d.sample || []).length === 0 ? "" : `<h3>Sample</h3><table><thead><tr><th>user</th><th>fields returned</th></tr></thead><tbody>${rows}</tbody></table>`}`;
    });
    document.getElementById("inspect-button").addEventListener("click", async () => {
      const user = inspectUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const params = new URLSearchParams({ user });
      const r = await fetch(`/inspect?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Inspect failed.", "error"); return; }
      const rows = (d.fields || []).map((f) => `<tr>
        <td><span class="badge ${classifyField(f.name)}">${classifyField(f.name)}</span> <span class="mono">${escapeHtml(f.name)}</span></td>
        <td class="mono">${escapeHtml(f.value)}</td>
        <td>${ttlLabel(f.ttl_seconds)}</td></tr>`).join("");
      inspectResult.innerHTML = d.exists === false
        ? `<p><span class="badge expired">missing</span> <code>${escapeHtml(user)}</code> isn't in the store. Either it was never materialized or its key-level TTL expired.</p>`
        : `<p>Key-level TTL: ${ttlLabel(d.key_ttl_seconds)} &nbsp; (${d.fields.length} field(s))</p>
           <table><thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead><tbody>${rows}</tbody></table>`;
    });

    renderFieldPicker(); refresh(); setInterval(refresh, 1500);
  </script>
</body>
</html>
HTML

# ----------------------------------------------------------------------
# main
# ----------------------------------------------------------------------

def parse_args(argv)
  opts = {
    host: '127.0.0.1', port: 8093, redis_url: 'redis://localhost:6379',
    key_prefix: 'fs:user:',
    batch_ttl_seconds: 24 * 60 * 60,
    streaming_ttl_seconds: 5 * 60,
    users_per_tick: 5, seed_users: 200, reset_on_start: true,
  }
  OptionParser.new do |o|
    o.on('--host H') { |v| opts[:host] = v }
    o.on('--port P', Integer) { |v| opts[:port] = v }
    o.on('--redis-url URL') { |v| opts[:redis_url] = v }
    o.on('--key-prefix PFX') { |v| opts[:key_prefix] = v }
    o.on('--batch-ttl-seconds S', Integer) { |v| opts[:batch_ttl_seconds] = v }
    o.on('--streaming-ttl-seconds S', Integer) { |v| opts[:streaming_ttl_seconds] = v }
    o.on('--users-per-tick N', Integer) { |v| opts[:users_per_tick] = v }
    o.on('--seed-users N', Integer) { |v| opts[:seed_users] = v }
    o.on('--no-reset') { opts[:reset_on_start] = false }
  end.parse!(argv)
  opts
end

if $PROGRAM_NAME == __FILE__
  opts = parse_args(ARGV)
  redis = Redis.new(url: opts[:redis_url])
  store = FeatureStore.new(
    redis: redis,
    key_prefix: opts[:key_prefix],
    batch_ttl_seconds: opts[:batch_ttl_seconds],
    streaming_ttl_seconds: opts[:streaming_ttl_seconds],
  )
  if opts[:reset_on_start]
    puts "Dropping any existing users under '#{opts[:key_prefix]}*' for a clean demo run (pass --no-reset to keep them)."
    store.reset
    store.reset_stats
  end
  seeded = store.bulk_load(
    synthesize_users(opts[:seed_users], 42),
    ttl_seconds: opts[:batch_ttl_seconds],
  )

  worker = StreamingWorker.new(
    store: store,
    tick_seconds: 1.0,
    users_per_tick: opts[:users_per_tick],
    seed: 1337,
  )
  worker.start

  demo = FeatureStoreDemo.new(store: store, worker: worker)

  html_page = HTML_TEMPLATE
    .gsub('__KEY_PREFIX__', opts[:key_prefix])
    .gsub('__STREAM_TTL__', opts[:streaming_ttl_seconds].to_s)
    .gsub('__USERS_PER_TICK__', opts[:users_per_tick].to_s)
    .gsub('__BATCH_FIELDS_JSON__', JSON.generate(FeatureStore::DEFAULT_BATCH_FIELDS))
    .gsub('__STREAM_FIELDS_JSON__', JSON.generate(FeatureStore::DEFAULT_STREAMING_FIELDS))

  server = WEBrick::HTTPServer.new(
    BindAddress: opts[:host],
    Port: opts[:port],
    Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
    AccessLog: [],
  )
  server.mount('/', FeatureStoreServlet, store, worker, demo, html_page)

  trap('INT') do
    puts "\nShutting down..."
    worker.stop
    server.shutdown
  end

  puts "Redis feature-store demo server listening on http://#{opts[:host]}:#{opts[:port]}"
  puts "Using Redis at #{opts[:redis_url]} with key prefix '#{opts[:key_prefix]}' (batch TTL #{opts[:batch_ttl_seconds]}s, streaming TTL #{opts[:streaming_ttl_seconds]}s)"
  puts "Materialized #{seeded} user(s); streaming worker running."

  server.start
end
