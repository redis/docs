//! Redis semantic-cache demo server (Rust).
//!
//! Run this binary and visit http://localhost:8091 to drive a small
//! semantic-cache demo backed by Redis Search. The UI lets you:
//!
//!   - Type a natural-language prompt and watch the cache decide hit
//!     or miss. On a hit Redis returns the cached response in tens of
//!     milliseconds and the demo LLM is not called at all; on a miss
//!     the demo LLM "thinks" for ~1.5 s before answering and the new
//!     prompt, response, and embedding are written back to Redis for
//!     next time.
//!   - Adjust the cosine-distance threshold to see how close a
//!     paraphrase must be for the cache to serve it.
//!   - Switch tenant, locale, or model version to see metadata
//!     isolation in action — entries written under one tenant cannot
//!     be served to another, because the TAG filter goes into the
//!     same FT.SEARCH call as the KNN.
//!   - Inspect every cached entry with TTL and hit count, and drop
//!     individual entries to simulate eviction.
//!
//! The server holds a single `LocalEmbedder`, a single
//! `RedisSemanticCache`, and a single `MockLlm` for the lifetime of
//! the process. The first run downloads the embedding model into the
//! local Hugging Face cache; everything after is offline.

mod cache;
mod embeddings;
mod mock_llm;
mod seed_cache;

use std::collections::HashMap;
use std::io::Read;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use serde::Serialize;
use serde_json::{json, Value as JsonValue};
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

use crate::cache::{
    Entry, IndexInfo, LookupParams, LookupResult, PutParams, RedisSemanticCache, VECTOR_DIM_DEFAULT,
};
use crate::embeddings::LocalEmbedder;
use crate::mock_llm::MockLlm;
use crate::seed_cache::{seed, SeedOptions};

const STACK_LABEL: &str = "redis-rs + candle + tiny_http (Rust)";
const MAX_BODY_BYTES: usize = 1 * 1024 * 1024;

// ----- CLI flags -----------------------------------------------------

struct Flags {
    host: String,
    port: u16,
    redis_host: String,
    redis_port: u16,
    index_name: String,
    key_prefix: String,
    ttl_seconds: i64,
    threshold: f64,
    llm_latency_ms: f64,
    no_reset: bool,
}

impl Default for Flags {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".into(),
            port: 8091,
            redis_host: "localhost".into(),
            redis_port: 6379,
            index_name: "semcache:idx".into(),
            key_prefix: "cache:".into(),
            ttl_seconds: 3600,
            threshold: 0.5,
            llm_latency_ms: 1500.0,
            no_reset: false,
        }
    }
}

fn parse_flags() -> Flags {
    // Stdlib arg parsing keeps the dependency list short. The flag
    // surface is small enough that a hand-rolled loop is cheaper than
    // pulling clap in. Long flags only ("--host=x" or "--host x");
    // unknown flags abort.
    let mut f = Flags::default();
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut i = 0;
    while i < args.len() {
        let arg = &args[i];
        let (name, value, advance) = if let Some((n, v)) = arg.split_once('=') {
            (n.to_string(), Some(v.to_string()), false)
        } else {
            (arg.clone(), args.get(i + 1).cloned(), true)
        };
        match name.as_str() {
            "--host" => { f.host = value.expect("--host requires a value"); if advance { i += 1; } }
            "--port" => { f.port = value.expect("--port requires a value").parse().expect("--port must be an integer"); if advance { i += 1; } }
            "--redis-host" => { f.redis_host = value.expect("--redis-host requires a value"); if advance { i += 1; } }
            "--redis-port" => { f.redis_port = value.expect("--redis-port requires a value").parse().expect("--redis-port must be an integer"); if advance { i += 1; } }
            "--index-name" => { f.index_name = value.expect("--index-name requires a value"); if advance { i += 1; } }
            "--key-prefix" => { f.key_prefix = value.expect("--key-prefix requires a value"); if advance { i += 1; } }
            "--ttl-seconds" => { f.ttl_seconds = value.expect("--ttl-seconds requires a value").parse().expect("--ttl-seconds must be an integer"); if advance { i += 1; } }
            "--threshold" => { f.threshold = value.expect("--threshold requires a value").parse().expect("--threshold must be a float"); if advance { i += 1; } }
            "--llm-latency-ms" => { f.llm_latency_ms = value.expect("--llm-latency-ms requires a value").parse().expect("--llm-latency-ms must be a float"); if advance { i += 1; } }
            "--no-reset" => { f.no_reset = true; }
            "--help" | "-h" => { print_help(); std::process::exit(0); }
            other => {
                eprintln!("unknown flag: {}", other);
                print_help();
                std::process::exit(2);
            }
        }
        i += 1;
    }
    f
}

