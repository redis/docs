//! Redis job-queue demo server.
//!
//! Run this binary and visit http://localhost:8798 to enqueue jobs, watch a
//! pool of workers drain the queue, simulate worker crashes, and trigger a
//! reclaim sweep that pulls timed-out jobs back to pending.

mod job_queue;
mod worker;

use std::env;
use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::State,
    response::{Html, IntoResponse},
    routing::{get, post},
    Form, Json, Router,
};
use redis::aio::ConnectionManager;
use redis::Client;
use serde::Deserialize;
use serde_json::{json, Value};

use job_queue::{JobQueueOptions, RedisJobQueue};
use worker::{WorkerConfig, WorkerPool};

#[derive(Clone)]
struct AppState {
    queue: RedisJobQueue,
    pool: Arc<WorkerPool>,
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let host = parse_arg(&args, "--host").unwrap_or_else(|| "127.0.0.1".to_string());
    let port: u16 = parse_arg(&args, "--port")
        .and_then(|p| p.parse().ok())
        .unwrap_or(8798);
    let visibility_ms: u64 = parse_arg(&args, "--visibility-ms")
        .and_then(|p| p.parse().ok())
        .unwrap_or(5000);
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379/".to_string());

    let client = match Client::open(redis_url.as_str()) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to create Redis client: {}", e);
            std::process::exit(1);
        }
    };

    let conn = match ConnectionManager::new(client).await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to connect to Redis at {}: {}", redis_url, e);
            std::process::exit(1);
        }
    };

    let queue = RedisJobQueue::new(
        conn,
        JobQueueOptions {
            queue_name: "jobs".to_string(),
            visibility_ms,
            ..Default::default()
        },
    );

    let pool = Arc::new(WorkerPool::new(queue.clone(), 0, WorkerConfig::default()));

    let state = AppState {
        queue,
        pool,
    };

    let app = Router::new()
        .route("/", get(index_handler))
        .route("/jobs", get(jobs_handler))
        .route("/stats", get(stats_handler))
        .route("/enqueue", post(enqueue_handler))
        .route("/workers/start", post(workers_start_handler))
        .route("/workers/stop", post(workers_stop_handler))
        .route("/workers/configure", post(workers_configure_handler))
        .route("/reclaim", post(reclaim_handler))
        .route("/reset", post(reset_handler))
        .with_state(state);

    let addr = format!("{}:{}", host, port);
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind to {}: {}", addr, e);
            std::process::exit(1);
        }
    };

    println!("Redis job-queue demo server listening on http://{}", addr);
    println!("Using Redis at {}", redis_url);
    println!("Visibility timeout: {} ms", visibility_ms);

    if let Err(e) = axum::serve(listener, app).await {
        eprintln!("Server error: {}", e);
        std::process::exit(1);
    }
}

fn parse_arg(args: &[String], flag: &str) -> Option<String> {
    let mut iter = args.iter();
    while let Some(arg) = iter.next() {
        if arg == flag {
            return iter.next().cloned();
        }
        if let Some(value) = arg.strip_prefix(&format!("{}=", flag)) {
            return Some(value.to_string());
        }
    }
    None
}

async fn index_handler(State(state): State<AppState>) -> Html<String> {
    Html(html_page(state.queue.visibility_ms()))
}

async fn jobs_handler(State(state): State<AppState>) -> Json<Value> {
    let pending = state.queue.list_pending().await.unwrap_or_default();
    let processing = state.queue.list_processing().await.unwrap_or_default();
    let mut completed = state.queue.list_completed().await.unwrap_or_default();
    completed.truncate(10);
    let mut failed = state.queue.list_failed().await.unwrap_or_default();
    failed.truncate(10);

    let pending_jobs = summarize_many(&state.queue, &pending).await;
    let processing_jobs = summarize_many(&state.queue, &processing).await;
    let completed_jobs = summarize_many(&state.queue, &completed).await;
    let failed_jobs = summarize_many(&state.queue, &failed).await;

    Json(json!({
        "pending": pending_jobs,
        "processing": processing_jobs,
        "completed": completed_jobs,
        "failed": failed_jobs,
    }))
}

