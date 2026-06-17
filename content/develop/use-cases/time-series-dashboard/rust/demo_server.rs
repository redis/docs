//! Redis TimeSeries dashboard demo server.
//!
//! Run this demo and visit http://localhost:8080 to watch three simulated power
//! sensors stream into Redis while old samples expire from a short rolling window.

mod sensor_simulator;
mod timeseries_store;

use axum::{
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse},
    routing::get,
    Json, Router,
};
use redis::{aio::Connection, Client};
use sensor_simulator::{sensors, SensorSimulator};
use std::{env, sync::Arc, time::Duration};
use tokio::sync::Mutex;
use timeseries_store::{
    RedisTimeSeriesStore, BUCKET_MS, RETENTION_MS, SAMPLE_INTERVAL_MS, WINDOW_MS,
};

const GRAPH_WIDTH: i32 = 1020;
const GRAPH_HEIGHT: i32 = 150;
const GRAPH_PAD_X: i32 = 10;
const GRAPH_PAD_Y: i32 = 18;

#[derive(Clone)]
struct AppState {
    redis_connection: Arc<Mutex<Connection>>,
    store: RedisTimeSeriesStore,
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let port = parse_arg(&args, "--port").unwrap_or_else(|| "8080".to_string());
    let redis_host = parse_arg(&args, "--redis-host").unwrap_or_else(|| "localhost".to_string());
    let redis_port = parse_arg(&args, "--redis-port").unwrap_or_else(|| "6379".to_string());
    let redis_url = env::var("REDIS_URL")
        .unwrap_or_else(|_| format!("redis://{}:{}/", redis_host, redis_port));

    let client = Client::open(redis_url.as_str()).unwrap_or_else(|error| {
        eprintln!("Failed to create Redis client: {}", error);
        std::process::exit(1);
    });

    let connection = client.get_async_connection().await.unwrap_or_else(|error| {
        eprintln!("Failed to connect to Redis at {}: {}", redis_url, error);
        std::process::exit(1);
    });

    let store = RedisTimeSeriesStore::new(sensors());
    let state = AppState {
        redis_connection: Arc::new(Mutex::new(connection)),
        store,
    };

    {
        let mut con = state.redis_connection.lock().await;
        if let Err(error) = state.store.ensure_schema(&mut *con).await {
            eprintln!("TimeSeries setup failed: {}", error);
            eprintln!("Make sure your Redis deployment includes time series support.");
            std::process::exit(1);
        }
    }

    let ingest_state = state.clone();
    tokio::spawn(async move {
        let mut simulator = SensorSimulator::new(sensors());
        let mut interval = tokio::time::interval(Duration::from_millis(SAMPLE_INTERVAL_MS as u64));
        interval.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);

        loop {
            interval.tick().await;
            let samples = simulator.next_samples();
            let mut con = ingest_state.redis_connection.lock().await;
            if let Err(error) = ingest_state.store.add_samples(&mut *con, &samples).await {
                eprintln!("Failed to add samples: {}", error);
            }
        }
    });

    let app = Router::new()
        .route("/", get(handle_home))
        .route("/index.html", get(handle_home))
        .route("/api/snapshot", get(handle_snapshot))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|error| {
            eprintln!("Failed to bind to {}: {}", addr, error);
            std::process::exit(1);
        });

    println!("Dashboard running at http://localhost:{}", port);
    println!("Writing simulated samples to Redis at {}", redis_url);

    axum::serve(listener, app).await.unwrap_or_else(|error| {
        eprintln!("Server error: {}", error);
        std::process::exit(1);
    });
}

async fn handle_home() -> Html<String> {
    Html(html_page())
}

async fn handle_snapshot(State(state): State<AppState>) -> impl IntoResponse {
    let mut con = state.redis_connection.lock().await;
    match state.store.dashboard_snapshot(&mut *con).await {
        Ok(snapshot) => Json(snapshot).into_response(),
        Err(error) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": error.to_string() })),
        )
            .into_response(),
    }
}

fn parse_arg(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|arg| arg == flag)
        .and_then(|index| args.get(index + 1))
        .cloned()
}

