import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantLock;

import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;

/**
 * Redis recommendation-engine demo server (Lettuce + DJL +
 * {@code com.sun.net.httpserver}).
 *
 * <p>Run this file and visit {@code http://localhost:8084} to drive a
 * small product catalog indexed by Redis Search. The UI lets you embed
 * a natural-language query, optionally with TAG / NUMERIC / TEXT
 * filters, watch {@code FT.SEARCH} retrieve top-K candidates with a
 * KNN pre-filter in a single round trip, feed clicks back as a session
 * signal, and refresh an item's embedding live to demonstrate that the
 * HNSW index reflects the new vector on the next query with no
 * downtime.</p>
 *
 * <p>The server holds two Lettuce connections so the binary
 * {@code embedding} field doesn't get UTF-8-mangled by the default
 * {@link StringCodec}: a {@code <String, String>} connection for
 * structured field reads, {@code FT.*} index management, and
 * non-vector commands; and a {@code <String, byte[]>} connection
 * (built with {@link RedisCodec#of(RedisCodec, RedisCodec)}) for every
 * command that touches the {@code embedding} field, including
 * {@code FT.SEARCH} (the {@code $vec} parameter is raw bytes too).</p>
 */
public class DemoServer {

    private static final String DEMO_USER_ID = "demo";

    private static RedisClient redisClient;
    private static StatefulRedisConnection<String, String> connection;
    private static StatefulRedisConnection<String, byte[]> binConnection;
    private static Recommender recommender;
    private static LocalEmbedder embedder;
    private static DemoState state;
    private static int defaultTopK = 10;

