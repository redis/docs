using System.Text.Encodings.Web;
using SessionStoreDemo;
using StackExchange.Redis;

var port = 8080;
var redisHost = "localhost";
var redisPort = 6379;

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

port = int.TryParse(Environment.GetEnvironmentVariable("PORT"), out var envPort) ? envPort : port;
redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? redisHost;
redisPort = int.TryParse(Environment.GetEnvironmentVariable("REDIS_PORT"), out var envRedisPort)
    ? envRedisPort
    : redisPort;

ConnectionMultiplexer redis;
try
{
    redis = ConnectionMultiplexer.Connect($"{redisHost}:{redisPort}");
    redis.GetDatabase().Ping();
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Failed to connect to Redis at {redisHost}:{redisPort}: {ex.Message}");
    return 1;
}

var store = new RedisSessionStore(redis.GetDatabase());

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();

app.MapGet("/", (HttpContext context) =>
{
    var sessionId = context.Request.Cookies["sid"];
    var session = EnrichSession(store, sessionId);
    return Results.Content(HtmlPage.Generate(sessionId, session), "text/html");
});

app.MapGet("/session", (HttpContext context) =>
{
    var sessionId = context.Request.Cookies["sid"];
    if (string.IsNullOrWhiteSpace(sessionId))
    {
        return Results.Json(new { authenticated = false, session = (object?)null });
    }

    var session = EnrichSession(store, sessionId);
    if (session is null)
    {
        context.Response.Cookies.Delete("sid", new CookieOptions { Path = "/" });
        return Results.Json(new { authenticated = false, session = (object?)null });
    }

    return Results.Json(new
    {
        authenticated = true,
        session_id = sessionId,
        session,
        configured_ttl = store.GetConfiguredTtl(sessionId),
        ttl = store.GetTtl(sessionId)
    });
});

app.MapPost("/login", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var username = (form["username"].ToString().Trim());
    if (string.IsNullOrWhiteSpace(username))
    {
        username = "Guest";
    }

    if (!int.TryParse(form["ttl"], out var ttl) || ttl < 1)
    {
        return Results.BadRequest(new { error = "TTL must be a whole number greater than 0." });
    }

    var sessionId = store.CreateSession(new Dictionary<string, string>
    {
        ["username"] = username,
        ["page_views"] = "1"
    }, ttl);

    context.Response.Cookies.Append("sid", sessionId, new CookieOptions
    {
        HttpOnly = true,
        Path = "/",
        SameSite = SameSiteMode.Lax
    });

    var session = EnrichSession(store, sessionId);
    return Results.Json(new
    {
        authenticated = true,
        session_id = sessionId,
        session,
        configured_ttl = store.GetConfiguredTtl(sessionId),
        ttl = store.GetTtl(sessionId)
    });
});

app.MapPost("/increment", (HttpContext context) =>
{
    var sessionId = context.Request.Cookies["sid"];
    if (string.IsNullOrWhiteSpace(sessionId))
    {
        return Results.Json(new { error = "No active session" }, statusCode: StatusCodes.Status401Unauthorized);
    }

    var pageViews = store.IncrementField(sessionId, "page_views");
    if (pageViews is null)
    {
        context.Response.Cookies.Delete("sid", new CookieOptions { Path = "/" });
        return Results.Json(new { error = "Session expired" }, statusCode: StatusCodes.Status401Unauthorized);
    }

    var session = EnrichSession(store, sessionId);
    if (session is null)
    {
        context.Response.Cookies.Delete("sid", new CookieOptions { Path = "/" });
        return Results.Json(new { error = "Session expired" }, statusCode: StatusCodes.Status401Unauthorized);
    }

    return Results.Json(new
    {
        authenticated = true,
        session_id = sessionId,
        session,
        configured_ttl = store.GetConfiguredTtl(sessionId),
        ttl = store.GetTtl(sessionId),
        page_views = pageViews.Value
    });
});

