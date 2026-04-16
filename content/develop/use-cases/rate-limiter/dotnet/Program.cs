// Token Bucket Rate Limiter Demo Server
//
// A simple HTTP server demonstrating the token bucket rate limiter
// using ASP.NET Core minimal APIs.
//
// Usage:
//     dotnet run [-- --port 8080]
//
// Environment variables:
//     PORT         - Server port (default: 8080)
//     REDIS_HOST   - Redis host (default: localhost)
//     REDIS_PORT   - Redis port (default: 6379)

using System.Text.Json;
using RateLimiter;
using StackExchange.Redis;

var port = 8080;
var redisHost = "localhost";
var redisPort = 6379;

// Parse command-line arguments
for (var i = 0; i < args.Length; i++)
{
    switch (args[i])
    {
        case "--port" when i + 1 < args.Length:
            port = int.Parse(args[++i]);
            break;
        case "--redis-host" when i + 1 < args.Length:
            redisHost = args[++i];
            break;
        case "--redis-port" when i + 1 < args.Length:
            redisPort = int.Parse(args[++i]);
            break;
    }
}

// Also check environment variables
port = int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var envPort) ? envPort : port;
redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? redisHost;
redisPort = int.TryParse(Environment.GetEnvironmentVariable("REDIS_PORT"), out var envRedisPort)
    ? envRedisPort
    : redisPort;

// Initialize Redis connection
ConnectionMultiplexer redis;
try
{
    redis = ConnectionMultiplexer.Connect($"{redisHost}:{redisPort}");
    redis.GetDatabase().Ping();
    Console.WriteLine($"✓ Connected to Redis at {redisHost}:{redisPort}");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"✗ Failed to connect to Redis: {ex.Message}");
    Console.Error.WriteLine($"  Make sure Redis is running at {redisHost}:{redisPort}");
    return 1;
}

// Shared state
var capacity = 10;
var refillRate = 1;
var refillInterval = 1.0;
var limiter = new TokenBucket(capacity, refillRate, refillInterval, redis.GetDatabase());
var lockObj = new object();

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();

// GET / — serve the interactive HTML page
app.MapGet("/", () =>
{
    int cap;
    int rate;
    double interval;
    lock (lockObj) { cap = capacity; rate = refillRate; interval = refillInterval; }
    return Results.Content(HtmlPage.Generate(cap, rate, interval), "text/html");
});

// POST /test — check rate limit and return JSON
app.MapPost("/test", () =>
{
    TokenBucket current;
    lock (lockObj) { current = limiter; }

    var (allowed, remaining) = current.Allow("demo:request");

    int cap;
    int rate;
    double interval;
    lock (lockObj) { cap = capacity; rate = refillRate; interval = refillInterval; }

    return Results.Json(new
    {
        allowed,
        remaining,
        config = new { capacity = cap, refill_rate = rate, refill_interval = interval }
    });
});

// POST /config — update rate limiter settings
app.MapPost("/config", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();

    try
    {
        lock (lockObj)
        {
            if (form.TryGetValue("capacity", out var capVal))
                capacity = int.Parse(capVal!);
            if (form.TryGetValue("refill_rate", out var rateVal))
                refillRate = int.Parse(rateVal!);
            if (form.TryGetValue("refill_interval", out var intervalVal))
                refillInterval = double.Parse(intervalVal!);

            limiter = new TokenBucket(capacity, refillRate, refillInterval, redis.GetDatabase());
        }

        return Results.Json(new
        {
            success = true,
            config = new { capacity, refill_rate = refillRate, refill_interval = refillInterval }
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new { success = false, error = ex.Message });
    }
});

Console.WriteLine($"✓ Server started at http://localhost:{port}");
Console.WriteLine($"  Open your browser and visit http://localhost:{port}");
Console.WriteLine("  Press Ctrl+C to stop the server");

app.Run();
return 0;

// ---------------------------------------------------------------------------
// HtmlPage — generates the interactive demo UI
// ---------------------------------------------------------------------------

/// <summary>
/// Generates the HTML page for the interactive rate limiter demo.
/// </summary>
public static class HtmlPage
{
    public static string Generate(int capacity, int refillRate, double refillInterval) => $$"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Token Bucket Rate Limiter Demo</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                h1 { color: #333; }
                .config-section, .test-section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
                .form-group { margin: 10px 0; }
                label { display: inline-block; width: 150px; font-weight: bold; }
                input { padding: 5px; width: 200px; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px 10px 0; }
                button:hover { background: #0056b3; }
                .result { padding: 15px; margin: 15px 0; border-radius: 5px; font-size: 18px; font-weight: bold; }
                .allowed { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
                .denied { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
                .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; padding: 10px; margin: 10px 0; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>Token Bucket Rate Limiter Demo</h1>

            <div class="info">
                <strong>How it works:</strong> The token bucket starts with a capacity of tokens.
                Each request consumes one token. Tokens refill at a constant rate. When the bucket
                is empty, requests are denied until tokens refill.
            </div>

            <div class="config-section">
                <h2>Configuration</h2>
                <p>Current settings:</p>
                <ul>
                    <li><strong>Capacity:</strong> <span id="current-capacity">{{capacity}}</span> tokens</li>
                    <li><strong>Refill Rate:</strong> <span id="current-refill-rate">{{refillRate}}</span> tokens</li>
                    <li><strong>Refill Interval:</strong> <span id="current-refill-interval">{{refillInterval}}</span> seconds</li>
                </ul>

                <form id="config-form">
                    <div class="form-group">
                        <label for="capacity">Capacity:</label>
                        <input type="number" id="capacity" name="capacity" value="{{capacity}}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="refill_rate">Refill Rate:</label>
                        <input type="number" id="refill_rate" name="refill_rate" value="{{refillRate}}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="refill_interval">Refill Interval (s):</label>
                        <input type="number" id="refill_interval" name="refill_interval" value="{{refillInterval}}" step="0.1" min="0.1" required>
                    </div>
                    <button type="submit">Update Configuration</button>
                </form>
            </div>

            <div class="test-section">
                <h2>Test Rate Limiting</h2>
                <p>Click the button below to submit a request and see if it's allowed or denied.</p>
                <button id="test-button">Submit Request</button>
                <div id="result"></div>
            </div>

            <script>
                document.getElementById('test-button').addEventListener('click', async () => {
                    const response = await fetch('/test', { method: 'POST' });
                    const data = await response.json();

                    const resultDiv = document.getElementById('result');
                    const status = data.allowed ? '\u2713 ALLOWED' : '\u2717 DENIED';
                    const className = data.allowed ? 'allowed' : 'denied';

                    resultDiv.className = 'result ' + className;
                    resultDiv.innerHTML =
                        '<div>' + status + '</div>' +
                        '<div style="font-size: 14px; margin-top: 10px;">' +
                        'Tokens remaining: ' + data.remaining.toFixed(2) +
                        '</div>';
                });

                document.getElementById('config-form').addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const formData = new FormData(e.target);
                    const response = await fetch('/config', {
                        method: 'POST',
                        body: new URLSearchParams(formData)
                    });
                    const data = await response.json();

                    if (data.success) {
                        document.getElementById('current-capacity').textContent = data.config.capacity;
                        document.getElementById('current-refill-rate').textContent = data.config.refill_rate;
                        document.getElementById('current-refill-interval').textContent = data.config.refill_interval;
                        alert('Configuration updated successfully!');
                    } else {
                        alert('Error updating configuration: ' + data.error);
                    }
                });
            </script>
        </body>
        </html>
        """;
}