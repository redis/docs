//! Redis pub/sub demo server.
//!
//! Run this binary and visit http://localhost:8103 to publish messages to
//! named channels, watch in-process subscribers (exact-match and pattern)
//! receive them in real time, and inspect Redis' own view of the active
//! channels via PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB NUMPAT.

mod pubsub_hub;

use axum::{
    extract::{Form, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use pubsub_hub::{HubError, PubSubHub, DEFAULT_BUFFER_SIZE};
use redis::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use std::env;

// A small set of seed subscriptions so the demo has something to show on
// first load. Users can add or remove subscriptions live from the UI.
const DEFAULT_SUBSCRIPTIONS: &[(&str, &str, &str)] = &[
    ("orders-listener", "channel", "orders:new"),
    ("billing-listener", "channel", "billing:invoice"),
    ("all-notifications", "pattern", "notifications:*"),
];

#[derive(Clone)]
struct AppState {
    hub: PubSubHub,
}

#[tokio::main]
async fn main() {
    let mut port: u16 = 8103;
    let mut host = "127.0.0.1".to_string();
    let mut redis_host = env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
    let mut redis_port: u16 = env::var("REDIS_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(6379);

    let args: Vec<String> = env::args().collect();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--port" if i + 1 < args.len() => {
                port = args[i + 1].parse().expect("invalid --port");
                i += 2;
            }
            "--host" if i + 1 < args.len() => {
                host = args[i + 1].clone();
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
            _ => {
                i += 1;
            }
        }
    }

    let url = format!("redis://{}:{}/", redis_host, redis_port);
    let client = Client::open(url).expect("failed to create Redis client");
    let hub = PubSubHub::new(client, DEFAULT_BUFFER_SIZE)
        .await
        .expect("failed to connect to Redis");

    seed_default_subscriptions(&hub).await;

    let state = AppState { hub: hub.clone() };

    let app = Router::new()
        .route("/", get(index))
        .route("/state", get(state_handler))
        .route("/publish", post(publish_handler))
        .route("/subscribe", post(subscribe_handler))
        .route("/unsubscribe", post(unsubscribe_handler))
        .route("/reset", post(reset_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind((host.as_str(), port))
        .await
        .expect("failed to bind");
    println!(
        "Redis pub/sub demo server listening on http://{}:{}",
        host, port
    );
    println!("Using Redis at {}:{}", redis_host, redis_port);
    println!(
        "Seeded {} default subscription(s)",
        DEFAULT_SUBSCRIPTIONS.len()
    );

    let shutdown_hub = hub.clone();
    let serve = axum::serve(listener, app).with_graceful_shutdown(async move {
        // Best-effort: react to Ctrl-C so background pub/sub tasks
        // get a chance to unsubscribe before the process exits.
        let _ = tokio::signal::ctrl_c().await;
        shutdown_hub.shutdown().await;
    });
    serve.await.expect("server failed");
}

async fn seed_default_subscriptions(hub: &PubSubHub) {
    for (name, kind, target) in DEFAULT_SUBSCRIPTIONS {
        let target = (*target).to_string();
        let res = if *kind == "pattern" {
            hub.psubscribe(name, vec![target]).await.map(|_| ())
        } else {
            hub.subscribe(name, vec![target]).await.map(|_| ())
        };
        if let Err(err) = res {
            // Duplicate names are expected when reseeding after /reset.
            if !matches!(err, HubError::DuplicateName(_)) {
                eprintln!("failed to seed subscription {}: {}", name, err);
            }
        }
    }
}

async fn index() -> Response {
    (
        [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
        HTML_PAGE,
    )
        .into_response()
}

async fn state_handler(State(state): State<AppState>) -> Json<Value> {
    Json(build_state(&state.hub).await)
}

#[derive(Deserialize)]
struct PublishForm {
    channel: Option<String>,
    message: Option<String>,
    count: Option<String>,
}

async fn publish_handler(
    State(state): State<AppState>,
    Form(form): Form<PublishForm>,
) -> Response {
    let channel = form.channel.unwrap_or_default().trim().to_string();
    let body = form.message.unwrap_or_default().trim().to_string();
    let raw_count = form.count.unwrap_or_else(|| "1".to_string());
    let count: i64 = raw_count.trim().parse().unwrap_or(1);
    let count = count.clamp(1, 20);

    if channel.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "channel is required");
    }
    if body.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "message is required");
    }

    let mut results: Vec<i64> = Vec::with_capacity(count as usize);
    for index in 0..count {
        let envelope = json!({
            "body": body,
            "seq": index + 1,
            "of": count,
        });
        match state.hub.publish(&channel, &envelope).await {
            Ok(n) => results.push(n),
            Err(err) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &err.to_string()),
        }
    }

    Json(json!({
        "channel": channel,
        "publishes": count,
        "delivered": results,
        "state": build_state(&state.hub).await,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct SubscribeForm {
    name: Option<String>,
    kind: Option<String>,
    target: Option<String>,
}

async fn subscribe_handler(
    State(state): State<AppState>,
    Form(form): Form<SubscribeForm>,
) -> Response {
    let name = form.name.unwrap_or_default().trim().to_string();
    let kind = form
        .kind
        .unwrap_or_else(|| "channel".to_string())
        .trim()
        .to_string();
    let targets_raw = form.target.unwrap_or_default().trim().to_string();

    if name.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "name is required");
    }
    if targets_raw.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "target is required");
    }
    if kind != "channel" && kind != "pattern" {
        return error_json(StatusCode::BAD_REQUEST, "kind must be 'channel' or 'pattern'");
    }

    // Allow comma-separated targets so one subscription can cover several
    // channels (the helper binds each target inside the same connection).
    let targets: Vec<String> = targets_raw
        .split(',')
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .collect();

    let result = if kind == "pattern" {
        state.hub.psubscribe(&name, targets).await
    } else {
        state.hub.subscribe(&name, targets).await
    };

    if let Err(err) = result {
        let status = match err {
            HubError::DuplicateName(_) | HubError::EmptyTargets => StatusCode::BAD_REQUEST,
            HubError::Redis(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        return error_json(status, &err.to_string());
    }

    Json(build_state(&state.hub).await).into_response()
}

#[derive(Deserialize)]
struct UnsubscribeForm {
    name: Option<String>,
}

async fn unsubscribe_handler(
    State(state): State<AppState>,
    Form(form): Form<UnsubscribeForm>,
) -> Response {
    let name = form.name.unwrap_or_default().trim().to_string();
    if name.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "name is required");
    }
    let removed = state.hub.unsubscribe(&name).await;
    Json(json!({
        "removed": removed,
        "state": build_state(&state.hub).await,
    }))
    .into_response()
}

