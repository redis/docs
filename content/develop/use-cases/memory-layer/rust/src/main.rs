//! Redis agent-memory demo server (Rust + redis-rs + Candle).
//!
//! Run this and visit `http://localhost:8094` to drive a small
//! agent-memory demo backed by Redis Hashes, JSON, Search, and
//! Streams. The UI lets you type a turn, watch working memory update,
//! see semantically similar long-term memories recalled, watch the
//! write-time deduplication skip near-duplicates, and inspect the
//! per-thread event log.
//!
//! The server holds a single [`LocalEmbedder`], one [`AgentSession`],
//! one [`LongTermMemory`], and one [`AgentEventLog`] for the lifetime
//! of the process. The first run downloads the embedding model into
//! the local Hugging Face cache; everything after is local.

use std::env;
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use serde::Serialize;
use serde_json::{json, Value as JsonValue};
use tiny_http::{Header, Method, Response, Server, StatusCode};
use url::form_urlencoded;

// Pull the helpers in through the library crate so the same module
// paths the walkthrough quotes (e.g. `agent_memory_demo::session_store`)
// also work inside the binary.
use agent_memory_demo::embeddings::LocalEmbedder;
use agent_memory_demo::event_log::AgentEventLog;
use agent_memory_demo::long_term_memory::{LongTermMemory, MemoryRecord, WriteResult};
use agent_memory_demo::seed_memory::seed as seed_memories;
use agent_memory_demo::session_store::{AgentSession, SessionState};

const STACK_LABEL: &str =
    "redis-rs + tiny_http + Candle (BERT / sentence-transformers MiniLM)";

// 1 MiB cap on POST bodies so a runaway client (or a `curl
// --data-binary @big-file` by mistake) can't accumulate unbounded
// memory before the handler runs.
const MAX_BODY_BYTES: usize = 1 * 1024 * 1024;

fn main() {
    let args = match Args::parse(env::args().collect::<Vec<_>>()) {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Error: {}", e);
            print_help();
            std::process::exit(2);
        }
    };

    let client = match redis::Client::open(
        format!("redis://{}:{}/", args.redis_host, args.redis_port).as_str(),
    ) {
        Ok(c) => c,
        Err(e) => {
            eprintln!(
                "Error: cannot reach Redis at {}:{}",
                args.redis_host, args.redis_port
            );
            eprintln!("  ({})", e);
            std::process::exit(1);
        }
    };

    // Ping eagerly so a "Redis not running" error appears before the
    // (slow) model download starts.
    match client.get_connection().and_then(|mut c| redis::cmd("PING").query::<String>(&mut c)) {
        Ok(_) => {}
        Err(e) => {
            eprintln!(
                "Error: cannot reach Redis at {}:{}",
                args.redis_host, args.redis_port
            );
            eprintln!("  ({})", e);
            std::process::exit(1);
        }
    }

    let session = match AgentSession::new(
        &client,
        args.session_key_prefix.clone(),
        args.session_ttl_seconds,
        20,
    ) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Error creating session store: {}", e);
            std::process::exit(1);
        }
    };
    let memory = match LongTermMemory::new(
        &client,
        args.mem_index_name.clone(),
        args.mem_key_prefix.clone(),
        384,
        args.dedup_threshold,
        args.recall_threshold,
    ) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("Error creating memory store: {}", e);
            std::process::exit(1);
        }
    };
    if let Err(e) = memory.create_index() {
        eprintln!("Error creating index: {}", e);
        std::process::exit(1);
    }
    let events = match AgentEventLog::new(&client, args.event_key_prefix.clone(), 1000) {
        Ok(e) => e,
        Err(e) => {
            eprintln!("Error creating event log: {}", e);
            std::process::exit(1);
        }
    };

    println!(
        "Loading embedding model (first run downloads weights from the Hugging Face Hub)..."
    );
    let embedder = match LocalEmbedder::new(None) {
        Ok(e) => e,
        Err(e) => {
            eprintln!("Error loading embedder: {}", e);
            std::process::exit(1);
        }
    };

    let demo = Arc::new(AgentMemoryDemo::new(session, memory, events, embedder));

    if args.reset_on_start {
        println!(
            "Dropping any existing memories under '{}*' and re-seeding from the \
             sample memory list (pass --no-reset to keep).",
            args.mem_key_prefix
        );
        match demo.seed_all("default", "default") {
            Ok(n) => println!("Seeded {} memories.", n),
            Err(e) => {
                eprintln!("Error during initial seed: {}", e);
                std::process::exit(1);
            }
        }
    }

    // Load index.html once and substitute the template tokens so the
    // docs panel shows the actual values in use.
    let html_path = locate_index_html();
    let raw_html = match fs::read_to_string(&html_path) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Could not read index.html at {}: {}", html_path.display(), e);
            std::process::exit(1);
        }
    };
    let html_page = raw_html
        .replace("__SESSION_PREFIX__", &args.session_key_prefix)
        .replace("__MEM_PREFIX__", &args.mem_key_prefix)
        .replace("__MEM_INDEX__", &args.mem_index_name)
        .replace("__EVENT_PREFIX__", &args.event_key_prefix);
    let html_page = Arc::new(html_page);

    let addr = format!("{}:{}", args.host, args.port);
    let server = match Server::http(&addr) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to bind {}: {}", addr, e);
            std::process::exit(1);
        }
    };
    println!("Redis agent memory demo listening on http://{}", addr);
    println!(
        "Using Redis at {}:{} with memory index '{}'",
        args.redis_host, args.redis_port, args.mem_index_name
    );

    for request in server.incoming_requests() {
        let demo = Arc::clone(&demo);
        let html = Arc::clone(&html_page);
        std::thread::spawn(move || {
            if let Err(e) = handle_request(request, demo.as_ref(), html.as_str()) {
                eprintln!("[demo] handler error: {}", e);
            }
        });
    }
}

