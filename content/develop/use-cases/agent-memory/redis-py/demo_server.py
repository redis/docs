#!/usr/bin/env python3
"""
Redis agent-memory demo server.

Run this file and visit http://localhost:8086 to drive a small
agent-memory demo backed by Redis Hashes, JSON, Search, and Streams.
The UI lets you:

* Type a turn as the user (or paste a goal / scratchpad note). The
  server appends the turn to the per-thread working-memory hash,
  embeds the turn, recalls the top-k semantically nearest long-term
  memories, optionally writes the turn back as a new memory with
  write-time deduplication, and appends an event to the per-thread
  stream.
* Watch the three memory tiers update in place: working memory in
  one Hash, long-term memories as JSON documents under one index,
  and the event log in one Stream.
* Switch user, namespace, kind, and recall threshold to see how
  scoping changes which memories the agent sees.
* Inspect every long-term memory (including remaining TTL and total
  hit count) and drop individual memories to simulate eviction.

The server holds a single ``LocalEmbedder``, one ``AgentSession``
(working memory), one ``LongTermMemory`` (semantic recall + dedup),
and one ``AgentEventLog`` (event stream) for the lifetime of the
process. The first run downloads the embedding model (~80 MB) into
the local Hugging Face cache; everything after is local.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlparse

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from embeddings import LocalEmbedder
    from event_log import AgentEventLog
    from long_term_memory import LongTermMemory
    from seed_memory import seed
    from session_store import AgentSession
except ImportError as exc:
    print(f"Error: {exc}")
    print(
        "Make sure the required packages are installed:\n"
        "    pip install redis sentence-transformers numpy"
    )
    sys.exit(1)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Agent Memory Demo</title>
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
      --miss: #f1d9d9;
      --pill: #d9ebe6;
      --card: #fbfdfc;
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
    main { max-width: 1180px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 60rem; font-size: 1.05rem; color: var(--muted); }
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
    input, select, textarea {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    textarea { min-height: 64px; resize: vertical; }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small {
      padding: 5px 10px; font-size: 0.85rem; margin-top: 4px;
      border-radius: 7px;
    }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr;
         gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 120px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px;
             border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.dist { background: #e6e0f0; color: #43326a; }
    .badge.ttl { background: #e0ecf5; color: #1d3d59; }
    .badge.dedup { background: var(--warn); color: #6b3d20; }
    .badge.new { background: var(--ok); color: #1d4a2c; }
    .badge.kind-semantic { background: #dfe9f5; color: #1a3559; }
    .badge.kind-episodic { background: #f1e6d9; color: #6b4520; }
    .turn-row {
      padding: 8px 12px; margin-bottom: 6px;
      background: var(--card); border: 1px solid var(--line);
      border-radius: 10px;
    }
    .turn-row .role { font-weight: bold; color: var(--accent-dark); }
    .turn-row .ts { color: var(--muted); font-size: 0.8rem; float: right; }
    .recall-row {
      padding: 8px 12px; margin-bottom: 6px;
      background: var(--card); border: 1px solid var(--line);
      border-radius: 10px;
    }
    .recall-row .head {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 4px;
    }
    .threshold-row {
      display: flex; align-items: center; gap: 10px;
      margin-top: 10px;
    }
    .threshold-row input[type=range] { flex: 1; padding: 0; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    .empty { color: var(--muted); font-style: italic; }
  </style>
</head>
<body>
  <main>
    <div class="pill" id="stack-label">loading…</div>
    <h1>Redis Agent Memory Demo</h1>
    <p class="lede">
      A small agent memory layer spread across three Redis primitives:
      a per-thread Hash at <code>__SESSION_PREFIX__&lt;thread&gt;</code>
      for working memory, JSON documents at
      <code>__MEM_PREFIX__&lt;id&gt;</code> indexed by
      <code>__MEM_INDEX__</code> for long-term semantic recall (with
      write-time deduplication), and a Stream at
      <code>__EVENT_PREFIX__&lt;thread&gt;</code> for the time-ordered
      action log. Send a turn and watch all three update in one
      request.
    </p>

    <div class="grid">

      <section class="panel wide">
        <h2>Send a turn</h2>
        <p>The server appends the turn to working memory, recalls the
        top-k long-term memories by cosine similarity (with the
        user / namespace / kind filter applied inside
        <code>FT.SEARCH</code>), tries to write the turn back as a
        memory with deduplication against existing entries, and
        appends one event to the stream.</p>
        <label for="q-text">Turn content</label>
        <textarea id="q-text"
                  placeholder="e.g. I prefer concise answers without filler."
                  >Remind me which theme I prefer in editors.</textarea>
        <div class="row">
          <div>
            <label for="q-user">User</label>
            <input id="q-user" value="default">
          </div>
          <div>
            <label for="q-namespace">Namespace</label>
            <input id="q-namespace" value="default">
          </div>
          <div>
            <label for="q-kind">Kind to write</label>
            <select id="q-kind">
              <option value="episodic">episodic</option>
              <option value="semantic">semantic</option>
              <option value="skip">skip (recall only)</option>
            </select>
          </div>
          <div>
            <label for="q-role">Role</label>
            <select id="q-role">
              <option value="user">user</option>
              <option value="assistant">assistant</option>
              <option value="tool">tool</option>
            </select>
          </div>
        </div>
        <div class="threshold-row">
          <label for="q-threshold" style="margin: 0; min-width: 10rem;">
            Recall threshold
          </label>
          <input id="q-threshold" type="range" min="0.0" max="1.0"
                 step="0.02" value="0.55">
          <span class="mono" id="q-threshold-value">0.55</span>
        </div>
        <p class="meta" style="color: var(--muted); margin-top: 4px;">
          A memory is included in the recall result only when its
          cosine distance from the turn is at or below this
          threshold. Lower = stricter (fewer false positives);
          higher = looser (more recall, more noise).
        </p>
        <button id="send-button">Send turn</button>
        <button id="goal-button" class="secondary">Set as goal</button>
        <button id="new-thread-button" class="secondary">New thread</button>

        <h3 style="margin-top: 18px;">Last write</h3>
        <div id="last-write" class="meta">(no writes yet)</div>
      </section>

      <section class="panel">
        <h2>Working memory</h2>
        <p>The per-thread Hash. One <code>HGETALL</code> returns the
        whole session in a single round trip; the rolling turn window
        keeps the hash size bounded.</p>
        <div id="working-memory"></div>
      </section>

      <section class="panel">
        <h2>Recalled memories</h2>
        <p>Top-k long-term memories matching the last turn, scored by
        cosine distance from the turn's embedding.</p>
        <div id="recalled"></div>
      </section>

      <section class="panel">
        <h2>Event log</h2>
        <p>Most recent entries from the thread's Redis Stream.</p>
        <div id="events"></div>
      </section>

      <section class="panel">
        <h2>Index state</h2>
        <div id="index-state"></div>
        <button id="reset-button" class="danger">Clear everything and re-seed</button>
      </section>

      <section class="panel wide">
        <h2>All long-term memories</h2>
        <p>Every JSON memory document in scope for the current user
        and namespace. <code>hit_count</code> is the running total
        of times a write was deduplicated onto this memory;
        <code>ttl</code> is the remaining lifetime in seconds, or
        <code>—</code> when the memory has no TTL.</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Kind</th>
              <th>Text</th>
              <th>Hits</th>
              <th>TTL</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="memories-body"></tbody>
        </table>
      </section>

    </div>

    <div id="status"></div>
  </main>

  <script>
    const $ = sel => document.querySelector(sel);
    const status = $('#status');

    // Every value that ends up inside ``innerHTML`` flows through this
    // helper. Turn content and memory text are user input; rendering
    // them without escaping would let a turn like
    // ``<img src=x onerror=alert(1)>`` execute on every page refresh.
    function esc(value) {
      if (value == null) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function showStatus(text, kind) {
      status.textContent = text;
      status.className = kind || 'ok';
      setTimeout(() => { status.className = ''; status.textContent = ''; }, 4000);
    }

    async function postForm(path, params) {
      const body = new URLSearchParams(params || {}).toString();
      const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    }

    async function getJson(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    }

    function relativeTs(ts) {
      if (!ts) return '';
      const seconds = Math.max(0, (Date.now() / 1000) - ts);
      if (seconds < 60) return Math.round(seconds) + 's ago';
      if (seconds < 3600) return Math.round(seconds / 60) + 'm ago';
      if (seconds < 86400) return Math.round(seconds / 3600) + 'h ago';
      return Math.round(seconds / 86400) + 'd ago';
    }

    function renderWorkingMemory(session) {
      if (!session) {
        $('#working-memory').innerHTML =
          '<div class="empty">No active session. Send a turn to start one.</div>';
        return;
      }
      const turns = (session.recent_turns || []).map(t => `
        <div class="turn-row">
          <span class="ts">${esc(relativeTs(t.ts))}</span>
          <span class="role">${esc(t.role)}</span>:
          ${esc(t.content)}
        </div>
      `).join('') || '<div class="empty">(no turns yet)</div>';
      $('#working-memory').innerHTML = `
        <dl>
          <dt>Thread</dt><dd><code>${esc(session.thread_id)}</code></dd>
          <dt>User</dt><dd>${esc(session.user)}</dd>
          <dt>Goal</dt><dd>${esc(session.goal) || '<span class="empty">(none)</span>'}</dd>
          <dt>Scratchpad</dt><dd>${esc(session.scratchpad) || '<span class="empty">(empty)</span>'}</dd>
          <dt>Turn count</dt><dd>${esc(session.turn_count)}</dd>
          <dt>TTL</dt><dd>${esc(session.ttl_seconds)}s</dd>
        </dl>
        <h3>Recent turns</h3>
        ${turns}
      `;
    }

    function renderRecalled(recalled) {
      if (!recalled || recalled.length === 0) {
        $('#recalled').innerHTML =
          '<div class="empty">No memories matched the last turn under the current threshold.</div>';
        return;
      }
      $('#recalled').innerHTML = recalled.map(m => `
        <div class="recall-row">
          <div class="head">
            <span class="badge dist">distance ${esc(m.distance.toFixed(3))}</span>
            <span class="badge kind-${esc(m.kind)}">${esc(m.kind)}</span>
            ${m.ttl_seconds != null
              ? `<span class="badge ttl">ttl ${esc(m.ttl_seconds)}s</span>`
              : ''}
            <span class="meta"><code>${esc(m.id)}</code></span>
          </div>
          ${esc(m.text)}
        </div>
      `).join('');
    }

    function renderEvents(events) {
      if (!events || events.length === 0) {
        $('#events').innerHTML =
          '<div class="empty">(no events recorded yet)</div>';
        return;
      }
      $('#events').innerHTML = events.map(e => `
        <div class="turn-row">
          <span class="ts">${esc(relativeTs(e.ts))}</span>
          <span class="role">${esc(e.action)}</span>
          ${e.detail ? `: ${esc(e.detail)}` : ''}
          <div class="meta mono">${esc(e.event_id)}</div>
        </div>
      `).join('');
    }

    function renderMemoriesTable(memories) {
      const body = $('#memories-body');
      if (!memories || memories.length === 0) {
        body.innerHTML =
          '<tr><td colspan="6" class="empty">(no memories in scope)</td></tr>';
        return;
      }
      body.innerHTML = memories.map(m => `
        <tr>
          <td><code>${esc(m.id)}</code></td>
          <td><span class="badge kind-${esc(m.kind)}">${esc(m.kind)}</span></td>
          <td>${esc(m.text)}</td>
          <td>${esc(m.hit_count)}</td>
          <td>${m.ttl_seconds == null ? '—' : esc(m.ttl_seconds) + 's'}</td>
          <td>
            <button class="small danger" data-drop-id="${esc(m.id)}">Drop</button>
          </td>
        </tr>
      `).join('');
    }

    function renderIndex(info) {
      $('#index-state').innerHTML = `
        <dl>
          <dt>Memories</dt><dd>${esc(info.num_docs)}</dd>
          <dt>Memory index</dt><dd><code>${esc(info.index_name)}</code></dd>
          <dt>Indexing failures</dt><dd>${esc(info.indexing_failures)}</dd>
          <dt>Embedding model</dt><dd><code>${esc(info.model)}</code></dd>
          <dt>Session TTL</dt><dd>${esc(info.session_ttl_seconds)}s</dd>
          <dt>Dedup threshold</dt><dd>${esc(info.dedup_threshold)}</dd>
        </dl>
      `;
    }

    function renderLastWrite(payload) {
      if (!payload) {
        $('#last-write').innerHTML = '(no writes yet)';
        return;
      }
      if (payload.write_skipped) {
        $('#last-write').innerHTML =
          '<span class="meta">Memory write skipped (kind = skip).</span>';
        return;
      }
      if (payload.deduped) {
        $('#last-write').innerHTML = `
          <span class="badge dedup">deduped</span>
          existing memory <code>${esc(payload.memory_id)}</code> already
          covers this content (distance
          ${esc(payload.existing_distance.toFixed(3))} from the new turn).
        `;
        return;
      }
      $('#last-write').innerHTML = `
        <span class="badge new">new memory</span>
        wrote <code>${esc(payload.memory_id)}</code>
        as <span class="badge kind-${esc(payload.kind)}">${esc(payload.kind)}</span>
        ${payload.existing_distance != null
          ? `(nearest existing was distance ${esc(payload.existing_distance.toFixed(3))})`
          : ''}
      `;
    }

    let stateInitialised = false;
    let lastPayload = null;

    async function refreshState() {
      const user = $('#q-user').value || 'default';
      const namespace = $('#q-namespace').value || 'default';
      const state = await getJson(
        `/state?user=${encodeURIComponent(user)}&namespace=${encodeURIComponent(namespace)}`
      );
      renderIndex(state.index);
      if (!stateInitialised) {
        if (state.index.stack_label) {
          $('#stack-label').textContent = state.index.stack_label;
        }
        if (state.index.default_recall_threshold != null) {
          const slider = $('#q-threshold');
          slider.value = state.index.default_recall_threshold;
          $('#q-threshold-value').textContent =
            Number(slider.value).toFixed(2);
        }
        stateInitialised = true;
      }
      renderWorkingMemory(state.session);
      renderRecalled(lastPayload ? lastPayload.recalled : (state.recalled || []));
      renderEvents(state.events);
      renderMemoriesTable(state.memories);
    }

    async function sendTurn(actionKind) {
      const params = {
        text: $('#q-text').value,
        user: $('#q-user').value,
        namespace: $('#q-namespace').value,
        kind: $('#q-kind').value,
        role: $('#q-role').value,
        threshold: $('#q-threshold').value,
        action: actionKind,  // "turn" | "goal"
      };
      try {
        const payload = await postForm('/turn', params);
        lastPayload = payload;
        renderLastWrite(payload);
        await refreshState();
      } catch (exc) {
        showStatus('Turn failed: ' + exc.message, 'error');
      }
    }

    $('#q-threshold').addEventListener('input', () => {
      $('#q-threshold-value').textContent =
        Number($('#q-threshold').value).toFixed(2);
    });
    $('#send-button').onclick = () => sendTurn('turn');
    $('#goal-button').onclick = () => sendTurn('goal');
    $('#new-thread-button').onclick = async () => {
      try {
        await postForm('/new_thread', {
          user: $('#q-user').value,
          namespace: $('#q-namespace').value,
        });
        lastPayload = null;
        renderLastWrite(null);
        await refreshState();
        showStatus('Started a fresh thread', 'ok');
      } catch (exc) {
        showStatus('New thread failed: ' + exc.message, 'error');
      }
    };
    $('#reset-button').onclick = async () => {
      try {
        await postForm('/reset', {
          user: $('#q-user').value,
          namespace: $('#q-namespace').value,
        });
        lastPayload = null;
        renderLastWrite(null);
        await refreshState();
        showStatus('Memory cleared and re-seeded', 'ok');
      } catch (exc) {
        showStatus('Reset failed: ' + exc.message, 'error');
      }
    };

    document.body.addEventListener('click', async e => {
      const id = e.target?.dataset?.dropId;
      if (!id) return;
      try {
        await postForm('/drop_memory', {memory_id: id});
        await refreshState();
        showStatus(`Dropped ${id}`, 'ok');
      } catch (exc) {
        showStatus('Drop failed: ' + exc.message, 'error');
      }
    });

    // Re-render when user/namespace changes so the scope reflects.
    ['q-user', 'q-namespace'].forEach(id => {
      $('#' + id).addEventListener('change', refreshState);
    });

    refreshState();
  </script>
</body>
</html>
"""