async fn reset_handler(State(state): State<AppState>) -> Json<Value> {
    state.hub.shutdown().await;
    state.hub.reset_stats();
    seed_default_subscriptions(&state.hub).await;
    Json(build_state(&state.hub).await)
}

async fn build_state(hub: &PubSubHub) -> Value {
    let subs = hub.subscriptions();
    let mut exact_channels: Vec<String> = subs
        .iter()
        .filter(|s| !s.is_pattern())
        .flat_map(|s| s.targets().into_iter())
        .collect();
    exact_channels.sort();
    exact_channels.dedup();

    let mut subscriptions_json: Vec<Value> = Vec::with_capacity(subs.len());
    for sub in &subs {
        let mut entry = sub.to_json();
        if let Some(obj) = entry.as_object_mut() {
            let messages = sub.messages(Some(15));
            obj.insert(
                "messages".to_string(),
                serde_json::to_value(&messages).unwrap_or(Value::Array(vec![])),
            );
        }
        subscriptions_json.push(entry);
    }

    let active_channels = hub.active_channels("*").await.unwrap_or_default();
    let numsub = hub
        .channel_subscriber_counts(&exact_channels)
        .await
        .unwrap_or_default();
    let stats = hub.stats().await;

    json!({
        "subscriptions": subscriptions_json,
        "active_channels": active_channels,
        "numsub": numsub,
        "stats": stats,
    })
}

fn error_json(status: StatusCode, message: &str) -> Response {
    (status, Json(json!({ "error": message }))).into_response()
}