fn locate_index_html() -> PathBuf {
    // Look beside the binary first (when ``cargo run`` puts us in
    // target/{debug,release}/), then in the project root. The
    // project-root fallback is what makes ``cargo run`` work
    // straight from the example directory without copying files.
    let exe = env::current_exe().ok();
    if let Some(exe_path) = exe {
        if let Some(dir) = exe_path.parent() {
            let candidate = dir.join("index.html");
            if candidate.exists() {
                return candidate;
            }
        }
    }
    if let Ok(cwd) = env::current_dir() {
        let candidate = cwd.join("index.html");
        if candidate.exists() {
            return candidate;
        }
    }
    PathBuf::from("index.html")
}

// ---- Request dispatch -----------------------------------------------

fn handle_request(
    mut request: tiny_http::Request,
    demo: &AgentMemoryDemo,
    html_page: &str,
) -> std::io::Result<()> {
    let url = request.url().to_string();
    let method = request.method().clone();
    let (path, query) = split_path_query(&url);

    let response = match (&method, path.as_str()) {
        (Method::Get, "/") | (Method::Get, "/index.html") => {
            Response::from_string(html_page.to_string())
                .with_status_code(StatusCode(200))
                .with_header(html_header())
                .boxed()
        }
        (Method::Get, "/state") => {
            let qs = parse_form(&query);
            let user = qs.get("user").cloned().unwrap_or_else(|| "default".to_string());
            let namespace = qs.get("namespace").cloned().unwrap_or_else(|| "default".to_string());
            json_response(200, &demo.build_state(&user, &namespace))
        }
        (Method::Post, "/turn") => {
            let body = read_body(&mut request)?;
            let form = parse_form(&body);
            let text = form.get("text").cloned().unwrap_or_default();
            let text = text.trim();
            if text.is_empty() {
                json_response(400, &json!({ "error": "text is required" }))
            } else {
                let threshold = clamp_threshold(form.get("threshold"), demo.memory.recall_threshold);
                let payload = demo.handle_turn(
                    text,
                    form.get("user").map(String::as_str).unwrap_or("default"),
                    form.get("namespace").map(String::as_str).unwrap_or("default"),
                    form.get("kind").map(String::as_str).unwrap_or("episodic"),
                    form.get("role").map(String::as_str).unwrap_or("user"),
                    threshold,
                    form.get("action").map(String::as_str).unwrap_or("turn"),
                );
                match payload {
                    Ok(p) => json_response(200, &p),
                    Err(e) => json_response(500, &json!({ "error": e.to_string() })),
                }
            }
        }
        (Method::Post, "/new_thread") => {
            let body = read_body(&mut request)?;
            let form = parse_form(&body);
            let user = form.get("user").cloned().unwrap_or_else(|| "default".to_string());
            let namespace = form.get("namespace").cloned().unwrap_or_else(|| "default".to_string());
            match demo.new_thread(&user, &namespace) {
                Ok(tid) => json_response(200, &json!({ "thread_id": tid })),
                Err(e) => json_response(500, &json!({ "error": e })),
            }
        }
        (Method::Post, "/reset") => {
            let body = read_body(&mut request)?;
            let form = parse_form(&body);
            let user = form.get("user").cloned().unwrap_or_else(|| "default".to_string());
            let namespace = form.get("namespace").cloned().unwrap_or_else(|| "default".to_string());
            match demo.seed_all(&user, &namespace) {
                Ok(n) => json_response(200, &json!({ "seeded": n })),
                Err(e) => json_response(500, &json!({ "error": e })),
            }
        }
        (Method::Post, "/drop_memory") => {
            let body = read_body(&mut request)?;
            let form = parse_form(&body);
            let memory_id = form
                .get("memory_id")
                .cloned()
                .unwrap_or_default()
                .trim()
                .to_string();
            if memory_id.is_empty() {
                json_response(400, &json!({ "error": "memory_id is required" }))
            } else {
                match demo.memory.delete_memory(&memory_id) {
                    Ok(deleted) => json_response(200, &json!({
                        "deleted": deleted,
                        "memory_id": memory_id,
                    })),
                    Err(e) => json_response(500, &json!({ "error": e.to_string() })),
                }
            }
        }
        _ => json_response(404, &json!({ "error": "not found" })),
    };

    request.respond(response)
}