async fn summarize_many(queue: &RedisJobQueue, ids: &[String]) -> Vec<Value> {
    let mut out = Vec::with_capacity(ids.len());
    for id in ids {
        out.push(summarize_job(queue, id).await);
    }
    out
}

async fn summarize_job(queue: &RedisJobQueue, job_id: &str) -> Value {
    let meta = queue.get_job(job_id).await.unwrap_or(None).unwrap_or_else(|| json!({}));
    let attempts = meta
        .get("attempts")
        .and_then(|v| {
            if v.is_string() {
                v.as_str().and_then(|s| s.parse::<i64>().ok())
            } else {
                v.as_i64()
            }
        })
        .unwrap_or(0);
    let status = meta
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    let payload = meta.get("payload").cloned().unwrap_or_else(|| json!({}));
    let result = meta.get("result").cloned();
    let last_error = meta
        .get("last_error")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let mut out = serde_json::Map::new();
    out.insert("id".to_string(), Value::String(job_id.to_string()));
    out.insert("status".to_string(), Value::String(status));
    out.insert("attempts".to_string(), Value::from(attempts));
    out.insert("payload".to_string(), payload);
    out.insert(
        "result".to_string(),
        result.unwrap_or(Value::Null),
    );
    out.insert(
        "last_error".to_string(),
        match last_error {
            Some(s) => Value::String(s),
            None => Value::Null,
        },
    );
    Value::Object(out)
}

async fn stats_handler(State(state): State<AppState>) -> Json<Value> {
    Json(build_stats(&state).await)
}

async fn build_stats(state: &AppState) -> Value {
    let mut stats = state.queue.stats().await.unwrap_or_else(|_| json!({}));
    let cfg = state.pool.config_snapshot().await;
    let running = state.pool.running().await as i64;
    let processed = state.pool.total_processed().await;
    if let Some(obj) = stats.as_object_mut() {
        obj.insert("workers_running".to_string(), Value::from(running));
        obj.insert(
            "worker_processed_total".to_string(),
            Value::from(processed),
        );
        obj.insert(
            "work_latency_ms".to_string(),
            Value::from(cfg.work_latency_ms),
        );
        obj.insert("fail_rate".to_string(), json!(cfg.fail_rate));
        obj.insert("hang_rate".to_string(), json!(cfg.hang_rate));
    }
    stats
}

#[derive(Deserialize)]
struct EnqueueForm {
    kind: Option<String>,
    recipient: Option<String>,
    count: Option<String>,
}

async fn enqueue_handler(
    State(state): State<AppState>,
    Form(form): Form<EnqueueForm>,
) -> Json<Value> {
    let kind = form.kind.unwrap_or_else(|| "email".to_string());
    let recipient = form
        .recipient
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "user@example.com".to_string());
    let count = form
        .count
        .and_then(|c| c.parse::<i64>().ok())
        .unwrap_or(1)
        .clamp(1, 50);

    let mut ids: Vec<String> = Vec::with_capacity(count as usize);
    for index in 0..count {
        let payload = json!({
            "kind": kind,
            "recipient": recipient,
            "n": index + 1,
        });
        match state.queue.enqueue(payload).await {
            Ok(id) => ids.push(id),
            Err(err) => {
                return Json(json!({
                    "error": format!("enqueue failed: {}", err),
                    "stats": build_stats(&state).await,
                }));
            }
        }
    }

    Json(json!({
        "enqueued": ids,
        "stats": build_stats(&state).await,
    }))
}

#[derive(Deserialize)]
struct WorkersStartForm {
    size: Option<String>,
    work_latency_ms: Option<String>,
    fail_rate: Option<String>,
    hang_rate: Option<String>,
}

