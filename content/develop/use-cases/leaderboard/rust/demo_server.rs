mod leaderboard;

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{get, post},
    Form, Router,
};
use leaderboard::{metadata_map, AsyncRedisLeaderboard, LeaderboardEntry, Metadata};
use redis::Client;
use serde::{Deserialize, Serialize};
use std::{env, sync::Arc};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    redis_connection: Arc<Mutex<redis::aio::MultiplexedConnection>>,
    leaderboard: Arc<Mutex<AsyncRedisLeaderboard>>,
}

#[derive(Clone)]
struct DemoPlayer {
    user_id: &'static str,
    score: f64,
    metadata: &'static [(&'static str, &'static str)],
}

const SAMPLE_PLAYERS: &[DemoPlayer] = &[
    DemoPlayer { user_id: "player-1", score: 980.0, metadata: &[("name", "Avery"), ("description", "Steady climber who never wastes a turn.")] },
    DemoPlayer { user_id: "player-2", score: 1310.0, metadata: &[("name", "Mina"), ("description", "Always finds a way into the top three.")] },
    DemoPlayer { user_id: "player-3", score: 1175.0, metadata: &[("name", "Noah"), ("description", "Takes big swings and occasionally lands them.")] },
    DemoPlayer { user_id: "player-4", score: 1435.0, metadata: &[("name", "Priya"), ("description", "Current pace-setter with a ruthless endgame.")] },
    DemoPlayer { user_id: "player-5", score: 1080.0, metadata: &[("name", "Jules"), ("description", "Quietly consistent and hard to catch.")] },
    DemoPlayer { user_id: "player-6", score: 1240.0, metadata: &[("name", "Rin"), ("description", "Moves fast after every weekly reset.")] },
];

#[derive(Debug, Deserialize)]
struct StateQuery {
    top: Option<usize>,
    rank: Option<usize>,
    around: Option<usize>,
}

#[derive(Debug, Deserialize)]
struct UpsertForm {
    user_id: String,
    score: f64,
    name: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct IncrementForm {
    user_id: String,
    amount: f64,
    name: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ConfigForm {
    max_entries: usize,
}

#[derive(Serialize)]
struct StateResponse {
    leaderboard_key: String,
    max_entries: usize,
    top_count: usize,
    around_rank: usize,
    around_count: usize,
    size: u64,
    top_entries: Vec<LeaderboardEntry>,
    around_entries: Vec<LeaderboardEntry>,
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let port = parse_arg(&args, "--port").unwrap_or_else(|| "8080".to_string());
    let redis_host = parse_arg(&args, "--redis-host").unwrap_or_else(|| "localhost".to_string());
    let redis_port = parse_arg(&args, "--redis-port").unwrap_or_else(|| "6379".to_string());
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| format!("redis://{}:{}/", redis_host, redis_port));

    let client = Client::open(redis_url.as_str()).unwrap_or_else(|e| {
        eprintln!("Failed to create Redis client: {e}");
        std::process::exit(1);
    });

    let connection = client.get_multiplexed_async_connection().await.unwrap_or_else(|e| {
        eprintln!("Failed to connect to Redis: {e}");
        eprintln!("Make sure Redis is running at {}:{}", redis_host, redis_port);
        std::process::exit(1);
    });

    let leaderboard = AsyncRedisLeaderboard::new("leaderboard:demo", 100);
    let state = Arc::new(AppState {
        redis_connection: Arc::new(Mutex::new(connection)),
        leaderboard: Arc::new(Mutex::new(leaderboard)),
    });

    seed_sample_data(&state).await;

    let app = Router::new()
        .route("/", get(handle_home))
        .route("/api/state", get(handle_state))
        .route("/api/players", post(handle_upsert))
        .route("/api/increment", post(handle_increment))
        .route("/api/config", post(handle_config))
        .route("/api/reset", post(handle_reset))
        .with_state(state);

    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap_or_else(|e| {
        eprintln!("Failed to bind to {addr}: {e}");
        std::process::exit(1);
    });

    println!("Leaderboard demo server running at http://localhost:{port}");
    println!("Connected to Redis at {}:{}", redis_host, redis_port);
    println!("Press Ctrl+C to stop.");

    axum::serve(listener, app).await.unwrap_or_else(|e| {
        eprintln!("Server error: {e}");
        std::process::exit(1);
    });
}

async fn handle_home() -> Html<String> {
    Html(html_page())
}

async fn handle_state(
    State(state): State<Arc<AppState>>,
    Query(query): Query<StateQuery>,
) -> impl IntoResponse {
    let top_count = query.top.unwrap_or(5).max(1);
    let around_rank = query.rank.unwrap_or(3).max(1);
    let around_count = query.around.unwrap_or(5).max(1);

    let mut con = state.redis_connection.lock().await;
    let leaderboard = state.leaderboard.lock().await;
    match (
        leaderboard.get_top(&mut con, top_count).await,
        leaderboard.get_around_rank(&mut con, around_rank, around_count).await,
        leaderboard.get_size(&mut con).await,
    ) {
        (Ok(top_entries), Ok(around_entries), Ok(size)) => Json(StateResponse {
            leaderboard_key: leaderboard.key().to_string(),
            max_entries: leaderboard.max_entries(),
            top_count,
            around_rank,
            around_count,
            size,
            top_entries,
            around_entries,
        })
        .into_response(),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, "Redis error").into_response(),
    }
}