fn read_body(request: &mut tiny_http::Request) -> std::io::Result<String> {
    let mut buf = Vec::new();
    request.as_reader().take(MAX_BODY_BYTES as u64 + 1).read_to_end(&mut buf)?;
    if buf.len() > MAX_BODY_BYTES {
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("request body exceeds {} bytes", MAX_BODY_BYTES),
        ));
    }
    Ok(String::from_utf8_lossy(&buf).into_owned())
}

fn parse_form(s: &str) -> std::collections::HashMap<String, String> {
    form_urlencoded::parse(s.as_bytes())
        .into_owned()
        .collect()
}

fn split_path_query(url: &str) -> (String, String) {
    if let Some(idx) = url.find('?') {
        (url[..idx].to_string(), url[idx + 1..].to_string())
    } else {
        (url.to_string(), String::new())
    }
}

fn json_response<T: Serialize>(status: u16, value: &T) -> tiny_http::ResponseBox {
    let body = serde_json::to_string(value).unwrap_or_else(|_| "{}".to_string());
    Response::from_string(body)
        .with_status_code(StatusCode(status))
        .with_header(json_header())
        .boxed()
}

fn html_header() -> Header {
    Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap()
}

fn json_header() -> Header {
    Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap()
}

fn clamp_threshold(raw: Option<&String>, fallback: f64) -> f64 {
    let parsed = raw
        .and_then(|s| s.parse::<f64>().ok())
        .filter(|d| d.is_finite());
    let v = parsed.unwrap_or(fallback);
    v.clamp(0.0, 2.0)
}

// ---- Demo orchestrator ----------------------------------------------

/// Demo state: working memory, long-term memory, event log.
///
/// `current_thread_id` is wrapped in a `Mutex<String>`, but the lock
/// is released after each rotation or read — a turn racing with
/// `/new_thread` or `/reset` can therefore capture the old id and
/// apply to the previous thread. The demo is single-user in
/// practice, so the race never triggers; a multi-user agent would
/// carry the thread id on each request instead of holding it as
/// shared server state. See the walkthrough's "Concurrency caveats"
/// section.
pub struct AgentMemoryDemo {
    pub session: AgentSession,
    pub memory: LongTermMemory,
    pub events: AgentEventLog,
    pub embedder: LocalEmbedder,
    pub default_user: String,
    pub default_namespace: String,
    pub current_thread_id: Mutex<String>,
}

impl AgentMemoryDemo {
    pub fn new(
        session: AgentSession,
        memory: LongTermMemory,
        events: AgentEventLog,
        embedder: LocalEmbedder,
    ) -> Self {
        let tid = session.new_thread_id();
        Self {
            session,
            memory,
            events,
            embedder,
            default_user: "default".to_string(),
            default_namespace: "default".to_string(),
            current_thread_id: Mutex::new(tid),
        }
    }

    pub fn seed_all(&self, user: &str, namespace: &str) -> Result<usize, String> {
        self.memory.clear().map_err(|e| e.to_string())?;
        let tid = self.current_thread_id.lock().unwrap().clone();
        self.session.delete(&tid).map_err(|e| e.to_string())?;
        self.events.clear(&tid).map_err(|e| e.to_string())?;
        let written = seed_memories(&self.memory, &self.embedder, user, namespace, "seed")
            .map_err(|e| e.to_string())?;
        *self.current_thread_id.lock().unwrap() = self.session.new_thread_id();
        Ok(written)
    }

