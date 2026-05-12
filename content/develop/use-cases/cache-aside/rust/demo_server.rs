//! Redis Cache-Aside Demo Server.
//!
//! Run this demo and visit http://localhost:8080 to read product records
//! through a Redis cache that sits in front of a deliberately slow primary
//! store.

mod cache;
mod primary;

use axum::{
    extract::{Form, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use cache::{CacheConfig, RedisCache};
use primary::MockPrimaryStore;
use redis::aio::ConnectionManager;
use redis::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use std::env;
use std::sync::Arc;
use std::time::Instant;

#[derive(Clone)]
struct AppState {
    cache: RedisCache,
    primary: Arc<MockPrimaryStore>,
}

#[tokio::main]
async fn main() {
    let mut port: u16 = 8080;
    let mut redis_host = env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
    let mut redis_port: u16 = env::var("REDIS_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(6379);
    let mut ttl: usize = 30;
    let mut primary_latency_ms: u64 = 150;

    let args: Vec<String> = env::args().collect();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--port" if i + 1 < args.len() => {
                port = args[i + 1].parse().expect("invalid --port");
                i += 2;
            }
            "--redis-host" if i + 1 < args.len() => {
                redis_host = args[i + 1].clone();
                i += 2;
            }
            "--redis-port" if i + 1 < args.len() => {
                redis_port = args[i + 1].parse().expect("invalid --redis-port");
                i += 2;
            }
            "--ttl" if i + 1 < args.len() => {
                ttl = args[i + 1].parse().expect("invalid --ttl");
                i += 2;
            }
            "--primary-latency-ms" if i + 1 < args.len() => {
                primary_latency_ms = args[i + 1].parse().expect("invalid --primary-latency-ms");
                i += 2;
            }
            _ => {
                i += 1;
            }
        }
    }

    let url = format!("redis://{}:{}/", redis_host, redis_port);
    let client = Client::open(url).expect("failed to create Redis client");
    let conn = ConnectionManager::new(client)
        .await
        .expect("failed to connect to Redis");

    let cache = RedisCache::new(
        conn,
        CacheConfig {
            ttl,
            ..CacheConfig::default()
        },
    );
    let primary = Arc::new(MockPrimaryStore::new(primary_latency_ms));

    let state = AppState { cache, primary };

    let app = Router::new()
        .route("/", get(index))
        .route("/products", get(products))
        .route("/read", get(read))
        .route("/stats", get(stats_handler))
        .route("/invalidate", post(invalidate))
        .route("/update", post(update))
        .route("/stampede", post(stampede))
        .route("/reset", post(reset))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .expect("failed to bind");
    println!(
        "Redis cache-aside demo server listening on http://localhost:{}",
        port
    );
    println!(
        "Using Redis at {}:{} with cache TTL {}s",
        redis_host, redis_port, ttl
    );
    println!("Mock primary read latency: {} ms", primary_latency_ms);
    axum::serve(listener, app).await.expect("server failed");
}

async fn index(State(state): State<AppState>) -> Response {
    let html = render_html_page(
        &state.primary.list_ids(),
        state.primary.read_latency_ms,
        state.cache.ttl(),
    );
    ([(header::CONTENT_TYPE, "text/html; charset=utf-8")], html).into_response()
}

async fn products(State(state): State<AppState>) -> Json<Value> {
    Json(json!({ "products": state.primary.list_ids() }))
}

#[derive(Deserialize)]
struct ReadParams {
    id: Option<String>,
}

async fn read(
    State(state): State<AppState>,
    Query(params): Query<ReadParams>,
) -> Response {
    let id = params.id.unwrap_or_default();
    if id.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "Missing 'id' query parameter.");
    }
    let started = Instant::now();
    let primary = state.primary.clone();
    let result = match state
        .cache
        .get(&id, |key| {
            let primary = primary.clone();
            async move { primary.read(&key).await }
        })
        .await
    {
        Ok(r) => r,
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let total_ms = started.elapsed().as_secs_f64() * 1000.0;
    if result.record.is_none() {
        return error_json(StatusCode::NOT_FOUND, &format!("No record for '{}'.", id));
    }
    let ttl = state.cache.ttl_remaining(&id).await.unwrap_or(-2);
    Json(json!({
        "id": id,
        "record": result.record,
        "hit": result.hit,
        "redis_latency_ms": round2(result.redis_latency_ms),
        "total_latency_ms": round2(total_ms),
        "ttl_remaining": ttl,
        "stats": build_stats(&state),
    }))
    .into_response()
}

async fn stats_handler(State(state): State<AppState>) -> Json<Value> {
    Json(build_stats(&state))
}

#[derive(Deserialize)]
struct InvalidateForm {
    id: String,
}

async fn invalidate(State(state): State<AppState>, Form(form): Form<InvalidateForm>) -> Response {
    let deleted = state.cache.invalidate(&form.id).await.unwrap_or(false);
    Json(json!({
        "id": form.id,
        "deleted": deleted,
        "stats": build_stats(&state),
    }))
    .into_response()
}

#[derive(Deserialize)]
struct UpdateForm {
    id: String,
    field: String,
    value: String,
}

