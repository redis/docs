import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Redis prefetch-cache demo server using Lettuce.
 *
 * <p>Run this file and visit http://localhost:8786 to watch a prefetch
 * cache in action: the demo bulk-loads every primary record into Redis
 * on startup, runs a background sync worker that applies primary
 * mutations within milliseconds, and lets you add, update, delete, and
 * re-prefetch records to see how the cache stays current without ever
 * falling back to the primary on the read path.</p>
 */
public class DemoServer {

    private static PrefetchCache cache;
    private static MockPrimaryStore primary;
    private static SyncWorker sync;
    private static RedisClient redisClient;
    private static StatefulRedisConnection<String, String> connection;

    public static void main(String[] args) {
        String host = "127.0.0.1";
        int port = 8786;
        String redisHost = "localhost";
        int redisPort = 6379;
        String cachePrefix = "cache:category:";
        int ttlSeconds = 3600;
        int primaryLatencyMs = 80;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host":
                    host = args[++i];
                    break;
                case "--port":
                    port = Integer.parseInt(args[++i]);
                    break;
                case "--redis-host":
                    redisHost = args[++i];
                    break;
                case "--redis-port":
                    redisPort = Integer.parseInt(args[++i]);
                    break;
                case "--cache-prefix":
                    cachePrefix = args[++i];
                    break;
                case "--ttl-seconds":
                    ttlSeconds = Integer.parseInt(args[++i]);
                    break;
                case "--primary-latency-ms":
                    primaryLatencyMs = Integer.parseInt(args[++i]);
                    break;
                default:
                    break;
            }
        }

        try {
            redisClient = RedisClient.create(
                    RedisURI.builder().withHost(redisHost).withPort(redisPort).build());
            connection = redisClient.connect();
            connection.sync().ping();
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n",
                    redisHost, redisPort, e.getMessage());
            System.exit(1);
        }

        cache = new PrefetchCache(connection, cachePrefix, ttlSeconds);
        primary = new MockPrimaryStore(primaryLatencyMs);
        sync = new SyncWorker(primary, cache);

        long startedNs = System.nanoTime();
        cache.clear();
        int loaded = cache.bulkLoad(primary.listRecords());
        double elapsedMs = (System.nanoTime() - startedNs) / 1_000_000.0;
        sync.start();

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
            server.createContext("/", new RootHandler());
            server.createContext("/categories", new CategoriesHandler());
            server.createContext("/read", new ReadHandler());
            server.createContext("/stats", new StatsHandler());
            server.createContext("/update", new UpdateHandler());
            server.createContext("/add", new AddHandler());
            server.createContext("/delete", new DeleteHandler());
            server.createContext("/invalidate", new InvalidateHandler());
            server.createContext("/clear", new ClearHandler());
            server.createContext("/reprefetch", new ReprefetchHandler());
            server.createContext("/reset", new ResetHandler());
            server.setExecutor(Executors.newFixedThreadPool(16));

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    sync.stop(2000);
                } catch (Exception ignored) {
                }
                if (connection != null) connection.close();
                if (redisClient != null) redisClient.shutdown();
            }));

            server.start();
            System.out.printf("Redis prefetch-cache demo server listening on http://%s:%d%n",
                    host, port);
            System.out.printf("Using Redis at %s:%d with cache prefix '%s' and TTL %ds%n",
                    redisHost, redisPort, cachePrefix, ttlSeconds);
            System.out.printf("Prefetched %d records in %.1f ms; sync worker running%n",
                    loaded, elapsedMs);
        } catch (IOException e) {
            System.err.println("Failed to start server: " + e.getMessage());
            System.exit(1);
        }
    }

    // ----- Handlers ---------------------------------------------------

    static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (!path.equals("/") && !path.equals("/index.html")) {
                sendJson(exchange, 404, "{\"error\":\"Not Found\"}");
                return;
            }
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            byte[] body = renderHtmlPage(cache.getTtlSeconds())
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        }
    }

    static class CategoriesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("cache_ids", cache.ids());
            response.put("primary_ids", primary.listIds());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ReadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, String> query = parseQuery(exchange.getRequestURI().getRawQuery());
            String id = query.getOrDefault("id", "");
            if (id.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"Missing 'id'.\"}");
                return;
            }
            PrefetchCache.Result result = cache.get(id);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("record", result.record); // may be null on miss
            response.put("hit", result.hit);
            response.put("redis_latency_ms", round2(result.redisLatencyMs));
            response.put("ttl_remaining", cache.ttlRemaining(id));
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class StatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            sendJson(exchange, 200, toJson(buildStats()));
        }
    }

    static class UpdateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String id = form.getOrDefault("id", "");
            String field = form.getOrDefault("field", "");
            String value = form.getOrDefault("value", "");
            if (id.isEmpty() || field.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"Missing 'id' or 'field'.\"}");
                return;
            }
            if (!primary.updateField(id, field, value)) {
                sendJson(exchange, 404, "{\"error\":\"Unknown category '" + jsonEscape(id) + "'.\"}");
                return;
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("field", field);
            response.put("value", value);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class AddHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String id = form.getOrDefault("id", "").trim();
            String name = form.getOrDefault("name", "").trim();
            if (id.isEmpty() || name.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"Missing 'id' or 'name'.\"}");
                return;
            }
            String displayOrder = form.getOrDefault("display_order", "");
            if (displayOrder.isEmpty()) displayOrder = "99";
            String featured = form.getOrDefault("featured", "");
            if (featured.isEmpty()) featured = "false";
            String parentId = form.getOrDefault("parent_id", "");

            Map<String, String> record = new LinkedHashMap<>();
            record.put("id", id);
            record.put("name", name);
            record.put("display_order", displayOrder);
            record.put("featured", featured);
            record.put("parent_id", parentId);

            if (!primary.addRecord(record)) {
                sendJson(exchange, 409,
                        "{\"error\":\"Category '" + jsonEscape(id) + "' already exists.\"}");
                return;
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("record", record);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class DeleteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String id = form.getOrDefault("id", "");
            if (id.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"Missing 'id'.\"}");
                return;
            }
            if (!primary.deleteRecord(id)) {
                sendJson(exchange, 404, "{\"error\":\"Unknown category '" + jsonEscape(id) + "'.\"}");
                return;
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class InvalidateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String id = form.getOrDefault("id", "");
            if (id.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"Missing 'id'.\"}");
                return;
            }
            boolean deleted = cache.invalidate(id);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("deleted", deleted);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ClearHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            // Pause the sync worker so it cannot recreate keys between
            // SCAN and DEL. Queued events accumulate and apply after resume.
            sync.pause(2000);
            long deleted;
            try {
                deleted = cache.clear();
            } finally {
                sync.resume();
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("deleted", deleted);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ReprefetchHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            // Pause the sync worker so it cannot interleave with the
            // clear + snapshot + bulk_load sequence. Without this, a
            // change applied between listRecords() and bulkLoad() would
            // be overwritten by the stale snapshot.
            sync.pause(2000);
            int loaded;
            double elapsedMs;
            try {
                long startedNs = System.nanoTime();
                cache.clear();
                loaded = cache.bulkLoad(primary.listRecords());
                elapsedMs = (System.nanoTime() - startedNs) / 1_000_000.0;
            } finally {
                sync.resume();
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("loaded", loaded);
            response.put("elapsed_ms", round2(elapsedMs));
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            cache.resetStats();
            primary.resetReads();
            sendJson(exchange, 200, toJson(buildStats()));
        }
    }

    // ----- Helpers ----------------------------------------------------

    private static Map<String, Object> buildStats() {
        Map<String, Object> stats = cache.stats();
        stats.put("primary_reads_total", primary.reads());
        stats.put("primary_read_latency_ms", primary.getReadLatencyMs());
        return stats;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream inputStream = exchange.getRequestBody()) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseFormData(String body) {
        Map<String, String> params = new HashMap<>();
        if (body == null || body.isEmpty()) return params;
        for (String pair : body.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length != 2 || kv[0].isEmpty()) continue;
            params.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                    URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
        }
        return params;
    }

    private static Map<String, String> parseQuery(String query) {
        if (query == null || query.isEmpty()) {
            return new HashMap<>();
        }
        return parseFormData(query);
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String toJson(Object value) {
        StringBuilder sb = new StringBuilder();
        appendJson(sb, value);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void appendJson(StringBuilder sb, Object value) {
        if (value == null) {
            sb.append("null");
        } else if (value instanceof Boolean) {
            sb.append(value);
        } else if (value instanceof Number) {
            sb.append(value);
        } else if (value instanceof Map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
                if (!first) sb.append(',');
                first = false;
                appendJsonString(sb, String.valueOf(entry.getKey()));
                sb.append(':');
                appendJson(sb, entry.getValue());
            }
            sb.append('}');
        } else if (value instanceof List) {
            sb.append('[');
            boolean first = true;
            for (Object item : (List<Object>) value) {
                if (!first) sb.append(',');
                first = false;
                appendJson(sb, item);
            }
            sb.append(']');
        } else {
            appendJsonString(sb, String.valueOf(value));
        }
    }

    private static void appendJsonString(StringBuilder sb, String value) {
        sb.append('"').append(jsonEscape(value)).append('"');
    }

    private static String jsonEscape(String value) {
        StringBuilder sb = new StringBuilder(value.length() + 4);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    private static String renderHtmlPage(int cacheTtl) {
        return HTML_TEMPLATE.replace("__CACHE_TTL__", Integer.toString(cacheTtl));
    }

    // Same HTML as the Python reference. The pill text is the
    // Lettuce + JDK HttpServer label per the Lettuce port brief, and
    // __CACHE_TTL__ is substituted at render time with the safety-net
    // TTL the cache was constructed with.
    private static final String HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Redis Prefetch Cache Demo</title>
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
                  --hit: #c9e7d2;
                  --miss: #f5d6c6;
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
                main { max-width: 980px; margin: 0 auto; padding: 48px 20px 72px; }
                h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
                p.lede { max-width: 52rem; font-size: 1.1rem; color: var(--muted); }
                .grid {
                  display: grid; gap: 20px;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
                  display: inline-block; border-radius: 999px;
                  background: #efe2cf; color: var(--accent-dark);
                  padding: 6px 10px; font-size: 0.9rem; margin-bottom: 12px;
                }
                label { display: block; font-weight: bold; margin: 12px 0 6px; }
                input, select {
                  width: 100%; padding: 10px 12px;
                  border-radius: 10px; border: 1px solid #cfbca6;
                  font: inherit; background: white;
                }
                button {
                  appearance: none; border: 0; border-radius: 999px;
                  background: var(--accent); color: white;
                  padding: 11px 18px; font: inherit; cursor: pointer;
                  margin-right: 8px; margin-top: 12px;
                }
                button.secondary { background: #38424a; }
                button.danger { background: #8a3a3a; }
                button:hover { background: var(--accent-dark); }
                button.secondary:hover { background: #20282e; }
                button.danger:hover { background: #6b2929; }
                dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
                dt { font-weight: bold; }
                dd { margin: 0; word-break: break-word; }
                .badge {
                  display: inline-block; border-radius: 6px;
                  padding: 3px 8px; font-size: 0.85rem; font-weight: bold;
                }
                .badge.hit { background: var(--hit); color: #1d4a2c; }
                .badge.miss { background: var(--miss); color: #6b3220; }
                .row { display: flex; gap: 8px; flex-wrap: wrap; }
                .row > * { flex: 1 1 0; min-width: 120px; }
                #status {
                  margin-top: 20px; padding: 14px 16px;
                  border-radius: 14px; display: none;
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
                <div class="pill">Lettuce + JDK HttpServer</div>
                <h1>Redis Prefetch Cache Demo</h1>
                <p class="lede">
                  Every record from the primary store has been pre-loaded into Redis.
                  Reads run <code>HGETALL</code> against Redis only &mdash; there is no
                  fall-back to the primary on the read path. When you add, update, or
                  delete a record, the primary emits a change event that a background
                  sync worker applies to Redis within a few milliseconds. A long
                  safety-net TTL (__CACHE_TTL__ s) is refreshed on every add or update
                  event (delete events remove the key) and bounds memory if sync ever stops.
                </p>

                <div class="grid">
                  <section class="panel" style="grid-column: 1 / -1;">
                    <h2>Cache state</h2>
                    <div id="state-view">Loading...</div>
                    <button id="refresh-state">Refresh state</button>
                  </section>

                  <section class="panel">
                    <h2>Read a category</h2>
                    <p>Reads come from Redis only. Every read should be a hit because
                    the cache was pre-loaded and the sync worker keeps it current.</p>
                    <label for="read-id">Category ID</label>
                    <select id="read-id"></select>
                    <button id="read-button">Read from cache</button>
                  </section>

                  <section class="panel">
                    <h2>Update a field</h2>
                    <p>Updates write to the primary. The sync worker picks up the
                    change event and rewrites the cache hash within milliseconds.</p>
                    <label for="update-id">Category</label>
                    <select id="update-id"></select>
                    <label for="update-field">Field</label>
                    <select id="update-field">
                      <option value="name">name</option>
                      <option value="display_order">display_order</option>
                      <option value="featured">featured</option>
                      <option value="parent_id">parent_id</option>
                    </select>
                    <label for="update-value">New value</label>
                    <input id="update-value" value="true">
                    <button id="update-button">Apply update</button>
                  </section>

                  <section class="panel">
                    <h2>Add a category</h2>
                    <p>Inserts to the primary propagate to the cache through the same
                    sync path.</p>
                    <label for="add-id">ID</label>
                    <input id="add-id" value="cat-006">
                    <label for="add-name">Name</label>
                    <input id="add-name" value="Seasonal">
                    <label for="add-display-order">Display order</label>
                    <input id="add-display-order" value="6">
                    <button id="add-button">Add to primary</button>
                  </section>

                  <section class="panel">
                    <h2>Delete a category</h2>
                    <p>Deletes remove the record from the primary, and the sync worker
                    removes the cache entry.</p>
                    <label for="delete-id">Category</label>
                    <select id="delete-id"></select>
                    <button id="delete-button" class="danger">Delete from primary</button>
                  </section>

                  <section class="panel">
                    <h2>Break the cache</h2>
                    <p>Simulate a failure of the sync pipeline. Reads against the
                    affected key(s) return a miss until you re-prefetch.</p>
                    <label for="invalidate-id">Category</label>
                    <select id="invalidate-id"></select>
                    <div class="row">
                      <button id="invalidate-button" class="secondary">Invalidate one</button>
                      <button id="clear-button" class="danger">Clear all</button>
                    </div>
                    <button id="reprefetch-button">Re-prefetch from primary</button>
                  </section>

                  <section class="panel">
                    <h2>Cache stats</h2>
                    <div id="stats-view">Loading...</div>
                    <button id="reset-button" class="secondary">Reset counters</button>
                  </section>

                  <section class="panel" style="grid-column: 1 / -1;">
                    <h2>Last result</h2>
                    <div id="result-view"><p>Read a category to see the cached record and timing.</p></div>
                  </section>
                </div>

                <div id="status"></div>
              </main>

              <script>
                const stateView = document.getElementById("state-view");
                const readIdSelect = document.getElementById("read-id");
                const updateIdSelect = document.getElementById("update-id");
                const updateField = document.getElementById("update-field");
                const updateValue = document.getElementById("update-value");
                const addId = document.getElementById("add-id");
                const addName = document.getElementById("add-name");
                const addDisplayOrder = document.getElementById("add-display-order");
                const deleteIdSelect = document.getElementById("delete-id");
                const invalidateIdSelect = document.getElementById("invalidate-id");
                const statsView = document.getElementById("stats-view");
                const resultView = document.getElementById("result-view");
                const statusBox = document.getElementById("status");

                function setStatus(message, kind) {
                  statusBox.textContent = message;
                  statusBox.className = kind;
                }

                function escapeHtml(value) {
                  return String(value).replace(/[&<>"']/g, (c) =>
                    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
                }

                function renderState(data) {
                  const cacheIds = data.cache_ids || [];
                  const primaryIds = data.primary_ids || [];
                  const missing = primaryIds.filter((id) => !cacheIds.includes(id));
                  const orphaned = cacheIds.filter((id) => !primaryIds.includes(id));
                  stateView.innerHTML = `
                    <dl>
                      <dt>In cache</dt><dd>${cacheIds.length} (${cacheIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
                      <dt>In primary</dt><dd>${primaryIds.length} (${primaryIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
                      <dt>Missing from cache</dt><dd>${missing.length ? missing.map(escapeHtml).join(", ") : "none"}</dd>
                      <dt>Orphaned in cache</dt><dd>${orphaned.length ? orphaned.map(escapeHtml).join(", ") : "none"}</dd>
                    </dl>`;
                  const select = (el, ids) => {
                    const previous = el.value;
                    el.innerHTML = ids.map((id) =>
                      `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`).join("");
                    if (ids.includes(previous)) el.value = previous;
                  };
                  select(readIdSelect, cacheIds.length ? cacheIds : primaryIds);
                  select(updateIdSelect, primaryIds);
                  select(deleteIdSelect, primaryIds);
                  select(invalidateIdSelect, cacheIds);
                }

                function renderStats(stats) {
                  if (!stats) { statsView.textContent = "(no data)"; return; }
                  statsView.innerHTML = `
                    <dl>
                      <dt>Hits</dt><dd>${stats.hits}</dd>
                      <dt>Misses</dt><dd>${stats.misses}</dd>
                      <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
                      <dt>Prefetched</dt><dd>${stats.prefetched}</dd>
                      <dt>Sync events applied</dt><dd>${stats.sync_events_applied}</dd>
                      <dt>Avg sync lag</dt><dd>${stats.sync_lag_ms_avg} ms</dd>
                      <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
                    </dl>`;
                }

                function renderRead(data) {
                  if (!data || !data.record) {
                    resultView.innerHTML = `<p><span class="badge miss">cache miss</span> &nbsp;
                      No entry in Redis for <strong>${escapeHtml(data.id)}</strong>.</p>
                      <p>With a healthy prefetch and sync, this should never happen on
                      a valid id &mdash; it means either the sync pipeline is behind
                      or the entry has been invalidated.</p>`;
                    return;
                  }
                  const r = data.record;
                  const badge = data.hit
                    ? '<span class="badge hit">cache hit</span>'
                    : '<span class="badge miss">cache miss</span>';
                  resultView.innerHTML = `
                    <p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
                       &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
                    <dl>
                      <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
                      <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
                      <dt>display_order</dt><dd>${escapeHtml(r.display_order ?? "")}</dd>
                      <dt>featured</dt><dd>${escapeHtml(r.featured ?? "")}</dd>
                      <dt>parent_id</dt><dd>${escapeHtml(r.parent_id ?? "")}</dd>
                    </dl>`;
                }

                async function loadState() {
                  const [state, stats] = await Promise.all([
                    fetch("/categories").then((r) => r.json()),
                    fetch("/stats").then((r) => r.json()),
                  ]);
                  renderState(state);
                  renderStats(stats);
                }

                async function refreshAfter(message, kind, payload) {
                  if (payload && payload.stats) renderStats(payload.stats);
                  await loadState();
                  setStatus(message, kind);
                }

                document.getElementById("refresh-state").addEventListener("click", loadState);

                document.getElementById("read-button").addEventListener("click", async () => {
                  const id = readIdSelect.value;
                  if (!id) { setStatus("No id selected.", "error"); return; }
                  const r = await fetch(`/read?id=${encodeURIComponent(id)}`);
                  const d = await r.json();
                  renderRead(d);
                  if (d.stats) renderStats(d.stats);
                  setStatus(d.hit ? "Served from Redis." : "Cache miss — no entry in Redis.", d.hit ? "ok" : "error");
                });

                document.getElementById("update-button").addEventListener("click", async () => {
                  const id = updateIdSelect.value;
                  const body = new URLSearchParams({ id, field: updateField.value, value: updateValue.value });
                  const r = await fetch("/update", { method: "POST", body });
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
                  refreshAfter("Primary updated; sync worker will apply the change to Redis.", "ok", d);
                });

                document.getElementById("add-button").addEventListener("click", async () => {
                  const body = new URLSearchParams({
                    id: addId.value,
                    name: addName.value,
                    display_order: addDisplayOrder.value,
                    featured: "false",
                    parent_id: "",
                  });
                  const r = await fetch("/add", { method: "POST", body });
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
                  refreshAfter("Added to primary; sync worker will populate the cache.", "ok", d);
                });

                document.getElementById("delete-button").addEventListener("click", async () => {
                  const id = deleteIdSelect.value;
                  const body = new URLSearchParams({ id });
                  const r = await fetch("/delete", { method: "POST", body });
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Delete failed.", "error"); return; }
                  refreshAfter("Deleted from primary; sync worker will remove the cache entry.", "ok", d);
                });

                document.getElementById("invalidate-button").addEventListener("click", async () => {
                  const id = invalidateIdSelect.value;
                  if (!id) { setStatus("Nothing in the cache to invalidate.", "error"); return; }
                  const body = new URLSearchParams({ id });
                  const r = await fetch("/invalidate", { method: "POST", body });
                  const d = await r.json();
                  refreshAfter(d.deleted ? `Cache entry for ${id} deleted.` : "No cache entry to delete.", "ok", d);
                });

                document.getElementById("clear-button").addEventListener("click", async () => {
                  const r = await fetch("/clear", { method: "POST" });
                  const d = await r.json();
                  refreshAfter(`Cleared ${d.deleted} cache entries. Reads will miss until you re-prefetch.`, "ok", d);
                });

                document.getElementById("reprefetch-button").addEventListener("click", async () => {
                  setStatus("Re-prefetching all records...", "ok");
                  const r = await fetch("/reprefetch", { method: "POST" });
                  const d = await r.json();
                  refreshAfter(`Re-prefetched ${d.loaded} records in ${d.elapsed_ms} ms.`, "ok", d);
                });

                document.getElementById("reset-button").addEventListener("click", async () => {
                  const r = await fetch("/reset", { method: "POST" });
                  const d = await r.json();
                  renderStats(d);
                  setStatus("Counters reset.", "ok");
                });

                loadState();
              </script>
            </body>
            </html>
            """;
}
