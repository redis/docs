#!/usr/bin/env python3
"""
Redis cache-aside demo server.

Run this file and visit http://localhost:8080 to read records through a
Redis cache that sits in front of a deliberately slow primary store.
The page shows hit/miss counters, measured Redis latency, and a button
that fires concurrent reads at a freshly-invalidated key to demonstrate
the single-flight stampede protection in ``cache.py``.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
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

    from cache import RedisCache
    from primary import MockPrimaryStore
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


class CacheAsideDemoHandler(BaseHTTPRequestHandler):
    """Serve a small interactive page that uses Redis as a cache-aside layer."""

    cache: RedisCache | None = None
    primary: MockPrimaryStore | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/index.html"}:
            self._render_index()
            return

        if parsed.path == "/products":
            self._send_json({"products": self.primary.list_ids()}, 200)
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

        if parsed.path == "/invalidate":
            self._handle_invalidate()
            return

        if parsed.path == "/update":
            self._handle_update()
            return

        if parsed.path == "/stampede":
            self._handle_stampede()
            return

        if parsed.path == "/reset":
            self.cache.reset_stats()
            self.primary.reset_reads()
            self._send_json(self._build_stats(), 200)
            return

        self.send_error(404)

    def _render_index(self) -> None:
        self._send_html(self._html_page())

    def _handle_read(self, query: dict[str, list[str]]) -> None:
        product_id = query.get("id", [""])[0]
        if not product_id:
            self._send_json({"error": "Missing 'id' query parameter."}, 400)
            return

        started = time.perf_counter()
        record, hit, redis_ms = self.cache.get(product_id, self.primary.read)
        total_ms = (time.perf_counter() - started) * 1000.0

        if record is None:
            self._send_json({"error": f"No record for '{product_id}'."}, 404)
            return

        self._send_json(
            {
                "id": product_id,
                "record": record,
                "hit": hit,
                "redis_latency_ms": round(redis_ms, 2),
                "total_latency_ms": round(total_ms, 2),
                "ttl_remaining": self.cache.ttl_remaining(product_id),
                "stats": self._build_stats(),
            },
            200,
        )

    def _handle_invalidate(self) -> None:
        params = self._read_form_data()
        product_id = params.get("id", [""])[0]
        if not product_id:
            self._send_json({"error": "Missing 'id'."}, 400)
            return

        deleted = self.cache.invalidate(product_id)
        self._send_json(
            {"id": product_id, "deleted": deleted, "stats": self._build_stats()},
            200,
        )

    def _handle_update(self) -> None:
        params = self._read_form_data()
        product_id = params.get("id", [""])[0]
        field = params.get("field", [""])[0]
        value = params.get("value", [""])[0]
        if not product_id or not field:
            self._send_json({"error": "Missing 'id' or 'field'."}, 400)
            return

        # Cache-aside on writes: update the primary first, then invalidate
        # the cache so the next read repopulates from the new source value.
        if not self.primary.update_field(product_id, field, value):
            self._send_json({"error": "Unknown product."}, 404)
            return

        self.cache.invalidate(product_id)
        self._send_json(
            {"id": product_id, "field": field, "value": value, "stats": self._build_stats()},
            200,
        )

    def _handle_stampede(self) -> None:
        params = self._read_form_data()
        product_id = params.get("id", [""])[0]
        try:
            concurrency = max(2, min(50, int(params.get("concurrency", ["20"])[0])))
        except ValueError:
            concurrency = 20

        if not product_id:
            self._send_json({"error": "Missing 'id'."}, 400)
            return

        # Start clean so the test demonstrates a true cold-cache stampede.
        self.cache.invalidate(product_id)
        primary_reads_before = self.primary.reads()

        results: list[dict] = []
        started = time.perf_counter()
        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            futures = [
                pool.submit(self.cache.get, product_id, self.primary.read)
                for _ in range(concurrency)
            ]
            for future in futures:
                record, hit, redis_ms = future.result()
                results.append(
                    {
                        "hit": hit,
                        "redis_latency_ms": round(redis_ms, 2),
                        "found": record is not None,
                    }
                )
        elapsed_ms = (time.perf_counter() - started) * 1000.0

        primary_reads_during = self.primary.reads() - primary_reads_before

        self._send_json(
            {
                "id": product_id,
                "concurrency": concurrency,
                "primary_reads": primary_reads_during,
                "elapsed_ms": round(elapsed_ms, 2),
                "results": results,
                "stats": self._build_stats(),
            },
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
        product_options = "".join(
            f'<option value="{escape(pid)}">{escape(pid)}</option>'
            for pid in self.primary.list_ids()
        )
        primary_latency = self.primary.read_latency_ms
        cache_ttl = self.cache.ttl

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Cache-Aside Demo</title>
  <style>
    :root {{
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
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);
      min-height: 100vh;
    }}
    main {{
      max-width: 980px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }}
    h1 {{
      font-size: clamp(2.2rem, 5vw, 4rem);
      line-height: 1;
      margin-bottom: 12px;
    }}
    p.lede {{
      max-width: 52rem;
      font-size: 1.1rem;
      color: var(--muted);
    }}
    .grid {{
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      margin-top: 28px;
    }}
    .panel {{
      background: rgba(255, 250, 242, 0.92);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);
    }}
    .panel h2 {{ margin-top: 0; margin-bottom: 10px; }}
    .pill {{
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }}
    label {{ display: block; font-weight: bold; margin: 12px 0 6px; }}
    input, select {{
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #cfbca6;
      font: inherit;
      background: white;
    }}
    button {{
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
    }}
    button.secondary {{ background: #38424a; }}
    button:hover {{ background: var(--accent-dark); }}
    button.secondary:hover {{ background: #20282e; }}
    dl {{
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 14px;
      margin: 0;
    }}
    dt {{ font-weight: bold; }}
    dd {{ margin: 0; word-break: break-word; }}
    .badge {{
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }}
    .badge.hit {{ background: var(--hit); color: #1d4a2c; }}
    .badge.miss {{ background: var(--miss); color: #6b3220; }}
    pre {{
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.9rem;
    }}
    #status {{
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }}
    #status.ok {{ display: block; background: var(--ok); }}
    #status.error {{ display: block; background: var(--warn); }}
    @media (max-width: 600px) {{
      main {{ padding-top: 28px; }}
      button {{ width: 100%; }}
    }}
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-py + Python standard library HTTP server</div>
    <h1>Redis Cache-Aside Demo</h1>
    <p class="lede">
      Read product records through Redis. The first read of any key falls
      through to a deliberately slow primary store ({primary_latency} ms per
      read); subsequent reads come from Redis until the {cache_ttl}-second TTL
      expires or the entry is invalidated. The stampede test fires concurrent
      reads at a cold key to show a single-flight Lua lock funnelling them
      down to one primary read.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Read a product</h2>
        <label for="product-id">Product ID</label>
        <select id="product-id">{product_options}</select>
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

    function setStatus(message, kind) {{
      statusBox.textContent = message;
      statusBox.className = kind;
    }}

    function escapeHtml(value) {{
      return String(value).replace(/[&<>"']/g, (c) => ({{
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      }})[c]);
    }}

    function renderStats(stats) {{
      if (!stats) {{ statsView.textContent = "(no data)"; return; }}
      statsView.innerHTML = `
        <dl>
          <dt>Hits</dt><dd>${{stats.hits}}</dd>
          <dt>Misses</dt><dd>${{stats.misses}}</dd>
          <dt>Hit rate</dt><dd>${{stats.hit_rate_pct}}%</dd>
          <dt>Stampedes suppressed</dt><dd>${{stats.stampedes_suppressed}}</dd>
          <dt>Primary reads (total)</dt><dd>${{stats.primary_reads_total}}</dd>
          <dt>Primary read latency</dt><dd>${{stats.primary_read_latency_ms}} ms</dd>
        </dl>
      `;
    }}

    function renderRead(data) {{
      if (!data || !data.record) {{
        resultView.innerHTML = "<p>(no record)</p>";
        return;
      }}
      const r = data.record;
      const badge = data.hit
        ? '<span class="badge hit">cache hit</span>'
        : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = `
        <p>${{badge}} &nbsp; Redis read: <strong>${{data.redis_latency_ms}} ms</strong>
           &nbsp; Total: <strong>${{data.total_latency_ms}} ms</strong>
           &nbsp; TTL remaining: <strong>${{data.ttl_remaining}} s</strong></p>
        <dl>
          <dt>id</dt><dd>${{escapeHtml(r.id ?? "")}}</dd>
          <dt>name</dt><dd>${{escapeHtml(r.name ?? "")}}</dd>
          <dt>price_cents</dt><dd>${{escapeHtml(r.price_cents ?? "")}}</dd>
          <dt>stock</dt><dd>${{escapeHtml(r.stock ?? "")}}</dd>
        </dl>
      `;
    }}

    function renderStampede(data) {{
      const hits = data.results.filter((r) => r.hit).length;
      const misses = data.results.length - hits;
      resultView.innerHTML = `
        <p>Fired <strong>${{data.concurrency}}</strong> concurrent reads in
           <strong>${{data.elapsed_ms}} ms</strong>.</p>
        <p>Cache misses: <strong>${{misses}}</strong> &nbsp;
           Cache hits: <strong>${{hits}}</strong> &nbsp;
           Primary reads: <strong>${{data.primary_reads}}</strong></p>
        <p>With stampede protection, primary reads should be 1 even though all
           ${{data.concurrency}} callers raced for a cold key. Without it,
           every concurrent miss would query the primary independently.</p>
      `;
    }}

    async function loadStats() {{
      const response = await fetch("/stats");
      const data = await response.json();
      renderStats(data);
    }}

    document.getElementById("read-button").addEventListener("click", async () => {{
      const id = productSelect.value;
      const response = await fetch(`/read?id=${{encodeURIComponent(id)}}`);
      const data = await response.json();
      if (!response.ok) {{ setStatus(data.error || "Read failed.", "error"); return; }}
      renderRead(data);
      renderStats(data.stats);
      setStatus(data.hit ? "Served from Redis." : "Loaded from primary and cached.", "ok");
    }});

    document.getElementById("invalidate-button").addEventListener("click", async () => {{
      const id = productSelect.value;
      const body = new URLSearchParams({{ id }});
      const response = await fetch("/invalidate", {{ method: "POST", body }});
      const data = await response.json();
      renderStats(data.stats);
      setStatus(data.deleted ? "Cache key deleted." : "No cache entry to delete.", "ok");
    }});

    document.getElementById("update-button").addEventListener("click", async () => {{
      const id = productSelect.value;
      const body = new URLSearchParams({{
        id, field: updateField.value, value: updateValue.value,
      }});
      const response = await fetch("/update", {{ method: "POST", body }});
      const data = await response.json();
      if (!response.ok) {{ setStatus(data.error || "Update failed.", "error"); return; }}
      renderStats(data.stats);
      setStatus("Primary updated; cache invalidated.", "ok");
    }});

    document.getElementById("stampede-button").addEventListener("click", async () => {{
      const id = productSelect.value;
      const body = new URLSearchParams({{
        id, concurrency: stampedeConcurrency.value,
      }});
      setStatus("Running stampede test...", "ok");
      const response = await fetch("/stampede", {{ method: "POST", body }});
      const data = await response.json();
      if (!response.ok) {{ setStatus(data.error || "Test failed.", "error"); return; }}
      renderStampede(data);
      renderStats(data.stats);
      setStatus(
        `Stampede complete: ${{data.primary_reads}} primary read(s) for ${{data.concurrency}} concurrent callers.`,
        "ok",
      );
    }});

    document.getElementById("reset-button").addEventListener("click", async () => {{
      const response = await fetch("/reset", {{ method: "POST" }});
      const data = await response.json();
      renderStats(data);
      setStatus("Counters reset.", "ok");
    }});

    loadStats();
  </script>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis cache-aside demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8080, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument("--ttl", type=int, default=30, help="Cache TTL in seconds")
    parser.add_argument(
        "--primary-latency-ms",
        type=int,
        default=150,
        help="Simulated primary store read latency in milliseconds",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    CacheAsideDemoHandler.cache = RedisCache(redis_client=redis_client, ttl=args.ttl)
    CacheAsideDemoHandler.primary = MockPrimaryStore(read_latency_ms=args.primary_latency_ms)

    server = ThreadingHTTPServer((args.host, args.port), CacheAsideDemoHandler)
    print(f"Redis cache-aside demo server listening on http://{args.host}:{args.port}")
    print(f"Using Redis at {args.redis_host}:{args.redis_port} with cache TTL {args.ttl}s")
    print(f"Mock primary read latency: {args.primary_latency_ms} ms")
    server.serve_forever()


if __name__ == "__main__":
    main()