app.MapPost("/ttl", async (HttpContext context) =>
{
    var sessionId = context.Request.Cookies["sid"];
    if (string.IsNullOrWhiteSpace(sessionId))
    {
        return Results.Json(new { error = "No active session" }, statusCode: StatusCodes.Status401Unauthorized);
    }

    var form = await context.Request.ReadFormAsync();
    if (!int.TryParse(form["ttl"], out var ttl) || ttl < 1)
    {
        return Results.BadRequest(new { error = "TTL must be a whole number greater than 0." });
    }

    if (!store.SetSessionTtl(sessionId, ttl))
    {
        context.Response.Cookies.Delete("sid", new CookieOptions { Path = "/" });
        return Results.Json(new { error = "Session expired" }, statusCode: StatusCodes.Status401Unauthorized);
    }

    var session = EnrichSession(store, sessionId);
    if (session is null)
    {
        context.Response.Cookies.Delete("sid", new CookieOptions { Path = "/" });
        return Results.Json(new { error = "Session expired" }, statusCode: StatusCodes.Status401Unauthorized);
    }

    return Results.Json(new
    {
        authenticated = true,
        session_id = sessionId,
        session,
        configured_ttl = store.GetConfiguredTtl(sessionId),
        ttl = store.GetTtl(sessionId)
    });
});

app.MapPost("/logout", (HttpContext context) =>
{
    var sessionId = context.Request.Cookies["sid"];
    if (!string.IsNullOrWhiteSpace(sessionId))
    {
        store.DeleteSession(sessionId);
    }

    context.Response.Cookies.Delete("sid", new CookieOptions { Path = "/" });
    return Results.Json(new { authenticated = false });
});

Console.WriteLine($"Session store demo listening on http://localhost:{port}");
app.Run();
return 0;

static Dictionary<string, string>? EnrichSession(RedisSessionStore store, string? sessionId)
{
    if (string.IsNullOrWhiteSpace(sessionId))
    {
        return null;
    }

    var session = store.GetSession(sessionId);
    if (session is null)
    {
        return null;
    }

    session["ttl"] = store.GetTtl(sessionId).ToString();
    var configuredTtl = store.GetConfiguredTtl(sessionId);
    if (configuredTtl is not null)
    {
        session["session_ttl"] = configuredTtl.Value.ToString();
    }

    return session;
}

