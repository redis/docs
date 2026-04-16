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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Redis leaderboard demo server.
 *
 * Usage:
 *     javac -cp jedis-5.2.0.jar RedisLeaderboard.java DemoServer.java
 *     java -cp .:jedis-5.2.0.jar DemoServer [--port PORT] [--redis-host HOST] [--redis-port PORT]
 */
public class DemoServer {

    private record DemoPlayer(String userId, double score, Map<String, String> metadata) {}

    private static final List<DemoPlayer> SAMPLE_PLAYERS = List.of(
            new DemoPlayer("player-1", 980, Map.of(
                    "name", "Avery",
                    "description", "Steady climber who never wastes a turn."
            )),
            new DemoPlayer("player-2", 1310, Map.of(
                    "name", "Mina",
                    "description", "Always finds a way into the top three."
            )),
            new DemoPlayer("player-3", 1175, Map.of(
                    "name", "Noah",
                    "description", "Takes big swings and occasionally lands them."
            )),
            new DemoPlayer("player-4", 1435, Map.of(
                    "name", "Priya",
                    "description", "Current pace-setter with a ruthless endgame."
            )),
            new DemoPlayer("player-5", 1080, Map.of(
                    "name", "Jules",
                    "description", "Quietly consistent and hard to catch."
            )),
            new DemoPlayer("player-6", 1240, Map.of(
                    "name", "Rin",
                    "description", "Moves fast after every weekly reset."
            ))
    );

    private static RedisLeaderboard leaderboard;
    private static JedisPool jedisPool;