    pub fn new_thread(&self, user: &str, namespace: &str) -> Result<String, String> {
        let tid = self.current_thread_id.lock().unwrap().clone();
        self.events.clear(&tid).map_err(|e| e.to_string())?;
        let new_id = self.session.new_thread_id();
        self.session
            .start(&new_id, user, "demo-agent", "", None)
            .map_err(|e| e.to_string())?;
        self.events
            .record(
                &new_id,
                "thread_started",
                &format!("user={} namespace={}", user, namespace),
            )
            .map_err(|e| e.to_string())?;
        *self.current_thread_id.lock().unwrap() = new_id.clone();
        Ok(new_id)
    }

    /// One pass through the agent loop: append, recall, remember,
    /// log.
    ///
    /// The order matters. We embed once and reuse the vector for
    /// both the recall and (if asked) the remember step — no point
    /// encoding the same text twice. Recall runs *before* the
    /// remember write so the agent doesn't see its own just-written
    /// turn as a recalled memory.
    pub fn handle_turn(
        &self,
        text: &str,
        user: &str,
        namespace: &str,
        kind: &str,
        role: &str,
        threshold: f64,
        action: &str,
    ) -> Result<JsonValue, Box<dyn std::error::Error>> {
        let thread_id = self.current_thread_id.lock().unwrap().clone();

        let t0 = Instant::now();
        let vec = self.embedder.encode_one(text)?;
        let embed_ms = elapsed_ms(t0);

        // `set_goal` only touches the goal field so existing turns
        // aren't wiped; `append_turn` carries the request `user`
        // through to the auto-create path so a first turn for a new
        // thread doesn't land under the default user.
        let session_action = if action == "goal" {
            self.session
                .set_goal(&thread_id, text, Some(user), Some("demo-agent"), None)?;
            "goal_set".to_string()
        } else {
            self.session.append_turn(
                &thread_id,
                role,
                text,
                Some(user),
                Some("demo-agent"),
                None,
            )?;
            format!("turn_appended:{}", role)
        };

        let t1 = Instant::now();
        let recalled = self.memory.recall(
            &vec,
            user,
            Some(namespace),
            None,
            5,
            Some(threshold),
        )?;
        let recall_ms = elapsed_ms(t1);

        let write_skipped = kind == "skip" || action == "goal";
        let mut write_result: Option<WriteResult> = None;
        let mut write_ms = 0.0_f64;
        if !write_skipped {
            let t2 = Instant::now();
            write_result = Some(self.memory.remember(
                text,
                &vec,
                user,
                namespace,
                kind,
                &thread_id,
                None,
            )?);
            write_ms = elapsed_ms(t2);
        }

        let detail = match &write_result {
            Some(w) if w.deduped => format!("deduped onto {}", w.id),
            Some(w) => format!("wrote {} as {}", w.id, kind),
            None => String::new(),
        };
        self.events.record(&thread_id, &session_action, &detail)?;

        Ok(json!({
            "thread_id": thread_id,
            "write_skipped": write_skipped,
            "memory_id": write_result.as_ref().map(|w| w.id.clone()),
            "deduped": write_result.as_ref().map(|w| w.deduped).unwrap_or(false),
            "existing_distance": write_result.as_ref().and_then(|w| w.existing_distance),
            "kind": if write_skipped { JsonValue::Null } else { JsonValue::String(kind.to_string()) },
            "recalled": recalled,
            "embed_ms": embed_ms,
            "recall_ms": recall_ms,
            "write_ms": write_ms,
        }))
    }

    pub fn build_state(&self, user: &str, namespace: &str) -> JsonValue {
        let info = self.memory.index_info();
        let thread_id = self.current_thread_id.lock().unwrap().clone();
        let session: Option<SessionState> = self.session.load(&thread_id).ok().flatten();
        let memories: Vec<MemoryRecord> = self
            .memory
            .list_memories(Some(user), Some(namespace), None, 200)
            .unwrap_or_default();
        let events = self.events.recent(&thread_id, 20).unwrap_or_default();

        json!({
            "index": {
                "num_docs": info.num_docs,
                "indexing_failures": info.indexing_failures,
                "index_name": self.memory.index_name,
                "model": self.embedder.model_name,
                "session_ttl_seconds": self.session.default_ttl_seconds,
                "dedup_threshold": self.memory.dedup_threshold,
                "default_recall_threshold": self.memory.recall_threshold,
                "stack_label": STACK_LABEL,
            },
            "thread_id": thread_id,
            "session": session,
            "memories": memories,
            "events": events,
            // `recalled` is populated by /turn; on plain /state reads
            // the UI keeps showing the last turn's result.
            "recalled": [],
        })
    }
}

