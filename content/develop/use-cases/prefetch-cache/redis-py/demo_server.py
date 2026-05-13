#!/usr/bin/env python3
"""
Redis prefetch-cache demo server.

Run this file and visit http://localhost:8082 to watch a prefetch cache
in action: the demo bulk-loads every primary record into Redis on
startup, runs a background sync worker that applies primary mutations
within milliseconds, and lets you add, update, delete, and re-prefetch
records to see how the cache stays current without ever falling back to
the primary on the read path.
"""

from __future__ import annotations

import argparse
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import time
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from cache import PrefetchCache
    from primary import MockPrimaryStore
    from sync_worker import SyncWorker
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Prefetch Cache Demo</title>
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
    main { max-width: 980px; margin: 0 auto; padding: 48px 20px 72px; }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 52rem; font-size: 1.1rem; color: var(--muted); }
    .grid {
      display: grid; gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
      display: inline-block; border-radius: 999px;
      background: #efe2cf; color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.9rem; margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%; padding: 10px 12px;
      border-radius: 10px; border: 1px solid #cfbca6;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 11px 18px; font: inherit; cursor: pointer;
      margin-right: 8px; margin-top: 12px;
    }
    button.secondary { background: #38424a; }
    button.danger { background: #8a3a3a; }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    button.danger:hover { background: #6b2929; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 3px 8px; font-size: 0.85rem; font-weight: bold;
    }
    .badge.hit { background: var(--hit); color: #1d4a2c; }
    .badge.miss { background: var(--miss); color: #6b3220; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 120px; }
    #status {
      margin-top: 20px; padding: 14px 16px;
      border-radius: 14px; display: none;
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
    <div class="pill">redis-py + Python standard library HTTP server</div>
    <h1>Redis Prefetch Cache Demo</h1>
    <p class="lede">
      Every record from the primary store has been pre-loaded into Redis.
      Reads run <code>HGETALL</code> against Redis only &mdash; there is no
      fall-back to the primary on the read path. When you add, update, or
      delete a record, the primary emits a change event that a background
      sync worker applies to Redis within a few milliseconds. A long
      safety-net TTL (__CACHE_TTL__ s) is refreshed on every sync event
      and bounds memory if sync ever stops.
    </p>

    <div class="grid">
      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Cache state</h2>
        <div id="state-view">Loading...</div>
        <button id="refresh-state">Refresh state</button>
      </section>

      <section class="panel">
        <h2>Read a category</h2>
        <p>Reads come from Redis only. Every read should be a hit because
        the cache was pre-loaded and the sync worker keeps it current.</p>
        <label for="read-id">Category ID</label>
        <select id="read-id"></select>
        <button id="read-button">Read from cache</button>
      </section>

      <section class="panel">
        <h2>Update a field</h2>
        <p>Updates write to the primary. The sync worker picks up the
        change event and rewrites the cache hash within milliseconds.</p>
        <label for="update-id">Category</label>
        <select id="update-id"></select>
        <label for="update-field">Field</label>
        <select id="update-field">
          <option value="name">name</option>
          <option value="display_order">display_order</option>
          <option value="featured">featured</option>
          <option value="parent_id">parent_id</option>
        </select>
        <label for="update-value">New value</label>
        <input id="update-value" value="true">
        <button id="update-button">Apply update</button>
      </section>

      <section class="panel">
        <h2>Add a category</h2>
        <p>Inserts to the primary propagate to the cache through the same
        sync path.</p>
        <label for="add-id">ID</label>
        <input id="add-id" value="cat-006">
        <label for="add-name">Name</label>
        <input id="add-name" value="Seasonal">
        <label for="add-display-order">Display order</label>
        <input id="add-display-order" value="6">
        <button id="add-button">Add to primary</button>
      </section>

      <section class="panel">
        <h2>Delete a category</h2>
        <p>Deletes remove the record from the primary, and the sync worker
        removes the cache entry.</p>
        <label for="delete-id">Category</label>
        <select id="delete-id"></select>
        <button id="delete-button" class="danger">Delete from primary</button>
      </section>

      <section class="panel">
        <h2>Break the cache</h2>
        <p>Simulate a failure of the sync pipeline. Reads against the
        affected key(s) return a miss until you re-prefetch.</p>
        <label for="invalidate-id">Category</label>
        <select id="invalidate-id"></select>
        <div class="row">
          <button id="invalidate-button" class="secondary">Invalidate one</button>
          <button id="clear-button" class="danger">Clear all</button>
        </div>
        <button id="reprefetch-button">Re-prefetch from primary</button>
      </section>

      <section class="panel">
        <h2>Cache stats</h2>
        <div id="stats-view">Loading...</div>
        <button id="reset-button" class="secondary">Reset counters</button>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Last result</h2>
        <div id="result-view"><p>Read a category to see the cached record and timing.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const stateView = document.getElementById("state-view");
    const readIdSelect = document.getElementById("read-id");
    const updateIdSelect = document.getElementById("update-id");
    const updateField = document.getElementById("update-field");
    const updateValue = document.getElementById("update-value");
    const addId = document.getElementById("add-id");
    const addName = document.getElementById("add-name");
    const addDisplayOrder = document.getElementById("add-display-order");
    const deleteIdSelect = document.getElementById("delete-id");
    const invalidateIdSelect = document.getElementById("invalidate-id");
    const statsView = document.getElementById("stats-view");
    const resultView = document.getElementById("result-view");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderState(data) {
      const cacheIds = data.cache_ids || [];
      const primaryIds = data.primary_ids || [];
      const missing = primaryIds.filter((id) => !cacheIds.includes(id));
      const orphaned = cacheIds.filter((id) => !primaryIds.includes(id));
      stateView.innerHTML = `
        <dl>
          <dt>In cache</dt><dd>${cacheIds.length} (${cacheIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
          <dt>In primary</dt><dd>${primaryIds.length} (${primaryIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
          <dt>Missing from cache</dt><dd>${missing.length ? missing.map(escapeHtml).join(", ") : "none"}</dd>
          <dt>Orphaned in cache</dt><dd>${orphaned.length ? orphaned.map(escapeHtml).join(", ") : "none"}</dd>
        </dl>`;
      const select = (el, ids) => {
        const previous = el.value;
        el.innerHTML = ids.map((id) =>
          `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join("");
        if (ids.includes(previous)) el.value = previous;
      };
      select(readIdSelect, cacheIds.length ? cacheIds : primaryIds);
      select(updateIdSelect, primaryIds);
      select(deleteIdSelect, primaryIds);
      select(invalidateIdSelect, cacheIds);
    }

    function renderStats(stats) {
      if (!stats) { statsView.textContent = "(no data)"; return; }
      statsView.innerHTML = `
        <dl>
          <dt>Hits</dt><dd>${stats.hits}</dd>
          <dt>Misses</dt><dd>${stats.misses}</dd>
          <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
          <dt>Prefetched</dt><dd>${stats.prefetched}</dd>
          <dt>Sync events applied</dt><dd>${stats.sync_events_applied}</dd>
          <dt>Avg sync lag</dt><dd>${stats.sync_lag_ms_avg} ms</dd>
          <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
        </dl>`;
    }

    function renderRead(data) {
      if (!data || !data.record) {
        resultView.innerHTML = `<p><span class="badge miss">cache miss</span> &nbsp;
          No entry in Redis for <strong>${escapeHtml(data.id)}</strong>.</p>
          <p>With a healthy prefetch and sync, this should never happen on
          a valid id &mdash; it means either the sync pipeline is behind
          or the entry has been invalidated.</p>`;
        return;
      }
      const r = data.record;
      const badge = data.hit
        ? '<span class="badge hit">cache hit</span>'
        : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = `
        <p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
           &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
          <dt>display_order</dt><dd>${escapeHtml(r.display_order ?? "")}</dd>
          <dt>featured</dt><dd>${escapeHtml(r.featured ?? "")}</dd>
          <dt>parent_id</dt><dd>${escapeHtml(r.parent_id ?? "")}</dd>
        </dl>`;
    }

    async function loadState() {
      const [state, stats] = await Promise.all([
        fetch("/categories").then((r) => r.json()),
        fetch("/stats").then((r) => r.json()),
      ]);
      renderState(state);
      renderStats(stats);
    }

    async function refreshAfter(message, kind, payload) {
      if (payload && payload.stats) renderStats(payload.stats);
      await loadState();
      setStatus(message, kind);
    }

    document.getElementById("refresh-state").addEventListener("click", loadState);

    document.getElementById("read-button").addEventListener("click", async () => {
      const id = readIdSelect.value;
      if (!id) { setStatus("No id selected.", "error"); return; }
      const r = await fetch(`/read?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      renderRead(d);
      if (d.stats) renderStats(d.stats);
      setStatus(d.hit ? "Served from Redis." : "Cache miss &mdash; no entry in Redis.", d.hit ? "ok" : "error");
    });

    document.getElementById("update-button").addEventListener("click", async () => {
      const id = updateIdSelect.value;
      const body = new URLSearchParams({ id, field: updateField.value, value: updateValue.value });
      const r = await fetch("/update", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
      refreshAfter("Primary updated; sync worker will apply the change to Redis.", "ok", d);
    });

    document.getElementById("add-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        id: addId.value,
        name: addName.value,
        display_order: addDisplayOrder.value,
        featured: "false",
        parent_id: "",
      });
      const r = await fetch("/add", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
      refreshAfter("Added to primary; sync worker will populate the cache.", "ok", d);
    });

    document.getElementById("delete-button").addEventListener("click", async () => {
      const id = deleteIdSelect.value;
      const body = new URLSearchParams({ id });
      const r = await fetch("/delete", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Delete failed.", "error"); return; }
      refreshAfter("Deleted from primary; sync worker will remove the cache entry.", "ok", d);
    });

    document.getElementById("invalidate-button").addEventListener("click", async () => {
      const id = invalidateIdSelect.value;
      if (!id) { setStatus("Nothing in the cache to invalidate.", "error"); return; }
      const body = new URLSearchParams({ id });
      const r = await fetch("/invalidate", { method: "POST", body });
      const d = await r.json();
      refreshAfter(d.deleted ? `Cache entry for ${id} deleted.` : "No cache entry to delete.", "ok", d);
    });

    document.getElementById("clear-button").addEventListener("click", async () => {
      const r = await fetch("/clear", { method: "POST" });
      const d = await r.json();
      refreshAfter(`Cleared ${d.deleted} cache entries. Reads will miss until you re-prefetch.`, "ok", d);
    });

    document.getElementById("reprefetch-button").addEventListener("click", async () => {
      setStatus("Re-prefetching all records...", "ok");
      const r = await fetch("/reprefetch", { method: "POST" });
      const d = await r.json();
      refreshAfter(`Re-prefetched ${d.loaded} records in ${d.elapsed_ms} ms.`, "ok", d);
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      renderStats(d);
      setStatus("Counters reset.", "ok");
    });

    loadState();
  </script>
</body>
</html>
"""


class PrefetchCacheDemoHandler(BaseHTTPRequestHandler):
    """Serve the prefetch-cache demo UI and JSON endpoints."""

    cache: PrefetchCache | None = None
    primary: MockPrimaryStore | None = None
    sync: SyncWorker | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return
        if parsed.path == "/categories":
            self._send_json(
                {
                    "cache_ids": self.cache.ids(),
                    "primary_ids": self.primary.list_ids(),
                },
                200,
            )
            return
        if parsed.path == "/read":
            self._handle_read(parse_qs(parsed.query))
            return
        if parsed.path == "/stats":
            self._send_json(self._build_stats(), 200)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/update":
            self._handle_update()
            return
        if parsed.path == "/add":
            self._handle_add()
            return
        if parsed.path == "/delete":
            self._handle_delete()
            return
        if parsed.path == "/invalidate":
            self._handle_invalidate()
            return
        if parsed.path == "/clear":
            deleted = self.cache.clear()
            self._send_json({"deleted": deleted, "stats": self._build_stats()}, 200)
            return
        if parsed.path == "/reprefetch":
            started = time.perf_counter()
            self.cache.clear()
            loaded = self.cache.bulk_load(self.primary.list_records())
            elapsed = (time.perf_counter() - started) * 1000.0
            self._send_json(
                {"loaded": loaded, "elapsed_ms": round(elapsed, 2), "stats": self._build_stats()},
                200,
            )
            return
        if parsed.path == "/reset":
            self.cache.reset_stats()
            self.primary.reset_reads()
            self._send_json(self._build_stats(), 200)
            return
        self.send_error(404)

    def _handle_read(self, query: dict[str, list[str]]) -> None:
        entity_id = query.get("id", [""])[0]
        if not entity_id:
            self._send_json({"error": "Missing 'id'."}, 400)
            return
        record, hit, redis_ms = self.cache.get(entity_id)
        self._send_json(
            {
                "id": entity_id,
                "record": record,
                "hit": hit,
                "redis_latency_ms": round(redis_ms, 2),
                "ttl_remaining": self.cache.ttl_remaining(entity_id),
                "stats": self._build_stats(),
            },
            200,
        )

    def _handle_update(self) -> None:
        params = self._read_form_data()
        entity_id = params.get("id", [""])[0]
        field = params.get("field", [""])[0]
        value = params.get("value", [""])[0]
        if not entity_id or not field:
            self._send_json({"error": "Missing 'id' or 'field'."}, 400)
            return
        if not self.primary.update_field(entity_id, field, value):
            self._send_json({"error": f"Unknown category '{entity_id}'."}, 404)
            return
        self._send_json(
            {"id": entity_id, "field": field, "value": value, "stats": self._build_stats()},
            200,
        )

    def _handle_add(self) -> None:
        params = self._read_form_data()
        entity_id = params.get("id", [""])[0].strip()
        name = params.get("name", [""])[0].strip()
        if not entity_id or not name:
            self._send_json({"error": "Missing 'id' or 'name'."}, 400)
            return
        record = {
            "id": entity_id,
            "name": name,
            "display_order": params.get("display_order", ["99"])[0] or "99",
            "featured": params.get("featured", ["false"])[0] or "false",
            "parent_id": params.get("parent_id", [""])[0] or "",
        }
        if not self.primary.add_record(record):
            self._send_json({"error": f"Category '{entity_id}' already exists."}, 409)
            return
        self._send_json({"id": entity_id, "record": record, "stats": self._build_stats()}, 200)

    def _handle_delete(self) -> None:
        params = self._read_form_data()
        entity_id = params.get("id", [""])[0]
        if not entity_id:
            self._send_json({"error": "Missing 'id'."}, 400)
            return
        if not self.primary.delete_record(entity_id):
            self._send_json({"error": f"Unknown category '{entity_id}'."}, 404)
            return
        self._send_json({"id": entity_id, "stats": self._build_stats()}, 200)

    def _handle_invalidate(self) -> None:
        params = self._read_form_data()
        entity_id = params.get("id", [""])[0]
        if not entity_id:
            self._send_json({"error": "Missing 'id'."}, 400)
            return
        deleted = self.cache.invalidate(entity_id)
        self._send_json(
            {"id": entity_id, "deleted": deleted, "stats": self._build_stats()},
            200,
        )

    def _build_stats(self) -> dict:
        stats = self.cache.stats()
        stats["primary_reads_total"] = self.primary.reads()
        stats["primary_read_latency_ms"] = self.primary.read_latency_ms
        return stats

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
        return HTML_TEMPLATE.replace("__CACHE_TTL__", str(self.cache.ttl_seconds))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis prefetch-cache demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8082, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument("--cache-prefix", default="cache:category:", help="Cache key prefix")
    parser.add_argument(
        "--ttl-seconds",
        type=int,
        default=3600,
        help="Safety-net TTL in seconds (refreshed on every sync event)",
    )
    parser.add_argument(
        "--primary-latency-ms",
        type=int,
        default=80,
        help="Simulated primary read latency (only affects bulk loads and reconciliations)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    cache = PrefetchCache(
        redis_client=redis_client,
        prefix=args.cache_prefix,
        ttl_seconds=args.ttl_seconds,
    )
    primary = MockPrimaryStore(read_latency_ms=args.primary_latency_ms)
    sync = SyncWorker(primary=primary, cache=cache)

    started = time.perf_counter()
    cache.clear()
    loaded = cache.bulk_load(primary.list_records())
    elapsed_ms = (time.perf_counter() - started) * 1000.0
    sync.start()

    PrefetchCacheDemoHandler.cache = cache
    PrefetchCacheDemoHandler.primary = primary
    PrefetchCacheDemoHandler.sync = sync

    print(f"Redis prefetch-cache demo server listening on http://{args.host}:{args.port}")
    print(
        f"Using Redis at {args.redis_host}:{args.redis_port}"
        f" with cache prefix '{args.cache_prefix}' and TTL {args.ttl_seconds}s"
    )
    print(f"Prefetched {loaded} records in {elapsed_ms:.1f} ms; sync worker running")

    server = ThreadingHTTPServer((args.host, args.port), PrefetchCacheDemoHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        sync.stop()


if __name__ == "__main__":
    main()