async fn handle_upsert(
    State(state): State<Arc<AppState>>,
    Form(form): Form<UpsertForm>,
) -> impl IntoResponse {
    if form.user_id.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"User ID is required."}))).into_response();
    }

    let mut con = state.redis_connection.lock().await;
    let leaderboard = state.leaderboard.lock().await;
    let metadata = metadata_map(&[
        ("name", form.name.as_deref().filter(|v| !v.is_empty()).unwrap_or(form.user_id.as_str())),
        ("description", form.description.as_deref().filter(|v| !v.is_empty()).unwrap_or("No description provided.")),
    ]);

    match leaderboard.upsert_user(&mut con, &form.user_id, form.score, Some(metadata)).await {
        Ok(entry) => Json(serde_json::json!({
            "message":"Player saved.",
            "entry": entry,
            "max_entries": leaderboard.max_entries()
        })).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"Redis error"}))).into_response(),
    }
}

async fn handle_increment(
    State(state): State<Arc<AppState>>,
    Form(form): Form<IncrementForm>,
) -> impl IntoResponse {
    if form.user_id.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"User ID is required."}))).into_response();
    }

    let mut con = state.redis_connection.lock().await;
    let leaderboard = state.leaderboard.lock().await;
    let mut metadata: Metadata = leaderboard.get_user_metadata(&mut con, &form.user_id).await.unwrap_or_default();
    if metadata.is_empty() {
        metadata.insert("name".to_string(), form.name.clone().filter(|v| !v.is_empty()).unwrap_or_else(|| form.user_id.clone()));
        metadata.insert("description".to_string(), form.description.clone().filter(|v| !v.is_empty()).unwrap_or_else(|| "Created during score increment.".to_string()));
    } else {
        if let Some(name) = form.name.filter(|v| !v.is_empty()) {
            metadata.insert("name".to_string(), name);
        }
        if let Some(description) = form.description.filter(|v| !v.is_empty()) {
            metadata.insert("description".to_string(), description);
        }
    }

    match leaderboard.increment_score(&mut con, &form.user_id, form.amount, Some(metadata)).await {
        Ok(entry) => Json(serde_json::json!({
            "message":"Score updated.",
            "entry": entry,
            "max_entries": leaderboard.max_entries()
        })).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"Redis error"}))).into_response(),
    }
}

async fn handle_config(
    State(state): State<Arc<AppState>>,
    Form(form): Form<ConfigForm>,
) -> impl IntoResponse {
    if form.max_entries < 1 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"Max entries must be a whole number greater than 0."}))).into_response();
    }

    let mut con = state.redis_connection.lock().await;
    let mut leaderboard = state.leaderboard.lock().await;
    match leaderboard.set_max_entries(&mut con, form.max_entries).await {
        Ok(trimmed_user_ids) => Json(serde_json::json!({
            "message":"Leaderboard limit updated.",
            "max_entries": leaderboard.max_entries(),
            "trimmed_user_ids": trimmed_user_ids
        })).into_response(),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error":"Redis error"}))).into_response(),
    }
}

async fn handle_reset(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    seed_sample_data(&state).await;
    let leaderboard = state.leaderboard.lock().await;
    Json(serde_json::json!({
        "message":"Demo leaderboard reset.",
        "max_entries": leaderboard.max_entries()
    }))
}

