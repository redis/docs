#!/usr/bin/env ruby
# Redis streaming demo server.
#
# Run this file and visit http://localhost:8787 to watch a Redis Stream
# in action: producers append events to a single stream, two independent
# consumer groups read the same stream at their own pace, and within
# the `notifications` group two consumers share the work.
#
# Use the UI to:
#
# * Produce events into the stream.
# * Watch each consumer group's last-delivered ID, PEL count, and the
#   consumers inside it.
# * Drop the next N messages from a chosen consumer to simulate a
#   crash mid-processing, then run XAUTOCLAIM to reassign the stuck
#   entries to a healthy consumer.
# * Replay any ID range with XRANGE to confirm the history is
#   independent of consumer-group state.
# * Trim the stream with XTRIM to bound retention.

require 'cgi'
require 'json'
require 'optparse'
require 'redis'
require 'thread'
require 'webrick'

require_relative 'event_stream'
require_relative 'consumer_worker'

EVENT_TYPES = %w[order.placed order.paid order.shipped order.cancelled].freeze
DEFAULT_GROUPS = {
  'notifications' => %w[worker-a worker-b],
  'analytics' => %w[worker-c],
}.freeze

# In-memory registry of consumer workers across all groups.
#
# WEBrick dispatches each HTTP request on a fresh thread, so any code
# that mutates `@workers` (or iterates it while another handler is
# mutating it) needs the lock.
class StreamingDemo
  def initialize(stream, redis_factory)
    @stream = stream
    @redis_factory = redis_factory
    @workers = {}
    @lock = Monitor.new
  end

  def seed(groups)
    @lock.synchronize do
      groups.each do |group, names|
        @stream.ensure_group(group, '0-0')
        names.each { |name| add_worker(group, name) }
      end
      groups.values.sum(&:length)
    end
  end

  def add_worker(group, name)
    @lock.synchronize do
      key = [group, name]
      return false if @workers.key?(key)
      @stream.ensure_group(group, '0-0')
      # Each worker gets its own dedicated `read_stream` (with its
      # own Redis connection) for the blocking XREADGROUP loop -- a
      # `Redis.new` instance holds one socket and serialises every
      # command behind a monitor, and the blocking call would park
      # any concurrent HTTP handler behind it. The shared `stream`
      # handle (the demo server's primary connection) is used for
      # non-blocking commands such as XACK and XAUTOCLAIM so all
      # stats land in a single counter the UI can render.
      read_stream = RedisEventStream.new(
        redis: @redis_factory.call,
        stream_key: @stream.stream_key,
        maxlen_approx: @stream.maxlen_approx,
        claim_min_idle_ms: @stream.claim_min_idle_ms,
      )
      worker = ConsumerWorker.new(
        read_stream: read_stream,
        shared_stream: @stream,
        group: group,
        name: name,
      )
      worker.start
      @workers[key] = worker
      true
    end
  end

  # Remove a consumer safely.
  #
  # `XGROUP DELCONSUMER` destroys the consumer's PEL entries
  # outright, so any pending message it still owned would become
  # unreachable. Before deleting, hand its PEL off to another
  # consumer in the same group with `XCLAIM`. Without a peer
  # consumer to take over, refuse to delete and leave the worker in
  # place so the user can add a peer first.
  def remove_worker(group, name)
    @lock.synchronize do
      key = [group, name]
      worker = @workers[key]
      return { 'removed' => false, 'reason' => 'not-found' } if worker.nil?

      peers = @workers.keys.select { |g, n| g == group && n != name }.map { |_, n| n }
      if peers.empty?
        return {
          'removed' => false,
          'reason' => 'no-peer',
          'message' => (
            "#{group}/#{name} still owns pending entries and is the only " \
            'consumer in its group; add another consumer first so its ' \
            'PEL can be handed over before deletion.'
          ),
        }
      end

      handover_target = peers.first
      claimed_count = @stream.handover_pending(group, name, handover_target)

      @workers.delete(key)
      worker.stop
      @stream.delete_consumer(group, name)
      {
        'removed' => true,
        'handed_over_to' => handover_target,
        'handed_over_count' => claimed_count,
      }
    end
  end

  def get_worker(group, name)
    @lock.synchronize { @workers[[group, name]] }
  end

  # Stable list of [[group, name], worker] pairs safe to iterate outside the lock.
  def workers_snapshot
    @lock.synchronize { @workers.to_a }
  end

  def stop_all
    @lock.synchronize do
      @workers.each_value(&:stop)
      @workers.clear
    end
  end

  def reset
    @lock.synchronize do
      stop_all
      @stream.delete_stream
      @stream.reset_stats
      seed(DEFAULT_GROUPS)
    end
  end