fn print_help() {
    eprintln!(
        "semcache-demo: Redis semantic cache demo (Rust)\n\
         \n\
         Flags:\n\
           --host <addr>            interface to bind to (default 127.0.0.1)\n\
           --port <n>               HTTP port (default 8091)\n\
           --redis-host <host>      Redis host (default localhost)\n\
           --redis-port <n>         Redis port (default 6379)\n\
           --index-name <name>      Redis Search index name (default semcache:idx)\n\
           --key-prefix <prefix>    Cache key prefix (default cache:)\n\
           --ttl-seconds <n>        TTL applied to every cache entry (default 3600)\n\
           --threshold <f>          Default cosine-distance threshold (default 0.5)\n\
           --llm-latency-ms <f>     Simulated mock LLM latency (default 1500)\n\
           --no-reset               Skip the cache reset + seed on startup\n"
    );
}

// ----- Shared demo state ---------------------------------------------

struct AppState {
    cache: RedisSemanticCache,
    embedder: LocalEmbedder,
    llm: MockLlm,
    html_page: String,
    default_tenant: String,
    default_locale: String,
}

impl AppState {
    fn seed_now(&self) -> Result<usize, Box<dyn std::error::Error>> {
        self.cache.clear()?;
        seed(
            &self.cache,
            &self.embedder,
            SeedOptions {
                tenant: &self.default_tenant,
                locale: &self.default_locale,
                model_version: &self.llm.model_version,
            },
        )
    }
}

// ----- HTTP helpers --------------------------------------------------

fn json_response(payload: &JsonValue, status: u16) -> Response<std::io::Cursor<Vec<u8>>> {
    let body = serde_json::to_vec(payload).unwrap_or_else(|_| b"{}".to_vec());
    Response::from_data(body)
        .with_status_code(StatusCode(status))
        .with_header(
            "Content-Type: application/json; charset=utf-8"
                .parse::<Header>()
                .unwrap(),
        )
}

fn html_response(html: String, status: u16) -> Response<std::io::Cursor<Vec<u8>>> {
    Response::from_data(html.into_bytes())
        .with_status_code(StatusCode(status))
        .with_header(
            "Content-Type: text/html; charset=utf-8"
                .parse::<Header>()
                .unwrap(),
        )
}

fn error_json(err_type: &str, message: &str) -> JsonValue {
    json!({ "error": message, "type": err_type })
}

/// Read a request body up to MAX_BODY_BYTES. Returns an error string
/// if the body would exceed the cap; the handler surfaces that as a
/// 400 to the client.
fn read_body(req: &mut Request) -> Result<String, String> {
    let mut buf = Vec::new();
    {
        let mut limited = req.as_reader().take((MAX_BODY_BYTES + 1) as u64);
        limited
            .read_to_end(&mut buf)
            .map_err(|e| format!("reading body: {}", e))?;
    }
    if buf.len() > MAX_BODY_BYTES {
        return Err(format!("request body exceeds {} bytes", MAX_BODY_BYTES));
    }
    String::from_utf8(buf).map_err(|e| format!("body is not valid UTF-8: {}", e))
}

fn parse_form(body: &str) -> HashMap<String, String> {
    let mut out = HashMap::new();
    for (k, v) in url::form_urlencoded::parse(body.as_bytes()) {
        out.insert(k.into_owned(), v.into_owned());
    }
    out
}

