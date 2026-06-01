//! Redis feature-store demo server (Rust + redis-rs + axum + tokio).
//!
//! Run with `cargo run --release --bin demo_server` and visit
//! <http://localhost:8090> to watch an online feature store at work:
//! a batch materialization loads N users with a 24-hour key-level
//! TTL, a streaming worker overwrites a handful of users' real-time
//! features every second with a per-field `HEXPIRE`, and the
//! inference panel reads any subset of features for any user with
//! `HMGET` in a single round trip.

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{get, post},
    Router,
};
// `axum-extra`'s Form extractor wraps `serde_html_form`, which (unlike
// axum's default `Form`/`serde_urlencoded`) keeps every value when a
// form key repeats. That's what lets `field=a&field=b` deserialize as
// `Vec<String>` in `ReadForm` and `BatchReadForm` below.
use axum_extra::extract::Form;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use feature_store_demo::build_features::synthesize_users;
use feature_store_demo::feature_store::{
    FeatureStore, Stats, DEFAULT_BATCH_FIELDS, DEFAULT_STREAMING_FIELDS,
};
use feature_store_demo::streaming_worker::{StreamingWorker, WorkerStats};

#[derive(Clone)]
struct AppState {
    store: FeatureStore,
    worker: StreamingWorker,
    key_prefix: String,
    /// Serializes materialize / reset / toggle-worker against each
    /// other so the streaming-worker pause-and-wait-idle dance can't
    /// race with a concurrent bulk-load.
    demo_lock: Arc<Mutex<()>>,
    seed: u64,
}

#[derive(Debug, Clone)]
struct Args {
    host: String,
    port: u16,
    redis_url: String,
    key_prefix: String,
    batch_ttl_seconds: u64,
    streaming_ttl_seconds: u64,
    users_per_tick: usize,
    seed_users: usize,
    reset_on_start: bool,
}

impl Default for Args {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".into(),
            port: 8090,
            redis_url: "redis://127.0.0.1/".into(),
            key_prefix: "fs:user:".into(),
            batch_ttl_seconds: 24 * 60 * 60,
            streaming_ttl_seconds: 5 * 60,
            users_per_tick: 5,
            seed_users: 200,
            reset_on_start: true,
        }
    }
}