end

# -- HTTP helpers ----------------------------------------------------

def parse_args(argv)
  opts = {
    host: '127.0.0.1',
    port: 8787,
    redis_host: 'localhost',
    redis_port: 6379,
    stream_key: 'demo:events:orders',
    maxlen: 2000,
    claim_idle_ms: 5000,
    reset_on_start: true,
  }
  OptionParser.new do |o|
    o.banner = 'Usage: demo_server.rb [options]'
    o.on('--host HOST', 'HTTP bind host') { |v| opts[:host] = v }
    o.on('--port PORT', Integer, 'HTTP bind port') { |v| opts[:port] = v }
    o.on('--redis-host HOST', 'Redis host') { |v| opts[:redis_host] = v }
    o.on('--redis-port PORT', Integer, 'Redis port') { |v| opts[:redis_port] = v }
    o.on('--stream-key NAME', 'Redis Stream key') { |v| opts[:stream_key] = v }
    o.on('--maxlen N', Integer, 'Approximate MAXLEN cap on every XADD') { |v| opts[:maxlen] = v }
    o.on('--claim-idle-ms MS', Integer,
         'Minimum idle time before XAUTOCLAIM may reassign a pending entry') do |v|
      opts[:claim_idle_ms] = v
    end
    o.on('--no-reset', 'Keep existing stream data on startup') { opts[:reset_on_start] = false }
  end.parse!(argv)
  opts
end

def parse_form(body)
  CGI.parse(body.to_s)
end

def clamp_int(value, lo, hi, default)
  v = Integer(value)
  [[v, lo].max, hi].min
rescue ArgumentError, TypeError
  default
end

# -- HTML template ---------------------------------------------------

