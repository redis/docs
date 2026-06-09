package com.redis.agentmem;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.json.JSONArray;
import org.json.JSONObject;
import redis.clients.jedis.ConnectionPoolConfig;
import redis.clients.jedis.DefaultJedisClientConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisPooled;

import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Redis agent-memory demo server (Java + Jedis).
 *
 * <p>Run this main and visit {@code http://localhost:8092} to drive
 * a small agent-memory demo backed by Redis Hashes, JSON, Search,
 * and Streams. The UI lets you type a turn, watch working memory
 * update, see semantically similar long-term memories recalled, and
 * inspect the per-thread event log.
 *
 * <p>The server holds a single {@link LocalEmbedder}, one
 * {@link AgentSession}, one {@link LongTermMemory}, and one
 * {@link AgentEventLog} for the lifetime of the process. The first
 * run downloads the embedding model into the local DJL cache;
 * everything after is local.
 */
public final class DemoServer {

    static final class Args {
        String host = "127.0.0.1";
        int port = 8092;
        String redisHost = "localhost";
        int redisPort = 6379;
        String memIndexName = "agentmem:idx";
        String memKeyPrefix = "agent:mem:";
        String sessionKeyPrefix = "agent:session:";
        String eventKeyPrefix = "agent:events:";
        long sessionTtlSeconds = 3600;
        double dedupThreshold = LongTermMemory.DEFAULT_DEDUP_THRESHOLD;
        double recallThreshold = LongTermMemory.DEFAULT_RECALL_THRESHOLD;
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
                DefaultJedisClientConfig.builder()
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

        AgentSession session = new AgentSession(
                jedis,
                args.sessionKeyPrefix,
                args.sessionTtlSeconds,
                AgentSession.DEFAULT_MAX_TURNS);
        LongTermMemory memory = new LongTermMemory(
                jedis,
                args.memIndexName,
                args.memKeyPrefix,
                LocalEmbedder.defaultVectorDim(),
                args.dedupThreshold,
                args.recallThreshold,
                null);
        memory.createIndex();
        AgentEventLog events = new AgentEventLog(
                jedis, args.eventKeyPrefix, AgentEventLog.DEFAULT_MAX_LEN);

        System.out.println("Loading embedding model "
                + "(first run downloads the PyTorch weights)...");
        LocalEmbedder embedder = LocalEmbedder.create();

        AgentMemoryDemo demo = new AgentMemoryDemo(session, memory, events, embedder);

        if (args.resetOnStart) {
            System.out.println(
                    "Dropping any existing memories under '" + args.memKeyPrefix
                            + "*' and re-seeding from the sample memory list "
                            + "(pass --no-reset to keep).");
            int seeded = demo.seedAll("default", "default");
            System.out.println("Seeded " + seeded + " memories.");
        }

        // Load index.html once and substitute the template tokens so
        // the docs panel shows the actual values in use.
        String rawHtml = loadIndexHtml();
        String htmlPage = rawHtml
                .replace("__SESSION_PREFIX__", args.sessionKeyPrefix)
                .replace("__MEM_PREFIX__", args.memKeyPrefix)
                .replace("__MEM_INDEX__", args.memIndexName)
                .replace("__EVENT_PREFIX__", args.eventKeyPrefix);

        HttpServer server = HttpServer.create(
                new InetSocketAddress(args.host, args.port), 0);
        server.setExecutor(Executors.newCachedThreadPool());
        server.createContext("/", new RootHandler(demo, htmlPage));

        System.out.println("Redis agent memory demo listening on "
                + "http://" + args.host + ":" + args.port);
        System.out.println("Using Redis at " + args.redisHost + ":" + args.redisPort
                + " with memory index '" + args.memIndexName + "'");

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

    /**
     * Demo state: working memory, long-term memory, event log.
     *
     * <p>{@code seedAll} / {@code newThread} / {@code handleTurn}
     * all touch {@code currentThreadId} — synchronized through the
     * mutex below, but the lock is released between operations so a
     * turn racing with a thread rotation can capture the old id and
     * apply to the previous thread. The demo is single-user in
     * practice, so the race never triggers; a multi-user agent would
     * carry the thread id on each request instead of holding it as
     * shared server state. See the walkthrough's "Concurrency
     * caveats" section.
     */
    static final class AgentMemoryDemo {
        private final AgentSession session;
        private final LongTermMemory memory;
        private final AgentEventLog events;
        private final LocalEmbedder embedder;
        private final String defaultUser = "default";
        private final String defaultNamespace = "default";
        private final Object threadIdLock = new Object();
        private String currentThreadId;

        AgentMemoryDemo(AgentSession session, LongTermMemory memory,
                        AgentEventLog events, LocalEmbedder embedder) {
            this.session = session;
            this.memory = memory;
            this.events = events;
            this.embedder = embedder;
            this.currentThreadId = session.newThreadId();
        }

        String currentThreadId() {
            synchronized (threadIdLock) {
                return currentThreadId;
            }
        }

        /** Drop everything in scope and pre-populate with seed memories. */
        int seedAll(String user, String namespace) throws Exception {
            memory.clear();
            String threadId = currentThreadId();
            session.delete(threadId);
            events.clear(threadId);
            int written = SeedMemory.seed(memory, embedder, user, namespace, "seed");
            synchronized (threadIdLock) {
                currentThreadId = session.newThreadId();
            }
            return written;
        }

        /** Start a fresh thread. Long-term memory is unaffected. */
        String newThread(String user, String namespace) {
            String oldId = currentThreadId();
            events.clear(oldId);
            String newId = session.newThreadId();
            session.start(newId, user, "demo-agent", "", null);
            events.record(newId, "thread_started",
                    "user=" + user + " namespace=" + namespace);
            synchronized (threadIdLock) {
                currentThreadId = newId;
            }
            return newId;
        }

        /**
         * One pass through the agent loop: append, recall, remember, log.
         *
         * <p>The order matters. We embed once and reuse the vector
         * for both the recall and (if asked) the remember step — no
         * point encoding the same text twice. Recall runs
         * <em>before</em> the remember write so the agent doesn't
         * see its own just-written turn as a recalled memory.
         */
        Map<String, Object> handleTurn(
                String text,
                String user,
                String namespace,
                String kind,
                String role,
                double threshold,
                String action) throws Exception {
            String threadId = currentThreadId();

            long t0 = System.nanoTime();
            float[] vec = embedder.encodeOne(text);
            double embedMs = (System.nanoTime() - t0) / 1_000_000.0;

            // `setGoal` only touches the goal field so existing turns
            // aren't wiped; `appendTurn` carries the request `user`
            // through to the auto-create path so a first turn for a
            // new thread doesn't land under the default user.
            String sessionAction;
            if ("goal".equals(action)) {
                session.setGoal(threadId, text, user, "demo-agent", null);
                sessionAction = "goal_set";
            } else {
                session.appendTurn(threadId, role, text, user, "demo-agent", null);
                sessionAction = "turn_appended:" + role;
            }

            long t1 = System.nanoTime();
            List<MemoryRecord> recalled = memory.recall(
                    vec, user, namespace, null, 5, threshold);
            double recallMs = (System.nanoTime() - t1) / 1_000_000.0;

            boolean writeSkipped = "skip".equals(kind) || "goal".equals(action);
            WriteResult writeResult = null;
            double writeMs = 0.0;
            if (!writeSkipped) {
                long t2 = System.nanoTime();
                writeResult = memory.remember(
                        text, vec, user, namespace, kind, threadId, null);
                writeMs = (System.nanoTime() - t2) / 1_000_000.0;
            }

            String detail;
            if (writeResult == null) {
                detail = "";
            } else if (writeResult.deduped()) {
                detail = "deduped onto " + writeResult.id();
            } else {
                detail = "wrote " + writeResult.id() + " as " + kind;
            }
            events.record(threadId, sessionAction, detail);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("thread_id", threadId);
            payload.put("write_skipped", writeSkipped);
            payload.put("memory_id", writeResult == null ? null : writeResult.id());
            payload.put("deduped", writeResult != null && writeResult.deduped());
            payload.put("existing_distance",
                    writeResult == null ? null : writeResult.existingDistance());
            payload.put("kind", writeSkipped ? null : kind);
            payload.put("recalled", memoriesToJsonArray(recalled));
            payload.put("embed_ms", embedMs);
            payload.put("recall_ms", recallMs);
            payload.put("write_ms", writeMs);
            return payload;
        }

        // ----- Build the /state response shape ------------------------

        JSONObject buildState(String user, String namespace) {
            Map<String, Object> info = memory.indexInfo();
            JSONObject index = new JSONObject();
            index.put("num_docs", info.getOrDefault("num_docs", 0L));
            index.put("indexing_failures", info.getOrDefault("indexing_failures", 0L));
            index.put("index_name", memory.indexName());
            index.put("model", embedder.modelName());
            index.put("session_ttl_seconds", session.defaultTtlSeconds());
            index.put("dedup_threshold", memory.dedupThreshold());
            index.put("default_recall_threshold", memory.recallThreshold());
            index.put("stack_label",
                    "Jedis + DJL (PyTorch + HuggingFace) + Java standard library HTTP server");

            String threadId = currentThreadId();
            SessionState state = session.load(threadId);
            JSONArray memories = memoriesToJsonArray(
                    memory.listMemories(user, namespace, null, 200));
            JSONArray eventArr = new JSONArray();
            for (AgentEvent e : events.recent(threadId, 20)) {
                eventArr.put(eventToJson(e));
            }

            JSONObject out = new JSONObject();
            out.put("index", index);
            out.put("thread_id", threadId);
            out.put("session", state == null ? JSONObject.NULL : sessionToJson(state));
            out.put("memories", memories);
            out.put("events", eventArr);
            // `recalled` is populated by /turn; on plain /state reads
            // the UI keeps showing the last turn's result.
            out.put("recalled", new JSONArray());
            return out;
        }
    }

    // ------------------------------------------------------------------
    // Serialisation helpers (match the Python/Node demo payloads
    // exactly so the same index.html JS works)
    // ------------------------------------------------------------------

    static JSONObject sessionToJson(SessionState s) {
        JSONObject obj = new JSONObject();
        obj.put("thread_id", s.threadId());
        obj.put("user", s.user());
        obj.put("agent", s.agent());
        obj.put("goal", s.goal());
        obj.put("scratchpad", s.scratchpad());
        obj.put("turn_count", s.turnCount());
        obj.put("created_ts", s.createdTs());
        obj.put("last_active_ts", s.lastActiveTs());
        JSONArray turns = new JSONArray();
        for (SessionTurn t : s.recentTurns()) {
            JSONObject turn = new JSONObject();
            turn.put("role", t.role());
            turn.put("content", t.content());
            turn.put("ts", t.ts());
            turns.put(turn);
        }
        obj.put("recent_turns", turns);
        obj.put("ttl_seconds", s.ttlSeconds());
        return obj;
    }

    static JSONObject memoryToJson(MemoryRecord m) {
        JSONObject obj = new JSONObject();
        obj.put("id", m.id());
        obj.put("user", m.user());
        obj.put("namespace", m.namespace());
        obj.put("kind", m.kind());
        obj.put("source_thread", m.sourceThread());
        obj.put("text", m.text());
        obj.put("created_ts", m.createdTs());
        obj.put("hit_count", m.hitCount());
        obj.put("distance", m.distance() == null ? JSONObject.NULL : m.distance());
        obj.put("ttl_seconds", m.ttlSeconds() == null ? JSONObject.NULL : m.ttlSeconds());
        return obj;
    }

    static JSONArray memoriesToJsonArray(List<MemoryRecord> records) {
        JSONArray arr = new JSONArray();
        for (MemoryRecord m : records) {
            arr.put(memoryToJson(m));
        }
        return arr;
    }

    static JSONObject eventToJson(AgentEvent e) {
        JSONObject obj = new JSONObject();
        obj.put("event_id", e.eventId());
        obj.put("thread_id", e.threadId());
        obj.put("action", e.action());
        obj.put("detail", e.detail());
        obj.put("ts", e.ts());
        return obj;
    }

    // ------------------------------------------------------------------
    // HTTP plumbing
    // ------------------------------------------------------------------

    static final class RootHandler implements HttpHandler {
        private final AgentMemoryDemo demo;
        private final String htmlPage;

        RootHandler(AgentMemoryDemo demo, String htmlPage) {
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
                        Map<String, String> q = parseForm(uri.getRawQuery());
                        String user = nonEmpty(q.get("user"), "default");
                        String ns = nonEmpty(q.get("namespace"), "default");
                        sendJson(ex, 200, demo.buildState(user, ns));
                        return;
                    }
                    sendJson(ex, 404, errorPayload("not found", null));
                    return;
                }
                if ("POST".equalsIgnoreCase(method)) {
                    String body = readBody(ex);
                    Map<String, String> params = parseForm(body);

                    if (path.equals("/turn")) {
                        handleTurn(ex, params);
                        return;
                    }
                    if (path.equals("/new_thread")) {
                        String user = nonEmpty(params.get("user"), "default");
                        String ns = nonEmpty(params.get("namespace"), "default");
                        String tid = demo.newThread(user, ns);
                        JSONObject body2 = new JSONObject();
                        body2.put("thread_id", tid);
                        sendJson(ex, 200, body2);
                        return;
                    }
                    if (path.equals("/reset")) {
                        String user = nonEmpty(params.get("user"), "default");
                        String ns = nonEmpty(params.get("namespace"), "default");
                        try {
                            int seeded = demo.seedAll(user, ns);
                            JSONObject ok = new JSONObject();
                            ok.put("seeded", seeded);
                            sendJson(ex, 200, ok);
                        } catch (Exception inner) {
                            handleException(ex, inner);
                        }
                        return;
                    }
                    if (path.equals("/drop_memory")) {
                        String memoryId = params.getOrDefault("memory_id", "").trim();
                        if (memoryId.isEmpty()) {
                            sendJson(ex, 400, errorPayload("memory_id is required", null));
                            return;
                        }
                        boolean deleted = demo.memory.deleteMemory(memoryId);
                        JSONObject out = new JSONObject();
                        out.put("deleted", deleted);
                        out.put("memory_id", memoryId);
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

        private void handleTurn(HttpExchange ex, Map<String, String> params)
                throws IOException {
            String text = params.getOrDefault("text", "").trim();
            if (text.isEmpty()) {
                sendJson(ex, 400, errorPayload("text is required", null));
                return;
            }
            double threshold = clampThreshold(
                    params.get("threshold"), demo.memory.recallThreshold());
            try {
                Map<String, Object> payload = demo.handleTurn(
                        text,
                        nonEmpty(params.get("user"), "default"),
                        nonEmpty(params.get("namespace"), "default"),
                        nonEmpty(params.get("kind"), "episodic"),
                        nonEmpty(params.get("role"), "user"),
                        threshold,
                        nonEmpty(params.get("action"), "turn"));
                sendJson(ex, 200, toJson(payload));
            } catch (Exception inner) {
                handleException(ex, inner);
            }
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
     * Parse a threshold value, clamping NaN/Infinity to
     * {@code fallback} and otherwise clamping to {@code [0.0, 2.0]}.
     * {@code parseDouble} happily handles "nan" → NaN and "inf" → +Inf;
     * either would silently turn recall into "every memory" or
     * "nothing", so clamping stops a malformed POST from overriding
     * the threshold semantics.
     */
    static double clampThreshold(String raw, double fallback) {
        if (raw == null || raw.isEmpty()) return fallback;
        double parsed;
        try {
            parsed = Double.parseDouble(raw);
        } catch (NumberFormatException ex) {
            return fallback;
        }
        if (Double.isNaN(parsed) || Double.isInfinite(parsed)) return fallback;
        return Math.max(0.0, Math.min(2.0, parsed));
    }

    private static String nonEmpty(String value, String fallback) {
        return (value == null || value.isEmpty()) ? fallback : value;
    }

    /**
     * Cap POST bodies so a runaway client can't accumulate unbounded
     * memory before the handler runs. {@code com.sun.net.httpserver}
     * provides no built-in limit on request bodies; the demo's
     * largest legitimate body is a few hundred bytes of form-encoded
     * query fields. 1 MiB matches the Node, Go, Rust, and .NET caps.
     */
    private static final int MAX_BODY_BYTES = 1 * 1024 * 1024;

    private static String readBody(HttpExchange ex) throws IOException {
        try (InputStream in = ex.getRequestBody()) {
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
        // pom.xml).
        try (InputStream in = DemoServer.class.getResourceAsStream("/index.html")) {
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
                case "--host":                args.host = require(argv, ++i, a); break;
                case "--port":                args.port = Integer.parseInt(require(argv, ++i, a)); break;
                case "--redis-host":          args.redisHost = require(argv, ++i, a); break;
                case "--redis-port":          args.redisPort = Integer.parseInt(require(argv, ++i, a)); break;
                case "--mem-index-name":      args.memIndexName = require(argv, ++i, a); break;
                case "--mem-key-prefix":      args.memKeyPrefix = require(argv, ++i, a); break;
                case "--session-key-prefix":  args.sessionKeyPrefix = require(argv, ++i, a); break;
                case "--event-key-prefix":    args.eventKeyPrefix = require(argv, ++i, a); break;
                case "--session-ttl-seconds": args.sessionTtlSeconds = Long.parseLong(require(argv, ++i, a)); break;
                case "--dedup-threshold":     args.dedupThreshold = Double.parseDouble(require(argv, ++i, a)); break;
                case "--recall-threshold":    args.recallThreshold = Double.parseDouble(require(argv, ++i, a)); break;
                case "--no-reset":            args.resetOnStart = false; break;
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
        System.out.println("Usage: java -jar agent-memory-jedis.jar [options]");
        System.out.println("  --host HOST                  HTTP bind host (default 127.0.0.1)");
        System.out.println("  --port PORT                  HTTP bind port (default 8092)");
        System.out.println("  --redis-host HOST            Redis host (default localhost)");
        System.out.println("  --redis-port PORT            Redis port (default 6379)");
        System.out.println("  --mem-index-name NAME        Memory search index (default agentmem:idx)");
        System.out.println("  --mem-key-prefix PREFIX      JSON memory key prefix (default agent:mem:)");
        System.out.println("  --session-key-prefix PREFIX  Session hash key prefix (default agent:session:)");
        System.out.println("  --event-key-prefix PREFIX    Event stream key prefix (default agent:events:)");
        System.out.println("  --session-ttl-seconds N      Working-memory TTL (default 3600)");
        System.out.println("  --dedup-threshold F          Cosine distance for dedup (default 0.20)");
        System.out.println("  --recall-threshold F         Cosine distance for recall (default 0.55)");
        System.out.println("  --no-reset                   Skip clearing and re-seeding on startup");
    }
}
