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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Redis job-queue demo server (Lettuce + JDK HttpServer).
 *
 * Run this class and visit http://localhost:8794 to enqueue jobs, watch a
 * pool of workers drain the queue, simulate worker crashes, and trigger a
 * reclaim sweep that pulls timed-out jobs back to pending.
 */
public class DemoServer {

    private static RedisClient redisClient;
    private static StatefulRedisConnection<String, String> connection;
    private static RedisJobQueue queue;
    private static WorkerPool pool;

    public static void main(String[] args) {
        String host = "127.0.0.1";
        int port = 8794;
        String redisHost = "localhost";
        int redisPort = 6379;
        long visibilityMs = 5000;
        int initialWorkers = 0;
        String queueName = "jobs";

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--host":          host = args[++i]; break;
                case "--port":          port = Integer.parseInt(args[++i]); break;
                case "--redis-host":    redisHost = args[++i]; break;
                case "--redis-port":    redisPort = Integer.parseInt(args[++i]); break;
                case "--visibility-ms": visibilityMs = Long.parseLong(args[++i]); break;
                case "--workers":       initialWorkers = Integer.parseInt(args[++i]); break;
                case "--queue-name":    queueName = args[++i]; break;
                default: break;
            }
        }

        try {
            RedisURI uri = RedisURI.Builder.redis(redisHost, redisPort).build();
            redisClient = RedisClient.create(uri);
            connection = redisClient.connect();
            connection.sync().ping();
            queue = new RedisJobQueue(connection, queueName, visibilityMs, 300, 50, 3);
            pool = new WorkerPool(queue, 0, 400, 0.0, 0.0);
            if (initialWorkers > 0) {
                pool.resize(initialWorkers);
                pool.start();
            }
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n", redisHost, redisPort, e.getMessage());
            System.exit(1);
            return;
        }

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
            server.setExecutor(Executors.newFixedThreadPool(16));
            server.createContext("/", new RootHandler());
            server.createContext("/jobs", new JobsHandler());
            server.createContext("/stats", new StatsHandler());
            server.createContext("/enqueue", new EnqueueHandler());
            server.createContext("/workers/start", new WorkersStartHandler());
            server.createContext("/workers/stop", new WorkersStopHandler());
            server.createContext("/workers/configure", new WorkersConfigureHandler());
            server.createContext("/reclaim", new ReclaimHandler());
            server.createContext("/reset", new ResetHandler());
            server.start();

            System.out.printf("Redis job-queue demo server listening on http://%s:%d%n", host, port);
            System.out.printf("Using Redis at %s:%d%n", redisHost, redisPort);
            System.out.printf("Visibility timeout: %d ms%n", visibilityMs);

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                pool.stop();
                try { connection.close(); } catch (Exception ignored) {}
                try { redisClient.shutdown(); } catch (Exception ignored) {}
                server.stop(0);
            }));
        } catch (IOException e) {
            System.err.printf("Server error: %s%n", e.getMessage());
            System.exit(1);
        }
    }

    static class RootHandler implements HttpHandler {
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
            sendResponse(exchange, 200, "text/html; charset=utf-8", htmlPage(queue.getVisibilityMs()));
        }
    }

    static class JobsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("pending", summarizeAll(queue.listPending()));
            body.put("processing", summarizeAll(queue.listProcessing()));
            body.put("completed", summarizeAll(firstN(queue.listCompleted(), 10)));
            body.put("failed", summarizeAll(firstN(queue.listFailed(), 10)));
            sendJson(exchange, 200, body);
        }
    }

    static class StatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            sendJson(exchange, 200, buildStats());
        }
    }

    static class EnqueueHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> params = parseFormData(readRequestBody(exchange));
            String kind = params.getOrDefault("kind", "email");
            String recipient = params.getOrDefault("recipient", "");
            if (recipient.isEmpty()) recipient = "user@example.com";

            int count;
            try {
                count = Math.max(1, Math.min(50, Integer.parseInt(params.getOrDefault("count", "1"))));
            } catch (NumberFormatException ex) {
                count = 1;
            }

            List<String> ids = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("kind", kind);
                payload.put("recipient", recipient);
                payload.put("n", i + 1);
                ids.add(queue.enqueue(payload));
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("enqueued", ids);
            body.put("stats", buildStats());
            sendJson(exchange, 200, body);
        }
    }

    static class WorkersStartHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> params = parseFormData(readRequestBody(exchange));

            int size = clampInt(params.get("size"), 2, 0, 8);
            int latency = clampInt(params.get("work_latency_ms"), 400, 0, Integer.MAX_VALUE);
            double failRate = clampDouble(params.get("fail_rate"), 0.0, 0.0, 1.0);
            double hangRate = clampDouble(params.get("hang_rate"), 0.0, 0.0, 1.0);

            pool.configure(latency, failRate, hangRate);
            pool.resize(size);
            pool.start();

            sendJson(exchange, 200, buildStats());
        }
    }

    static class WorkersStopHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            pool.stop();
            sendJson(exchange, 200, buildStats());
        }
    }

    static class WorkersConfigureHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> params = parseFormData(readRequestBody(exchange));
            Integer latency = null;
            Double failRate = null;
            Double hangRate = null;
            if (params.containsKey("work_latency_ms")) {
                try { latency = Integer.parseInt(params.get("work_latency_ms")); } catch (NumberFormatException ignored) {}
            }
            if (params.containsKey("fail_rate")) {
                try { failRate = Double.parseDouble(params.get("fail_rate")); } catch (NumberFormatException ignored) {}
            }
            if (params.containsKey("hang_rate")) {
                try { hangRate = Double.parseDouble(params.get("hang_rate")); } catch (NumberFormatException ignored) {}
            }
            pool.configure(latency, failRate, hangRate);
            sendJson(exchange, 200, buildStats());
        }
    }

    static class ReclaimHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            List<String> reclaimed = queue.reclaimStuck();
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("reclaimed", reclaimed);
            body.put("stats", buildStats());
            sendJson(exchange, 200, body);
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "application/json", "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            pool.stop();
            try { Thread.sleep(100); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
            queue.purge();
            pool.resetProcessed();
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("stats", buildStats());
            sendJson(exchange, 200, body);
        }
    }

    private static int clampInt(String raw, int def, int min, int max) {
        if (raw == null) return def;
        try {
            int v = Integer.parseInt(raw);
            return Math.max(min, Math.min(max, v));
        } catch (NumberFormatException ex) {
            return def;
        }
    }

    private static double clampDouble(String raw, double def, double min, double max) {
        if (raw == null) return def;
        try {
            double v = Double.parseDouble(raw);
            return Math.max(min, Math.min(max, v));
        } catch (NumberFormatException ex) {
            return def;
        }
    }

    private static List<Map<String, Object>> summarizeAll(List<String> ids) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (String id : ids) {
            out.add(summarizeJob(id));
        }
        return out;
    }

    private static List<String> firstN(List<String> list, int n) {
        return list.subList(0, Math.min(n, list.size()));
    }

    private static Map<String, Object> summarizeJob(String jobId) {
        Map<String, Object> meta = queue.getJob(jobId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", jobId);
        if (meta == null) {
            out.put("status", "unknown");
            out.put("attempts", 0);
            out.put("payload", new LinkedHashMap<>());
            return out;
        }
        out.put("status", String.valueOf(meta.getOrDefault("status", "unknown")));
        int attempts = 0;
        Object rawAttempts = meta.get("attempts");
        if (rawAttempts != null) {
            try { attempts = Integer.parseInt(rawAttempts.toString()); }
            catch (NumberFormatException ignored) {}
        }
        out.put("attempts", attempts);
        out.put("payload", meta.getOrDefault("payload", new LinkedHashMap<>()));
        if (meta.containsKey("result")) {
            out.put("result", meta.get("result"));
        }
        if (meta.containsKey("last_error")) {
            out.put("last_error", meta.get("last_error"));
        }
        return out;
    }

    private static Map<String, Object> buildStats() {
        Map<String, Object> stats = new LinkedHashMap<>(queue.stats());
        stats.put("workers_running", pool.running());
        stats.put("worker_processed_total", pool.totalProcessed());
        stats.put("work_latency_ms", pool.getWorkLatencyMs());
        stats.put("fail_rate", pool.getFailRate());
        stats.put("hang_rate", pool.getHangRate());
        return stats;
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
            if (kv.length == 2) {
                params.put(
                        URLDecoder.decode(kv[0], StandardCharsets.UTF_8),
                        URLDecoder.decode(kv[1], StandardCharsets.UTF_8)
                );
            } else if (kv.length == 1 && !kv[0].isEmpty()) {
                params.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8), "");
            }
        }
        return params;
    }

    private static void sendJson(HttpExchange exchange, int status, Map<String, Object> body) throws IOException {
        sendResponse(exchange, status, "application/json", RedisJobQueue.JsonUtil.toJson(body));
    }

    private static void sendResponse(HttpExchange exchange, int status, String contentType, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String htmlPage(long visibilityMs) {
        return ("<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
                "  <title>Redis Job Queue Demo</title>\n" +
                "  <style>\n" +
                "    :root {\n" +
                "      --bg: #f6f1e8;\n" +
                "      --panel: #fffaf2;\n" +
                "      --ink: #1f2933;\n" +
                "      --accent: #b8572f;\n" +
                "      --accent-dark: #8f421f;\n" +
                "      --muted: #5d6b75;\n" +
                "      --line: #e7d9c6;\n" +
                "      --ok: #d7f0de;\n" +
                "      --warn: #f7dfd7;\n" +
                "      --hit: #c9e7d2;\n" +
                "      --miss: #f5d6c6;\n" +
                "    }\n" +
                "    * { box-sizing: border-box; }\n" +
                "    body {\n" +
                "      margin: 0;\n" +
                "      font-family: Georgia, \"Times New Roman\", serif;\n" +
                "      color: var(--ink);\n" +
                "      background:\n" +
                "        radial-gradient(circle at top left, #fff7ea, transparent 32rem),\n" +
                "        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);\n" +
                "      min-height: 100vh;\n" +
                "    }\n" +
                "    main {\n" +
                "      max-width: 1080px;\n" +
                "      margin: 0 auto;\n" +
                "      padding: 48px 20px 72px;\n" +
                "    }\n" +
                "    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }\n" +
                "    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }\n" +
                "    .grid {\n" +
                "      display: grid;\n" +
                "      gap: 20px;\n" +
                "      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));\n" +
                "      margin-top: 28px;\n" +
                "    }\n" +
                "    .panel {\n" +
                "      background: rgba(255, 250, 242, 0.92);\n" +
                "      border: 1px solid var(--line);\n" +
                "      border-radius: 18px;\n" +
                "      padding: 22px;\n" +
                "      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);\n" +
                "    }\n" +
                "    .panel h2 { margin-top: 0; margin-bottom: 10px; }\n" +
                "    .pill {\n" +
                "      display: inline-block;\n" +
                "      border-radius: 999px;\n" +
                "      background: #efe2cf;\n" +
                "      color: var(--accent-dark);\n" +
                "      padding: 6px 10px;\n" +
                "      font-size: 0.9rem;\n" +
                "      margin-bottom: 12px;\n" +
                "    }\n" +
                "    label { display: block; font-weight: bold; margin: 12px 0 6px; }\n" +
                "    input, select {\n" +
                "      width: 100%;\n" +
                "      padding: 10px 12px;\n" +
                "      border-radius: 10px;\n" +
                "      border: 1px solid #cfbca6;\n" +
                "      font: inherit;\n" +
                "      background: white;\n" +
                "    }\n" +
                "    button {\n" +
                "      appearance: none;\n" +
                "      border: 0;\n" +
                "      border-radius: 999px;\n" +
                "      background: var(--accent);\n" +
                "      color: white;\n" +
                "      padding: 11px 18px;\n" +
                "      font: inherit;\n" +
                "      cursor: pointer;\n" +
                "      margin-right: 8px;\n" +
                "      margin-top: 12px;\n" +
                "    }\n" +
                "    button.secondary { background: #38424a; }\n" +
                "    button:hover { background: var(--accent-dark); }\n" +
                "    button.secondary:hover { background: #20282e; }\n" +
                "    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }\n" +
                "    dt { font-weight: bold; }\n" +
                "    dd { margin: 0; word-break: break-word; }\n" +
                "    .badge {\n" +
                "      display: inline-block;\n" +
                "      border-radius: 6px;\n" +
                "      padding: 3px 8px;\n" +
                "      font-size: 0.85rem;\n" +
                "      font-weight: bold;\n" +
                "    }\n" +
                "    .badge.pending { background: #f4e4c1; color: #5e4514; }\n" +
                "    .badge.processing { background: var(--miss); color: #6b3220; }\n" +
                "    .badge.completed { background: var(--hit); color: #1d4a2c; }\n" +
                "    .badge.failed { background: #f0c2bc; color: #6b1f1c; }\n" +
                "    .job-list { list-style: none; padding: 0; margin: 8px 0 0; max-height: 230px; overflow-y: auto; }\n" +
                "    .job-list li {\n" +
                "      border: 1px solid var(--line);\n" +
                "      border-radius: 10px;\n" +
                "      padding: 8px 10px;\n" +
                "      margin-bottom: 6px;\n" +
                "      background: #fffdf8;\n" +
                "      font-size: 0.92rem;\n" +
                "    }\n" +
                "    .job-list li .meta { color: var(--muted); font-size: 0.85rem; }\n" +
                "    pre {\n" +
                "      background: #f3eadc;\n" +
                "      border-radius: 12px;\n" +
                "      padding: 14px;\n" +
                "      overflow-x: auto;\n" +
                "      margin: 0;\n" +
                "      font-size: 0.85rem;\n" +
                "    }\n" +
                "    #status {\n" +
                "      margin-top: 20px;\n" +
                "      padding: 14px 16px;\n" +
                "      border-radius: 14px;\n" +
                "      display: none;\n" +
                "    }\n" +
                "    #status.ok { display: block; background: var(--ok); }\n" +
                "    #status.error { display: block; background: var(--warn); }\n" +
                "    @media (max-width: 600px) {\n" +
                "      main { padding-top: 28px; }\n" +
                "      button { width: 100%; }\n" +
                "    }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <main>\n" +
                "    <div class=\"pill\">Lettuce + JDK HttpServer</div>\n" +
                "    <h1>Redis Job Queue Demo</h1>\n" +
                "    <p class=\"lede\">\n" +
                "      Enqueue background jobs and watch a pool of workers drain them through Redis.\n" +
                "      Pending jobs sit in a list; each worker uses <code>BLMOVE</code> to atomically\n" +
                "      claim a job and move it to a processing list. Completed jobs move to a short\n" +
                "      history. If a worker hangs past the __VISIBILITY__ ms visibility timeout,\n" +
                "      the reclaimer moves its job back to pending so no work is lost.\n" +
                "    </p>\n" +
                "\n" +
                "    <div class=\"grid\">\n" +
                "      <section class=\"panel\">\n" +
                "        <h2>Enqueue jobs</h2>\n" +
                "        <label for=\"job-kind\">Kind</label>\n" +
                "        <select id=\"job-kind\">\n" +
                "          <option value=\"email\">email</option>\n" +
                "          <option value=\"webhook\">webhook</option>\n" +
                "          <option value=\"thumbnail\">thumbnail</option>\n" +
                "          <option value=\"invoice\">invoice</option>\n" +
                "        </select>\n" +
                "        <label for=\"job-recipient\">Recipient / target</label>\n" +
                "        <input id=\"job-recipient\" value=\"user@example.com\">\n" +
                "        <label for=\"job-count\">How many</label>\n" +
                "        <input id=\"job-count\" type=\"number\" value=\"5\" min=\"1\" max=\"50\">\n" +
                "        <button id=\"enqueue-button\">Enqueue</button>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\">\n" +
                "        <h2>Worker pool</h2>\n" +
                "        <label for=\"worker-size\">Workers</label>\n" +
                "        <input id=\"worker-size\" type=\"number\" value=\"2\" min=\"0\" max=\"8\">\n" +
                "        <label for=\"work-latency\">Work latency (ms)</label>\n" +
                "        <input id=\"work-latency\" type=\"number\" value=\"400\" min=\"0\" max=\"5000\">\n" +
                "        <label for=\"fail-rate\">Failure rate (0–1)</label>\n" +
                "        <input id=\"fail-rate\" type=\"number\" step=\"0.05\" min=\"0\" max=\"1\" value=\"0\">\n" +
                "        <label for=\"hang-rate\">Hang rate (simulated crash)</label>\n" +
                "        <input id=\"hang-rate\" type=\"number\" step=\"0.05\" min=\"0\" max=\"1\" value=\"0\">\n" +
                "        <button id=\"start-button\">Start / apply</button>\n" +
                "        <button id=\"stop-button\" class=\"secondary\">Stop workers</button>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\">\n" +
                "        <h2>Reclaim &amp; reset</h2>\n" +
                "        <p>Reclaim moves any job sitting in the processing list past the\n" +
                "        __VISIBILITY__ ms visibility timeout back to pending.</p>\n" +
                "        <button id=\"reclaim-button\">Run reclaim sweep</button>\n" +
                "        <button id=\"reset-button\" class=\"secondary\">Reset queue</button>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\">\n" +
                "        <h2>Queue stats</h2>\n" +
                "        <div id=\"stats-view\">Loading...</div>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\" style=\"grid-column: 1 / -1;\">\n" +
                "        <h2>Pending <span id=\"pending-count\" class=\"badge pending\">0</span></h2>\n" +
                "        <ul id=\"pending-list\" class=\"job-list\"></ul>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\" style=\"grid-column: 1 / -1;\">\n" +
                "        <h2>Processing <span id=\"processing-count\" class=\"badge processing\">0</span></h2>\n" +
                "        <ul id=\"processing-list\" class=\"job-list\"></ul>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\">\n" +
                "        <h2>Recent completed <span id=\"completed-count\" class=\"badge completed\">0</span></h2>\n" +
                "        <ul id=\"completed-list\" class=\"job-list\"></ul>\n" +
                "      </section>\n" +
                "\n" +
                "      <section class=\"panel\">\n" +
                "        <h2>Recent failed <span id=\"failed-count\" class=\"badge failed\">0</span></h2>\n" +
                "        <ul id=\"failed-list\" class=\"job-list\"></ul>\n" +
                "      </section>\n" +
                "    </div>\n" +
                "\n" +
                "    <div id=\"status\"></div>\n" +
                "  </main>\n" +
                "\n" +
                "  <script>\n" +
                "    const statusBox = document.getElementById(\"status\");\n" +
                "\n" +
                "    function setStatus(message, kind) {\n" +
                "      statusBox.textContent = message;\n" +
                "      statusBox.className = kind;\n" +
                "    }\n" +
                "\n" +
                "    function escapeHtml(value) {\n" +
                "      return String(value ?? \"\").replace(/[&<>\"']/g, (c) => ({\n" +
                "        \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\",\n" +
                "      })[c]);\n" +
                "    }\n" +
                "\n" +
                "    function renderStats(stats) {\n" +
                "      const view = document.getElementById(\"stats-view\");\n" +
                "      if (!stats) { view.textContent = \"(no data)\"; return; }\n" +
                "      view.innerHTML = `\n" +
                "        <dl>\n" +
                "          <dt>Workers running</dt><dd>${stats.workers_running}</dd>\n" +
                "          <dt>Pending depth</dt><dd>${stats.pending_depth}</dd>\n" +
                "          <dt>Processing depth</dt><dd>${stats.processing_depth}</dd>\n" +
                "          <dt>Enqueued total</dt><dd>${stats.enqueued_total}</dd>\n" +
                "          <dt>Completed total</dt><dd>${stats.completed_total}</dd>\n" +
                "          <dt>Failed total</dt><dd>${stats.failed_total}</dd>\n" +
                "          <dt>Reclaimed total</dt><dd>${stats.reclaimed_total}</dd>\n" +
                "          <dt>Worker processed</dt><dd>${stats.worker_processed_total}</dd>\n" +
                "          <dt>Visibility timeout</dt><dd>${stats.visibility_ms} ms</dd>\n" +
                "          <dt>Work latency</dt><dd>${stats.work_latency_ms} ms</dd>\n" +
                "          <dt>Failure rate</dt><dd>${stats.fail_rate}</dd>\n" +
                "          <dt>Hang rate</dt><dd>${stats.hang_rate}</dd>\n" +
                "        </dl>\n" +
                "      `;\n" +
                "    }\n" +
                "\n" +
                "    function renderJobList(elementId, jobs, countId, badgeClass) {\n" +
                "      const list = document.getElementById(elementId);\n" +
                "      const count = document.getElementById(countId);\n" +
                "      count.textContent = jobs.length;\n" +
                "      count.className = `badge ${badgeClass}`;\n" +
                "      if (!jobs.length) { list.innerHTML = \"<li><span class=meta>(empty)</span></li>\"; return; }\n" +
                "      list.innerHTML = jobs.map((job) => {\n" +
                "        const payload = job.payload && typeof job.payload === \"object\"\n" +
                "          ? JSON.stringify(job.payload)\n" +
                "          : escapeHtml(job.payload || \"\");\n" +
                "        const extra = job.last_error\n" +
                "          ? ` &middot; <span class=meta>error: ${escapeHtml(job.last_error)}</span>`\n" +
                "          : job.result\n" +
                "            ? ` &middot; <span class=meta>result: ${escapeHtml(typeof job.result === \"object\" ? JSON.stringify(job.result) : job.result)}</span>`\n" +
                "            : \"\";\n" +
                "        return `<li>\n" +
                "          <strong>${escapeHtml(job.id)}</strong>\n" +
                "          <span class=badge ${badgeClass}>${escapeHtml(job.status)}</span>\n" +
                "          <span class=meta>attempts: ${job.attempts}</span>\n" +
                "          ${extra}\n" +
                "          <div class=meta>${escapeHtml(payload)}</div>\n" +
                "        </li>`;\n" +
                "      }).join(\"\");\n" +
                "    }\n" +
                "\n" +
                "    async function refresh() {\n" +
                "      const [jobsResponse, statsResponse] = await Promise.all([\n" +
                "        fetch(\"/jobs\"),\n" +
                "        fetch(\"/stats\"),\n" +
                "      ]);\n" +
                "      const jobs = await jobsResponse.json();\n" +
                "      const stats = await statsResponse.json();\n" +
                "      renderStats(stats);\n" +
                "      renderJobList(\"pending-list\", jobs.pending, \"pending-count\", \"pending\");\n" +
                "      renderJobList(\"processing-list\", jobs.processing, \"processing-count\", \"processing\");\n" +
                "      renderJobList(\"completed-list\", jobs.completed, \"completed-count\", \"completed\");\n" +
                "      renderJobList(\"failed-list\", jobs.failed, \"failed-count\", \"failed\");\n" +
                "    }\n" +
                "\n" +
                "    document.getElementById(\"enqueue-button\").addEventListener(\"click\", async () => {\n" +
                "      const body = new URLSearchParams({\n" +
                "        kind: document.getElementById(\"job-kind\").value,\n" +
                "        recipient: document.getElementById(\"job-recipient\").value,\n" +
                "        count: document.getElementById(\"job-count\").value,\n" +
                "      });\n" +
                "      const response = await fetch(\"/enqueue\", { method: \"POST\", body });\n" +
                "      const data = await response.json();\n" +
                "      if (!response.ok) { setStatus(data.error || \"Enqueue failed.\", \"error\"); return; }\n" +
                "      setStatus(`Enqueued ${data.enqueued.length} job(s).`, \"ok\");\n" +
                "      refresh();\n" +
                "    });\n" +
                "\n" +
                "    document.getElementById(\"start-button\").addEventListener(\"click\", async () => {\n" +
                "      const body = new URLSearchParams({\n" +
                "        size: document.getElementById(\"worker-size\").value,\n" +
                "        work_latency_ms: document.getElementById(\"work-latency\").value,\n" +
                "        fail_rate: document.getElementById(\"fail-rate\").value,\n" +
                "        hang_rate: document.getElementById(\"hang-rate\").value,\n" +
                "      });\n" +
                "      await fetch(\"/workers/start\", { method: \"POST\", body });\n" +
                "      setStatus(\"Workers started.\", \"ok\");\n" +
                "      refresh();\n" +
                "    });\n" +
                "\n" +
                "    document.getElementById(\"stop-button\").addEventListener(\"click\", async () => {\n" +
                "      await fetch(\"/workers/stop\", { method: \"POST\" });\n" +
                "      setStatus(\"Workers stopped.\", \"ok\");\n" +
                "      refresh();\n" +
                "    });\n" +
                "\n" +
                "    document.getElementById(\"reclaim-button\").addEventListener(\"click\", async () => {\n" +
                "      const response = await fetch(\"/reclaim\", { method: \"POST\" });\n" +
                "      const data = await response.json();\n" +
                "      setStatus(`Reclaimed ${data.reclaimed.length} job(s).`, \"ok\");\n" +
                "      refresh();\n" +
                "    });\n" +
                "\n" +
                "    document.getElementById(\"reset-button\").addEventListener(\"click\", async () => {\n" +
                "      await fetch(\"/reset\", { method: \"POST\" });\n" +
                "      setStatus(\"Queue reset.\", \"ok\");\n" +
                "      refresh();\n" +
                "    });\n" +
                "\n" +
                "    refresh();\n" +
                "    setInterval(refresh, 800);\n" +
                "  </script>\n" +
                "</body>\n" +
                "</html>\n").replace("__VISIBILITY__", Long.toString(visibilityMs));
    }
}
