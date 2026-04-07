//! Redis Session Store Demo Server
//!
//! Run this demo and visit http://localhost:8080 to create, inspect, and
//! destroy Redis-backed sessions in a local browser session.

mod session_store;

use axum::{
    extract::State,
    http::{
        header::{self, CONTENT_TYPE, SET_COOKIE},
        HeaderMap, HeaderValue, StatusCode,
    },
    response::{Html, IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use redis::{aio::Connection, Client};
use serde::Serialize;
use session_store::RedisSessionStore;
use std::{collections::HashMap, env, sync::Arc};
use tokio::sync::Mutex;

#[derive(Clone)]
struct AppState {
    redis_connection: Arc<Mutex<Connection>>,
    store: RedisSessionStore,
}

#[derive(Serialize)]
struct SessionPayload {
    authenticated: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    session_id: Option<String>,
    session: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    configured_ttl: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    ttl: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    page_views: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let port = parse_arg(&args, "--port").unwrap_or_else(|| "8080".to_string());
    let redis_url =
        env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379/".to_string());

    let client = Client::open(redis_url.as_str()).unwrap_or_else(|e| {
        eprintln!("Failed to create Redis client: {}", e);
        std::process::exit(1);
    });

    let connection = client.get_async_connection().await.unwrap_or_else(|e| {
        eprintln!("Failed to connect to Redis at {}: {}", redis_url, e);
        std::process::exit(1);
    });

    let store = RedisSessionStore::new("session:", 1800).unwrap_or_else(|e| {
        eprintln!("Failed to initialize session store: {}", e);
        std::process::exit(1);
    });

    let state = AppState {
        redis_connection: Arc::new(Mutex::new(connection)),
        store,
    };

    let app = Router::new()
        .route("/", get(handle_home))
        .route("/session", get(handle_session))
        .route("/login", post(handle_login))
        .route("/increment", post(handle_increment))
        .route("/ttl", post(handle_ttl))
        .route("/logout", post(handle_logout))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| {
            eprintln!("Failed to bind to {}: {}", addr, e);
            std::process::exit(1);
        });

    println!("Session store demo listening on http://localhost:{}", port);
    axum::serve(listener, app).await.unwrap_or_else(|e| {
        eprintln!("Server error: {}", e);
        std::process::exit(1);
    });
}

async fn handle_home(State(state): State<AppState>, headers: HeaderMap) -> Html<String> {
    let session_id = session_id_from_headers(&headers);
    let session = match session_id.as_deref() {
        Some(session_id) => load_session(&state, session_id).await.unwrap_or(None),
        None => None,
    };

    Html(html_page(session_id.as_deref(), session.as_ref()))
}

async fn handle_session(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let session_id = session_id_from_headers(&headers);
    let Some(session_id) = session_id else {
        return json_response(
            StatusCode::OK,
            SessionPayload {
                authenticated: false,
                session_id: None,
                session: None,
                configured_ttl: None,
                ttl: None,
                page_views: None,
                error: None,
            },
            None,
        );
    };

    match load_session(&state, &session_id).await {
        Ok(Some(session)) => {
            let mut con = state.redis_connection.lock().await;
            let configured_ttl = state
                .store
                .get_configured_ttl_async(&mut *con, &session_id)
                .await
                .unwrap_or(None);
            let ttl = state.store.get_ttl_async(&mut *con, &session_id).await.unwrap_or(-1);
            json_response(
                StatusCode::OK,
                SessionPayload {
                    authenticated: true,
                    session_id: Some(session_id),
                    session: Some(session),
                    configured_ttl,
                    ttl: Some(ttl),
                    page_views: None,
                    error: None,
                },
                None,
            )
        }
        Ok(None) => json_response(
            StatusCode::OK,
            SessionPayload {
                authenticated: false,
                session_id: None,
                session: None,
                configured_ttl: None,
                ttl: None,
                page_views: None,
                error: None,
            },
            Some(clear_cookie_value()),
        ),
        Err(error) => error_response(error.to_string(), None),
    }
}

async fn handle_login(State(state): State<AppState>, body: String) -> Response {
    let params = parse_form_data(&body);
    let username = params
        .get("username")
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .unwrap_or("Guest")
        .to_string();
    let Some(ttl) = parse_ttl_value(params.get("ttl").map(String::as_str).unwrap_or("60")) else {
        return bad_request("TTL must be a whole number greater than 0.");
    };

    let session_id = {
        let mut con = state.redis_connection.lock().await;
        let data = HashMap::from([
            ("username".to_string(), username),
            ("page_views".to_string(), "1".to_string()),
        ]);
        match state
            .store
            .create_session_async(&mut *con, &data, Some(ttl))
            .await
        {
            Ok(session_id) => session_id,
            Err(error) => return error_response(error.to_string(), None),
        }
    };

    match load_session(&state, &session_id).await {
        Ok(Some(session)) => {
            let mut con = state.redis_connection.lock().await;
            let configured_ttl = state
                .store
                .get_configured_ttl_async(&mut *con, &session_id)
                .await
                .unwrap_or(None);
            let ttl = state.store.get_ttl_async(&mut *con, &session_id).await.unwrap_or(-1);
            json_response(
                StatusCode::OK,
                SessionPayload {
                    authenticated: true,
                    session_id: Some(session_id.clone()),
                    session: Some(session),
                    configured_ttl,
                    ttl: Some(ttl),
                    page_views: None,
                    error: None,
                },
                Some(cookie_value(&session_id)),
            )
        }
        Ok(None) => error_response("Session expired".to_string(), Some(clear_cookie_value())),
        Err(error) => error_response(error.to_string(), Some(clear_cookie_value())),
    }
}

async fn handle_increment(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Some(session_id) = session_id_from_headers(&headers) else {
        return unauthorized("No active session", None);
    };

    let page_views = {
        let mut con = state.redis_connection.lock().await;
        match state
            .store
            .increment_field_async(&mut *con, &session_id, "page_views", 1)
            .await
        {
            Ok(Some(page_views)) => page_views,
            Ok(None) => return unauthorized("Session expired", Some(clear_cookie_value())),
            Err(error) => return error_response(error.to_string(), None),
        }
    };

    match load_session(&state, &session_id).await {
        Ok(Some(session)) => {
            let mut con = state.redis_connection.lock().await;
            let configured_ttl = state
                .store
                .get_configured_ttl_async(&mut *con, &session_id)
                .await
                .unwrap_or(None);
            let ttl = state.store.get_ttl_async(&mut *con, &session_id).await.unwrap_or(-1);
            json_response(
                StatusCode::OK,
                SessionPayload {
                    authenticated: true,
                    session_id: Some(session_id),
                    session: Some(session),
                    configured_ttl,
                    ttl: Some(ttl),
                    page_views: Some(page_views),
                    error: None,
                },
                None,
            )
        }
        Ok(None) => unauthorized("Session expired", Some(clear_cookie_value())),
        Err(error) => error_response(error.to_string(), None),
    }
}

async fn handle_ttl(State(state): State<AppState>, headers: HeaderMap, body: String) -> Response {
    let Some(session_id) = session_id_from_headers(&headers) else {
        return unauthorized("No active session", None);
    };

    let params = parse_form_data(&body);
    let Some(ttl) = parse_ttl_value(params.get("ttl").map(String::as_str).unwrap_or("")) else {
        return bad_request("TTL must be a whole number greater than 0.");
    };

    {
        let mut con = state.redis_connection.lock().await;
        match state
            .store
            .set_session_ttl_async(&mut *con, &session_id, ttl)
            .await
        {
            Ok(true) => {}
            Ok(false) => return unauthorized("Session expired", Some(clear_cookie_value())),
            Err(error) => return error_response(error.to_string(), None),
        }
    }

    match load_session(&state, &session_id).await {
        Ok(Some(session)) => {
            let mut con = state.redis_connection.lock().await;
            let configured_ttl = state
                .store
                .get_configured_ttl_async(&mut *con, &session_id)
                .await
                .unwrap_or(None);
            let ttl = state.store.get_ttl_async(&mut *con, &session_id).await.unwrap_or(-1);
            json_response(
                StatusCode::OK,
                SessionPayload {
                    authenticated: true,
                    session_id: Some(session_id),
                    session: Some(session),
                    configured_ttl,
                    ttl: Some(ttl),
                    page_views: None,
                    error: None,
                },
                None,
            )
        }
        Ok(None) => unauthorized("Session expired", Some(clear_cookie_value())),
        Err(error) => error_response(error.to_string(), None),
    }
}

async fn handle_logout(State(state): State<AppState>, headers: HeaderMap) -> Response {
    if let Some(session_id) = session_id_from_headers(&headers) {
        let mut con = state.redis_connection.lock().await;
        let _ = state.store.delete_session_async(&mut *con, &session_id).await;
    }

    json_response(
        StatusCode::OK,
        SessionPayload {
            authenticated: false,
            session_id: None,
            session: None,
            configured_ttl: None,
            ttl: None,
            page_views: None,
            error: None,
        },
        Some(clear_cookie_value()),
    )
}

async fn load_session(
    state: &AppState,
    session_id: &str,
) -> redis::RedisResult<Option<HashMap<String, String>>> {
    let mut con = state.redis_connection.lock().await;
    let session = state.store.get_session_async(&mut *con, session_id, true).await?;
    let Some(mut session) = session else {
        return Ok(None);
    };

    let ttl = state.store.get_ttl_async(&mut *con, session_id).await?;
    session.insert("ttl".to_string(), ttl.to_string());

    if let Some(configured_ttl) = state
        .store
        .get_configured_ttl_async(&mut *con, session_id)
        .await?
    {
        session.insert("session_ttl".to_string(), configured_ttl.to_string());
    }

    Ok(Some(session))
}

fn parse_arg(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|arg| arg == flag)
        .and_then(|position| args.get(position + 1))
        .cloned()
}

