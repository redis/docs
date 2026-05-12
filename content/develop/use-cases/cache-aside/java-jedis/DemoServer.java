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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Redis Cache-Aside Demo Server.
 *
 * <p>Usage:</p>
 *
 * <pre>{@code
 * javac -cp jedis-5.2.0.jar RedisCache.java MockPrimaryStore.java DemoServer.java
 * java -cp .:jedis-5.2.0.jar DemoServer --port 8080 --redis-host localhost --redis-port 6379
 * }</pre>
 */
public class DemoServer {

    private static RedisCache cache;
    private static MockPrimaryStore primary;
    private static JedisPool jedisPool;

    public static void main(String[] args) {
        int port = 8080;
        String redisHost = "localhost";
        int redisPort = 6379;
        int ttl = 30;
        int primaryLatencyMs = 150;

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
                case "--ttl":
                    ttl = Integer.parseInt(args[++i]);
                    break;
                case "--primary-latency-ms":
                    primaryLatencyMs = Integer.parseInt(args[++i]);
                    break;
                default:
                    break;
            }
        }

        try {
            jedisPool = new JedisPool(new JedisPoolConfig(), redisHost, redisPort);
            jedisPool.getResource().close();
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n", redisHost, redisPort, e.getMessage());
            System.exit(1);
        }

        cache = new RedisCache(jedisPool, "cache:product:", ttl, 2000, 25);
        primary = new MockPrimaryStore(primaryLatencyMs);

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/", new IndexHandler());
            server.createContext("/products", new ProductsHandler());
            server.createContext("/read", new ReadHandler());
            server.createContext("/stats", new StatsHandler());
            server.createContext("/invalidate", new InvalidateHandler());
            server.createContext("/update", new UpdateHandler());
            server.createContext("/stampede", new StampedeHandler());
            server.createContext("/reset", new ResetHandler());
            server.setExecutor(Executors.newFixedThreadPool(16));
            server.start();
            System.out.printf("Redis cache-aside demo server listening on http://localhost:%d%n", port);
            System.out.printf("Using Redis at %s:%d with cache TTL %ds%n", redisHost, redisPort, ttl);
            System.out.printf("Mock primary read latency: %d ms%n", primaryLatencyMs);
        } catch (IOException e) {
            System.err.println("Failed to start server: " + e.getMessage());
            System.exit(1);
        }
    }

    static class IndexHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            String path = exchange.getRequestURI().getPath();
            if (!path.equals("/") && !path.equals("/index.html")) {
                sendJson(exchange, 404, "{\"error\":\"Not Found\"}");
                return;
            }
            byte[] body = renderHtmlPage(primary.listIds(), primary.getReadLatencyMs(), cache.getTtl())
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        }
    }

    static class ProductsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            sendJson(exchange, 200, "{\"products\":" + jsonStringList(primary.listIds()) + "}");
        }
    }

    static class ReadHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, String> query = parseQuery(exchange.getRequestURI().getQuery());
            String id = query.getOrDefault("id", "");
            if (id.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"Missing 'id' query parameter.\"}");
                return;
            }
            long startedNs = System.nanoTime();
            RedisCache.Result result = cache.get(id, primary::read);
            double totalMs = (System.nanoTime() - startedNs) / 1_000_000.0;
            if (result.record == null) {
                sendJson(exchange, 404, "{\"error\":\"No record for '" + jsonEscape(id) + "'.\"}");
                return;
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("record", result.record);
            response.put("hit", result.hit);
            response.put("redis_latency_ms", round2(result.redisLatencyMs));
            response.put("total_latency_ms", round2(totalMs));
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
                sendJson(exchange, 404, "{\"error\":\"Unknown product.\"}");
                return;
            }
            cache.invalidate(id);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("field", field);
            response.put("value", value);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class StampedeHandler implements HttpHandler {
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
            int concurrency;
            try {
                concurrency = Integer.parseInt(form.getOrDefault("concurrency", "20"));
            } catch (NumberFormatException e) {
                concurrency = 20;
            }
            concurrency = Math.max(2, Math.min(50, concurrency));

            cache.invalidate(id);
            long primaryBefore = primary.getReads();

            ExecutorService pool = Executors.newFixedThreadPool(concurrency);
            List<Future<RedisCache.Result>> futures = new ArrayList<>(concurrency);
            long startedNs = System.nanoTime();
            String requestId = id;
            for (int i = 0; i < concurrency; i++) {
                futures.add(pool.submit(() -> cache.get(requestId, primary::read)));
            }
            List<Map<String, Object>> results = new ArrayList<>(concurrency);
            for (Future<RedisCache.Result> future : futures) {
                try {
                    RedisCache.Result r = future.get();
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("hit", r.hit);
                    entry.put("redis_latency_ms", round2(r.redisLatencyMs));
                    entry.put("found", r.record != null);
                    results.add(entry);
                } catch (Exception e) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("hit", false);
                    entry.put("redis_latency_ms", 0.0);
                    entry.put("found", false);
                    results.add(entry);
                }
            }
            pool.shutdown();
            try {
                pool.awaitTermination(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            double elapsedMs = (System.nanoTime() - startedNs) / 1_000_000.0;
            long primaryDuring = primary.getReads() - primaryBefore;

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", id);
            response.put("concurrency", concurrency);
            response.put("primary_reads", primaryDuring);
            response.put("elapsed_ms", round2(elapsedMs));
            response.put("results", results);
            response.put("stats", buildStats());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            cache.resetStats();
            primary.resetReads();
            sendJson(exchange, 200, toJson(buildStats()));
        }
    }

    private static Map<String, Object> buildStats() {
        Map<String, Object> stats = cache.stats();
        stats.put("primary_reads_total", primary.getReads());
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
        if (body == null || body.isEmpty()) {
            return params;
        }
        for (String pair : body.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length != 2 || kv[0].isEmpty()) {
                continue;
            }
            params.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                    URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
        }
        return params;
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query == null || query.isEmpty()) {
            return params;
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

    private static String jsonStringList(List<String> values) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) sb.append(',');
            appendJsonString(sb, values.get(i));
        }
        return sb.append(']').toString();
    }

    private static String htmlEscape(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String renderHtmlPage(List<String> productIds, int primaryLatencyMs, int cacheTtl) {
        StringBuilder options = new StringBuilder();
        for (String id : productIds) {
            String safe = htmlEscape(id);
            options.append("<option value=\"").append(safe).append("\">").append(safe).append("</option>");
        }
        return HTML_TEMPLATE
                .replace("{{OPTIONS}}", options.toString())
                .replace("{{PRIMARY_LATENCY}}", Integer.toString(primaryLatencyMs))
                .replace("{{CACHE_TTL}}", Integer.toString(cacheTtl));
    }

    private static final String HTML_TEMPLATE =
            "<!DOCTYPE html>\n" +
            "<html lang=\"en\">\n" +
            "<head>\n" +
            "  <meta charset=\"utf-8\">\n" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
            "  <title>Redis Cache-Aside Demo</title>\n" +
            "  <style>\n" +
            "    :root { --bg:#f6f1e8;--panel:#fffaf2;--ink:#1f2933;--accent:#b8572f;--accent-dark:#8f421f;\n" +
            "      --muted:#5d6b75;--line:#e7d9c6;--ok:#d7f0de;--warn:#f7dfd7;--hit:#c9e7d2;--miss:#f5d6c6; }\n" +
            "    * { box-sizing:border-box; }\n" +
            "    body { margin:0;font-family:Georgia,\"Times New Roman\",serif;color:var(--ink);\n" +
            "      background:radial-gradient(circle at top left,#fff7ea,transparent 32rem),\n" +
            "        linear-gradient(180deg,#f3ecdf 0%,var(--bg) 100%);min-height:100vh; }\n" +
            "    main { max-width:980px;margin:0 auto;padding:48px 20px 72px; }\n" +
            "    h1 { font-size:clamp(2.2rem,5vw,4rem);line-height:1;margin-bottom:12px; }\n" +
            "    p.lede { max-width:52rem;font-size:1.1rem;color:var(--muted); }\n" +
            "    .grid { display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:28px; }\n" +
            "    .panel { background:rgba(255,250,242,0.92);border:1px solid var(--line);border-radius:18px;\n" +
            "      padding:22px;box-shadow:0 16px 50px rgba(105,74,45,0.08); }\n" +
            "    .panel h2 { margin-top:0;margin-bottom:10px; }\n" +
            "    .pill { display:inline-block;border-radius:999px;background:#efe2cf;color:var(--accent-dark);\n" +
            "      padding:6px 10px;font-size:0.9rem;margin-bottom:12px; }\n" +
            "    label { display:block;font-weight:bold;margin:12px 0 6px; }\n" +
            "    input,select { width:100%;padding:10px 12px;border-radius:10px;border:1px solid #cfbca6;font:inherit;background:white; }\n" +
            "    button { appearance:none;border:0;border-radius:999px;background:var(--accent);color:white;\n" +
            "      padding:11px 18px;font:inherit;cursor:pointer;margin-right:8px;margin-top:12px; }\n" +
            "    button.secondary { background:#38424a; }\n" +
            "    button:hover { background:var(--accent-dark); }\n" +
            "    button.secondary:hover { background:#20282e; }\n" +
            "    dl { display:grid;grid-template-columns:max-content 1fr;gap:8px 14px;margin:0; }\n" +
            "    dt { font-weight:bold; } dd { margin:0;word-break:break-word; }\n" +
            "    .badge { display:inline-block;border-radius:6px;padding:3px 8px;font-size:0.85rem;font-weight:bold; }\n" +
            "    .badge.hit { background:var(--hit);color:#1d4a2c; }\n" +
            "    .badge.miss { background:var(--miss);color:#6b3220; }\n" +
            "    #status { margin-top:20px;padding:14px 16px;border-radius:14px;display:none; }\n" +
            "    #status.ok { display:block;background:var(--ok); }\n" +
            "    #status.error { display:block;background:var(--warn); }\n" +
            "    @media (max-width:600px){ main{padding-top:28px;} button{width:100%;} }\n" +
            "  </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "  <main>\n" +
            "    <div class=\"pill\">Jedis + Java HttpServer demo</div>\n" +
            "    <h1>Redis Cache-Aside Demo</h1>\n" +
            "    <p class=\"lede\">\n" +
            "      Read product records through Redis. The first read of any key falls\n" +
            "      through to a deliberately slow primary store ({{PRIMARY_LATENCY}} ms per\n" +
            "      read); subsequent reads come from Redis until the {{CACHE_TTL}}-second TTL\n" +
            "      expires or the entry is invalidated. The stampede test fires concurrent\n" +
            "      reads at a cold key to show a single-flight Lua lock funnelling them\n" +
            "      down to one primary read.\n" +
            "    </p>\n" +
            "    <div class=\"grid\">\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Read a product</h2>\n" +
            "        <label for=\"product-id\">Product ID</label>\n" +
            "        <select id=\"product-id\">{{OPTIONS}}</select>\n" +
            "        <button id=\"read-button\">Read through cache</button>\n" +
            "        <button id=\"invalidate-button\" class=\"secondary\">Invalidate cache</button>\n" +
            "        <p>Read once to populate the cache, then again to see the hit. Wait\n" +
            "        for the TTL to pass or click <em>Invalidate</em> to force a miss.</p>\n" +
            "      </section>\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Update a field</h2>\n" +
            "        <p>Updating writes to the primary and deletes the cache entry, so the\n" +
            "        next read sees the new value.</p>\n" +
            "        <label for=\"update-field\">Field</label>\n" +
            "        <select id=\"update-field\">\n" +
            "          <option value=\"name\">name</option>\n" +
            "          <option value=\"price_cents\">price_cents</option>\n" +
            "          <option value=\"stock\">stock</option>\n" +
            "        </select>\n" +
            "        <label for=\"update-value\">New value</label>\n" +
            "        <input id=\"update-value\" value=\"999\">\n" +
            "        <button id=\"update-button\">Apply update</button>\n" +
            "      </section>\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Stampede test</h2>\n" +
            "        <p>Invalidates the selected key, then fires N concurrent reads. With\n" +
            "        single-flight enabled, only one of those reads should hit the primary.</p>\n" +
            "        <label for=\"stampede-concurrency\">Concurrent readers</label>\n" +
            "        <input id=\"stampede-concurrency\" type=\"number\" value=\"20\" min=\"2\" max=\"50\">\n" +
            "        <button id=\"stampede-button\">Run stampede test</button>\n" +
            "      </section>\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Cache stats</h2>\n" +
            "        <div id=\"stats-view\">Loading...</div>\n" +
            "        <button id=\"reset-button\" class=\"secondary\">Reset counters</button>\n" +
            "      </section>\n" +
            "      <section class=\"panel\" style=\"grid-column: 1 / -1;\">\n" +
            "        <h2>Last result</h2>\n" +
            "        <div id=\"result-view\"><p>Read a product to see the cached record and timing.</p></div>\n" +
            "      </section>\n" +
            "    </div>\n" +
            "    <div id=\"status\"></div>\n" +
            "  </main>\n" +
            "  <script>\n" +
            "    const productSelect = document.getElementById(\"product-id\");\n" +
            "    const updateField = document.getElementById(\"update-field\");\n" +
            "    const updateValue = document.getElementById(\"update-value\");\n" +
            "    const stampedeConcurrency = document.getElementById(\"stampede-concurrency\");\n" +
            "    const statsView = document.getElementById(\"stats-view\");\n" +
            "    const resultView = document.getElementById(\"result-view\");\n" +
            "    const statusBox = document.getElementById(\"status\");\n" +
            "    function setStatus(message, kind) { statusBox.textContent = message; statusBox.className = kind; }\n" +
            "    function escapeHtml(value) {\n" +
            "      return String(value).replace(/[&<>\"']/g, (c) =>\n" +
            "        ({ \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" }[c])); }\n" +
            "    function renderStats(stats) {\n" +
            "      if (!stats) { statsView.textContent = \"(no data)\"; return; }\n" +
            "      statsView.innerHTML = `<dl>\n" +
            "        <dt>Hits</dt><dd>${stats.hits}</dd>\n" +
            "        <dt>Misses</dt><dd>${stats.misses}</dd>\n" +
            "        <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>\n" +
            "        <dt>Stampedes suppressed</dt><dd>${stats.stampedes_suppressed}</dd>\n" +
            "        <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>\n" +
            "        <dt>Primary read latency</dt><dd>${stats.primary_read_latency_ms} ms</dd>\n" +
            "      </dl>`;\n" +
            "    }\n" +
            "    function renderRead(data) {\n" +
            "      if (!data || !data.record) { resultView.innerHTML = \"<p>(no record)</p>\"; return; }\n" +
            "      const r = data.record;\n" +
            "      const badge = data.hit ? '<span class=\"badge hit\">cache hit</span>' : '<span class=\"badge miss\">cache miss</span>';\n" +
            "      resultView.innerHTML = `<p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>\n" +
            "        &nbsp; Total: <strong>${data.total_latency_ms} ms</strong>\n" +
            "        &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>\n" +
            "        <dl>\n" +
            "          <dt>id</dt><dd>${escapeHtml(r.id ?? \"\")}</dd>\n" +
            "          <dt>name</dt><dd>${escapeHtml(r.name ?? \"\")}</dd>\n" +
            "          <dt>price_cents</dt><dd>${escapeHtml(r.price_cents ?? \"\")}</dd>\n" +
            "          <dt>stock</dt><dd>${escapeHtml(r.stock ?? \"\")}</dd>\n" +
            "        </dl>`;\n" +
            "    }\n" +
            "    function renderStampede(data) {\n" +
            "      const hits = data.results.filter((r) => r.hit).length;\n" +
            "      const misses = data.results.length - hits;\n" +
            "      resultView.innerHTML = `<p>Fired <strong>${data.concurrency}</strong> concurrent reads in\n" +
            "        <strong>${data.elapsed_ms}</strong> ms.</p>\n" +
            "        <p>Cache misses: <strong>${misses}</strong> &nbsp;\n" +
            "           Cache hits: <strong>${hits}</strong> &nbsp;\n" +
            "           Primary reads: <strong>${data.primary_reads}</strong></p>\n" +
            "        <p>With stampede protection, primary reads should be 1 even though all\n" +
            "           ${data.concurrency} callers raced for a cold key. Without it, every\n" +
            "           concurrent miss would query the primary independently.</p>`;\n" +
            "    }\n" +
            "    async function loadStats() { renderStats(await (await fetch(\"/stats\")).json()); }\n" +
            "    document.getElementById(\"read-button\").addEventListener(\"click\", async () => {\n" +
            "      const id = productSelect.value;\n" +
            "      const r = await fetch(`/read?id=${encodeURIComponent(id)}`);\n" +
            "      const d = await r.json();\n" +
            "      if (!r.ok) { setStatus(d.error || \"Read failed.\", \"error\"); return; }\n" +
            "      renderRead(d); renderStats(d.stats);\n" +
            "      setStatus(d.hit ? \"Served from Redis.\" : \"Loaded from primary and cached.\", \"ok\");\n" +
            "    });\n" +
            "    document.getElementById(\"invalidate-button\").addEventListener(\"click\", async () => {\n" +
            "      const id = productSelect.value;\n" +
            "      const r = await fetch(\"/invalidate\", { method: \"POST\", body: new URLSearchParams({ id }) });\n" +
            "      const d = await r.json();\n" +
            "      renderStats(d.stats);\n" +
            "      setStatus(d.deleted ? \"Cache key deleted.\" : \"No cache entry to delete.\", \"ok\");\n" +
            "    });\n" +
            "    document.getElementById(\"update-button\").addEventListener(\"click\", async () => {\n" +
            "      const id = productSelect.value;\n" +
            "      const r = await fetch(\"/update\", { method: \"POST\",\n" +
            "        body: new URLSearchParams({ id, field: updateField.value, value: updateValue.value }) });\n" +
            "      const d = await r.json();\n" +
            "      if (!r.ok) { setStatus(d.error || \"Update failed.\", \"error\"); return; }\n" +
            "      renderStats(d.stats); setStatus(\"Primary updated; cache invalidated.\", \"ok\");\n" +
            "    });\n" +
            "    document.getElementById(\"stampede-button\").addEventListener(\"click\", async () => {\n" +
            "      const id = productSelect.value;\n" +
            "      setStatus(\"Running stampede test...\", \"ok\");\n" +
            "      const r = await fetch(\"/stampede\", { method: \"POST\",\n" +
            "        body: new URLSearchParams({ id, concurrency: stampedeConcurrency.value }) });\n" +
            "      const d = await r.json();\n" +
            "      if (!r.ok) { setStatus(d.error || \"Test failed.\", \"error\"); return; }\n" +
            "      renderStampede(d); renderStats(d.stats);\n" +
            "      setStatus(`Stampede complete: ${d.primary_reads} primary read(s) for ${d.concurrency} concurrent callers.`, \"ok\");\n" +
            "    });\n" +
            "    document.getElementById(\"reset-button\").addEventListener(\"click\", async () => {\n" +
            "      const r = await fetch(\"/reset\", { method: \"POST\" });\n" +
            "      renderStats(await r.json()); setStatus(\"Counters reset.\", \"ok\");\n" +
            "    });\n" +
            "    loadStats();\n" +
            "  </script>\n" +
            "</body>\n" +
            "</html>\n";
}