static class HtmlPage
{
    public static string Generate(string? sessionId, Dictionary<string, string>? session)
    {
        var initialSessionHtml = SessionView(sessionId, session);

        return $$"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Redis Session Store Demo</title>
          <style>
            :root {
              --bg: #f6f1e8;
              --panel: #fffaf2;
              --ink: #1f2933;
              --accent: #b8572f;
              --accent-dark: #8f421f;
              --muted: #5d6b75;
              --line: #e7d9c6;
              --ok: #d7f0de;
              --warn: #f7dfd7;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Georgia, "Times New Roman", serif;
              color: var(--ink);
              background:
                radial-gradient(circle at top left, #fff7ea, transparent 32rem),
                linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);
              min-height: 100vh;
            }
            main {
              max-width: 960px;
              margin: 0 auto;
              padding: 48px 20px 72px;
            }
            h1 {
              font-size: clamp(2.2rem, 5vw, 4rem);
              line-height: 1;
              margin-bottom: 12px;
            }
            p.lede {
              max-width: 48rem;
              font-size: 1.1rem;
              color: var(--muted);
            }
            .grid {
              display: grid;
              gap: 20px;
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              margin-top: 28px;
            }
            .panel {
              background: rgba(255, 250, 242, 0.92);
              border: 1px solid var(--line);
              border-radius: 18px;
              padding: 22px;
              box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);
            }
            .panel h2 { margin-top: 0; margin-bottom: 10px; }
            .pill {
              display: inline-block;
              border-radius: 999px;
              background: #efe2cf;
              color: var(--accent-dark);
              padding: 6px 10px;
              font-size: 0.9rem;
              margin-bottom: 12px;
            }
            label { display: block; font-weight: bold; margin-bottom: 8px; }
            input {
              width: 100%;
              padding: 10px 12px;
              border-radius: 10px;
              border: 1px solid #cfbca6;
              font: inherit;
              background: white;
            }
            button {
              appearance: none;
              border: 0;
              border-radius: 999px;
              background: var(--accent);
              color: white;
              padding: 11px 18px;
              font: inherit;
              cursor: pointer;
              margin-right: 8px;
              margin-top: 12px;
            }
            button.secondary { background: #38424a; }
            button:hover { background: var(--accent-dark); }
            button.secondary:hover { background: #20282e; }
            dl {
              display: grid;
              grid-template-columns: max-content 1fr;
              gap: 8px 14px;
              margin: 0;
            }
            dt { font-weight: bold; }
            dd { margin: 0; word-break: break-word; }
            #status {
              margin-top: 20px;
              padding: 14px 16px;
              border-radius: 14px;
              display: none;
            }
            #status.ok { display: block; background: var(--ok); }
            #status.error { display: block; background: var(--warn); }
            @media (max-width: 600px) {
              main { padding-top: 28px; }
              button { width: 100%; }
            }
          </style>
        </head>
        <body>
          <main>
            <div class="pill">StackExchange.Redis + ASP.NET Core demo</div>
            <h1>Redis Session Store Demo</h1>
            <p class="lede">
              Start a session, refresh it by interacting with the page, and watch Redis
              hold the server-side session data while the browser keeps only an opaque cookie.
            </p>

            <div class="grid">
              <section class="panel">
                <h2>Start a session</h2>
                <form id="login-form">
                  <label for="username">Username</label>
                  <input id="username" name="username" value="Andrew" maxlength="40">
                  <label for="ttl">Session TTL (seconds)</label>
                  <input id="ttl" name="ttl" type="number" value="15" min="1" step="1">
                  <button type="submit">Create session</button>
                </form>
                <p>Try a short TTL like 10 or 15 seconds to watch the session expire, then interact with the page to see the expiration refresh.</p>
              </section>

              <section class="panel">
                <h2>Current session</h2>
                <div id="session-view">{{initialSessionHtml}}</div>
              </section>
            </div>

            <div id="status"></div>
          </main>

          <script>
            const sessionView = document.getElementById("session-view");
            const statusBox = document.getElementById("status");

            function setStatus(message, kind) {
              statusBox.textContent = message;
              statusBox.className = kind;
            }

            function renderLoggedOut() {
              sessionView.innerHTML =
                "<p>No active session.</p>" +
                "<p>Create one to store state in Redis and receive a cookie-backed session ID.</p>";
            }

            function escapeHtml(value) {
              return String(value).replace(/[&<>"']/g, (char) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[char]);
            }

            function renderSession(data) {
              if (!data || !data.authenticated) {
                renderLoggedOut();
                return;
              }

              const session = data.session || {};
              const sessionId = escapeHtml(data.session_id || "");
              const username = escapeHtml(session.username || "");
              const pageViews = escapeHtml(session.page_views || "0");
              const configuredTtl = escapeHtml(String(data.configured_ttl || session.session_ttl || ""));
              const createdAt = escapeHtml(session.created_at || "");
              const lastAccessed = escapeHtml(session.last_accessed_at || "");
              const ttl = escapeHtml(String(data.ttl || session.ttl || ""));

              sessionView.innerHTML =
                "<dl>" +
                "<dt>Session ID</dt><dd>" + sessionId + "</dd>" +
                "<dt>Username</dt><dd>" + username + "</dd>" +
                "<dt>Page views</dt><dd>" + pageViews + "</dd>" +
                "<dt>Configured TTL</dt><dd>" + configuredTtl + " seconds</dd>" +
                "<dt>Created</dt><dd>" + createdAt + "</dd>" +
                "<dt>Last accessed</dt><dd>" + lastAccessed + "</dd>" +
                "<dt>TTL</dt><dd>" + ttl + " seconds</dd>" +
                "</dl>" +
                '<form id="ttl-form">' +
                '<label for="active-ttl">Update session TTL (seconds)</label>' +
                '<input id="active-ttl" name="ttl" type="number" value="' + configuredTtl + '" min="1" step="1">' +
                '<button type="submit">Apply TTL</button>' +
                "</form>" +
                '<button id="increment-button">Increment page views</button>' +
                '<button id="logout-button" class="secondary">Log out</button>';

              document.getElementById("ttl-form").addEventListener("submit", updateTtl);
              document.getElementById("increment-button").addEventListener("click", incrementSession);
              document.getElementById("logout-button").addEventListener("click", logoutSession);
            }

            async function fetchSession() {
              const response = await fetch("/session");
              const data = await response.json();
              renderSession(data);
            }

            async function incrementSession() {
              const response = await fetch("/increment", { method: "POST" });
              const data = await response.json();

              if (!response.ok) {
                renderLoggedOut();
                setStatus(data.error || "Unable to update the session.", "error");
                return;
              }

              renderSession(data);
              setStatus("Session updated in Redis and TTL refreshed.", "ok");
            }

            async function updateTtl(event) {
              event.preventDefault();
              const formData = new FormData(event.target);
              const response = await fetch("/ttl", {
                method: "POST",
                body: new URLSearchParams(formData),
              });
              const data = await response.json();

              if (!response.ok) {
                if (response.status === 401) {
                  renderLoggedOut();
                }
                setStatus(data.error || "Unable to update the TTL.", "error");
                return;
              }

              renderSession(data);
              setStatus("Session TTL updated in Redis.", "ok");
            }

            async function logoutSession() {
              await fetch("/logout", { method: "POST" });
              renderLoggedOut();
              setStatus("Session deleted from Redis and cookie cleared.", "ok");
            }

            document.getElementById("login-form").addEventListener("submit", async (event) => {
              event.preventDefault();
              const formData = new FormData(event.target);
              const response = await fetch("/login", {
                method: "POST",
                body: new URLSearchParams(formData),
              });
              const data = await response.json();

              if (!response.ok) {
                setStatus(data.error || "Unable to create the session.", "error");
                return;
              }

              renderSession(data);
              setStatus("Session created in Redis and cookie issued.", "ok");
            });

            fetchSession();
          </script>
        </body>
        </html>
        """;
    }

    private static string SessionView(string? sessionId, Dictionary<string, string>? session)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || session is null)
        {
            return "<p>No active session.</p><p>Create one to store state in Redis and receive a cookie-backed session ID.</p>";
        }

        return string.Join(string.Empty, new[]
        {
            "<dl>",
            $"<dt>Session ID</dt><dd>{EscapeHtml(sessionId)}</dd>",
            $"<dt>Username</dt><dd>{EscapeHtml(session.GetValueOrDefault("username"))}</dd>",
            $"<dt>Page views</dt><dd>{EscapeHtml(session.GetValueOrDefault("page_views"))}</dd>",
            $"<dt>Configured TTL</dt><dd>{EscapeHtml(session.GetValueOrDefault("session_ttl"))} seconds</dd>",
            $"<dt>Created</dt><dd>{EscapeHtml(session.GetValueOrDefault("created_at"))}</dd>",
            $"<dt>Last accessed</dt><dd>{EscapeHtml(session.GetValueOrDefault("last_accessed_at"))}</dd>",
            $"<dt>TTL</dt><dd>{EscapeHtml(session.GetValueOrDefault("ttl"))} seconds</dd>",
            "</dl>",
            "<form id=\"ttl-form\">",
            "<label for=\"active-ttl\">Update session TTL (seconds)</label>",
            $"<input id=\"active-ttl\" name=\"ttl\" type=\"number\" value=\"{EscapeHtml(session.GetValueOrDefault("session_ttl"))}\" min=\"1\" step=\"1\">",
            "<button type=\"submit\">Apply TTL</button>",
            "</form>",
            "<button id=\"increment-button\">Increment page views</button>",
            "<button id=\"logout-button\" class=\"secondary\">Log out</button>"
        });
    }

    private static string EscapeHtml(string? value) =>
        string.IsNullOrEmpty(value) ? string.Empty : HtmlEncoder.Default.Encode(value);
}