fn parse_form_data(body: &str) -> HashMap<String, String> {
    body.split('&')
        .filter(|pair| !pair.is_empty())
        .filter_map(|pair| {
            let mut parts = pair.splitn(2, '=');
            let key = parts.next()?;
            let value = parts.next().unwrap_or_default();
            Some((url_decode(key), url_decode(value)))
        })
        .collect()
}

fn url_decode(value: &str) -> String {
    let replaced = value.replace('+', " ");
    let bytes = replaced.as_bytes();
    let mut output = Vec::with_capacity(bytes.len());
    let mut index = 0;

    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            if let Ok(hex) = std::str::from_utf8(&bytes[index + 1..index + 3]) {
                if let Ok(byte) = u8::from_str_radix(hex, 16) {
                    output.push(byte);
                    index += 3;
                    continue;
                }
            }
        }

        output.push(bytes[index]);
        index += 1;
    }

    String::from_utf8_lossy(&output).into_owned()
}

fn session_id_from_headers(headers: &HeaderMap) -> Option<String> {
    let cookie = headers.get(header::COOKIE)?.to_str().ok()?;
    cookie
        .split(';')
        .map(str::trim)
        .find_map(|part| part.strip_prefix("sid=").map(str::to_string))
}

fn parse_ttl_value(raw: &str) -> Option<usize> {
    raw.parse::<usize>().ok().filter(|ttl| *ttl >= 1)
}

