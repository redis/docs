import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Redis Session Store Demo Server.
 *
 * <p>Usage:</p>
 *
 * <pre>{@code
 * javac -cp jedis-5.2.0.jar RedisSessionStore.java DemoServer.java
 * java -cp .:jedis-5.2.0.jar DemoServer --port 8080 --redis-host localhost --redis-port 6379
 * }</pre>
 */
public class DemoServer {

    private static RedisSessionStore sessionStore;
    private static JedisPool jedisPool;

    public static void main(String[] args) {
        int port = 8080;
        String redisHost = "localhost";
        int redisPort = 6379;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--port":
                    port = Integer.parseInt(args[++i]);
                    break;
                case "--redis-host":
                    redisHost = args[++i];
                    break;
                case "--redis-port":
                    redisPort = Integer.parseInt(args[++i]);
                    break;
                default:
                    break;
            }
        }

        try {
            jedisPool = new JedisPool(new JedisPoolConfig(), redisHost, redisPort);
            jedisPool.getResource().close();
            sessionStore = new RedisSessionStore(jedisPool);
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n", redisHost, redisPort, e.getMessage());
            System.exit(1);
        }

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/", new HomeHandler());
            server.createContext("/session", new SessionHandler());
            server.createContext("/login", new LoginHandler());
            server.createContext("/increment", new IncrementHandler());
            server.createContext("/ttl", new TtlHandler());
            server.createContext("/logout", new LogoutHandler());
            server.setExecutor(null);
            server.start();

            System.out.printf("Session store demo listening on http://localhost:%d%n", port);

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                jedisPool.close();
                server.stop(0);
            }));
        } catch (IOException e) {
            System.err.printf("Server error: %s%n", e.getMessage());
            System.exit(1);
        }
    }

    static class HomeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "text/plain; charset=utf-8", "Method Not Allowed");
                return;
            }

            String path = exchange.getRequestURI().getPath();
            if (!"/".equals(path) && !"/index.html".equals(path)) {
                sendResponse(exchange, 404, "text/plain; charset=utf-8", "Not Found");
                return;
            }

            String sessionId = getSessionId(exchange);
            Map<String, String> session = enrichSession(sessionId);

            sendResponse(exchange, 200, "text/html; charset=utf-8", htmlPage(sessionId, session));
        }
    }

    static class SessionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}", false);
                return;
            }

            String sessionId = getSessionId(exchange);
            if (sessionId == null) {
                sendJson(exchange, 200, jsonPayload(false, null, null, null, null, null, null), false);
                return;
            }

            Map<String, String> session = enrichSession(sessionId);
            if (session == null) {
                sendJson(exchange, 200, jsonPayload(false, null, null, null, null, null, null), true);
                return;
            }

            Integer configuredTtl = sessionStore.getConfiguredTtl(sessionId);
            Long ttl = sessionStore.getTtl(sessionId);
            sendJson(exchange, 200, jsonPayload(true, sessionId, session, configuredTtl, ttl, null, null), false);
        }
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}", false);
                return;
            }

            Map<String, String> params = parseFormData(readRequestBody(exchange));
            String username = params.getOrDefault("username", "Guest").trim();
            if (username.isEmpty()) {
                username = "Guest";
            }

            Integer ttl = parseTtl(params.getOrDefault("ttl", "60"));
            if (ttl == null) {
                sendJson(exchange, 400, jsonPayload(false, null, null, null, null, null,
                        "TTL must be a whole number greater than 0."), false);
                return;
            }

            String sessionId = sessionStore.createSession(Map.of(
                    "username", username,
                    "page_views", "1"
            ), ttl);
            Map<String, String> session = enrichSession(sessionId);
            Integer configuredTtl = sessionStore.getConfiguredTtl(sessionId);
            Long remainingTtl = sessionStore.getTtl(sessionId);

            exchange.getResponseHeaders().add(
                    "Set-Cookie",
                    "sid=" + sessionId + "; Path=/; HttpOnly; SameSite=Lax"
            );
            sendJson(exchange, 200, jsonPayload(true, sessionId, session, configuredTtl, remainingTtl, null, null), false);
        }
    }

    static class IncrementHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}", false);
                return;
            }

            String sessionId = getSessionId(exchange);
            if (sessionId == null) {
                sendJson(exchange, 401, jsonPayload(false, null, null, null, null, null, "No active session"), false);
                return;
            }

            Long pageViews = sessionStore.incrementField(sessionId, "page_views", 1);
            if (pageViews == null) {
                sendJson(exchange, 401, jsonPayload(false, null, null, null, null, null, "Session expired"), true);
                return;
            }

            Map<String, String> session = enrichSession(sessionId);
            if (session == null) {
                sendJson(exchange, 401, jsonPayload(false, null, null, null, null, null, "Session expired"), true);
                return;
            }

            Integer configuredTtl = sessionStore.getConfiguredTtl(sessionId);
            Long ttl = sessionStore.getTtl(sessionId);
            sendJson(exchange, 200, jsonPayload(true, sessionId, session, configuredTtl, ttl, pageViews, null), false);
        }
    }

    static class TtlHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}", false);
                return;
            }

            String sessionId = getSessionId(exchange);
            if (sessionId == null) {
                sendJson(exchange, 401, jsonPayload(false, null, null, null, null, null, "No active session"), false);
                return;
            }

            Map<String, String> params = parseFormData(readRequestBody(exchange));
            Integer ttl = parseTtl(params.getOrDefault("ttl", ""));
            if (ttl == null) {
                sendJson(exchange, 400, jsonPayload(false, null, null, null, null, null,
                        "TTL must be a whole number greater than 0."), false);
                return;
            }

            if (!sessionStore.setSessionTtl(sessionId, ttl)) {
                sendJson(exchange, 401, jsonPayload(false, null, null, null, null, null, "Session expired"), true);
                return;
            }

            Map<String, String> session = enrichSession(sessionId);
            if (session == null) {
                sendJson(exchange, 401, jsonPayload(false, null, null, null, null, null, "Session expired"), true);
                return;
            }

            Integer configuredTtl = sessionStore.getConfiguredTtl(sessionId);
            Long remainingTtl = sessionStore.getTtl(sessionId);
            sendJson(exchange, 200, jsonPayload(true, sessionId, session, configuredTtl, remainingTtl, null, null), false);
        }
    }

    static class LogoutHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}", false);
                return;
            }

            String sessionId = getSessionId(exchange);
            if (sessionId != null) {
                sessionStore.deleteSession(sessionId);
            }
            sendJson(exchange, 200, jsonPayload(false, null, null, null, null, null, null), true);
        }
    }

    private static Map<String, String> enrichSession(String sessionId) {
        if (sessionId == null) {
            return null;
        }

        Map<String, String> session = sessionStore.getSession(sessionId, true);
        if (session == null) {
            return null;
        }

        session.put("ttl", String.valueOf(sessionStore.getTtl(sessionId)));
        Integer configuredTtl = sessionStore.getConfiguredTtl(sessionId);
        if (configuredTtl != null) {
            session.put("session_ttl", String.valueOf(configuredTtl));
        }
        return session;
    }

    private static String getSessionId(HttpExchange exchange) {
        String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
        if (cookieHeader == null || cookieHeader.isEmpty()) {
            return null;
        }

        for (String part : cookieHeader.split(";")) {
            String trimmed = part.trim();
            int separator = trimmed.indexOf('=');
            if (separator == -1) {
                continue;
            }

            String name = trimmed.substring(0, separator).trim();
            String value = trimmed.substring(separator + 1).trim();
            if ("sid".equals(name)) {
                return value;
            }
        }

        return null;
    }

    private static Integer parseTtl(String rawTtl) {
        try {
            int ttl = Integer.parseInt(rawTtl);
            return ttl >= 1 ? ttl : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream inputStream = exchange.getRequestBody()) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseFormData(String body) {
        Map<String, String> params = new HashMap<>();
        if (body == null || body.isEmpty()) {
            return params;
        }

        for (String pair : body.split("&")) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2) {
                params.put(
                        URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8),
                        URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8)
                );
            }
        }

        return params;
    }

    private static String jsonEscape(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static String jsonMap(Map<String, String> value) {
        if (value == null) {
            return "null";
        }

        StringBuilder builder = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> entry : value.entrySet()) {
            if (!first) {
                builder.append(',');
            }
            builder.append('"').append(jsonEscape(entry.getKey())).append("\":");
            builder.append('"').append(jsonEscape(entry.getValue())).append('"');
            first = false;
        }
        builder.append('}');
        return builder.toString();
    }

    private static String jsonPayload(
            boolean authenticated,
            String sessionId,
            Map<String, String> session,
            Integer configuredTtl,
            Long ttl,
            Long pageViews,
            String error
    ) {
        Map<String, String> ordered = session == null ? null : new LinkedHashMap<>(session);
        StringBuilder builder = new StringBuilder("{");
        builder.append("\"authenticated\":").append(authenticated);
        if (sessionId != null) {
            builder.append(",\"session_id\":\"").append(jsonEscape(sessionId)).append('"');
        }
        builder.append(",\"session\":").append(jsonMap(ordered));
        if (configuredTtl != null) {
            builder.append(",\"configured_ttl\":").append(configuredTtl);
        }
        if (ttl != null) {
            builder.append(",\"ttl\":").append(ttl);
        }
        if (pageViews != null) {
            builder.append(",\"page_views\":").append(pageViews);
        }
        if (error != null) {
            builder.append(",\"error\":\"").append(jsonEscape(error)).append('"');
        }
        builder.append('}');
        return builder.toString();
    }

    private static void sendJson(HttpExchange exchange, int status, String body, boolean clearSessionCookie)
            throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        if (clearSessionCookie) {
            exchange.getResponseHeaders().add(
                    "Set-Cookie",
                    "sid=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            );
        }
        sendResponse(exchange, status, "application/json", body);
    }

    private static void sendResponse(HttpExchange exchange, int status, String contentType, String body)
            throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream outputStream = exchange.getResponseBody()) {
            outputStream.write(bytes);
        }
    }

    private static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String sessionView(String sessionId, Map<String, String> session) {
        if (sessionId == null || session == null) {
            return "<p>No active session.</p><p>Create one to store state in Redis and receive a cookie-backed session ID.</p>";
        }

        return """
                <dl>
                  <dt>Session ID</dt><dd>%s</dd>
                  <dt>Username</dt><dd>%s</dd>
                  <dt>Page views</dt><dd>%s</dd>
                  <dt>Configured TTL</dt><dd>%s seconds</dd>
                  <dt>Created</dt><dd>%s</dd>
                  <dt>Last accessed</dt><dd>%s</dd>
                  <dt>TTL</dt><dd>%s seconds</dd>
                </dl>
                <form id="ttl-form">
                  <label for="active-ttl">Update session TTL (seconds)</label>
                  <input id="active-ttl" name="ttl" type="number" value="%s" min="1" step="1">
                  <button type="submit">Apply TTL</button>
                </form>
                <button id="increment-button">Increment page views</button>
                <button id="logout-button" class="secondary">Log out</button>
                """.formatted(
                escapeHtml(sessionId),
                escapeHtml(session.get("username")),
                escapeHtml(session.get("page_views")),
                escapeHtml(session.get("session_ttl")),
                escapeHtml(session.get("created_at")),
                escapeHtml(session.get("last_accessed_at")),
                escapeHtml(session.get("ttl")),
                escapeHtml(session.get("session_ttl"))
        );
    }

    private static String htmlPage(String sessionId, Map<String, String> session) {
        return """
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
                    <div class="pill">Jedis + Java HttpServer demo</div>
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
                        <div id="session-view">__SESSION_VIEW__</div>
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
                """.replace("__SESSION_VIEW__", sessionView(sessionId, session));
    }
}