/// Clamp the threshold from a form-body string. `parse::<f64>` happily
/// handles "nan" → NaN and "inf" → +Inf; either would silently turn
/// the lookup into a permanent hit (NaN comparisons are always false,
/// so `distance > NaN` cannot reject) or a permanent miss. Use
/// `f64::is_finite` to reject those explicitly and fall back to 0.5;
/// finite values are clamped to the cosine-distance range [0, 2].
fn clamp_threshold(raw: &str) -> f64 {
    let parsed: f64 = raw.trim().parse().unwrap_or(f64::NAN);
    if !parsed.is_finite() {
        return 0.5;
    }
    if parsed < 0.0 {
        0.0
    } else if parsed > 2.0 {
        2.0
    } else {
        parsed
    }
}

// ----- /state response shape -----------------------------------------

#[derive(Serialize)]
struct StateIndex {
    num_docs: i64,
    index_name: String,
    indexing_failures: i64,
    vector_index_size_mb: f64,
    model: String,
    mock_llm_latency_ms: f64,
    default_threshold: f64,
    stack_label: String,
}

#[derive(Serialize)]
struct State {
    index: StateIndex,
    entries: Vec<Entry>,
}

fn build_state(app: &AppState) -> Result<State, Box<dyn std::error::Error>> {
    let info: IndexInfo = app.cache.index_info();
    let entries = app.cache.list_entries(200)?;
    Ok(State {
        index: StateIndex {
            num_docs: info.num_docs,
            index_name: app.cache.index_name.clone(),
            indexing_failures: info.indexing_failures,
            vector_index_size_mb: info.vector_index_size_mb,
            model: app.embedder.model_name.clone(),
            mock_llm_latency_ms: app.llm.latency_ms,
            default_threshold: app.cache.distance_threshold,
            stack_label: STACK_LABEL.to_string(),
        },
        entries,
    })
}

// ----- Query hot path -------------------------------------------------

struct QueryParams {
    prompt: String,
    tenant: String,
    locale: String,
    model_version: String,
    threshold: f64,
    lookup_only: bool,
}

fn run_query(app: &AppState, p: QueryParams) -> Result<JsonValue, Box<dyn std::error::Error>> {
    let t0 = Instant::now();
    let query_vec = app.embedder.encode_one(&p.prompt)?;
    let embed_ms = ms_since(t0);

    let t1 = Instant::now();
    let result = app.cache.lookup(
        &query_vec,
        LookupParams {
            tenant: Some(&p.tenant),
            locale: Some(&p.locale),
            model_version: Some(&p.model_version),
            safety: None, // default "ok"
            distance_threshold: Some(p.threshold),
        },
    )?;
    let lookup_ms = ms_since(t1);

    match result {
        LookupResult::Hit(hit) => Ok(json!({
            "outcome": "hit",
            "response": hit.response,
            "entry_id": hit.id,
            "distance": hit.distance,
            "ttl_seconds": hit.ttl_seconds,
            "hit_count": hit.hit_count,
            "threshold": p.threshold,
            "embed_ms": embed_ms,
            "lookup_ms": lookup_ms,
            "llm_ms": JsonValue::Null,
            "total_ms": embed_ms + lookup_ms,
            "tokens_avoided": estimate_response_tokens(&hit.prompt, &hit.response),
            "ms_avoided": app.llm.latency_ms,
        })),
        LookupResult::Miss(miss) => {
            let nearest_distance = match miss.nearest_distance {
                Some(d) => json!(d),
                None => JsonValue::Null,
            };
            if p.lookup_only {
                return Ok(json!({
                    "outcome": "miss",
                    "response": "(LLM not called in lookup-only mode)",
                    "nearest_distance": nearest_distance,
                    "threshold": p.threshold,
                    "wrote_entry_id": JsonValue::Null,
                    "embed_ms": embed_ms,
                    "lookup_ms": lookup_ms,
                    "llm_ms": JsonValue::Null,
                    "total_ms": embed_ms + lookup_ms,
                }));
            }

            let t2 = Instant::now();
            let llm_resp = app.llm.complete(&p.prompt);
            let llm_ms = ms_since(t2);

            let entry_id = app.cache.put(PutParams {
                prompt: &p.prompt,
                response: &llm_resp.response,
                embedding: &query_vec,
                tenant: &p.tenant,
                locale: &p.locale,
                model_version: &p.model_version,
                safety: "ok",
                ttl_seconds: None,
                entry_id: None,
            })?;

            Ok(json!({
                "outcome": "miss",
                "response": llm_resp.response,
                "nearest_distance": nearest_distance,
                "threshold": p.threshold,
                "wrote_entry_id": entry_id,
                "embed_ms": embed_ms,
                "lookup_ms": lookup_ms,
                "llm_ms": llm_ms,
                "total_ms": embed_ms + lookup_ms + llm_ms,
            }))
        }
    }
}