fn elapsed_ms(start: Instant) -> f64 {
    start.elapsed().as_secs_f64() * 1000.0
}

// ---- Arg parsing ----------------------------------------------------

#[derive(Debug, Clone)]
struct Args {
    host: String,
    port: u16,
    redis_host: String,
    redis_port: u16,
    mem_index_name: String,
    mem_key_prefix: String,
    session_key_prefix: String,
    event_key_prefix: String,
    session_ttl_seconds: i64,
    dedup_threshold: f64,
    recall_threshold: f64,
    reset_on_start: bool,
}

impl Args {
    fn parse(argv: Vec<String>) -> Result<Self, String> {
        let mut host = "127.0.0.1".to_string();
        let mut port: u16 = 8094;
        let mut redis_host = "localhost".to_string();
        let mut redis_port: u16 = 6379;
        let mut mem_index = "agentmem:idx".to_string();
        let mut mem_prefix = "agent:mem:".to_string();
        let mut session_prefix = "agent:session:".to_string();
        let mut event_prefix = "agent:events:".to_string();
        let mut session_ttl: i64 = 3600;
        let mut dedup: f64 = 0.20;
        let mut recall: f64 = 0.55;
        let mut reset = true;

        let mut iter = argv.into_iter().skip(1);
        while let Some(a) = iter.next() {
            match a.as_str() {
                "--host" => host = iter.next().ok_or("missing value for --host")?,
                "--port" => port = iter.next().ok_or("missing value for --port")?
                    .parse().map_err(|e: std::num::ParseIntError| e.to_string())?,
                "--redis-host" => redis_host = iter.next().ok_or("missing value for --redis-host")?,
                "--redis-port" => redis_port = iter.next().ok_or("missing value for --redis-port")?
                    .parse().map_err(|e: std::num::ParseIntError| e.to_string())?,
                "--mem-index-name" => mem_index = iter.next().ok_or("missing value for --mem-index-name")?,
                "--mem-key-prefix" => mem_prefix = iter.next().ok_or("missing value for --mem-key-prefix")?,
                "--session-key-prefix" => session_prefix = iter.next().ok_or("missing value for --session-key-prefix")?,
                "--event-key-prefix" => event_prefix = iter.next().ok_or("missing value for --event-key-prefix")?,
                "--session-ttl-seconds" => session_ttl = iter.next().ok_or("missing value for --session-ttl-seconds")?
                    .parse().map_err(|e: std::num::ParseIntError| e.to_string())?,
                "--dedup-threshold" => dedup = iter.next().ok_or("missing value for --dedup-threshold")?
                    .parse().map_err(|e: std::num::ParseFloatError| e.to_string())?,
                "--recall-threshold" => recall = iter.next().ok_or("missing value for --recall-threshold")?
                    .parse().map_err(|e: std::num::ParseFloatError| e.to_string())?,
                "--no-reset" => reset = false,
                "--help" | "-h" => return Err("help requested".to_string()),
                other => return Err(format!("unknown flag: {}", other)),
            }
        }

        Ok(Self {
            host,
            port,
            redis_host,
            redis_port,
            mem_index_name: mem_index,
            mem_key_prefix: mem_prefix,
            session_key_prefix: session_prefix,
            event_key_prefix: event_prefix,
            session_ttl_seconds: session_ttl,
            dedup_threshold: dedup,
            recall_threshold: recall,
            reset_on_start: reset,
        })
    }
}

fn print_help() {
    eprintln!(
        "Usage: agent-memory-demo [flags]\n\
         \n\
         --host <host>                  HTTP bind host (default 127.0.0.1)\n\
         --port <port>                  HTTP bind port (default 8094)\n\
         --redis-host <host>            Redis host (default localhost)\n\
         --redis-port <port>            Redis port (default 6379)\n\
         --mem-index-name <name>        Memory index name (default agentmem:idx)\n\
         --mem-key-prefix <prefix>      JSON memory key prefix (default agent:mem:)\n\
         --session-key-prefix <prefix>  Session hash key prefix (default agent:session:)\n\
         --event-key-prefix <prefix>    Event stream key prefix (default agent:events:)\n\
         --session-ttl-seconds <n>      Working memory TTL (default 3600)\n\
         --dedup-threshold <d>          Cosine distance for dedup (default 0.20)\n\
         --recall-threshold <d>         Cosine distance for recall (default 0.55)\n\
         --no-reset                     Skip clearing and re-seeding on startup"
    );
}
