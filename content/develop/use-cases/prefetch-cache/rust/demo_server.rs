//! Redis prefetch-cache demo server.
//!
//! Run this demo and visit http://localhost:8790 to watch a prefetch
//! cache in action: the demo bulk-loads every primary record into Redis
//! on startup, runs a background sync worker that applies primary
//! mutations within milliseconds, and lets you add, update, delete, and
//! re-prefetch records to see how the cache stays current without ever
//! falling back to the primary on the read path.

mod cache;
mod primary;
mod sync_worker;

use std::env;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::{
    extract::{Form, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use redis::aio::ConnectionManager;
use redis::Client;
use serde::Deserialize;
use serde_json::{json, Value};

use cache::{CacheConfig, PrefetchCache};
use primary::MockPrimaryStore;
use sync_worker::SyncWorker;

#[derive(Clone)]
struct AppState {
    cache: PrefetchCache,
    primary: Arc<MockPrimaryStore>,
    sync: Arc<SyncWorker>,
}

#[tokio::main]
async fn main() {
    let mut host = String::from("127.0.0.1");
    let mut port: u16 = 8790;
    let mut redis_host = env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
    let mut redis_port: u16 = env::var("REDIS_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(6379);
    let mut cache_prefix = String::from("cache:category:");
    let mut ttl_seconds: i64 = 3600;
    let mut primary_latency_ms: u64 = 80;

    let args: Vec<String> = env::args().collect();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--host" if i + 1 < args.len() => {
                host = args[i + 1].clone();
                i += 2;
            }
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
            "--cache-prefix" if i + 1 < args.len() => {
                cache_prefix = args[i + 1].clone();
                i += 2;
            }
            "--ttl-seconds" if i + 1 < args.len() => {
                ttl_seconds = args[i + 1].parse().expect("invalid --ttl-seconds");
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

    let cache = PrefetchCache::new(
        conn,
        CacheConfig {
            prefix: cache_prefix.clone(),
            ttl_seconds,
        },
    );
    let primary = MockPrimaryStore::new(primary_latency_ms);
    let sync = Arc::new(SyncWorker::new(primary.clone(), cache.clone()));

    let started = Instant::now();
    let _ = cache.clear().await.unwrap_or(0);
    let records = primary.list_records().await;
    let loaded = cache.bulk_load(records).await.unwrap_or(0);
    let elapsed_ms = started.elapsed().as_secs_f64() * 1000.0;
    sync.start().await;

    println!(
        "Redis prefetch-cache demo server listening on http://{}:{}",
        host, port
    );
    println!(
        "Using Redis at {}:{} with cache prefix '{}' and TTL {}s",
        redis_host, redis_port, cache_prefix, ttl_seconds
    );
    println!(
        "Prefetched {} records in {:.1} ms; sync worker running",
        loaded, elapsed_ms
    );

    let state = AppState {
        cache,
        primary,
        sync: sync.clone(),
    };

    let app = Router::new()
        .route("/", get(index))
        .route("/categories", get(categories))
        .route("/read", get(read))
        .route("/stats", get(stats_handler))
        .route("/update", post(update))
        .route("/add", post(add))
        .route("/delete", post(delete))
        .route("/invalidate", post(invalidate))
        .route("/clear", post(clear))
        .route("/reprefetch", post(reprefetch))
        .route("/reset", post(reset))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind((host.as_str(), port))
        .await
        .expect("failed to bind");
    let serve = axum::serve(listener, app);
    if let Err(err) = serve.await {
        eprintln!("server error: {}", err);
    }
    sync.stop(Duration::from_secs(2)).await;
}

async fn index(State(state): State<AppState>) -> Response {
    let html = render_html_page(state.cache.ttl_seconds());
    ([(header::CONTENT_TYPE, "text/html; charset=utf-8")], html).into_response()
}

async fn categories(State(state): State<AppState>) -> Response {
    let cache_ids = state.cache.ids().await.unwrap_or_default();
    let primary_ids = state.primary.list_ids().await;
    Json(json!({
        "cache_ids": cache_ids,
        "primary_ids": primary_ids,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct ReadParams {
    id: Option<String>,
}

async fn read(State(state): State<AppState>, Query(params): Query<ReadParams>) -> Response {
    let id = params.id.unwrap_or_default();
    if id.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "Missing 'id'.");
    }
    let result = match state.cache.get(&id).await {
        Ok(r) => r,
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let ttl = state.cache.ttl_remaining(&id).await.unwrap_or(-2);
    Json(json!({
        "id": id,
        "record": result.record,
        "hit": result.hit,
        "redis_latency_ms": round2(result.redis_latency_ms),
        "ttl_remaining": ttl,
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

async fn stats_handler(State(state): State<AppState>) -> Json<Value> {
    Json(build_stats(&state).await)
}

#[derive(Deserialize)]
struct UpdateForm {
    id: String,
    field: String,
    value: Option<String>,
}

async fn update(State(state): State<AppState>, Form(form): Form<UpdateForm>) -> Response {
    if form.id.is_empty() || form.field.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "Missing 'id' or 'field'.");
    }
    let value = form.value.unwrap_or_default();
    if !state.primary.update_field(&form.id, &form.field, &value).await {
        return error_json(
            StatusCode::NOT_FOUND,
            &format!("Unknown category '{}'.", form.id),
        );
    }
    Json(json!({
        "id": form.id,
        "field": form.field,
        "value": value,
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct AddForm {
    id: String,
    name: String,
    display_order: Option<String>,
    featured: Option<String>,
    parent_id: Option<String>,
}

async fn add(State(state): State<AppState>, Form(form): Form<AddForm>) -> Response {
    let entity_id = form.id.trim().to_string();
    let name = form.name.trim().to_string();
    if entity_id.is_empty() || name.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "Missing 'id' or 'name'.");
    }
    let display_order = form
        .display_order
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "99".to_string());
    let featured = form
        .featured
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "false".to_string());
    let parent_id = form.parent_id.unwrap_or_default();

    let mut record = std::collections::HashMap::new();
    record.insert("id".to_string(), entity_id.clone());
    record.insert("name".to_string(), name);
    record.insert("display_order".to_string(), display_order);
    record.insert("featured".to_string(), featured);
    record.insert("parent_id".to_string(), parent_id);

    if !state.primary.add_record(record.clone()).await {
        return error_json(
            StatusCode::CONFLICT,
            &format!("Category '{}' already exists.", entity_id),
        );
    }
    Json(json!({
        "id": entity_id,
        "record": record,
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct IdForm {
    id: String,
}

async fn delete(State(state): State<AppState>, Form(form): Form<IdForm>) -> Response {
    if form.id.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "Missing 'id'.");
    }
    if !state.primary.delete_record(&form.id).await {
        return error_json(
            StatusCode::NOT_FOUND,
            &format!("Unknown category '{}'.", form.id),
        );
    }
    Json(json!({
        "id": form.id,
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

async fn invalidate(State(state): State<AppState>, Form(form): Form<IdForm>) -> Response {
    if form.id.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "Missing 'id'.");
    }
    let deleted = state.cache.invalidate(&form.id).await.unwrap_or(false);
    Json(json!({
        "id": form.id,
        "deleted": deleted,
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

async fn clear(State(state): State<AppState>) -> Response {
    // Pause the sync worker so it cannot recreate keys between SCAN
    // and DEL. Queued events accumulate and apply after resume.
    let _ = state.sync.pause(Duration::from_secs(2)).await;
    let deleted = state.cache.clear().await.unwrap_or(0);
    state.sync.resume().await;
    Json(json!({
        "deleted": deleted,
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

async fn reprefetch(State(state): State<AppState>) -> Response {
    // Pause the sync worker so it cannot interleave with the clear +
    // snapshot + bulk_load sequence. Without this, a change applied
    // between list_records() and bulk_load() would be overwritten by
    // the stale snapshot.
    let _ = state.sync.pause(Duration::from_secs(2)).await;
    let started = Instant::now();
    let _ = state.cache.clear().await.unwrap_or(0);
    let records = state.primary.list_records().await;
    let loaded = state.cache.bulk_load(records).await.unwrap_or(0);
    let elapsed_ms = started.elapsed().as_secs_f64() * 1000.0;
    state.sync.resume().await;
    Json(json!({
        "loaded": loaded,
        "elapsed_ms": round2(elapsed_ms),
        "stats": build_stats(&state).await,
    }))
    .into_response()
}

async fn reset(State(state): State<AppState>) -> Json<Value> {
    state.cache.reset_stats();
    state.primary.reset_reads();
    Json(build_stats(&state).await)
}

async fn build_stats(state: &AppState) -> Value {
    let mut stats = state.cache.stats();
    if let Some(obj) = stats.as_object_mut() {
        obj.insert(
            "primary_reads_total".to_string(),
            json!(state.primary.reads()),
        );
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

fn render_html_page(cache_ttl: i64) -> String {
    HTML_TEMPLATE.replace("__CACHE_TTL__", &cache_ttl.to_string())
}

const HTML_TEMPLATE: &str = r##"<!DOCTYPE html>
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
    <div class="pill">redis-rs + axum/tokio</div>
    <h1>Redis Prefetch Cache Demo</h1>
    <p class="lede">
      Every record from the primary store has been pre-loaded into Redis.
      Reads run <code>HGETALL</code> against Redis only &mdash; there is no
      fall-back to the primary on the read path. When you add, update, or
      delete a record, the primary emits a change event that a background
      sync worker applies to Redis within a few milliseconds. A long
      safety-net TTL (__CACHE_TTL__ s) is refreshed on every add or update
      event (delete events remove the key) and bounds memory if sync ever stops.
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
      setStatus(d.hit ? "Served from Redis." : "Cache miss — no entry in Redis.", d.hit ? "ok" : "error");
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
"##;
