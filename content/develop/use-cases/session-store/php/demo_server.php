<?php

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/SessionStore.php';

use Predis\Client as PredisClient;

$redisHost = getenv('REDIS_HOST') ?: 'localhost';
$redisPort = (int) (getenv('REDIS_PORT') ?: 6379);

try {
    $redis = new PredisClient([
        'host' => $redisHost,
        'port' => $redisPort,
    ]);
    $redis->ping();
} catch (\Exception $e) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Failed to connect to Redis at {$redisHost}:{$redisPort}: {$e->getMessage()}";
    exit(1);
}

$store = new RedisSessionStore($redis);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if ($method === 'GET' && ($path === '/' || $path === '/index.html')) {
    handleHomePage($store);
    return;
}

if ($method === 'GET' && $path === '/session') {
    handleSessionFetch($store);
    return;
}

if ($method === 'POST' && $path === '/login') {
    handleLogin($store);
    return;
}

if ($method === 'POST' && $path === '/increment') {
    handleIncrement($store);
    return;
}

if ($method === 'POST' && $path === '/ttl') {
    handleTtlUpdate($store);
    return;
}

if ($method === 'POST' && $path === '/logout') {
    handleLogout($store);
    return;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Not Found';

function handleHomePage(RedisSessionStore $store): void
{
    $sessionId = getSessionIdFromCookie();
    $session = $sessionId !== null ? loadSession($store, $sessionId) : null;

    header('Content-Type: text/html; charset=utf-8');
    echo htmlPage($sessionId, $session);
}

function handleSessionFetch(RedisSessionStore $store): void
{
    $sessionId = getSessionIdFromCookie();

    if ($sessionId === null) {
        sendJson(['authenticated' => false, 'session' => null], 200);
        return;
    }

    $session = loadSession($store, $sessionId);
    if ($session === null) {
        sendJson(['authenticated' => false, 'session' => null], 200, true);
        return;
    }

    sendJson([
        'authenticated' => true,
        'session_id' => $sessionId,
        'session' => $session,
        'configured_ttl' => $store->getConfiguredTtl($sessionId),
        'ttl' => $store->getTtl($sessionId),
    ], 200);
}

function handleLogin(RedisSessionStore $store): void
{
    $params = readFormData();
    $username = trim($params['username'] ?? 'Guest');
    if ($username === '') {
        $username = 'Guest';
    }

    $ttl = parseTtlValue($params['ttl'] ?? '60');
    if ($ttl === null) {
        sendJson(['error' => 'TTL must be a whole number greater than 0.'], 400);
        return;
    }

    $sessionId = $store->createSession([
        'username' => $username,
        'page_views' => '1',
    ], $ttl);

    $session = loadSession($store, $sessionId);
    setSessionCookie($sessionId);

    sendJson([
        'authenticated' => true,
        'session_id' => $sessionId,
        'session' => $session,
        'configured_ttl' => $store->getConfiguredTtl($sessionId),
        'ttl' => $store->getTtl($sessionId),
    ], 200);
}

function handleIncrement(RedisSessionStore $store): void
{
    $sessionId = getSessionIdFromCookie();
    if ($sessionId === null) {
        sendJson(['error' => 'No active session'], 401);
        return;
    }

    $pageViews = $store->incrementField($sessionId, 'page_views');
    if ($pageViews === null) {
        sendJson(['error' => 'Session expired'], 401, true);
        return;
    }

    $session = loadSession($store, $sessionId);
    if ($session === null) {
        sendJson(['error' => 'Session expired'], 401, true);
        return;
    }

    sendJson([
        'authenticated' => true,
        'session_id' => $sessionId,
        'session' => $session,
        'configured_ttl' => $store->getConfiguredTtl($sessionId),
        'ttl' => $store->getTtl($sessionId),
        'page_views' => $pageViews,
    ], 200);
}

function handleTtlUpdate(RedisSessionStore $store): void
{
    $sessionId = getSessionIdFromCookie();
    if ($sessionId === null) {
        sendJson(['error' => 'No active session'], 401);
        return;
    }

    $params = readFormData();
    $ttl = parseTtlValue($params['ttl'] ?? '');
    if ($ttl === null) {
        sendJson(['error' => 'TTL must be a whole number greater than 0.'], 400);
        return;
    }

    if (!$store->setSessionTtl($sessionId, $ttl)) {
        sendJson(['error' => 'Session expired'], 401, true);
        return;
    }

    $session = loadSession($store, $sessionId);
    if ($session === null) {
        sendJson(['error' => 'Session expired'], 401, true);
        return;
    }

    sendJson([
        'authenticated' => true,
        'session_id' => $sessionId,
        'session' => $session,
        'configured_ttl' => $store->getConfiguredTtl($sessionId),
        'ttl' => $store->getTtl($sessionId),
    ], 200);
}

function handleLogout(RedisSessionStore $store): void
{
    $sessionId = getSessionIdFromCookie();
    if ($sessionId !== null) {
        $store->deleteSession($sessionId);
    }

    sendJson(['authenticated' => false], 200, true);
}

function readFormData(): array
{
    $rawBody = file_get_contents('php://input');
    $params = [];
    parse_str($rawBody ?: '', $params);
    return $params;
}

function getSessionIdFromCookie(): ?string
{
    return $_COOKIE['sid'] ?? null;
}

function parseTtlValue(string $rawTtl): ?int
{
    $value = filter_var($rawTtl, FILTER_VALIDATE_INT);
    if ($value === false || $value < 1) {
        return null;
    }

    return (int) $value;
}

function setSessionCookie(string $sessionId): void
{
    setcookie('sid', $sessionId, [
        'expires' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function clearSessionCookie(): void
{
    setcookie('sid', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function loadSession(RedisSessionStore $store, string $sessionId): ?array
{
    $session = $store->getSession($sessionId);
    if ($session === null) {
        return null;
    }

    $session['ttl'] = (string) $store->getTtl($sessionId);
    $configuredTtl = $store->getConfiguredTtl($sessionId);
    if ($configuredTtl !== null) {
        $session['session_ttl'] = (string) $configuredTtl;
    }

    return $session;
}

function sendJson(array $payload, int $statusCode, bool $clearSession = false): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    if ($clearSession) {
        clearSessionCookie();
    }
    echo json_encode($payload);
}

function escapeHtml(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function sessionView(?string $sessionId, ?array $session): string
{
    if ($sessionId === null || $session === null) {
        return '<p>No active session.</p><p>Create one to store state in Redis and receive a cookie-backed session ID.</p>';
    }

    return
        '<dl>' .
        '<dt>Session ID</dt><dd>' . escapeHtml($sessionId) . '</dd>' .
        '<dt>Username</dt><dd>' . escapeHtml($session['username'] ?? '') . '</dd>' .
        '<dt>Page views</dt><dd>' . escapeHtml($session['page_views'] ?? '0') . '</dd>' .
        '<dt>Configured TTL</dt><dd>' . escapeHtml($session['session_ttl'] ?? '') . ' seconds</dd>' .
        '<dt>Created</dt><dd>' . escapeHtml($session['created_at'] ?? '') . '</dd>' .
        '<dt>Last accessed</dt><dd>' . escapeHtml($session['last_accessed_at'] ?? '') . '</dd>' .
        '<dt>TTL</dt><dd>' . escapeHtml($session['ttl'] ?? '') . ' seconds</dd>' .
        '</dl>' .
        '<form id="ttl-form">' .
        '<label for="active-ttl">Update session TTL (seconds)</label>' .
        '<input id="active-ttl" name="ttl" type="number" value="' . escapeHtml($session['session_ttl'] ?? '15') . '" min="1" step="1">' .
        '<button type="submit">Apply TTL</button>' .
        '</form>' .
        '<button id="increment-button">Increment page views</button>' .
        '<button id="logout-button" class="secondary">Log out</button>';
}

function htmlPage(?string $sessionId, ?array $session): string
{
    $initialSessionView = sessionView($sessionId, $session);

    return <<<HTML
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
    <div class="pill">Predis + PHP built-in server demo</div>
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
        <div id="session-view">{$initialSessionView}</div>
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
HTML;
}