fn html_page() -> String {
    let template = r##"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis TimeSeries Rolling Demo</title>
  <style>
    :root {
      --bg: #f6f0e3;
      --paper: #fffaf0;
      --ink: #1f2a2e;
      --muted: #5b666a;
      --line: #d9ccb7;
      --accent: #126353;
      --accent-soft: #dcefe7;
      --signal: #c1532f;
      --grid: #e9decc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, #fff4d7, transparent 28%),
        linear-gradient(180deg, #f8f3e7 0%, var(--bg) 100%);
      color: var(--ink);
      font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 14px 14px 24px;
    }
    h1, h2, h3 {
      margin: 0;
      line-height: 1.1;
    }
    p {
      margin: 0;
      color: var(--muted);
    }
    .intro {
      display: grid;
      gap: 6px;
      padding: 12px 14px;
      background: rgba(255, 250, 240, 0.9);
      border: 1px solid var(--line);
      border-radius: 14px;
      margin-bottom: 12px;
    }
    .intro h1 {
      font-size: 1.7rem;
    }
    .intro p {
      font-size: 0.94rem;
      line-height: 1.35;
    }
    .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }
    .pill {
      padding: 4px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.82rem;
    }
    .sensor-panel {
      margin-top: 10px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: var(--paper);
      box-shadow: 0 10px 30px rgba(31, 42, 46, 0.05);
    }
    .sensor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .sensor-title-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
    }
    .sensor-header h2 {
      font-size: 1.1rem;
    }
    .sensor-meta {
      font-size: 0.82rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .latest {
      color: var(--accent);
      font-size: 0.98rem;
      white-space: nowrap;
    }
    svg {
      width: 100%;
      height: 164px;
      display: block;
      background: linear-gradient(180deg, #fffdf8 0%, #faf4e8 100%);
      border: 1px solid var(--line);
      border-radius: 10px;
    }
    .plot-shell {
      position: relative;
    }
    .bucket-row {
      margin-top: 0;
    }
    .empty {
      color: var(--muted);
      font-style: italic;
      padding: 6px 0 0;
    }
    code {
      font-family: "SFMono-Regular", Menlo, monospace;
      color: var(--signal);
      font-size: 0.92em;
    }
    @media (max-width: 760px) {
      .intro h1 {
        font-size: 1.45rem;
      }
      .sensor-header {
        flex-direction: column;
        align-items: flex-start;
      }
      .sensor-title-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .sensor-meta {
        white-space: normal;
      }
      .bucket-row {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <main>
    <section class="intro">
      <h1>Rolling Power Sensor Demo</h1>
      <p>Three sensors write new readings to Redis every <code>__SAMPLE_INTERVAL__ms</code>. Each graph shows only the most recent <code>__WINDOW__s</code>, so old samples disappear as Redis retention expires them. The buckets underneath each graph summarize the same data in <code>__BUCKET__s</code> windows using min, max, and average aggregation.</p>
      <div class="metrics">
        <span class="pill">Commands in play: <code>TS.MADD</code>, <code>TS.RANGE</code></span>
        <span class="pill">Retention: <code>__RETENTION__s</code></span>
        <span class="pill">Sample interval: <code>__SAMPLE_INTERVAL__ms</code></span>
        <span class="pill">Bucket width: <code>__BUCKET__s</code></span>
      </div>
    </section>
    <div id="sensors">Loading snapshot...</div>
  </main>

  <script>
    const GRAPH_WIDTH = __GRAPH_WIDTH__;
    const GRAPH_HEIGHT = __GRAPH_HEIGHT__;
    const GRAPH_PAD_X = __GRAPH_PAD_X__;
    const GRAPH_PAD_Y = __GRAPH_PAD_Y__;

    function fmt(value) {
      if (value === null || value === undefined) return "n/a";
      return Number(value).toFixed(1);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);
    }

    function timeLabel(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
    }

    function combinedSvgForSensor(sensor, now, windowMs) {
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
      const chartClipId = `chart-clip-${clipIdBase}`;
      const bucketClipId = `bucket-clip-${clipIdBase}`;
      const values = sensor.raw_points.map((point) => point.value);
      const minValue = Math.min(...values, 300);
      const maxValue = Math.max(...values, 900);
      const valueSpan = Math.max(maxValue - minValue, 1);

      const xFor = (timestamp) => padX + ((timestamp - (now - windowMs)) / windowMs) * plotWidth;
      const yFor = (value) => padY + (1 - ((value - minValue) / valueSpan)) * plotHeight;

      const boundaryTimestamps = sensor.buckets.length
        ? [...sensor.buckets.map((bucket) => bucket.start), sensor.buckets[sensor.buckets.length - 1].end]
        : [now - windowMs, now];

      const verticalLines = boundaryTimestamps.map((timestamp) => {
        const x = xFor(timestamp);
        return `<line x1="${x.toFixed(2)}" y1="${padY}" x2="${x.toFixed(2)}" y2="${chartHeight - padY}" stroke="var(--grid)" stroke-width="1" />`;
      }).join("");

      const horizontalLines = [];
      for (let i = 0; i <= 3; i += 1) {
        const y = padY + (plotHeight / 3) * i;
        horizontalLines.push(`<line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="var(--grid)" stroke-width="1" />`);
      }

      const bucketBands = sensor.buckets.map((bucket) => {
        const rawStartX = xFor(bucket.start);
        const rawEndX = xFor(bucket.end);
        const bandWidth = Math.max(rawEndX - rawStartX, 0);
        return `<rect x="${rawStartX.toFixed(2)}" y="${padY}" width="${bandWidth.toFixed(2)}" height="${plotHeight.toFixed(2)}" fill="rgba(18, 99, 83, 0.04)" />`;
      }).join("");

      const bucketDividers = sensor.buckets.map((bucket) => {
        const x = xFor(bucket.start);
        return `<line x1="${x.toFixed(2)}" y1="${padY}" x2="${x.toFixed(2)}" y2="${chartHeight - padY}" stroke="rgba(18, 99, 83, 0.28)" stroke-width="1.2" />`;
      }).join("") + `<line x1="${(width - padX).toFixed(2)}" y1="${padY}" x2="${(width - padX).toFixed(2)}" y2="${chartHeight - padY}" stroke="rgba(18, 99, 83, 0.28)" stroke-width="1.2" />`;

      const polyline = sensor.raw_points.length > 0
        ? sensor.raw_points.map((point) => `${xFor(point.timestamp).toFixed(2)},${yFor(point.value).toFixed(2)}`).join(" ")
        : "";

      const dots = sensor.raw_points.map((point) => `<circle cx="${xFor(point.timestamp).toFixed(2)}" cy="${yFor(point.value).toFixed(2)}" r="2.7" fill="var(--signal)" />`).join("");

      const labels = boundaryTimestamps.map((timestamp) => {
        const x = xFor(timestamp);
        return `<text x="${x.toFixed(2)}" y="${chartHeight - 4}" text-anchor="middle" font-size="11" fill="var(--muted)">${timeLabel(timestamp)}</text>`;
      }).join("");

      const bucketRects = sensor.buckets.map((bucket) => {
        const relativeStart = (bucket.start - (now - windowMs)) / windowMs;
        const relativeWidth = (bucket.end - bucket.start) / windowMs;
        const rawStartX = padX + relativeStart * plotWidth;
        const rawEndX = rawStartX + relativeWidth * plotWidth;
        const rectWidth = Math.max(rawEndX - rawStartX, 0);
        const visibleStartX = Math.max(rawStartX, padX);
        const visibleEndX = Math.min(rawEndX, width - padX);
        const visibleWidth = Math.max(visibleEndX - visibleStartX, 0);
        const textX = rawStartX + rectWidth / 2;
        const textOpacity = Math.max(0, Math.min(1, (visibleWidth - 58) / 38)).toFixed(2);
        let textBlock = "";

        if (visibleWidth >= 112) {
          textBlock = `<text x="${textX.toFixed(2)}" y="${bucketTop + 23}" text-anchor="middle" font-size="11" fill="#1f2a2e" opacity="${textOpacity}">Min ${fmt(bucket.min)}, Max ${fmt(bucket.max)}, Avg ${fmt(bucket.avg)}</text>`;
        } else if (visibleWidth >= 86) {
          textBlock = `<text x="${textX.toFixed(2)}" y="${bucketTop + 23}" text-anchor="middle" font-size="10" fill="#1f2a2e" opacity="${textOpacity}">Avg ${fmt(bucket.avg)}, Min ${fmt(bucket.min)}, Max ${fmt(bucket.max)}</text>`;
        }

        return `<rect x="${rawStartX.toFixed(2)}" y="${bucketTop}" width="${rectWidth.toFixed(2)}" height="36" fill="#fffdf8" stroke="#d9ccb7" />${textBlock}`;
      }).join("");

      const bucketBoundaryLines = boundaryTimestamps.map((timestamp) => {
        const x = xFor(timestamp);
        return `<line x1="${x.toFixed(2)}" y1="${bucketTop}" x2="${x.toFixed(2)}" y2="${height}" stroke="rgba(18, 99, 83, 0.22)" stroke-width="1" />`;
      }).join("");

      return `
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Rolling graph and bucket summaries for ${escapeHtml(sensor.sensor_id)}">
          <defs>
            <clipPath id="${chartClipId}">
              <rect x="${padX}" y="${padY}" width="${plotWidth}" height="${plotHeight}" />
            </clipPath>
            <clipPath id="${bucketClipId}">
              <rect x="${padX}" y="${bucketTop}" width="${plotWidth}" height="${bucketHeight}" />
            </clipPath>
          </defs>
          <g clip-path="url(#${bucketClipId})">
            ${bucketRects}
          </g>
          <line x1="0" y1="${bucketTop}" x2="${width}" y2="${bucketTop}" stroke="var(--line)" stroke-width="1" />
          <g clip-path="url(#${chartClipId})">
            ${bucketBands}
            ${verticalLines}
            ${horizontalLines.join("")}
            ${bucketDividers}
            <polyline fill="none" stroke="var(--signal)" stroke-width="2.5" points="${polyline}" />
            ${dots}
          </g>
          ${labels}
          <g clip-path="url(#${bucketClipId})">
            ${bucketBoundaryLines}
          </g>
        </svg>
      `;
    }

    function render(snapshot) {
      const html = snapshot.sensors.map((sensor) => `
        <section class="sensor-panel">
          <div class="sensor-header">
            <div class="sensor-title-row">
              <h2>${escapeHtml(sensor.sensor_id)}</h2>
              <div class="sensor-meta">Power consumption sensor in the ${escapeHtml(sensor.zone)} zone</div>
            </div>
            <div class="latest">Latest: <strong>${escapeHtml(fmt(sensor.latest?.value))}</strong> ${escapeHtml(sensor.unit)}</div>
          </div>
          <div class="plot-shell">
            <div class="bucket-row">${combinedSvgForSensor(sensor, snapshot.now, snapshot.window_ms)}</div>
          </div>
        </section>
      `).join("");

      document.getElementById("sensors").innerHTML = html;
    }

    async function refresh() {
      const response = await fetch("/api/snapshot");
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      const snapshot = await response.json();
      render(snapshot);
    }

    refresh().catch((error) => {
      document.getElementById("sensors").innerHTML = `<pre>${escapeHtml(error.message)}</pre>`;
    });

    setInterval(() => {
      refresh().catch((error) => console.error(error));
    }, 750);
  </script>
</body>
</html>
"##;

    template
        .replace("__SAMPLE_INTERVAL__", &SAMPLE_INTERVAL_MS.to_string())
        .replace("__WINDOW__", &(WINDOW_MS / 1000).to_string())
        .replace("__BUCKET__", &(BUCKET_MS / 1000).to_string())
        .replace("__RETENTION__", &(RETENTION_MS / 1000).to_string())
        .replace("__GRAPH_WIDTH__", &GRAPH_WIDTH.to_string())
        .replace("__GRAPH_HEIGHT__", &GRAPH_HEIGHT.to_string())
        .replace("__GRAPH_PAD_X__", &GRAPH_PAD_X.to_string())
        .replace("__GRAPH_PAD_Y__", &GRAPH_PAD_Y.to_string())
}