async fn workers_start_handler(
    State(state): State<AppState>,
    Form(form): Form<WorkersStartForm>,
) -> Json<Value> {
    let size = form
        .size
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(2)
        .clamp(0, 8) as usize;
    let work_latency_ms = form
        .work_latency_ms
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(400)
        .max(0) as u64;
    let fail_rate = form
        .fail_rate
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0)
        .clamp(0.0, 1.0);
    let hang_rate = form
        .hang_rate
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(0.0)
        .clamp(0.0, 1.0);

    state
        .pool
        .configure(Some(work_latency_ms), Some(fail_rate), Some(hang_rate))
        .await;
    state.pool.resize(size).await;
    state.pool.start().await;

    Json(build_stats(&state).await)
}

async fn workers_stop_handler(State(state): State<AppState>) -> Json<Value> {
    state.pool.stop().await;
    Json(build_stats(&state).await)
}

#[derive(Deserialize)]
struct WorkersConfigureForm {
    work_latency_ms: Option<String>,
    fail_rate: Option<String>,
    hang_rate: Option<String>,
}

async fn workers_configure_handler(
    State(state): State<AppState>,
    Form(form): Form<WorkersConfigureForm>,
) -> Json<Value> {
    let work_latency_ms = form.work_latency_ms.and_then(|s| s.parse::<i64>().ok());
    let fail_rate = form.fail_rate.and_then(|s| s.parse::<f64>().ok());
    let hang_rate = form.hang_rate.and_then(|s| s.parse::<f64>().ok());
    state
        .pool
        .configure(
            work_latency_ms.map(|v| v.max(0) as u64),
            fail_rate,
            hang_rate,
        )
        .await;
    Json(build_stats(&state).await)
}

async fn reclaim_handler(State(state): State<AppState>) -> impl IntoResponse {
    let reclaimed = state.queue.reclaim_stuck().await.unwrap_or_default();
    Json(json!({
        "reclaimed": reclaimed,
        "stats": build_stats(&state).await,
    }))
}

async fn reset_handler(State(state): State<AppState>) -> Json<Value> {
    state.pool.stop().await;
    tokio::time::sleep(Duration::from_millis(100)).await;
    let _ = state.queue.purge().await;
    state.pool.reset_processed().await;
    Json(json!({ "stats": build_stats(&state).await }))
}

fn html_page(visibility_ms: u64) -> String {
    let page = HTML_TEMPLATE.replace("{VISIBILITY_MS}", &visibility_ms.to_string());
    page
}

