import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantLock;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;

/**
 * Redis feature-store demo server (Lettuce + JDK HttpServer).
 *
 * <p>Run with {@code mvn exec:java -Dexec.mainClass=DemoServer} and
 * visit {@code http://localhost:8089} to watch an online feature
 * store at work: a batch materialization loads N users with a 24-hour
 * key-level TTL, a streaming worker overwrites a handful of users'
 * real-time features every second with a per-field {@code HEXPIRE},
 * and the inference panel reads any subset of features for any user
 * with {@code HMGET} in a single round trip.</p>
 *
 * <p>The Lettuce demo shares a single {@code StatefulRedisConnection}
 * across the HTTP thread pool and the streaming worker — Lettuce
 * connections are thread-safe and multiplexed, so no pool is
 * required for this workload. See the walkthrough for when to add
 * one anyway (blocking commands, very high contention).</p>
 */
public class DemoServer {

    private static FeatureStore store;
    private static StreamingWorker worker;
    private static FeatureStoreDemo demo;
    private static RedisClient redisClient;
    /** Shared connection for non-pipelined reads (multiplexed across the HTTP pool). */
    private static StatefulRedisConnection<String, String> redisConn;
    /** Dedicated connection for the pipelined batched paths (auto-flush toggled). */
    private static StatefulRedisConnection<String, String> redisPipelineConn;

