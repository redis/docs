//! Redis streaming demo server.
//!
//! Run this file and visit http://localhost:8788 to watch a Redis Stream
//! in action: producers append events to a single stream, two
//! independent consumer groups read the same stream at their own pace,
//! and within the `notifications` group two consumers share the work.
//!
//! Use the UI to:
//!
//! * Produce events into the stream.
//! * Watch each consumer group's last-delivered ID, PEL count, and the
//!   consumers inside it.
//! * Drop the next `N` messages from a chosen consumer to simulate a
//!   crash mid-processing, then run `XAUTOCLAIM` to reassign the stuck
//!   entries to a healthy consumer.
//! * Replay any ID range with `XRANGE` to confirm the history is
//!   independent of consumer-group state.
//! * Trim the stream with `XTRIM` to bound retention.

mod consumer_worker;
mod event_stream;

use std::collections::{HashMap, HashSet};
use std::env;
use std::sync::Arc;

use axum::{
    extract::{Form, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use rand::seq::SliceRandom;
use rand::Rng;
use redis::aio::ConnectionManager;
use redis::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use tokio::sync::Mutex;

use consumer_worker::{ConsumerStatus, ConsumerWorker};
use event_stream::EventStream;

const EVENT_TYPES: &[&str] = &[
    "order.placed",
    "order.paid",
    "order.shipped",
    "order.cancelled",
];
const CUSTOMERS: &[&str] = &["alice", "bob", "carol", "dan", "erin"];

fn default_groups() -> Vec<(&'static str, Vec<&'static str>)> {
    vec![
        ("notifications", vec!["worker-a", "worker-b"]),
        ("analytics", vec!["worker-c"]),
    ]
}

type WorkerKey = (String, String);

/// In-memory registry of consumer workers across all groups.
///
/// Every mutation goes through `lock` — the registry mutex is held for
/// the entire check + spawn + insert sequence so two concurrent calls
/// to `add_worker` for the same `(group, name)` cannot both succeed.
/// Audit-checklist row 18 (Concurrent-name reservation race in async
/// helpers): holding a `tokio::sync::Mutex` across `.await` lets the
/// reservation be atomic against any concurrent caller, since
/// `tokio::sync::Mutex` is `Send` (unlike `std::sync::Mutex`, which we
/// could not hold across the `start().await` inside `add_worker`).
struct StreamingDemo {
    stream: EventStream,
    /// Single mutex guards both the registry and any in-flight
    /// reservation. `add_worker` and `remove_worker` hold it for the
    /// duration of the spawn / handover / delconsumer sequence.
    workers: Mutex<HashMap<WorkerKey, Arc<ConsumerWorker>>>,
}

impl StreamingDemo {
    fn new(stream: EventStream) -> Arc<Self> {
        Arc::new(Self {
            stream,
            workers: Mutex::new(HashMap::new()),
        })
    }

    async fn seed(self: &Arc<Self>, groups: &[(&str, Vec<&str>)]) -> usize {
        let mut total = 0;
        for (group, names) in groups {
            // Ignore errors — duplicate-create returns BUSYGROUP which
            // `ensure_group` already swallows, and a connection error
            // here will surface again on the first XADD.
            let _ = self.stream.ensure_group(group, "0-0").await;
            for name in names {
                let added = self.add_worker(group, name).await;
                if added {
                    total += 1;
                }
            }
        }
        total
    }

    /// Atomically reserve `(group, name)` and start the worker.
    ///
    /// Returns `true` on success, `false` if a worker with that name
    /// already exists. The registry mutex is held across the
    /// `worker.start().await` so two concurrent calls with the same
    /// name cannot both insert.
    async fn add_worker(self: &Arc<Self>, group: &str, name: &str) -> bool {
        let key: WorkerKey = (group.to_string(), name.to_string());
        let mut guard = self.workers.lock().await;
        if guard.contains_key(&key) {
            return false;
        }
        // ensure_group is idempotent; cheap to call from here.
        let _ = self.stream.ensure_group(group, "0-0").await;
        let worker = ConsumerWorker::new(self.stream.clone(), group, name);
        worker.start().await;
        guard.insert(key, worker);
        true
    }

    /// Remove a consumer safely.
    ///
    /// `XGROUP DELCONSUMER` destroys the consumer's PEL entries
    /// outright, so any pending message it still owned would become
    /// unreachable. Before deleting, hand its PEL off to another
    /// consumer in the same group with `XCLAIM`. Without a peer
    /// consumer to take over, refuse to delete and leave the worker in
    /// place so the user can add a peer first.
    async fn remove_worker(self: &Arc<Self>, group: &str, name: &str) -> RemoveResult {
        let key: WorkerKey = (group.to_string(), name.to_string());
        // Find the worker and a peer under the lock but DO NOT remove
        // yet. We release the lock for the (potentially slow) handover
        // so /state polls don't queue behind it, but the worker stays
        // in the registry so a failed handover doesn't strand a
        // half-removed consumer. XGROUP DELCONSUMER destroys the
        // source's PEL — only run it after handover has succeeded.
        let (worker, peer) = {
            let guard = self.workers.lock().await;
            let Some(worker) = guard.get(&key).cloned() else {
                return RemoveResult::not_found();
            };
            let peer: Option<String> = guard
                .keys()
                .find(|(g, n)| g == group && n != name)
                .map(|(_, n)| n.clone());
            let Some(peer) = peer else {
                return RemoveResult::no_peer(group, name);
            };
            (worker, peer)
        };

        let handed_over = match self
            .stream
            .handover_pending(group, name, &peer, 100)
            .await
        {
            Ok(n) => n,
            Err(err) => {
                return RemoveResult::handover_failed(group, name, &peer, &err.to_string());
            }
        };

        // Handover succeeded; now safe to remove from the registry,
        // stop the worker, and destroy the consumer record in Redis.
        {
            let mut guard = self.workers.lock().await;
            guard.remove(&key);
        }
        worker.stop().await;
        let _ = self.stream.delete_consumer(group, name).await;
        RemoveResult::removed(&peer, handed_over)
    }

    async fn get_worker(&self, group: &str, name: &str) -> Option<Arc<ConsumerWorker>> {
        let guard = self.workers.lock().await;
        guard
            .get(&(group.to_string(), name.to_string()))
            .cloned()
    }

    async fn snapshot(&self) -> Vec<(WorkerKey, Arc<ConsumerWorker>)> {
        let guard = self.workers.lock().await;
        guard
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    async fn stop_all(&self) {
        let workers: Vec<Arc<ConsumerWorker>> = {
            let mut guard = self.workers.lock().await;
            let drained: Vec<Arc<ConsumerWorker>> = guard.values().cloned().collect();
            guard.clear();
            drained
        };
        for worker in workers {
            worker.stop().await;
        }
    }

    async fn reset(self: &Arc<Self>) -> usize {
        self.stop_all().await;
        self.stream.delete_stream().await;
        self.stream.reset_stats();
        let groups = default_groups();
        let groups_ref: Vec<(&str, Vec<&str>)> = groups
            .iter()
            .map(|(g, n)| (*g, n.clone()))
            .collect();
        self.seed(&groups_ref).await
    }
}

#[derive(Debug, Clone, serde::Serialize)]
struct RemoveResult {
    removed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    handed_over_to: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    handed_over_count: Option<usize>,
}

impl RemoveResult {
    fn not_found() -> Self {
        Self {
            removed: false,
            reason: Some("not-found".to_string()),
            message: None,
            handed_over_to: None,
            handed_over_count: None,
        }
    }

    fn no_peer(group: &str, name: &str) -> Self {
        Self {
            removed: false,
            reason: Some("no-peer".to_string()),
            message: Some(format!(
                "{group}/{name} still owns pending entries and is the only \
                 consumer in its group; add another consumer first so its \
                 PEL can be handed over before deletion."
            )),
            handed_over_to: None,
            handed_over_count: None,
        }
    }

    fn removed(peer: &str, count: usize) -> Self {
        Self {
            removed: true,
            reason: None,
            message: None,
            handed_over_to: Some(peer.to_string()),
            handed_over_count: Some(count),
        }
    }

    fn handover_failed(group: &str, name: &str, peer: &str, err: &str) -> Self {
        Self {
            removed: false,
            reason: Some("handover-failed".to_string()),
            message: Some(format!(
                "Handover from {group}/{name} to {peer} failed before XGROUP DELCONSUMER \
                 could run: {err}. {group}/{name} is still in the group; retry the remove \
                 or investigate the Redis error before deleting (DELCONSUMER would destroy \
                 the source consumer's pending entries)."
            )),
            handed_over_to: None,
            handed_over_count: None,
        }
    }
}

#[derive(Clone)]
struct AppState {
    stream: EventStream,
    demo: Arc<StreamingDemo>,
    maxlen_approx: usize,
    claim_idle_ms: u64,
}

#[tokio::main]
async fn main() {
    let mut host = String::from("127.0.0.1");
    let mut port: u16 = 8788;
    let mut redis_host = env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
    let mut redis_port: u16 = env::var("REDIS_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(6379);
    let mut stream_key = String::from("demo:events:orders");
    let mut maxlen: usize = 2000;
    let mut claim_idle_ms: u64 = 5000;
    let mut reset_on_start = true;

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
            "--stream-key" if i + 1 < args.len() => {
                stream_key = args[i + 1].clone();
                i += 2;
            }
            "--maxlen" if i + 1 < args.len() => {
                maxlen = args[i + 1].parse().expect("invalid --maxlen");
                i += 2;
            }
            "--claim-idle-ms" if i + 1 < args.len() => {
                claim_idle_ms = args[i + 1].parse().expect("invalid --claim-idle-ms");
                i += 2;
            }
            "--no-reset" => {
                reset_on_start = false;
                i += 1;
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

    let stream = EventStream::new(conn, stream_key.clone(), maxlen, claim_idle_ms);
    let demo = StreamingDemo::new(stream.clone());

    if reset_on_start {
        println!(
            "Deleting any existing data at key '{}' for a clean demo run \
             (pass --no-reset to keep it).",
            stream_key
        );
        stream.delete_stream().await;
    }

    let groups = default_groups();
    let groups_ref: Vec<(&str, Vec<&str>)> =
        groups.iter().map(|(g, n)| (*g, n.clone())).collect();
    let seeded = demo.seed(&groups_ref).await;

    println!(
        "Redis streaming demo server listening on http://{}:{}",
        host, port
    );
    println!(
        "Using Redis at {}:{} with stream key '{}' (MAXLEN ~ {})",
        redis_host, redis_port, stream_key, maxlen
    );
    println!(
        "Seeded {} consumer(s) across {} group(s)",
        seeded,
        groups.len()
    );

    let state = AppState {
        stream,
        demo: demo.clone(),
        maxlen_approx: maxlen,
        claim_idle_ms,
    };

    let app = Router::new()
        .route("/", get(index))
        .route("/state", get(state_handler))
        .route("/replay", get(replay))
        .route("/produce", post(produce))
        .route("/add-worker", post(add_worker))
        .route("/remove-worker", post(remove_worker))
        .route("/crash", post(crash))
        .route("/autoclaim", post(autoclaim))
        .route("/trim", post(trim))
        .route("/reset", post(reset))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind((host.as_str(), port))
        .await
        .expect("failed to bind");
    let serve = axum::serve(listener, app);
    if let Err(err) = serve.await {
        eprintln!("server error: {}", err);
    }
    demo.stop_all().await;
}

async fn index(State(state): State<AppState>) -> Response {
    let html = render_html_page(
        &state.stream.stream_key,
        state.maxlen_approx,
        state.claim_idle_ms,
    );
    (
        [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
        html,
    )
        .into_response()
}

async fn state_handler(State(state): State<AppState>) -> Response {
    Json(build_state(&state).await).into_response()
}

#[derive(Deserialize)]
struct ProduceForm {
    count: Option<String>,
    #[serde(rename = "type")]
    event_type: Option<String>,
}

async fn produce(State(state): State<AppState>, Form(form): Form<ProduceForm>) -> Response {
    let count_raw: i64 = form
        .count
        .as_deref()
        .and_then(|s| s.parse().ok())
        .unwrap_or(1);
    let count = count_raw.clamp(1, 500) as usize;
    let event_type = form.event_type.unwrap_or_default();
    let event_type = event_type.trim();

    let mut events: Vec<(String, HashMap<String, String>)> = Vec::with_capacity(count);
    for _ in 0..count {
        let picked = if event_type.is_empty() {
            random_event_type()
        } else {
            event_type.to_string()
        };
        events.push((picked, fake_payload()));
    }
    let ids = match state.stream.produce_batch(events).await {
        Ok(ids) => ids,
        Err(err) => {
            return error_json(StatusCode::INTERNAL_SERVER_ERROR, &err.to_string());
        }
    };
    Json(json!({
        "produced": ids.len(),
        "ids": ids,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct AddWorkerForm {
    group: String,
    name: String,
}

async fn add_worker(
    State(state): State<AppState>,
    Form(form): Form<AddWorkerForm>,
) -> Response {
    let group = form.group.trim();
    let name = form.name.trim();
    if group.is_empty() || name.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "group and name are required");
    }
    let added = state.demo.add_worker(group, name).await;
    if !added {
        return error_json(
            StatusCode::CONFLICT,
            &format!("{group}/{name} already exists"),
        );
    }
    Json(json!({ "group": group, "name": name })).into_response()
}

#[derive(Deserialize)]
struct RemoveWorkerForm {
    group: String,
    name: String,
}

async fn remove_worker(
    State(state): State<AppState>,
    Form(form): Form<RemoveWorkerForm>,
) -> Response {
    let group = form.group.trim();
    let name = form.name.trim();
    let result = state.demo.remove_worker(group, name).await;
    let status = if result.removed || result.reason.as_deref() == Some("not-found") {
        StatusCode::OK
    } else {
        StatusCode::CONFLICT
    };
    (status, Json(result)).into_response()
}

#[derive(Deserialize)]
struct CrashForm {
    group: String,
    name: String,
    count: Option<String>,
}

async fn crash(State(state): State<AppState>, Form(form): Form<CrashForm>) -> Response {
    let group = form.group.trim();
    let name = form.name.trim();
    let count: u64 = form
        .count
        .as_deref()
        .and_then(|s| s.parse().ok())
        .unwrap_or(1);
    let Some(worker) = state.demo.get_worker(group, name).await else {
        return error_json(
            StatusCode::NOT_FOUND,
            &format!("unknown consumer {group}/{name}"),
        );
    };
    worker.crash_next(count).await;
    Json(json!({ "queued": count })).into_response()
}

#[derive(Deserialize)]
struct AutoclaimForm {
    group: String,
    consumer: String,
}

async fn autoclaim(
    State(state): State<AppState>,
    Form(form): Form<AutoclaimForm>,
) -> Response {
    let group = form.group.trim();
    let consumer = form.consumer.trim();
    if group.is_empty() || consumer.is_empty() {
        return error_json(
            StatusCode::BAD_REQUEST,
            "group and consumer are required",
        );
    }
    let Some(worker) = state.demo.get_worker(group, consumer).await else {
        return error_json(
            StatusCode::NOT_FOUND,
            &format!("unknown consumer {group}/{consumer}"),
        );
    };
    // ``reap_idle_pel`` runs XAUTOCLAIM(self) + process + ack. The
    // ``deleted`` list contains PEL entries whose stream payload was
    // already trimmed by ``MAXLEN ~`` before the sweep ran. Redis 7+
    // removes them from the PEL inside XAUTOCLAIM itself, so the caller
    // doesn't have to XACK them; in production they'd be routed to a
    // dead-letter store for offline inspection.
    let result = worker.reap_idle_pel().await;
    Json(json!({
        "claimed": result.claimed,
        "processed": result.processed,
        "deleted": result.deleted_ids,
        "min_idle_ms": state.claim_idle_ms,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct TrimForm {
    maxlen: Option<String>,
}

async fn trim(State(state): State<AppState>, Form(form): Form<TrimForm>) -> Response {
    let maxlen_raw: i64 = form
        .maxlen
        .as_deref()
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);
    let maxlen = maxlen_raw.max(0) as usize;
    let deleted = state.stream.trim_maxlen(maxlen).await.unwrap_or(0);
    Json(json!({ "deleted": deleted, "maxlen": maxlen })).into_response()
}

#[derive(Deserialize)]
struct ReplayParams {
    start: Option<String>,
    end: Option<String>,
    count: Option<String>,
}

async fn replay(
    State(state): State<AppState>,
    Query(params): Query<ReplayParams>,
) -> Response {
    let start = params.start.unwrap_or_else(|| "-".to_string());
    let end = params.end.unwrap_or_else(|| "+".to_string());
    let limit_raw: i64 = params
        .count
        .as_deref()
        .and_then(|s| s.parse().ok())
        .unwrap_or(20);
    let limit = limit_raw.clamp(1, 500) as usize;
    let entries = state.stream.replay(&start, &end, limit).await.unwrap_or_default();
    let payload: Vec<Value> = entries
        .into_iter()
        .map(|(id, fields)| json!({ "id": id, "fields": fields }))
        .collect();
    Json(json!({
        "start": start,
        "end": end,
        "limit": limit,
        "entries": payload,
    }))
    .into_response()
}

async fn reset(State(state): State<AppState>) -> Response {
    let count = state.demo.reset().await;
    Json(json!({ "consumers": count })).into_response()
}

async fn build_state(state: &AppState) -> Value {
    let stream_info = state.stream.info_stream().await;
    let groups = state.stream.info_groups().await;

    // Workers snapshot taken once per /state call so concurrent
    // add/remove requests can't change it mid-loop.
    let workers = state.demo.snapshot().await;

    let mut groups_detail: Vec<Value> = Vec::with_capacity(groups.len());
    let mut pending_rows: Vec<Value> = Vec::new();

    for group in groups {
        let consumer_info = state.stream.info_consumers(&group.name).await;
        let info_by_name: HashMap<String, &event_stream::ConsumerInfo> =
            consumer_info.iter().map(|c| (c.name.clone(), c)).collect();

        let mut consumers_detail: Vec<Value> = Vec::new();
        let mut seen_names: HashSet<String> = HashSet::new();
        for ((g_name, c_name), worker) in workers.iter() {
            if g_name != &group.name {
                continue;
            }
            let info = info_by_name.get(c_name).copied();
            let status: ConsumerStatus = worker.status().await;
            let recent = worker.recent().await;
            consumers_detail.push(consumer_detail_json(&status, info, recent));
            seen_names.insert(c_name.clone());
        }
        // Also include consumers that exist in Redis but not in our
        // in-process registry (e.g. orphaned after a restart).
        for c in consumer_info.iter() {
            if seen_names.contains(&c.name) {
                continue;
            }
            consumers_detail.push(json!({
                "name": c.name,
                "group": group.name,
                "processed": 0,
                "reaped": 0,
                "crashed_drops": 0,
                "paused": false,
                "crash_queued": 0,
                "alive": false,
                "pending": c.pending,
                "idle_ms": c.idle_ms,
                "recent": Vec::<Value>::new(),
            }));
        }
        consumers_detail.sort_by(|a, b| {
            a.get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .cmp(b.get("name").and_then(|v| v.as_str()).unwrap_or(""))
        });

        groups_detail.push(json!({
            "name": group.name,
            "consumers": group.consumers,
            "pending": group.pending,
            "last_delivered_id": group.last_delivered_id,
            "lag": group.lag,
            "consumers_detail": consumers_detail,
        }));

        for row in state.stream.pending_detail(&group.name, 50).await {
            pending_rows.push(json!({
                "id": row.id,
                "consumer": row.consumer,
                "idle_ms": row.idle_ms,
                "deliveries": row.deliveries,
                "group": group.name,
            }));
        }
    }

    let tail_entries = state.stream.tail(10).await.unwrap_or_default();
    let tail: Vec<Value> = tail_entries
        .into_iter()
        .map(|(id, fields)| json!({ "id": id, "fields": fields }))
        .collect();

    let stats = state.stream.stats();

    json!({
        "stream": {
            "length": stream_info.length,
            "last_generated_id": stream_info.last_generated_id,
            "first_entry_id": stream_info.first_entry_id,
            "last_entry_id": stream_info.last_entry_id,
        },
        "tail": tail,
        "groups": groups_detail,
        "pending": pending_rows,
        "stats": {
            "produced_total": stats.produced_total,
            "acked_total": stats.acked_total,
            "claimed_total": stats.claimed_total,
        },
    })
}

fn consumer_detail_json(
    status: &ConsumerStatus,
    info: Option<&event_stream::ConsumerInfo>,
    recent: Vec<consumer_worker::RecentEntry>,
) -> Value {
    let (pending, idle_ms) = match info {
        Some(c) => (c.pending, c.idle_ms),
        None => (0, 0),
    };
    json!({
        "name": status.name,
        "group": status.group,
        "processed": status.processed,
        "reaped": status.reaped,
        "crashed_drops": status.crashed_drops,
        "paused": status.paused,
        "crash_queued": status.crash_queued,
        "alive": status.alive,
        "pending": pending,
        "idle_ms": idle_ms,
        "recent": recent,
    })
}

fn error_json(status: StatusCode, message: &str) -> Response {
    (status, Json(json!({ "error": message }))).into_response()
}

fn random_event_type() -> String {
    let mut rng = rand::thread_rng();
    EVENT_TYPES.choose(&mut rng).unwrap_or(&EVENT_TYPES[0]).to_string()
}

fn fake_payload() -> HashMap<String, String> {
    let mut rng = rand::thread_rng();
    let mut m: HashMap<String, String> = HashMap::new();
    m.insert("order_id".to_string(), format!("o-{}", rng.gen_range(1000..10_000)));
    m.insert(
        "customer".to_string(),
        CUSTOMERS.choose(&mut rng).unwrap_or(&"alice").to_string(),
    );
    m.insert(
        "amount".to_string(),
        format!("{:.2}", rng.gen_range(5.0_f64..250.0_f64)),
    );
    m
}

fn render_html_page(stream_key: &str, maxlen: usize, claim_idle_ms: u64) -> String {
    HTML_TEMPLATE
        .replace("__STREAM_KEY__", stream_key)
        .replace("__MAXLEN__", &maxlen.to_string())
        .replace("__CLAIM_IDLE__", &claim_idle_ms.to_string())
}

const HTML_TEMPLATE: &str = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Streaming Demo</title>
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
      --pill: #d9ebe6;
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
    main { max-width: 1080px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 58rem; font-size: 1.05rem; color: var(--muted); }
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
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small { padding: 5px 10px; font-size: 0.85rem; margin-top: 4px; }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.ack { background: var(--ok); color: #1d4a2c; }
    .badge.drop { background: var(--warn); color: #6b3220; }
    .badge.idle { background: #e6e0f0; color: #43326a; }
    .group { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
    .group:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .consumers { margin-top: 6px; }
    .consumer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .consumer-row .name { font-weight: bold; min-width: 90px; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-rs + axum</div>
    <h1>Redis Streaming Demo</h1>
    <p class="lede">
      Producers append events to a single Redis Stream
      (<code>__STREAM_KEY__</code>). Two consumer groups read the same
      stream independently: <code>notifications</code> shares its work
      across two consumers, <code>analytics</code> processes the full
      flow on its own. Acknowledge with <code>XACK</code>, recover
      crashed deliveries with <code>XAUTOCLAIM</code>, replay any range
      with <code>XRANGE</code>, and bound retention with <code>XTRIM</code>.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Stream state</h2>
        <div id="stream-view">Loading...</div>
        <button id="refresh-button" class="secondary">Refresh</button>
        <button id="reset-button" class="danger">Reset demo (drop stream and re-seed)</button>
      </section>

      <section class="panel">
        <h2>Produce events</h2>
        <p>Events are appended with <code>XADD</code> with an approximate
        <code>MAXLEN ~ __MAXLEN__</code> retention cap.</p>
        <label for="produce-count">How many</label>
        <input id="produce-count" type="number" min="1" max="500" value="10">
        <label for="produce-type">Event type</label>
        <select id="produce-type">
          <option value="">(random)</option>
          <option value="order.placed">order.placed</option>
          <option value="order.paid">order.paid</option>
          <option value="order.shipped">order.shipped</option>
          <option value="order.cancelled">order.cancelled</option>
        </select>
        <button id="produce-button">Produce</button>
      </section>

      <section class="panel">
        <h2>Replay range (XRANGE)</h2>
        <p>Reads a slice of history. Replay is independent of any
        consumer group &mdash; no cursors move, no acks happen.</p>
        <label for="replay-start">Start ID</label>
        <input id="replay-start" value="-">
        <label for="replay-end">End ID</label>
        <input id="replay-end" value="+">
        <label for="replay-count">Limit</label>
        <input id="replay-count" type="number" min="1" max="500" value="20">
        <button id="replay-button">Replay</button>
      </section>

      <section class="panel">
        <h2>Trim retention (XTRIM)</h2>
        <p>Cap the stream length. Approximate trimming releases whole
        macro-nodes, which is much cheaper than exact trimming.</p>
        <label for="trim-maxlen">MAXLEN ~</label>
        <input id="trim-maxlen" type="number" min="0" value="100">
        <button id="trim-button" class="secondary">XTRIM</button>
      </section>

      <section class="panel wide">
        <h2>Consumer groups</h2>
        <div id="groups-view">Loading...</div>
      </section>

      <section class="panel wide">
        <h2>Pending entries (XPENDING)</h2>
        <p>Entries delivered to a consumer that haven't been acked yet.
        Idle time &ge; <code>__CLAIM_IDLE__</code> ms is eligible for
        <code>XAUTOCLAIM</code>.</p>
        <div id="pending-view">Loading...</div>
        <div class="row">
          <select id="autoclaim-target"></select>
          <button id="autoclaim-button" class="secondary">XAUTOCLAIM to selected</button>
        </div>
      </section>

      <section class="panel wide">
        <h2>Last result</h2>
        <div id="result-view"><p>Produce events, replay a range, or trigger an autoclaim to see results.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const streamView = document.getElementById("stream-view");
    const groupsView = document.getElementById("groups-view");
    const pendingView = document.getElementById("pending-view");
    const resultView = document.getElementById("result-view");
    const autoclaimTarget = document.getElementById("autoclaim-target");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderStream(state) {
      const stream = state.stream || {};
      const tail = state.tail || [];
      const tailRows = tail.map((entry) => `
        <tr>
          <td class="mono">${escapeHtml(entry.id)}</td>
          <td>${escapeHtml(entry.fields.type)}</td>
          <td class="mono">${escapeHtml(entry.fields.order_id || "")}</td>
          <td>${escapeHtml(entry.fields.amount || "")}</td>
          <td class="mono">${escapeHtml(entry.fields.customer || "")}</td>
        </tr>`).join("");
      streamView.innerHTML = `
        <dl>
          <dt>Length</dt><dd>${stream.length ?? 0}</dd>
          <dt>First ID</dt><dd class="mono">${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
          <dt>Last ID</dt><dd class="mono">${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
          <dt>Produced</dt><dd>${state.stats.produced_total ?? 0}</dd>
          <dt>Acked</dt><dd>${state.stats.acked_total ?? 0}</dd>
          <dt>Claimed</dt><dd>${state.stats.claimed_total ?? 0}</dd>
        </dl>
        <h3>Tail (most recent)</h3>
        ${tail.length === 0 ? "<p>(empty)</p>" :
          `<table>
             <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
             <tbody>${tailRows}</tbody>
           </table>`}
      `;
    }

    function renderGroups(state) {
      const groups = state.groups || [];
      if (groups.length === 0) {
        groupsView.innerHTML = "<p>No groups.</p>";
        return;
      }
      // Preserve any text the user has typed into an add-consumer input
      // (and which one was focused) so the 1.5s auto-refresh doesn't wipe it.
      const addWorkerValues = {};
      let focusedGroup = null;
      let focusedSelectionStart = null;
      groupsView.querySelectorAll("input[id^='addworker-']").forEach((input) => {
        const group = input.id.slice("addworker-".length);
        addWorkerValues[group] = input.value;
        if (document.activeElement === input) {
          focusedGroup = group;
          focusedSelectionStart = input.selectionStart;
        }
      });
      groupsView.innerHTML = groups.map((g) => {
        const consumers = (g.consumers_detail || []).map((c) => {
          const recent = (c.recent || []).slice(0, 3).map((m) => `
            <span class="mono" title="${escapeHtml(JSON.stringify(m.fields))}">
              <span class="badge ${m.acked ? "ack" : "drop"}">${m.acked ? "ack" : "drop"}</span>
              ${escapeHtml(m.id)} ${escapeHtml(m.type)}
            </span>`).join(" &nbsp; ");
          const badges = [];
          if (c.paused) badges.push('<span class="badge idle">paused</span>');
          if (c.crash_queued > 0) badges.push(`<span class="badge drop">will drop ${c.crash_queued}</span>`);
          return `
            <div class="consumer-row">
              <span class="name">${escapeHtml(c.name)}</span>
              <span class="mono">pending=${c.pending} idle=${c.idle_ms}ms processed=${c.processed} reaped=${c.reaped ?? 0}</span>
              ${badges.join(" ")}
              <button class="small secondary" data-action="crash" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Crash next 3</button>
              <button class="small danger" data-action="remove" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Remove</button>
            </div>
            ${recent ? `<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">${recent}</div>` : ""}`;
        }).join("");
        return `
          <div class="group">
            <h3>${escapeHtml(g.name)}
              <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                pending=${g.pending} lag=${g.lag ?? "?"} last_delivered=${escapeHtml(g.last_delivered_id)}
              </span>
            </h3>
            <div class="consumers">${consumers || "<em>(no consumers)</em>"}</div>
            <div class="row" style="max-width: 360px; margin-top: 6px;">
              <input id="addworker-${escapeHtml(g.name)}" placeholder="new-worker-name">
              <button class="small" data-action="add" data-group="${escapeHtml(g.name)}">Add consumer</button>
            </div>
          </div>`;
      }).join("");

      // Restore the typed text (and focus) into the add-consumer inputs.
      for (const [group, value] of Object.entries(addWorkerValues)) {
        const input = document.getElementById(`addworker-${group}`);
        if (input) input.value = value;
      }
      if (focusedGroup) {
        const input = document.getElementById(`addworker-${focusedGroup}`);
        if (input) {
          input.focus();
          if (focusedSelectionStart !== null) {
            try { input.setSelectionRange(focusedSelectionStart, focusedSelectionStart); } catch (_) {}
          }
        }
      }

      // Populate the autoclaim-target dropdown with every (group, consumer)
      const previous = autoclaimTarget.value;
      const options = [];
      for (const g of groups) {
        for (const c of g.consumers_detail || []) {
          options.push(`<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} → ${escapeHtml(c.name)}</option>`);
        }
      }
      autoclaimTarget.innerHTML = options.join("");
      if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
        autoclaimTarget.value = previous;
      }
    }

    function renderPending(state) {
      const rows = (state.pending || []).map((p) => `
        <tr>
          <td class="mono">${escapeHtml(p.group)}</td>
          <td class="mono">${escapeHtml(p.consumer)}</td>
          <td class="mono">${escapeHtml(p.id)}</td>
          <td>${p.idle_ms} ms</td>
          <td>${p.deliveries}</td>
        </tr>`).join("");
      pendingView.innerHTML = (state.pending || []).length === 0
        ? "<p>(no entries currently pending)</p>"
        : `<table>
             <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`;
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStream(state);
      renderGroups(state);
      renderPending(state);
    }

    document.getElementById("refresh-button").addEventListener("click", refresh);

    document.getElementById("produce-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("produce-count").value, 10) || 1;
      const type = document.getElementById("produce-type").value;
      const body = new URLSearchParams({ count, type });
      const r = await fetch("/produce", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Produce failed.", "error"); return; }
      setStatus(`Produced ${d.produced} event(s).`, "ok");
      resultView.innerHTML = `<p>Produced <strong>${d.produced}</strong> events. New IDs:</p>
        <pre class="mono">${d.ids.map(escapeHtml).join("\n")}</pre>`;
      await refresh();
    });

    document.getElementById("replay-button").addEventListener("click", async () => {
      const params = new URLSearchParams({
        start: document.getElementById("replay-start").value,
        end: document.getElementById("replay-end").value,
        count: document.getElementById("replay-count").value,
      });
      const r = await fetch(`/replay?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
      setStatus(`Replayed ${d.entries.length} entry/entries (XRANGE).`, "ok");
      const rows = d.entries.map((e) => `
        <tr>
          <td class="mono">${escapeHtml(e.id)}</td>
          <td>${escapeHtml(e.fields.type)}</td>
          <td class="mono">${escapeHtml(e.fields.order_id || "")}</td>
          <td>${escapeHtml(e.fields.amount || "")}</td>
        </tr>`).join("");
      resultView.innerHTML = `
        <p>XRANGE ${escapeHtml(d.start)} → ${escapeHtml(d.end)} (limit ${d.limit})</p>
        ${d.entries.length === 0 ? "<p>(no entries)</p>" :
          `<table>
            <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
            <tbody>${rows}</tbody>
           </table>`}`;
    });

    document.getElementById("trim-button").addEventListener("click", async () => {
      const maxlen = document.getElementById("trim-maxlen").value;
      const body = new URLSearchParams({ maxlen });
      const r = await fetch("/trim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
      setStatus(`XTRIM removed ${d.deleted} entr${d.deleted === 1 ? "y" : "ies"}.`, "ok");
      await refresh();
    });

    document.getElementById("autoclaim-button").addEventListener("click", async () => {
      const target = autoclaimTarget.value;
      if (!target) { setStatus("No consumer selected.", "error"); return; }
      const [group, consumer] = target.split("|");
      const body = new URLSearchParams({ group, consumer });
      const r = await fetch("/autoclaim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Autoclaim failed.", "error"); return; }
      const deletedCount = (d.deleted || []).length;
      const msg = deletedCount
        ? `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}; ${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.`
        : `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}.`;
      setStatus(msg, "ok");
      const deletedBlock = deletedCount
        ? `<h3>Deleted IDs (payload already trimmed &mdash; removed from PEL by Redis)</h3>
           <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
           <p>In production these would also be routed to a dead-letter store for offline inspection.</p>`
        : "";
      resultView.innerHTML = `
        <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
           into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
           claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
           <strong>${d.processed}</strong>, and acked them.</p>
        ${d.claimed === 0 ? "<p>(nothing was idle enough yet — try again after a few seconds)</p>" : ""}
        ${deletedBlock}`;
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop the stream and re-seed the default groups?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      setStatus(`Reset. ${d.consumers} consumer(s) re-seeded.`, "ok");
      await refresh();
    });

    document.body.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button[data-action]");
      if (!t) return;
      const action = t.dataset.action;
      const group = t.dataset.group;
      if (action === "crash") {
        const name = t.dataset.name;
        const body = new URLSearchParams({ group, name, count: "3" });
        await fetch("/crash", { method: "POST", body });
        setStatus(`Queued next 3 deliveries to ${group}/${name} for drop.`, "ok");
        await refresh();
      } else if (action === "remove") {
        const name = t.dataset.name;
        if (!confirm(`Remove ${group}/${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.`)) return;
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/remove-worker", { method: "POST", body });
        const d = await r.json();
        if (!d.removed) {
          setStatus(d.message || `Could not remove ${group}/${name} (${d.reason || "unknown"}).`, "error");
        } else if (d.handed_over_count > 0) {
          setStatus(`Removed ${group}/${name}. Handed ${d.handed_over_count} pending entr${d.handed_over_count === 1 ? "y" : "ies"} over to ${d.handed_over_to}.`, "ok");
        } else {
          setStatus(`Removed ${group}/${name} (no pending entries to hand over).`, "ok");
        }
        await refresh();
      } else if (action === "add") {
        const input = document.getElementById(`addworker-${group}`);
        const name = (input.value || "").trim();
        if (!name) { setStatus("Enter a consumer name.", "error"); return; }
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/add-worker", { method: "POST", body });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
        input.value = "";
        setStatus(`Added ${group}/${name}.`, "ok");
        await refresh();
      }
    });

    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
"##;