fn parse_args() -> Args {
    let mut a = Args::default();
    let argv: Vec<String> = std::env::args().skip(1).collect();
    let need_value = |flag: &str, idx: usize| -> &String {
        argv.get(idx + 1).unwrap_or_else(|| {
            eprintln!("Missing value for {flag}");
            std::process::exit(2);
        })
    };
    let mut i = 0usize;
    while i < argv.len() {
        match argv[i].as_str() {
            "--host" => { a.host = need_value("--host", i).clone(); i += 2; }
            "--port" => { a.port = need_value("--port", i).parse().unwrap_or(a.port); i += 2; }
            "--redis-url" => { a.redis_url = need_value("--redis-url", i).clone(); i += 2; }
            "--key-prefix" => { a.key_prefix = need_value("--key-prefix", i).clone(); i += 2; }
            "--batch-ttl-seconds" => { a.batch_ttl_seconds = need_value("--batch-ttl-seconds", i).parse().unwrap_or(a.batch_ttl_seconds); i += 2; }
            "--streaming-ttl-seconds" => { a.streaming_ttl_seconds = need_value("--streaming-ttl-seconds", i).parse().unwrap_or(a.streaming_ttl_seconds); i += 2; }
            "--users-per-tick" => { a.users_per_tick = need_value("--users-per-tick", i).parse().unwrap_or(a.users_per_tick); i += 2; }
            "--seed-users" => { a.seed_users = need_value("--seed-users", i).parse().unwrap_or(a.seed_users); i += 2; }
            "--no-reset" => { a.reset_on_start = false; i += 1; }
            "-h" | "--help" => {
                println!("Usage: demo_server [--host H] [--port P] [--redis-url URL] [--key-prefix PFX] [--batch-ttl-seconds S] [--streaming-ttl-seconds S] [--users-per-tick N] [--seed-users N] [--no-reset]");
                std::process::exit(0);
            }
            other => {
                eprintln!("Unknown argument: {other}");
                std::process::exit(2);
            }
        }
    }
    a
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args = parse_args();
    let client = redis::Client::open(args.redis_url.as_str())?;
    let conn = redis::aio::ConnectionManager::new(client).await?;
    let store = FeatureStore::new(
        conn,
        args.key_prefix.clone(),
        args.batch_ttl_seconds,
        args.streaming_ttl_seconds,
    );

    if args.reset_on_start {
        println!(
            "Dropping any existing users under '{}*' for a clean demo run (pass --no-reset to keep them).",
            args.key_prefix
        );
        store.reset().await?;
        store.reset_stats();
    }

    let rows = synthesize_users(args.seed_users, 42);
    let seeded = store.bulk_load(&rows, args.batch_ttl_seconds).await?;

    let worker = StreamingWorker::new(
        store.clone(),
        Duration::from_secs(1),
        args.users_per_tick,
        1337,
    );
    worker.start().await;

    let state = AppState {
        store,
        worker,
        key_prefix: args.key_prefix.clone(),
        demo_lock: Arc::new(Mutex::new(())),
        seed: 42,
    };

    let app = Router::new()
        .route("/", get(index))
        .route("/state", get(get_state))
        .route("/inspect", get(inspect))
        .route("/bulk-load", post(bulk_load))
        .route("/reset", post(reset))
        .route("/worker/toggle", post(toggle_worker))
        .route("/read", post(read))
        .route("/batch-read", post(batch_read))
        .with_state(state);

    let addr: SocketAddr = format!("{}:{}", args.host, args.port).parse()?;
    println!("Redis feature-store demo server listening on http://{}", addr);
    println!(
        "Using Redis at {} with key prefix '{}' (batch TTL {}s, streaming TTL {}s)",
        args.redis_url, args.key_prefix, args.batch_ttl_seconds, args.streaming_ttl_seconds
    );
    println!("Materialized {} user(s); streaming worker running.", seeded);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

// ---------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------

async fn index(State(state): State<AppState>) -> Html<String> {
    Html(render_html_page(&state.key_prefix,
        state.store.streaming_ttl_seconds(),
        state.worker.users_per_tick()))
}

#[derive(Serialize)]
struct StateResponse {
    key_prefix: String,
    batch_ttl_seconds: u64,
    streaming_ttl_seconds: u64,
    entity_count: i64,
    entity_ids: Vec<String>,
    stats: Stats,
    worker: WorkerStats,
}

async fn get_state(State(state): State<AppState>) -> impl IntoResponse {
    let ids = state.store.list_entity_ids(500).await.unwrap_or_default();
    let count = state.store.count_entities().await.unwrap_or(0);
    Json(StateResponse {
        key_prefix: state.store.key_prefix().to_string(),
        batch_ttl_seconds: state.store.batch_ttl_seconds(),
        streaming_ttl_seconds: state.store.streaming_ttl_seconds(),
        entity_count: count,
        entity_ids: ids,
        stats: state.store.stats(),
        worker: state.worker.stats(),
    })
}

#[derive(Deserialize)]
struct InspectParams { user: Option<String> }

async fn inspect(
    State(state): State<AppState>,
    Query(params): Query<InspectParams>,
) -> impl IntoResponse {
    let user = params.user.unwrap_or_default();
    if user.is_empty() {
        return (StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "user is required"})));
    }
    let full = match state.store.get_all_features(&user).await {
        Ok(m) => m,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()}))),
    };
    let key_ttl = state.store.key_ttl_seconds(&user).await.unwrap_or(-2);
    if full.is_empty() {
        return (StatusCode::OK,
            Json(serde_json::json!({"exists": false, "key_ttl_seconds": key_ttl})));
    }
    // Iterate the known schema (batch + streaming) plus any extras
    // the hash carries so expired streaming fields surface as
    // ttl_seconds=-2 in the Inspect view rather than silently
    // disappearing.
    let mut names: Vec<String> = DEFAULT_BATCH_FIELDS.iter().map(|s| s.to_string()).collect();
    names.extend(DEFAULT_STREAMING_FIELDS.iter().map(|s| s.to_string()));
    for k in full.keys() {
        if !names.contains(k) { names.push(k.clone()); }
    }
    let names_ref: Vec<&str> = names.iter().map(|s| s.as_str()).collect();
    let ttls = state
        .store
        .field_ttls_seconds(&user, &names_ref)
        .await
        .unwrap_or_default();
    let mut fields: Vec<serde_json::Value> = names
        .iter()
        .map(|n| serde_json::json!({
            "name": n,
            "value": full.get(n).cloned().unwrap_or_default(),
            "ttl_seconds": ttls.get(n).copied().unwrap_or(-2),
        }))
        .collect();
    fields.sort_by(|a, b| a["name"].as_str().cmp(&b["name"].as_str()));
    (StatusCode::OK, Json(serde_json::json!({
        "exists": true,
        "key_ttl_seconds": key_ttl,
        "fields": fields,
    })))
}

#[derive(Deserialize)]
struct BulkLoadForm { count: Option<i64>, ttl: Option<i64> }

async fn bulk_load(
    State(state): State<AppState>,
    Form(form): Form<BulkLoadForm>,
) -> impl IntoResponse {
    let _guard = state.demo_lock.lock().await;
    let count = clamp(form.count.unwrap_or(200), 1, 2000) as usize;
    let ttl = clamp(form.ttl.unwrap_or(86400), 5, 172_800) as u64;
    let rows = synthesize_users(count, state.seed);
    let start = Instant::now();
    let loaded = match state.store.bulk_load(&rows, ttl).await {
        Ok(n) => n,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()}))),
    };
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
    (StatusCode::OK, Json(serde_json::json!({
        "loaded": loaded,
        "ttl_seconds": ttl,
        "elapsed_ms": elapsed_ms,
    })))
}

