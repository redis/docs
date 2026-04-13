using LeaderboardDemo;
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
    Console.WriteLine($"Connected to Redis at {redisHost}:{redisPort}");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"Failed to connect to Redis: {ex.Message}");
    Console.Error.WriteLine($"Make sure Redis is running at {redisHost}:{redisPort}");
    return 1;
}

var leaderboard = new RedisLeaderboard(redis.GetDatabase(), "leaderboard:demo", 100);
SeedSampleData(leaderboard);
var lockObj = new object();

var builder = WebApplication.CreateBuilder();
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();

app.MapGet("/", () => Results.Content(HtmlPage.Generate(), "text/html"));

app.MapGet("/api/state", (HttpRequest request) =>
{
    int topCount;
    int aroundRank;
    int aroundCount;
    IReadOnlyList<LeaderboardEntry> topEntries;
    IReadOnlyList<LeaderboardEntry> aroundEntries;
    long size;
    int maxEntries;
    string key;

    lock (lockObj)
    {
        topCount = ParsePositiveInt(request.Query["top"], 5);
        aroundRank = ParsePositiveInt(request.Query["rank"], 3);
        aroundCount = ParsePositiveInt(request.Query["around"], 5);
        topEntries = leaderboard.GetTop(topCount);
        aroundEntries = leaderboard.GetAroundRank(aroundRank, aroundCount);
        size = leaderboard.GetSize();
        maxEntries = leaderboard.MaxEntries;
        key = leaderboard.Key;
    }

    return Results.Json(new
    {
        leaderboard_key = key,
        max_entries = maxEntries,
        top_count = topCount,
        around_rank = aroundRank,
        around_count = aroundCount,
        size,
        top_entries = topEntries,
        around_entries = aroundEntries
    });
});

app.MapPost("/api/players", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var userId = form["user_id"].ToString().Trim();
    if (string.IsNullOrWhiteSpace(userId))
    {
        return Results.Json(new { error = "User ID is required." }, statusCode: 400);
    }

    if (!double.TryParse(form["score"], out var score))
    {
        return Results.Json(new { error = "Score must be a valid number." }, statusCode: 400);
    }

    LeaderboardEntry entry;
    int maxEntries;
    lock (lockObj)
    {
        entry = leaderboard.UpsertUser(
            userId,
            score,
            new Dictionary<string, string>
            {
                ["name"] = string.IsNullOrWhiteSpace(form["name"]) ? userId : form["name"].ToString().Trim(),
                ["description"] = string.IsNullOrWhiteSpace(form["description"])
                    ? "No description provided."
                    : form["description"].ToString().Trim()
            });
        maxEntries = leaderboard.MaxEntries;
    }

    return Results.Json(new
    {
        message = "Player saved.",
        entry,
        max_entries = maxEntries
    });
});

app.MapPost("/api/increment", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    var userId = form["user_id"].ToString().Trim();
    if (string.IsNullOrWhiteSpace(userId))
    {
        return Results.Json(new { error = "User ID is required." }, statusCode: 400);
    }

    if (!double.TryParse(form["amount"], out var amount))
    {
        return Results.Json(new { error = "Increment must be a valid number." }, statusCode: 400);
    }

    LeaderboardEntry entry;
    int maxEntries;
    lock (lockObj)
    {
        var metadata = leaderboard.GetUserMetadata(userId).ToDictionary(pair => pair.Key, pair => pair.Value);
        if (metadata.Count == 0)
        {
            metadata["name"] = string.IsNullOrWhiteSpace(form["name"]) ? userId : form["name"].ToString().Trim();
            metadata["description"] = string.IsNullOrWhiteSpace(form["description"])
                ? "Created during score increment."
                : form["description"].ToString().Trim();
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(form["name"]))
            {
                metadata["name"] = form["name"].ToString().Trim();
            }
            if (!string.IsNullOrWhiteSpace(form["description"]))
            {
                metadata["description"] = form["description"].ToString().Trim();
            }
        }

        entry = leaderboard.IncrementScore(userId, amount, metadata);
        maxEntries = leaderboard.MaxEntries;
    }

    return Results.Json(new
    {
        message = "Score updated.",
        entry,
        max_entries = maxEntries
    });
});

app.MapPost("/api/config", async (HttpContext ctx) =>
{
    var form = await ctx.Request.ReadFormAsync();
    if (!int.TryParse(form["max_entries"], out var maxEntries) || maxEntries < 1)
    {
        return Results.Json(new { error = "Max entries must be a whole number greater than 0." }, statusCode: 400);
    }

    IReadOnlyList<string> trimmedUserIds;
    int currentMaxEntries;
    lock (lockObj)
    {
        trimmedUserIds = leaderboard.SetMaxEntries(maxEntries);
        currentMaxEntries = leaderboard.MaxEntries;
    }

    return Results.Json(new
    {
        message = "Leaderboard limit updated.",
        max_entries = currentMaxEntries,
        trimmed_user_ids = trimmedUserIds
    });
});

