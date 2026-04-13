#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "redis"
require "uri"
require "webrick"
require_relative "session_store"

port = Integer(ENV["PORT"] || 8080)
redis_host = ENV["REDIS_HOST"] || "localhost"
redis_port = Integer(ENV["REDIS_PORT"] || 6379)

ARGV.each_with_index do |arg, i|
  case arg
  when "--port"
    port = Integer(ARGV[i + 1])
  when "--redis-host"
    redis_host = ARGV[i + 1]
  when "--redis-port"
    redis_port = Integer(ARGV[i + 1])
  end
end

begin
  redis_client = Redis.new(host: redis_host, port: redis_port)
  redis_client.ping
  puts "✓ Connected to Redis at #{redis_host}:#{redis_port}"
rescue Redis::CannotConnectError => e
  warn "✗ Failed to connect to Redis: #{e.message}"
  warn "  Make sure Redis is running at #{redis_host}:#{redis_port}"
  exit 1
end

$session_store = RedisSessionStore.new(redis: redis_client)

def html_page(session_id, session)
  initial_session_view = session_view(session_id, session)

  <<~HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Redis Session Store Demo</title>
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
          max-width: 960px;
          margin: 0 auto;
          padding: 48px 20px 72px;
        }
        h1 {
          font-size: clamp(2.2rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 12px;
        }
        p.lede {
          max-width: 48rem;
          font-size: 1.1rem;
          color: var(--muted);
        }
        .grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
        label { display: block; font-weight: bold; margin-bottom: 8px; }
        input {
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
        button:hover { background: var(--accent-dark); }
        button.secondary:hover { background: #20282e; }
        dl {
          display: grid;
          grid-template-columns: max-content 1fr;
          gap: 8px 14px;
          margin: 0;
        }
        dt { font-weight: bold; }
        dd { margin: 0; word-break: break-word; }
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
        <div class="pill">redis-rb + WEBrick demo</div>
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
            <div id="session-view">#{initial_session_view}</div>
          </section>
        </div>

        <div id="status"></div>
      </main>

      <script>
        const sessionView = document.getElementById("session-view");
        const statusBox = document.getElementById("status");

        function setStatus(message, kind) {
          statusBox.textContent = message;
          statusBox.className = kind;
        }

        function renderLoggedOut() {
          sessionView.innerHTML =
            "<p>No active session.</p>" +
            "<p>Create one to store state in Redis and receive a cookie-backed session ID.</p>";
        }

        function escapeHtml(value) {
          return String(value).replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[char]);
        }

        function renderSession(data) {
          if (!data || !data.authenticated) {
            renderLoggedOut();
            return;
          }

          const session = data.session || {};
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
        }

        async function fetchSession() {
          const response = await fetch("/session");
          const data = await response.json();
          renderSession(data);
        }

        async function incrementSession() {
          const response = await fetch("/increment", { method: "POST" });
          const data = await response.json();

          if (!response.ok) {
            renderLoggedOut();
            setStatus(data.error || "Unable to update the session.", "error");
            return;
          }

          renderSession(data);
          setStatus("Session updated in Redis and TTL refreshed.", "ok");
        }

        async function updateTtl(event) {
          event.preventDefault();
          const formData = new FormData(event.target);
          const response = await fetch("/ttl", {
            method: "POST",
            body: new URLSearchParams(formData),
          });
          const data = await response.json();

          if (!response.ok) {
            if (response.status === 401) {
              renderLoggedOut();
            }
            setStatus(data.error || "Unable to update the TTL.", "error");
            return;
          }

          renderSession(data);
          setStatus("Session TTL updated in Redis.", "ok");
        }

        async function logoutSession() {
          await fetch("/logout", { method: "POST" });
          renderLoggedOut();
          setStatus("Session deleted from Redis and cookie cleared.", "ok");
        }

        document.getElementById("login-form").addEventListener("submit", async (event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const response = await fetch("/login", {
            method: "POST",
            body: new URLSearchParams(formData),
          });
          const data = await response.json();

          if (!response.ok) {
            setStatus(data.error || "Unable to create the session.", "error");
            return;
          }

          renderSession(data);
          setStatus("Session created in Redis and cookie issued.", "ok");
        });

        fetchSession();
      </script>
    </body>
    </html>
  HTML
end

def escape_html(value)
  WEBrick::HTMLUtils.escape((value || "").to_s)
end

def session_view(session_id, session)
  return "<p>No active session.</p><p>Create one to store state in Redis and receive a cookie-backed session ID.</p>" if session_id.nil? || session.nil?

  <<~HTML
    <dl>
      <dt>Session ID</dt><dd>#{escape_html(session_id)}</dd>
      <dt>Username</dt><dd>#{escape_html(session["username"])}</dd>
      <dt>Page views</dt><dd>#{escape_html(session["page_views"])}</dd>
      <dt>Configured TTL</dt><dd>#{escape_html(session["session_ttl"])} seconds</dd>
      <dt>Created</dt><dd>#{escape_html(session["created_at"])}</dd>
      <dt>Last accessed</dt><dd>#{escape_html(session["last_accessed_at"])}</dd>
      <dt>TTL</dt><dd>#{escape_html(session["ttl"])} seconds</dd>
    </dl>
    <form id="ttl-form">
      <label for="active-ttl">Update session TTL (seconds)</label>
      <input id="active-ttl" name="ttl" type="number" value="#{escape_html(session["session_ttl"])}" min="1" step="1">
      <button type="submit">Apply TTL</button>
    </form>
    <button id="increment-button">Increment page views</button>
    <button id="logout-button" class="secondary">Log out</button>
  HTML
end

def json_response(res, payload, status: 200, clear_session: false)
  res.status = status
  res["Content-Type"] = "application/json"
  clear_session_cookie(res) if clear_session
  res.body = JSON.generate(payload)
end

def set_session_cookie(res, session_id)
  cookie = WEBrick::Cookie.new("sid", session_id)
  cookie.path = "/"
  cookie.instance_variable_set(:@httponly, true)
  res.cookies << cookie
end

def clear_session_cookie(res)
  cookie = WEBrick::Cookie.new("sid", "")
  cookie.path = "/"
  cookie.expires = Time.at(0)
  cookie.max_age = 0
  res.cookies << cookie
end

def parse_form_data(body)
  URI.decode_www_form(body || "").to_h
end

def session_id_from_request(req)
  cookie = req.cookies.find { |entry| entry.name == "sid" }
  cookie&.value
end

def parse_ttl(raw_ttl)
  value = Integer(raw_ttl)
  value >= 1 ? value : nil
rescue ArgumentError, TypeError
  nil
end

def load_session(session_id)
  return nil if session_id.nil?

  session = $session_store.get_session(session_id)
  return nil if session.nil?

  session["ttl"] = $session_store.get_ttl(session_id).to_s
  configured_ttl = $session_store.get_configured_ttl(session_id)
  session["session_ttl"] = configured_ttl.to_s unless configured_ttl.nil?
  session
end

server = WEBrick::HTTPServer.new(
  Port: port,
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
  AccessLog: [[File.open(File::NULL, "w"), WEBrick::AccessLog::COMMON_LOG_FORMAT]]
)

server.mount_proc "/" do |req, res|
  unless req.request_method == "GET"
    res.status = 405
    res.body = "Method Not Allowed"
    next
  end

  session_id = session_id_from_request(req)
  session = load_session(session_id)
  res["Content-Type"] = "text/html; charset=utf-8"
  res.body = html_page(session_id, session)
end

server.mount_proc "/session" do |req, res|
  unless req.request_method == "GET"
    json_response(res, { error: "Method Not Allowed" }, status: 405)
    next
  end

  session_id = session_id_from_request(req)
  if session_id.nil?
    json_response(res, { authenticated: false, session: nil })
    next
  end

  session = load_session(session_id)
  if session.nil?
    json_response(res, { authenticated: false, session: nil }, clear_session: true)
    next
  end

  json_response(res, {
    authenticated: true,
    session_id: session_id,
    session: session,
    configured_ttl: $session_store.get_configured_ttl(session_id),
    ttl: $session_store.get_ttl(session_id)
  })
end

server.mount_proc "/login" do |req, res|
  unless req.request_method == "POST"
    json_response(res, { error: "Method Not Allowed" }, status: 405)
    next
  end

  params = parse_form_data(req.body)
  username = params.fetch("username", "Guest").strip
  username = "Guest" if username.empty?

  ttl = parse_ttl(params.fetch("ttl", "60"))
  if ttl.nil?
    json_response(res, { error: "TTL must be a whole number greater than 0." }, status: 400)
    next
  end

  session_id = $session_store.create_session(
    {
      username: username,
      page_views: "1"
    },
    ttl: ttl
  )
  set_session_cookie(res, session_id)
  session = load_session(session_id)

  json_response(res, {
    authenticated: true,
    session_id: session_id,
    session: session,
    configured_ttl: $session_store.get_configured_ttl(session_id),
    ttl: $session_store.get_ttl(session_id)
  })
end

server.mount_proc "/increment" do |req, res|
  unless req.request_method == "POST"
    json_response(res, { error: "Method Not Allowed" }, status: 405)
    next
  end

  session_id = session_id_from_request(req)
  if session_id.nil?
    json_response(res, { error: "No active session" }, status: 401)
    next
  end

  page_views = $session_store.increment_field(session_id, "page_views")
  if page_views.nil?
    json_response(res, { error: "Session expired" }, status: 401, clear_session: true)
    next
  end

  session = load_session(session_id)
  if session.nil?
    json_response(res, { error: "Session expired" }, status: 401, clear_session: true)
    next
  end

  json_response(res, {
    authenticated: true,
    session_id: session_id,
    session: session,
    configured_ttl: $session_store.get_configured_ttl(session_id),
    ttl: $session_store.get_ttl(session_id),
    page_views: page_views
  })
end

server.mount_proc "/ttl" do |req, res|
  unless req.request_method == "POST"
    json_response(res, { error: "Method Not Allowed" }, status: 405)
    next
  end

  session_id = session_id_from_request(req)
  if session_id.nil?
    json_response(res, { error: "No active session" }, status: 401)
    next
  end

  params = parse_form_data(req.body)
  ttl = parse_ttl(params.fetch("ttl", ""))
  if ttl.nil?
    json_response(res, { error: "TTL must be a whole number greater than 0." }, status: 400)
    next
  end

  unless $session_store.set_session_ttl(session_id, ttl)
    json_response(res, { error: "Session expired" }, status: 401, clear_session: true)
    next
  end

  session = load_session(session_id)
  if session.nil?
    json_response(res, { error: "Session expired" }, status: 401, clear_session: true)
    next
  end

  json_response(res, {
    authenticated: true,
    session_id: session_id,
    session: session,
    configured_ttl: $session_store.get_configured_ttl(session_id),
    ttl: $session_store.get_ttl(session_id)
  })
end

server.mount_proc "/logout" do |req, res|
  unless req.request_method == "POST"
    json_response(res, { error: "Method Not Allowed" }, status: 405)
    next
  end

  session_id = session_id_from_request(req)
  $session_store.delete_session(session_id) unless session_id.nil?

  json_response(res, { authenticated: false }, clear_session: true)
end

trap("INT") { server.shutdown }
trap("TERM") { server.shutdown }

puts "✓ Server started at http://localhost:#{port}"
puts "  Open your browser and visit http://localhost:#{port}"
puts "  Press Ctrl+C to stop the server"

server.start