async fn reset(State(state): State<AppState>) -> impl IntoResponse {
    let _guard = state.demo_lock.lock().await;
    // Pause + wait-for-idle around the DEL sweep so a concurrent
    // tick can't recreate a user that was just enumerated for
    // deletion (streaming HSET creates the key if it's missing,
    // leaving a streaming-only hash with no key-level TTL).
    let was_paused = state.worker.is_paused();
    if state.worker.is_running() {
        if !was_paused { state.worker.pause(); }
        state.worker.wait_for_idle().await;
    }
    let result = state.store.reset().await;
    state.store.reset_stats();
    state.worker.reset_stats();
    if state.worker.is_running() && !was_paused { state.worker.resume(); }
    match result {
        Ok(n) => (StatusCode::OK, Json(serde_json::json!({"deleted": n}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": e.to_string()}))),
    }
}

async fn toggle_worker(State(state): State<AppState>) -> impl IntoResponse {
    let _guard = state.demo_lock.lock().await;
    if !state.worker.is_running() {
        state.worker.start().await;
    }
    if state.worker.is_paused() {
        state.worker.resume();
    } else {
        state.worker.pause();
    }
    Json(serde_json::json!({
        "paused": state.worker.is_paused(),
        "running": state.worker.is_running(),
    }))
}

#[derive(Deserialize)]
struct ReadForm {
    user: Option<String>,
    #[serde(default)]
    field: Vec<String>,
}

async fn read(
    State(state): State<AppState>,
    Form(form): Form<ReadForm>,
) -> impl IntoResponse {
    let user = form.user.unwrap_or_default();
    if user.is_empty() {
        return (StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": "user is required"})));
    }
    let fields: Vec<String> = form
        .field
        .into_iter()
        .filter(|f| !f.is_empty())
        .collect();
    let field_refs: Vec<&str> = fields.iter().map(|s| s.as_str()).collect();
    let start = Instant::now();
    let values = state
        .store
        .get_features(&user, &field_refs)
        .await
        .unwrap_or_default();
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
    let ttls = state
        .store
        .field_ttls_seconds(&user, &field_refs)
        .await
        .unwrap_or_default();
    let key_ttl = state.store.key_ttl_seconds(&user).await.unwrap_or(-2);
    (StatusCode::OK, Json(serde_json::json!({
        "requested": fields,
        "values": values,
        "ttls": ttls,
        "key_ttl_seconds": key_ttl,
        "returned_count": values.len(),
        "elapsed_ms": elapsed_ms,
    })))
}

#[derive(Deserialize)]
struct BatchReadForm {
    count: Option<i64>,
    #[serde(default)]
    field: Vec<String>,
}

async fn batch_read(
    State(state): State<AppState>,
    Form(form): Form<BatchReadForm>,
) -> impl IntoResponse {
    let count = clamp(form.count.unwrap_or(100), 1, 500) as usize;
    let mut fields: Vec<String> = form
        .field
        .into_iter()
        .filter(|f| !f.is_empty())
        .collect();
    if fields.is_empty() {
        fields = DEFAULT_STREAMING_FIELDS.iter().map(|s| s.to_string()).collect();
        fields.push("risk_segment".into());
    }
    let field_refs: Vec<&str> = fields.iter().map(|s| s.as_str()).collect();

    let all_ids = state
        .store
        .list_entity_ids(count.saturating_mul(2).max(2000))
        .await
        .unwrap_or_default();
    let ids: Vec<String> = all_ids.into_iter().take(count).collect();
    let start = Instant::now();
    let rows = state
        .store
        .batch_get_features(&ids, &field_refs)
        .await
        .unwrap_or_default();
    let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
    let sample: Vec<serde_json::Value> = ids
        .iter()
        .take(10)
        .map(|id| serde_json::json!({
            "id": id,
            "field_count": rows.get(id).map(|r| r.len()).unwrap_or(0),
        }))
        .collect();
    (StatusCode::OK, Json(serde_json::json!({
        "entity_count": ids.len(),
        "field_count": fields.len(),
        "elapsed_ms": elapsed_ms,
        "sample": sample,
    })))
}

fn clamp(v: i64, lo: i64, hi: i64) -> i64 {
    v.max(lo).min(hi)
}

fn render_html_page(key_prefix: &str, streaming_ttl: u64, users_per_tick: usize) -> String {
    let batch_json = serde_json::to_string(&DEFAULT_BATCH_FIELDS).unwrap();
    let stream_json = serde_json::to_string(&DEFAULT_STREAMING_FIELDS).unwrap();
    HTML_TEMPLATE
        .replace("__KEY_PREFIX__", key_prefix)
        .replace("__STREAM_TTL__", &streaming_ttl.to_string())
        .replace("__USERS_PER_TICK__", &users_per_tick.to_string())
        .replace("__BATCH_FIELDS_JSON__", &batch_json)
        .replace("__STREAM_FIELDS_JSON__", &stream_json)
}

const HTML_TEMPLATE: &str = include_str!("./demo_template.html");