fn cookie_value(session_id: &str) -> HeaderValue {
    HeaderValue::from_str(&format!("sid={}; Path=/; HttpOnly; SameSite=Lax", session_id))
        .expect("valid cookie header")
}

fn clear_cookie_value() -> HeaderValue {
    HeaderValue::from_static("sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT")
}

fn json_response(
    status: StatusCode,
    payload: SessionPayload,
    cookie: Option<HeaderValue>,
) -> Response {
    let mut response = (status, Json(payload)).into_response();
    if let Some(cookie) = cookie {
        response.headers_mut().insert(SET_COOKIE, cookie);
    }
    response
}

fn bad_request(message: &str) -> Response {
    json_response(
        StatusCode::BAD_REQUEST,
        SessionPayload {
            authenticated: false,
            session_id: None,
            session: None,
            configured_ttl: None,
            ttl: None,
            page_views: None,
            error: Some(message.to_string()),
        },
        None,
    )
}

fn unauthorized(message: &str, cookie: Option<HeaderValue>) -> Response {
    json_response(
        StatusCode::UNAUTHORIZED,
        SessionPayload {
            authenticated: false,
            session_id: None,
            session: None,
            configured_ttl: None,
            ttl: None,
            page_views: None,
            error: Some(message.to_string()),
        },
        cookie,
    )
}