HTML_TEMPLATE = <<~HTML.freeze
  <!DOCTYPE html>
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
      <div class="pill">redis-rb + WEBrick</div>
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
        const tailRows = tail.map((entry) => `
          <tr>
            <td class="mono">${escapeHtml(entry.id)}</td>
            <td>${escapeHtml(entry.fields.type)}</td>
            <td class="mono">${escapeHtml(entry.fields.order_id || "")}</td>
            <td>${escapeHtml(entry.fields.amount || "")}</td>
            <td class="mono">${escapeHtml(entry.fields.customer || "")}</td>
          </tr>`).join("");
        streamView.innerHTML = `
          <dl>
            <dt>Length</dt><dd>${stream.length ?? 0}</dd>
            <dt>First ID</dt><dd class="mono">${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
            <dt>Last ID</dt><dd class="mono">${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
            <dt>Produced</dt><dd>${state.stats.produced_total ?? 0}</dd>
            <dt>Acked</dt><dd>${state.stats.acked_total ?? 0}</dd>
            <dt>Claimed</dt><dd>${state.stats.claimed_total ?? 0}</dd>
          </dl>
          <h3>Tail (most recent)</h3>
          ${tail.length === 0 ? "<p>(empty)</p>" :
            `<table>
               <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
               <tbody>${tailRows}</tbody>
             </table>`}
        `;
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
            const recent = (c.recent || []).slice(0, 3).map((m) => `
              <span class="mono" title="${escapeHtml(JSON.stringify(m.fields))}">
                <span class="badge ${m.acked ? "ack" : "drop"}">${m.acked ? "ack" : "drop"}</span>
                ${escapeHtml(m.id)} ${escapeHtml(m.type)}
              </span>`).join(" &nbsp; ");
            const badges = [];
            if (c.paused) badges.push('<span class="badge idle">paused</span>');
            if (c.crash_queued > 0) badges.push(`<span class="badge drop">will drop ${c.crash_queued}</span>`);
            return `
              <div class="consumer-row">
                <span class="name">${escapeHtml(c.name)}</span>
                <span class="mono">pending=${c.pending} idle=${c.idle_ms}ms processed=${c.processed} reaped=${c.reaped ?? 0}</span>
                ${badges.join(" ")}
                <button class="small secondary" data-action="crash" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Crash next 3</button>
                <button class="small danger" data-action="remove" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Remove</button>
              </div>
              ${recent ? `<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">${recent}</div>` : ""}`;
          }).join("");
          return `
            <div class="group">
              <h3>${escapeHtml(g.name)}
                <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                  pending=${g.pending} lag=${g.lag ?? "?"} last_delivered=${escapeHtml(g.last_delivered_id)}
                </span>
              </h3>
              <div class="consumers">${consumers || "<em>(no consumers)</em>"}</div>
              <div class="row" style="max-width: 360px; margin-top: 6px;">
                <input id="addworker-${escapeHtml(g.name)}" placeholder="new-worker-name">
                <button class="small" data-action="add" data-group="${escapeHtml(g.name)}">Add consumer</button>
              </div>
            </div>`;
        }).join("");

        // Restore the typed text (and focus) into the add-consumer inputs.
        for (const [group, value] of Object.entries(addWorkerValues)) {
          const input = document.getElementById(`addworker-${group}`);
          if (input) input.value = value;
        }
        if (focusedGroup) {
          const input = document.getElementById(`addworker-${focusedGroup}`);
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
            options.push(`<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} &rarr; ${escapeHtml(c.name)}</option>`);
          }
        }
        autoclaimTarget.innerHTML = options.join("");
        if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
          autoclaimTarget.value = previous;
        }
      }

      function renderPending(state) {
        const rows = (state.pending || []).map((p) => `
          <tr>
            <td class="mono">${escapeHtml(p.group)}</td>
            <td class="mono">${escapeHtml(p.consumer)}</td>
            <td class="mono">${escapeHtml(p.id)}</td>
            <td>${p.idle_ms} ms</td>
            <td>${p.deliveries}</td>
          </tr>`).join("");
        pendingView.innerHTML = (state.pending || []).length === 0
          ? "<p>(no entries currently pending)</p>"
          : `<table>
               <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
               <tbody>${rows}</tbody>
             </table>`;
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
        setStatus(`Produced ${d.produced} event(s).`, "ok");
        resultView.innerHTML = `<p>Produced <strong>${d.produced}</strong> events. New IDs:</p>
          <pre class="mono">${d.ids.map(escapeHtml).join("\\n")}</pre>`;
        await refresh();
      });

      document.getElementById("replay-button").addEventListener("click", async () => {
        const params = new URLSearchParams({
          start: document.getElementById("replay-start").value,
          end: document.getElementById("replay-end").value,
          count: document.getElementById("replay-count").value,
        });
        const r = await fetch(`/replay?${params.toString()}`);
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
        setStatus(`Replayed ${d.entries.length} entry/entries (XRANGE).`, "ok");
        const rows = d.entries.map((e) => `
          <tr>
            <td class="mono">${escapeHtml(e.id)}</td>
            <td>${escapeHtml(e.fields.type)}</td>
            <td class="mono">${escapeHtml(e.fields.order_id || "")}</td>
            <td>${escapeHtml(e.fields.amount || "")}</td>
          </tr>`).join("");
        resultView.innerHTML = `
          <p>XRANGE ${escapeHtml(d.start)} &rarr; ${escapeHtml(d.end)} (limit ${d.limit})</p>
          ${d.entries.length === 0 ? "<p>(no entries)</p>" :
            `<table>
              <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
              <tbody>${rows}</tbody>
             </table>`}`;
      });

      document.getElementById("trim-button").addEventListener("click", async () => {
        const maxlen = document.getElementById("trim-maxlen").value;
        const body = new URLSearchParams({ maxlen });
        const r = await fetch("/trim", { method: "POST", body });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
        setStatus(`XTRIM removed ${d.deleted} entr${d.deleted === 1 ? "y" : "ies"}.`, "ok");
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
          ? `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}; ${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.`
          : `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}.`;
        setStatus(msg, "ok");
        const deletedBlock = deletedCount
          ? `<h3>Deleted IDs (payload already trimmed &mdash; removed from PEL by Redis)</h3>
             <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
             <p>In production these would also be routed to a dead-letter store for offline inspection.</p>`
          : "";
        resultView.innerHTML = `
          <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
             into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
             claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
             <strong>${d.processed}</strong>, and acked them.</p>
          ${d.claimed === 0 ? "<p>(nothing was idle enough yet &mdash; try again after a few seconds)</p>" : ""}
          ${deletedBlock}`;
        await refresh();
      });

      document.getElementById("reset-button").addEventListener("click", async () => {
        if (!confirm("Drop the stream and re-seed the default groups?")) return;
        const r = await fetch("/reset", { method: "POST" });
        const d = await r.json();
        setStatus(`Reset. ${d.consumers} consumer(s) re-seeded.`, "ok");
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
          setStatus(`Queued next 3 deliveries to ${group}/${name} for drop.`, "ok");
          await refresh();
        } else if (action === "remove") {
          const name = t.dataset.name;
          if (!confirm(`Remove ${group}/${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.`)) return;
          const body = new URLSearchParams({ group, name });
          const r = await fetch("/remove-worker", { method: "POST", body });
          const d = await r.json();
          if (!d.removed) {
            setStatus(d.message || `Could not remove ${group}/${name} (${d.reason || "unknown"}).`, "error");
          } else if (d.handed_over_count > 0) {
            setStatus(`Removed ${group}/${name}. Handed ${d.handed_over_count} pending entr${d.handed_over_count === 1 ? "y" : "ies"} over to ${d.handed_over_to}.`, "ok");
          } else {
            setStatus(`Removed ${group}/${name} (no pending entries to hand over).`, "ok");
          }
          await refresh();
        } else if (action === "add") {
          const input = document.getElementById(`addworker-${group}`);
          const name = (input.value || "").trim();
          if (!name) { setStatus("Enter a consumer name.", "error"); return; }
          const body = new URLSearchParams({ group, name });
          const r = await fetch("/add-worker", { method: "POST", body });
          const d = await r.json();
          if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
          input.value = "";
          setStatus(`Added ${group}/${name}.`, "ok");
          await refresh();
        }
      });

      refresh();
      setInterval(refresh, 1500);
    </script>
  </body>
  </html>
