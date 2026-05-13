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
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.concurrent.Executors;

/**
 * Redis pub/sub demo server.
 *
 * <p>Run this file and visit http://localhost:8098 to publish messages to
 * named channels, watch in-process subscribers (exact-match and pattern)
 * receive them in real time, and inspect Redis' own view of the active
 * channels via PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB NUMPAT.</p>
 */
public class DemoServer {

    private static final List<Map<String, String>> DEFAULT_SUBSCRIPTIONS = List.of(
            Map.of("name", "orders-listener", "kind", "channel", "target", "orders:new"),
            Map.of("name", "billing-listener", "kind", "channel", "target", "billing:invoice"),
            Map.of("name", "all-notifications", "kind", "pattern", "target", "notifications:*")
    );

    private static RedisPubSubHub hub;
    private static JedisPool jedisPool;

    public static void main(String[] args) {
        String host = "127.0.0.1";
        int port = 8098;
        String redisHost = "localhost";
        int redisPort = 6379;

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
                default:
                    break;
            }
        }

        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(64);
        poolConfig.setMaxIdle(16);
        poolConfig.setMinIdle(2);
        jedisPool = new JedisPool(poolConfig, redisHost, redisPort);
        try (var jedis = jedisPool.getResource()) {
            jedis.ping();
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis at %s:%d: %s%n", redisHost, redisPort, e.getMessage());
            System.exit(1);
        }

        hub = new RedisPubSubHub(jedisPool);
        seedDefaultSubscriptions(hub);

        HttpServer server;
        try {
            server = HttpServer.create(new InetSocketAddress(host, port), 0);
        } catch (IOException e) {
            System.err.printf("Server error: %s%n", e.getMessage());
            System.exit(1);
            return;
        }
        server.setExecutor(Executors.newFixedThreadPool(16));
        server.createContext("/", new RootHandler());
        server.createContext("/state", new StateHandler());
        server.createContext("/publish", new PublishHandler());
        server.createContext("/subscribe", new SubscribeHandler());
        server.createContext("/unsubscribe", new UnsubscribeHandler());
        server.createContext("/reset", new ResetHandler());

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                hub.shutdown();
            } catch (Exception ignored) {
            }
            try {
                jedisPool.close();
            } catch (Exception ignored) {
            }
            server.stop(0);
        }));

        server.start();
        System.out.printf("Redis pub/sub demo server listening on http://%s:%d%n", host, port);
        System.out.printf("Using Redis at %s:%d%n", redisHost, redisPort);
        System.out.printf("Seeded %d default subscription(s)%n", DEFAULT_SUBSCRIPTIONS.size());
    }

    private static void seedDefaultSubscriptions(RedisPubSubHub hub) {
        for (Map<String, String> entry : DEFAULT_SUBSCRIPTIONS) {
            try {
                if ("pattern".equals(entry.get("kind"))) {
                    hub.psubscribe(entry.get("name"), List.of(entry.get("target")));
                } else {
                    hub.subscribe(entry.get("name"), List.of(entry.get("target")));
                }
            } catch (IllegalArgumentException ignored) {
                // Already present from a previous reset cycle.
            }
        }
    }

    private static Map<String, Object> buildState() {
        List<RedisPubSubHub.Subscription> subs = hub.subscriptions();
        TreeSet<String> exactChannels = new TreeSet<>();
        for (RedisPubSubHub.Subscription sub : subs) {
            if (!sub.isPattern()) {
                exactChannels.addAll(sub.targets());
            }
        }
        List<String> exactChannelList = new ArrayList<>(exactChannels);

        List<Map<String, Object>> subsOut = new ArrayList<>();
        for (RedisPubSubHub.Subscription sub : subs) {
            Map<String, Object> entry = sub.toMap();
            List<Map<String, Object>> messages = new ArrayList<>();
            for (RedisPubSubHub.ReceivedMessage m : sub.messages(15)) {
                messages.add(m.toMap());
            }
            entry.put("messages", messages);
            subsOut.add(entry);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("subscriptions", subsOut);
        out.put("active_channels", hub.activeChannels("*"));
        out.put("numsub", hub.channelSubscriberCounts(exactChannelList));
        out.put("stats", hub.stats());
        return out;
    }

    // ---------- HTTP handlers ----------

    private static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendStatus(exchange, 405);
                return;
            }
            String path = exchange.getRequestURI().getPath();
            if (!path.equals("/") && !path.equals("/index.html")) {
                sendStatus(exchange, 404);
                return;
            }
            byte[] html = HTML_PAGE.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
            exchange.sendResponseHeaders(200, html.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(html);
            }
        }
    }

    private static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendStatus(exchange, 405);
                return;
            }
            sendJson(exchange, buildState(), 200);
        }
    }

    private static class PublishHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendStatus(exchange, 405);
                return;
            }
            Map<String, String> form = readForm(exchange);
            String channel = form.getOrDefault("channel", "").trim();
            String body = form.getOrDefault("message", "").trim();
            int count;
            try {
                count = Math.max(1, Math.min(20, Integer.parseInt(form.getOrDefault("count", "1"))));
            } catch (NumberFormatException e) {
                count = 1;
            }
            if (channel.isEmpty()) {
                sendJson(exchange, Map.of("error", "channel is required"), 400);
                return;
            }
            if (body.isEmpty()) {
                sendJson(exchange, Map.of("error", "message is required"), 400);
                return;
            }
            List<Long> results = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                Map<String, Object> envelope = new LinkedHashMap<>();
                envelope.put("body", body);
                envelope.put("seq", (long) (i + 1));
                envelope.put("of", (long) count);
                int delivered = hub.publish(channel, envelope);
                results.add((long) delivered);
            }
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("channel", channel);
            out.put("publishes", (long) count);
            out.put("delivered", results);
            out.put("state", buildState());
            sendJson(exchange, out, 200);
        }
    }

    private static class SubscribeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendStatus(exchange, 405);
                return;
            }
            Map<String, String> form = readForm(exchange);
            String name = form.getOrDefault("name", "").trim();
            String kind = form.getOrDefault("kind", "channel").trim();
            String targetsRaw = form.getOrDefault("target", "").trim();

            if (name.isEmpty()) {
                sendJson(exchange, Map.of("error", "name is required"), 400);
                return;
            }
            if (targetsRaw.isEmpty()) {
                sendJson(exchange, Map.of("error", "target is required"), 400);
                return;
            }
            if (!kind.equals("channel") && !kind.equals("pattern")) {
                sendJson(exchange, Map.of("error", "kind must be 'channel' or 'pattern'"), 400);
                return;
            }
            List<String> targets = new ArrayList<>();
            for (String t : targetsRaw.split(",")) {
                String trimmed = t.trim();
                if (!trimmed.isEmpty()) {
                    targets.add(trimmed);
                }
            }
            try {
                if ("pattern".equals(kind)) {
                    hub.psubscribe(name, targets);
                } else {
                    hub.subscribe(name, targets);
                }
            } catch (IllegalArgumentException exc) {
                sendJson(exchange, Map.of("error", exc.getMessage()), 400);
                return;
            }
            sendJson(exchange, buildState(), 200);
        }
    }

    private static class UnsubscribeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendStatus(exchange, 405);
                return;
            }
            Map<String, String> form = readForm(exchange);
            String name = form.getOrDefault("name", "").trim();
            if (name.isEmpty()) {
                sendJson(exchange, Map.of("error", "name is required"), 400);
                return;
            }
            boolean removed = hub.unsubscribe(name);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("removed", removed);
            out.put("state", buildState());
            sendJson(exchange, out, 200);
        }
    }

    private static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendStatus(exchange, 405);
                return;
            }
            hub.shutdown();
            hub.resetStats();
            seedDefaultSubscriptions(hub);
            sendJson(exchange, buildState(), 200);
        }
    }

    // ---------- helpers ----------

    private static Map<String, String> readForm(HttpExchange exchange) throws IOException {
        Map<String, String> result = new HashMap<>();
        try (InputStream in = exchange.getRequestBody()) {
            byte[] bytes = in.readAllBytes();
            String body = new String(bytes, StandardCharsets.UTF_8);
            if (body.isEmpty()) {
                return result;
            }
            for (String pair : body.split("&")) {
                int eq = pair.indexOf('=');
                if (eq < 0) {
                    result.put(URLDecoder.decode(pair, StandardCharsets.UTF_8), "");
                } else {
                    String key = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
                    String value = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
                    result.put(key, value);
                }
            }
        }
        return result;
    }

    private static void sendJson(HttpExchange exchange, Object payload, int status) throws IOException {
        byte[] body = JsonUtil.toJson(payload).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, body.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(body);
        }
    }

    private static void sendStatus(HttpExchange exchange, int status) throws IOException {
        exchange.sendResponseHeaders(status, -1);
        exchange.close();
    }

    // ---------- inlined HTML ----------

    private static final String HTML_PAGE =
            "<!DOCTYPE html>\n" +
            "<html lang=\"en\">\n" +
            "<head>\n" +
            "  <meta charset=\"utf-8\">\n" +
            "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
            "  <title>Redis Pub/Sub Demo</title>\n" +
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
            "    button.tiny {\n" +
            "      padding: 4px 10px;\n" +
            "      font-size: 0.85rem;\n" +
            "      margin: 0 0 0 8px;\n" +
            "    }\n" +
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
            "    .badge.channel { background: #f4e4c1; color: #5e4514; }\n" +
            "    .badge.pattern { background: var(--miss); color: #6b3220; }\n" +
            "    .badge.alive { background: var(--hit); color: #1d4a2c; }\n" +
            "    .badge.dead { background: #f0c2bc; color: #6b1f1c; }\n" +
            "    .sub-card {\n" +
            "      border: 1px solid var(--line);\n" +
            "      border-radius: 14px;\n" +
            "      padding: 14px 16px;\n" +
            "      margin-bottom: 14px;\n" +
            "      background: #fffdf8;\n" +
            "    }\n" +
            "    .sub-card h3 { margin: 0 0 6px; font-size: 1.05rem; }\n" +
            "    .sub-card .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 8px; }\n" +
            "    .message-list { list-style: none; padding: 0; margin: 6px 0 0; max-height: 180px; overflow-y: auto; }\n" +
            "    .message-list li {\n" +
            "      border: 1px dashed #ddccb1;\n" +
            "      border-radius: 8px;\n" +
            "      padding: 6px 10px;\n" +
            "      margin-bottom: 6px;\n" +
            "      background: #fdf6e9;\n" +
            "      font-size: 0.9rem;\n" +
            "    }\n" +
            "    .message-list li .meta { color: var(--muted); font-size: 0.8rem; }\n" +
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
            "    <div class=\"pill\">Jedis + com.sun.net.httpserver.HttpServer</div>\n" +
            "    <h1>Redis Pub/Sub Demo</h1>\n" +
            "    <p class=\"lede\">\n" +
            "      Publish messages to named channels and watch in-process subscribers receive them in\n" +
            "      real time through Redis. Exact-match subscribers register with <code>SUBSCRIBE</code>;\n" +
            "      pattern subscribers use <code>PSUBSCRIBE</code> with glob syntax\n" +
            "      (<code>notifications:*</code>, <code>orders:*</code>). Redis' own view of active\n" +
            "      subscribers &mdash; <code>PUBSUB CHANNELS</code>, <code>PUBSUB NUMSUB</code>,\n" +
            "      <code>PUBSUB NUMPAT</code> &mdash; is shown in the inspection panel.\n" +
            "    </p>\n" +
            "\n" +
            "    <div class=\"grid\">\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Publish a message</h2>\n" +
            "        <label for=\"pub-channel\">Channel</label>\n" +
            "        <input id=\"pub-channel\" value=\"orders:new\" list=\"channel-suggestions\">\n" +
            "        <datalist id=\"channel-suggestions\">\n" +
            "          <option value=\"orders:new\">\n" +
            "          <option value=\"billing:invoice\">\n" +
            "          <option value=\"notifications:email\">\n" +
            "          <option value=\"notifications:push\">\n" +
            "          <option value=\"cache:invalidate:products\">\n" +
            "          <option value=\"chat:lobby\">\n" +
            "        </datalist>\n" +
            "        <label for=\"pub-message\">Message body</label>\n" +
            "        <input id=\"pub-message\" value=\"hello, world\">\n" +
            "        <label for=\"pub-count\">How many copies</label>\n" +
            "        <input id=\"pub-count\" type=\"number\" value=\"1\" min=\"1\" max=\"20\">\n" +
            "        <button id=\"publish-button\">Publish</button>\n" +
            "      </section>\n" +
            "\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Add a subscriber</h2>\n" +
            "        <label for=\"sub-name\">Name</label>\n" +
            "        <input id=\"sub-name\" value=\"orders-bot\">\n" +
            "        <label for=\"sub-kind\">Subscription kind</label>\n" +
            "        <select id=\"sub-kind\">\n" +
            "          <option value=\"channel\">Exact channel (SUBSCRIBE)</option>\n" +
            "          <option value=\"pattern\">Pattern (PSUBSCRIBE)</option>\n" +
            "        </select>\n" +
            "        <label for=\"sub-target\">Channel or pattern (comma-separated for multiple)</label>\n" +
            "        <input id=\"sub-target\" value=\"orders:new\" placeholder=\"orders:new or orders:*\">\n" +
            "        <button id=\"subscribe-button\">Subscribe</button>\n" +
            "        <button id=\"reset-button\" class=\"secondary\">Reset</button>\n" +
            "      </section>\n" +
            "\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Server-side view</h2>\n" +
            "        <p class=\"meta\" style=\"margin-top:0;color:var(--muted);\">\n" +
            "          From <code>PUBSUB CHANNELS</code> / <code>PUBSUB NUMSUB</code> /\n" +
            "          <code>PUBSUB NUMPAT</code>. Pattern subscribers do not appear in\n" +
            "          <code>PUBSUB CHANNELS</code>; they are counted by <code>PUBSUB NUMPAT</code>.\n" +
            "        </p>\n" +
            "        <div id=\"server-view\">Loading...</div>\n" +
            "      </section>\n" +
            "\n" +
            "      <section class=\"panel\">\n" +
            "        <h2>Hub stats</h2>\n" +
            "        <div id=\"stats-view\">Loading...</div>\n" +
            "      </section>\n" +
            "\n" +
            "      <section class=\"panel\" style=\"grid-column: 1 / -1;\">\n" +
            "        <h2>Active subscribers <span id=\"sub-count\" class=\"badge alive\">0</span></h2>\n" +
            "        <div id=\"subscribers\"></div>\n" +
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
            "      const perChannel = Object.entries(stats.channel_published || {})\n" +
            "        .map(([ch, n]) => `${escapeHtml(ch)}: ${n}`).join(\", \") || \"(none)\";\n" +
            "      view.innerHTML = `\n" +
            "        <dl>\n" +
            "          <dt>Published total</dt><dd>${stats.published_total}</dd>\n" +
            "          <dt>Redis delivered total</dt><dd>${stats.delivered_total}</dd>\n" +
            "          <dt>Received total (this process)</dt><dd>${stats.received_total}</dd>\n" +
            "          <dt>Active subscriptions</dt><dd>${stats.active_subscriptions}</dd>\n" +
            "          <dt>Pattern subscriptions (server)</dt><dd>${stats.pattern_subscriptions}</dd>\n" +
            "          <dt>Per-channel publishes</dt><dd>${perChannel}</dd>\n" +
            "        </dl>\n" +
            "      `;\n" +
            "    }\n" +
            "\n" +
            "    function renderServerView(state) {\n" +
            "      const view = document.getElementById(\"server-view\");\n" +
            "      const channels = state.active_channels || [];\n" +
            "      const numsub = state.numsub || {};\n" +
            "      const channelsHtml = channels.length\n" +
            "        ? channels.map((c) => `<li><strong>${escapeHtml(c)}</strong> &middot; <span class=meta>${numsub[c] ?? 0} subscriber(s)</span></li>`).join(\"\")\n" +
            "        : \"<li><span class=meta>(no active exact-match channels)</span></li>\";\n" +
            "      view.innerHTML = `\n" +
            "        <ul class=\"message-list\">${channelsHtml}</ul>\n" +
            "      `;\n" +
            "    }\n" +
            "\n" +
            "    function renderSubscribers(subscriptions) {\n" +
            "      const wrap = document.getElementById(\"subscribers\");\n" +
            "      const count = document.getElementById(\"sub-count\");\n" +
            "      count.textContent = subscriptions.length;\n" +
            "      if (!subscriptions.length) {\n" +
            "        wrap.innerHTML = \"<p class=meta>(no active subscribers &mdash; add one to start)</p>\";\n" +
            "        return;\n" +
            "      }\n" +
            "      wrap.innerHTML = subscriptions.map((sub) => {\n" +
            "        const kind = sub.is_pattern ? \"pattern\" : \"channel\";\n" +
            "        const targets = sub.targets.map((t) => escapeHtml(t)).join(\", \");\n" +
            "        const messages = (sub.messages || []).map((m) => {\n" +
            "          const payload = typeof m.payload === \"object\" ? JSON.stringify(m.payload) : String(m.payload ?? \"\");\n" +
            "          const ch = m.pattern\n" +
            "            ? `${escapeHtml(m.channel)} <span class=meta>(via ${escapeHtml(m.pattern)})</span>`\n" +
            "            : escapeHtml(m.channel);\n" +
            "          return `<li>\n" +
            "            <strong>${ch}</strong>\n" +
            "            <div class=meta>${escapeHtml(payload)}</div>\n" +
            "          </li>`;\n" +
            "        }).join(\"\");\n" +
            "        return `<div class=\"sub-card\">\n" +
            "          <h3>${escapeHtml(sub.name)}\n" +
            "            <span class=\"badge ${kind}\">${kind}</span>\n" +
            "            <span class=\"badge ${sub.alive ? \"alive\" : \"dead\"}\">${sub.alive ? \"live\" : \"stopped\"}</span>\n" +
            "            <button class=\"tiny secondary\" data-unsubscribe=\"${escapeHtml(sub.name)}\">Unsubscribe</button>\n" +
            "          </h3>\n" +
            "          <div class=meta>Listening to: ${targets} &middot; received ${sub.received_total} message(s)</div>\n" +
            "          <ul class=\"message-list\">${messages || '<li><span class=meta>(no messages yet)</span></li>'}</ul>\n" +
            "        </div>`;\n" +
            "      }).join(\"\");\n" +
            "      wrap.querySelectorAll(\"button[data-unsubscribe]\").forEach((btn) => {\n" +
            "        btn.addEventListener(\"click\", async () => {\n" +
            "          const body = new URLSearchParams({ name: btn.dataset.unsubscribe });\n" +
            "          await fetch(\"/unsubscribe\", { method: \"POST\", body });\n" +
            "          setStatus(`Unsubscribed ${btn.dataset.unsubscribe}.`, \"ok\");\n" +
            "          refresh();\n" +
            "        });\n" +
            "      });\n" +
            "    }\n" +
            "\n" +
            "    async function refresh() {\n" +
            "      const response = await fetch(\"/state\");\n" +
            "      const state = await response.json();\n" +
            "      renderStats(state.stats);\n" +
            "      renderServerView(state);\n" +
            "      renderSubscribers(state.subscriptions || []);\n" +
            "    }\n" +
            "\n" +
            "    document.getElementById(\"publish-button\").addEventListener(\"click\", async () => {\n" +
            "      const body = new URLSearchParams({\n" +
            "        channel: document.getElementById(\"pub-channel\").value,\n" +
            "        message: document.getElementById(\"pub-message\").value,\n" +
            "        count: document.getElementById(\"pub-count\").value,\n" +
            "      });\n" +
            "      const response = await fetch(\"/publish\", { method: \"POST\", body });\n" +
            "      const data = await response.json();\n" +
            "      if (!response.ok) { setStatus(data.error || \"Publish failed.\", \"error\"); return; }\n" +
            "      const delivered = (data.delivered || []).reduce((a, b) => a + b, 0);\n" +
            "      setStatus(`Published ${data.publishes} message(s) to ${data.channel}; Redis delivered ${delivered} time(s).`, \"ok\");\n" +
            "      refresh();\n" +
            "    });\n" +
            "\n" +
            "    document.getElementById(\"subscribe-button\").addEventListener(\"click\", async () => {\n" +
            "      const body = new URLSearchParams({\n" +
            "        name: document.getElementById(\"sub-name\").value,\n" +
            "        kind: document.getElementById(\"sub-kind\").value,\n" +
            "        target: document.getElementById(\"sub-target\").value,\n" +
            "      });\n" +
            "      const response = await fetch(\"/subscribe\", { method: \"POST\", body });\n" +
            "      const data = await response.json();\n" +
            "      if (!response.ok) { setStatus(data.error || \"Subscribe failed.\", \"error\"); return; }\n" +
            "      setStatus(\"Subscriber added.\", \"ok\");\n" +
            "      refresh();\n" +
            "    });\n" +
            "\n" +
            "    document.getElementById(\"reset-button\").addEventListener(\"click\", async () => {\n" +
            "      await fetch(\"/reset\", { method: \"POST\" });\n" +
            "      setStatus(\"Hub reset \\u2014 default subscribers re-seeded.\", \"ok\");\n" +
            "      refresh();\n" +
            "    });\n" +
            "\n" +
            "    refresh();\n" +
            "    setInterval(refresh, 800);\n" +
            "  </script>\n" +
            "</body>\n" +
            "</html>\n";
}
