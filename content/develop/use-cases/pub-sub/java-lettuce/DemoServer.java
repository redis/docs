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
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.concurrent.Executors;

/**
 * Redis pub/sub demo server using Lettuce.
 *
 * <p>Run this file and visit http://localhost:8099 to publish messages to
 * named channels, watch in-process subscribers (exact-match and pattern)
 * receive them in real time, and inspect Redis' own view of the active
 * channels via PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB NUMPAT.
 */
public class DemoServer {

    /** A small set of seed subscriptions so the demo has something to show on first load. */
    private static final List<Map<String, String>> DEFAULT_SUBSCRIPTIONS = Arrays.asList(
            seed("orders-listener", "channel", "orders:new"),
            seed("billing-listener", "channel", "billing:invoice"),
            seed("all-notifications", "pattern", "notifications:*"));

    private static Map<String, String> seed(String name, String kind, String target) {
        Map<String, String> m = new HashMap<>();
        m.put("name", name);
        m.put("kind", kind);
        m.put("target", target);
        return m;
    }

    private static RedisPubSubHub hub;
    private static RedisClient redisClient;
    private static StatefulRedisConnection<String, String> connection;

    public static void main(String[] args) {
        int port = 8099;
        String host = "127.0.0.1";
        String redisHost = "localhost";
        int redisPort = 6379;

        for (int i = 0; i < args.length; i++) {
            switch (args[i]) {
                case "--port":
                    port = Integer.parseInt(args[++i]);
                    break;
                case "--host":
                    host = args[++i];
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
            redisClient = RedisClient.create(
                    RedisURI.builder().withHost(redisHost).withPort(redisPort).build());
            connection = redisClient.connect();
            connection.sync().ping();
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n",
                    redisHost, redisPort, e.getMessage());
            System.exit(1);
        }

        hub = new RedisPubSubHub(redisClient, connection);
        seedDefaultSubscriptions(hub);

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
            server.createContext("/", new IndexHandler());
            server.createContext("/state", new StateHandler());
            server.createContext("/publish", new PublishHandler());
            server.createContext("/subscribe", new SubscribeHandler());
            server.createContext("/unsubscribe", new UnsubscribeHandler());
            server.createContext("/reset", new ResetHandler());
            server.setExecutor(Executors.newFixedThreadPool(16));

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try { hub.shutdown(); } catch (Exception ignored) {}
                try { if (connection != null) connection.close(); } catch (Exception ignored) {}
                try { if (redisClient != null) redisClient.shutdown(); } catch (Exception ignored) {}
            }));

            server.start();
            System.out.printf("Redis pub/sub demo server listening on http://%s:%d%n", host, port);
            System.out.printf("Using Redis at %s:%d%n", redisHost, redisPort);
            System.out.printf("Seeded %d default subscription(s)%n", DEFAULT_SUBSCRIPTIONS.size());
        } catch (IOException e) {
            System.err.println("Failed to start server: " + e.getMessage());
            System.exit(1);
        }
    }

    private static void seedDefaultSubscriptions(RedisPubSubHub hub) {
        for (Map<String, String> entry : DEFAULT_SUBSCRIPTIONS) {
            try {
                if ("pattern".equals(entry.get("kind"))) {
                    hub.psubscribe(entry.get("name"), Collections.singletonList(entry.get("target")));
                } else {
                    hub.subscribe(entry.get("name"), Collections.singletonList(entry.get("target")));
                }
            } catch (IllegalArgumentException ignored) {
                // Already present from a previous reset cycle.
            }
        }
    }

    // ---------- Handlers ----------

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
            byte[] body = htmlPage().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, body.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(body);
            }
        }
    }

    static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            sendJson(exchange, 200, RedisPubSubHub.JsonCodec.encode(buildState()));
        }
    }

    static class PublishHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> params = readForm(exchange);
            String channel = trim(params.get("channel"));
            String body = trim(params.get("message"));
            int count;
            try {
                count = Math.max(1, Math.min(20, Integer.parseInt(params.getOrDefault("count", "1"))));
            } catch (NumberFormatException e) {
                count = 1;
            }
            if (channel.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"channel is required\"}");
                return;
            }
            if (body.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"message is required\"}");
                return;
            }

            // Wrap the user's text in a small envelope so the subscriber
            // side has a stable shape (body, seq, of) to render.
            List<Long> results = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                Map<String, Object> envelope = new LinkedHashMap<>();
                envelope.put("body", body);
                envelope.put("seq", (long) (i + 1));
                envelope.put("of", (long) count);
                results.add((long) hub.publish(channel, envelope));
            }

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("channel", channel);
            response.put("publishes", (long) count);
            response.put("delivered", results);
            response.put("state", buildState());
            sendJson(exchange, 200, RedisPubSubHub.JsonCodec.encode(response));
        }
    }

    static class SubscribeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> params = readForm(exchange);
            String name = trim(params.get("name"));
            String kind = trim(params.getOrDefault("kind", "channel"));
            if (kind.isEmpty()) kind = "channel";
            String targetsRaw = trim(params.get("target"));

            if (name.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"name is required\"}");
                return;
            }
            if (targetsRaw.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"target is required\"}");
                return;
            }
            if (!"channel".equals(kind) && !"pattern".equals(kind)) {
                sendJson(exchange, 400, "{\"error\":\"kind must be 'channel' or 'pattern'\"}");
                return;
            }

            // Allow comma-separated targets so one subscription can cover
            // several channels.
            List<String> targets = new ArrayList<>();
            for (String t : targetsRaw.split(",")) {
                String s = t.trim();
                if (!s.isEmpty()) targets.add(s);
            }

            try {
                if ("pattern".equals(kind)) {
                    hub.psubscribe(name, targets);
                } else {
                    hub.subscribe(name, targets);
                }
            } catch (IllegalArgumentException ex) {
                sendJson(exchange, 400, "{\"error\":\"" + escapeJsonString(ex.getMessage()) + "\"}");
                return;
            }
            sendJson(exchange, 200, RedisPubSubHub.JsonCodec.encode(buildState()));
        }
    }

    static class UnsubscribeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            Map<String, String> params = readForm(exchange);
            String name = trim(params.get("name"));
            if (name.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"name is required\"}");
                return;
            }
            boolean removed = hub.unsubscribe(name);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("removed", removed);
            response.put("state", buildState());
            sendJson(exchange, 200, RedisPubSubHub.JsonCodec.encode(response));
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }
            hub.shutdown();
            hub.resetStats();
            seedDefaultSubscriptions(hub);
            sendJson(exchange, 200, RedisPubSubHub.JsonCodec.encode(buildState()));
        }
    }

    // ---------- State builder ----------

    private static Map<String, Object> buildState() {
        List<RedisPubSubHub.Subscription> subs = hub.subscriptions();

        // Collect every exact-match channel mentioned by any subscription
        // so the NUMSUB report is useful in the UI without an extra round
        // trip per channel.
        TreeSet<String> exactChannels = new TreeSet<>();
        for (RedisPubSubHub.Subscription sub : subs) {
            if (!sub.isPattern()) {
                exactChannels.addAll(sub.targets());
            }
        }
        List<String> exactList = new ArrayList<>(exactChannels);

        List<Map<String, Object>> subscriptionDocs = new ArrayList<>();
        for (RedisPubSubHub.Subscription sub : subs) {
            subscriptionDocs.add(sub.toMap(15));
        }

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("subscriptions", subscriptionDocs);
        state.put("active_channels", hub.activeChannels("*"));
        state.put("numsub", hub.channelSubscriberCounts(exactList));
        state.put("stats", hub.stats());
        return state;
    }

    // ---------- HTTP helpers ----------

    private static Map<String, String> readForm(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            byte[] body = is.readAllBytes();
            String text = new String(body, StandardCharsets.UTF_8);
            Map<String, String> out = new LinkedHashMap<>();
            if (text.isEmpty()) return out;
            for (String pair : text.split("&")) {
                if (pair.isEmpty()) continue;
                int eq = pair.indexOf('=');
                String key = eq >= 0 ? pair.substring(0, eq) : pair;
                String value = eq >= 0 ? pair.substring(eq + 1) : "";
                out.put(URLDecoder.decode(key, StandardCharsets.UTF_8),
                        URLDecoder.decode(value, StandardCharsets.UTF_8));
            }
            return out;
        }
    }

    private static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static String escapeJsonString(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
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

    // ---------- HTML ----------

    private static String htmlPage() {
        return "<!DOCTYPE html>\n"
                + "<html lang=\"en\">\n"
                + "<head>\n"
                + "  <meta charset=\"utf-8\">\n"
                + "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
                + "  <title>Redis Pub/Sub Demo</title>\n"
                + "  <style>\n"
                + "    :root {\n"
                + "      --bg: #f6f1e8;\n"
                + "      --panel: #fffaf2;\n"
                + "      --ink: #1f2933;\n"
                + "      --accent: #b8572f;\n"
                + "      --accent-dark: #8f421f;\n"
                + "      --muted: #5d6b75;\n"
                + "      --line: #e7d9c6;\n"
                + "      --ok: #d7f0de;\n"
                + "      --warn: #f7dfd7;\n"
                + "      --hit: #c9e7d2;\n"
                + "      --miss: #f5d6c6;\n"
                + "    }\n"
                + "    * { box-sizing: border-box; }\n"
                + "    body {\n"
                + "      margin: 0;\n"
                + "      font-family: Georgia, \"Times New Roman\", serif;\n"
                + "      color: var(--ink);\n"
                + "      background:\n"
                + "        radial-gradient(circle at top left, #fff7ea, transparent 32rem),\n"
                + "        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);\n"
                + "      min-height: 100vh;\n"
                + "    }\n"
                + "    main {\n"
                + "      max-width: 1080px;\n"
                + "      margin: 0 auto;\n"
                + "      padding: 48px 20px 72px;\n"
                + "    }\n"
                + "    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }\n"
                + "    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }\n"
                + "    .grid {\n"
                + "      display: grid;\n"
                + "      gap: 20px;\n"
                + "      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));\n"
                + "      margin-top: 28px;\n"
                + "    }\n"
                + "    .panel {\n"
                + "      background: rgba(255, 250, 242, 0.92);\n"
                + "      border: 1px solid var(--line);\n"
                + "      border-radius: 18px;\n"
                + "      padding: 22px;\n"
                + "      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);\n"
                + "    }\n"
                + "    .panel h2 { margin-top: 0; margin-bottom: 10px; }\n"
                + "    .pill {\n"
                + "      display: inline-block;\n"
                + "      border-radius: 999px;\n"
                + "      background: #efe2cf;\n"
                + "      color: var(--accent-dark);\n"
                + "      padding: 6px 10px;\n"
                + "      font-size: 0.9rem;\n"
                + "      margin-bottom: 12px;\n"
                + "    }\n"
                + "    label { display: block; font-weight: bold; margin: 12px 0 6px; }\n"
                + "    input, select {\n"
                + "      width: 100%;\n"
                + "      padding: 10px 12px;\n"
                + "      border-radius: 10px;\n"
                + "      border: 1px solid #cfbca6;\n"
                + "      font: inherit;\n"
                + "      background: white;\n"
                + "    }\n"
                + "    button {\n"
                + "      appearance: none;\n"
                + "      border: 0;\n"
                + "      border-radius: 999px;\n"
                + "      background: var(--accent);\n"
                + "      color: white;\n"
                + "      padding: 11px 18px;\n"
                + "      font: inherit;\n"
                + "      cursor: pointer;\n"
                + "      margin-right: 8px;\n"
                + "      margin-top: 12px;\n"
                + "    }\n"
                + "    button.secondary { background: #38424a; }\n"
                + "    button.tiny {\n"
                + "      padding: 4px 10px;\n"
                + "      font-size: 0.85rem;\n"
                + "      margin: 0 0 0 8px;\n"
                + "    }\n"
                + "    button:hover { background: var(--accent-dark); }\n"
                + "    button.secondary:hover { background: #20282e; }\n"
                + "    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }\n"
                + "    dt { font-weight: bold; }\n"
                + "    dd { margin: 0; word-break: break-word; }\n"
                + "    .badge {\n"
                + "      display: inline-block;\n"
                + "      border-radius: 6px;\n"
                + "      padding: 3px 8px;\n"
                + "      font-size: 0.85rem;\n"
                + "      font-weight: bold;\n"
                + "    }\n"
                + "    .badge.channel { background: #f4e4c1; color: #5e4514; }\n"
                + "    .badge.pattern { background: var(--miss); color: #6b3220; }\n"
                + "    .badge.alive { background: var(--hit); color: #1d4a2c; }\n"
                + "    .badge.dead { background: #f0c2bc; color: #6b1f1c; }\n"
                + "    .sub-card {\n"
                + "      border: 1px solid var(--line);\n"
                + "      border-radius: 14px;\n"
                + "      padding: 14px 16px;\n"
                + "      margin-bottom: 14px;\n"
                + "      background: #fffdf8;\n"
                + "    }\n"
                + "    .sub-card h3 { margin: 0 0 6px; font-size: 1.05rem; }\n"
                + "    .sub-card .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 8px; }\n"
                + "    .message-list { list-style: none; padding: 0; margin: 6px 0 0; max-height: 180px; overflow-y: auto; }\n"
                + "    .message-list li {\n"
                + "      border: 1px dashed #ddccb1;\n"
                + "      border-radius: 8px;\n"
                + "      padding: 6px 10px;\n"
                + "      margin-bottom: 6px;\n"
                + "      background: #fdf6e9;\n"
                + "      font-size: 0.9rem;\n"
                + "    }\n"
                + "    .message-list li .meta { color: var(--muted); font-size: 0.8rem; }\n"
                + "    pre {\n"
                + "      background: #f3eadc;\n"
                + "      border-radius: 12px;\n"
                + "      padding: 14px;\n"
                + "      overflow-x: auto;\n"
                + "      margin: 0;\n"
                + "      font-size: 0.85rem;\n"
                + "    }\n"
                + "    #status {\n"
                + "      margin-top: 20px;\n"
                + "      padding: 14px 16px;\n"
                + "      border-radius: 14px;\n"
                + "      display: none;\n"
                + "    }\n"
                + "    #status.ok { display: block; background: var(--ok); }\n"
                + "    #status.error { display: block; background: var(--warn); }\n"
                + "    @media (max-width: 600px) {\n"
                + "      main { padding-top: 28px; }\n"
                + "      button { width: 100%; }\n"
                + "    }\n"
                + "  </style>\n"
                + "</head>\n"
                + "<body>\n"
                + "  <main>\n"
                + "    <div class=\"pill\">Lettuce + com.sun.net.httpserver.HttpServer</div>\n"
                + "    <h1>Redis Pub/Sub Demo</h1>\n"
                + "    <p class=\"lede\">\n"
                + "      Publish messages to named channels and watch in-process subscribers receive them in\n"
                + "      real time through Redis. Exact-match subscribers register with <code>SUBSCRIBE</code>;\n"
                + "      pattern subscribers use <code>PSUBSCRIBE</code> with glob syntax\n"
                + "      (<code>notifications:*</code>, <code>orders:*</code>). Redis' own view of active\n"
                + "      subscribers — <code>PUBSUB CHANNELS</code>, <code>PUBSUB NUMSUB</code>,\n"
                + "      <code>PUBSUB NUMPAT</code> — is shown in the inspection panel.\n"
                + "    </p>\n"
                + "\n"
                + "    <div class=\"grid\">\n"
                + "      <section class=\"panel\">\n"
                + "        <h2>Publish a message</h2>\n"
                + "        <label for=\"pub-channel\">Channel</label>\n"
                + "        <input id=\"pub-channel\" value=\"orders:new\" list=\"channel-suggestions\">\n"
                + "        <datalist id=\"channel-suggestions\">\n"
                + "          <option value=\"orders:new\">\n"
                + "          <option value=\"billing:invoice\">\n"
                + "          <option value=\"notifications:email\">\n"
                + "          <option value=\"notifications:push\">\n"
                + "          <option value=\"cache:invalidate:products\">\n"
                + "          <option value=\"chat:lobby\">\n"
                + "        </datalist>\n"
                + "        <label for=\"pub-message\">Message body</label>\n"
                + "        <input id=\"pub-message\" value=\"hello, world\">\n"
                + "        <label for=\"pub-count\">How many copies</label>\n"
                + "        <input id=\"pub-count\" type=\"number\" value=\"1\" min=\"1\" max=\"20\">\n"
                + "        <button id=\"publish-button\">Publish</button>\n"
                + "      </section>\n"
                + "\n"
                + "      <section class=\"panel\">\n"
                + "        <h2>Add a subscriber</h2>\n"
                + "        <label for=\"sub-name\">Name</label>\n"
                + "        <input id=\"sub-name\" value=\"orders-bot\">\n"
                + "        <label for=\"sub-kind\">Subscription kind</label>\n"
                + "        <select id=\"sub-kind\">\n"
                + "          <option value=\"channel\">Exact channel (SUBSCRIBE)</option>\n"
                + "          <option value=\"pattern\">Pattern (PSUBSCRIBE)</option>\n"
                + "        </select>\n"
                + "        <label for=\"sub-target\">Channel or pattern (comma-separated for multiple)</label>\n"
                + "        <input id=\"sub-target\" value=\"orders:new\" placeholder=\"orders:new or orders:*\">\n"
                + "        <button id=\"subscribe-button\">Subscribe</button>\n"
                + "        <button id=\"reset-button\" class=\"secondary\">Reset</button>\n"
                + "      </section>\n"
                + "\n"
                + "      <section class=\"panel\">\n"
                + "        <h2>Server-side view</h2>\n"
                + "        <p class=\"meta\" style=\"margin-top:0;color:var(--muted);\">\n"
                + "          From <code>PUBSUB CHANNELS</code> / <code>PUBSUB NUMSUB</code> /\n"
                + "          <code>PUBSUB NUMPAT</code>. Pattern subscribers do not appear in\n"
                + "          <code>PUBSUB CHANNELS</code>; they are counted by <code>PUBSUB NUMPAT</code>.\n"
                + "        </p>\n"
                + "        <div id=\"server-view\">Loading...</div>\n"
                + "      </section>\n"
                + "\n"
                + "      <section class=\"panel\">\n"
                + "        <h2>Hub stats</h2>\n"
                + "        <div id=\"stats-view\">Loading...</div>\n"
                + "      </section>\n"
                + "\n"
                + "      <section class=\"panel\" style=\"grid-column: 1 / -1;\">\n"
                + "        <h2>Active subscribers <span id=\"sub-count\" class=\"badge alive\">0</span></h2>\n"
                + "        <div id=\"subscribers\"></div>\n"
                + "      </section>\n"
                + "    </div>\n"
                + "\n"
                + "    <div id=\"status\"></div>\n"
                + "  </main>\n"
                + "\n"
                + "  <script>\n"
                + "    const statusBox = document.getElementById(\"status\");\n"
                + "\n"
                + "    function setStatus(message, kind) {\n"
                + "      statusBox.textContent = message;\n"
                + "      statusBox.className = kind;\n"
                + "    }\n"
                + "\n"
                + "    function escapeHtml(value) {\n"
                + "      return String(value ?? \"\").replace(/[&<>\"']/g, (c) => ({\n"
                + "        \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\",\n"
                + "      })[c]);\n"
                + "    }\n"
                + "\n"
                + "    function renderStats(stats) {\n"
                + "      const view = document.getElementById(\"stats-view\");\n"
                + "      if (!stats) { view.textContent = \"(no data)\"; return; }\n"
                + "      const perChannel = Object.entries(stats.channel_published || {})\n"
                + "        .map(([ch, n]) => `${escapeHtml(ch)}: ${n}`).join(\", \") || \"(none)\";\n"
                + "      view.innerHTML = `\n"
                + "        <dl>\n"
                + "          <dt>Published total</dt><dd>${stats.published_total}</dd>\n"
                + "          <dt>Redis delivered total</dt><dd>${stats.delivered_total}</dd>\n"
                + "          <dt>Received total (this process)</dt><dd>${stats.received_total}</dd>\n"
                + "          <dt>Active subscriptions</dt><dd>${stats.active_subscriptions}</dd>\n"
                + "          <dt>Pattern subscriptions (server)</dt><dd>${stats.pattern_subscriptions}</dd>\n"
                + "          <dt>Per-channel publishes</dt><dd>${perChannel}</dd>\n"
                + "        </dl>\n"
                + "      `;\n"
                + "    }\n"
                + "\n"
                + "    function renderServerView(state) {\n"
                + "      const view = document.getElementById(\"server-view\");\n"
                + "      const channels = state.active_channels || [];\n"
                + "      const numsub = state.numsub || {};\n"
                + "      const channelsHtml = channels.length\n"
                + "        ? channels.map((c) => `<li><strong>${escapeHtml(c)}</strong> &middot; <span class=meta>${numsub[c] ?? 0} subscriber(s)</span></li>`).join(\"\")\n"
                + "        : \"<li><span class=meta>(no active exact-match channels)</span></li>\";\n"
                + "      view.innerHTML = `\n"
                + "        <ul class=\"message-list\">${channelsHtml}</ul>\n"
                + "      `;\n"
                + "    }\n"
                + "\n"
                + "    function renderSubscribers(subscriptions) {\n"
                + "      const wrap = document.getElementById(\"subscribers\");\n"
                + "      const count = document.getElementById(\"sub-count\");\n"
                + "      count.textContent = subscriptions.length;\n"
                + "      if (!subscriptions.length) {\n"
                + "        wrap.innerHTML = \"<p class=meta>(no active subscribers — add one to start)</p>\";\n"
                + "        return;\n"
                + "      }\n"
                + "      wrap.innerHTML = subscriptions.map((sub) => {\n"
                + "        const kind = sub.is_pattern ? \"pattern\" : \"channel\";\n"
                + "        const targets = sub.targets.map((t) => escapeHtml(t)).join(\", \");\n"
                + "        const messages = (sub.messages || []).map((m) => {\n"
                + "          const payload = typeof m.payload === \"object\" ? JSON.stringify(m.payload) : String(m.payload ?? \"\");\n"
                + "          const ch = m.pattern\n"
                + "            ? `${escapeHtml(m.channel)} <span class=meta>(via ${escapeHtml(m.pattern)})</span>`\n"
                + "            : escapeHtml(m.channel);\n"
                + "          return `<li>\n"
                + "            <strong>${ch}</strong>\n"
                + "            <div class=meta>${escapeHtml(payload)}</div>\n"
                + "          </li>`;\n"
                + "        }).join(\"\");\n"
                + "        return `<div class=\"sub-card\">\n"
                + "          <h3>${escapeHtml(sub.name)}\n"
                + "            <span class=\"badge ${kind}\">${kind}</span>\n"
                + "            <span class=\"badge ${sub.alive ? \"alive\" : \"dead\"}\">${sub.alive ? \"live\" : \"stopped\"}</span>\n"
                + "            <button class=\"tiny secondary\" data-unsubscribe=\"${escapeHtml(sub.name)}\">Unsubscribe</button>\n"
                + "          </h3>\n"
                + "          <div class=meta>Listening to: ${targets} &middot; received ${sub.received_total} message(s)</div>\n"
                + "          <ul class=\"message-list\">${messages || '<li><span class=meta>(no messages yet)</span></li>'}</ul>\n"
                + "        </div>`;\n"
                + "      }).join(\"\");\n"
                + "      wrap.querySelectorAll(\"button[data-unsubscribe]\").forEach((btn) => {\n"
                + "        btn.addEventListener(\"click\", async () => {\n"
                + "          const body = new URLSearchParams({ name: btn.dataset.unsubscribe });\n"
                + "          await fetch(\"/unsubscribe\", { method: \"POST\", body });\n"
                + "          setStatus(`Unsubscribed ${btn.dataset.unsubscribe}.`, \"ok\");\n"
                + "          refresh();\n"
                + "        });\n"
                + "      });\n"
                + "    }\n"
                + "\n"
                + "    async function refresh() {\n"
                + "      const response = await fetch(\"/state\");\n"
                + "      const state = await response.json();\n"
                + "      renderStats(state.stats);\n"
                + "      renderServerView(state);\n"
                + "      renderSubscribers(state.subscriptions || []);\n"
                + "    }\n"
                + "\n"
                + "    document.getElementById(\"publish-button\").addEventListener(\"click\", async () => {\n"
                + "      const body = new URLSearchParams({\n"
                + "        channel: document.getElementById(\"pub-channel\").value,\n"
                + "        message: document.getElementById(\"pub-message\").value,\n"
                + "        count: document.getElementById(\"pub-count\").value,\n"
                + "      });\n"
                + "      const response = await fetch(\"/publish\", { method: \"POST\", body });\n"
                + "      const data = await response.json();\n"
                + "      if (!response.ok) { setStatus(data.error || \"Publish failed.\", \"error\"); return; }\n"
                + "      const delivered = (data.delivered || []).reduce((a, b) => a + b, 0);\n"
                + "      setStatus(`Published ${data.publishes} message(s) to ${data.channel}; Redis delivered ${delivered} time(s).`, \"ok\");\n"
                + "      refresh();\n"
                + "    });\n"
                + "\n"
                + "    document.getElementById(\"subscribe-button\").addEventListener(\"click\", async () => {\n"
                + "      const body = new URLSearchParams({\n"
                + "        name: document.getElementById(\"sub-name\").value,\n"
                + "        kind: document.getElementById(\"sub-kind\").value,\n"
                + "        target: document.getElementById(\"sub-target\").value,\n"
                + "      });\n"
                + "      const response = await fetch(\"/subscribe\", { method: \"POST\", body });\n"
                + "      const data = await response.json();\n"
                + "      if (!response.ok) { setStatus(data.error || \"Subscribe failed.\", \"error\"); return; }\n"
                + "      setStatus(\"Subscriber added.\", \"ok\");\n"
                + "      refresh();\n"
                + "    });\n"
                + "\n"
                + "    document.getElementById(\"reset-button\").addEventListener(\"click\", async () => {\n"
                + "      await fetch(\"/reset\", { method: \"POST\" });\n"
                + "      setStatus(\"Hub reset — default subscribers re-seeded.\", \"ok\");\n"
                + "      refresh();\n"
                + "    });\n"
                + "\n"
                + "    refresh();\n"
                + "    setInterval(refresh, 800);\n"
                + "  </script>\n"
                + "</body>\n"
                + "</html>\n";
    }
}
