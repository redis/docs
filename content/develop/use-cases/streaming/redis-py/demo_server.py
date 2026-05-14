#!/usr/bin/env python3
"""
Redis streaming demo server.

Run this file and visit http://localhost:8083 to watch a Redis Stream
in action: producers append events to a single stream, two independent
consumer groups read the same stream at their own pace, and within
the ``notifications`` group two consumers share the work.

Use the UI to:

* Produce events into the stream.
* Watch each consumer group's last-delivered ID, PEL count, and the
  consumers inside it.
* Drop the next ``N`` messages from a chosen consumer to simulate a
  crash mid-processing, then run ``XAUTOCLAIM`` to reassign the
  stuck entries to a healthy consumer.
* Replay any ID range with ``XRANGE`` to confirm the history is
  independent of consumer-group state.
* Trim the stream with ``XTRIM`` to bound retention.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from consumer_worker import ConsumerWorker
    from event_stream import RedisEventStream
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


EVENT_TYPES = ["order.placed", "order.paid", "order.shipped", "order.cancelled"]
DEFAULT_GROUPS: dict[str, list[str]] = {
    "notifications": ["worker-a", "worker-b"],
    "analytics": ["worker-c"],
}


HTML_TEMPLATE = """<!DOCTYPE html>
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
    <div class="pill">redis-py + Python standard library HTTP server</div>
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
        consumer group — no cursors move, no acks happen.</p>
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
        Idle time ≥ <code>__CLAIM_IDLE__</code> ms is eligible for
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
          options.push(`<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} → ${escapeHtml(c.name)}</option>`);
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
        <p>XRANGE ${escapeHtml(d.start)} → ${escapeHtml(d.end)} (limit ${d.limit})</p>
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
        ? `<h3>Deleted IDs (payload already trimmed — removed from PEL by Redis)</h3>
           <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
           <p>In production these would also be routed to a dead-letter store for offline inspection.</p>`
        : "";
      resultView.innerHTML = `
        <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
           into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
           claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
           <strong>${d.processed}</strong>, and acked them.</p>
        ${d.claimed === 0 ? "<p>(nothing was idle enough yet — try again after a few seconds)</p>" : ""}
        ${deletedBlock}`;
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop the stream and re-seed the default groups?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      setStatus(`Reset. ${d.groups} group(s) re-seeded.`, "ok");
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
"""


class StreamingDemo:
    """In-memory registry of consumer workers across all groups.

    ``ThreadingHTTPServer`` dispatches each HTTP request on a fresh
    thread, so any code that mutates ``self.workers`` (or iterates it
    while another handler is mutating it) needs the lock.
    """

    def __init__(self, stream: RedisEventStream) -> None:
        self.stream = stream
        self.workers: dict[tuple[str, str], ConsumerWorker] = {}
        self._lock = threading.RLock()

    def seed(self, groups: dict[str, list[str]]) -> int:
        with self._lock:
            for group, names in groups.items():
                self.stream.ensure_group(group, start_id="0-0")
                for name in names:
                    self.add_worker(group, name)
            return sum(len(v) for v in groups.values())

    def add_worker(self, group: str, name: str) -> bool:
        with self._lock:
            key = (group, name)
            if key in self.workers:
                return False
            self.stream.ensure_group(group, start_id="0-0")
            worker = ConsumerWorker(self.stream, group=group, name=name)
            worker.start()
            self.workers[key] = worker
            return True

    def remove_worker(self, group: str, name: str) -> dict:
        """Remove a consumer safely.

        ``XGROUP DELCONSUMER`` destroys the consumer's PEL entries
        outright, so any pending message it still owned would become
        unreachable. Before deleting, hand its PEL off to another
        consumer in the same group with ``XCLAIM``. Without a peer
        consumer to take over, refuse to delete and leave the worker
        in place so the user can add a peer first.
        """
        with self._lock:
            key = (group, name)
            worker = self.workers.get(key)
            if worker is None:
                return {"removed": False, "reason": "not-found"}

            peers = [
                n for (g, n) in self.workers if g == group and n != name
            ]
            if not peers:
                return {
                    "removed": False,
                    "reason": "no-peer",
                    "message": (
                        f"{group}/{name} still owns pending entries and is the only "
                        "consumer in its group; add another consumer first so its "
                        "PEL can be handed over before deletion."
                    ),
                }

            handover_target = peers[0]
            claimed = self.stream.handover_pending(
                group, from_consumer=name, to_consumer=handover_target,
            )

            self.workers.pop(key, None)
            worker.stop()
            self.stream.delete_consumer(group, name)
            return {
                "removed": True,
                "handed_over_to": handover_target,
                "handed_over_count": len(claimed),
            }

    def get_worker(self, group: str, name: str) -> ConsumerWorker | None:
        with self._lock:
            return self.workers.get((group, name))

    def workers_snapshot(self) -> list[tuple[tuple[str, str], ConsumerWorker]]:
        """Stable list of (key, worker) safe to iterate outside the lock."""
        with self._lock:
            return list(self.workers.items())

    def stop_all(self) -> None:
        with self._lock:
            for worker in list(self.workers.values()):
                worker.stop()
            self.workers.clear()

    def reset(self) -> int:
        with self._lock:
            self.stop_all()
            self.stream.delete_stream()
            self.stream.reset_stats()
            return self.seed(DEFAULT_GROUPS)


class StreamingDemoHandler(BaseHTTPRequestHandler):
    """HTTP handler. Server-state is hung off class attributes."""

    stream: RedisEventStream | None = None
    demo: StreamingDemo | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return
        if parsed.path == "/state":
            self._send_json(self._build_state(), 200)
            return
        if parsed.path == "/replay":
            self._handle_replay(parse_qs(parsed.query))
            return
        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/produce":
            self._handle_produce()
            return
        if parsed.path == "/add-worker":
            self._handle_add_worker()
            return
        if parsed.path == "/remove-worker":
            self._handle_remove_worker()
            return
        if parsed.path == "/crash":
            self._handle_crash()
            return
        if parsed.path == "/autoclaim":
            self._handle_autoclaim()
            return
        if parsed.path == "/trim":
            self._handle_trim()
            return
        if parsed.path == "/reset":
            count = self.demo.reset()
            self._send_json({"groups": count}, 200)
            return
        self.send_error(404)

    # ---- POST handlers ----------------------------------------------

    def _handle_produce(self) -> None:
        params = self._read_form_data()
        count = max(1, min(500, int(params.get("count", ["1"])[0] or "1")))
        event_type = (params.get("type", [""])[0] or "").strip()
        events = []
        for _ in range(count):
            picked = event_type or random.choice(EVENT_TYPES)
            events.append((picked, _fake_payload()))
        ids = self.stream.produce_batch(events)
        self._send_json({"produced": len(ids), "ids": ids}, 200)

    def _handle_add_worker(self) -> None:
        params = self._read_form_data()
        group = params.get("group", [""])[0].strip()
        name = params.get("name", [""])[0].strip()
        if not group or not name:
            self._send_json({"error": "group and name are required"}, 400)
            return
        added = self.demo.add_worker(group, name)
        if not added:
            self._send_json({"error": f"{group}/{name} already exists"}, 409)
            return
        self._send_json({"group": group, "name": name}, 200)

    def _handle_remove_worker(self) -> None:
        params = self._read_form_data()
        group = params.get("group", [""])[0].strip()
        name = params.get("name", [""])[0].strip()
        result = self.demo.remove_worker(group, name)
        status = 200 if result.get("removed") or result.get("reason") == "not-found" else 409
        self._send_json(result, status)

    def _handle_crash(self) -> None:
        params = self._read_form_data()
        group = params.get("group", [""])[0].strip()
        name = params.get("name", [""])[0].strip()
        count = int(params.get("count", ["1"])[0] or "1")
        worker = self.demo.get_worker(group, name)
        if worker is None:
            self._send_json({"error": f"unknown consumer {group}/{name}"}, 404)
            return
        worker.crash_next(count)
        self._send_json({"queued": count}, 200)

    def _handle_autoclaim(self) -> None:
        """Have the chosen consumer reap stuck PEL entries into itself.

        This is the textbook ``XAUTOCLAIM`` recovery flow: each
        consumer periodically calls ``XAUTOCLAIM`` with itself as the
        target, then processes whatever was returned. The demo
        exposes it as a manual button so you can trigger the reap on
        a chosen consumer after waiting for the idle threshold.
        """
        params = self._read_form_data()
        group = params.get("group", [""])[0].strip()
        consumer = params.get("consumer", [""])[0].strip()
        if not group or not consumer:
            self._send_json({"error": "group and consumer are required"}, 400)
            return
        worker = self.demo.get_worker(group, consumer)
        if worker is None:
            self._send_json({"error": f"unknown consumer {group}/{consumer}"}, 404)
            return
        # ``reap_idle_pel`` runs XAUTOCLAIM(self) + process + ack.
        # ``deleted_ids`` are PEL entries whose stream payload was
        # already trimmed by ``MAXLEN ~`` before the sweep ran. Redis
        # 7+ removes them from the PEL inside XAUTOCLAIM itself, so
        # the caller doesn't have to XACK them; in production they
        # would be routed to a dead-letter store for offline
        # inspection.
        result = worker.reap_idle_pel()
        self._send_json(
            {
                "claimed": result["claimed"],
                "processed": result["processed"],
                "deleted": result["deleted_ids"],
                "min_idle_ms": self.stream.claim_min_idle_ms,
            },
            200,
        )

    def _handle_trim(self) -> None:
        params = self._read_form_data()
        maxlen = int(params.get("maxlen", ["0"])[0] or "0")
        deleted = self.stream.trim_maxlen(maxlen)
        self._send_json({"deleted": deleted, "maxlen": maxlen}, 200)

    def _handle_replay(self, query: dict[str, list[str]]) -> None:
        start = query.get("start", ["-"])[0] or "-"
        end = query.get("end", ["+"])[0] or "+"
        limit = max(1, min(500, int(query.get("count", ["20"])[0] or "20")))
        entries = self.stream.replay(start, end, count=limit)
        self._send_json(
            {
                "start": start,
                "end": end,
                "limit": limit,
                "entries": [
                    {"id": entry_id, "fields": fields}
                    for entry_id, fields in entries
                ],
            },
            200,
        )

    # ---- State assembly ---------------------------------------------

    def _build_state(self) -> dict:
        stream_info = self.stream.info_stream()
        groups = self.stream.info_groups()

        groups_detail = []
        pending_rows: list[dict] = []
        # Snapshot the workers dict under the demo's lock once per state
        # build so concurrent add/remove requests can't change it mid-loop.
        workers_snapshot = self.demo.workers_snapshot()
        for group in groups:
            name = group["name"]
            consumer_info = {c["name"]: c for c in self.stream.info_consumers(name)}
            consumers_detail = []
            for (g_name, c_name), worker in workers_snapshot:
                if g_name != name:
                    continue
                info = consumer_info.get(c_name, {})
                status = worker.status()
                consumers_detail.append({
                    **status,
                    "pending": info.get("pending", 0),
                    "idle_ms": info.get("idle_ms", 0),
                    "recent": worker.recent(),
                })
            # Also include consumers that exist in Redis but not in
            # our in-process registry (e.g. orphaned after a restart).
            for c_name, info in consumer_info.items():
                if not any(c["name"] == c_name for c in consumers_detail):
                    consumers_detail.append({
                        "name": c_name,
                        "group": name,
                        "processed": 0,
                        "crashed_drops": 0,
                        "paused": False,
                        "crash_queued": 0,
                        "alive": False,
                        "pending": info.get("pending", 0),
                        "idle_ms": info.get("idle_ms", 0),
                        "recent": [],
                    })
            consumers_detail.sort(key=lambda c: c["name"])
            groups_detail.append({**group, "consumers_detail": consumers_detail})

            for row in self.stream.pending_detail(name, count=50):
                pending_rows.append({**row, "group": name})

        # XREVRANGE returns the *newest* N entries (in reverse order) — the
        # tail view wants the most recent activity, not the head of history.
        tail_entries = list(self.stream.redis.xrevrange(
            self.stream.stream_key, max="+", min="-", count=10,
        ))
        tail = [
            {"id": entry_id, "fields": fields} for entry_id, fields in tail_entries
        ]

        return {
            "stream": stream_info,
            "tail": tail,
            "groups": groups_detail,
            "pending": pending_rows,
            "stats": self.stream.stats(),
        }

    # ---- HTTP plumbing ----------------------------------------------

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
            .replace("__STREAM_KEY__", self.stream.stream_key)
            .replace("__MAXLEN__", str(self.stream.maxlen_approx))
            .replace("__CLAIM_IDLE__", str(self.stream.claim_min_idle_ms))
        )


def _fake_payload() -> dict:
    return {
        "order_id": f"o-{random.randint(1000, 9999)}",
        "customer": random.choice(["alice", "bob", "carol", "dan", "erin"]),
        "amount": f"{random.uniform(5, 250):.2f}",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis streaming demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8083, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--stream-key",
        default="demo:events:orders",
        help="Redis Stream key",
    )
    parser.add_argument(
        "--maxlen",
        type=int,
        default=2000,
        help="Approximate MAXLEN cap on every XADD",
    )
    parser.add_argument(
        "--claim-idle-ms",
        type=int,
        default=5000,
        help="Minimum idle time before XAUTOCLAIM may reassign a pending entry",
    )
    parser.add_argument(
        "--no-reset",
        dest="reset_on_start",
        action="store_false",
        help=(
            "Keep any existing data at --stream-key instead of deleting it"
            " on startup. By default the demo wipes the stream so each run"
            " starts from an empty state."
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
    stream = RedisEventStream(
        redis_client=redis_client,
        stream_key=args.stream_key,
        maxlen_approx=args.maxlen,
        claim_min_idle_ms=args.claim_idle_ms,
    )
    demo = StreamingDemo(stream)
    if args.reset_on_start:
        print(
            f"Deleting any existing data at key '{args.stream_key}'"
            " for a clean demo run (pass --no-reset to keep it)."
        )
        stream.delete_stream()
    seeded = demo.seed(DEFAULT_GROUPS)

    StreamingDemoHandler.stream = stream
    StreamingDemoHandler.demo = demo

    print(f"Redis streaming demo server listening on http://{args.host}:{args.port}")
    print(
        f"Using Redis at {args.redis_host}:{args.redis_port}"
        f" with stream key '{args.stream_key}' (MAXLEN ~ {args.maxlen})"
    )
    print(f"Seeded {seeded} consumer(s) across {len(DEFAULT_GROUPS)} group(s)")

    server = ThreadingHTTPServer((args.host, args.port), StreamingDemoHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        demo.stop_all()


if __name__ == "__main__":
    main()
