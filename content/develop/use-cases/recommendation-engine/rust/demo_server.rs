//! Redis recommendation-engine demo server.
//!
//! Run with:
//!
//!     cargo run --bin demo_server -- --port 8088
//!
//! Visit http://localhost:8088 to drive a small product catalog
//! indexed by Redis Search. The UI lets you embed a natural-language
//! query, optionally with TAG / NUMERIC / TEXT filters, watch
//! `FT.SEARCH` retrieve top-K candidates with a KNN pre-filter in a
//! single round trip, feed clicks back as a session signal, and
//! refresh an item's embedding live to demonstrate that the HNSW
//! index reflects the new vector on the next query with no downtime.
//!
//! The server holds a single `LocalEmbedder` instance and reuses it
//! for every query-embed step; `catalog.json` carries the item vectors
//! pre-computed by `build_catalog` so startup stays fast.

mod catalog_seed;
mod embeddings;
mod recommender;

use std::env;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use axum::{
    extract::{Form, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use redis::aio::ConnectionManager;
use redis::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use tokio::sync::Mutex;

use catalog_seed::CatalogFile;
use embeddings::LocalEmbedder;
use recommender::{
    build_filter_clause, Candidate, FilterOptions, RedisRecommender, RetrieveOptions,
    DEFAULT_INDEX_NAME, DEFAULT_KEY_PREFIX,
};

const DEMO_USER_ID: &str = "demo";

#[derive(Debug, Clone, serde::Serialize)]
struct RecentClick {
    id: String,
    name: String,
}

/// State shared across HTTP handlers. The recommender + embedder are
/// thread-safe so they only need an `Arc`; the small in-memory recent
/// clicks ring and the cached model name go behind a `Mutex`.
#[derive(Clone)]
struct AppState {
    recommender: Arc<RedisRecommender>,
    embedder: Arc<LocalEmbedder>,
    catalog_path: PathBuf,
    user_id: String,
    default_topk: usize,
    inner: Arc<Mutex<InnerState>>,
}

struct InnerState {
    recents: Vec<RecentClick>,
    model: String,
}

#[tokio::main]
async fn main() {
    let mut host = String::from("127.0.0.1");
    let mut port: u16 = 8088;
    let mut redis_host = env::var("REDIS_HOST").unwrap_or_else(|_| "localhost".to_string());
    let mut redis_port: u16 = env::var("REDIS_PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(6379);
    let mut index_name = DEFAULT_INDEX_NAME.to_string();
    let mut key_prefix = DEFAULT_KEY_PREFIX.to_string();
    let mut catalog_path = PathBuf::from("catalog.json");
    let mut topk: usize = 10;
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
            "--index-name" if i + 1 < args.len() => {
                index_name = args[i + 1].clone();
                i += 2;
            }
            "--key-prefix" if i + 1 < args.len() => {
                key_prefix = args[i + 1].clone();
                i += 2;
            }
            "--catalog" if i + 1 < args.len() => {
                catalog_path = PathBuf::from(&args[i + 1]);
                i += 2;
            }
            "--topk" if i + 1 < args.len() => {
                topk = args[i + 1].parse().expect("invalid --topk");
                i += 2;
            }
            "--no-reset" => {
                reset_on_start = false;
                i += 1;
            }
            _ => i += 1,
        }
    }

    if !catalog_path.exists() {
        eprintln!(
            "Error: catalog file not found at {}",
            catalog_path.display()
        );
        eprintln!("Generate it first with: cargo run --bin build_catalog");
        std::process::exit(1);
    }

    let url = format!("redis://{}:{}/", redis_host, redis_port);
    let client = Client::open(url).expect("failed to create Redis client");
    let conn = ConnectionManager::new(client)
        .await
        .expect("failed to connect to Redis");

    let recommender = Arc::new(
        RedisRecommender::new(conn)
            .with_index_name(index_name.clone())
            .with_key_prefix(key_prefix.clone()),
    );

    println!("Loading embedding model (first run downloads ~80 MB)...");
    let embedder = Arc::new(LocalEmbedder::new().expect("failed to load embedding model"));

    // Read the catalog up front so we can cache the model name without
    // re-parsing it on every /state call.
    let catalog: CatalogFile = {
        let body = std::fs::read_to_string(&catalog_path).expect("read catalog.json");
        serde_json::from_str(&body).expect("parse catalog.json")
    };

    let state = AppState {
        recommender: recommender.clone(),
        embedder: embedder.clone(),
        catalog_path: catalog_path.clone(),
        user_id: DEMO_USER_ID.to_string(),
        default_topk: topk,
        inner: Arc::new(Mutex::new(InnerState {
            recents: Vec::new(),
            model: catalog.model.clone(),
        })),
    };

    if reset_on_start {
        println!(
            "Dropping any existing index '{}' and re-seeding from {}.",
            index_name,
            catalog_path.display()
        );
        if let Err(e) = recommender.drop_index(true).await {
            eprintln!("DropIndex: {}", e);
        }
        if let Err(e) = recommender.create_index().await {
            eprintln!("CreateIndex: {}", e);
            std::process::exit(1);
        }
        let n = recommender
            .index_products(&catalog.products)
            .await
            .expect("index products");
        let _ = recommender.reset_user(DEMO_USER_ID).await;
        println!("Indexed {} products.", n);
    } else {
        if let Err(e) = recommender.create_index().await {
            eprintln!("CreateIndex: {}", e);
            std::process::exit(1);
        }
    }

    println!(
        "Redis recommendation engine demo listening on http://{}:{}",
        host, port
    );
    println!(
        "Using Redis at {}:{} with index '{}'",
        redis_host, redis_port, index_name
    );

    let app = Router::new()
        .route("/", get(index_page))
        .route("/state", get(state_handler))
        .route("/search", post(search_handler))
        .route("/click", post(click_handler))
        .route("/reset-user", post(reset_user_handler))
        .route("/reset-index", post(reset_index_handler))
        .route("/refresh-embedding", post(refresh_embedding_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind((host.as_str(), port))
        .await
        .expect("failed to bind");
    if let Err(err) = axum::serve(listener, app).await {
        eprintln!("server error: {}", err);
    }
}

// ----------------------------------------------------------------------
// HTTP handlers
// ----------------------------------------------------------------------

async fn index_page(State(state): State<AppState>) -> Response {
    let user_key = state.recommender.user_key(&state.user_id);
    let html = HTML_TEMPLATE
        .replace("__INDEX_NAME__", &state.recommender.index_name)
        .replace("__USER_KEY__", &user_key)
        .replace("__TOPK__", &state.default_topk.to_string());
    (
        [(header::CONTENT_TYPE, "text/html; charset=utf-8")],
        html,
    )
        .into_response()
}

async fn state_handler(State(state): State<AppState>) -> Response {
    let info = state.recommender.index_info().await;
    let products = state
        .recommender
        .list_products(200)
        .await
        .unwrap_or_default();
    let categories = state
        .recommender
        .list_categories()
        .await
        .unwrap_or_default();
    let brands = state.recommender.list_brands().await.unwrap_or_default();
    let user = user_view(&state).await;
    let model = state.inner.lock().await.model.clone();

    let body = json!({
        "user": user,
        "index": {
            "index_name": info.index_name,
            "num_docs": info.num_docs,
            "indexing_failures": info.indexing_failures,
            "vector_index_size_mb": info.vector_index_size_mb,
            "model": model,
        },
        "products": products,
        "categories": categories,
        "brands": brands,
    });
    Json(body).into_response()
}

#[derive(Deserialize)]
struct SearchForm {
    query: Option<String>,
    category: Option<String>,
    brand: Option<String>,
    min_price: Option<String>,
    max_price: Option<String>,
    min_rating: Option<String>,
    text_match: Option<String>,
    k: Option<String>,
    in_stock_only: Option<String>,
    use_session: Option<String>,
    rerank: Option<String>,
}

async fn search_handler(
    State(state): State<AppState>,
    Form(form): Form<SearchForm>,
) -> Response {
    let query_text = form
        .query
        .as_deref()
        .map(str::trim)
        .unwrap_or_default()
        .to_string();
    if query_text.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "query is required");
    }

    // Embed the query string on a blocking task so the ONNX inference
    // doesn't stall the tokio runtime.
    let t0 = Instant::now();
    let embedder = state.embedder.clone();
    let q = query_text.clone();
    let embed_result = tokio::task::spawn_blocking(move || embedder.encode_one(&q)).await;
    let query_vec = match embed_result {
        Ok(Ok(v)) => v,
        Ok(Err(e)) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let embed_ms = elapsed_ms(t0);

    let use_session = is_truthy(&form.use_session);
    let do_rerank = is_truthy(&form.rerank);
    let features = match state.recommender.get_user_features(&state.user_id).await {
        Ok(f) => f,
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let session_vec = if use_session {
        features.session_vec.clone()
    } else {
        None
    };

    let mut k: usize = form
        .k
        .as_deref()
        .and_then(|s| s.trim().parse().ok())
        .unwrap_or(state.default_topk);
    if k < 1 {
        k = 1;
    }
    if k > 40 {
        k = 40;
    }

    let filter = FilterOptions {
        category: form.category.map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
        brand: form.brand.map(|s| s.trim().to_string()).filter(|s| !s.is_empty()),
        min_price: parse_f64(&form.min_price),
        max_price: parse_f64(&form.max_price),
        min_rating: parse_f64(&form.min_rating),
        in_stock_only: is_truthy(&form.in_stock_only),
        text_match: form
            .text_match
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty()),
        text_field: None,
    };
    let filter_clause = build_filter_clause(&filter);

    let opts = RetrieveOptions {
        filter,
        k,
        session_vec: session_vec.clone(),
        session_weight: 0.3,
    };

    let t1 = Instant::now();
    let mut candidates = match state
        .recommender
        .candidate_retrieve(&query_vec, opts)
        .await
    {
        Ok(c) => c,
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let search_ms = elapsed_ms(t1);

    let t2 = Instant::now();
    if do_rerank {
        state.recommender.rerank(&mut candidates, &features, 0.0);
    }
    let rerank_ms = elapsed_ms(t2);

    let rows: Vec<Value> = candidates.iter().map(candidate_to_json).collect();
    Json(json!({
        "candidates": rows,
        "filter_clause": filter_clause,
        "used_session": session_vec.is_some(),
        "used_rerank": do_rerank && !features.affinities.is_empty(),
        "embed_ms": embed_ms,
        "search_ms": search_ms,
        "rerank_ms": rerank_ms,
        "timing_ms": embed_ms + search_ms + rerank_ms,
    }))
    .into_response()
}

#[derive(Deserialize)]
struct ClickForm {
    product_id: Option<String>,
}

async fn click_handler(
    State(state): State<AppState>,
    Form(form): Form<ClickForm>,
) -> Response {
    let product_id = form
        .product_id
        .as_deref()
        .map(str::trim)
        .unwrap_or_default()
        .to_string();
    if product_id.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "product_id is required");
    }
    let result = match state
        .recommender
        .record_click(&state.user_id, &product_id)
        .await
    {
        Ok(r) => r,
        Err(e) => {
            let s = e.to_string();
            if s.contains("unknown product") {
                return error_json(
                    StatusCode::NOT_FOUND,
                    &format!("unknown product {}", product_id),
                );
            }
            return error_json(StatusCode::INTERNAL_SERVER_ERROR, &s);
        }
    };

    // Remember the product name for the recent-clicks list.
    let name = product_name(&state, &product_id).await;
    {
        let mut inner = state.inner.lock().await;
        inner
            .recents
            .insert(0, RecentClick { id: product_id.clone(), name: name.clone() });
        if inner.recents.len() > 6 {
            inner.recents.truncate(6);
        }
    }
    let user = user_view(&state).await;
    Json(json!({
        "category": result.category,
        "affinity": result.affinity,
        "clicks": result.clicks,
        "last_clicked_id": result.last_clicked_id,
        "name": name,
        "user": user,
    }))
    .into_response()
}

async fn reset_user_handler(State(state): State<AppState>) -> Response {
    let _ = state.recommender.reset_user(&state.user_id).await;
    state.inner.lock().await.recents.clear();
    Json(json!({ "ok": true })).into_response()
}

async fn reset_index_handler(State(state): State<AppState>) -> Response {
    if let Err(e) = state.recommender.drop_index(true).await {
        return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
    }
    if let Err(e) = state.recommender.create_index().await {
        return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string());
    }
    let catalog: CatalogFile = match std::fs::read_to_string(&state.catalog_path) {
        Ok(body) => match serde_json::from_str(&body) {
            Ok(c) => c,
            Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
        },
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let n = match state.recommender.index_products(&catalog.products).await {
        Ok(n) => n,
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let _ = state.recommender.reset_user(&state.user_id).await;
    {
        let mut inner = state.inner.lock().await;
        inner.recents.clear();
        inner.model = catalog.model;
    }
    Json(json!({ "seeded": n })).into_response()
}

#[derive(Deserialize)]
struct RefreshEmbeddingForm {
    product_id: Option<String>,
    text: Option<String>,
}

async fn refresh_embedding_handler(
    State(state): State<AppState>,
    Form(form): Form<RefreshEmbeddingForm>,
) -> Response {
    let product_id = form
        .product_id
        .as_deref()
        .map(str::trim)
        .unwrap_or_default()
        .to_string();
    let text = form
        .text
        .as_deref()
        .map(str::trim)
        .unwrap_or_default()
        .to_string();
    if product_id.is_empty() || text.is_empty() {
        return error_json(StatusCode::BAD_REQUEST, "product_id and text are required");
    }
    let t0 = Instant::now();
    let embedder = state.embedder.clone();
    let t = text.clone();
    let vec_result = tokio::task::spawn_blocking(move || embedder.encode_one(&t)).await;
    let vec = match vec_result {
        Ok(Ok(v)) => v,
        Ok(Err(e)) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
        Err(e) => return error_json(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()),
    };
    let embed_ms = elapsed_ms(t0);

    if let Err(e) = state
        .recommender
        .refresh_embedding(&product_id, &vec)
        .await
    {
        let s = e.to_string();
        if s.contains("unknown product") {
            return error_json(
                StatusCode::NOT_FOUND,
                &format!("unknown product {}", product_id),
            );
        }
        return error_json(StatusCode::BAD_REQUEST, &s);
    }
    Json(json!({ "product_id": product_id, "embed_ms": embed_ms })).into_response()
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

async fn user_view(state: &AppState) -> Value {
    let features = state
        .recommender
        .get_user_features(&state.user_id)
        .await
        .unwrap_or_default();
    let recents = state.inner.lock().await.recents.clone();
    let session_vec_dim = features.session_vec.as_ref().map(|v| v.len()).unwrap_or(0);
    json!({
        "clicks": features.clicks,
        "last_clicked_id": features.last_clicked_id,
        "last_clicked_category": features.last_clicked_category,
        "affinities": features.affinities,
        "has_session_vec": features.session_vec.is_some(),
        "session_vec_dim": session_vec_dim,
        "recent_clicks": recents,
    })
}

async fn product_name(state: &AppState, product_id: &str) -> String {
    state
        .recommender
        .get_product_name(product_id)
        .await
        .unwrap_or_else(|| product_id.to_string())
}

fn candidate_to_json(c: &Candidate) -> Value {
    json!({
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "category": c.category,
        "brand": c.brand,
        "price": c.price,
        "rating": c.rating,
        "in_stock": c.in_stock,
        "vector_distance": round4(c.vector_distance),
        "score": round4(c.score),
    })
}

fn parse_f64(raw: &Option<String>) -> Option<f64> {
    let s = raw.as_deref()?.trim();
    if s.is_empty() {
        return None;
    }
    s.parse().ok()
}

fn is_truthy(raw: &Option<String>) -> bool {
    raw.as_deref()
        .map(|s| !s.trim().is_empty() && s.trim() != "0" && s.trim().to_ascii_lowercase() != "false")
        .unwrap_or(false)
}

fn elapsed_ms(t: Instant) -> f64 {
    let d = t.elapsed();
    (d.as_secs() as f64) * 1000.0 + (d.subsec_nanos() as f64) / 1_000_000.0
}

fn round4(v: f64) -> f64 {
    (v * 10_000.0).round() / 10_000.0
}

fn error_json(status: StatusCode, message: &str) -> Response {
    (status, Json(json!({ "error": message }))).into_response()
}

// HTML template copied verbatim from the Python demo so the docs stay
// consistent across language ports. Only the pill text is changed to
// surface the Rust stack.
const HTML_TEMPLATE: &str = r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Recommendation Engine Demo</title>
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
      --card: #fbfdfc;
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
    main { max-width: 1180px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 60rem; font-size: 1.05rem; color: var(--muted); }
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
    input[type=checkbox] { width: auto; }
    .check-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .check-row label { margin: 0; font-weight: normal; }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small {
      padding: 5px 10px; font-size: 0.85rem; margin-top: 4px;
      border-radius: 7px;
    }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr;
         gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px;
             border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.score { background: var(--ok); color: #1d4a2c; }
    .badge.boost { background: #e6e0f0; color: #43326a; }
    .badge.stockout { background: var(--warn); color: #6b3220; }
    .cards {
      display: grid; gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      margin-top: 8px;
    }
    .card {
      background: var(--card); border: 1px solid var(--line);
      border-radius: 12px; padding: 12px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .card .name { font-weight: bold; }
    .card .meta { font-size: 0.85rem; color: var(--muted); }
    .card .price { font-weight: bold; }
    .scores { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .scores .badge { font-size: 0.75rem; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    details summary {
      cursor: pointer; font-weight: bold; margin-top: 8px;
      color: var(--accent-dark);
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-rs + fastembed + axum</div>
    <h1>Redis Recommendation Engine Demo</h1>
    <p class="lede">
      A small product catalogue is indexed by Redis Search at
      <code>__INDEX_NAME__</code>: each item is a Hash holding its
      metadata plus a 384-dimensional embedding. One <code>FT.SEARCH</code>
      with a <code>KNN</code> clause does similarity retrieval and
      structured pre-filtering in the same call. Click a product card
      to feed a click into the session — Redis updates the user-features
      hash atomically, and the very next query picks it up.
    </p>

    <div class="grid">

      <section class="panel wide">
        <h2>Search</h2>
        <p>The query text is embedded with the same model used to build
        the catalogue, then handed to <code>FT.SEARCH</code> as the
        <code>$vec</code> parameter inside a
        <code>KNN __TOPK__ @embedding</code> clause. Filters become
        TAG / NUMERIC predicates in front of the KNN, applied in one
        round trip.</p>
        <div class="row">
          <div style="flex: 2 1 360px;">
            <label for="q-text">Query</label>
            <input id="q-text" type="text"
                   value="warm waterproof jacket for hiking"
                   placeholder="describe what you want">
          </div>
          <div>
            <label for="q-category">Category</label>
            <select id="q-category"><option value="">(any)</option></select>
          </div>
          <div>
            <label for="q-brand">Brand</label>
            <select id="q-brand"><option value="">(any)</option></select>
          </div>
        </div>
        <div class="row">
          <div>
            <label for="q-min-price">Min price</label>
            <input id="q-min-price" type="number" min="0" step="1">
          </div>
          <div>
            <label for="q-max-price">Max price</label>
            <input id="q-max-price" type="number" min="0" step="1">
          </div>
          <div>
            <label for="q-min-rating">Min rating</label>
            <input id="q-min-rating" type="number" min="0" max="5" step="0.1">
          </div>
          <div>
            <label for="q-k">Top K</label>
            <input id="q-k" type="number" min="1" max="40" value="__TOPK__">
          </div>
        </div>
        <div class="row">
          <div style="flex: 2 1 280px;">
            <label for="q-description-contains">
              Description contains
              <span class="meta">(TEXT pre-filter on the description field)</span>
            </label>
            <input id="q-description-contains" type="text"
                   placeholder='e.g. "waterproof", "fleece"'>
          </div>
        </div>
        <div class="row">
          <div class="check-row">
            <input id="q-in-stock" type="checkbox" checked>
            <label for="q-in-stock">In stock only</label>
          </div>
          <div class="check-row">
            <input id="q-use-session" type="checkbox" checked>
            <label for="q-use-session">Blend session vector into query</label>
          </div>
          <div class="check-row">
            <input id="q-rerank" type="checkbox" checked>
            <label for="q-rerank">Re-rank with category affinities</label>
          </div>
        </div>
        <button id="search-button">Search</button>
        <div id="search-meta" class="meta" style="margin-top: 10px;"></div>
        <div id="search-results"></div>
      </section>

      <section class="panel">
        <h2>Session signal</h2>
        <p>Each click updates the user features hash (<code>__USER_KEY__</code>):
        a new session vector blended via EWMA over the clicked item
        vectors, plus an atomic <code>HINCRBYFLOAT</code> on the
        per-category affinity counter. The next request reads the
        updated hash and passes the session vector to
        <code>FT.SEARCH</code> as the <code>$vec</code> parameter — no
        batch cycle.</p>
        <dl id="user-features"></dl>
        <h3>Affinities</h3>
        <div id="user-affinities"></div>
        <h3>Recent clicks</h3>
        <ul id="recent-clicks"></ul>
        <button id="reset-user-button" class="secondary">Reset session</button>
      </section>

      <section class="panel">
        <h2>Refresh an item embedding</h2>
        <p>Re-embed a single product with a new piece of text and
        <code>HSET</code> the bytes back. The HNSW index reflects the
        change on the very next query — production embedding rollouts
        use the same path.</p>
        <label for="refresh-product">Product</label>
        <select id="refresh-product"></select>
        <label for="refresh-text">New text to embed</label>
        <input id="refresh-text"
               value="luxurious heavy parka with hood for arctic expedition">
        <button id="refresh-button">Refresh embedding</button>
        <p class="meta" id="refresh-meta" style="margin-top: 6px;"></p>
      </section>

      <section class="panel wide">
        <h2>Catalogue</h2>
        <p>Every item in the index, sorted by price. Click a card to
        record a session click.</p>
        <div class="cards" id="catalog-cards"></div>
      </section>

      <section class="panel wide">
        <h2>Index state</h2>
        <div id="index-state"></div>
        <button id="reset-index-button" class="danger">Reset everything (re-index from catalog.json)</button>
      </section>

    </div>

    <div id="status"></div>
  </main>

  <script>
    const $ = sel => document.querySelector(sel);
    const status = $('#status');

    function showStatus(text, kind) {
      status.textContent = text;
      status.className = kind || 'ok';
      setTimeout(() => { status.className = ''; status.textContent = ''; }, 4000);
    }

    async function postForm(path, params) {
      const body = new URLSearchParams(params || {}).toString();
      const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    }

    async function getJson(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    }

    function renderUser(features) {
      const dl = $('#user-features');
      dl.innerHTML = `
        <dt>Clicks</dt><dd>${features.clicks}</dd>
        <dt>Last clicked</dt>
        <dd>${features.last_clicked_id ? features.last_clicked_id + ' (' + features.last_clicked_category + ')' : '—'}</dd>
        <dt>Session vector</dt>
        <dd>${features.has_session_vec ? '✓ stored, ' + features.session_vec_dim + ' floats' : '—'}</dd>
      `;
      const aff = $('#user-affinities');
      const entries = Object.entries(features.affinities || {});
      if (!entries.length) {
        aff.textContent = '(none yet)';
      } else {
        entries.sort((a, b) => b[1] - a[1]);
        aff.innerHTML = entries.map(([cat, w]) =>
          `<span class="badge score">${cat} +${w.toFixed(2)}</span>`
        ).join(' ');
      }
      const ul = $('#recent-clicks');
      ul.innerHTML = (features.recent_clicks || []).map(rc =>
        `<li><code>${rc.id}</code> ${rc.name}</li>`
      ).join('') || '<li>(none)</li>';
    }

    function renderIndex(info) {
      $('#index-state').innerHTML = `
        <dl>
          <dt>Indexed documents</dt><dd>${info.num_docs}</dd>
          <dt>Index name</dt><dd><code>${info.index_name}</code></dd>
          <dt>Indexing failures</dt><dd>${info.indexing_failures}</dd>
          <dt>Vector index size</dt><dd>${info.vector_index_size_mb} MB</dd>
          <dt>Embedding model</dt><dd><code>${info.model}</code></dd>
        </dl>
      `;
    }

    function renderResult(c) {
      const stockBadge = c.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      // c.score is a cosine distance (0 = identical), optionally
      // reduced by a category-affinity bonus at rerank time. Lower
      // means more relevant. When the rerank actually pulled the score
      // down by more than a token amount, surface the size of the
      // bonus so the boost is visible.
      const boost = c.vector_distance - c.score;
      const boostBadge = boost > 0.005
        ? ` <span class="badge boost">−${boost.toFixed(3)} affinity</span>`
        : '';
      return `
        <tr>
          <td><code>${c.id}</code></td>
          <td>
            <strong>${c.name}</strong> ${stockBadge}<br>
            <span class="meta">${c.brand} · ${c.category} · $${c.price.toFixed(2)} · ★ ${c.rating.toFixed(1)}</span>
          </td>
          <td>
            <span class="badge score">${c.score.toFixed(3)}</span>${boostBadge}
          </td>
          <td><button class="small" data-click-id="${c.id}">Click</button></td>
        </tr>
      `;
    }

    function renderSearch(payload) {
      const meta = $('#search-meta');
      meta.innerHTML = `
        Returned ${payload.candidates.length} candidate(s) in
        <code>${payload.timing_ms.toFixed(2)} ms</code>
        (embed: <code>${payload.embed_ms.toFixed(2)} ms</code>,
        search: <code>${payload.search_ms.toFixed(2)} ms</code>,
        rerank: <code>${payload.rerank_ms.toFixed(2)} ms</code>).
        Filter: <code>${payload.filter_clause}</code>.
        Session blended: ${payload.used_session ? 'yes' : 'no'};
        re-ranked: ${payload.used_rerank ? 'yes' : 'no'}.
      `;
      const rows = payload.candidates.map(renderResult).join('');
      $('#search-results').innerHTML = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Score <span class="meta">(cosine distance, lower = closer)</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function productCard(p) {
      const stockBadge = p.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      return `
        <div class="card">
          <span class="name">${p.name} ${stockBadge}</span>
          <span class="meta">${p.brand} · ${p.category}</span>
          <span class="meta">★ ${p.rating.toFixed(1)}</span>
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="small" data-click-id="${p.id}">Click</button>
        </div>
      `;
    }

    function renderCatalog(products) {
      $('#catalog-cards').innerHTML = products.map(productCard).join('');
      const refresh = $('#refresh-product');
      refresh.innerHTML = products.map(p =>
        `<option value="${p.id}">${p.id} — ${p.name}</option>`
      ).join('');
    }

    function populateSelect(id, values) {
      const sel = document.querySelector(id);
      const current = sel.value;
      sel.innerHTML = '<option value="">(any)</option>'
        + values.map(v => `<option value="${v}">${v}</option>`).join('');
      sel.value = current;
    }

    async function refreshState() {
      const state = await getJson('/state');
      renderUser(state.user);
      renderIndex(state.index);
      renderCatalog(state.products);
      populateSelect('#q-category', state.categories);
      populateSelect('#q-brand', state.brands);
    }

    async function search() {
      const params = {
        query: $('#q-text').value,
        category: $('#q-category').value,
        brand: $('#q-brand').value,
        min_price: $('#q-min-price').value,
        max_price: $('#q-max-price').value,
        min_rating: $('#q-min-rating').value,
        text_match: $('#q-description-contains').value,
        k: $('#q-k').value,
        in_stock_only: $('#q-in-stock').checked ? '1' : '',
        use_session: $('#q-use-session').checked ? '1' : '',
        rerank: $('#q-rerank').checked ? '1' : '',
      };
      try {
        const payload = await postForm('/search', params);
        renderSearch(payload);
      } catch (exc) {
        showStatus('Search failed: ' + exc.message, 'error');
      }
    }

    async function recordClick(productId) {
      try {
        const payload = await postForm('/click', {product_id: productId});
        showStatus(`Click recorded: ${productId} (${payload.category})`, 'ok');
        renderUser(payload.user);
      } catch (exc) {
        showStatus('Click failed: ' + exc.message, 'error');
      }
    }

    document.body.addEventListener('click', e => {
      const id = e.target?.dataset?.clickId;
      if (id) recordClick(id);
    });

    $('#search-button').onclick = search;
    $('#reset-user-button').onclick = async () => {
      await postForm('/reset-user', {});
      await refreshState();
      $('#search-results').innerHTML = '';
      $('#search-meta').textContent = '';
      showStatus('Session cleared', 'ok');
    };
    $('#reset-index-button').onclick = async () => {
      await postForm('/reset-index', {});
      await refreshState();
      showStatus('Re-indexed catalogue from catalog.json', 'ok');
    };
    $('#refresh-button').onclick = async () => {
      const productId = $('#refresh-product').value;
      const text = $('#refresh-text').value;
      try {
        const payload = await postForm('/refresh-embedding',
          {product_id: productId, text});
        $('#refresh-meta').innerHTML =
          `Refreshed <code>${payload.product_id}</code>. ` +
          `Embedding wrote in <code>${payload.embed_ms.toFixed(2)} ms</code>; ` +
          `next FT.SEARCH will see the new vector.`;
        showStatus(`Re-embedded ${payload.product_id}`, 'ok');
      } catch (exc) {
        showStatus('Refresh failed: ' + exc.message, 'error');
      }
    };

    refreshState();
  </script>
</body>
</html>
"##;