class AgentMemoryDemo:
    """Demo state: working memory, long-term memory, event log."""

    def __init__(
        self,
        session_store: AgentSession,
        memory: LongTermMemory,
        event_log: AgentEventLog,
        embedder: LocalEmbedder,
        default_user: str = "default",
        default_namespace: str = "default",
    ) -> None:
        self.session_store = session_store
        self.memory = memory
        self.event_log = event_log
        self.embedder = embedder
        self.default_user = default_user
        self.default_namespace = default_namespace
        self.current_thread_id: str = session_store.new_thread_id()
        self._lock = Lock()

    def seed(self, user: str, namespace: str) -> int:
        """Drop everything in scope and pre-populate with seed memories."""
        with self._lock:
            self.memory.clear()
            self.session_store.delete(self.current_thread_id)
            self.event_log.clear(self.current_thread_id)
            written = seed(
                self.memory,
                self.embedder,
                user=user,
                namespace=namespace,
                source_thread="seed",
            )
            self.current_thread_id = self.session_store.new_thread_id()
            return written

    def new_thread(self, user: str, namespace: str) -> str:
        """Start a fresh thread. Long-term memory is unaffected."""
        with self._lock:
            self.event_log.clear(self.current_thread_id)
            self.current_thread_id = self.session_store.new_thread_id()
            self.session_store.start(
                self.current_thread_id, user=user,
                agent="demo-agent", goal="",
            )
            self.event_log.record(
                self.current_thread_id, "thread_started",
                f"user={user} namespace={namespace}",
            )
            return self.current_thread_id

    def handle_turn(
        self,
        text: str,
        user: str,
        namespace: str,
        kind: str,
        role: str,
        threshold: float,
        action: str,
    ) -> dict:
        """One pass through the agent loop: append, recall, remember, log.

        The order matters. We embed once and reuse the vector for
        both the recall and (if asked) the remember step — no point
        encoding the same text twice. Recall runs *before* the
        remember write so the agent doesn't see its own just-written
        turn as a recalled memory; some agent designs do the
        opposite, but the demo defaults to the more useful one.
        """
        thread_id = self.current_thread_id

        t0 = time.perf_counter()
        vec = self.embedder.encode_one(text)
        embed_ms = (time.perf_counter() - t0) * 1000

        # Append to working memory or update the goal/scratchpad,
        # depending on which button the user pressed.
        if action == "goal":
            self.session_store.start(
                thread_id, user=user, agent="demo-agent", goal=text,
            )
            session_action = "goal_set"
        else:
            self.session_store.append_turn(thread_id, role=role, content=text)
            session_action = f"turn_appended:{role}"

        # Recall before write.
        t1 = time.perf_counter()
        recalled = self.memory.recall(
            query_embedding=np.asarray(vec, dtype=np.float32),
            user=user,
            namespace=namespace,
            k=5,
            distance_threshold=threshold,
        )
        recall_ms = (time.perf_counter() - t1) * 1000

        # Optionally remember the turn as a long-term memory.
        write_skipped = (kind == "skip" or action == "goal")
        write_result = None
        if not write_skipped:
            t2 = time.perf_counter()
            write_result = self.memory.remember(
                text=text,
                embedding=np.asarray(vec, dtype=np.float32),
                user=user,
                namespace=namespace,
                kind=kind,
                source_thread=thread_id,
            )
            write_ms = (time.perf_counter() - t2) * 1000
        else:
            write_ms = 0.0

        # Append to event log so the audit trail shows what happened.
        if write_result is not None:
            event_detail = (
                f"deduped onto {write_result.id}"
                if write_result.deduped else f"wrote {write_result.id} as {kind}"
            )
            self.event_log.record(thread_id, session_action, event_detail)
        else:
            self.event_log.record(thread_id, session_action, "")

        return {
            "thread_id": thread_id,
            "write_skipped": write_skipped,
            "memory_id": write_result.id if write_result else None,
            "deduped": write_result.deduped if write_result else False,
            "existing_distance":
                write_result.existing_distance if write_result else None,
            "kind": kind if not write_skipped else None,
            "recalled": [m.to_dict() for m in recalled],
            "embed_ms": embed_ms,
            "recall_ms": recall_ms,
            "write_ms": write_ms,
        }


