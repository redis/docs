#!/usr/bin/env python3
"""
Redis session store demo server.

Run this file and visit http://localhost:8080 to create, inspect, and
destroy Redis-backed sessions in a local browser session.
"""

from __future__ import annotations

import argparse
from html import escape
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from session_store import RedisSessionStore
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


class SessionDemoHandler(BaseHTTPRequestHandler):
    """Serve a small interactive page that uses Redis for session storage."""

    session_store: RedisSessionStore | None = None
    session_cookie_name = "sid"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/index.html"}:
            self._render_index()
            return

        if parsed.path == "/session":
            self._handle_session_fetch()
            return

        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/login":
            self._handle_login()
            return

        if parsed.path == "/increment":
            self._handle_increment()
            return

        if parsed.path == "/ttl":
            self._handle_ttl_update()
            return

        if parsed.path == "/logout":
            self._handle_logout()
            return

        self.send_error(404)

    def _render_index(self) -> None:
        session_id = self._get_session_id_from_cookie()
        session = self._load_session(session_id) if session_id else None

        self._send_html(self._html_page(session_id, session))

    def _handle_session_fetch(self) -> None:
        session_id = self._get_session_id_from_cookie()

        if not session_id:
            self._send_json({"authenticated": False, "session": None}, 200)
            return

        session = self._load_session(session_id)
        if session is None:
            self._send_json(
                {"authenticated": False, "session": None},
                200,
                clear_session_cookie=True,
            )
            return

        self._send_json(
            {
                "authenticated": True,
                "session_id": session_id,
                "session": session,
                "configured_ttl": self.session_store.get_configured_ttl(session_id),
                "ttl": self.session_store.get_ttl(session_id),
            },
            200,
        )

    def _handle_login(self) -> None:
        params = self._read_form_data()
        username = params.get("username", ["Guest"])[0].strip() or "Guest"
        ttl = self._parse_ttl_value(params.get("ttl", ["60"])[0])
        if ttl is None:
            self._send_json({"error": "TTL must be a whole number greater than 0."}, 400)
            return

        session_id = self.session_store.create_session(
            {
                "username": username,
                "page_views": "1",
            },
            ttl=ttl,
        )
        session = self.session_store.get_session(session_id)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._set_session_cookie(session_id)
        self.end_headers()
        self.wfile.write(
            json.dumps(
                {
                    "authenticated": True,
                    "session_id": session_id,
                    "session": session,
                    "configured_ttl": self.session_store.get_configured_ttl(session_id),
                    "ttl": self.session_store.get_ttl(session_id),
                }
            ).encode("utf-8")
        )

    def _handle_increment(self) -> None:
        session_id = self._get_session_id_from_cookie()

        if not session_id:
            self._send_json({"error": "No active session"}, 401)
            return

        new_value = self.session_store.increment_field(session_id, "page_views")
        if new_value is None:
            self._send_json(
                {"error": "Session expired"},
                401,
                clear_session_cookie=True,
            )
            return

        session = self.session_store.get_session(session_id)
        if session is None:
            self._send_json(
                {"error": "Session expired"},
                401,
                clear_session_cookie=True,
            )
            return

        self._send_json(
            {
                "authenticated": True,
                "session_id": session_id,
                "session": session,
                "configured_ttl": self.session_store.get_configured_ttl(session_id),
                "ttl": self.session_store.get_ttl(session_id),
                "page_views": new_value,
            },
            200,
        )

    def _handle_ttl_update(self) -> None:
        session_id = self._get_session_id_from_cookie()
        if not session_id:
            self._send_json({"error": "No active session"}, 401)
            return

        params = self._read_form_data()
        ttl = self._parse_ttl_value(params.get("ttl", [""])[0])
        if ttl is None:
            self._send_json({"error": "TTL must be a whole number greater than 0."}, 400)
            return

        if not self.session_store.set_session_ttl(session_id, ttl):
            self._send_json(
                {"error": "Session expired"},
                401,
                clear_session_cookie=True,
            )
            return

        session = self.session_store.get_session(session_id)
        if session is None:
            self._send_json(
                {"error": "Session expired"},
                401,
                clear_session_cookie=True,
            )
            return

        self._send_json(
            {
                "authenticated": True,
                "session_id": session_id,
                "session": session,
                "configured_ttl": self.session_store.get_configured_ttl(session_id),
                "ttl": self.session_store.get_ttl(session_id),
            },
            200,
        )

    def _handle_logout(self) -> None:
        session_id = self._get_session_id_from_cookie()
        if session_id:
            self.session_store.delete_session(session_id)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._clear_session_cookie()
        self.end_headers()
        self.wfile.write(json.dumps({"authenticated": False}).encode("utf-8"))

    def _read_form_data(self) -> dict[str, list[str]]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8")
        return parse_qs(raw_body)

    def _get_session_id_from_cookie(self) -> str | None:
        raw_cookie = self.headers.get("Cookie")
        if not raw_cookie:
            return None

        cookie = SimpleCookie()
        cookie.load(raw_cookie)
        morsel = cookie.get(self.session_cookie_name)
        if morsel is None:
            return None

        return morsel.value

    def _parse_ttl_value(self, raw_ttl: str) -> int | None:
        try:
            ttl = int(raw_ttl)
        except (TypeError, ValueError):
            return None

        if ttl < 1:
            return None

        return ttl

    def _set_session_cookie(self, session_id: str) -> None:
        cookie = SimpleCookie()
        cookie[self.session_cookie_name] = session_id
        cookie[self.session_cookie_name]["path"] = "/"
        cookie[self.session_cookie_name]["httponly"] = True
        cookie[self.session_cookie_name]["samesite"] = "Lax"
        self.send_header("Set-Cookie", cookie.output(header="").strip())

    def _clear_session_cookie(self) -> None:
        cookie = SimpleCookie()
        cookie[self.session_cookie_name] = ""
        cookie[self.session_cookie_name]["path"] = "/"
        cookie[self.session_cookie_name]["expires"] = "Thu, 01 Jan 1970 00:00:00 GMT"
        cookie[self.session_cookie_name]["max-age"] = 0
        self.send_header("Set-Cookie", cookie.output(header="").strip())

    def _load_session(self, session_id: str | None) -> dict[str, str] | None:
        if not session_id:
            return None

        session = self.session_store.get_session(session_id)
        if session is None:
            return None

        session["ttl"] = str(self.session_store.get_ttl(session_id))
        configured_ttl = self.session_store.get_configured_ttl(session_id)
        if configured_ttl is not None:
            session["session_ttl"] = str(configured_ttl)
        return session

    def _send_html(self, html: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def _send_json(
        self,
        payload: dict,
        status: int,
        clear_session_cookie: bool = False,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        if clear_session_cookie:
            self._clear_session_cookie()
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def _html_page(
        self,
        session_id: str | None,
        session: dict[str, str] | None,
    ) -> str:
        session_html = self._session_html(session_id, session)

        return f"""<!DOCTYPE html>
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
    * {{
      box-sizing: border-box;
    }}
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
    .panel h2 {{
      margin-top: 0;
      margin-bottom: 10px;
    }}
    .pill {{
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }}
    label {{
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
    }}
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
    button.secondary {{
      background: #38424a;
    }}
    button:hover {{
      background: var(--accent-dark);
    }}
    button.secondary:hover {{
      background: #20282e;
    }}
    dl {{
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 14px;
      margin: 0;
    }}
    dt {{
      font-weight: bold;
    }}
    dd {{
      margin: 0;
      word-break: break-word;
    }}
    pre {{
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin-bottom: 0;
    }}
    #status {{
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }}
    #status.ok {{
      display: block;
      background: var(--ok);
    }}
    #status.error {{
      display: block;
      background: var(--warn);
    }}
    @media (max-width: 600px) {{
      main {{
        padding-top: 28px;
      }}
      button {{
        width: 100%;
      }}
    }}
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-py + Python standard library HTTP server</div>
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
        <div id="session-view">{session_html}</div>
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
      sessionView.innerHTML = `
        <p>No active session.</p>
        <p>Create one to store state in Redis and receive a cookie-backed session ID.</p>
      `;
    }}

    function escapeHtml(value) {{
      return String(value).replace(/[&<>"']/g, (char) => ({{
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

      const session = data.session;
      const sessionId = escapeHtml(data.session_id ?? "");
      const username = escapeHtml(session.username ?? "");
      const pageViews = escapeHtml(session.page_views ?? "0");
      const configuredTtl = escapeHtml(data.configured_ttl ?? session.session_ttl ?? "");
      const createdAt = escapeHtml(session.created_at ?? "");
      const lastAccessed = escapeHtml(session.last_accessed_at ?? "");
      const ttl = escapeHtml(data.ttl ?? session.ttl ?? "");
      sessionView.innerHTML = `
        <dl>
          <dt>Session ID</dt><dd>${{sessionId}}</dd>
          <dt>Username</dt><dd>${{username}}</dd>
          <dt>Page views</dt><dd>${{pageViews}}</dd>
          <dt>Configured TTL</dt><dd>${{configuredTtl}} seconds</dd>
          <dt>Created</dt><dd>${{createdAt}}</dd>
          <dt>Last accessed</dt><dd>${{lastAccessed}}</dd>
          <dt>TTL</dt><dd>${{ttl}} seconds</dd>
        </dl>
        <form id="ttl-form">
          <label for="active-ttl">Update session TTL (seconds)</label>
          <input id="active-ttl" name="ttl" type="number" value="${{configuredTtl}}" min="1" step="1">
          <button type="submit">Apply TTL</button>
        </form>
        <button id="increment-button">Increment page views</button>
        <button id="logout-button" class="secondary">Log out</button>
      `;

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
</html>
"""

    def _session_html(
        self,
        session_id: str | None,
        session: dict[str, str] | None,
    ) -> str:
        if not session_id or session is None:
            return (
                "<p>No active session.</p>"
                "<p>Create one to store state in Redis and receive a cookie-backed session ID.</p>"
            )

        safe_session_id = escape(session_id)
        safe_username = escape(session.get("username", ""))
        safe_page_views = escape(session.get("page_views", "0"))
        safe_created = escape(session.get("created_at", ""))
        safe_accessed = escape(session.get("last_accessed_at", ""))
        safe_configured_ttl = escape(session.get("session_ttl", ""))
        safe_ttl = escape(session.get("ttl", ""))

        return f"""
<dl>
  <dt>Session ID</dt><dd>{safe_session_id}</dd>
  <dt>Username</dt><dd>{safe_username}</dd>
  <dt>Page views</dt><dd>{safe_page_views}</dd>
  <dt>Configured TTL</dt><dd>{safe_configured_ttl} seconds</dd>
  <dt>Created</dt><dd>{safe_created}</dd>
  <dt>Last accessed</dt><dd>{safe_accessed}</dd>
  <dt>TTL</dt><dd>{safe_ttl} seconds</dd>
</dl>
<form id="ttl-form">
  <label for="active-ttl">Update session TTL (seconds)</label>
  <input id="active-ttl" name="ttl" type="number" value="{safe_configured_ttl}" min="1" step="1">
  <button type="submit">Apply TTL</button>
</form>
<button id="increment-button">Increment page views</button>
<button id="logout-button" class="secondary">Log out</button>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis session store demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8080, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument("--ttl", type=int, default=1800, help="Session TTL in seconds")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    SessionDemoHandler.session_store = RedisSessionStore(
        redis_client=redis_client,
        ttl=args.ttl,
    )

    server = ThreadingHTTPServer((args.host, args.port), SessionDemoHandler)
    print(f"Redis session store demo server listening on http://{args.host}:{args.port}")
    print(f"Using Redis at {args.redis_host}:{args.redis_port} with TTL {args.ttl}s")
    server.serve_forever()


if __name__ == "__main__":
    main()