    public static void main(String[] args) throws Exception {
        String host = "127.0.0.1";
        int port = 8084;
        String redisHost = "localhost";
        int redisPort = 6379;
        String indexName = Recommender.DEFAULT_INDEX_NAME;
        String keyPrefix = Recommender.DEFAULT_KEY_PREFIX;
        String catalogPath = "catalog.json";
        boolean resetOnStart = true;
        int topk = 10;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host": host = args[++i]; break;
                case "--port": port = Integer.parseInt(args[++i]); break;
                case "--redis-host": redisHost = args[++i]; break;
                case "--redis-port": redisPort = Integer.parseInt(args[++i]); break;
                case "--index-name": indexName = args[++i]; break;
                case "--key-prefix": keyPrefix = args[++i]; break;
                case "--catalog": catalogPath = args[++i]; break;
                case "--topk": topk = Integer.parseInt(args[++i]); break;
                case "--no-reset": resetOnStart = false; break;
                default: break;
            }
        }
        defaultTopK = topk;

        Path catalogFile = Paths.get(catalogPath);
        if (!Files.exists(catalogFile)) {
            System.err.println("Error: catalog file not found at " + catalogFile.toAbsolutePath());
            System.err.println("Generate it first with: mvn exec:java -Dexec.mainClass=BuildCatalog");
            System.exit(1);
        }

        try {
            redisClient = RedisClient.create(
                    RedisURI.builder().withHost(redisHost).withPort(redisPort).build());
            // Two connections share one client: one for normal commands,
            // one with a <String, byte[]> codec for binary HSET/HGET +
            // FT.SEARCH against the embedding field.
            connection = redisClient.connect();
            RedisCodec<String, byte[]> binCodec = RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE);
            binConnection = redisClient.connect(binCodec);
            connection.sync().ping();
        } catch (Exception exc) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n",
                    redisHost, redisPort, exc.getMessage());
            System.exit(1);
        }

        recommender = new Recommender(connection, binConnection, indexName, keyPrefix,
                Recommender.DEFAULT_USER_KEY_PREFIX, Recommender.VECTOR_DIM_DEFAULT);

        System.out.println("Loading embedding model (first run downloads ~80 MB)...");
        embedder = new LocalEmbedder();

        state = new DemoState(recommender, embedder, catalogFile, DEMO_USER_ID);

        if (resetOnStart) {
            System.out.printf("Dropping any existing index '%s' and re-seeding from %s.%n",
                    indexName, catalogFile);
            int seeded = state.seedIndex();
            state.resetUser();
            System.out.printf("Indexed %d products.%n", seeded);
        } else {
            recommender.createIndex();
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
        server.createContext("/", new RootHandler());
        server.createContext("/state", new StateHandler());
        server.createContext("/search", new SearchHandler());
        server.createContext("/click", new ClickHandler());
        server.createContext("/reset-user", new ResetUserHandler());
        server.createContext("/reset-index", new ResetIndexHandler());
        server.createContext("/refresh-embedding", new RefreshEmbeddingHandler());
        server.setExecutor(Executors.newFixedThreadPool(16));
        server.start();

        System.out.printf("Redis recommendation engine demo listening on http://%s:%d%n", host, port);
        System.out.printf("Using Redis at %s:%d with index '%s'%n", redisHost, redisPort, indexName);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try { server.stop(0); } catch (Exception ignored) {}
            try { embedder.close(); } catch (Exception ignored) {}
            try { if (binConnection != null) binConnection.close(); } catch (Exception ignored) {}
            try { if (connection != null) connection.close(); } catch (Exception ignored) {}
            try { if (redisClient != null) redisClient.shutdown(); } catch (Exception ignored) {}
        }));
    }

    // ------------------------------------------------------------------
    // Demo state: per-process state that isn't in Redis.
    // ------------------------------------------------------------------

    /**
     * In-memory state the demo holds beyond Redis: the recent-clicks
     * ring buffer used in the session-signal panel. Lock-guarded
     * because the JDK HttpServer runs each handler on a worker thread.
     */
    static class DemoState {
        private final Recommender recommender;
        private final LocalEmbedder embedder;
        private final Path catalogPath;
        private final String userId;
        private final Deque<Map<String, String>> recent = new ArrayDeque<>();
        private final ReentrantLock lock = new ReentrantLock();
        private volatile String cachedModel;

        DemoState(Recommender recommender, LocalEmbedder embedder, Path catalogPath, String userId) {
            this.recommender = recommender;
            this.embedder = embedder;
            this.catalogPath = catalogPath;
            this.userId = userId;
        }

        int seedIndex() throws IOException {
            Catalog.Loaded loaded = Catalog.load(catalogPath);
            cachedModel = loaded.model;
            recommender.dropIndex(true);
            recommender.createIndex();
            return recommender.indexProducts(loaded.products);
        }

        void resetUser() {
            recommender.resetUser(userId);
            lock.lock();
            try { recent.clear(); }
            finally { lock.unlock(); }
        }

        String modelName() {
            if (cachedModel != null) return cachedModel;
            try {
                cachedModel = Catalog.load(catalogPath).model;
                return cachedModel;
            } catch (IOException exc) {
                return embedder.getModelName();
            }
        }

        void rememberClick(String productId) {
            // Pull the product name to show in the recent-clicks list.
            String name;
            try {
                String fetched = connection.sync().hget(recommender.productKey(productId), "name");
                name = fetched == null ? productId : fetched;
            } catch (Exception exc) {
                name = productId;
            }
            lock.lock();
            try {
                Map<String, String> entry = new LinkedHashMap<>();
                entry.put("id", productId);
                entry.put("name", name);
                recent.addFirst(entry);
                while (recent.size() > 6) recent.removeLast();
            } finally {
                lock.unlock();
            }
        }

        Map<String, Object> userView() {
            Recommender.UserFeatures uf = recommender.getUserFeatures(userId);
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("clicks", uf.clicks);
            view.put("last_clicked_id", uf.lastClickedId == null ? "" : uf.lastClickedId);
            view.put("last_clicked_category", uf.lastClickedCategory == null ? "" : uf.lastClickedCategory);
            view.put("affinities", uf.affinities);
            view.put("has_session_vec", uf.sessionVec != null);
            view.put("session_vec_dim", uf.sessionVec == null ? 0 : uf.sessionVec.length);
            List<Map<String, String>> recents;
            lock.lock();
            try {
                recents = new ArrayList<>(recent);
            } finally {
                lock.unlock();
            }
            view.put("recent_clicks", recents);
            return view;
        }
    }

    // ------------------------------------------------------------------
    // HTTP handlers
    // ------------------------------------------------------------------

    static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            if (path.equals("/") || path.equals("/index.html")) {
                String body = renderHtml();
                byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
                return;
            }
            sendJson(exchange, 404, "{\"error\":\"Not Found\"}");
        }
    }

    static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            sendJson(exchange, 200, toJson(buildStatePayload()));
        }
    }

    static class SearchHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String queryText = form.getOrDefault("query", "").trim();
            if (queryText.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"query is required\"}");
                return;
            }

            // Embed the query string. This is the only place in the
            // demo where the live model gets called on the request
            // path; in production this often sits behind the API
            // gateway and the embedding is reused across the rest of
            // the pipeline.
            long t0 = System.nanoTime();
            float[] queryVec = embedder.encodeOne(queryText);
            double embedMs = (System.nanoTime() - t0) / 1_000_000.0;

            boolean useSession = !form.getOrDefault("use_session", "").isEmpty();
            boolean doRerank = !form.getOrDefault("rerank", "").isEmpty();
            Recommender.UserFeatures features = recommender.getUserFeatures(DEMO_USER_ID);
            float[] sessionVec = useSession ? features.sessionVec : null;

            int k = parseIntOr(form.get("k"), defaultTopK);
            if (k < 1) k = 1;
            if (k > 40) k = 40;

            Recommender.RetrieveOptions opts = new Recommender.RetrieveOptions();
            opts.category = form.getOrDefault("category", "").trim();
            if (opts.category.isEmpty()) opts.category = null;
            opts.brand = form.getOrDefault("brand", "").trim();
            if (opts.brand.isEmpty()) opts.brand = null;
            opts.minPrice = parseDoubleOrNull(form.get("min_price"));
            opts.maxPrice = parseDoubleOrNull(form.get("max_price"));
            opts.minRating = parseDoubleOrNull(form.get("min_rating"));
            opts.inStockOnly = !form.getOrDefault("in_stock_only", "").isEmpty();
            String textMatch = form.getOrDefault("text_match", "").trim();
            opts.textMatch = textMatch.isEmpty() ? null : textMatch;
            opts.textField = "description";
            opts.k = k;
            opts.sessionVec = sessionVec;
            opts.sessionWeight = 0.3;

            // Echo the actual filter clause back so the docs page
            // doesn't have to guess what the server built.
            String filterClause = Recommender.buildFilterClause(
                    opts.category, opts.brand, opts.minPrice, opts.maxPrice,
                    opts.inStockOnly, opts.minRating, opts.textMatch, opts.textField);

            long t1 = System.nanoTime();
            List<Recommender.Candidate> candidates = recommender.candidateRetrieve(queryVec, opts);
            double searchMs = (System.nanoTime() - t1) / 1_000_000.0;

            long t2 = System.nanoTime();
            if (doRerank) {
                candidates = recommender.rerank(candidates, features, 0.0);
            }
            double rerankMs = (System.nanoTime() - t2) / 1_000_000.0;

            List<Map<String, Object>> rows = new ArrayList<>(candidates.size());
            for (Recommender.Candidate c : candidates) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", c.id);
                row.put("name", c.name);
                row.put("description", c.description);
                row.put("category", c.category);
                row.put("brand", c.brand);
                row.put("price", c.price);
                row.put("rating", c.rating);
                row.put("in_stock", c.inStock);
                row.put("vector_distance", round4(c.vectorDistance));
                row.put("score", round4(c.score));
                rows.add(row);
            }
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("candidates", rows);
            payload.put("filter_clause", filterClause);
            payload.put("used_session", sessionVec != null);
            payload.put("used_rerank", doRerank && !features.affinities.isEmpty());
            payload.put("embed_ms", embedMs);
            payload.put("search_ms", searchMs);
            payload.put("rerank_ms", rerankMs);
            payload.put("timing_ms", embedMs + searchMs + rerankMs);
            sendJson(exchange, 200, toJson(payload));
        }
    }

    static class ClickHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String productId = form.getOrDefault("product_id", "").trim();
            if (productId.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"product_id is required\"}");
                return;
            }
            Recommender.RecordClickResult result;
            try {
                result = recommender.recordClick(DEMO_USER_ID, productId, 0.4, 1.0);
            } catch (Recommender.UnknownProductException exc) {
                sendJson(exchange, 404, "{\"error\":\"unknown product " + jsonEscape(productId) + "\"}");
                return;
            }
            state.rememberClick(productId);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("category", result.category);
            response.put("affinity", result.affinity);
            response.put("clicks", result.clicks);
            response.put("last_clicked_id", result.lastClickedId);
            response.put("user", state.userView());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ResetUserHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            state.resetUser();
            sendJson(exchange, 200, "{\"ok\":true}");
        }
    }

    static class ResetIndexHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            try {
                int n = state.seedIndex();
                state.resetUser();
                sendJson(exchange, 200, "{\"seeded\":" + n + "}");
            } catch (IOException exc) {
                sendJson(exchange, 500, "{\"error\":\"" + jsonEscape(exc.getMessage()) + "\"}");
            }
        }
    }

    static class RefreshEmbeddingHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String productId = form.getOrDefault("product_id", "").trim();
            String text = form.getOrDefault("text", "").trim();
            if (productId.isEmpty() || text.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"product_id and text are required\"}");
                return;
            }
            long t0 = System.nanoTime();
            float[] vec = embedder.encodeOne(text);
            double embedMs = (System.nanoTime() - t0) / 1_000_000.0;
            try {
                recommender.refreshEmbedding(productId, vec);
            } catch (Recommender.UnknownProductException exc) {
                sendJson(exchange, 404, "{\"error\":\"unknown product " + jsonEscape(productId) + "\"}");
                return;
            } catch (IllegalArgumentException exc) {
                sendJson(exchange, 400, "{\"error\":\"" + jsonEscape(exc.getMessage()) + "\"}");
                return;
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("product_id", productId);
            response.put("embed_ms", embedMs);
            sendJson(exchange, 200, toJson(response));
        }
    }

    // ------------------------------------------------------------------
    // State assembly
    // ------------------------------------------------------------------

    private static Map<String, Object> buildStatePayload() {
        Recommender.IndexStats info = recommender.indexInfo();
        List<Recommender.ProductSummary> products = recommender.listProducts(200);

        Map<String, Object> index = new LinkedHashMap<>();
        index.put("index_name", info.indexName);
        index.put("num_docs", info.numDocs);
        index.put("indexing_failures", info.indexingFailures);
        index.put("vector_index_size_mb", info.vectorIndexSizeMb);
        index.put("model", state.modelName());

        List<Map<String, Object>> productRows = new ArrayList<>(products.size());
        for (Recommender.ProductSummary p : products) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", p.id);
            row.put("name", p.name);
            row.put("category", p.category);
            row.put("brand", p.brand);
            row.put("price", p.price);
            row.put("rating", p.rating);
            row.put("in_stock", p.inStock);
            productRows.add(row);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("user", state.userView());
        payload.put("index", index);
        payload.put("products", productRows);
        payload.put("categories", recommender.listCategories());
        payload.put("brands", recommender.listBrands());
        return payload;
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private static Double parseDoubleOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        try {
            return Double.parseDouble(trimmed);
        } catch (NumberFormatException exc) {
            return null;
        }
    }

    private static int parseIntOr(String value, int dflt) {
        if (value == null || value.isEmpty()) return dflt;
        try { return Integer.parseInt(value); }
        catch (NumberFormatException exc) { return dflt; }
    }

    private static double round4(double v) {
        return Math.round(v * 1e4) / 1e4;
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream in = exchange.getRequestBody()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseFormData(String body) {
        Map<String, String> params = new HashMap<>();
        if (body == null || body.isEmpty()) return params;
        for (String pair : body.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 0 || kv[0].isEmpty()) continue;
            String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length == 2 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            params.put(key, value);
        }
        return params;
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
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
            // Avoid scientific notation for double-valued integers.
            if (value instanceof Float || value instanceof Double) {
                double d = ((Number) value).doubleValue();
                if (Double.isNaN(d) || Double.isInfinite(d)) {
                    sb.append("null");
                } else {
                    sb.append(d);
                }
            } else {
                sb.append(value);
            }
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
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        return sb.toString();
    }

    private static String renderHtml() {
        return HTML_TEMPLATE
                .replace("__INDEX_NAME__", recommender.getIndexName())
                .replace("__USER_KEY__", recommender.userKey(DEMO_USER_ID))
                .replace("__TOPK__", Integer.toString(defaultTopK));
    }

    // The HTML / CSS / JS are copied verbatim from the Python demo
    // server's HTML_TEMPLATE so the four ports share identical UI.
    // Only the "pill" string at the top has been swapped to reflect
    // the Java + Lettuce stack.
    private static final String HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Recommendation Engine Demo</title>
  <style>
    :root {
      --bg: #eef3f1;
      --panel: #ffffff;
      --ink: #1d2730;
      --accent: #267d6b;
      --accent-dark: #1a594c;
      --muted: #5c6770;
      --line: #d4dfdb;
      --ok: #d2ecdf;
      --warn: #f8e0d0;
      --pill: #d9ebe6;
      --card: #fbfdfc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #f3faf7, transparent 32rem),
        linear-gradient(180deg, #ecf2f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 60rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid; gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 24px;
    }
    .panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill {
      display: inline-block; border-radius: 999px;
      background: var(--pill); color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px;
    }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    input[type=checkbox] { width: auto; }
    .check-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .check-row label { margin: 0; font-weight: normal; }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small {
      padding: 5px 10px; font-size: 0.85rem; margin-top: 4px;
      border-radius: 7px;
    }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr;
         gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px;
             border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.score { background: var(--ok); color: #1d4a2c; }
    .badge.boost { background: #e6e0f0; color: #43326a; }
    .badge.stockout { background: var(--warn); color: #6b3220; }
    .cards {
      display: grid; gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      margin-top: 8px;
    }
    .card {
      background: var(--card); border: 1px solid var(--line);
      border-radius: 12px; padding: 12px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .card .name { font-weight: bold; }
    .card .meta { font-size: 0.85rem; color: var(--muted); }
    .card .price { font-weight: bold; }
    .scores { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .scores .badge { font-size: 0.75rem; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    details summary {
      cursor: pointer; font-weight: bold; margin-top: 8px;
      color: var(--accent-dark);
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">Lettuce + DJL + com.sun.net.httpserver</div>
    <h1>Redis Recommendation Engine Demo</h1>
    <p class="lede">
      A small product catalogue is indexed by Redis Search at
      <code>__INDEX_NAME__</code>: each item is a Hash holding its
      metadata plus a 384-dimensional embedding. One <code>FT.SEARCH</code>
      with a <code>KNN</code> clause does similarity retrieval and
      structured pre-filtering in the same call. Click a product card
      to feed a click into the session &mdash; Redis updates the user-features
      hash atomically, and the very next query picks it up.
    </p>

    <div class="grid">

      <section class="panel wide">
        <h2>Search</h2>
        <p>The query text is embedded with the same model used to build
        the catalogue, then handed to <code>FT.SEARCH</code> as the
        <code>$vec</code> parameter inside a
        <code>KNN __TOPK__ @embedding</code> clause. Filters become
        TAG / NUMERIC predicates in front of the KNN, applied in one
        round trip.</p>
        <div class="row">
          <div style="flex: 2 1 360px;">
            <label for="q-text">Query</label>
            <input id="q-text" type="text"
                   value="warm waterproof jacket for hiking"
                   placeholder="describe what you want">
          </div>
          <div>
            <label for="q-category">Category</label>
            <select id="q-category"><option value="">(any)</option></select>
          </div>
          <div>
            <label for="q-brand">Brand</label>
            <select id="q-brand"><option value="">(any)</option></select>
          </div>
        </div>
        <div class="row">
          <div>
            <label for="q-min-price">Min price</label>
            <input id="q-min-price" type="number" min="0" step="1">
          </div>
          <div>
            <label for="q-max-price">Max price</label>
            <input id="q-max-price" type="number" min="0" step="1">
          </div>
          <div>
            <label for="q-min-rating">Min rating</label>
            <input id="q-min-rating" type="number" min="0" max="5" step="0.1">
          </div>
          <div>
            <label for="q-k">Top K</label>
            <input id="q-k" type="number" min="1" max="40" value="__TOPK__">
          </div>
        </div>
        <div class="row">
          <div style="flex: 2 1 280px;">
            <label for="q-description-contains">
              Description contains
              <span class="meta">(TEXT pre-filter on the description field)</span>
            </label>
            <input id="q-description-contains" type="text"
                   placeholder='e.g. "waterproof", "fleece"'>
          </div>
        </div>
        <div class="row">
          <div class="check-row">
            <input id="q-in-stock" type="checkbox" checked>
            <label for="q-in-stock">In stock only</label>
          </div>
          <div class="check-row">
            <input id="q-use-session" type="checkbox" checked>
            <label for="q-use-session">Blend session vector into query</label>
          </div>
          <div class="check-row">
            <input id="q-rerank" type="checkbox" checked>
            <label for="q-rerank">Re-rank with category affinities</label>
          </div>
        </div>
        <button id="search-button">Search</button>
        <div id="search-meta" class="meta" style="margin-top: 10px;"></div>
        <div id="search-results"></div>
      </section>

      <section class="panel">
        <h2>Session signal</h2>
        <p>Each click updates the user features hash (<code>__USER_KEY__</code>):
        a new session vector blended via EWMA over the clicked item
        vectors, plus an atomic <code>HINCRBYFLOAT</code> on the
        per-category affinity counter. The next request reads the
        updated hash and passes the session vector to
        <code>FT.SEARCH</code> as the <code>$vec</code> parameter &mdash; no
        batch cycle.</p>
        <dl id="user-features"></dl>
        <h3>Affinities</h3>
        <div id="user-affinities"></div>
        <h3>Recent clicks</h3>
        <ul id="recent-clicks"></ul>
        <button id="reset-user-button" class="secondary">Reset session</button>
      </section>

      <section class="panel">
        <h2>Refresh an item embedding</h2>
        <p>Re-embed a single product with a new piece of text and
        <code>HSET</code> the bytes back. The HNSW index reflects the
        change on the very next query &mdash; production embedding rollouts
        use the same path.</p>
        <label for="refresh-product">Product</label>
        <select id="refresh-product"></select>
        <label for="refresh-text">New text to embed</label>
        <input id="refresh-text"
               value="luxurious heavy parka with hood for arctic expedition">
        <button id="refresh-button">Refresh embedding</button>
        <p class="meta" id="refresh-meta" style="margin-top: 6px;"></p>
      </section>

      <section class="panel wide">
        <h2>Catalogue</h2>
        <p>Every item in the index, sorted by price. Click a card to
        record a session click.</p>
        <div class="cards" id="catalog-cards"></div>
      </section>

      <section class="panel wide">
        <h2>Index state</h2>
        <div id="index-state"></div>
        <button id="reset-index-button" class="danger">Reset everything (re-index from catalog.json)</button>
      </section>

    </div>

    <div id="status"></div>
  </main>

  <script>
    const $ = sel => document.querySelector(sel);
    const status = $('#status');

    function showStatus(text, kind) {
      status.textContent = text;
      status.className = kind || 'ok';
      setTimeout(() => { status.className = ''; status.textContent = ''; }, 4000);
    }

    async function postForm(path, params) {
      const body = new URLSearchParams(params || {}).toString();
      const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    }

    async function getJson(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    }

    function renderUser(features) {
      const dl = $('#user-features');
      dl.innerHTML = `
        <dt>Clicks</dt><dd>${features.clicks}</dd>
        <dt>Last clicked</dt>
        <dd>${features.last_clicked_id ? features.last_clicked_id + ' (' + features.last_clicked_category + ')' : '—'}</dd>
        <dt>Session vector</dt>
        <dd>${features.has_session_vec ? '✓ stored, ' + features.session_vec_dim + ' floats' : '—'}</dd>
      `;
      const aff = $('#user-affinities');
      const entries = Object.entries(features.affinities || {});
      if (!entries.length) {
        aff.textContent = '(none yet)';
      } else {
        entries.sort((a, b) => b[1] - a[1]);
        aff.innerHTML = entries.map(([cat, w]) =>
          `<span class="badge score">${cat} +${w.toFixed(2)}</span>`
        ).join(' ');
      }
      const ul = $('#recent-clicks');
      ul.innerHTML = (features.recent_clicks || []).map(rc =>
        `<li><code>${rc.id}</code> ${rc.name}</li>`
      ).join('') || '<li>(none)</li>';
    }

    function renderIndex(info) {
      $('#index-state').innerHTML = `
        <dl>
          <dt>Indexed documents</dt><dd>${info.num_docs}</dd>
          <dt>Index name</dt><dd><code>${info.index_name}</code></dd>
          <dt>Indexing failures</dt><dd>${info.indexing_failures}</dd>
          <dt>Vector index size</dt><dd>${info.vector_index_size_mb} MB</dd>
          <dt>Embedding model</dt><dd><code>${info.model}</code></dd>
        </dl>
      `;
    }

    function renderResult(c) {
      const stockBadge = c.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      const boost = c.vector_distance - c.score;
      const boostBadge = boost > 0.005
        ? ` <span class="badge boost">−${boost.toFixed(3)} affinity</span>`
        : '';
      return `
        <tr>
          <td><code>${c.id}</code></td>
          <td>
            <strong>${c.name}</strong> ${stockBadge}<br>
            <span class="meta">${c.brand} · ${c.category} · $${c.price.toFixed(2)} · ★ ${c.rating.toFixed(1)}</span>
          </td>
          <td>
            <span class="badge score">${c.score.toFixed(3)}</span>${boostBadge}
          </td>
          <td><button class="small" data-click-id="${c.id}">Click</button></td>
        </tr>
      `;
    }

    function renderSearch(payload) {
      const meta = $('#search-meta');
      meta.innerHTML = `
        Returned ${payload.candidates.length} candidate(s) in
        <code>${payload.timing_ms.toFixed(2)} ms</code>
        (embed: <code>${payload.embed_ms.toFixed(2)} ms</code>,
        search: <code>${payload.search_ms.toFixed(2)} ms</code>,
        rerank: <code>${payload.rerank_ms.toFixed(2)} ms</code>).
        Filter: <code>${payload.filter_clause}</code>.
        Session blended: ${payload.used_session ? 'yes' : 'no'};
        re-ranked: ${payload.used_rerank ? 'yes' : 'no'}.
      `;
      const rows = payload.candidates.map(renderResult).join('');
      $('#search-results').innerHTML = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Score <span class="meta">(cosine distance, lower = closer)</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function productCard(p) {
      const stockBadge = p.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      return `
        <div class="card">
          <span class="name">${p.name} ${stockBadge}</span>
          <span class="meta">${p.brand} · ${p.category}</span>
          <span class="meta">★ ${p.rating.toFixed(1)}</span>
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="small" data-click-id="${p.id}">Click</button>
        </div>
      `;
    }

    function renderCatalog(products) {
      $('#catalog-cards').innerHTML = products.map(productCard).join('');
      const refresh = $('#refresh-product');
      refresh.innerHTML = products.map(p =>
        `<option value="${p.id}">${p.id} — ${p.name}</option>`
      ).join('');
    }

    function populateSelect(id, values) {
      const sel = document.querySelector(id);
      const current = sel.value;
      sel.innerHTML = '<option value="">(any)</option>'
        + values.map(v => `<option value="${v}">${v}</option>`).join('');
      sel.value = current;
    }

    async function refreshState() {
      const state = await getJson('/state');
      renderUser(state.user);
      renderIndex(state.index);
      renderCatalog(state.products);
      populateSelect('#q-category', state.categories);
      populateSelect('#q-brand', state.brands);
    }

    async function search() {
      const params = {
        query: $('#q-text').value,
        category: $('#q-category').value,
        brand: $('#q-brand').value,
        min_price: $('#q-min-price').value,
        max_price: $('#q-max-price').value,
        min_rating: $('#q-min-rating').value,
        text_match: $('#q-description-contains').value,
        k: $('#q-k').value,
        in_stock_only: $('#q-in-stock').checked ? '1' : '',
        use_session: $('#q-use-session').checked ? '1' : '',
        rerank: $('#q-rerank').checked ? '1' : '',
      };
      try {
        const payload = await postForm('/search', params);
        renderSearch(payload);
      } catch (exc) {
        showStatus('Search failed: ' + exc.message, 'error');
      }
    }

    async function recordClick(productId) {
      try {
        const payload = await postForm('/click', {product_id: productId});
        showStatus(`Click recorded: ${productId} (${payload.category})`, 'ok');
        renderUser(payload.user);
      } catch (exc) {
        showStatus('Click failed: ' + exc.message, 'error');
      }
    }

    document.body.addEventListener('click', e => {
      const id = e.target?.dataset?.clickId;
      if (id) recordClick(id);
    });

    $('#search-button').onclick = search;
    $('#reset-user-button').onclick = async () => {
      await postForm('/reset-user', {});
      await refreshState();
      $('#search-results').innerHTML = '';
      $('#search-meta').textContent = '';
      showStatus('Session cleared', 'ok');
    };
    $('#reset-index-button').onclick = async () => {
      await postForm('/reset-index', {});
      await refreshState();
      showStatus('Re-indexed catalogue from catalog.json', 'ok');
    };
    $('#refresh-button').onclick = async () => {
      const productId = $('#refresh-product').value;
      const text = $('#refresh-text').value;
      try {
        const payload = await postForm('/refresh-embedding',
          {product_id: productId, text});
        $('#refresh-meta').innerHTML =
          `Refreshed <code>${payload.product_id}</code>. ` +
          `Embedding wrote in <code>${payload.embed_ms.toFixed(2)} ms</code>; ` +
          `next FT.SEARCH will see the new vector.`;
        showStatus(`Re-embedded ${payload.product_id}`, 'ok');
      } catch (exc) {
        showStatus('Refresh failed: ' + exc.message, 'error');
      }
    };

    refreshState();
  </script>
</body>
</html>
""";
}