class AgentMemoryHandler(BaseHTTPRequestHandler):
    """HTTP handler. Server-state lives on class attributes."""

    session_store: AgentSession | None = None
    memory: LongTermMemory | None = None
    event_log: AgentEventLog | None = None
    embedder: LocalEmbedder | None = None
    demo: AgentMemoryDemo | None = None

    # ------------------------------------------------------------------
    # GET
    # ------------------------------------------------------------------

    def do_GET(self) -> None:
        try:
            parsed = urlparse(self.path)
            if parsed.path in {"/", "/index.html"}:
                self._send_html(self._html_page())
                return
            if parsed.path == "/state":
                params = parse_qs(parsed.query)
                user = (params.get("user", ["default"])[0]
                        or self.demo.default_user)
                namespace = (params.get("namespace", ["default"])[0]
                             or self.demo.default_namespace)
                self._send_json(self._build_state(user, namespace), 200)
                return
            self.send_error(404)
        except Exception as exc:
            self._send_error_json(exc)

    # ------------------------------------------------------------------
    # POST
    # ------------------------------------------------------------------

    def do_POST(self) -> None:
        try:
            parsed = urlparse(self.path)
            if parsed.path == "/turn":
                self._handle_turn()
                return
            if parsed.path == "/new_thread":
                self._handle_new_thread()
                return
            if parsed.path == "/reset":
                self._handle_reset()
                return
            if parsed.path == "/drop_memory":
                self._handle_drop_memory()
                return
            self.send_error(404)
        except Exception as exc:
            self._send_error_json(exc)

    def _send_error_json(self, exc: Exception) -> None:
        """Return a JSON 500 so the client's ``res.json()`` works.

        Without this wrapper, an exception in a handler escapes to
        ``BaseHTTPRequestHandler`` which writes a plain-text 500 page;
        the demo's ``fetch().then(r => r.json())`` then explodes with
        an opaque JSON parse error instead of surfacing what went wrong.
        """
        sys.stderr.write(f"[demo] handler error: {type(exc).__name__}: {exc}\n")
        try:
            self._send_json(
                {"error": str(exc), "type": type(exc).__name__}, 500,
            )
        except Exception:
            pass

    # ---- handlers ---------------------------------------------------

    def _handle_turn(self) -> None:
        params = self._read_form()
        text = params.get("text", [""])[0].strip()
        if not text:
            self._send_json({"error": "text is required"}, 400)
            return
        try:
            threshold = float(params.get("threshold", ["0.55"])[0])
        except ValueError:
            threshold = 0.55
        # ``float()`` happily parses "nan"/"inf"; either would silently
        # turn recall into "every memory" or "nothing". Clamp to the
        # meaningful cosine-distance range.
        import math
        if not math.isfinite(threshold):
            threshold = 0.55
        threshold = max(0.0, min(2.0, threshold))
        payload = self.demo.handle_turn(
            text=text,
            user=params.get("user", ["default"])[0] or "default",
            namespace=params.get("namespace", ["default"])[0] or "default",
            kind=params.get("kind", ["episodic"])[0] or "episodic",
            role=params.get("role", ["user"])[0] or "user",
            threshold=threshold,
            action=params.get("action", ["turn"])[0] or "turn",
        )
        self._send_json(payload, 200)

    def _handle_new_thread(self) -> None:
        params = self._read_form()
        thread_id = self.demo.new_thread(
            user=params.get("user", ["default"])[0] or "default",
            namespace=params.get("namespace", ["default"])[0] or "default",
        )
        self._send_json({"thread_id": thread_id}, 200)

    def _handle_reset(self) -> None:
        params = self._read_form()
        seeded = self.demo.seed(
            user=params.get("user", ["default"])[0] or "default",
            namespace=params.get("namespace", ["default"])[0] or "default",
        )
        self._send_json({"seeded": seeded}, 200)

    def _handle_drop_memory(self) -> None:
        params = self._read_form()
        memory_id = params.get("memory_id", [""])[0].strip()
        if not memory_id:
            self._send_json({"error": "memory_id is required"}, 400)
            return
        deleted = self.memory.delete_memory(memory_id)
        self._send_json({"deleted": deleted, "memory_id": memory_id}, 200)

    # ---- state assembly ---------------------------------------------

    def _build_state(self, user: str, namespace: str) -> dict:
        info = self.memory.index_info()
        info["index_name"] = self.memory.index_name
        info["model"] = self.embedder.model_name
        info["session_ttl_seconds"] = self.session_store.default_ttl_seconds
        info["dedup_threshold"] = self.memory.dedup_threshold
        info["default_recall_threshold"] = self.memory.recall_threshold
        info["stack_label"] = (
            "redis-py + sentence-transformers + "
            "Python standard library HTTP server"
        )
        thread_id = self.demo.current_thread_id
        session = self.session_store.load(thread_id)
        memories = self.memory.list_memories(
            user=user, namespace=namespace, limit=200,
        )
        events = self.event_log.recent(thread_id, count=20)
        return {
            "index": info,
            "thread_id": thread_id,
            "session": session.to_dict() if session else None,
            "memories": [m.to_dict() for m in memories],
            "events": [e.to_dict() for e in events],
            # ``recalled`` is populated by /turn; on plain /state reads
            # the UI keeps showing the last turn's result, which is
            # the useful behavior for an "agent" panel.
            "recalled": [],
        }

    # ---- HTTP plumbing ----------------------------------------------

    def _read_form(self) -> dict[str, list[str]]:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else ""
        return parse_qs(raw)

    def _send_html(self, html: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def _send_json(self, payload: dict, status: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload, default=_json_default).encode("utf-8"))

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stderr.write(f"[demo] {format % args}\n")

    def _html_page(self) -> str:
        return (
            HTML_TEMPLATE
            .replace("__SESSION_PREFIX__", self.session_store.key_prefix)
            .replace("__MEM_PREFIX__", self.memory.key_prefix)
            .replace("__MEM_INDEX__", self.memory.index_name)
            .replace("__EVENT_PREFIX__", self.event_log.key_prefix)
        )