async fn update(State(state): State<AppState>, Form(form): Form<UpdateForm>) -> Response {
    if !state.primary.update_field(&form.id, &form.field, &form.value) {
        return error_json(StatusCode::NOT_FOUND, "Unknown product.");
    }
    let _ = state.cache.invalidate(&form.id).await;
    Json(json!({
        "id": form.id,
        "field": form.field,
        "value": form.value,
        "stats": build_stats(&state),
    }))
    .into_response()
}

#[derive(Deserialize)]
struct StampedeForm {
    id: String,
    concurrency: Option<usize>,
}

async fn stampede(State(state): State<AppState>, Form(form): Form<StampedeForm>) -> Response {
    let concurrency = form
        .concurrency
        .unwrap_or(20)
        .clamp(2, 50);

    let _ = state.cache.invalidate(&form.id).await;
    let primary_before = state.primary.reads();
    let started = Instant::now();

    let mut handles = Vec::with_capacity(concurrency);
    for _ in 0..concurrency {
        let cache = state.cache.clone();
        let primary = state.primary.clone();
        let id = form.id.clone();
        handles.push(tokio::spawn(async move {
            cache
                .get(&id, |key| {
                    let primary = primary.clone();
                    async move { primary.read(&key).await }
                })
                .await
        }));
    }

    let mut results = Vec::with_capacity(concurrency);
    for h in handles {
        match h.await {
            Ok(Ok(r)) => results.push(json!({
                "hit": r.hit,
                "redis_latency_ms": round2(r.redis_latency_ms),
                "found": r.record.is_some(),
            })),
            _ => results.push(json!({
                "hit": false,
                "redis_latency_ms": 0.0,
                "found": false,
            })),
        }
    }
    let elapsed_ms = started.elapsed().as_secs_f64() * 1000.0;
    let primary_during = state.primary.reads() - primary_before;

    Json(json!({
        "id": form.id,
        "concurrency": concurrency,
        "primary_reads": primary_during,
        "elapsed_ms": round2(elapsed_ms),
        "results": results,
        "stats": build_stats(&state),
    }))
    .into_response()
}

async fn reset(State(state): State<AppState>) -> Json<Value> {
    state.cache.reset_stats();
    state.primary.reset_reads();
    Json(build_stats(&state))
}

fn build_stats(state: &AppState) -> Value {
    let mut stats = state.cache.stats();
    if let Some(obj) = stats.as_object_mut() {
        obj.insert("primary_reads_total".to_string(), json!(state.primary.reads()));
        obj.insert(
            "primary_read_latency_ms".to_string(),
            json!(state.primary.read_latency_ms),
        );
    }
    stats
}

fn error_json(status: StatusCode, message: &str) -> Response {
    (status, Json(json!({ "error": message }))).into_response()
}

fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