fn ms_since(t: Instant) -> f64 {
    (t.elapsed().as_micros() as f64) / 1000.0
}

fn estimate_response_tokens(prompt: &str, response: &str) -> i64 {
    let n = ((prompt.len() + response.len()) / 4) as i64;
    if n < 1 {
        1
    } else {
        n
    }
}

// ----- Request routing -----------------------------------------------

/// Top-level request handler. Takes ownership of the request and
/// always calls `respond()` exactly once. Wraps the inner dispatch
/// in `catch_unwind` so a panic in any handler becomes a JSON 500
/// rather than a dropped connection.
fn handle_request(app: &AppState, mut req: Request) {
    // The dispatch must return a Response (or take ownership of the
    // request to do its own respond, e.g. for streaming). We keep it
    // simple by always returning a Response from `dispatch`.
    let path = req.url().split('?').next().unwrap_or("/").to_string();
    let method = req.method().clone();

    let response = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        dispatch(app, &method, &path, &mut req)
    }));
    let response = match response {
        Ok(r) => r,
        Err(panic) => {
            eprintln!("[demo] panic in handler: {:?}", panic);
            let msg = format!("internal server error: {:?}", panic);
            json_response(&error_json("panic", &msg), 500)
        }
    };
    let _ = req.respond(response);
}

fn dispatch(
    app: &AppState,
    method: &Method,
    path: &str,
    req: &mut Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    match (method, path) {
        (Method::Get, "/") | (Method::Get, "/index.html") => html_response(app.html_page.clone(), 200),
        (Method::Get, "/state") => match build_state(app) {
            Ok(s) => match serde_json::to_value(&s) {
                Ok(v) => json_response(&v, 200),
                Err(e) => json_response(&error_json("state_encode", &e.to_string()), 500),
            },
            Err(e) => json_response(&error_json("state", &e.to_string()), 500),
        },
        (Method::Post, "/query") => handle_query(app, req),
        (Method::Post, "/reset") => match app.seed_now() {
            Ok(_) => json_response(&json!({"ok": true}), 200),
            Err(e) => json_response(&error_json("reset", &e.to_string()), 500),
        },
        (Method::Post, "/drop") => handle_drop(app, req),
        _ => json_response(&error_json("not_found", "not found"), 404),
    }
}

