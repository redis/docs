package com.redis.semcache;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.json.JSONArray;
import org.json.JSONObject;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisPooled;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Redis semantic-cache demo server (Java + Jedis).
 *
 * <p>Run this main and visit {@code http://localhost:8089} to drive
 * a small semantic-cache demo backed by Redis Search. The UI lets
 * you type a natural-language prompt and watch the cache decide hit
 * or miss; on a hit Redis returns the cached response in tens of
 * milliseconds and the demo LLM is not called at all, while on a
 * miss the demo LLM &quot;thinks&quot; for ~1.5 s before answering
 * and the new prompt, response, and embedding are written back to
 * Redis for next time.
 *
 * <p>The server holds a single {@link LocalEmbedder}, a single
 * {@link RedisSemanticCache}, and a single {@link MockLLM} for the
 * lifetime of the process. The first run downloads the embedding
 * model into the local DJL cache; everything after is local.
 */
public final class DemoServer {

    static final class Args {
        String host = "127.0.0.1";
        int port = 8089;
        String redisHost = "localhost";
        int redisPort = 6379;
        String indexName = "semcache:idx";
        String keyPrefix = "cache:";
        long ttlSeconds = 3600;
        double threshold = 0.5;
        double llmLatencyMs = 1500.0;
        boolean resetOnStart = true;
    }

    public static void main(String[] argv) throws Exception {
        Args args = parseArgs(argv);

        ConnectionPoolConfig poolConfig = new ConnectionPoolConfig();
        poolConfig.setMaxTotal(16);
        poolConfig.setMaxIdle(4);
        poolConfig.setMinIdle(1);
        JedisPooled jedis = new JedisPooled(
                poolConfig,
                new HostAndPort(args.redisHost, args.redisPort),
                redis.clients.jedis.DefaultJedisClientConfig.builder()
                        .socketTimeoutMillis(2000)
                        .connectionTimeoutMillis(2000)
                        .build());
        try {
            jedis.ping();
        } catch (Exception ex) {
            System.err.println("Error: cannot reach Redis at "
                    + args.redisHost + ":" + args.redisPort);
            System.err.println("  (" + ex.getMessage() + ")");
            jedis.close();
            System.exit(1);
        }

        RedisSemanticCache cache = new RedisSemanticCache(
                jedis,
                args.indexName,
                args.keyPrefix,
                LocalEmbedder.defaultVectorDim(),
                args.threshold,
                args.ttlSeconds
        );
        cache.createIndex();

        System.out.println("Loading embedding model "
                + "(first run downloads the PyTorch weights)...");
        LocalEmbedder embedder = LocalEmbedder.create();
        MockLLM llm = new MockLLM("gpt-4.5-2026", args.llmLatencyMs);

        SemanticCacheDemo demo = new SemanticCacheDemo(cache, embedder, llm);

        if (args.resetOnStart) {
            System.out.println(
                    "Dropping any existing cache under '" + args.keyPrefix
                            + "*' and re-seeding from the FAQ list "
                            + "(pass --no-reset to keep).");
            int seeded = demo.seed();
            System.out.println("Seeded " + seeded + " entries.");
        }

        // Load the HTML once and substitute the template tokens so the
        // docs panel shows the actual values in use rather than the
        // default copies.
        String rawHtml = loadIndexHtml();
        String htmlPage = rawHtml
                .replace("__INDEX_NAME__", args.indexName)
                .replace("__KEY_PREFIX__", args.keyPrefix);

        HttpServer server = HttpServer.create(
                new InetSocketAddress(args.host, args.port), 0);
        server.setExecutor(Executors.newCachedThreadPool());
        server.createContext("/", new RootHandler(cache, embedder, llm, demo, htmlPage));

        System.out.println("Redis semantic cache demo listening on "
                + "http://" + args.host + ":" + args.port);
        System.out.println("Using Redis at " + args.redisHost + ":" + args.redisPort
                + " with index '" + args.indexName + "'");

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nShutting down...");
            server.stop(0);
            try { embedder.close(); } catch (Exception ignored) {}
            jedis.close();
        }));

        server.start();
    }

    // ------------------------------------------------------------------
    // Demo orchestrator
    // ------------------------------------------------------------------

    static final class SemanticCacheDemo {
        private final RedisSemanticCache cache;
        private final LocalEmbedder embedder;
        private final MockLLM llm;
        private final String defaultTenant = "acme";
        private final String defaultLocale = "en";

        SemanticCacheDemo(RedisSemanticCache cache, LocalEmbedder embedder, MockLLM llm) {
            this.cache = cache;
            this.embedder = embedder;
            this.llm = llm;
        }

        /** Drop everything in scope and pre-populate with FAQ entries. */
        synchronized int seed() throws Exception {
            cache.clear();
            return SeedCache.seed(cache, embedder,
                    defaultTenant, defaultLocale, llm.modelVersion());
        }

        /**
         * The hot path: embed, look up, optionally call the LLM, write back.
         *
         * <p>Timings are taken with {@code System.nanoTime()} around
         * each bounded step so the UI can display the embed / lookup
         * / LLM breakdown separately. The cache write on a miss is
         * <em>not</em> included in {@code total_ms} so the latency
         * number reflects the user-facing wait, not the background
         * bookkeeping.
         */
        Map<String, Object> runQuery(
                String prompt,
                String tenant,
                String locale,
                String modelVersion,
                double threshold,
                boolean lookupOnly) throws Exception {

            long t0 = System.nanoTime();
            float[] queryVec = embedder.encodeOne(prompt);
            double embedMs = (System.nanoTime() - t0) / 1_000_000.0;

            long t1 = System.nanoTime();
            LookupResult result = cache.lookup(
                    queryVec, tenant, locale, modelVersion, "ok", threshold);
            double lookupMs = (System.nanoTime() - t1) / 1_000_000.0;

            Map<String, Object> payload = new LinkedHashMap<>();

            if (result instanceof CacheHit hit) {
                payload.put("outcome", "hit");
                payload.put("response", hit.response());
                payload.put("entry_id", hit.id());
                payload.put("distance", hit.distance());
                payload.put("ttl_seconds", hit.ttlSeconds());
                payload.put("hit_count", hit.hitCount());
                payload.put("threshold", threshold);
                payload.put("embed_ms", embedMs);
                payload.put("lookup_ms", lookupMs);
                payload.put("llm_ms", null);
                payload.put("total_ms", embedMs + lookupMs);
                payload.put("tokens_avoided",
                        estimateResponseTokens(hit.prompt(), hit.response()));
                payload.put("ms_avoided", llm.latencyMs());
                return payload;
            }

            // Miss path. In "lookup only" mode the demo reports the
            // miss without actually calling the LLM — useful for
            // sweeping the threshold against a fixed prompt to see
            // where the cutoff would fall without polluting the cache.
            CacheMiss miss = (CacheMiss) result;
            if (lookupOnly) {
                payload.put("outcome", "miss");
                payload.put("response", "(LLM not called in lookup-only mode)");
                payload.put("nearest_distance", miss.nearestDistance());
                payload.put("threshold", threshold);
                payload.put("wrote_entry_id", null);
                payload.put("embed_ms", embedMs);
                payload.put("lookup_ms", lookupMs);
                payload.put("llm_ms", null);
                payload.put("total_ms", embedMs + lookupMs);
                return payload;
            }

            long t2 = System.nanoTime();
            MockLLM.Response llmResponse = llm.complete(prompt);
            double llmMs = (System.nanoTime() - t2) / 1_000_000.0;

            // Write the new entry back. The embedding is the same
            // vector we already used for the lookup — no need to
            // re-encode.
            String entryId = cache.put(
                    prompt,
                    llmResponse.response(),
                    queryVec,
                    tenant,
                    locale,
                    modelVersion,
                    "ok",
                    null,
                    null
            );

            payload.put("outcome", "miss");
            payload.put("response", llmResponse.response());
            payload.put("nearest_distance", miss.nearestDistance());
            payload.put("threshold", threshold);
            payload.put("wrote_entry_id", entryId);
            payload.put("embed_ms", embedMs);
            payload.put("lookup_ms", lookupMs);
            payload.put("llm_ms", llmMs);
            payload.put("total_ms", embedMs + lookupMs + llmMs);
            return payload;
        }

        private static int estimateResponseTokens(String prompt, String response) {
            int len = (prompt == null ? 0 : prompt.length())
                    + (response == null ? 0 : response.length());
            return Math.max(1, len / 4);
        }
    }

    // ------------------------------------------------------------------
    // HTTP plumbing
    // ------------------------------------------------------------------

    static final class RootHandler implements HttpHandler {
        private final RedisSemanticCache cache;
        private final LocalEmbedder embedder;
        private final MockLLM llm;
        private final SemanticCacheDemo demo;
        private final String htmlPage;

        RootHandler(RedisSemanticCache cache, LocalEmbedder embedder,
                    MockLLM llm, SemanticCacheDemo demo, String htmlPage) {
            this.cache = cache;
            this.embedder = embedder;
            this.llm = llm;
            this.demo = demo;
            this.htmlPage = htmlPage;
        }

        @Override
        public void handle(HttpExchange ex) throws IOException {
            try {
                String method = ex.getRequestMethod();
                URI uri = ex.getRequestURI();
                String path = uri.getPath();

                if ("GET".equalsIgnoreCase(method)) {
                    if (path.equals("/") || path.equals("/index.html")) {
                        sendHtml(ex, 200, htmlPage);
                        return;
                    }
                    if (path.equals("/state")) {
                        sendJson(ex, 200, buildState());
                        return;
                    }
                    sendJson(ex, 404, errorPayload("not found", null));
                    return;
                }
                if ("POST".equalsIgnoreCase(method)) {
                    String body = readBody(ex);
                    Map<String, String> params = parseForm(body);

                    if (path.equals("/query")) {
                        handleQuery(ex, params);
                        return;
                    }
                    if (path.equals("/reset")) {
                        try {
                            demo.seed();
                            JSONObject ok = new JSONObject();
                            ok.put("ok", true);
                            sendJson(ex, 200, ok);
                        } catch (Exception inner) {
                            handleException(ex, inner);
                        }
                        return;
                    }
                    if (path.equals("/drop")) {
                        String entryId = params.getOrDefault("entry_id", "").trim();
                        if (entryId.isEmpty()) {
                            sendJson(ex, 400, errorPayload("entry_id is required", null));
                            return;
                        }
                        boolean deleted = cache.deleteEntry(entryId);
                        JSONObject out = new JSONObject();
                        out.put("deleted", deleted);
                        out.put("entry_id", entryId);
                        sendJson(ex, 200, out);
                        return;
                    }
                    sendJson(ex, 404, errorPayload("not found", null));
                    return;
                }
                sendJson(ex, 405, errorPayload("method not allowed", null));
            } catch (Exception exc) {
                handleException(ex, exc);
            }
        }

        private void handleQuery(HttpExchange ex, Map<String, String> params)
                throws IOException {
            String prompt = params.getOrDefault("prompt", "").trim();
            if (prompt.isEmpty()) {
                sendJson(ex, 400, errorPayload("prompt is required", null));
                return;
            }
            double threshold = clampThreshold(params.get("threshold"));
            boolean lookupOnly = params.getOrDefault("lookup_only", "").length() > 0;
            String tenant = nonEmpty(params.get("tenant"), "acme");
            String locale = nonEmpty(params.get("locale"), "en");
            String modelVersion = nonEmpty(params.get("model_version"), llm.modelVersion());

            try {
                Map<String, Object> payload = demo.runQuery(
                        prompt, tenant, locale, modelVersion, threshold, lookupOnly);
                sendJson(ex, 200, toJson(payload));
            } catch (Exception inner) {
                handleException(ex, inner);
            }
        }

        private JSONObject buildState() {
            Map<String, Object> info = cache.indexInfo();
            JSONObject index = new JSONObject();
            index.put("num_docs", info.getOrDefault("num_docs", 0L));
            index.put("indexing_failures", info.getOrDefault("indexing_failures", 0L));
            index.put("vector_index_size_mb",
                    info.getOrDefault("vector_index_size_mb", 0.0));
            index.put("index_name", cache.indexName());
            index.put("model", embedder.modelName());
            index.put("mock_llm_latency_ms", llm.latencyMs());
            // default_threshold is what the --threshold flag actually
            // configures; the UI slider initialises to this on first
            // load so the flag visibly changes the demo's behaviour.
            // stack_label lets the same HTML render a per-language
            // badge without forking the file per language.
            index.put("default_threshold", cache.distanceThreshold());
            index.put("stack_label",
                    "Jedis + DJL (PyTorch + HuggingFace) + Java standard library HTTP server");

            JSONArray entries = new JSONArray();
            List<Map<String, Object>> rows = cache.listEntries(200);
            for (Map<String, Object> row : rows) {
                entries.put(toJson(row));
            }

            JSONObject out = new JSONObject();
            out.put("index", index);
            out.put("entries", entries);
            return out;
        }

        private void handleException(HttpExchange ex, Exception exc) {
            System.err.println("[demo] handler error: "
                    + exc.getClass().getSimpleName() + ": " + exc.getMessage());
            exc.printStackTrace(System.err);
            try {
                JSONObject body = errorPayload(
                        exc.getMessage() == null ? exc.getClass().getSimpleName() : exc.getMessage(),
                        exc.getClass().getSimpleName());
                sendJson(ex, 500, body);
            } catch (Exception ignored) {
                // Headers may already be partially flushed; nothing
                // useful left to do beyond letting the connection drop.
            }
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Parse a threshold value, clamping NaN/Infinity to {@code 0.5}
     * and otherwise clamping to {@code [0.0, 2.0]}. {@code parseDouble}
     * happily handles &quot;nan&quot; → {@code NaN} and
     * &quot;inf&quot; → {@code Infinity}. Either would silently turn
     * the lookup into a permanent hit ({@code NaN} comparisons are
     * always {@code false}, so {@code distance > nan} cannot reject)
     * or a permanent miss; clamping to the meaningful cosine-distance
     * range stops a malformed POST from overriding the threshold
     * semantics.
     */
    static double clampThreshold(String raw) {
        double parsed = 0.5;
        if (raw != null && !raw.isEmpty()) {
            try {
                parsed = Double.parseDouble(raw);
            } catch (NumberFormatException ex) {
                parsed = 0.5;
            }
        }
        if (Double.isNaN(parsed) || Double.isInfinite(parsed)) return 0.5;
        return Math.max(0.0, Math.min(2.0, parsed));
    }

    private static String nonEmpty(String value, String fallback) {
        return (value == null || value.isEmpty()) ? fallback : value;
    }

    /**
     * Cap POST bodies so a runaway client can't accumulate unbounded
     * memory before the handler runs. {@code com.sun.net.httpserver}
     * provides no built-in limit on request bodies; left unchecked,
     * {@code InputStream.readAllBytes()} will read whatever the
     * client sends. The demo's largest legitimate body is a few
     * hundred bytes of form-encoded query fields; 1 MiB is a
     * generous ceiling and matches the Node and Go demos' caps.
     */
    private static final int MAX_BODY_BYTES = 1 * 1024 * 1024;

    private static String readBody(HttpExchange ex) throws IOException {
        try (InputStream in = ex.getRequestBody()) {
            // Read up to MAX_BODY_BYTES + 1 so we can distinguish
            // "exactly at the limit" from "too large".
            byte[] bytes = in.readNBytes(MAX_BODY_BYTES + 1);
            if (bytes.length > MAX_BODY_BYTES) {
                throw new IOException(
                    "request body exceeds " + MAX_BODY_BYTES + " bytes");
            }
            return new String(bytes, StandardCharsets.UTF_8);
        }
    }

    static Map<String, String> parseForm(String body) {
        Map<String, String> out = new HashMap<>();
        if (body == null || body.isEmpty()) return out;
        for (String pair : body.split("&")) {
            if (pair.isEmpty()) continue;
            int eq = pair.indexOf('=');
            String key, value;
            if (eq < 0) {
                key = URLDecoder.decode(pair, StandardCharsets.UTF_8);
                value = "";
            } else {
                key = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
                value = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            }
            out.put(key, value);
        }
        return out;
    }

    private static void sendHtml(HttpExchange ex, int status, String html) throws IOException {
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        ex.getResponseBody().write(bytes);
        ex.getResponseBody().close();
    }

    private static void sendJson(HttpExchange ex, int status, JSONObject body) throws IOException {
        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(status, bytes.length);
        ex.getResponseBody().write(bytes);
        ex.getResponseBody().close();
    }

    private static JSONObject errorPayload(String message, String type) {
        JSONObject out = new JSONObject();
        out.put("error", message);
        if (type != null) out.put("type", type);
        return out;
    }

    private static JSONObject toJson(Map<String, Object> map) {
        JSONObject out = new JSONObject();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            Object value = entry.getValue();
            if (value == null) {
                out.put(entry.getKey(), JSONObject.NULL);
            } else {
                out.put(entry.getKey(), value);
            }
        }
        return out;
    }

    private static String loadIndexHtml() throws IOException {
        // index.html is shipped as a classpath resource (Maven pulls
        // it from the project root via the <resources> entry in
        // pom.xml). Loading from the classpath rather than the
        // working directory means `java -jar target/...` works from
        // anywhere, not just the project root.
        try (InputStream in =
                     DemoServer.class.getResourceAsStream("/index.html")) {
            if (in == null) {
                throw new IOException(
                    "index.html not found on classpath; rebuild with `mvn package`");
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    // ------------------------------------------------------------------
    // CLI parsing
    // ------------------------------------------------------------------

    static Args parseArgs(String[] argv) {
        Args args = new Args();
        for (int i = 0; i < argv.length; i++) {
            String a = argv[i];
            switch (a) {
                case "--host":          args.host = require(argv, ++i, a); break;
                case "--port":          args.port = Integer.parseInt(require(argv, ++i, a)); break;
                case "--redis-host":    args.redisHost = require(argv, ++i, a); break;
                case "--redis-port":    args.redisPort = Integer.parseInt(require(argv, ++i, a)); break;
                case "--index-name":    args.indexName = require(argv, ++i, a); break;
                case "--key-prefix":    args.keyPrefix = require(argv, ++i, a); break;
                case "--ttl-seconds":   args.ttlSeconds = Long.parseLong(require(argv, ++i, a)); break;
                case "--threshold":     args.threshold = Double.parseDouble(require(argv, ++i, a)); break;
                case "--llm-latency-ms":args.llmLatencyMs = Double.parseDouble(require(argv, ++i, a)); break;
                case "--no-reset":      args.resetOnStart = false; break;
                case "-h":
                case "--help":
                    printHelp();
                    System.exit(0);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown flag: " + a);
            }
        }
        return args;
    }

    private static String require(String[] argv, int i, String flag) {
        if (i >= argv.length) {
            throw new IllegalArgumentException("Missing value for " + flag);
        }
        return argv[i];
    }

    private static void printHelp() {
        System.out.println("Usage: java -jar semantic-cache-jedis.jar [options]");
        System.out.println("  --host HOST            HTTP bind host (default 127.0.0.1)");
        System.out.println("  --port PORT            HTTP bind port (default 8089)");
        System.out.println("  --redis-host HOST      Redis host (default localhost)");
        System.out.println("  --redis-port PORT      Redis port (default 6379)");
        System.out.println("  --index-name NAME      Redis Search index name (default semcache:idx)");
        System.out.println("  --key-prefix PREFIX    Hash key prefix (default cache:)");
        System.out.println("  --ttl-seconds N        TTL for cache entries (default 3600)");
        System.out.println("  --threshold F          Default cosine-distance cutoff (default 0.5)");
        System.out.println("  --llm-latency-ms F     Mock LLM latency (default 1500.0)");
        System.out.println("  --no-reset             Keep existing cache instead of re-seeding");
    }
}
