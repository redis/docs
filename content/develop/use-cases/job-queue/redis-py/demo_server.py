#!/usr/bin/env python3
"""
Redis job-queue demo server.

Run this file and visit http://localhost:8090 to enqueue jobs, watch a
pool of workers drain the queue, simulate worker crashes, and trigger a
reclaim sweep that pulls timed-out jobs back to pending.
"""

from __future__ import annotations

import argparse
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
import time
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from job_queue import RedisJobQueue
    from worker import WorkerPool
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


class JobQueueDemoHandler(BaseHTTPRequestHandler):
    """Serve the job-queue demo UI and JSON endpoints."""

    queue: RedisJobQueue | None = None
    pool: WorkerPool | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return

        if parsed.path == "/jobs":
            self._send_json(self._build_jobs(), 200)
            return

        if parsed.path == "/stats":
            self._send_json(self._build_stats(), 200)
            return

        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/enqueue":
            self._handle_enqueue()
            return

        if parsed.path == "/workers/start":
            self._handle_workers_start()
            return

        if parsed.path == "/workers/stop":
            self._handle_workers_stop()
            return

        if parsed.path == "/workers/configure":
            self._handle_workers_configure()
            return

        if parsed.path == "/reclaim":
            reclaimed = self.queue.reclaim_stuck()
            self._send_json(
                {"reclaimed": reclaimed, "stats": self._build_stats()},
                200,
            )
            return

        if parsed.path == "/reset":
            self.pool.stop()
            time.sleep(0.1)
            self.queue.purge()
            self._send_json({"stats": self._build_stats()}, 200)
            return

        self.send_error(404)

    def _handle_enqueue(self) -> None:
        params = self._read_form_data()
        kind = params.get("kind", ["email"])[0]
        recipient = params.get("recipient", [""])[0] or "user@example.com"
        try:
            count = max(1, min(50, int(params.get("count", ["1"])[0])))
        except ValueError:
            count = 1

        ids: list[str] = []
        for index in range(count):
            payload = {
                "kind": kind,
                "recipient": recipient,
                "n": index + 1,
            }
            ids.append(self.queue.enqueue(payload))

        self._send_json(
            {"enqueued": ids, "stats": self._build_stats()},
            200,
        )

    def _handle_workers_start(self) -> None:
        params = self._read_form_data()
        try:
            size = max(0, min(8, int(params.get("size", ["2"])[0])))
        except ValueError:
            size = 2
        try:
            work_latency_ms = max(0, int(params.get("work_latency_ms", ["400"])[0]))
        except ValueError:
            work_latency_ms = 400
        try:
            fail_rate = max(0.0, min(1.0, float(params.get("fail_rate", ["0"])[0])))
        except ValueError:
            fail_rate = 0.0
        try:
            hang_rate = max(0.0, min(1.0, float(params.get("hang_rate", ["0"])[0])))
        except ValueError:
            hang_rate = 0.0

        self.pool.configure(
            work_latency_ms=work_latency_ms,
            fail_rate=fail_rate,
            hang_rate=hang_rate,
        )
        self.pool.resize(size)
        self.pool.start()
        self._send_json(self._build_stats(), 200)

    def _handle_workers_stop(self) -> None:
        self.pool.stop()
        self._send_json(self._build_stats(), 200)

    def _handle_workers_configure(self) -> None:
        params = self._read_form_data()
        kwargs: dict = {}
        if "work_latency_ms" in params:
            try:
                kwargs["work_latency_ms"] = int(params["work_latency_ms"][0])
            except ValueError:
                pass
        if "fail_rate" in params:
            try:
                kwargs["fail_rate"] = float(params["fail_rate"][0])
            except ValueError:
                pass
        if "hang_rate" in params:
            try:
                kwargs["hang_rate"] = float(params["hang_rate"][0])
            except ValueError:
                pass
        self.pool.configure(**kwargs)
        self._send_json(self._build_stats(), 200)

    def _build_jobs(self) -> dict:
        pending_ids = self.queue.list_pending()
        processing_ids = self.queue.list_processing()
        completed_ids = self.queue.list_completed()[:10]
        failed_ids = self.queue.list_failed()[:10]
        return {
            "pending": [self._summarize_job(jid) for jid in pending_ids],
            "processing": [self._summarize_job(jid) for jid in processing_ids],
            "completed": [self._summarize_job(jid) for jid in completed_ids],
            "failed": [self._summarize_job(jid) for jid in failed_ids],
        }

    def _summarize_job(self, job_id: str) -> dict:
        meta = self.queue.get_job(job_id) or {}
        return {
            "id": job_id,
            "status": meta.get("status", "unknown"),
            "attempts": int(meta.get("attempts", 0) or 0),
            "payload": meta.get("payload", {}),
            "result": meta.get("result"),
            "last_error": meta.get("last_error"),
        }

    def _build_stats(self) -> dict:
        stats = self.queue.stats()
        stats["workers_running"] = self.pool.running()
        stats["worker_processed_total"] = self.pool.total_processed()
        stats["work_latency_ms"] = self.pool.work_latency_ms
        stats["fail_rate"] = self.pool.fail_rate
        stats["hang_rate"] = self.pool.hang_rate
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
        self.wfile.write(json.dumps(payload, default=str).encode("utf-8"))

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stderr.write(f"[demo] {format % args}\n")

    def _html_page(self) -> str:
        visibility_ms = self.queue.visibility_ms
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Job Queue Demo</title>
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
      max-width: 1080px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }}
    h1 {{ font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }}
    p.lede {{ max-width: 56rem; font-size: 1.05rem; color: var(--muted); }}
    .grid {{
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
    dl {{ display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }}
    dt {{ font-weight: bold; }}
    dd {{ margin: 0; word-break: break-word; }}
    .badge {{
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }}
    .badge.pending {{ background: #f4e4c1; color: #5e4514; }}
    .badge.processing {{ background: var(--miss); color: #6b3220; }}
    .badge.completed {{ background: var(--hit); color: #1d4a2c; }}
    .badge.failed {{ background: #f0c2bc; color: #6b1f1c; }}
    .job-list {{ list-style: none; padding: 0; margin: 8px 0 0; max-height: 230px; overflow-y: auto; }}
    .job-list li {{
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 6px;
      background: #fffdf8;
      font-size: 0.92rem;
    }}
    .job-list li .meta {{ color: var(--muted); font-size: 0.85rem; }}
    pre {{
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
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
    <h1>Redis Job Queue Demo</h1>
    <p class="lede">
      Enqueue background jobs and watch a pool of workers drain them through Redis.
      Pending jobs sit in a list; each worker uses <code>BRPOPLPUSH</code> to atomically
      claim a job and move it to a processing list. Completed jobs move to a short
      history. If a worker hangs past the {visibility_ms} ms visibility timeout,
      the reclaimer moves its job back to pending so no work is lost.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Enqueue jobs</h2>
        <label for="job-kind">Kind</label>
        <select id="job-kind">
          <option value="email">email</option>
          <option value="webhook">webhook</option>
          <option value="thumbnail">thumbnail</option>
          <option value="invoice">invoice</option>
        </select>
        <label for="job-recipient">Recipient / target</label>
        <input id="job-recipient" value="user@example.com">
        <label for="job-count">How many</label>
        <input id="job-count" type="number" value="5" min="1" max="50">
        <button id="enqueue-button">Enqueue</button>
      </section>

      <section class="panel">
        <h2>Worker pool</h2>
        <label for="worker-size">Workers</label>
        <input id="worker-size" type="number" value="2" min="0" max="8">
        <label for="work-latency">Work latency (ms)</label>
        <input id="work-latency" type="number" value="400" min="0" max="5000">
        <label for="fail-rate">Failure rate (0–1)</label>
        <input id="fail-rate" type="number" step="0.05" min="0" max="1" value="0">
        <label for="hang-rate">Hang rate (simulated crash)</label>
        <input id="hang-rate" type="number" step="0.05" min="0" max="1" value="0">
        <button id="start-button">Start / apply</button>
        <button id="stop-button" class="secondary">Stop workers</button>
      </section>

      <section class="panel">
        <h2>Reclaim &amp; reset</h2>
        <p>Reclaim moves any job sitting in the processing list past the
        {visibility_ms} ms visibility timeout back to pending.</p>
        <button id="reclaim-button">Run reclaim sweep</button>
        <button id="reset-button" class="secondary">Reset queue</button>
      </section>

      <section class="panel">
        <h2>Queue stats</h2>
        <div id="stats-view">Loading...</div>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Pending <span id="pending-count" class="badge pending">0</span></h2>
        <ul id="pending-list" class="job-list"></ul>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Processing <span id="processing-count" class="badge processing">0</span></h2>
        <ul id="processing-list" class="job-list"></ul>
      </section>

      <section class="panel">
        <h2>Recent completed <span id="completed-count" class="badge completed">0</span></h2>
        <ul id="completed-list" class="job-list"></ul>
      </section>

      <section class="panel">
        <h2>Recent failed <span id="failed-count" class="badge failed">0</span></h2>
        <ul id="failed-list" class="job-list"></ul>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {{
      statusBox.textContent = message;
      statusBox.className = kind;
    }}

    function escapeHtml(value) {{
      return String(value ?? "").replace(/[&<>"']/g, (c) => ({{
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      }})[c]);
    }}

    function renderStats(stats) {{
      const view = document.getElementById("stats-view");
      if (!stats) {{ view.textContent = "(no data)"; return; }}
      view.innerHTML = `
        <dl>
          <dt>Workers running</dt><dd>${{stats.workers_running}}</dd>
          <dt>Pending depth</dt><dd>${{stats.pending_depth}}</dd>
          <dt>Processing depth</dt><dd>${{stats.processing_depth}}</dd>
          <dt>Enqueued total</dt><dd>${{stats.enqueued_total}}</dd>
          <dt>Completed total</dt><dd>${{stats.completed_total}}</dd>
          <dt>Failed total</dt><dd>${{stats.failed_total}}</dd>
          <dt>Reclaimed total</dt><dd>${{stats.reclaimed_total}}</dd>
          <dt>Worker processed</dt><dd>${{stats.worker_processed_total}}</dd>
          <dt>Visibility timeout</dt><dd>${{stats.visibility_ms}} ms</dd>
          <dt>Work latency</dt><dd>${{stats.work_latency_ms}} ms</dd>
          <dt>Failure rate</dt><dd>${{stats.fail_rate}}</dd>
          <dt>Hang rate</dt><dd>${{stats.hang_rate}}</dd>
        </dl>
      `;
    }}

    function renderJobList(elementId, jobs, countId, badgeClass) {{
      const list = document.getElementById(elementId);
      const count = document.getElementById(countId);
      count.textContent = jobs.length;
      count.className = `badge ${{badgeClass}}`;
      if (!jobs.length) {{ list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }}
      list.innerHTML = jobs.map((job) => {{
        const payload = job.payload && typeof job.payload === "object"
          ? JSON.stringify(job.payload)
          : escapeHtml(job.payload || "");
        const extra = job.last_error
          ? ` &middot; <span class=meta>error: ${{escapeHtml(job.last_error)}}</span>`
          : job.result
            ? ` &middot; <span class=meta>result: ${{escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}}</span>`
            : "";
        return `<li>
          <strong>${{escapeHtml(job.id)}}</strong>
          <span class=badge ${{badgeClass}}>${{escapeHtml(job.status)}}</span>
          <span class=meta>attempts: ${{job.attempts}}</span>
          ${{extra}}
          <div class=meta>${{escapeHtml(payload)}}</div>
        </li>`;
      }}).join("");
    }}

    async function refresh() {{
      const [jobsResponse, statsResponse] = await Promise.all([
        fetch("/jobs"),
        fetch("/stats"),
      ]);
      const jobs = await jobsResponse.json();
      const stats = await statsResponse.json();
      renderStats(stats);
      renderJobList("pending-list", jobs.pending, "pending-count", "pending");
      renderJobList("processing-list", jobs.processing, "processing-count", "processing");
      renderJobList("completed-list", jobs.completed, "completed-count", "completed");
      renderJobList("failed-list", jobs.failed, "failed-count", "failed");
    }}

    document.getElementById("enqueue-button").addEventListener("click", async () => {{
      const body = new URLSearchParams({{
        kind: document.getElementById("job-kind").value,
        recipient: document.getElementById("job-recipient").value,
        count: document.getElementById("job-count").value,
      }});
      const response = await fetch("/enqueue", {{ method: "POST", body }});
      const data = await response.json();
      if (!response.ok) {{ setStatus(data.error || "Enqueue failed.", "error"); return; }}
      setStatus(`Enqueued ${{data.enqueued.length}} job(s).`, "ok");
      refresh();
    }});

    document.getElementById("start-button").addEventListener("click", async () => {{
      const body = new URLSearchParams({{
        size: document.getElementById("worker-size").value,
        work_latency_ms: document.getElementById("work-latency").value,
        fail_rate: document.getElementById("fail-rate").value,
        hang_rate: document.getElementById("hang-rate").value,
      }});
      await fetch("/workers/start", {{ method: "POST", body }});
      setStatus("Workers started.", "ok");
      refresh();
    }});

    document.getElementById("stop-button").addEventListener("click", async () => {{
      await fetch("/workers/stop", {{ method: "POST" }});
      setStatus("Workers stopped.", "ok");
      refresh();
    }});

    document.getElementById("reclaim-button").addEventListener("click", async () => {{
      const response = await fetch("/reclaim", {{ method: "POST" }});
      const data = await response.json();
      setStatus(`Reclaimed ${{data.reclaimed.length}} job(s).`, "ok");
      refresh();
    }});

    document.getElementById("reset-button").addEventListener("click", async () => {{
      await fetch("/reset", {{ method: "POST" }});
      setStatus("Queue reset.", "ok");
      refresh();
    }});

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis job-queue demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8090, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--visibility-ms",
        type=int,
        default=5000,
        help="Reclaim window for stuck jobs in milliseconds",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=0,
        help="Start this many workers immediately (default 0 — UI controls them)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    queue = RedisJobQueue(redis_client=redis_client, visibility_ms=args.visibility_ms)
    pool = WorkerPool(queue=queue, size=0)
    if args.workers > 0:
        pool.resize(args.workers)
        pool.start()

    JobQueueDemoHandler.queue = queue
    JobQueueDemoHandler.pool = pool

    server = ThreadingHTTPServer((args.host, args.port), JobQueueDemoHandler)
    print(f"Redis job-queue demo server listening on http://{args.host}:{args.port}")
    print(f"Using Redis at {args.redis_host}:{args.redis_port}")
    print(f"Visibility timeout: {args.visibility_ms} ms")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pool.stop()
        server.server_close()


if __name__ == "__main__":
    main()
