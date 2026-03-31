/**
 * Token Bucket Rate Limiter Demo Server
 *
 * A simple HTTP server demonstrating the token bucket rate limiter.
 * Run this server and visit http://localhost:8080 in your browser to test
 * the rate limiting behavior interactively.
 *
 * Usage:
 *     javac -cp jedis.jar TokenBucket.java DemoServer.java
 *     java -cp .:jedis.jar DemoServer [--port PORT] [--redis-host HOST] [--redis-port PORT]
 */

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class DemoServer {

    private static TokenBucket limiter;
    private static JedisPool jedisPool;
    private static int capacity = 10;
    private static int refillRate = 1;
    private static double refillInterval = 1.0;

    public static void main(String[] args) {
        int port = 8080;
        String redisHost = "localhost";
        int redisPort = 6379;

        // Parse command-line arguments
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
            }
        }

        // Initialize Redis connection
        try {
            jedisPool = new JedisPool(new JedisPoolConfig(), redisHost, redisPort);
            jedisPool.getResource().close(); // Test connection
            System.out.printf("✓ Connected to Redis at %s:%d%n", redisHost, redisPort);
        } catch (Exception e) {
            System.err.printf("✗ Failed to connect to Redis: %s%n", e.getMessage());
            System.err.printf("  Make sure Redis is running at %s:%d%n", redisHost, redisPort);
            System.exit(1);
        }

        // Initialize the rate limiter
        limiter = new TokenBucket(jedisPool, capacity, refillRate, refillInterval);

        // Start the server
        try {
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            server.createContext("/test", new TestHandler());
            server.createContext("/config", new ConfigHandler());
            server.createContext("/", new HomeHandler());
            server.setExecutor(null);
            server.start();

            System.out.printf("✓ Server started at http://localhost:%d%n", port);
            System.out.printf("  Open your browser and visit http://localhost:%d%n", port);
            System.out.println("  Press Ctrl+C to stop the server");

            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                System.out.println("\n✓ Server stopped");
                jedisPool.close();
                server.stop(0);
            }));
        } catch (IOException e) {
            System.err.printf("Server error: %s%n", e.getMessage());
            System.exit(1);
        }
    }

    /** Handle POST /test — check rate limit and return JSON. */
    static class TestHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "Method Not Allowed");
                return;
            }

            TokenBucket.RateLimitResult result = limiter.allow("demo:request");

            String json = String.format(
                "{\"allowed\":%b,\"remaining\":%.2f,\"config\":{\"capacity\":%d,\"refill_rate\":%d,\"refill_interval\":%.1f}}",
                result.allowed(), result.remaining(), capacity, refillRate, refillInterval
            );

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            sendResponse(exchange, 200, json);
        }
    }

    /** Handle POST /config — update rate limiter settings. */
    static class ConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, "Method Not Allowed");
                return;
            }

            String body = readRequestBody(exchange);
            Map<String, String> params = parseFormData(body);
            String json;

            try {
                if (params.containsKey("capacity")) {
                    capacity = Integer.parseInt(params.get("capacity"));
                }
                if (params.containsKey("refill_rate")) {
                    refillRate = Integer.parseInt(params.get("refill_rate"));
                }
                if (params.containsKey("refill_interval")) {
                    refillInterval = Double.parseDouble(params.get("refill_interval"));
                }

                limiter = new TokenBucket(jedisPool, capacity, refillRate, refillInterval);

                json = String.format(
                    "{\"success\":true,\"config\":{\"capacity\":%d,\"refill_rate\":%d,\"refill_interval\":%.1f}}",
                    capacity, refillRate, refillInterval
                );
            } catch (NumberFormatException e) {
                json = String.format("{\"success\":false,\"error\":\"%s\"}", e.getMessage());
            }

            exchange.getResponseHeaders().set("Content-Type", "application/json");
            sendResponse(exchange, 200, json);
        }
    }

    /** Handle GET / — serve the interactive HTML page. */
    static class HomeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (!"/".equals(path) && !"/index.html".equals(path)) {
                sendResponse(exchange, 404, "Not Found");
                return;
            }

            exchange.getResponseHeaders().set("Content-Type", "text/html");
            sendResponse(exchange, 200, getHtmlPage());
        }
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String body)
            throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
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
            }
        }
        return params;
    }

    /** Generate the HTML page for the interactive demo. */
    private static String getHtmlPage() {
        return "<!DOCTYPE html>\n"
            + "<html>\n<head>\n"
            + "    <title>Token Bucket Rate Limiter Demo</title>\n"
            + "    <style>\n"
            + "        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }\n"
            + "        h1 { color: #333; }\n"
            + "        .config-section, .test-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }\n"
            + "        .form-group { margin: 10px 0; }\n"
            + "        label { display: inline-block; width: 150px; font-weight: bold; }\n"
            + "        input { padding: 5px; width: 200px; }\n"
            + "        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px 10px 0; }\n"
            + "        button:hover { background: #0056b3; }\n"
            + "        .result { padding: 15px; margin: 15px 0; border-radius: 5px; font-size: 18px; font-weight: bold; }\n"
            + "        .allowed { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }\n"
            + "        .denied { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }\n"
            + "        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; padding: 10px; margin: 10px 0; border-radius: 5px; }\n"
            + "    </style>\n</head>\n<body>\n"
            + "    <h1>Token Bucket Rate Limiter Demo</h1>\n\n"
            + "    <div class=\"info\">\n"
            + "        <strong>How it works:</strong> The token bucket starts with a capacity of tokens.\n"
            + "        Each request consumes one token. Tokens refill at a constant rate. When the bucket\n"
            + "        is empty, requests are denied until tokens refill.\n"
            + "    </div>\n\n"
            + "    <div class=\"config-section\">\n"
            + "        <h2>Configuration</h2>\n"
            + "        <p>Current settings:</p>\n"
            + "        <ul>\n"
            + "            <li><strong>Capacity:</strong> <span id=\"current-capacity\">" + capacity + "</span> tokens</li>\n"
            + "            <li><strong>Refill Rate:</strong> <span id=\"current-refill-rate\">" + refillRate + "</span> tokens</li>\n"
            + "            <li><strong>Refill Interval:</strong> <span id=\"current-refill-interval\">" + refillInterval + "</span> seconds</li>\n"
            + "        </ul>\n\n"
            + "        <form id=\"config-form\">\n"
            + "            <div class=\"form-group\">\n"
            + "                <label for=\"capacity\">Capacity:</label>\n"
            + "                <input type=\"number\" id=\"capacity\" name=\"capacity\" value=\"" + capacity + "\" min=\"1\" required>\n"
            + "            </div>\n"
            + "            <div class=\"form-group\">\n"
            + "                <label for=\"refill_rate\">Refill Rate:</label>\n"
            + "                <input type=\"number\" id=\"refill_rate\" name=\"refill_rate\" value=\"" + refillRate + "\" min=\"1\" required>\n"
            + "            </div>\n"
            + "            <div class=\"form-group\">\n"
            + "                <label for=\"refill_interval\">Refill Interval (s):</label>\n"
            + "                <input type=\"number\" id=\"refill_interval\" name=\"refill_interval\" value=\"" + refillInterval + "\" step=\"0.1\" min=\"0.1\" required>\n"
            + "            </div>\n"
            + "            <button type=\"submit\">Update Configuration</button>\n"
            + "        </form>\n"
            + "    </div>\n\n"
            + "    <div class=\"test-section\">\n"
            + "        <h2>Test Rate Limiting</h2>\n"
            + "        <p>Click the button below to submit a request and see if it's allowed or denied.</p>\n"
            + "        <button id=\"test-button\">Submit Request</button>\n"
            + "        <div id=\"result\"></div>\n"
            + "    </div>\n\n"
            + "    <script>\n"
            + "        document.getElementById('test-button').addEventListener('click', async () => {\n"
            + "            const response = await fetch('/test', { method: 'POST' });\n"
            + "            const data = await response.json();\n\n"
            + "            const resultDiv = document.getElementById('result');\n"
            + "            const status = data.allowed ? '\\u2713 ALLOWED' : '\\u2717 DENIED';\n"
            + "            const className = data.allowed ? 'allowed' : 'denied';\n\n"
            + "            resultDiv.className = 'result ' + className;\n"
            + "            resultDiv.innerHTML =\n"
            + "                '<div>' + status + '</div>' +\n"
            + "                '<div style=\"font-size: 14px; margin-top: 10px;\">' +\n"
            + "                'Tokens remaining: ' + data.remaining.toFixed(2) +\n"
            + "                '</div>';\n"
            + "        });\n\n"
            + "        document.getElementById('config-form').addEventListener('submit', async (e) => {\n"
            + "            e.preventDefault();\n\n"
            + "            const formData = new FormData(e.target);\n"
            + "            const response = await fetch('/config', {\n"
            + "                method: 'POST',\n"
            + "                body: new URLSearchParams(formData)\n"
            + "            });\n"
            + "            const data = await response.json();\n\n"
            + "            if (data.success) {\n"
            + "                document.getElementById('current-capacity').textContent = data.config.capacity;\n"
            + "                document.getElementById('current-refill-rate').textContent = data.config.refill_rate;\n"
            + "                document.getElementById('current-refill-interval').textContent = data.config.refill_interval;\n"
            + "                alert('Configuration updated successfully!');\n"
            + "            } else {\n"
            + "                alert('Error updating configuration: ' + data.error);\n"
            + "            }\n"
            + "        });\n"
            + "    </script>\n"
            + "</body>\n</html>";
    }
}
