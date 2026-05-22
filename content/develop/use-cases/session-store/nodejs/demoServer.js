#!/usr/bin/env node
"use strict";

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { createClient } = require("redis");
const { RedisSessionStore } = require("./sessionStore");

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { port: 8080, redisHost: "localhost", redisPort: 6379 };

  for (let index = 0; index < args.length; index += 1) {
    switch (args[index]) {
      case "--port":
        config.port = Number.parseInt(args[index + 1], 10);
        index += 1;
        break;
      case "--redis-host":
        config.redisHost = args[index + 1];
        index += 1;
        break;
      case "--redis-port":
        config.redisPort = Number.parseInt(args[index + 1], 10);
        index += 1;
        break;
      default:
        break;
    }
  }

  return config;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function parseCookies(cookieHeader = "") {
  const cookies = {};

  for (const pair of cookieHeader.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const name = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    cookies[name] = decodeURIComponent(value);
  }

  return cookies;
}

function parseTtl(rawTtl) {
  const ttl = Number.parseInt(rawTtl, 10);
  if (!Number.isInteger(ttl) || ttl < 1) {
    return null;
  }
  return ttl;
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

function json(res, status, payload, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(JSON.stringify(payload));
}

function html(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}

function sessionViewHtml(sessionId, session) {
  if (!sessionId || !session) {
    return [
      "<p>No active session.</p>",
      "<p>Create one to store state in Redis and receive a cookie-backed session ID.</p>",
    ].join("");
  }

  return `
    <dl>
      <dt>Session ID</dt><dd>${escapeHtml(sessionId)}</dd>
      <dt>Username</dt><dd>${escapeHtml(session.username || "")}</dd>
      <dt>Page views</dt><dd>${escapeHtml(session.page_views || "0")}</dd>
      <dt>Configured TTL</dt><dd>${escapeHtml(session.session_ttl || "")} seconds</dd>
      <dt>Created</dt><dd>${escapeHtml(session.created_at || "")}</dd>
      <dt>Last accessed</dt><dd>${escapeHtml(session.last_accessed_at || "")}</dd>
      <dt>TTL</dt><dd>${escapeHtml(session.ttl || "")} seconds</dd>
    </dl>
    <form id="ttl-form">
      <label for="active-ttl">Update session TTL (seconds)</label>
      <input id="active-ttl" name="ttl" type="number" value="${escapeHtml(
        session.session_ttl || "15"
      )}" min="1" step="1">
      <button type="submit">Apply TTL</button>
    </form>
    <button id="increment-button">Increment page views</button>
    <button id="logout-button" class="secondary">Log out</button>
  `;
}

function pageHtml(sessionId, session) {
  return `<!DOCTYPE html>
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
    * {
      box-sizing: border-box;
    }
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
    .panel h2 {
      margin-top: 0;
      margin-bottom: 10px;
    }
    .pill {
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    label {
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
    }
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
    button.secondary {
      background: #38424a;
    }
    button:hover {
      background: var(--accent-dark);
    }
    button.secondary:hover {
      background: #20282e;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 14px;
      margin: 0;
    }
    dt {
      font-weight: bold;
    }
    dd {
      margin: 0;
      word-break: break-word;
    }
    #status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }
    #status.ok {
      display: block;
      background: var(--ok);
    }
    #status.error {
      display: block;
      background: var(--warn);
    }
    @media (max-width: 600px) {
      main {
        padding-top: 28px;
      }
      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">node-redis + Node.js HTTP server</div>
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
        <div id="session-view">${sessionViewHtml(sessionId, session)}</div>
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
      const configuredTtl = escapeHtml(
        String(data.configured_ttl || session.session_ttl || "")
      );
      const createdAt = escapeHtml(session.created_at || "");
      const lastAccessed = escapeHtml(session.last_accessed_at || "");
      const ttl = escapeHtml(String(data.ttl || session.ttl || ""));

      sessionView.innerHTML = \`
        <dl>
          <dt>Session ID</dt><dd>\${sessionId}</dd>
          <dt>Username</dt><dd>\${username}</dd>
          <dt>Page views</dt><dd>\${pageViews}</dd>
          <dt>Configured TTL</dt><dd>\${configuredTtl} seconds</dd>
          <dt>Created</dt><dd>\${createdAt}</dd>
          <dt>Last accessed</dt><dd>\${lastAccessed}</dd>
          <dt>TTL</dt><dd>\${ttl} seconds</dd>
        </dl>
        <form id="ttl-form">
          <label for="active-ttl">Update session TTL (seconds)</label>
          <input id="active-ttl" name="ttl" type="number" value="\${configuredTtl}" min="1" step="1">
          <button type="submit">Apply TTL</button>
        </form>
        <button id="increment-button">Increment page views</button>
        <button id="logout-button" class="secondary">Log out</button>
      \`;

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
</html>`;
}

async function enrichSession(store, sessionId) {
  if (!sessionId) {
    return null;
  }

  const session = await store.getSession(sessionId);
  if (!session) {
    return null;
  }

  session.ttl = String(await store.getTtl(sessionId));
  const configuredTtl = await store.getConfiguredTtl(sessionId);
  if (configuredTtl !== null) {
    session.session_ttl = String(configuredTtl);
  }
  return session;
}

async function main() {
  const config = parseArgs();
  const redisClient = createClient({
    url: `redis://${config.redisHost}:${config.redisPort}`,
  });

  redisClient.on("error", (err) => {
    console.error("Redis client error:", err);
  });

  await redisClient.connect();
  const store = new RedisSessionStore({ redisClient });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.sid || null;

    try {
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        const session = await enrichSession(store, sessionId);
        html(res, 200, pageHtml(sessionId, session));
        return;
      }

      if (req.method === "GET" && url.pathname === "/session") {
        if (!sessionId) {
          json(res, 200, { authenticated: false, session: null });
          return;
        }

        const session = await enrichSession(store, sessionId);
        if (!session) {
          json(
            res,
            200,
            { authenticated: false, session: null },
            { "Set-Cookie": "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
          );
          return;
        }

        json(res, 200, {
          authenticated: true,
          session_id: sessionId,
          session,
          configured_ttl: await store.getConfiguredTtl(sessionId),
          ttl: await store.getTtl(sessionId),
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/login") {
        const params = new URLSearchParams(await readBody(req));
        const username = (params.get("username") || "Guest").trim() || "Guest";
        const ttl = parseTtl(params.get("ttl") || "60");

        if (ttl === null) {
          json(res, 400, { error: "TTL must be a whole number greater than 0." });
          return;
        }

        const newSessionId = await store.createSession(
          { username, page_views: "1" },
          ttl
        );
        const session = await enrichSession(store, newSessionId);

        json(
          res,
          200,
          {
            authenticated: true,
            session_id: newSessionId,
            session,
            configured_ttl: await store.getConfiguredTtl(newSessionId),
            ttl: await store.getTtl(newSessionId),
          },
          {
            "Set-Cookie": `sid=${encodeURIComponent(
              newSessionId
            )}; Path=/; HttpOnly; SameSite=Lax`,
          }
        );
        return;
      }

      if (req.method === "POST" && url.pathname === "/increment") {
        if (!sessionId) {
          json(res, 401, { error: "No active session" });
          return;
        }

        const newValue = await store.incrementField(sessionId, "page_views");
        if (newValue === null) {
          json(
            res,
            401,
            { error: "Session expired" },
            { "Set-Cookie": "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
          );
          return;
        }

        const session = await enrichSession(store, sessionId);
        if (!session) {
          json(
            res,
            401,
            { error: "Session expired" },
            { "Set-Cookie": "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
          );
          return;
        }

        json(res, 200, {
          authenticated: true,
          session_id: sessionId,
          session,
          configured_ttl: await store.getConfiguredTtl(sessionId),
          ttl: await store.getTtl(sessionId),
          page_views: newValue,
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/ttl") {
        if (!sessionId) {
          json(res, 401, { error: "No active session" });
          return;
        }

        const params = new URLSearchParams(await readBody(req));
        const ttl = parseTtl(params.get("ttl") || "");
        if (ttl === null) {
          json(res, 400, { error: "TTL must be a whole number greater than 0." });
          return;
        }

        const updated = await store.setSessionTtl(sessionId, ttl);
        if (!updated) {
          json(
            res,
            401,
            { error: "Session expired" },
            { "Set-Cookie": "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
          );
          return;
        }

        const session = await enrichSession(store, sessionId);
        if (!session) {
          json(
            res,
            401,
            { error: "Session expired" },
            { "Set-Cookie": "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
          );
          return;
        }

        json(res, 200, {
          authenticated: true,
          session_id: sessionId,
          session,
          configured_ttl: await store.getConfiguredTtl(sessionId),
          ttl: await store.getTtl(sessionId),
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/logout") {
        if (sessionId) {
          await store.deleteSession(sessionId);
        }

        json(
          res,
          200,
          { authenticated: false },
          { "Set-Cookie": "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT" }
        );
        return;
      }

      json(res, 404, { error: "Not found" });
    } catch (err) {
      console.error("Request error:", err);
      json(res, 500, { error: "Internal Server Error" });
    }
  });

  server.listen(config.port, () => {
    console.log(`Session store demo listening on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await redisClient.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