const HTML_PAGE: &str = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Pub/Sub Demo</title>
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
    button.tiny {
      padding: 4px 10px;
      font-size: 0.85rem;
      margin: 0 0 0 8px;
    }
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
    .badge.channel { background: #f4e4c1; color: #5e4514; }
    .badge.pattern { background: var(--miss); color: #6b3220; }
    .badge.alive { background: var(--hit); color: #1d4a2c; }
    .badge.dead { background: #f0c2bc; color: #6b1f1c; }
    .sub-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #fffdf8;
    }
    .sub-card h3 { margin: 0 0 6px; font-size: 1.05rem; }
    .sub-card .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 8px; }
    .message-list { list-style: none; padding: 0; margin: 6px 0 0; max-height: 180px; overflow-y: auto; }
    .message-list li {
      border: 1px dashed #ddccb1;
      border-radius: 8px;
      padding: 6px 10px;
      margin-bottom: 6px;
      background: #fdf6e9;
      font-size: 0.9rem;
    }
    .message-list li .meta { color: var(--muted); font-size: 0.8rem; }
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
    <h1>Redis Pub/Sub Demo</h1>
    <p class="lede">
      Publish messages to named channels and watch in-process subscribers receive them in
      real time through Redis. Exact-match subscribers register with <code>SUBSCRIBE</code>;
      pattern subscribers use <code>PSUBSCRIBE</code> with glob syntax
      (<code>notifications:*</code>, <code>orders:*</code>). Redis' own view of active
      subscribers — <code>PUBSUB CHANNELS</code>, <code>PUBSUB NUMSUB</code>,
      <code>PUBSUB NUMPAT</code> — is shown in the inspection panel.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Publish a message</h2>
        <label for="pub-channel">Channel</label>
        <input id="pub-channel" value="orders:new" list="channel-suggestions">
        <datalist id="channel-suggestions">
          <option value="orders:new">
          <option value="billing:invoice">
          <option value="notifications:email">
          <option value="notifications:push">
          <option value="cache:invalidate:products">
          <option value="chat:lobby">
        </datalist>
        <label for="pub-message">Message body</label>
        <input id="pub-message" value="hello, world">
        <label for="pub-count">How many copies</label>
        <input id="pub-count" type="number" value="1" min="1" max="20">
        <button id="publish-button">Publish</button>
      </section>

      <section class="panel">
        <h2>Add a subscriber</h2>
        <label for="sub-name">Name</label>
        <input id="sub-name" value="orders-bot">
        <label for="sub-kind">Subscription kind</label>
        <select id="sub-kind">
          <option value="channel">Exact channel (SUBSCRIBE)</option>
          <option value="pattern">Pattern (PSUBSCRIBE)</option>
        </select>
        <label for="sub-target">Channel or pattern (comma-separated for multiple)</label>
        <input id="sub-target" value="orders:new" placeholder="orders:new or orders:*">
        <button id="subscribe-button">Subscribe</button>
        <button id="reset-button" class="secondary">Reset</button>
      </section>

      <section class="panel">
        <h2>Server-side view</h2>
        <p class="meta" style="margin-top:0;color:var(--muted);">
          From <code>PUBSUB CHANNELS</code> / <code>PUBSUB NUMSUB</code> /
          <code>PUBSUB NUMPAT</code>. Pattern subscribers do not appear in
          <code>PUBSUB CHANNELS</code>; they are counted by <code>PUBSUB NUMPAT</code>.
        </p>
        <div id="server-view">Loading...</div>
      </section>

      <section class="panel">
        <h2>Hub stats</h2>
        <div id="stats-view">Loading...</div>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Active subscribers <span id="sub-count" class="badge alive">0</span></h2>
        <div id="subscribers"></div>
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
      const perChannel = Object.entries(stats.channel_published || {})
        .map(([ch, n]) => `${escapeHtml(ch)}: ${n}`).join(", ") || "(none)";
      view.innerHTML = `
        <dl>
          <dt>Published total</dt><dd>${stats.published_total}</dd>
          <dt>Redis delivered total</dt><dd>${stats.delivered_total}</dd>
          <dt>Received total (this process)</dt><dd>${stats.received_total}</dd>
          <dt>Active subscriptions</dt><dd>${stats.active_subscriptions}</dd>
          <dt>Pattern subscriptions (server)</dt><dd>${stats.pattern_subscriptions}</dd>
          <dt>Per-channel publishes</dt><dd>${perChannel}</dd>
        </dl>
      `;
    }

    function renderServerView(state) {
      const view = document.getElementById("server-view");
      const channels = state.active_channels || [];
      const numsub = state.numsub || {};
      const channelsHtml = channels.length
        ? channels.map((c) => `<li><strong>${escapeHtml(c)}</strong> &middot; <span class=meta>${numsub[c] ?? 0} subscriber(s)</span></li>`).join("")
        : "<li><span class=meta>(no active exact-match channels)</span></li>";
      view.innerHTML = `
        <ul class="message-list">${channelsHtml}</ul>
      `;
    }

    function renderSubscribers(subscriptions) {
      const wrap = document.getElementById("subscribers");
      const count = document.getElementById("sub-count");
      count.textContent = subscriptions.length;
      if (!subscriptions.length) {
        wrap.innerHTML = "<p class=meta>(no active subscribers — add one to start)</p>";
        return;
      }
      wrap.innerHTML = subscriptions.map((sub) => {
        const kind = sub.is_pattern ? "pattern" : "channel";
        const targets = sub.targets.map((t) => escapeHtml(t)).join(", ");
        const messages = (sub.messages || []).map((m) => {
          const payload = typeof m.payload === "object" ? JSON.stringify(m.payload) : String(m.payload ?? "");
          const ch = m.pattern
            ? `${escapeHtml(m.channel)} <span class=meta>(via ${escapeHtml(m.pattern)})</span>`
            : escapeHtml(m.channel);
          return `<li>
            <strong>${ch}</strong>
            <div class=meta>${escapeHtml(payload)}</div>
          </li>`;
        }).join("");
        return `<div class="sub-card">
          <h3>${escapeHtml(sub.name)}
            <span class="badge ${kind}">${kind}</span>
            <span class="badge ${sub.alive ? "alive" : "dead"}">${sub.alive ? "live" : "stopped"}</span>
            <button class="tiny secondary" data-unsubscribe="${escapeHtml(sub.name)}">Unsubscribe</button>
          </h3>
          <div class=meta>Listening to: ${targets} &middot; received ${sub.received_total} message(s)</div>
          <ul class="message-list">${messages || '<li><span class=meta>(no messages yet)</span></li>'}</ul>
        </div>`;
      }).join("");
      wrap.querySelectorAll("button[data-unsubscribe]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const body = new URLSearchParams({ name: btn.dataset.unsubscribe });
          await fetch("/unsubscribe", { method: "POST", body });
          setStatus(`Unsubscribed ${btn.dataset.unsubscribe}.`, "ok");
          refresh();
        });
      });
    }

    async function refresh() {
      const response = await fetch("/state");
      const state = await response.json();
      renderStats(state.stats);
      renderServerView(state);
      renderSubscribers(state.subscriptions || []);
    }

    document.getElementById("publish-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        channel: document.getElementById("pub-channel").value,
        message: document.getElementById("pub-message").value,
        count: document.getElementById("pub-count").value,
      });
      const response = await fetch("/publish", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Publish failed.", "error"); return; }
      const delivered = (data.delivered || []).reduce((a, b) => a + b, 0);
      setStatus(`Published ${data.publishes} message(s) to ${data.channel}; Redis delivered ${delivered} time(s).`, "ok");
      refresh();
    });

    document.getElementById("subscribe-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        name: document.getElementById("sub-name").value,
        kind: document.getElementById("sub-kind").value,
        target: document.getElementById("sub-target").value,
      });
      const response = await fetch("/subscribe", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Subscribe failed.", "error"); return; }
      setStatus("Subscriber added.", "ok");
      refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      await fetch("/reset", { method: "POST" });
      setStatus("Hub reset — default subscribers re-seeded.", "ok");
      refresh();
    });

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>
"##;