def _json_default(value):
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    raise TypeError(f"unserializable: {type(value).__name__}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the Redis agent-memory demo server.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8086, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--mem-index-name", default="agentmem:idx",
        help="Redis Search index name for long-term memories",
    )
    parser.add_argument(
        "--mem-key-prefix", default="agent:mem:",
        help="JSON key prefix for long-term memories",
    )
    parser.add_argument(
        "--session-key-prefix", default="agent:session:",
        help="Hash key prefix for working memory",
    )
    parser.add_argument(
        "--event-key-prefix", default="agent:events:",
        help="Stream key prefix for the agent event log",
    )
    parser.add_argument(
        "--session-ttl-seconds", type=int, default=3600,
        help="TTL applied to working-memory hashes on every write",
    )
    parser.add_argument(
        "--dedup-threshold", type=float, default=0.20,
        help="Cosine-distance threshold for write-time deduplication",
    )
    parser.add_argument(
        "--recall-threshold", type=float, default=0.55,
        help="Default cosine-distance threshold for recall results",
    )
    parser.add_argument(
        "--no-reset", dest="reset_on_start", action="store_false",
        help=(
            "Keep any existing memories instead of dropping and re-seeding"
            " on startup."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=False,
    )
    try:
        redis_client.ping()
    except redis.ConnectionError as exc:
        print(f"Error: cannot reach Redis at {args.redis_host}:{args.redis_port}")
        print(f"  ({exc})")
        sys.exit(1)

    session_store = AgentSession(
        redis_client=redis_client,
        key_prefix=args.session_key_prefix,
        default_ttl_seconds=args.session_ttl_seconds,
    )
    memory = LongTermMemory(
        redis_client=redis_client,
        index_name=args.mem_index_name,
        key_prefix=args.mem_key_prefix,
        dedup_threshold=args.dedup_threshold,
        recall_threshold=args.recall_threshold,
    )
    memory.create_index()
    event_log = AgentEventLog(
        redis_client=redis_client,
        key_prefix=args.event_key_prefix,
    )

    print("Loading embedding model (first run downloads ~80 MB)...")
    embedder = LocalEmbedder()

    demo = AgentMemoryDemo(
        session_store=session_store,
        memory=memory,
        event_log=event_log,
        embedder=embedder,
    )

    if args.reset_on_start:
        print(
            f"Dropping any existing memories under '{args.mem_key_prefix}*' and"
            " re-seeding from the sample memory list (pass --no-reset to keep)."
        )
        seeded = demo.seed(user="default", namespace="default")
        print(f"Seeded {seeded} memories.")

    AgentMemoryHandler.session_store = session_store
    AgentMemoryHandler.memory = memory
    AgentMemoryHandler.event_log = event_log
    AgentMemoryHandler.embedder = embedder
    AgentMemoryHandler.demo = demo

    print(
        f"Redis agent memory demo listening on "
        f"http://{args.host}:{args.port}"
    )
    print(
        f"Using Redis at {args.redis_host}:{args.redis_port}"
        f" with memory index '{args.mem_index_name}'"
    )

    server = ThreadingHTTPServer((args.host, args.port), AgentMemoryHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