    public static void main(String[] args) {
        int port = 8080;
        String redisHost = "localhost";
        int redisPort = 6379;
        int maxEntries = 100;

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
                case "--max-entries":
                    maxEntries = Integer.parseInt(args[++i]);
                    break;
            }
        }

        try {
            jedisPool = new JedisPool(new JedisPoolConfig(), redisHost, redisPort);
            jedisPool.getResource().close();
        } catch (Exception e) {
            System.err.printf("Failed to connect to Redis: %s%n", e.getMessage());
            System.err.printf("Make sure Redis is running at %s:%d%n", redisHost, redisPort);
            System.exit(1);
        }

        leaderboard = new RedisLeaderboard(jedisPool, "leaderboard:demo", maxEntries);
        resetDemoData();

        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/api/state", new StateHandler());
            server.createContext("/api/players", new PlayersHandler());
            server.createContext("/api/increment", new IncrementHandler());
            server.createContext("/api/config", new ConfigHandler());
            server.createContext("/api/reset", new ResetHandler());
            server.createContext("/", new HomeHandler());
            server.setExecutor(null);
            server.start();

            System.out.printf("Leaderboard demo server running at http://localhost:%d%n", port);
            System.out.printf("Connected to Redis at %s:%d%n", redisHost, redisPort);
            System.out.printf("Keeping the top %d entries%n", leaderboard.getMaxEntries());
            System.out.println("Press Ctrl+C to stop.");

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\nStopping server.");
                jedisPool.close();
                server.stop(0);
            }));
        } catch (IOException e) {
            System.err.printf("Server error: %s%n", e.getMessage());
            System.exit(1);
        }
    }

    static class StateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> query = parseFormData(exchange.getRequestURI().getRawQuery());
            int topCount = parsePositiveInt(query.get("top"), 5);
            int aroundRank = parsePositiveInt(query.get("rank"), 3);
            int aroundCount = parsePositiveInt(query.get("around"), 5);

            String json = "{"
                    + "\"leaderboard_key\":\"" + jsonEscape(leaderboard.getKey()) + "\","
                    + "\"max_entries\":" + leaderboard.getMaxEntries() + ","
                    + "\"top_count\":" + topCount + ","
                    + "\"around_rank\":" + aroundRank + ","
                    + "\"around_count\":" + aroundCount + ","
                    + "\"size\":" + leaderboard.getSize() + ","
                    + "\"top_entries\":" + entriesToJson(leaderboard.getTop(topCount)) + ","
                    + "\"around_entries\":" + entriesToJson(leaderboard.getAroundRank(aroundRank, aroundCount))
                    + "}";

            sendJson(exchange, 200, json);
        }
    }

    static class PlayersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> params = parseFormData(readRequestBody(exchange));
            String userId = params.getOrDefault("user_id", "").trim();
            Double score = parseDouble(params.get("score"));
            if (userId.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"User ID is required.\"}");
                return;
            }
            if (score == null) {
                sendJson(exchange, 400, "{\"error\":\"Score must be a valid number.\"}");
                return;
            }

            Map<String, String> metadata = new LinkedHashMap<>();
            metadata.put("name", params.getOrDefault("name", "").isBlank() ? userId : params.get("name").trim());
            metadata.put(
                    "description",
                    params.getOrDefault("description", "").isBlank()
                            ? "No description provided."
                            : params.get("description").trim()
            );

            RedisLeaderboard.LeaderboardEntry entry = leaderboard.upsertUser(userId, score, metadata);
            String json = "{"
                    + "\"message\":\"Player saved.\","
                    + "\"entry\":" + entryToJson(entry) + ","
                    + "\"max_entries\":" + leaderboard.getMaxEntries()
                    + "}";
            sendJson(exchange, 200, json);
        }
    }

    static class IncrementHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> params = parseFormData(readRequestBody(exchange));
            String userId = params.getOrDefault("user_id", "").trim();
            Double amount = parseDouble(params.get("amount"));
            if (userId.isEmpty()) {
                sendJson(exchange, 400, "{\"error\":\"User ID is required.\"}");
                return;
            }
            if (amount == null) {
                sendJson(exchange, 400, "{\"error\":\"Increment must be a valid number.\"}");
                return;
            }

            Map<String, String> metadata = new LinkedHashMap<>(leaderboard.getUserMetadata(userId));
            if (metadata.isEmpty()) {
                metadata.put("name", params.getOrDefault("name", "").isBlank() ? userId : params.get("name").trim());
                metadata.put(
                        "description",
                        params.getOrDefault("description", "").isBlank()
                                ? "Created during score increment."
                                : params.get("description").trim()
                );
            } else {
                if (params.containsKey("name") && !params.get("name").isBlank()) {
                    metadata.put("name", params.get("name").trim());
                }
                if (params.containsKey("description") && !params.get("description").isBlank()) {
                    metadata.put("description", params.get("description").trim());
                }
            }

            RedisLeaderboard.LeaderboardEntry entry = leaderboard.incrementScore(userId, amount, metadata);
            String json = "{"
                    + "\"message\":\"Score updated.\","
                    + "\"entry\":" + entryToJson(entry) + ","
                    + "\"max_entries\":" + leaderboard.getMaxEntries()
                    + "}";
            sendJson(exchange, 200, json);
        }
    }

    static class ConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, String> params = parseFormData(readRequestBody(exchange));
            Integer maxEntries = parseInteger(params.get("max_entries"));
            if (maxEntries == null || maxEntries < 1) {
                sendJson(exchange, 400, "{\"error\":\"Max entries must be a whole number greater than 0.\"}");
                return;
            }

            List<String> trimmedUserIds = leaderboard.setMaxEntries(maxEntries);
            String json = "{"
                    + "\"message\":\"Leaderboard limit updated.\","
                    + "\"max_entries\":" + leaderboard.getMaxEntries() + ","
                    + "\"trimmed_user_ids\":" + stringListToJson(trimmedUserIds)
                    + "}";
            sendJson(exchange, 200, json);
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            resetDemoData();
            String json = "{"
                    + "\"message\":\"Demo leaderboard reset.\","
                    + "\"max_entries\":" + leaderboard.getMaxEntries()
                    + "}";
            sendJson(exchange, 200, json);
        }
    }

    static class HomeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (!"/".equals(path) && !"/index.html".equals(path)) {
                sendResponse(exchange, 404, "Not Found", "text/plain");
                return;
            }
            sendResponse(exchange, 200, getHtmlPage(), "text/html; charset=utf-8");
        }
    }

    private static void resetDemoData() {
        leaderboard.clear();
        for (DemoPlayer player : SAMPLE_PLAYERS) {
            leaderboard.upsertUser(player.userId(), player.score(), player.metadata());
        }
    }

    private static void sendJson(HttpExchange exchange, int statusCode, String body) throws IOException {
        sendResponse(exchange, statusCode, body, "application/json");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String body, String contentType)
            throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseFormData(String body) {
        Map<String, String> params = new LinkedHashMap<>();
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
            }
        }
        return params;
    }

    private static Integer parseInteger(String rawValue) {
        try {
            return rawValue == null ? null : Integer.parseInt(rawValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static int parsePositiveInt(String rawValue, int defaultValue) {
        Integer value = parseInteger(rawValue);
        return value == null || value < 1 ? defaultValue : value;
    }

    private static Double parseDouble(String rawValue) {
        try {
            return rawValue == null ? null : Double.parseDouble(rawValue);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static String entryToJson(RedisLeaderboard.LeaderboardEntry entry) {
        return "{"
                + "\"rank\":" + entry.rank() + ","
                + "\"user_id\":\"" + jsonEscape(entry.userId()) + "\","
                + "\"score\":" + entry.score() + ","
                + "\"metadata\":" + mapToJson(entry.metadata()) + ","
                + "\"trimmed_user_ids\":" + stringListToJson(entry.trimmedUserIds())
                + "}";
    }

    private static String entriesToJson(List<RedisLeaderboard.LeaderboardEntry> entries) {
        List<String> parts = new ArrayList<>();
        for (RedisLeaderboard.LeaderboardEntry entry : entries) {
            parts.add(entryToJson(entry));
        }
        return "[" + String.join(",", parts) + "]";
    }

    private static String mapToJson(Map<String, String> map) {
        List<String> parts = new ArrayList<>();
        for (Map.Entry<String, String> entry : map.entrySet()) {
            parts.add("\"" + jsonEscape(entry.getKey()) + "\":\"" + jsonEscape(entry.getValue()) + "\"");
        }
        return "{" + String.join(",", parts) + "}";
    }

    private static String stringListToJson(List<String> values) {
        List<String> parts = new ArrayList<>();
        for (String value : values) {
            parts.add("\"" + jsonEscape(value) + "\"");
        }
        return "[" + String.join(",", parts) + "]";
    }

    private static String jsonEscape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static String getHtmlPage() {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Redis Leaderboard Demo</title>
                    <style>
                        :root {
                            color-scheme: light;
                            --bg: #f7f4ec;
                            --panel: #fffaf0;
                            --panel-strong: #f0e6d2;
                            --text: #1f2933;
                            --muted: #52606d;
                            --line: #d7cab2;
                            --accent: #b45309;
                            --accent-dark: #7c2d12;
                            --good: #166534;
                        }
                        * {
                            box-sizing: border-box;
                        }
                        body {
                            margin: 0;
                            font-family: Georgia, "Times New Roman", serif;
                            background:
                                radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 28%),
                                linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%);
                            color: var(--text);
                        }
                        main {
                            max-width: 1120px;
                            margin: 0 auto;
                            padding: 32px 20px 48px;
                        }
                        h1, h2, h3 {
                            margin-top: 0;
                            color: #3b2f2f;
                        }
                        p {
                            color: var(--muted);
                            line-height: 1.5;
                        }
                        .hero {
                            background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(124, 45, 18, 0.08));
                            border: 1px solid var(--line);
                            border-radius: 20px;
                            padding: 28px;
                            margin-bottom: 24px;
                        }
                        .grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                            gap: 18px;
                        }
                        .panel {
                            background: var(--panel);
                            border: 1px solid var(--line);
                            border-radius: 18px;
                            padding: 20px;
                            box-shadow: 0 14px 40px rgba(31, 41, 51, 0.05);
                        }
                        .banner {
                            background: var(--panel-strong);
                            color: var(--accent-dark);
                            border: 1px solid var(--line);
                            border-radius: 14px;
                            padding: 12px 14px;
                            margin-bottom: 16px;
                            min-height: 48px;
                        }
                        form {
                            display: grid;
                            gap: 10px;
                        }
                        label {
                            font-size: 0.95rem;
                            font-weight: 700;
                            color: #4b3b30;
                        }
                        input, textarea, button {
                            font: inherit;
                        }
                        input, textarea {
                            width: 100%;
                            padding: 10px 12px;
                            border-radius: 12px;
                            border: 1px solid var(--line);
                            background: #fffdf8;
                            color: var(--text);
                        }
                        textarea {
                            min-height: 90px;
                            resize: vertical;
                        }
                        button {
                            border: 0;
                            border-radius: 999px;
                            padding: 11px 16px;
                            background: linear-gradient(135deg, var(--accent), var(--accent-dark));
                            color: white;
                            cursor: pointer;
                            font-weight: 700;
                        }
                        button.secondary {
                            background: #e6dcc8;
                            color: #4b3b30;
                        }
                        .inline {
                            display: grid;
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                            gap: 10px;
                        }
                        .toolbar {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 10px;
                            margin-bottom: 14px;
                        }
                        .statline {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 12px;
                            margin-top: 8px;
                            color: var(--muted);
                            font-size: 0.95rem;
                        }
                        .table-wrap {
                            overflow-x: auto;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            text-align: left;
                            padding: 10px 8px;
                            border-bottom: 1px solid rgba(215, 202, 178, 0.8);
                            vertical-align: top;
                        }
                        th {
                            color: #4b3b30;
                            font-size: 0.95rem;
                        }
                        .pill {
                            display: inline-block;
                            padding: 4px 10px;
                            border-radius: 999px;
                            background: rgba(180, 83, 9, 0.1);
                            color: var(--accent-dark);
                            font-size: 0.85rem;
                            font-weight: 700;
                        }
                        .success {
                            color: var(--good);
                        }
                        @media (max-width: 720px) {
                            .inline {
                                grid-template-columns: 1fr;
                            }
                        }
                    </style>
                </head>
                <body>
                    <main>
                        <section class="hero">
                            <h1>Redis leaderboard demo</h1>
                            <p>
                                This demo stores scores in a Redis sorted set and keeps player details in per-user hashes.
                                You can inspect the top performers, look around a rank position, and trim the board to a fixed size.
                            </p>
                            <div class="statline">
                                <span class="pill">Sorted set rankings</span>
                                <span class="pill">Hash-based metadata</span>
                                <span class="pill">Top N and around-rank queries</span>
                            </div>
                        </section>

                        <div class="banner" id="banner">Ready.</div>

                        <div class="grid">
                            <section class="panel">
                                <h2>Add or update a player</h2>
                                <form id="upsert-form">
                                    <label>User ID <input name="user_id" value="player-7" required></label>
                                    <div class="inline">
                                        <label>Name <input name="name" value="Kai"></label>
                                        <label>Score <input name="score" type="number" step="0.01" value="1125" required></label>
                                    </div>
                                    <label>Description <textarea name="description">New challenger climbing into contention.</textarea></label>
                                    <button type="submit">Save player</button>
                                </form>
                            </section>

                            <section class="panel">
                                <h2>Increment a score</h2>
                                <form id="increment-form">
                                    <div class="inline">
                                        <label>User ID <input name="user_id" value="player-2" required></label>
                                        <label>Amount <input name="amount" type="number" step="0.01" value="25" required></label>
                                    </div>
                                    <label>Name for a new user <input name="name" value=""></label>
                                    <label>Description for a new user <textarea name="description"></textarea></label>
                                    <button type="submit">Add points</button>
                                </form>
                            </section>

                            <section class="panel">
                                <h2>Leaderboard settings</h2>
                                <form id="config-form">
                                    <div class="inline">
                                        <label>Top entries to view <input id="top-count" type="number" min="1" value="5"></label>
                                        <label>Entries around rank <input id="around-count" type="number" min="1" value="5"></label>
                                    </div>
                                    <div class="inline">
                                        <label>Center rank <input id="around-rank" type="number" min="1" value="3"></label>
                                        <label>Max leaderboard size <input name="max_entries" id="max-entries" type="number" min="1" value="100"></label>
                                    </div>
                                    <button type="submit">Apply max size</button>
                                </form>
                                <div class="toolbar" style="margin-top: 14px;">
                                    <button class="secondary" id="refresh-button" type="button">Refresh view</button>
                                    <button class="secondary" id="reset-button" type="button">Reset sample data</button>
                                </div>
                                <div class="statline">
                                    <span>Leaderboard key: <strong id="leaderboard-key">leaderboard:demo</strong></span>
                                    <span>Stored entries: <strong id="leaderboard-size">0</strong></span>
                                    <span>Max kept: <strong id="leaderboard-limit">100</strong></span>
                                </div>
                            </section>
                        </div>

                        <div class="grid" style="margin-top: 18px;">
                            <section class="panel">
                                <h2>Top entries</h2>
                                <div class="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Rank</th>
                                                <th>User</th>
                                                <th>Score</th>
                                                <th>Metadata</th>
                                            </tr>
                                        </thead>
                                        <tbody id="top-table"></tbody>
                                    </table>
                                </div>
                            </section>

                            <section class="panel">
                                <h2>Entries around rank</h2>
                                <div class="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Rank</th>
                                                <th>User</th>
                                                <th>Score</th>
                                                <th>Metadata</th>
                                            </tr>
                                        </thead>
                                        <tbody id="around-table"></tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </main>

                    <script>
                        const banner = document.getElementById('banner');

                        function setBanner(message, isSuccess = true) {
                            banner.textContent = message;
                            banner.className = 'banner' + (isSuccess ? ' success' : '');
                        }

                        function renderRows(targetId, entries) {
                            const target = document.getElementById(targetId);
                            if (!entries.length) {
                                target.innerHTML = '<tr><td colspan="4">No entries found for this view.</td></tr>';
                                return;
                            }

                            target.innerHTML = entries.map((entry) => {
                                const metadata = entry.metadata || {};
                                const name = metadata.name || entry.user_id;
                                const description = metadata.description || '';
                                return `
                                    <tr>
                                        <td>#${entry.rank}</td>
                                        <td><strong>${entry.user_id}</strong><br><span>${name}</span></td>
                                        <td>${entry.score}</td>
                                        <td>${description}</td>
                                    </tr>
                                `;
                            }).join('');
                        }

                        async function refreshState() {
                            const top = document.getElementById('top-count').value || '5';
                            const around = document.getElementById('around-count').value || '5';
                            const rank = document.getElementById('around-rank').value || '3';
                            const response = await fetch(`/api/state?top=${encodeURIComponent(top)}&around=${encodeURIComponent(around)}&rank=${encodeURIComponent(rank)}`);
                            const data = await response.json();

                            document.getElementById('leaderboard-key').textContent = data.leaderboard_key;
                            document.getElementById('leaderboard-size').textContent = data.size;
                            document.getElementById('leaderboard-limit').textContent = data.max_entries;
                            document.getElementById('max-entries').value = data.max_entries;

                            renderRows('top-table', data.top_entries);
                            renderRows('around-table', data.around_entries);
                        }

                        async function postForm(url, form) {
                            const response = await fetch(url, {
                                method: 'POST',
                                body: new URLSearchParams(new FormData(form))
                            });
                            return response.json();
                        }

                        document.getElementById('upsert-form').addEventListener('submit', async (event) => {
                            event.preventDefault();
                            const data = await postForm('/api/players', event.target);
                            if (data.error) {
                                setBanner(data.error, false);
                                return;
                            }
                            const trimmed = data.entry.trimmed_user_ids || [];
                            const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                            setBanner(`Saved ${data.entry.user_id} at rank #${data.entry.rank} with score ${data.entry.score}.${trimmedText}`);
                            await refreshState();
                        });

                        document.getElementById('increment-form').addEventListener('submit', async (event) => {
                            event.preventDefault();
                            const data = await postForm('/api/increment', event.target);
                            if (data.error) {
                                setBanner(data.error, false);
                                return;
                            }
                            const trimmed = data.entry.trimmed_user_ids || [];
                            const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                            setBanner(`Updated ${data.entry.user_id} to score ${data.entry.score} at rank #${data.entry.rank}.${trimmedText}`);
                            await refreshState();
                        });

                        document.getElementById('config-form').addEventListener('submit', async (event) => {
                            event.preventDefault();
                            const data = await postForm('/api/config', event.target);
                            if (data.error) {
                                setBanner(data.error, false);
                                return;
                            }
                            const trimmed = data.trimmed_user_ids || [];
                            const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                            setBanner(`Leaderboard limit set to ${data.max_entries}.${trimmedText}`);
                            await refreshState();
                        });

                        document.getElementById('refresh-button').addEventListener('click', refreshState);

                        document.getElementById('reset-button').addEventListener('click', async () => {
                            const response = await fetch('/api/reset', { method: 'POST' });
                            const data = await response.json();
                            setBanner(data.message);
                            await refreshState();
                        });

                        refreshState().catch((error) => {
                            setBanner(`Failed to load leaderboard state: ${error}`, false);
                        });
                    </script>
                </body>
                </html>
                """;
    }
}