fn handle_query(app: &AppState, req: &mut Request) -> Response<std::io::Cursor<Vec<u8>>> {
    let body = match read_body(req) {
        Ok(b) => b,
        Err(e) => return json_response(&error_json("bad_request", &e), 400),
    };
    let form = parse_form(&body);
    let prompt = form
        .get("prompt")
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    if prompt.is_empty() {
        return json_response(&error_json("bad_request", "prompt is required"), 400);
    }
    let tenant = form
        .get("tenant")
        .map(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("acme")
        .to_string();
    let locale = form
        .get("locale")
        .map(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("en")
        .to_string();
    let default_model = app.llm.model_version.clone();
    let model_version = form
        .get("model_version")
        .map(|s| s.as_str())
        .filter(|s| !s.is_empty())
        .unwrap_or(&default_model)
        .to_string();
    let threshold = clamp_threshold(form.get("threshold").map(|s| s.as_str()).unwrap_or(""));
    let lookup_only = form
        .get("lookup_only")
        .map(|s| {
            !s.is_empty() && s != "0" && s.to_lowercase() != "false"
        })
        .unwrap_or(false);

    match run_query(
        app,
        QueryParams {
            prompt,
            tenant,
            locale,
            model_version,
            threshold,
            lookup_only,
        },
    ) {
        Ok(payload) => json_response(&payload, 200),
        Err(e) => {
            eprintln!("[demo] /query error: {}", e);
            json_response(&error_json("query", &e.to_string()), 500)
        }
    }
}

fn handle_drop(app: &AppState, req: &mut Request) -> Response<std::io::Cursor<Vec<u8>>> {
    let body = match read_body(req) {
        Ok(b) => b,
        Err(e) => return json_response(&error_json("bad_request", &e), 400),
    };
    let form = parse_form(&body);
    let entry_id = form
        .get("entry_id")
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    if entry_id.is_empty() {
        return json_response(&error_json("bad_request", "entry_id is required"), 400);
    }
    match app.cache.delete_entry(&entry_id) {
        Ok(deleted) => json_response(
            &json!({"deleted": deleted, "entry_id": entry_id}),
            200,
        ),
        Err(e) => json_response(&error_json("drop", &e.to_string()), 500),
    }
}

// ----- Entry point ---------------------------------------------------

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let flags = parse_flags();

    println!("Connecting to Redis at {}:{} ...", flags.redis_host, flags.redis_port);
    let client = redis::Client::open(format!("redis://{}:{}/", flags.redis_host, flags.redis_port))?;
    {
        let mut con = client.get_connection()?;
        let _: String = redis::cmd("PING").query(&mut con)?;
    }

    let cache = RedisSemanticCache::new(
        client,
        flags.index_name.clone(),
        flags.key_prefix.clone(),
        VECTOR_DIM_DEFAULT,
        flags.threshold,
        flags.ttl_seconds,
    )?;
    cache.create_index()?;

    println!("Loading embedding model (first run downloads the MiniLM weights from Hugging Face)...");
    let embedder = LocalEmbedder::new(None)?;

    let llm = MockLlm::new(None, flags.llm_latency_ms);

    let app = Arc::new(AppState {
        cache,
        embedder,
        llm,
        html_page: load_html(&flags)?,
        default_tenant: "acme".into(),
        default_locale: "en".into(),
    });

    if !flags.no_reset {
        println!(
            "Dropping any existing cache under '{}*' and re-seeding from the FAQ list (pass --no-reset to keep).",
            flags.key_prefix
        );
        let seeded = app.seed_now()?;
        println!("Seeded {} entries.", seeded);
    }

    let addr = format!("{}:{}", flags.host, flags.port);
    let server = Server::http(&addr).map_err(|e| format!("starting HTTP server: {}", e))?;
    println!("Redis semantic cache demo listening on http://{}", addr);
    println!(
        "Using Redis at {}:{} with index '{}'",
        flags.redis_host, flags.redis_port, flags.index_name
    );

    // tiny_http hands out requests round-robin to whichever thread is
    // pulling from the iterator. A small worker pool means a /state
    // poll doesn't have to wait for a /query that's still embedding.
    // Four workers is plenty for one user clicking around.
    let server = Arc::new(server);
    let mut workers = Vec::new();
    for _ in 0..4 {
        let app = Arc::clone(&app);
        let server = Arc::clone(&server);
        workers.push(std::thread::spawn(move || {
            for req in server.incoming_requests() {
                handle_request(&app, req);
            }
        }));
    }
    for w in workers {
        let _ = w.join();
    }
    Ok(())
}

fn load_html(flags: &Flags) -> Result<String, std::io::Error> {
    // Resolve `index.html` next to the executable; fall back to the
    // current working directory (matches the Go demo's
    // `executableDir` lookup so `cargo run` works from the source
    // directory).
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(exe) = std::env::current_exe() {
        if let Some(parent) = exe.parent() {
            candidates.push(parent.join("index.html"));
            if let Some(grand) = parent.parent() {
                if let Some(great) = grand.parent() {
                    candidates.push(great.join("index.html"));
                }
            }
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join("index.html"));
    }
    for path in &candidates {
        if path.exists() {
            let raw = std::fs::read_to_string(path)?;
            return Ok(raw
                .replace("__INDEX_NAME__", &flags.index_name)
                .replace("__KEY_PREFIX__", &flags.key_prefix));
        }
    }
    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        format!("index.html not found in any of: {:?}", candidates),
    ))
}