HTML

# -- Servlet --------------------------------------------------------

class StreamingServlet < WEBrick::HTTPServlet::AbstractServlet
  def initialize(server, stream, demo)
    super(server)
    @stream = stream
    @demo = demo
  end

  def do_GET(req, res)
    case req.path
    when '/', '/index.html'
      send_html(res, html_page)
    when '/state'
      send_json(res, build_state)
    when '/replay'
      handle_replay(req, res)
    else
      res.status = 404
      res.body = 'not found'
    end
  end

  def do_POST(req, res)
    case req.path
    when '/produce'        then handle_produce(req, res)
    when '/add-worker'     then handle_add_worker(req, res)
    when '/remove-worker'  then handle_remove_worker(req, res)
    when '/crash'          then handle_crash(req, res)
    when '/autoclaim'      then handle_autoclaim(req, res)
    when '/trim'           then handle_trim(req, res)
    when '/reset'
      count = @demo.reset
      send_json(res, 'consumers' => count)
    else
      res.status = 404
      res.body = 'not found'
    end
  end

  private

  # ---- POST handlers ----------------------------------------------

  def handle_produce(req, res)
    params = parse_form(req.body)
    count = clamp_int((params['count'] || ['1']).first || '1', 1, 500, 1)
    event_type = ((params['type'] || ['']).first || '').strip
    events = Array.new(count) do
      picked = event_type.empty? ? EVENT_TYPES.sample : event_type
      [picked, fake_payload]
    end
    ids = @stream.produce_batch(events)
    send_json(res, 'produced' => ids.length, 'ids' => ids)
  end

  def handle_add_worker(req, res)
    params = parse_form(req.body)
    group = ((params['group'] || ['']).first || '').strip
    name = ((params['name'] || ['']).first || '').strip
    if group.empty? || name.empty?
      send_json(res, { 'error' => 'group and name are required' }, status: 400)
      return
    end
    unless @demo.add_worker(group, name)
      send_json(res, { 'error' => "#{group}/#{name} already exists" }, status: 409)
      return
    end
    send_json(res, 'group' => group, 'name' => name)
  end

  def handle_remove_worker(req, res)
    params = parse_form(req.body)
    group = ((params['group'] || ['']).first || '').strip
    name = ((params['name'] || ['']).first || '').strip
    result = @demo.remove_worker(group, name)
    status = if result['removed'] || result['reason'] == 'not-found'
               200
             else
               409
             end
    send_json(res, result, status: status)
  end

  def handle_crash(req, res)
    params = parse_form(req.body)
    group = ((params['group'] || ['']).first || '').strip
    name = ((params['name'] || ['']).first || '').strip
    count = clamp_int((params['count'] || ['1']).first || '1', 0, 10_000, 1)
    worker = @demo.get_worker(group, name)
    if worker.nil?
      send_json(res, { 'error' => "unknown consumer #{group}/#{name}" }, status: 404)
      return
    end
    worker.crash_next(count)
    send_json(res, 'queued' => count)
  end

  def handle_autoclaim(req, res)
    params = parse_form(req.body)
    group = ((params['group'] || ['']).first || '').strip
    consumer = ((params['consumer'] || ['']).first || '').strip
    if group.empty? || consumer.empty?
      send_json(res, { 'error' => 'group and consumer are required' }, status: 400)
      return
    end
    worker = @demo.get_worker(group, consumer)
    if worker.nil?
      send_json(res, { 'error' => "unknown consumer #{group}/#{consumer}" }, status: 404)
      return
    end
    # `reap_idle_pel` runs XAUTOCLAIM(self) + process + ack. `deleted_ids`
    # are PEL entries whose stream payload was already trimmed by
    # MAXLEN ~ before the sweep ran. Redis 7+ removes them from the PEL
    # inside XAUTOCLAIM itself, so the caller doesn't have to XACK them;
    # in production they would be routed to a dead-letter store for
    # offline inspection.
    result = worker.reap_idle_pel
    send_json(res,
              'claimed' => result[:claimed],
              'processed' => result[:processed],
              'deleted' => result[:deleted_ids],
              'min_idle_ms' => @stream.claim_min_idle_ms)
  end

  def handle_trim(req, res)
    params = parse_form(req.body)
    maxlen = clamp_int((params['maxlen'] || ['0']).first || '0', 0, 1_000_000_000, 0)
    deleted = @stream.trim_maxlen(maxlen)
    send_json(res, 'deleted' => deleted, 'maxlen' => maxlen)
  end

  def handle_replay(req, res)
    query = req.query
    start_id = (query['start'].to_s.empty? ? '-' : query['start'])
    end_id = (query['end'].to_s.empty? ? '+' : query['end'])
    limit = clamp_int(query['count'].to_s.empty? ? '20' : query['count'], 1, 500, 20)
    entries = @stream.replay(start_id: start_id, end_id: end_id, count: limit)
    send_json(res,
              'start' => start_id,
              'end' => end_id,
              'limit' => limit,
              'entries' => entries.map { |id, fields| { 'id' => id, 'fields' => fields } })
  end

  # ---- State assembly ---------------------------------------------

  def build_state
    stream_info = @stream.info_stream
    groups = @stream.info_groups

    workers_snapshot = @demo.workers_snapshot
    groups_detail = []
    pending_rows = []

    groups.each do |group|
      group_name = group['name']
      consumer_info = {}
      @stream.info_consumers(group_name).each { |c| consumer_info[c['name']] = c }
      consumers_detail = []
      workers_snapshot.each do |(g_name, c_name), worker|
        next unless g_name == group_name
        info = consumer_info[c_name] || {}
        status = worker.status
        consumers_detail << status.merge(
          'pending' => info['pending'] || 0,
          'idle_ms' => info['idle_ms'] || 0,
          'recent' => worker.recent,
        )
      end
      # Also include consumers that exist in Redis but not in our
      # in-process registry (e.g. orphaned after a restart).
      consumer_info.each do |c_name, info|
        next if consumers_detail.any? { |c| c['name'] == c_name }
        consumers_detail << {
          'name' => c_name,
          'group' => group_name,
          'processed' => 0,
          'reaped' => 0,
          'crashed_drops' => 0,
          'paused' => false,
          'crash_queued' => 0,
          'alive' => false,
          'pending' => info['pending'] || 0,
          'idle_ms' => info['idle_ms'] || 0,
          'recent' => [],
        }
      end
      consumers_detail.sort_by! { |c| c['name'] }
      groups_detail << group.merge('consumers_detail' => consumers_detail)

      @stream.pending_detail(group_name, count: 50).each do |row|
        pending_rows << row.merge('group' => group_name)
      end
    end

    # XREVRANGE returns the newest N entries (in reverse order); the tail
    # view wants the most recent activity, not the head of history.
    tail = @stream.tail(count: 10).map { |id, fields| { 'id' => id, 'fields' => fields } }

    {
      'stream' => stream_info,
      'tail' => tail,
      'groups' => groups_detail,
      'pending' => pending_rows,
      'stats' => @stream.stats,
    }
  end

  # ---- HTTP plumbing ----------------------------------------------

  def send_html(res, body)
    res.status = 200
    res['Content-Type'] = 'text/html; charset=utf-8'
    res.body = body
  end

  def send_json(res, payload, status: 200)
    res.status = status
    res['Content-Type'] = 'application/json'
    res.body = JSON.generate(payload)
  end

  def html_page
    HTML_TEMPLATE
      .gsub('__STREAM_KEY__', @stream.stream_key)
      .gsub('__MAXLEN__', @stream.maxlen_approx.to_s)
      .gsub('__CLAIM_IDLE__', @stream.claim_min_idle_ms.to_s)
  end