app.MapPost("/api/reset", () =>
{
    lock (lockObj)
    {
        SeedSampleData(leaderboard);
        return Results.Json(new
        {
            message = "Demo leaderboard reset.",
            max_entries = leaderboard.MaxEntries
        });
    }
});

Console.WriteLine($"Server started at http://localhost:{port}");
Console.WriteLine($"Open your browser and visit http://localhost:{port}");
Console.WriteLine("Press Ctrl+C to stop the server");

app.Run();
return 0;

static int ParsePositiveInt(string? rawValue, int defaultValue) =>
    int.TryParse(rawValue, out var value) && value > 0 ? value : defaultValue;

static void SeedSampleData(RedisLeaderboard leaderboard)
{
    leaderboard.Clear();
    foreach (var player in SamplePlayers.All)
    {
        leaderboard.UpsertUser(player.UserId, player.Score, player.Metadata);
    }
}

file static class SamplePlayers
{
    public static IReadOnlyList<(string UserId, double Score, Dictionary<string, string> Metadata)> All =>
    [
        ("player-1", 980, new Dictionary<string, string>
        {
            ["name"] = "Avery",
            ["description"] = "Steady climber who never wastes a turn."
        }),
        ("player-2", 1310, new Dictionary<string, string>
        {
            ["name"] = "Mina",
            ["description"] = "Always finds a way into the top three."
        }),
        ("player-3", 1175, new Dictionary<string, string>
        {
            ["name"] = "Noah",
            ["description"] = "Takes big swings and occasionally lands them."
        }),
        ("player-4", 1435, new Dictionary<string, string>
        {
            ["name"] = "Priya",
            ["description"] = "Current pace-setter with a ruthless endgame."
        }),
        ("player-5", 1080, new Dictionary<string, string>
        {
            ["name"] = "Jules",
            ["description"] = "Quietly consistent and hard to catch."
        }),
        ("player-6", 1240, new Dictionary<string, string>
        {
            ["name"] = "Rin",
            ["description"] = "Moves fast after every weekly reset."
        })
    ];
}

file static class HtmlPage
{
    public static string Generate() => """
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
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    font-family: Georgia, "Times New Roman", serif;
                    background:
                        radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 28%),
                        linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%);
                    color: var(--text);
                }
                main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; }
                h1, h2, h3 { margin-top: 0; color: #3b2f2f; }
                p { color: var(--muted); line-height: 1.5; }
                .hero {
                    background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(124, 45, 18, 0.08));
                    border: 1px solid var(--line);
                    border-radius: 20px;
                    padding: 28px;
                    margin-bottom: 24px;
                }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
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
                form { display: grid; gap: 10px; }
                label { font-size: 0.95rem; font-weight: 700; color: #4b3b30; }
                input, textarea, button { font: inherit; }
                input, textarea {
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: 12px;
                    border: 1px solid var(--line);
                    background: #fffdf8;
                    color: var(--text);
                }
                textarea { min-height: 90px; resize: vertical; }
                button {
                    border: 0;
                    border-radius: 999px;
                    padding: 11px 16px;
                    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
                    color: white;
                    cursor: pointer;
                    font-weight: 700;
                }
                button.secondary { background: #e6dcc8; color: #4b3b30; }
                .inline { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
                .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
                .statline { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; color: var(--muted); font-size: 0.95rem; }
                .table-wrap { overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; }
                th, td {
                    text-align: left;
                    padding: 10px 8px;
                    border-bottom: 1px solid rgba(215, 202, 178, 0.8);
                    vertical-align: top;
                }
                th { color: #4b3b30; font-size: 0.95rem; }
                .pill {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: rgba(180, 83, 9, 0.1);
                    color: var(--accent-dark);
                    font-size: 0.85rem;
                    font-weight: 700;
                }
                .success { color: var(--good); }
                @media (max-width: 720px) {
                    .inline { grid-template-columns: 1fr; }
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
                        const name = metadata.name || entry.userId;
                        const description = metadata.description || '';
                        return `
                            <tr>
                                <td>#${entry.rank}</td>
                                <td><strong>${entry.userId}</strong><br><span>${name}</span></td>
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
                    const trimmed = data.entry.trimmedUserIds || data.entry.trimmed_user_ids || [];
                    const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                    setBanner(`Saved ${data.entry.userId ?? data.entry.user_id} at rank #${data.entry.rank} with score ${data.entry.score}.${trimmedText}`);
                    await refreshState();
                });

                document.getElementById('increment-form').addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const data = await postForm('/api/increment', event.target);
                    if (data.error) {
                        setBanner(data.error, false);
                        return;
                    }
                    const trimmed = data.entry.trimmedUserIds || data.entry.trimmed_user_ids || [];
                    const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                    setBanner(`Updated ${data.entry.userId ?? data.entry.user_id} to score ${data.entry.score} at rank #${data.entry.rank}.${trimmedText}`);
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