    public static void main(String[] args) throws Exception {
        String host = "127.0.0.1";
        int port = 8089;
        String redisUri = "redis://localhost:6379";
        String keyPrefix = "fs:user:";
        long batchTtlSeconds = 24L * 60L * 60L;
        long streamingTtlSeconds = 5L * 60L;
        int usersPerTick = 5;
        int seedUsers = 200;
        boolean resetOnStart = true;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host" -> host = args[++i];
                case "--port" -> port = Integer.parseInt(args[++i]);
                case "--redis-uri" -> redisUri = args[++i];
                case "--key-prefix" -> keyPrefix = args[++i];
                case "--batch-ttl-seconds" -> batchTtlSeconds = Long.parseLong(args[++i]);
                case "--streaming-ttl-seconds" -> streamingTtlSeconds = Long.parseLong(args[++i]);
                case "--users-per-tick" -> usersPerTick = Integer.parseInt(args[++i]);
                case "--seed-users" -> seedUsers = Integer.parseInt(args[++i]);
                case "--no-reset" -> resetOnStart = false;
                case "-h", "--help" -> {
                    System.out.println(
                        "Usage: mvn exec:java -Dexec.mainClass=DemoServer " +
                        "-Dexec.args=\"[--host H] [--port P] [--redis-uri URI] " +
                        "[--key-prefix PFX] " +
                        "[--batch-ttl-seconds S] [--streaming-ttl-seconds S] " +
                        "[--users-per-tick N] [--seed-users N] [--no-reset]\"");
                    return;
                }
                default -> {
                    System.err.println("Unknown argument: " + args[i]);
                    System.exit(2);
                }
            }
        }

        redisClient = RedisClient.create(redisUri);
        // Two connections: the first is multiplexed across the HTTP
        // thread pool and the streaming worker for ordinary
        // (auto-flushed) commands; the second is reserved for the
        // pipelined batched paths in FeatureStore so the auto-flush
        // toggle never races with another caller's reads.
        redisConn = redisClient.connect();
        redisPipelineConn = redisClient.connect();

        store = new FeatureStore(redisConn, redisPipelineConn, keyPrefix,
            batchTtlSeconds, streamingTtlSeconds);
        worker = new StreamingWorker(store, 1000L, usersPerTick, 1337L);
        demo = new FeatureStoreDemo(store, worker, 42L);

        if (resetOnStart) {
            System.out.printf(
                "Dropping any existing users under '%s*' for a clean demo run (pass --no-reset to keep them).%n",
                keyPrefix);
            store.reset();
            store.resetStats();
        }
        int seeded = demo.materialize(seedUsers, batchTtlSeconds).loaded();
        worker.start();

        HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
        server.createContext("/", new RootHandler());
        server.createContext("/state", new StateHandler());
        server.createContext("/inspect", new InspectHandler());
        server.createContext("/bulk-load", new BulkLoadHandler());
        server.createContext("/reset", new ResetHandler());
        server.createContext("/worker/toggle", new ToggleWorkerHandler());
        server.createContext("/read", new ReadHandler());
        server.createContext("/batch-read", new BatchReadHandler());
        server.setExecutor(Executors.newFixedThreadPool(16));
        server.start();

        System.out.printf("Redis feature-store demo server listening on http://%s:%d%n", host, port);
        System.out.printf(
            "Using Redis at %s with key prefix '%s' (batch TTL %ds, streaming TTL %ds)%n",
            redisUri, keyPrefix, batchTtlSeconds, streamingTtlSeconds);
        System.out.printf("Materialized %d user(s); streaming worker running.%n", seeded);

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\nShutting down...");
            worker.stop();
            server.stop(0);
            redisConn.close();
            redisPipelineConn.close();
            redisClient.shutdown();
        }));

        Thread.currentThread().join();
    }

    // ---------------------------------------------------------------
    // FeatureStoreDemo wires the store and worker with the lifecycle
    // operations the HTTP handlers call into.
    // ---------------------------------------------------------------

    static class FeatureStoreDemo {
        private final FeatureStore store;
        private final StreamingWorker worker;
        private final long seed;
        private final ReentrantLock lock = new ReentrantLock();

        FeatureStoreDemo(FeatureStore store, StreamingWorker worker, long seed) {
            this.store = store;
            this.worker = worker;
            this.seed = seed;
        }

        public record MaterializeResult(int loaded, long ttlSeconds, double elapsedMs) {}

        public MaterializeResult materialize(int count, long ttlSeconds) {
            lock.lock();
            try {
                Map<String, Map<String, Object>> rows = BuildFeatures.synthesizeUsers(count, seed);
                long t0 = System.nanoTime();
                int loaded = store.bulkLoad(rows, ttlSeconds);
                double elapsedMs = (System.nanoTime() - t0) / 1_000_000.0;
                return new MaterializeResult(loaded, ttlSeconds, elapsedMs);
            } finally {
                lock.unlock();
            }
        }

        public long reset() {
            lock.lock();
            try {
                // Pause the streaming worker around the DEL sweep so a
                // concurrent tick can't recreate a user that was just
                // enumerated for deletion. pause() only blocks
                // *future* ticks — waitForIdle() flushes an
                // already-running tick before the DEL sweep starts.
                boolean wasPaused = worker.isPaused();
                if (worker.isRunning()) {
                    if (!wasPaused) worker.pause();
                    worker.waitForIdle();
                }
                try {
                    long deleted = store.reset();
                    store.resetStats();
                    worker.resetStats();
                    return deleted;
                } finally {
                    if (worker.isRunning() && !wasPaused) worker.resume();
                }
            } finally {
                lock.unlock();
            }
        }

        public Map<String, Boolean> toggleWorker() {
            lock.lock();
            try {
                if (!worker.isRunning()) worker.start();
                if (worker.isPaused()) worker.resume();
                else worker.pause();
                return Map.of(
                    "paused", worker.isPaused(),
                    "running", worker.isRunning()
                );
            } finally {
                lock.unlock();
            }
        }
    }

    // ---------------------------------------------------------------
    // Handlers (identical to the Jedis demo apart from the request URI)
    // ---------------------------------------------------------------

    static class RootHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!ex.getRequestURI().getPath().equals("/") &&
                !ex.getRequestURI().getPath().equals("/index.html")) {
                send(ex, 404, "text/plain", "Not Found");
                return;
            }
            send(ex, 200, "text/html; charset=utf-8", htmlPage());
        }
    }

    static class StateHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            try {
                List<String> ids = store.listEntityIds(500);
                long count = store.countEntities();
                Map<String, Object> out = new LinkedHashMap<>();
                out.put("key_prefix", store.getKeyPrefix());
                out.put("batch_ttl_seconds", store.getBatchTtlSeconds());
                out.put("streaming_ttl_seconds", store.getStreamingTtlSeconds());
                out.put("entity_count", count);
                out.put("entity_ids", ids);
                out.put("stats", statsToMap(store.stats()));
                out.put("worker", workerStatsToMap(worker.statsSnapshot()));
                sendJson(ex, 200, out);
            } catch (Exception e) {
                sendJson(ex, 500, Map.of("error", e.getMessage()));
            }
        }
    }

    static class InspectHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"GET".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            Map<String, String> q = parseQuery(ex.getRequestURI());
            String user = q.getOrDefault("user", "").trim();
            if (user.isEmpty()) {
                sendJson(ex, 400, Map.of("error", "user is required")); return;
            }
            try {
                Map<String, String> full = store.getAllFeatures(user);
                long keyTTL = store.keyTtlSeconds(user);
                if (full.isEmpty()) {
                    sendJson(ex, 200, Map.of(
                        "exists", false,
                        "key_ttl_seconds", keyTTL));
                    return;
                }
                // Iterate the known schema (batch + streaming) plus
                // any extras the hash carries. Expired streaming
                // fields surface as ttl_seconds=-2 in the Inspect
                // view instead of silently disappearing, which is
                // exactly the debugging view someone hits "Inspect"
                // for.
                List<String> names = new ArrayList<>(FeatureStore.DEFAULT_BATCH_FIELDS);
                names.addAll(FeatureStore.DEFAULT_STREAMING_FIELDS);
                for (String n : full.keySet()) {
                    if (!names.contains(n)) names.add(n);
                }
                Map<String, Long> ttls = store.fieldTtlsSeconds(user, names);
                Collections.sort(names);
                List<Map<String, Object>> fields = new ArrayList<>(names.size());
                for (String n : names) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("name", n);
                    row.put("value", full.getOrDefault(n, ""));
                    row.put("ttl_seconds", ttls.getOrDefault(n, -2L));
                    fields.add(row);
                }
                sendJson(ex, 200, Map.of(
                    "exists", true,
                    "key_ttl_seconds", keyTTL,
                    "fields", fields));
            } catch (Exception e) {
                sendJson(ex, 500, Map.of("error", e.getMessage()));
            }
        }
    }

    static class BulkLoadHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            Map<String, String> form = parseForm(ex);
            int count = clamp(parseIntOr(form.get("count"), 200), 1, 2000);
            long ttl = (long) clamp(parseIntOr(form.get("ttl"), 86400), 5, 172_800);
            try {
                FeatureStoreDemo.MaterializeResult r = demo.materialize(count, ttl);
                sendJson(ex, 200, Map.of(
                    "loaded", r.loaded(),
                    "ttl_seconds", r.ttlSeconds(),
                    "elapsed_ms", r.elapsedMs()));
            } catch (Exception e) {
                sendJson(ex, 500, Map.of("error", e.getMessage()));
            }
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            try {
                long deleted = demo.reset();
                sendJson(ex, 200, Map.of("deleted", deleted));
            } catch (Exception e) {
                sendJson(ex, 500, Map.of("error", e.getMessage()));
            }
        }
    }

    static class ToggleWorkerHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            sendJson(ex, 200, demo.toggleWorker());
        }
    }

    static class ReadHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            Map<String, List<String>> form = parseFormMulti(ex);
            String user = first(form.get("user"), "").trim();
            if (user.isEmpty()) {
                sendJson(ex, 400, Map.of("error", "user is required")); return;
            }
            List<String> fields = nonEmpty(form.getOrDefault("field", List.of()));
            try {
                long t0 = System.nanoTime();
                Map<String, String> values = fields.isEmpty()
                    ? Collections.emptyMap()
                    : store.getFeatures(user, fields);
                double elapsedMs = (System.nanoTime() - t0) / 1_000_000.0;
                Map<String, Long> ttls = fields.isEmpty()
                    ? Collections.emptyMap()
                    : store.fieldTtlsSeconds(user, fields);
                long keyTTL = store.keyTtlSeconds(user);
                Map<String, Object> out = new LinkedHashMap<>();
                out.put("requested", fields);
                out.put("values", values);
                out.put("ttls", ttls);
                out.put("key_ttl_seconds", keyTTL);
                out.put("returned_count", values.size());
                out.put("elapsed_ms", elapsedMs);
                sendJson(ex, 200, out);
            } catch (Exception e) {
                sendJson(ex, 500, Map.of("error", e.getMessage()));
            }
        }
    }

    static class BatchReadHandler implements HttpHandler {
        @Override public void handle(HttpExchange ex) throws IOException {
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                sendJson(ex, 405, Map.of("error", "method not allowed")); return;
            }
            Map<String, List<String>> form = parseFormMulti(ex);
            int count = clamp(parseIntOr(first(form.get("count"), "100"), 100), 1, 500);
            List<String> fields = nonEmpty(form.getOrDefault("field", List.of()));
            if (fields.isEmpty()) {
                fields = new ArrayList<>(FeatureStore.DEFAULT_STREAMING_FIELDS);
                fields.add("risk_segment");
            }
            try {
                List<String> ids = store.listEntityIds(Math.max(count * 2, 2000));
                if (ids.size() > count) ids = ids.subList(0, count);
                long t0 = System.nanoTime();
                Map<String, Map<String, String>> rows = store.batchGetFeatures(ids, fields);
                double elapsedMs = (System.nanoTime() - t0) / 1_000_000.0;
                int sampleN = Math.min(10, ids.size());
                List<Map<String, Object>> sample = new ArrayList<>(sampleN);
                for (int i = 0; i < sampleN; i++) {
                    String id = ids.get(i);
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("id", id);
                    r.put("field_count", rows.getOrDefault(id, Collections.emptyMap()).size());
                    sample.add(r);
                }
                Map<String, Object> out = new LinkedHashMap<>();
                out.put("entity_count", ids.size());
                out.put("field_count", fields.size());
                out.put("elapsed_ms", elapsedMs);
                out.put("sample", sample);
                sendJson(ex, 200, out);
            } catch (Exception e) {
                sendJson(ex, 500, Map.of("error", e.getMessage()));
            }
        }
    }

    // ---------------------------------------------------------------
    // HTTP plumbing (mirrors the Jedis demo verbatim)
    // ---------------------------------------------------------------

    private static void send(HttpExchange ex, int status, String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", contentType);
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(bytes); }
    }

    private static void sendJson(HttpExchange ex, int status, Object payload) throws IOException {
        send(ex, status, "application/json", toJson(payload));
    }

    private static String toJson(Object o) {
        StringBuilder sb = new StringBuilder();
        appendJson(sb, o);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void appendJson(StringBuilder sb, Object o) {
        if (o == null) { sb.append("null"); return; }
        if (o instanceof Boolean b) { sb.append(b ? "true" : "false"); return; }
        if (o instanceof Number n) { sb.append(n.toString()); return; }
        if (o instanceof Map<?, ?> m) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<?, ?> e : ((Map<Object, Object>) m).entrySet()) {
                if (!first) sb.append(',');
                first = false;
                appendJsonString(sb, String.valueOf(e.getKey()));
                sb.append(':');
                appendJson(sb, e.getValue());
            }
            sb.append('}');
            return;
        }
        if (o instanceof List<?> l) {
            sb.append('[');
            boolean first = true;
            for (Object v : l) {
                if (!first) sb.append(',');
                first = false;
                appendJson(sb, v);
            }
            sb.append(']');
            return;
        }
        if (o.getClass().isArray()) {
            sb.append('[');
            int len = java.lang.reflect.Array.getLength(o);
            for (int i = 0; i < len; i++) {
                if (i > 0) sb.append(',');
                appendJson(sb, java.lang.reflect.Array.get(o, i));
            }
            sb.append(']');
            return;
        }
        appendJsonString(sb, String.valueOf(o));
    }

    private static void appendJsonString(StringBuilder sb, String s) {
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        sb.append('"');
    }

    private static Map<String, String> parseQuery(URI uri) {
        Map<String, String> out = new HashMap<>();
        String q = uri.getRawQuery();
        if (q == null) return out;
        for (String pair : q.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String k = java.net.URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
            String v = java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            out.put(k, v);
        }
        return out;
    }

    private static Map<String, String> parseForm(HttpExchange ex) throws IOException {
        byte[] body = ex.getRequestBody().readAllBytes();
        Map<String, String> out = new HashMap<>();
        if (body.length == 0) return out;
        for (String pair : new String(body, StandardCharsets.UTF_8).split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String k = java.net.URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
            String v = java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            out.put(k, v);
        }
        return out;
    }

    private static Map<String, List<String>> parseFormMulti(HttpExchange ex) throws IOException {
        byte[] body = ex.getRequestBody().readAllBytes();
        Map<String, List<String>> out = new HashMap<>();
        if (body.length == 0) return out;
        for (String pair : new String(body, StandardCharsets.UTF_8).split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String k = java.net.URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
            String v = java.net.URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            out.computeIfAbsent(k, x -> new ArrayList<>()).add(v);
        }
        return out;
    }

    private static String first(List<String> values, String def) {
        return values == null || values.isEmpty() ? def : values.get(0);
    }

    private static List<String> nonEmpty(List<String> in) {
        List<String> out = new ArrayList<>(in.size());
        for (String v : in) if (v != null && !v.isEmpty()) out.add(v);
        return out;
    }

    private static int parseIntOr(String s, int def) {
        if (s == null || s.isEmpty()) return def;
        try { return Integer.parseInt(s); } catch (NumberFormatException e) { return def; }
    }

    private static int clamp(int n, int low, int high) {
        return n < low ? low : (n > high ? high : n);
    }

    private static Map<String, Object> statsToMap(FeatureStore.Stats s) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("batch_writes_total", s.batchWritesTotal());
        out.put("streaming_writes_total", s.streamingWritesTotal());
        out.put("reads_total", s.readsTotal());
        out.put("read_fields_total", s.readFieldsTotal());
        return out;
    }

    private static Map<String, Object> workerStatsToMap(StreamingWorker.Stats s) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("running", s.running());
        out.put("paused", s.paused());
        out.put("tick_count", s.tickCount());
        out.put("writes_count", s.writesCount());
        return out;
    }

    private static String htmlPage() {
        return HTML_TEMPLATE
            .replace("__KEY_PREFIX__", store.getKeyPrefix())
            .replace("__STREAM_TTL__", Long.toString(store.getStreamingTtlSeconds()))
            .replace("__USERS_PER_TICK__", Integer.toString(worker.getUsersPerTick()))
            .replace("__BATCH_FIELDS_JSON__", toJson(FeatureStore.DEFAULT_BATCH_FIELDS))
            .replace("__STREAM_FIELDS_JSON__", toJson(FeatureStore.DEFAULT_STREAMING_FIELDS));
    }

    // ---------------------------------------------------------------
    // HTML template (identical to the Jedis demo apart from the pill text)
    // ---------------------------------------------------------------

    private static final String HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Feature Store Demo (Lettuce)</title>
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
      --batch: #e6e0f0;
      --stream: #d9ebe6;
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
    main { max-width: 1080px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 58rem; font-size: 1.05rem; color: var(--muted); }
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
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small { padding: 5px 10px; font-size: 0.85rem; margin-top: 4px; }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.batch { background: var(--batch); color: #43326a; }
    .badge.stream { background: var(--stream); color: #1d4a2c; }
    .badge.expired { background: var(--warn); color: #6b3220; }
    .badge.untracked { background: #eceff1; color: #3b4951; }
    .badge.running { background: var(--ok); color: #1d4a2c; }
    .badge.paused { background: var(--warn); color: #6b3220; }
    .ttl-pos { color: #1a594c; font-weight: bold; }
    .ttl-neg { color: #6b3220; }
    .field-list { display: flex; gap: 6px 12px; flex-wrap: wrap; }
    .field-list label {
      display: inline-flex; align-items: center; gap: 4px;
      margin: 0; font-weight: normal; font-size: 0.9rem;
    }
    .field-list input { width: auto; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">Lettuce + JDK com.sun.net.httpserver</div>
    <h1>Redis Feature Store Demo</h1>
    <p class="lede">
      A small fraud-scoring feature store. Each user is one Redis hash
      at <code>__KEY_PREFIX__{id}</code> with a batch-materialized
      <span class="badge batch">batch</span> half (daily aggregates,
      24-hour key-level <code>EXPIRE</code>) and a streaming
      <span class="badge stream">streaming</span> half (real-time
      signals, <code>__STREAM_TTL__</code>s per-field <code>HEXPIRE</code>).
      Inference reads any subset with one <code>HMGET</code>; batch
      scoring pipelines <code>HMGET</code> across N users through one
      connection-level flush.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Store state</h2>
        <div id="store-view">Loading...</div>
      </section>

      <section class="panel">
        <h2>Materialize batch features</h2>
        <p>Calls <code>HSET</code> + <code>EXPIRE</code> for each user
          with auto-flush disabled, then one flush ships the whole
          batch.</p>
        <label for="bulk-count">How many users</label>
        <input id="bulk-count" type="number" min="1" max="2000" value="200">
        <label for="bulk-ttl">Key-level TTL (seconds)</label>
        <input id="bulk-ttl" type="number" min="5" max="172800" value="86400">
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Drop the TTL to e.g. 30 s and watch entities disappear on
          schedule — the same thing that happens if a daily refresher
          fails.
        </p>
        <button id="bulk-button">Bulk-load</button>
        <button id="reset-button" class="danger">Reset (drop every user)</button>
      </section>

      <section class="panel">
        <h2>Streaming worker</h2>
        <p>Picks <code>__USERS_PER_TICK__</code> users per tick, writes the
          streaming features, applies <code>HEXPIRE</code>
          <code>__STREAM_TTL__</code>s per field. Pause it and the
          streaming fields drop out via per-field TTL while the batch
          fields stay populated.</p>
        <div id="worker-view"></div>
        <button id="worker-pause-button" class="secondary">Pause / resume</button>
      </section>

      <section class="panel wide">
        <h2>Inference read (HMGET)</h2>
        <p>Pick a user and a feature subset. One <code>HMGET</code>
          round trip returns whatever the model needs.</p>
        <div class="row">
          <div>
            <label for="read-user">User</label>
            <select id="read-user"></select>
          </div>
          <div>
            <label>&nbsp;</label>
            <button id="read-button" class="secondary">Read features</button>
          </div>
        </div>
        <h3>Feature subset</h3>
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Tick to include in the <code>HMGET</code>. Per-field TTL is
          shown next to each field in the result table.
        </p>
        <div id="read-fields" class="field-list"></div>
        <div id="read-result" style="margin-top: 16px;">
          <p>Pick a user and click <strong>Read features</strong>.</p>
        </div>
      </section>

      <section class="panel">
        <h2>Batch scoring</h2>
        <p>Pipelined <code>HMGET</code> across N random users via
          Lettuce's connection-level flush. One network round trip for
          the whole batch.</p>
        <label for="batch-count">How many users</label>
        <input id="batch-count" type="number" min="1" max="500" value="100">
        <button id="batch-button" class="secondary">Pipeline HMGET</button>
        <div id="batch-result" style="margin-top: 14px;">
          <p>(no batch read yet)</p>
        </div>
      </section>

      <section class="panel">
        <h2>Inspect one user</h2>
        <p><code>HGETALL</code> plus per-field <code>HTTL</code> and
          key-level <code>TTL</code>. Useful for spotting which
          streaming fields have already expired.</p>
        <label for="inspect-user">User</label>
        <select id="inspect-user"></select>
        <button id="inspect-button">Inspect</button>
        <div id="inspect-result" style="margin-top: 14px;">
          <p>(pick a user and click Inspect)</p>
        </div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const BATCH_FIELDS = __BATCH_FIELDS_JSON__;
    const STREAM_FIELDS = __STREAM_FIELDS_JSON__;

    const storeView = document.getElementById("store-view");
    const workerView = document.getElementById("worker-view");
    const readUserSelect = document.getElementById("read-user");
    const inspectUserSelect = document.getElementById("inspect-user");
    const readFieldsBox = document.getElementById("read-fields");
    const readResult = document.getElementById("read-result");
    const batchResult = document.getElementById("batch-result");
    const inspectResult = document.getElementById("inspect-result");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function classifyField(name) {
      if (BATCH_FIELDS.includes(name)) return "batch";
      if (STREAM_FIELDS.includes(name)) return "stream";
      return "other";
    }

    function ttlLabel(seconds) {
      if (seconds === -2) return '<span class="badge expired">missing</span>';
      if (seconds === -1) return '<span class="badge untracked">no TTL</span>';
      return `<span class="ttl-pos mono">${seconds}s</span>`;
    }

    function renderStore(state) {
      const stats = state.stats || {};
      storeView.innerHTML = `
        <dl>
          <dt>Users in store</dt><dd>${state.entity_count}</dd>
          <dt>Key prefix</dt><dd class="mono">${escapeHtml(state.key_prefix)}*</dd>
          <dt>Batch TTL</dt><dd>${state.batch_ttl_seconds}s</dd>
          <dt>Streaming TTL</dt><dd>${state.streaming_ttl_seconds}s</dd>
          <dt>Batch writes</dt><dd>${stats.batch_writes_total ?? 0}</dd>
          <dt>Streaming writes</dt><dd>${stats.streaming_writes_total ?? 0}</dd>
          <dt>Reads</dt><dd>${stats.reads_total ?? 0}</dd>
          <dt>Fields returned</dt><dd>${stats.read_fields_total ?? 0}</dd>
        </dl>
      `;
    }

    function renderWorker(state) {
      const w = state.worker || {};
      const badge = w.paused
        ? '<span class="badge paused">paused</span>'
        : w.running
          ? '<span class="badge running">running</span>'
          : '<span class="badge expired">stopped</span>';
      workerView.innerHTML = `
        <p>${badge} <span class="mono">ticks=${w.tick_count ?? 0}
          writes=${w.writes_count ?? 0}</span></p>
      `;
    }

    function populateUserSelects(ids) {
      for (const sel of [readUserSelect, inspectUserSelect]) {
        const previous = sel.value;
        sel.innerHTML = ids.map((id) =>
          `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>`
        ).join("");
        if (ids.includes(previous)) sel.value = previous;
      }
    }

    function renderFieldPicker() {
      const allFields = [...BATCH_FIELDS, ...STREAM_FIELDS];
      readFieldsBox.innerHTML = allFields.map((f) => {
        const kind = classifyField(f);
        const checked = ["risk_segment", "tx_count_7d", "avg_amount_30d",
                         "tx_count_5m", "failed_logins_15m"].includes(f)
                         ? "checked" : "";
        return `<label>
          <input type="checkbox" name="field" value="${escapeHtml(f)}" ${checked}>
          <span class="badge ${kind}">${kind}</span>
          <span class="mono">${escapeHtml(f)}</span>
        </label>`;
      }).join("");
    }

    function selectedReadFields() {
      return Array.from(
        readFieldsBox.querySelectorAll('input[name="field"]:checked')
      ).map((el) => el.value);
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStore(state);
      renderWorker(state);
      populateUserSelects(state.entity_ids || []);
    }

    document.getElementById("bulk-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("bulk-count").value, 10) || 1;
      const ttl = parseInt(document.getElementById("bulk-ttl").value, 10) || 86400;
      const body = new URLSearchParams({ count, ttl });
      const r = await fetch("/bulk-load", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Bulk-load failed.", "error"); return; }
      setStatus(
        `Materialized ${d.loaded} user(s) with a ${d.ttl_seconds}s key-level TTL in ${d.elapsed_ms.toFixed(1)} ms.`,
        "ok",
      );
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop every user from the store?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Reset failed.", "error"); return; }
      setStatus(`Reset. Dropped ${d.deleted} user(s).`, "ok");
      await refresh();
    });

    document.getElementById("worker-pause-button").addEventListener("click", async () => {
      const r = await fetch("/worker/toggle", { method: "POST" });
      const d = await r.json();
      setStatus(d.paused ? "Streaming worker paused." : "Streaming worker resumed.", "ok");
      await refresh();
    });

    document.getElementById("read-button").addEventListener("click", async () => {
      const user = readUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const fields = selectedReadFields();
      const body = new URLSearchParams();
      body.set("user", user);
      for (const f of fields) body.append("field", f);
      const r = await fetch("/read", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
      const rows = (d.requested || []).map((name) => {
        const value = d.values[name];
        const ttl = d.ttls[name];
        const kind = classifyField(name);
        return `<tr>
          <td><span class="badge ${kind}">${kind}</span> <span class="mono">${escapeHtml(name)}</span></td>
          <td class="mono">${value === undefined || value === null
            ? '<span class="badge expired">missing</span>'
            : escapeHtml(value)}</td>
          <td>${ttlLabel(ttl)}</td>
        </tr>`;
      }).join("");
      readResult.innerHTML = `
        <p><strong>HMGET</strong> ${escapeHtml(user)} (${d.requested.length} field(s))
          returned ${d.returned_count} value(s) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>.
          Key-level TTL: ${ttlLabel(d.key_ttl_seconds)}.</p>
        ${d.requested.length === 0 ? "" :
          `<table>
            <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`}
      `;
    });

    document.getElementById("batch-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("batch-count").value, 10) || 1;
      const fields = selectedReadFields();
      const body = new URLSearchParams();
      body.set("count", count);
      for (const f of fields) body.append("field", f);
      const r = await fetch("/batch-read", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Batch read failed.", "error"); return; }
      const perEntity = d.entity_count === 0 ? 0 : d.elapsed_ms / d.entity_count;
      const rows = (d.sample || []).map((row) => `
        <tr>
          <td class="mono">${escapeHtml(row.id)}</td>
          <td>${row.field_count}</td>
        </tr>`).join("");
      batchResult.innerHTML = `
        <p>Pipelined <code>HMGET</code> across <strong>${d.entity_count}</strong> users
          (${d.field_count} field(s) each) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>
          (~${perEntity.toFixed(3)} ms / user, one network round trip total).</p>
        ${(d.sample || []).length === 0 ? "" :
          `<h3>Sample</h3>
           <table>
             <thead><tr><th>user</th><th>fields returned</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`}
      `;
    });

    document.getElementById("inspect-button").addEventListener("click", async () => {
      const user = inspectUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const params = new URLSearchParams({ user });
      const r = await fetch(`/inspect?${params.toString()}`);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Inspect failed.", "error"); return; }
      const rows = (d.fields || []).map((f) => `
        <tr>
          <td><span class="badge ${classifyField(f.name)}">${classifyField(f.name)}</span>
              <span class="mono">${escapeHtml(f.name)}</span></td>
          <td class="mono">${escapeHtml(f.value)}</td>
          <td>${ttlLabel(f.ttl_seconds)}</td>
        </tr>`).join("");
      inspectResult.innerHTML = d.exists === false
        ? `<p><span class="badge expired">missing</span> <code>${escapeHtml(user)}</code> isn't in the store. Either it was never materialized or its key-level TTL expired.</p>`
        : `<p>Key-level TTL: ${ttlLabel(d.key_ttl_seconds)} &nbsp; (${d.fields.length} field(s))</p>
           <table>
             <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>`;
    });

    renderFieldPicker();
    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
""";
}