const HTML_TEMPLATE: &str = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Job Queue Demo</title>
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
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #cfbca6;
      font: inherit;
      background: white;
    }
    button {
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
    }
    button.secondary { background: #38424a; }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    .badge.pending { background: #f4e4c1; color: #5e4514; }
    .badge.processing { background: var(--miss); color: #6b3220; }
    .badge.completed { background: var(--hit); color: #1d4a2c; }
    .badge.failed { background: #f0c2bc; color: #6b1f1c; }
    .job-list { list-style: none; padding: 0; margin: 8px 0 0; max-height: 230px; overflow-y: auto; }
    .job-list li {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 6px;
      background: #fffdf8;
      font-size: 0.92rem;
    }
    .job-list li .meta { color: var(--muted); font-size: 0.85rem; }
    pre {
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
    }
    #status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
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
    <div class="pill">redis-rs + axum</div>
    <h1>Redis Job Queue Demo</h1>
    <p class="lede">
      Enqueue background jobs and watch a pool of workers drain them through Redis.
      Pending jobs sit in a list; each worker uses <code>BLMOVE</code> to atomically
      claim a job and move it to a processing list. Completed jobs move to a short
      history. If a worker hangs past the {VISIBILITY_MS} ms visibility timeout,
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
        <label for="fail-rate">Failure rate (0&ndash;1)</label>
        <input id="fail-rate" type="number" step="0.05" min="0" max="1" value="0">
        <label for="hang-rate">Hang rate (simulated crash)</label>
        <input id="hang-rate" type="number" step="0.05" min="0" max="1" value="0">
        <button id="start-button">Start / apply</button>
        <button id="stop-button" class="secondary">Stop workers</button>
      </section>

      <section class="panel">
        <h2>Reclaim &amp; reset</h2>
        <p>Reclaim moves any job sitting in the processing list past the
        {VISIBILITY_MS} ms visibility timeout back to pending.</p>
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

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[c]);
    }

    function renderStats(stats) {
      const view = document.getElementById("stats-view");
      if (!stats) { view.textContent = "(no data)"; return; }
      view.innerHTML = `
        <dl>
          <dt>Workers running</dt><dd>${stats.workers_running}</dd>
          <dt>Pending depth</dt><dd>${stats.pending_depth}</dd>
          <dt>Processing depth</dt><dd>${stats.processing_depth}</dd>
          <dt>Enqueued total</dt><dd>${stats.enqueued_total}</dd>
          <dt>Completed total</dt><dd>${stats.completed_total}</dd>
          <dt>Failed total</dt><dd>${stats.failed_total}</dd>
          <dt>Reclaimed total</dt><dd>${stats.reclaimed_total}</dd>
          <dt>Worker processed</dt><dd>${stats.worker_processed_total}</dd>
          <dt>Visibility timeout</dt><dd>${stats.visibility_ms} ms</dd>
          <dt>Work latency</dt><dd>${stats.work_latency_ms} ms</dd>
          <dt>Failure rate</dt><dd>${stats.fail_rate}</dd>
          <dt>Hang rate</dt><dd>${stats.hang_rate}</dd>
        </dl>
      `;
    }

    function renderJobList(elementId, jobs, countId, badgeClass) {
      const list = document.getElementById(elementId);
      const count = document.getElementById(countId);
      count.textContent = jobs.length;
      count.className = `badge ${badgeClass}`;
      if (!jobs.length) { list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }
      list.innerHTML = jobs.map((job) => {
        const payload = job.payload && typeof job.payload === "object"
          ? JSON.stringify(job.payload)
          : escapeHtml(job.payload || "");
        const extra = job.last_error
          ? ` &middot; <span class=meta>error: ${escapeHtml(job.last_error)}</span>`
          : job.result
            ? ` &middot; <span class=meta>result: ${escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}</span>`
            : "";
        return `<li>
          <strong>${escapeHtml(job.id)}</strong>
          <span class=badge ${badgeClass}>${escapeHtml(job.status)}</span>
          <span class=meta>attempts: ${job.attempts}</span>
          ${extra}
          <div class=meta>${escapeHtml(payload)}</div>
        </li>`;
      }).join("");
    }

    async function refresh() {
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
    }

    document.getElementById("enqueue-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        kind: document.getElementById("job-kind").value,
        recipient: document.getElementById("job-recipient").value,
        count: document.getElementById("job-count").value,
      });
      const response = await fetch("/enqueue", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Enqueue failed.", "error"); return; }
      setStatus(`Enqueued ${data.enqueued.length} job(s).`, "ok");
      refresh();
    });

    document.getElementById("start-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        size: document.getElementById("worker-size").value,
        work_latency_ms: document.getElementById("work-latency").value,
        fail_rate: document.getElementById("fail-rate").value,
        hang_rate: document.getElementById("hang-rate").value,
      });
      await fetch("/workers/start", { method: "POST", body });
      setStatus("Workers started.", "ok");
      refresh();
    });

    document.getElementById("stop-button").addEventListener("click", async () => {
      await fetch("/workers/stop", { method: "POST" });
      setStatus("Workers stopped.", "ok");
      refresh();
    });

    document.getElementById("reclaim-button").addEventListener("click", async () => {
      const response = await fetch("/reclaim", { method: "POST" });
      const data = await response.json();
      setStatus(`Reclaimed ${data.reclaimed.length} job(s).`, "ok");
      refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      await fetch("/reset", { method: "POST" });
      setStatus("Queue reset.", "ok");
      refresh();
    });

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>
"##;