fn html_escape(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for c in value.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

fn render_html_page(product_ids: &[String], primary_latency_ms: u64, cache_ttl: usize) -> String {
    let options: String = product_ids
        .iter()
        .map(|id| {
            let safe = html_escape(id);
            format!("<option value=\"{}\">{}</option>", safe, safe)
        })
        .collect();
    HTML_TEMPLATE
        .replace("{{OPTIONS}}", &options)
        .replace("{{PRIMARY_LATENCY}}", &primary_latency_ms.to_string())
        .replace("{{CACHE_TTL}}", &cache_ttl.to_string())
}

const HTML_TEMPLATE: &str = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Cache-Aside Demo</title>
  <style>
    :root { --bg:#f6f1e8;--panel:#fffaf2;--ink:#1f2933;--accent:#b8572f;--accent-dark:#8f421f;
      --muted:#5d6b75;--line:#e7d9c6;--ok:#d7f0de;--warn:#f7dfd7;--hit:#c9e7d2;--miss:#f5d6c6; }
    * { box-sizing:border-box; }
    body { margin:0;font-family:Georgia,"Times New Roman",serif;color:var(--ink);
      background:radial-gradient(circle at top left,#fff7ea,transparent 32rem),
        linear-gradient(180deg,#f3ecdf 0%,var(--bg) 100%);min-height:100vh; }
    main { max-width:980px;margin:0 auto;padding:48px 20px 72px; }
    h1 { font-size:clamp(2.2rem,5vw,4rem);line-height:1;margin-bottom:12px; }
    p.lede { max-width:52rem;font-size:1.1rem;color:var(--muted); }
    .grid { display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:28px; }
    .panel { background:rgba(255,250,242,0.92);border:1px solid var(--line);border-radius:18px;
      padding:22px;box-shadow:0 16px 50px rgba(105,74,45,0.08); }
    .panel h2 { margin-top:0;margin-bottom:10px; }
    .pill { display:inline-block;border-radius:999px;background:#efe2cf;color:var(--accent-dark);
      padding:6px 10px;font-size:0.9rem;margin-bottom:12px; }
    label { display:block;font-weight:bold;margin:12px 0 6px; }
    input,select { width:100%;padding:10px 12px;border-radius:10px;border:1px solid #cfbca6;font:inherit;background:white; }
    button { appearance:none;border:0;border-radius:999px;background:var(--accent);color:white;
      padding:11px 18px;font:inherit;cursor:pointer;margin-right:8px;margin-top:12px; }
    button.secondary { background:#38424a; }
    button:hover { background:var(--accent-dark); }
    button.secondary:hover { background:#20282e; }
    dl { display:grid;grid-template-columns:max-content 1fr;gap:8px 14px;margin:0; }
    dt { font-weight:bold; } dd { margin:0;word-break:break-word; }
    .badge { display:inline-block;border-radius:6px;padding:3px 8px;font-size:0.85rem;font-weight:bold; }
    .badge.hit { background:var(--hit);color:#1d4a2c; }
    .badge.miss { background:var(--miss);color:#6b3220; }
    #status { margin-top:20px;padding:14px 16px;border-radius:14px;display:none; }
    #status.ok { display:block;background:var(--ok); }
    #status.error { display:block;background:var(--warn); }
    @media (max-width:600px){ main{padding-top:28px;} button{width:100%;} }
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-rs + Axum demo</div>
    <h1>Redis Cache-Aside Demo</h1>
    <p class="lede">
      Read product records through Redis. The first read of any key falls
      through to a deliberately slow primary store ({{PRIMARY_LATENCY}} ms per
      read); subsequent reads come from Redis until the {{CACHE_TTL}}-second TTL
      expires or the entry is invalidated. The stampede test fires concurrent
      reads at a cold key to show a single-flight Lua lock funnelling them
      down to one primary read.
    </p>
    <div class="grid">
      <section class="panel">
        <h2>Read a product</h2>
        <label for="product-id">Product ID</label>
        <select id="product-id">{{OPTIONS}}</select>
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
    function setStatus(message, kind) { statusBox.textContent = message; statusBox.className = kind; }
    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
    function renderStats(stats) {
      if (!stats) { statsView.textContent = "(no data)"; return; }
      statsView.innerHTML = `<dl>
        <dt>Hits</dt><dd>${stats.hits}</dd>
        <dt>Misses</dt><dd>${stats.misses}</dd>
        <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
        <dt>Stampedes suppressed</dt><dd>${stats.stampedes_suppressed}</dd>
        <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
        <dt>Primary read latency</dt><dd>${stats.primary_read_latency_ms} ms</dd>
      </dl>`;
    }
    function renderRead(data) {
      if (!data || !data.record) { resultView.innerHTML = "<p>(no record)</p>"; return; }
      const r = data.record;
      const badge = data.hit ? '<span class="badge hit">cache hit</span>' : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = `<p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
        &nbsp; Total: <strong>${data.total_latency_ms} ms</strong>
        &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
          <dt>price_cents</dt><dd>${escapeHtml(r.price_cents ?? "")}</dd>
          <dt>stock</dt><dd>${escapeHtml(r.stock ?? "")}</dd>
        </dl>`;
    }
    function renderStampede(data) {
      const hits = data.results.filter((r) => r.hit).length;
      const misses = data.results.length - hits;
      resultView.innerHTML = `<p>Fired <strong>${data.concurrency}</strong> concurrent reads in
        <strong>${data.elapsed_ms}</strong> ms.</p>
        <p>Cache misses: <strong>${misses}</strong> &nbsp;
           Cache hits: <strong>${hits}</strong> &nbsp;
           Primary reads: <strong>${data.primary_reads}</strong></p>
        <p>With stampede protection, primary reads should be 1 even though all
           ${data.concurrency} callers raced for a cold key. Without it, every
           concurrent miss would query the primary independently.</p>`;
    }
    async function loadStats() { renderStats(await (await fetch("/stats")).json()); }
    document.getElementById("read-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch(`/read?id=${encodeURIComponent(id)}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
      renderRead(d); renderStats(d.stats);
      setStatus(d.hit ? "Served from Redis." : "Loaded from primary and cached.", "ok");
    });
    document.getElementById("invalidate-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch("/invalidate", { method: "POST", body: new URLSearchParams({ id }) });
      const d = await r.json();
      renderStats(d.stats);
      setStatus(d.deleted ? "Cache key deleted." : "No cache entry to delete.", "ok");
    });
    document.getElementById("update-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch("/update", { method: "POST",
        body: new URLSearchParams({ id, field: updateField.value, value: updateValue.value }) });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
      renderStats(d.stats); setStatus("Primary updated; cache invalidated.", "ok");
    });
    document.getElementById("stampede-button").addEventListener("click", async () => {
      const id = productSelect.value;
      setStatus("Running stampede test...", "ok");
      const r = await fetch("/stampede", { method: "POST",
        body: new URLSearchParams({ id, concurrency: stampedeConcurrency.value }) });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Test failed.", "error"); return; }
      renderStampede(d); renderStats(d.stats);
      setStatus(`Stampede complete: ${d.primary_reads} primary read(s) for ${d.concurrency} concurrent callers.`, "ok");
    });
    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      renderStats(await r.json()); setStatus("Counters reset.", "ok");
    });
    loadStats();
  </script>
</body>
</html>
"##;