end

def fake_payload
  {
    'order_id' => format('o-%04d', rand(1000..9999)),
    'customer' => %w[alice bob carol dan erin].sample,
    'amount' => format('%.2f', rand * 245 + 5),
  }
end

# -- Entry point -----------------------------------------------------

def main
  args = parse_args(ARGV)

  redis_factory = -> { Redis.new(host: args[:redis_host], port: args[:redis_port]) }
  stream = RedisEventStream.new(
    redis: redis_factory.call,
    stream_key: args[:stream_key],
    maxlen_approx: args[:maxlen],
    claim_min_idle_ms: args[:claim_idle_ms],
  )

  demo = StreamingDemo.new(stream, redis_factory)

  if args[:reset_on_start]
    puts "Deleting any existing data at key '#{args[:stream_key]}'" \
         ' for a clean demo run (pass --no-reset to keep it).'
    stream.delete_stream
  end
  seeded = demo.seed(DEFAULT_GROUPS)

  server = WEBrick::HTTPServer.new(
    BindAddress: args[:host],
    Port: args[:port],
    Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
    AccessLog: [],
  )
  server.mount('/', StreamingServlet, stream, demo)

  trap('INT') { server.shutdown }
  trap('TERM') { server.shutdown }

  puts "Redis streaming demo server listening on http://#{args[:host]}:#{args[:port]}"
  puts "Using Redis at #{args[:redis_host]}:#{args[:redis_port]}" \
       " with stream key '#{args[:stream_key]}' (MAXLEN ~ #{args[:maxlen]})"
  puts "Seeded #{seeded} consumer(s) across #{DEFAULT_GROUPS.length} group(s)"

  begin
    server.start
  ensure
    demo.stop_all
  end
end

main if $PROGRAM_NAME == __FILE__
