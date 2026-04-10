#!/usr/bin/env python3
"""
Redis TimeSeries dashboard demo server.

Run this file and visit http://localhost:8080 to watch three simulated power
sensors stream into Redis while old samples expire from a short rolling window.
"""

from __future__ import annotations

import argparse
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis
    from redis.exceptions import ResponseError

    from sensor_simulator import SENSORS, SensorSimulator
    from timeseries_store import (
        BUCKET_MS,
        RETENTION_MS,
        SAMPLE_INTERVAL_MS,
        WINDOW_MS,
        RedisTimeSeriesStore,
    )
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


class SensorIngestThread(threading.Thread):
    """Continuously generate and store sensor readings."""

    def __init__(
        self,
        store: RedisTimeSeriesStore,
        simulator: SensorSimulator,
        interval_seconds: float = SAMPLE_INTERVAL_MS / 1000,
    ) -> None:
        super().__init__(daemon=True)
        self.store = store
        self.simulator = simulator
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()

    def run(self) -> None:
        while not self._stop_event.is_set():
            self.store.add_samples(self.simulator.next_samples())
            self._stop_event.wait(self.interval_seconds)

    def stop(self) -> None:
        self._stop_event.set()


class DashboardHandler(BaseHTTPRequestHandler):
    """Serve the dashboard HTML and JSON snapshot endpoint."""

    store: RedisTimeSeriesStore | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return

        if parsed.path == "/api/snapshot":
            self._send_json(self.store.dashboard_snapshot())
            return

        self.send_error(404)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _send_json(self, payload: dict[str, object], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, html: str) -> None:
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _html_page(self) -> str:
        return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis TimeSeries Rolling Demo</title>
  <style>
    :root {{
      --bg: #f6f0e3;
      --paper: #fffaf0;
      --ink: #1f2a2e;
      --muted: #5b666a;
      --line: #d9ccb7;
      --accent: #126353;
      --accent-soft: #dcefe7;
      --signal: #c1532f;
      --grid: #e9decc;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background:
        radial-gradient(circle at top left, #fff4d7, transparent 28%),
        linear-gradient(180deg, #f8f3e7 0%, var(--bg) 100%);
      color: var(--ink);
      font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
    }}
    main {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 14px 14px 24px;
    }}
    h1, h2, h3 {{
      margin: 0;
      line-height: 1.1;
    }}
    p {{
      margin: 0;
      color: var(--muted);
    }}
    .intro {{
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      background: rgba(255, 250, 240, 0.9);
      border: 1px solid var(--line);
      border-radius: 14px;
      margin-bottom: 12px;
    }}
    .intro h1 {{
      font-size: 1.7rem;
    }}
    .intro p {{
      font-size: 0.94rem;
      line-height: 1.35;
    }}
    .metrics {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }}
    .pill {{
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.82rem;
    }}
    .sensor-panel {{
      margin-top: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--paper);
      box-shadow: 0 10px 30px rgba(31, 42, 46, 0.05);
    }}
    .sensor-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }}
    .sensor-title-row {{
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
    }}
    .sensor-header h2 {{
      font-size: 1.1rem;
    }}
    .sensor-meta {{
      font-size: 0.82rem;
      color: var(--muted);
      white-space: nowrap;
    }}
    .latest {{
      color: var(--accent);
      font-size: 0.98rem;
      white-space: nowrap;
    }}
    svg {{
      width: 100%;
      height: 164px;
      display: block;
      background: linear-gradient(180deg, #fffdf8 0%, #faf4e8 100%);
      border: 1px solid var(--line);
      border-radius: 10px;
    }}
    .plot-shell {{
      position: relative;
    }}
    .bucket-row {{
      margin-top: 0;
    }}
    .empty {{
      color: var(--muted);
      font-style: italic;
      padding: 6px 0 0;
    }}
    code {{
      font-family: "SFMono-Regular", Menlo, monospace;
      color: var(--signal);
      font-size: 0.92em;
    }}
    @media (max-width: 760px) {{
      .intro h1 {{
        font-size: 1.45rem;
      }}
      .sensor-header {{
        flex-direction: column;
        align-items: flex-start;
      }}
      .sensor-title-row {{
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }}
      .sensor-meta {{
        white-space: normal;
      }}
      .bucket-row {{
        overflow-x: auto;
      }}
    }}
  </style>
</head>
<body>
  <main>
    <section class="intro">
      <h1>Rolling Power Sensor Demo</h1>
      <p>Three sensors write new readings to Redis every <code>{SAMPLE_INTERVAL_MS}ms</code>. Each graph shows only the most recent <code>{WINDOW_MS / 1000:.0f}s</code>, so old samples disappear as Redis retention expires them. The buckets underneath each graph summarize the same data in <code>{BUCKET_MS / 1000:.0f}s</code> windows using min, max, and average aggregation.</p>
      <div class="metrics">
        <span class="pill">Commands in play: <code>TS.MADD</code>, <code>TS.RANGE</code></span>
        <span class="pill">Retention: <code>{RETENTION_MS / 1000:.0f}s</code></span>
        <span class="pill">Sample interval: <code>{SAMPLE_INTERVAL_MS}ms</code></span>
        <span class="pill">Bucket width: <code>{BUCKET_MS / 1000:.0f}s</code></span>
      </div>
    </section>
    <div id="sensors">Loading snapshot...</div>
  </main>

  <script>
    const GRAPH_WIDTH = 1020;
    const GRAPH_HEIGHT = 150;
    const GRAPH_PAD_X = 10;
    const GRAPH_PAD_Y = 18;
    const PLOT_START_PERCENT = (GRAPH_PAD_X / GRAPH_WIDTH) * 100;
    const PLOT_WIDTH_PERCENT = ((GRAPH_WIDTH - GRAPH_PAD_X * 2) / GRAPH_WIDTH) * 100;

    function fmt(value) {{
      if (value === null || value === undefined) return "n/a";
      return Number(value).toFixed(1);
    }}

    function timeLabel(timestamp) {{
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {{
        minute: "2-digit",
        second: "2-digit"
      }});
    }}

    function combinedSvgForSensor(sensor, now, windowMs) {{
      const width = GRAPH_WIDTH;
      const chartHeight = GRAPH_HEIGHT;
      const bucketHeight = 36;
      const height = chartHeight + bucketHeight;
      const padX = GRAPH_PAD_X;
      const padY = GRAPH_PAD_Y;
      const plotWidth = width - padX * 2;
      const plotHeight = chartHeight - padY * 2;
      const bucketTop = chartHeight;
      const clipIdBase = sensor.sensor_id.replace(/[^a-zA-Z0-9_-]/g, "-");
      const chartClipId = `chart-clip-${{clipIdBase}}`;
      const bucketClipId = `bucket-clip-${{clipIdBase}}`;
      const values = sensor.raw_points.map((point) => point.value);
      const minValue = Math.min(...values, 300);
      const maxValue = Math.max(...values, 900);
      const valueSpan = Math.max(maxValue - minValue, 1);

      const xFor = (timestamp) => padX + ((timestamp - (now - windowMs)) / windowMs) * plotWidth;
      const yFor = (value) => padY + (1 - ((value - minValue) / valueSpan)) * plotHeight;

      const boundaryTimestamps = sensor.buckets.length
        ? [...sensor.buckets.map((bucket) => bucket.start), sensor.buckets[sensor.buckets.length - 1].end]
        : [now - windowMs, now];

      const verticalLines = boundaryTimestamps.map((timestamp) => {{
        const x = xFor(timestamp);
        return `<line x1="${{x.toFixed(2)}}" y1="${{padY}}" x2="${{x.toFixed(2)}}" y2="${{chartHeight - padY}}" stroke="var(--grid)" stroke-width="1" />`;
      }}).join("");

      const horizontalLines = [];
      for (let i = 0; i <= 3; i += 1) {{
        const y = padY + (plotHeight / 3) * i;
        horizontalLines.push(`<line x1="${{padX}}" y1="${{y}}" x2="${{width - padX}}" y2="${{y}}" stroke="var(--grid)" stroke-width="1" />`);
      }}

      const bucketBands = sensor.buckets.map((bucket, index) => {{
        const rawStartX = xFor(bucket.start);
        const rawEndX = xFor(bucket.end);
        const x = rawStartX;
        const bandWidth = Math.max(rawEndX - rawStartX, 0);
        const fill = "rgba(18, 99, 83, 0.04)";
        return `<rect x="${{x.toFixed(2)}}" y="${{padY}}" width="${{bandWidth.toFixed(2)}}" height="${{plotHeight.toFixed(2)}}" fill="${{fill}}" />`;
      }}).join("");

      const bucketDividers = sensor.buckets.map((bucket) => {{
        const x = xFor(bucket.start);
        return `<line x1="${{x.toFixed(2)}}" y1="${{padY}}" x2="${{x.toFixed(2)}}" y2="${{chartHeight - padY}}" stroke="rgba(18, 99, 83, 0.28)" stroke-width="1.2" />`;
      }}).join("") + `<line x1="${{(width - padX).toFixed(2)}}" y1="${{padY}}" x2="${{(width - padX).toFixed(2)}}" y2="${{chartHeight - padY}}" stroke="rgba(18, 99, 83, 0.28)" stroke-width="1.2" />`;

      const polyline = sensor.raw_points.length > 0
        ? sensor.raw_points.map((point) => `${{xFor(point.timestamp).toFixed(2)}},${{yFor(point.value).toFixed(2)}}`).join(" ")
        : "";

      const dots = sensor.raw_points.map((point) => `<circle cx="${{xFor(point.timestamp).toFixed(2)}}" cy="${{yFor(point.value).toFixed(2)}}" r="2.7" fill="var(--signal)" />`).join("");

      const labels = boundaryTimestamps.map((timestamp) => {{
        const x = xFor(timestamp);
        return `<text x="${{x.toFixed(2)}}" y="${{chartHeight - 4}}" text-anchor="middle" font-size="11" fill="var(--muted)">${{timeLabel(timestamp)}}</text>`;
      }}).join("");

      const bucketRects = sensor.buckets.map((bucket, index) => {{
        const relativeStart = (bucket.start - (now - windowMs)) / windowMs;
        const relativeWidth = (bucket.end - bucket.start) / windowMs;
        const rawStartX = padX + relativeStart * plotWidth;
        const rawEndX = rawStartX + relativeWidth * plotWidth;
        const x = rawStartX;
        const rectWidth = Math.max(rawEndX - rawStartX, 0);
        const visibleStartX = Math.max(rawStartX, padX);
        const visibleEndX = Math.min(rawEndX, width - padX);
        const visibleWidth = Math.max(visibleEndX - visibleStartX, 0);
        const fill = "#fffdf8";
        const stroke = "#d9ccb7";
        const textX = rawStartX + rectWidth / 2;
        let textBlock = "";
        const textOpacity = Math.max(0, Math.min(1, (visibleWidth - 58) / 38)).toFixed(2);

        if (visibleWidth >= 112) {{
          textBlock = `
          <text x="${{textX.toFixed(2)}}" y="${{bucketTop + 23}}" text-anchor="middle" font-size="11" fill="#1f2a2e" opacity="${{textOpacity}}">Min ${{fmt(bucket.min)}}, Max ${{fmt(bucket.max)}}, Avg ${{fmt(bucket.avg)}}</text>
          `;
        }} else if (visibleWidth >= 86) {{
          textBlock = `
          <text x="${{textX.toFixed(2)}}" y="${{bucketTop + 23}}" text-anchor="middle" font-size="10" fill="#1f2a2e" opacity="${{textOpacity}}">Avg ${{fmt(bucket.avg)}}, Min ${{fmt(bucket.min)}}, Max ${{fmt(bucket.max)}}</text>
          `;
        }}

        return `
          <rect x="${{x.toFixed(2)}}" y="${{bucketTop}}" width="${{rectWidth.toFixed(2)}}" height="${{bucketHeight}}" fill="${{fill}}" stroke="${{stroke}}" />
          ${{textBlock}}
        `;
      }}).join("");

      const bucketBoundaryLines = boundaryTimestamps.map((timestamp) => {{
        const x = xFor(timestamp);
        return `<line x1="${{x.toFixed(2)}}" y1="${{bucketTop}}" x2="${{x.toFixed(2)}}" y2="${{height}}" stroke="rgba(18, 99, 83, 0.22)" stroke-width="1" />`;
      }}).join("");

      return `
        <svg viewBox="0 0 ${{width}} ${{height}}" role="img" aria-label="Rolling graph and bucket summaries for ${{sensor.sensor_id}}">
          <defs>
            <clipPath id="${{chartClipId}}">
              <rect x="${{padX}}" y="${{padY}}" width="${{plotWidth}}" height="${{plotHeight}}" />
            </clipPath>
            <clipPath id="${{bucketClipId}}">
              <rect x="${{padX}}" y="${{bucketTop}}" width="${{plotWidth}}" height="${{bucketHeight}}" />
            </clipPath>
          </defs>
          <g clip-path="url(#${{bucketClipId}})">
            ${{bucketRects}}
          </g>
          <line x1="0" y1="${{bucketTop}}" x2="${{width}}" y2="${{bucketTop}}" stroke="var(--line)" stroke-width="1" />
          <g clip-path="url(#${{chartClipId}})">
            ${{bucketBands}}
            ${{verticalLines}}
            ${{horizontalLines.join("")}}
            ${{bucketDividers}}
            <polyline fill="none" stroke="var(--signal)" stroke-width="2.5" points="${{polyline}}" />
            ${{dots}}
          </g>
          ${{labels}}
          <g clip-path="url(#${{bucketClipId}})">
            ${{bucketBoundaryLines}}
          </g>
        </svg>
      `;
    }}

    function bucketCards(sensor, now) {{
      return combinedSvgForSensor(sensor, now, {WINDOW_MS});
    }}

    function render(snapshot) {{
      const html = snapshot.sensors.map((sensor) => `
        <section class="sensor-panel">
          <div class="sensor-header">
            <div class="sensor-title-row">
              <h2>${{sensor.sensor_id}}</h2>
              <div class="sensor-meta">Power consumption sensor in the ${{sensor.zone}} zone</div>
            </div>
            <div class="latest">Latest: <strong>${{fmt(sensor.latest?.value)}}</strong> ${{sensor.unit}}</div>
          </div>
          <div class="plot-shell">
            <div class="bucket-row">${{bucketCards(sensor, snapshot.now)}}</div>
          </div>
        </section>
      `).join("");

      document.getElementById("sensors").innerHTML = html;
    }}

    async function refresh() {{
      const response = await fetch("/api/snapshot");
      if (!response.ok) {{
        throw new Error(`Request failed: ${{response.status}}`);
      }}
      const snapshot = await response.json();
      render(snapshot);
    }}

    refresh().catch((error) => {{
      document.getElementById("sensors").innerHTML = `<pre>${{error.message}}</pre>`;
    }});

    setInterval(() => {{
      refresh().catch((error) => console.error(error));
    }}, 750);
  </script>
</body>
</html>"""


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the Redis TimeSeries dashboard demo.")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument("--port", type=int, default=8080, help="HTTP port for the local dashboard")
    return parser


def main() -> None:
    args = build_argument_parser().parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )

    try:
        redis_client.ping()
    except redis.RedisError as exc:
        print(f"Failed to connect to Redis at {args.redis_host}:{args.redis_port}: {exc}")
        sys.exit(1)

    store = RedisTimeSeriesStore(redis_client=redis_client, sensors=SENSORS)

    try:
        store.ensure_schema()
    except ResponseError as exc:
        print(f"TimeSeries setup failed: {exc}")
        print("Make sure your Redis deployment includes time series support.")
        sys.exit(1)

    ingest_thread = SensorIngestThread(store=store, simulator=SensorSimulator(SENSORS))
    ingest_thread.start()

    DashboardHandler.store = store
    server = ThreadingHTTPServer(("0.0.0.0", args.port), DashboardHandler)

    print(f"Dashboard running at http://localhost:{args.port}")
    print(f"Writing simulated samples to Redis at {args.redis_host}:{args.redis_port}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        ingest_thread.stop()
        server.server_close()


if __name__ == "__main__":
    main()