fn error_response(message: String, cookie: Option<HeaderValue>) -> Response {
    json_response(
        StatusCode::INTERNAL_SERVER_ERROR,
        SessionPayload {
            authenticated: false,
            session_id: None,
            session: None,
            configured_ttl: None,
            ttl: None,
            page_views: None,
            error: Some(message),
        },
        cookie,
    )
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn session_view(session_id: Option<&str>, session: Option<&HashMap<String, String>>) -> String {
    let (Some(session_id), Some(session)) = (session_id, session) else {
        return "<p>No active session.</p><p>Create one to store state in Redis and receive a cookie-backed session ID.</p>".to_string();
    };

    [
        "<dl>".to_string(),
        format!(
            "<dt>Session ID</dt><dd>{}</dd>",
            escape_html(session_id)
        ),
        format!(
            "<dt>Username</dt><dd>{}</dd>",
            escape_html(session.get("username").map(String::as_str).unwrap_or(""))
        ),
        format!(
            "<dt>Page views</dt><dd>{}</dd>",
            escape_html(session.get("page_views").map(String::as_str).unwrap_or("0"))
        ),
        format!(
            "<dt>Configured TTL</dt><dd>{} seconds</dd>",
            escape_html(session.get("session_ttl").map(String::as_str).unwrap_or(""))
        ),
        format!(
            "<dt>Created</dt><dd>{}</dd>",
            escape_html(session.get("created_at").map(String::as_str).unwrap_or(""))
        ),
        format!(
            "<dt>Last accessed</dt><dd>{}</dd>",
            escape_html(
                session
                    .get("last_accessed_at")
                    .map(String::as_str)
                    .unwrap_or("")
            )
        ),
        format!(
            "<dt>TTL</dt><dd>{} seconds</dd>",
            escape_html(session.get("ttl").map(String::as_str).unwrap_or(""))
        ),
        "</dl>".to_string(),
        "<form id=\"ttl-form\">".to_string(),
        "<label for=\"active-ttl\">Update session TTL (seconds)</label>".to_string(),
        format!(
            "<input id=\"active-ttl\" name=\"ttl\" type=\"number\" value=\"{}\" min=\"1\" step=\"1\">",
            escape_html(session.get("session_ttl").map(String::as_str).unwrap_or("15"))
        ),
        "<button type=\"submit\">Apply TTL</button>".to_string(),
        "</form>".to_string(),
        "<button id=\"increment-button\">Increment page views</button>".to_string(),
        "<button id=\"logout-button\" class=\"secondary\">Log out</button>".to_string(),
    ]
    .join("")
}

fn html_page(session_id: Option<&str>, session: Option<&HashMap<String, String>>) -> String {
    let initial_session_view = session_view(session_id, session);
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Session Store Demo</title>
  <style>
    :root {{
      --bg: #f6f1e8;
      --panel: #fffaf2;
      --ink: #1f2933;
      --accent: #b8572f;
      --accent-dark: #8f421f;
      --muted: #5d6b75;
      --line: #e7d9c6;
      --ok: #d7f0de;
      --warn: #f7dfd7;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);
      min-height: 100vh;
    }}
    main {{
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }}
    h1 {{
      font-size: clamp(2.2rem, 5vw, 4rem);
      line-height: 1;
      margin-bottom: 12px;
    }}
    p.lede {{
      max-width: 48rem;
      font-size: 1.1rem;
      color: var(--muted);
    }}
    .grid {{
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      margin-top: 28px;
    }}
    .panel {{
      background: rgba(255, 250, 242, 0.92);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);
    }}
    .panel h2 {{ margin-top: 0; margin-bottom: 10px; }}
    .pill {{
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }}
    label {{ display: block; font-weight: bold; margin-bottom: 8px; }}
    input {{
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #cfbca6;
      font: inherit;
      background: white;
    }}
    button {{
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
    }}
    button.secondary {{ background: #38424a; }}
    button:hover {{ background: var(--accent-dark); }}
    button.secondary:hover {{ background: #20282e; }}
    dl {{
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 14px;
      margin: 0;
    }}
    dt {{ font-weight: bold; }}
    dd {{ margin: 0; word-break: break-word; }}
    #status {{
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }}
    #status.ok {{ display: block; background: var(--ok); }}
    #status.error {{ display: block; background: var(--warn); }}
    @media (max-width: 600px) {{
      main {{ padding-top: 28px; }}
      button {{ width: 100%; }}
    }}
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-rs async demo with axum</div>
    <h1>Redis Session Store Demo</h1>
    <p class="lede">
      Start a session, refresh it by interacting with the page, and watch Redis
      hold the server-side session data while the browser keeps only an opaque cookie.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Start a session</h2>
        <form id="login-form">
          <label for="username">Username</label>
          <input id="username" name="username" value="Andrew" maxlength="40">
          <label for="ttl">Session TTL (seconds)</label>
          <input id="ttl" name="ttl" type="number" value="15" min="1" step="1">
          <button type="submit">Create session</button>
        </form>
        <p>Try a short TTL like 10 or 15 seconds to watch the session expire, then interact with the page to see the expiration refresh.</p>
      </section>

      <section class="panel">
        <h2>Current session</h2>
        <div id="session-view">{}</div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const sessionView = document.getElementById("session-view");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {{
      statusBox.textContent = message;
      statusBox.className = kind;
    }}

    function renderLoggedOut() {{
      sessionView.innerHTML =
        "<p>No active session.</p>" +
        "<p>Create one to store state in Redis and receive a cookie-backed session ID.</p>";
    }}

    function escapeHtml(value) {{
      return String(value).replace(/[&<>\"']/g, (char) => ({{
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }})[char]);
    }}

    function renderSession(data) {{
      if (!data || !data.authenticated) {{
        renderLoggedOut();
        return;
      }}

      const session = data.session || {{}};
      const sessionId = escapeHtml(data.session_id || "");
      const username = escapeHtml(session.username || "");
      const pageViews = escapeHtml(session.page_views || "0");
      const configuredTtl = escapeHtml(String(data.configured_ttl || session.session_ttl || ""));
      const createdAt = escapeHtml(session.created_at || "");
      const lastAccessed = escapeHtml(session.last_accessed_at || "");
      const ttl = escapeHtml(String(data.ttl || session.ttl || ""));

      sessionView.innerHTML =
        "<dl>" +
        "<dt>Session ID</dt><dd>" + sessionId + "</dd>" +
        "<dt>Username</dt><dd>" + username + "</dd>" +
        "<dt>Page views</dt><dd>" + pageViews + "</dd>" +
        "<dt>Configured TTL</dt><dd>" + configuredTtl + " seconds</dd>" +
        "<dt>Created</dt><dd>" + createdAt + "</dd>" +
        "<dt>Last accessed</dt><dd>" + lastAccessed + "</dd>" +
        "<dt>TTL</dt><dd>" + ttl + " seconds</dd>" +
        "</dl>" +
        '<form id="ttl-form">' +
        '<label for="active-ttl">Update session TTL (seconds)</label>' +
        '<input id="active-ttl" name="ttl" type="number" value="' + configuredTtl + '" min="1" step="1">' +
        '<button type="submit">Apply TTL</button>' +
        "</form>" +
        '<button id="increment-button">Increment page views</button>' +
        '<button id="logout-button" class="secondary">Log out</button>';

      document.getElementById("ttl-form").addEventListener("submit", updateTtl);
      document.getElementById("increment-button").addEventListener("click", incrementSession);
      document.getElementById("logout-button").addEventListener("click", logoutSession);
    }}

    async function fetchSession() {{
      const response = await fetch("/session");
      const data = await response.json();
      renderSession(data);
    }}

    async function incrementSession() {{
      const response = await fetch("/increment", {{ method: "POST" }});
      const data = await response.json();

      if (!response.ok) {{
        renderLoggedOut();
        setStatus(data.error || "Unable to update the session.", "error");
        return;
      }}

      renderSession(data);
      setStatus("Session updated in Redis and TTL refreshed.", "ok");
    }}

    async function updateTtl(event) {{
      event.preventDefault();
      const formData = new FormData(event.target);
      const response = await fetch("/ttl", {{
        method: "POST",
        body: new URLSearchParams(formData),
      }});
      const data = await response.json();

      if (!response.ok) {{
        if (response.status === 401) {{
          renderLoggedOut();
        }}
        setStatus(data.error || "Unable to update the TTL.", "error");
        return;
      }}

      renderSession(data);
      setStatus("Session TTL updated in Redis.", "ok");
    }}

    async function logoutSession() {{
      await fetch("/logout", {{ method: "POST" }});
      renderLoggedOut();
      setStatus("Session deleted from Redis and cookie cleared.", "ok");
    }}

    document.getElementById("login-form").addEventListener("submit", async (event) => {{
      event.preventDefault();
      const formData = new FormData(event.target);
      const response = await fetch("/login", {{
        method: "POST",
        body: new URLSearchParams(formData),
      }});
      const data = await response.json();

      if (!response.ok) {{
        setStatus(data.error || "Unable to create the session.", "error");
        return;
      }}

      renderSession(data);
      setStatus("Session created in Redis and cookie issued.", "ok");
    }});

    fetchSession();
  </script>
</body>
</html>"#,
        initial_session_view
    )
}
