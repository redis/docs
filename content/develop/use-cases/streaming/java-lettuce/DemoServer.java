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
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Redis streaming demo server using Lettuce.
 *
 * <p>Run this file and visit http://localhost:8784 to watch a Redis
 * Stream in action: producers append events to a single stream, two
 * independent consumer groups read the same stream at their own pace,
 * and within the {@code notifications} group two consumers share the
 * work.</p>
 */
public class DemoServer {

    private static final String[] EVENT_TYPES = {
            "order.placed", "order.paid", "order.shipped", "order.cancelled"
    };
    private static final String[] CUSTOMERS = {"alice", "bob", "carol", "dan", "erin"};

    private static final Map<String, List<String>> DEFAULT_GROUPS = new LinkedHashMap<>();
    static {
        List<String> notifications = new ArrayList<>();
        notifications.add("worker-a");
        notifications.add("worker-b");
        DEFAULT_GROUPS.put("notifications", notifications);
        List<String> analytics = new ArrayList<>();
        analytics.add("worker-c");
        DEFAULT_GROUPS.put("analytics", analytics);
    }

    private static EventStream stream;
    private static StreamingDemo demo;
    private static RedisClient redisClient;
    private static StatefulRedisConnection<String, String> connection;

    public static void main(String[] args) {
        String host = "127.0.0.1";
        int port = 8784;
        String redisHost = "localhost";
        int redisPort = 6379;
        String streamKey = "demo:events:orders";
        long maxlen = 2000L;
        long claimIdleMs = 5000L;
        boolean resetOnStart = true;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host": host = args[++i]; break;
                case "--port": port = Integer.parseInt(args[++i]); break;
                case "--redis-host": redisHost = args[++i]; break;
                case "--redis-port": redisPort = Integer.parseInt(args[++i]); break;
                case "--stream-key": streamKey = args[++i]; break;
                case "--maxlen": maxlen = Long.parseLong(args[++i]); break;
                case "--claim-idle-ms": claimIdleMs = Long.parseLong(args[++i]); break;
                case "--no-reset": resetOnStart = false; break;
                default: break;
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

        stream = new EventStream(connection, streamKey, maxlen, claimIdleMs);
        demo = new StreamingDemo(stream);

        if (resetOnStart) {
            System.out.printf("Deleting any existing data at key '%s' for a clean demo run "
                            + "(pass --no-reset to keep it).%n", streamKey);
            stream.deleteStream();
        }
        int seeded = demo.seed(DEFAULT_GROUPS);

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
            server.createContext("/", new RootHandler());
            server.createContext("/state", new StateHandler());
            server.createContext("/produce", new ProduceHandler());
            server.createContext("/add-worker", new AddWorkerHandler());
            server.createContext("/remove-worker", new RemoveWorkerHandler());
            server.createContext("/crash", new CrashHandler());
            server.createContext("/autoclaim", new AutoclaimHandler());
            server.createContext("/trim", new TrimHandler());
            server.createContext("/replay", new ReplayHandler());
            server.createContext("/reset", new ResetHandler());
            server.setExecutor(Executors.newFixedThreadPool(16));

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try { demo.stopAll(); } catch (Exception ignored) {}
                if (connection != null) connection.close();
                if (redisClient != null) redisClient.shutdown();
            }));

            server.start();
            System.out.printf("Redis streaming demo server listening on http://%s:%d%n",
                    host, port);
            System.out.printf("Using Redis at %s:%d with stream key '%s' (MAXLEN ~ %d)%n",
                    redisHost, redisPort, streamKey, maxlen);
            System.out.printf("Seeded %d consumer(s) across %d group(s)%n",
                    seeded, DEFAULT_GROUPS.size());
        } catch (IOException e) {
            System.err.println("Failed to start server: " + e.getMessage());
            System.exit(1);
        }
    }

    // ----- Demo registry --------------------------------------------------

    /** In-memory registry of consumer workers across all groups. */
    static class StreamingDemo {
        private final EventStream stream;
        private final Map<String, ConsumerWorker> workers = new ConcurrentHashMap<>();
        private final ReentrantLock lock = new ReentrantLock();

        StreamingDemo(EventStream stream) {
            this.stream = stream;
        }

        int seed(Map<String, List<String>> groups) {
            lock.lock();
            try {
                int count = 0;
                for (Map.Entry<String, List<String>> entry : groups.entrySet()) {
                    String group = entry.getKey();
                    stream.ensureGroup(group, "0-0");
                    for (String name : entry.getValue()) {
                        addWorker(group, name);
                        count += 1;
                    }
                }
                return count;
            } finally {
                lock.unlock();
            }
        }

        boolean addWorker(String group, String name) {
            lock.lock();
            try {
                String key = key(group, name);
                if (workers.containsKey(key)) return false;
                stream.ensureGroup(group, "0-0");
                ConsumerWorker worker = new ConsumerWorker(stream, group, name);
                worker.start();
                workers.put(key, worker);
                return true;
            } finally {
                lock.unlock();
            }
        }

        Map<String, Object> removeWorker(String group, String name) {
            lock.lock();
            try {
                String key = key(group, name);
                ConsumerWorker worker = workers.get(key);
                Map<String, Object> result = new LinkedHashMap<>();
                if (worker == null) {
                    result.put("removed", false);
                    result.put("reason", "not-found");
                    return result;
                }
                String peer = null;
                for (Map.Entry<String, ConsumerWorker> entry : workers.entrySet()) {
                    ConsumerWorker candidate = entry.getValue();
                    if (candidate == worker) continue;
                    if (candidate.getGroup().equals(group)) {
                        peer = candidate.getName();
                        break;
                    }
                }
                if (peer == null) {
                    result.put("removed", false);
                    result.put("reason", "no-peer");
                    result.put("message", group + "/" + name
                            + " still owns pending entries and is the only consumer in its group; "
                            + "add another consumer first so its PEL can be handed over before deletion.");
                    return result;
                }
                int handed = stream.handoverPending(group, name, peer, 100);
                workers.remove(key);
                worker.stop();
                stream.deleteConsumer(group, name);
                result.put("removed", true);
                result.put("handed_over_to", peer);
                result.put("handed_over_count", handed);
                return result;
            } finally {
                lock.unlock();
            }
        }

        ConsumerWorker getWorker(String group, String name) {
            return workers.get(key(group, name));
        }

        List<ConsumerWorker> snapshot() {
            return new ArrayList<>(workers.values());
        }

        void stopAll() {
            lock.lock();
            try {
                for (ConsumerWorker worker : workers.values()) worker.stop();
                workers.clear();
            } finally {
                lock.unlock();
            }
        }

        int reset(Map<String, List<String>> groups) {
            lock.lock();
            try {
                stopAll();
                stream.deleteStream();
                stream.resetStats();
                return seed(groups);
            } finally {
                lock.unlock();
            }
        }

        private static String key(String group, String name) {
            return group + "" + name;
        }
    }

    // ----- Handlers -------------------------------------------------------

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
            byte[] body = renderHtmlPage().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
        }
    }

    static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            sendJson(exchange, 200, toJson(buildState()));
        }
    }

    static class ProduceHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            int count = clamp(parseInt(form.get("count"), 1), 1, 500);
            String eventType = form.getOrDefault("type", "").trim();
            Random rnd = new Random();
            List<Map.Entry<String, Map<String, String>>> events = new ArrayList<>(count);
            for (int i = 0; i < count; i++) {
                String picked = eventType.isEmpty()
                        ? EVENT_TYPES[rnd.nextInt(EVENT_TYPES.length)]
                        : eventType;
                events.add(new AbstractMap.SimpleEntry<>(picked, fakePayload(rnd)));
            }
            List<String> ids = stream.produceBatch(events);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("produced", ids.size());
            response.put("ids", ids);
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class AddWorkerHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String group = form.getOrDefault("group", "").trim();
            String name = form.getOrDefault("name", "").trim();
            if (group.isEmpty() || name.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"group and name are required\"}");
                return;
            }
            boolean added = demo.addWorker(group, name);
            if (!added) {
                sendJson(exchange, 409,
                        "{\"error\":\"" + jsonEscape(group + "/" + name + " already exists") + "\"}");
                return;
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("group", group);
            response.put("name", name);
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class RemoveWorkerHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String group = form.getOrDefault("group", "").trim();
            String name = form.getOrDefault("name", "").trim();
            Map<String, Object> result = demo.removeWorker(group, name);
            int status = (Boolean.TRUE.equals(result.get("removed"))
                    || "not-found".equals(result.get("reason"))) ? 200 : 409;
            sendJson(exchange, status, toJson(result));
        }
    }

    static class CrashHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String group = form.getOrDefault("group", "").trim();
            String name = form.getOrDefault("name", "").trim();
            int count = parseInt(form.get("count"), 1);
            ConsumerWorker worker = demo.getWorker(group, name);
            if (worker == null) {
                sendJson(exchange, 404,
                        "{\"error\":\"" + jsonEscape("unknown consumer " + group + "/" + name) + "\"}");
                return;
            }
            worker.crashNext(count);
            sendJson(exchange, 200, "{\"queued\":" + count + "}");
        }
    }

    static class AutoclaimHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            String group = form.getOrDefault("group", "").trim();
            String consumer = form.getOrDefault("consumer", "").trim();
            if (group.isEmpty() || consumer.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"group and consumer are required\"}");
                return;
            }
            ConsumerWorker worker = demo.getWorker(group, consumer);
            if (worker == null) {
                sendJson(exchange, 404,
                        "{\"error\":\"" + jsonEscape("unknown consumer " + group + "/" + consumer) + "\"}");
                return;
            }
            ConsumerWorker.ReapResult result = worker.reapIdlePel();
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("claimed", result.claimed);
            response.put("processed", result.processed);
            response.put("deleted", result.deletedIds);
            response.put("min_idle_ms", stream.getClaimMinIdleMs());
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class TrimHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> form = parseFormData(readRequestBody(exchange));
            long maxlen = parseLong(form.get("maxlen"), 0L);
            long deleted = stream.trimMaxlen(maxlen);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("deleted", deleted);
            response.put("maxlen", maxlen);
            sendJson(exchange, 200, toJson(response));
        }
    }

    static class ReplayHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            Map<String, String> query = parseQuery(exchange.getRequestURI().getRawQuery());
            String start = nonEmpty(query.get("start"), "-");
            String end = nonEmpty(query.get("end"), "+");
            long count = clamp(parseLong(query.get("count"), 20L), 1L, 500L);
            List<EventStream.Entry> entries = stream.replay(start, end, count);
            List<Map<String, Object>> entryList = new ArrayList<>(entries.size());
            for (EventStream.Entry entry : entries) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", entry.id);
                row.put("fields", entry.fields);
                entryList.add(row);
            }
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("start", start);
            response.put("end", end);
            response.put("limit", count);
            response.put("entries", entryList);
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
            int count = demo.reset(DEFAULT_GROUPS);
            sendJson(exchange, 200, "{\"consumers\":" + count + "}");
        }
    }

    // ----- State assembly -------------------------------------------------

    private static Map<String, Object> buildState() {
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("stream", stream.infoStream());

        List<EventStream.Entry> tailEntries = stream.tail(10);
        List<Map<String, Object>> tail = new ArrayList<>(tailEntries.size());
        for (EventStream.Entry entry : tailEntries) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", entry.id);
            row.put("fields", entry.fields);
            tail.add(row);
        }
        state.put("tail", tail);

        List<ConsumerWorker> snapshot = demo.snapshot();
        List<Map<String, Object>> groupsDetail = new ArrayList<>();
        List<Map<String, Object>> pendingRows = new ArrayList<>();

        for (Map<String, Object> group : stream.infoGroups()) {
            String groupName = String.valueOf(group.get("name"));
            Map<String, Map<String, Object>> consumerInfo = new LinkedHashMap<>();
            for (Map<String, Object> c : stream.infoConsumers(groupName)) {
                consumerInfo.put(String.valueOf(c.get("name")), c);
            }

            List<Map<String, Object>> consumersDetail = new ArrayList<>();
            List<String> covered = new ArrayList<>();
            for (ConsumerWorker worker : snapshot) {
                if (!worker.getGroup().equals(groupName)) continue;
                Map<String, Object> info = consumerInfo.get(worker.getName());
                ConsumerWorker.ConsumerStatus status = worker.status();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", status.name);
                row.put("group", status.group);
                row.put("processed", status.processed);
                row.put("reaped", status.reaped);
                row.put("crashed_drops", status.crashedDrops);
                row.put("paused", status.paused);
                row.put("crash_queued", status.crashQueued);
                row.put("alive", status.alive);
                row.put("pending", info == null ? 0L : info.get("pending"));
                row.put("idle_ms", info == null ? 0L : info.get("idle_ms"));
                List<ConsumerWorker.RecentEntry> recent = worker.recent();
                List<Map<String, Object>> recentRows = new ArrayList<>(recent.size());
                for (ConsumerWorker.RecentEntry e : recent) {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("id", e.id);
                    r.put("type", e.type);
                    r.put("fields", e.fields);
                    r.put("acked", e.acked);
                    r.put("note", e.note);
                    recentRows.add(r);
                }
                row.put("recent", recentRows);
                consumersDetail.add(row);
                covered.add(worker.getName());
            }
            // Include orphaned consumers that exist in Redis but not
            // in our in-process registry (e.g. left over from a prior
            // run when --no-reset is set).
            for (Map.Entry<String, Map<String, Object>> entry : consumerInfo.entrySet()) {
                if (covered.contains(entry.getKey())) continue;
                Map<String, Object> info = entry.getValue();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", entry.getKey());
                row.put("group", groupName);
                row.put("processed", 0L);
                row.put("reaped", 0L);
                row.put("crashed_drops", 0L);
                row.put("paused", false);
                row.put("crash_queued", 0);
                row.put("alive", false);
                row.put("pending", info.get("pending"));
                row.put("idle_ms", info.get("idle_ms"));
                row.put("recent", new ArrayList<>());
                consumersDetail.add(row);
            }
            consumersDetail.sort((a, b) ->
                    String.valueOf(a.get("name")).compareTo(String.valueOf(b.get("name"))));

            Map<String, Object> groupRow = new LinkedHashMap<>(group);
            groupRow.put("consumers_detail", consumersDetail);
            groupsDetail.add(groupRow);

            for (EventStream.PendingEntry p : stream.pendingDetail(groupName, 50)) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", p.id);
                row.put("consumer", p.consumer);
                row.put("idle_ms", p.idleMs);
                row.put("deliveries", p.deliveries);
                row.put("group", groupName);
                pendingRows.add(row);
            }
        }

        state.put("groups", groupsDetail);
        state.put("pending", pendingRows);
        state.put("stats", stream.stats());
        return state;
    }

    // ----- HTTP plumbing --------------------------------------------------

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
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
        if (query == null || query.isEmpty()) return new HashMap<>();
        return parseFormData(query);
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
        if (value == null) sb.append("null");
        else if (value instanceof Boolean) sb.append(value);
        else if (value instanceof Number) sb.append(value);
        else if (value instanceof Map) {
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

    // ----- Misc helpers ---------------------------------------------------

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static long clamp(long value, long min, long max) {
        return Math.max(min, Math.min(max, value));
    }

    private static int parseInt(String value, int fallback) {
        if (value == null || value.isEmpty()) return fallback;
        try { return Integer.parseInt(value); } catch (NumberFormatException e) { return fallback; }
    }

    private static long parseLong(String value, long fallback) {
        if (value == null || value.isEmpty()) return fallback;
        try { return Long.parseLong(value); } catch (NumberFormatException e) { return fallback; }
    }

    private static String nonEmpty(String value, String fallback) {
        return (value == null || value.isEmpty()) ? fallback : value;
    }

    private static Map<String, String> fakePayload(Random rnd) {
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("order_id", "o-" + (1000 + rnd.nextInt(9000)));
        payload.put("customer", CUSTOMERS[rnd.nextInt(CUSTOMERS.length)]);
        double amount = 5.0 + rnd.nextDouble() * 245.0;
        payload.put("amount", String.format(Locale.ROOT, "%.2f", amount));
        return payload;
    }

    private static String renderHtmlPage() {
        return HTML_TEMPLATE
                .replace("__STREAM_KEY__", stream.getStreamKey())
                .replace("__MAXLEN__", Long.toString(stream.getMaxlenApprox()))
                .replace("__CLAIM_IDLE__", Long.toString(stream.getClaimMinIdleMs()));
    }

    // The HTML is functionally identical to the redis-py reference; the
    // only changes are the pill text and the variable-substitution
    // tokens that get rewritten at render time.
    private static final String HTML_TEMPLATE = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Redis Streaming Demo</title>
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
                .badge.ack { background: var(--ok); color: #1d4a2c; }
                .badge.drop { background: var(--warn); color: #6b3220; }
                .badge.idle { background: #e6e0f0; color: #43326a; }
                .group { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
                .group:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
                .consumers { margin-top: 6px; }
                .consumer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
                .consumer-row .name { font-weight: bold; min-width: 90px; }
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
                <div class="pill">Lettuce + com.sun.net.httpserver</div>
                <h1>Redis Streaming Demo</h1>
                <p class="lede">
                  Producers append events to a single Redis Stream
                  (<code>__STREAM_KEY__</code>). Two consumer groups read the same
                  stream independently: <code>notifications</code> shares its work
                  across two consumers, <code>analytics</code> processes the full
                  flow on its own. Acknowledge with <code>XACK</code>, recover
                  crashed deliveries with <code>XAUTOCLAIM</code>, replay any range
                  with <code>XRANGE</code>, and bound retention with <code>XTRIM</code>.
                </p>

                <div class="grid">
                  <section class="panel wide">
                    <h2>Stream state</h2>
                    <div id="stream-view">Loading...</div>
                    <button id="refresh-button" class="secondary">Refresh</button>
                    <button id="reset-button" class="danger">Reset demo (drop stream and re-seed)</button>
                  </section>

                  <section class="panel">
                    <h2>Produce events</h2>
                    <p>Events are appended with <code>XADD</code> with an approximate
                    <code>MAXLEN ~ __MAXLEN__</code> retention cap.</p>
                    <label for="produce-count">How many</label>
                    <input id="produce-count" type="number" min="1" max="500" value="10">
                    <label for="produce-type">Event type</label>
                    <select id="produce-type">
                      <option value="">(random)</option>
                      <option value="order.placed">order.placed</option>
                      <option value="order.paid">order.paid</option>
                      <option value="order.shipped">order.shipped</option>
                      <option value="order.cancelled">order.cancelled</option>
                    </select>
                    <button id="produce-button">Produce</button>
                  </section>

                  <section class="panel">
                    <h2>Replay range (XRANGE)</h2>
                    <p>Reads a slice of history. Replay is independent of any
                    consumer group &mdash; no cursors move, no acks happen.</p>
                    <label for="replay-start">Start ID</label>
                    <input id="replay-start" value="-">
                    <label for="replay-end">End ID</label>
                    <input id="replay-end" value="+">
                    <label for="replay-count">Limit</label>
                    <input id="replay-count" type="number" min="1" max="500" value="20">
                    <button id="replay-button">Replay</button>
                  </section>

                  <section class="panel">
                    <h2>Trim retention (XTRIM)</h2>
                    <p>Cap the stream length. Approximate trimming releases whole
                    macro-nodes, which is much cheaper than exact trimming.</p>
                    <label for="trim-maxlen">MAXLEN ~</label>
                    <input id="trim-maxlen" type="number" min="0" value="100">
                    <button id="trim-button" class="secondary">XTRIM</button>
                  </section>

                  <section class="panel wide">
                    <h2>Consumer groups</h2>
                    <div id="groups-view">Loading...</div>
                  </section>

                  <section class="panel wide">
                    <h2>Pending entries (XPENDING)</h2>
                    <p>Entries delivered to a consumer that haven't been acked yet.
                    Idle time &ge; <code>__CLAIM_IDLE__</code> ms is eligible for
                    <code>XAUTOCLAIM</code>.</p>
                    <div id="pending-view">Loading...</div>
                    <div class="row">
                      <select id="autoclaim-target"></select>
                      <button id="autoclaim-button" class="secondary">XAUTOCLAIM to selected</button>
                    </div>
                  </section>

                  <section class="panel wide">
                    <h2>Last result</h2>
                    <div id="result-view"><p>Produce events, replay a range, or trigger an autoclaim to see results.</p></div>
                  </section>
                </div>

                <div id="status"></div>
              </main>

              <script>
                const streamView = document.getElementById("stream-view");
                const groupsView = document.getElementById("groups-view");
                const pendingView = document.getElementById("pending-view");
                const resultView = document.getElementById("result-view");
                const autoclaimTarget = document.getElementById("autoclaim-target");
                const statusBox = document.getElementById("status");

                function setStatus(message, kind) {
                  statusBox.textContent = message;
                  statusBox.className = kind;
                }

                function escapeHtml(value) {
                  return String(value ?? "").replace(/[&<>"']/g, (c) =>
                    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
                }

                function renderStream(state) {
                  const stream = state.stream || {};
                  const tail = state.tail || [];
                  const tailRows = tail.map((entry) => `
                    <tr>
                      <td class="mono">${escapeHtml(entry.id)}</td>
                      <td>${escapeHtml(entry.fields.type)}</td>
                      <td class="mono">${escapeHtml(entry.fields.order_id || "")}</td>
                      <td>${escapeHtml(entry.fields.amount || "")}</td>
                      <td class="mono">${escapeHtml(entry.fields.customer || "")}</td>
                    </tr>`).join("");
                  streamView.innerHTML = `
                    <dl>
                      <dt>Length</dt><dd>${stream.length ?? 0}</dd>
                      <dt>First ID</dt><dd class="mono">${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
                      <dt>Last ID</dt><dd class="mono">${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
                      <dt>Produced</dt><dd>${state.stats.produced_total ?? 0}</dd>
                      <dt>Acked</dt><dd>${state.stats.acked_total ?? 0}</dd>
                      <dt>Claimed</dt><dd>${state.stats.claimed_total ?? 0}</dd>
                    </dl>
                    <h3>Tail (most recent)</h3>
                    ${tail.length === 0 ? "<p>(empty)</p>" :
                      `<table>
                         <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
                         <tbody>${tailRows}</tbody>
                       </table>`}
                  `;
                }

                function renderGroups(state) {
                  const groups = state.groups || [];
                  if (groups.length === 0) {
                    groupsView.innerHTML = "<p>No groups.</p>";
                    return;
                  }
                  const addWorkerValues = {};
                  let focusedGroup = null;
                  let focusedSelectionStart = null;
                  groupsView.querySelectorAll("input[id^='addworker-']").forEach((input) => {
                    const group = input.id.slice("addworker-".length);
                    addWorkerValues[group] = input.value;
                    if (document.activeElement === input) {
                      focusedGroup = group;
                      focusedSelectionStart = input.selectionStart;
                    }
                  });
                  groupsView.innerHTML = groups.map((g) => {
                    const consumers = (g.consumers_detail || []).map((c) => {
                      const recent = (c.recent || []).slice(0, 3).map((m) => `
                        <span class="mono" title="${escapeHtml(JSON.stringify(m.fields))}">
                          <span class="badge ${m.acked ? "ack" : "drop"}">${m.acked ? "ack" : "drop"}</span>
                          ${escapeHtml(m.id)} ${escapeHtml(m.type)}
                        </span>`).join(" &nbsp; ");
                      const badges = [];
                      if (c.paused) badges.push('<span class="badge idle">paused</span>');
                      if (c.crash_queued > 0) badges.push(`<span class="badge drop">will drop ${c.crash_queued}</span>`);
                      return `
                        <div class="consumer-row">
                          <span class="name">${escapeHtml(c.name)}</span>
                          <span class="mono">pending=${c.pending} idle=${c.idle_ms}ms processed=${c.processed} reaped=${c.reaped ?? 0}</span>
                          ${badges.join(" ")}
                          <button class="small secondary" data-action="crash" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Crash next 3</button>
                          <button class="small danger" data-action="remove" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Remove</button>
                        </div>
                        ${recent ? `<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">${recent}</div>` : ""}`;
                    }).join("");
                    return `
                      <div class="group">
                        <h3>${escapeHtml(g.name)}
                          <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                            pending=${g.pending} lag=${g.lag ?? "?"} last_delivered=${escapeHtml(g.last_delivered_id)}
                          </span>
                        </h3>
                        <div class="consumers">${consumers || "<em>(no consumers)</em>"}</div>
                        <div class="row" style="max-width: 360px; margin-top: 6px;">
                          <input id="addworker-${escapeHtml(g.name)}" placeholder="new-worker-name">
                          <button class="small" data-action="add" data-group="${escapeHtml(g.name)}">Add consumer</button>
                        </div>
                      </div>`;
                  }).join("");

                  for (const [group, value] of Object.entries(addWorkerValues)) {
                    const input = document.getElementById(`addworker-${group}`);
                    if (input) input.value = value;
                  }
                  if (focusedGroup) {
                    const input = document.getElementById(`addworker-${focusedGroup}`);
                    if (input) {
                      input.focus();
                      if (focusedSelectionStart !== null) {
                        try { input.setSelectionRange(focusedSelectionStart, focusedSelectionStart); } catch (_) {}
                      }
                    }
                  }

                  const previous = autoclaimTarget.value;
                  const options = [];
                  for (const g of groups) {
                    for (const c of g.consumers_detail || []) {
                      options.push(`<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} → ${escapeHtml(c.name)}</option>`);
                    }
                  }
                  autoclaimTarget.innerHTML = options.join("");
                  if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
                    autoclaimTarget.value = previous;
                  }
                }

                function renderPending(state) {
                  const rows = (state.pending || []).map((p) => `
                    <tr>
                      <td class="mono">${escapeHtml(p.group)}</td>
                      <td class="mono">${escapeHtml(p.consumer)}</td>
                      <td class="mono">${escapeHtml(p.id)}</td>
                      <td>${p.idle_ms} ms</td>
                      <td>${p.deliveries}</td>
                    </tr>`).join("");
                  pendingView.innerHTML = (state.pending || []).length === 0
                    ? "<p>(no entries currently pending)</p>"
                    : `<table>
                         <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
                         <tbody>${rows}</tbody>
                       </table>`;
                }

                async function refresh() {
                  const r = await fetch("/state");
                  const state = await r.json();
                  renderStream(state);
                  renderGroups(state);
                  renderPending(state);
                }

                document.getElementById("refresh-button").addEventListener("click", refresh);

                document.getElementById("produce-button").addEventListener("click", async () => {
                  const count = parseInt(document.getElementById("produce-count").value, 10) || 1;
                  const type = document.getElementById("produce-type").value;
                  const body = new URLSearchParams({ count, type });
                  const r = await fetch("/produce", { method: "POST", body });
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Produce failed.", "error"); return; }
                  setStatus(`Produced ${d.produced} event(s).`, "ok");
                  resultView.innerHTML = `<p>Produced <strong>${d.produced}</strong> events. New IDs:</p>
                    <pre class="mono">${d.ids.map(escapeHtml).join("\\n")}</pre>`;
                  await refresh();
                });

                document.getElementById("replay-button").addEventListener("click", async () => {
                  const params = new URLSearchParams({
                    start: document.getElementById("replay-start").value,
                    end: document.getElementById("replay-end").value,
                    count: document.getElementById("replay-count").value,
                  });
                  const r = await fetch(`/replay?${params.toString()}`);
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
                  setStatus(`Replayed ${d.entries.length} entry/entries (XRANGE).`, "ok");
                  const rows = d.entries.map((e) => `
                    <tr>
                      <td class="mono">${escapeHtml(e.id)}</td>
                      <td>${escapeHtml(e.fields.type)}</td>
                      <td class="mono">${escapeHtml(e.fields.order_id || "")}</td>
                      <td>${escapeHtml(e.fields.amount || "")}</td>
                    </tr>`).join("");
                  resultView.innerHTML = `
                    <p>XRANGE ${escapeHtml(d.start)} → ${escapeHtml(d.end)} (limit ${d.limit})</p>
                    ${d.entries.length === 0 ? "<p>(no entries)</p>" :
                      `<table>
                        <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
                        <tbody>${rows}</tbody>
                       </table>`}`;
                });

                document.getElementById("trim-button").addEventListener("click", async () => {
                  const maxlen = document.getElementById("trim-maxlen").value;
                  const body = new URLSearchParams({ maxlen });
                  const r = await fetch("/trim", { method: "POST", body });
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
                  setStatus(`XTRIM removed ${d.deleted} entr${d.deleted === 1 ? "y" : "ies"}.`, "ok");
                  await refresh();
                });

                document.getElementById("autoclaim-button").addEventListener("click", async () => {
                  const target = autoclaimTarget.value;
                  if (!target) { setStatus("No consumer selected.", "error"); return; }
                  const [group, consumer] = target.split("|");
                  const body = new URLSearchParams({ group, consumer });
                  const r = await fetch("/autoclaim", { method: "POST", body });
                  const d = await r.json();
                  if (!r.ok) { setStatus(d.error || "Autoclaim failed.", "error"); return; }
                  const deletedCount = (d.deleted || []).length;
                  const msg = deletedCount
                    ? `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}; ${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.`
                    : `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}.`;
                  setStatus(msg, "ok");
                  const deletedBlock = deletedCount
                    ? `<h3>Deleted IDs (payload already trimmed &mdash; removed from PEL by Redis)</h3>
                       <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
                       <p>In production these would also be routed to a dead-letter store for offline inspection.</p>`
                    : "";
                  resultView.innerHTML = `
                    <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
                       into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
                       claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
                       <strong>${d.processed}</strong>, and acked them.</p>
                    ${d.claimed === 0 ? "<p>(nothing was idle enough yet &mdash; try again after a few seconds)</p>" : ""}
                    ${deletedBlock}`;
                  await refresh();
                });

                document.getElementById("reset-button").addEventListener("click", async () => {
                  if (!confirm("Drop the stream and re-seed the default groups?")) return;
                  const r = await fetch("/reset", { method: "POST" });
                  const d = await r.json();
                  setStatus(`Reset. ${d.consumers} consumer(s) re-seeded.`, "ok");
                  await refresh();
                });

                document.body.addEventListener("click", async (ev) => {
                  const t = ev.target.closest("button[data-action]");
                  if (!t) return;
                  const action = t.dataset.action;
                  const group = t.dataset.group;
                  if (action === "crash") {
                    const name = t.dataset.name;
                    const body = new URLSearchParams({ group, name, count: "3" });
                    await fetch("/crash", { method: "POST", body });
                    setStatus(`Queued next 3 deliveries to ${group}/${name} for drop.`, "ok");
                    await refresh();
                  } else if (action === "remove") {
                    const name = t.dataset.name;
                    if (!confirm(`Remove ${group}/${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.`)) return;
                    const body = new URLSearchParams({ group, name });
                    const r = await fetch("/remove-worker", { method: "POST", body });
                    const d = await r.json();
                    if (!d.removed) {
                      setStatus(d.message || `Could not remove ${group}/${name} (${d.reason || "unknown"}).`, "error");
                    } else if (d.handed_over_count > 0) {
                      setStatus(`Removed ${group}/${name}. Handed ${d.handed_over_count} pending entr${d.handed_over_count === 1 ? "y" : "ies"} over to ${d.handed_over_to}.`, "ok");
                    } else {
                      setStatus(`Removed ${group}/${name} (no pending entries to hand over).`, "ok");
                    }
                    await refresh();
                  } else if (action === "add") {
                    const input = document.getElementById(`addworker-${group}`);
                    const name = (input.value || "").trim();
                    if (!name) { setStatus("Enter a consumer name.", "error"); return; }
                    const body = new URLSearchParams({ group, name });
                    const r = await fetch("/add-worker", { method: "POST", body });
                    const d = await r.json();
                    if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
                    input.value = "";
                    setStatus(`Added ${group}/${name}.`, "ok");
                    await refresh();
                  }
                });

                refresh();
                setInterval(refresh, 1500);
              </script>
            </body>
            </html>
            """;
}