async fn seed_sample_data(state: &Arc<AppState>) {
    let mut con = state.redis_connection.lock().await;
    let leaderboard = state.leaderboard.lock().await;
    let _ = leaderboard.clear(&mut con).await;
    for player in SAMPLE_PLAYERS {
        let _ = leaderboard
            .upsert_user(&mut con, player.user_id, player.score, Some(metadata_map(player.metadata)))
            .await;
    }
}

fn parse_arg(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|arg| arg == flag)
        .and_then(|pos| args.get(pos + 1))
        .cloned()
}

fn html_page() -> String {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redis Leaderboard Demo</title>
    <style>
        :root { color-scheme: light; --bg: #f7f4ec; --panel: #fffaf0; --panel-strong: #f0e6d2; --text: #1f2933; --muted: #52606d; --line: #d7cab2; --accent: #b45309; --accent-dark: #7c2d12; --good: #166534; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 28%), linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%); color: var(--text); }
        main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; }
        h1, h2, h3 { margin-top: 0; color: #3b2f2f; }
        p { color: var(--muted); line-height: 1.5; }
        .hero { background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(124, 45, 18, 0.08)); border: 1px solid var(--line); border-radius: 20px; padding: 28px; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
        .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 20px; box-shadow: 0 14px 40px rgba(31, 41, 51, 0.05); }
        .banner { background: var(--panel-strong); color: var(--accent-dark); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; min-height: 48px; }
        form { display: grid; gap: 10px; }
        label { font-size: 0.95rem; font-weight: 700; color: #4b3b30; }
        input, textarea, button { font: inherit; }
        input, textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: #fffdf8; color: var(--text); }
        textarea { min-height: 90px; resize: vertical; }
        button { border: 0; border-radius: 999px; padding: 11px 16px; background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white; cursor: pointer; font-weight: 700; }
        button.secondary { background: #e6dcc8; color: #4b3b30; }
        .inline { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .statline { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; color: var(--muted); font-size: 0.95rem; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid rgba(215, 202, 178, 0.8); vertical-align: top; }
        th { color: #4b3b30; font-size: 0.95rem; }
        .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(180, 83, 9, 0.1); color: var(--accent-dark); font-size: 0.85rem; font-weight: 700; }
        .success { color: var(--good); }
        @media (max-width: 720px) { .inline { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <main>
        <section class="hero">
            <h1>Redis leaderboard demo</h1>
            <p>This demo stores scores in a Redis sorted set and keeps player details in per-user hashes. You can inspect the top performers, look around a rank position, and trim the board to a fixed size.</p>
            <div class="statline">
                <span class="pill">Sorted set rankings</span>
                <span class="pill">Hash-based metadata</span>
                <span class="pill">Top N and around-rank queries</span>
            </div>
        </section>
        <div class="banner" id="banner">Ready.</div>
        <div class="grid">
            <section class="panel">
                <h2>Add or update a player</h2>
                <form id="upsert-form">
                    <label>User ID <input name="user_id" value="player-7" required></label>
                    <div class="inline">
                        <label>Name <input name="name" value="Kai"></label>
                        <label>Score <input name="score" type="number" step="0.01" value="1125" required></label>
                    </div>
                    <label>Description <textarea name="description">New challenger climbing into contention.</textarea></label>
                    <button type="submit">Save player</button>
                </form>
            </section>
            <section class="panel">
                <h2>Increment a score</h2>
                <form id="increment-form">
                    <div class="inline">
                        <label>User ID <input name="user_id" value="player-2" required></label>
                        <label>Amount <input name="amount" type="number" step="0.01" value="25" required></label>
                    </div>
                    <label>Name for a new user <input name="name" value=""></label>
                    <label>Description for a new user <textarea name="description"></textarea></label>
                    <button type="submit">Add points</button>
                </form>
            </section>
            <section class="panel">
                <h2>Leaderboard settings</h2>
                <form id="config-form">
                    <div class="inline">
                        <label>Top entries to view <input id="top-count" type="number" min="1" value="5"></label>
                        <label>Entries around rank <input id="around-count" type="number" min="1" value="5"></label>
                    </div>
                    <div class="inline">
                        <label>Center rank <input id="around-rank" type="number" min="1" value="3"></label>
                        <label>Max leaderboard size <input name="max_entries" id="max-entries" type="number" min="1" value="100"></label>
                    </div>
                    <button type="submit">Apply max size</button>
                </form>
                <div class="toolbar" style="margin-top: 14px;">
                    <button class="secondary" id="refresh-button" type="button">Refresh view</button>
                    <button class="secondary" id="reset-button" type="button">Reset sample data</button>
                </div>
                <div class="statline">
                    <span>Leaderboard key: <strong id="leaderboard-key">leaderboard:demo</strong></span>
                    <span>Stored entries: <strong id="leaderboard-size">0</strong></span>
                    <span>Max kept: <strong id="leaderboard-limit">100</strong></span>
                </div>
            </section>
        </div>
        <div class="grid" style="margin-top: 18px;">
            <section class="panel"><h2>Top entries</h2><div class="table-wrap"><table><thead><tr><th>Rank</th><th>User</th><th>Score</th><th>Metadata</th></tr></thead><tbody id="top-table"></tbody></table></div></section>
            <section class="panel"><h2>Entries around rank</h2><div class="table-wrap"><table><thead><tr><th>Rank</th><th>User</th><th>Score</th><th>Metadata</th></tr></thead><tbody id="around-table"></tbody></table></div></section>
        </div>
    </main>
    <script>
        const banner = document.getElementById('banner');
        function setBanner(message, isSuccess = true) { banner.textContent = message; banner.className = 'banner' + (isSuccess ? ' success' : ''); }
        function renderRows(targetId, entries) {
            const target = document.getElementById(targetId);
            if (!entries.length) { target.innerHTML = '<tr><td colspan="4">No entries found for this view.</td></tr>'; return; }
            target.innerHTML = entries.map((entry) => {
                const metadata = entry.metadata || {};
                const name = metadata.name || entry.user_id;
                const description = metadata.description || '';
                return `<tr><td>#${entry.rank}</td><td><strong>${entry.user_id}</strong><br><span>${name}</span></td><td>${entry.score}</td><td>${description}</td></tr>`;
            }).join('');
        }
        async function refreshState() {
            const top = document.getElementById('top-count').value || '5';
            const around = document.getElementById('around-count').value || '5';
            const rank = document.getElementById('around-rank').value || '3';
            const response = await fetch(`/api/state?top=${encodeURIComponent(top)}&around=${encodeURIComponent(around)}&rank=${encodeURIComponent(rank)}`);
            const data = await response.json();
            document.getElementById('leaderboard-key').textContent = data.leaderboard_key;
            document.getElementById('leaderboard-size').textContent = data.size;
            document.getElementById('leaderboard-limit').textContent = data.max_entries;
            document.getElementById('max-entries').value = data.max_entries;
            renderRows('top-table', data.top_entries);
            renderRows('around-table', data.around_entries);
        }
        async function postForm(url, form) {
            const response = await fetch(url, { method: 'POST', body: new URLSearchParams(new FormData(form)) });
            return response.json();
        }
        document.getElementById('upsert-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = await postForm('/api/players', event.target);
            if (data.error) { setBanner(data.error, false); return; }
            const trimmed = data.entry.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
            setBanner(`Saved ${data.entry.user_id} at rank #${data.entry.rank} with score ${data.entry.score}.${trimmedText}`);
            await refreshState();
        });
        document.getElementById('increment-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = await postForm('/api/increment', event.target);
            if (data.error) { setBanner(data.error, false); return; }
            const trimmed = data.entry.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
            setBanner(`Updated ${data.entry.user_id} to score ${data.entry.score} at rank #${data.entry.rank}.${trimmedText}`);
            await refreshState();
        });
        document.getElementById('config-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = await postForm('/api/config', event.target);
            if (data.error) { setBanner(data.error, false); return; }
            const trimmed = data.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
            setBanner(`Leaderboard limit set to ${data.max_entries}.${trimmedText}`);
            await refreshState();
        });
        document.getElementById('refresh-button').addEventListener('click', refreshState);
        document.getElementById('reset-button').addEventListener('click', async () => {
            const response = await fetch('/api/reset', { method: 'POST' });
            const data = await response.json();
            setBanner(data.message);
            await refreshState();
        });
        refreshState().catch((error) => setBanner(`Failed to load leaderboard state: ${error}`, false));
    </script>
</body>
</html>"#.to_string()
}
