#!/usr/bin/env node
/**
 * Redis leaderboard demo server.
 *
 * Run this file and visit http://localhost:8080 to add players, change scores,
 * inspect the top N entries, and view entries around a rank.
 */

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { createClient } = require("redis");
const { RedisLeaderboard } = require("./leaderboard");

const SAMPLE_PLAYERS = [
  {
    userId: "player-1",
    score: 980,
    metadata: {
      name: "Avery",
      description: "Steady climber who never wastes a turn.",
    },
  },
  {
    userId: "player-2",
    score: 1310,
    metadata: {
      name: "Mina",
      description: "Always finds a way into the top three.",
    },
  },
  {
    userId: "player-3",
    score: 1175,
    metadata: {
      name: "Noah",
      description: "Takes big swings and occasionally lands them.",
    },
  },
  {
    userId: "player-4",
    score: 1435,
    metadata: {
      name: "Priya",
      description: "Current pace-setter with a ruthless endgame.",
    },
  },
  {
    userId: "player-5",
    score: 1080,
    metadata: {
      name: "Jules",
      description: "Quietly consistent and hard to catch.",
    },
  },
  {
    userId: "player-6",
    score: 1240,
    metadata: {
      name: "Rin",
      description: "Moves fast after every weekly reset.",
    },
  },
];

let leaderboard = null;
let redisClient = null;

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    host: "127.0.0.1",
    port: 8080,
    redisHost: "localhost",
    redisPort: 6379,
    maxEntries: 100,
  };

  for (let i = 0; i < args.length; i += 1) {
    switch (args[i]) {
      case "--host":
        config.host = args[i + 1];
        i += 1;
        break;
      case "--port":
        config.port = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      case "--redis-host":
        config.redisHost = args[i + 1];
        i += 1;
        break;
      case "--redis-port":
        config.redisPort = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      case "--max-entries":
        config.maxEntries = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      default:
        break;
    }
  }

  return config;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, content) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(content);
}

function parsePositiveInt(rawValue, defaultValue = null) {
  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value) || value < 1) {
    return defaultValue;
  }
  return value;
}

function parseFloatValue(rawValue) {
  const value = Number.parseFloat(rawValue);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

async function resetDemoData() {
  await leaderboard.clear();
  for (const player of SAMPLE_PLAYERS) {
    await leaderboard.upsertUser(player.userId, player.score, player.metadata);
  }
}

async function handleStateRequest(url, res) {
  const topCount = parsePositiveInt(url.searchParams.get("top"), 5);
  const aroundRank = parsePositiveInt(url.searchParams.get("rank"), 3);
  const aroundCount = parsePositiveInt(url.searchParams.get("around"), 5);

  const [topEntries, aroundEntries, size] = await Promise.all([
    leaderboard.getTop(topCount),
    leaderboard.getAroundRank(aroundRank, aroundCount),
    leaderboard.getSize(),
  ]);

  sendJson(res, 200, {
    leaderboardKey: leaderboard.key,
    maxEntries: leaderboard.maxEntries,
    topCount,
    aroundRank,
    aroundCount,
    size,
    topEntries,
    aroundEntries,
  });
}

async function handlePlayerUpsert(req, res) {
  const params = new URLSearchParams(await readBody(req));
  const userId = (params.get("user_id") || "").trim();
  const score = parseFloatValue(params.get("score"));
  const name = (params.get("name") || "").trim();
  const description = (params.get("description") || "").trim();

  if (!userId) {
    sendJson(res, 400, { error: "User ID is required." });
    return;
  }

  if (score === null) {
    sendJson(res, 400, { error: "Score must be a valid number." });
    return;
  }

  const entry = await leaderboard.upsertUser(userId, score, {
    name: name || userId,
    description: description || "No description provided.",
  });

  sendJson(res, 200, {
    message: "Player saved.",
    entry,
    maxEntries: leaderboard.maxEntries,
  });
}

async function handleIncrement(req, res) {
  const params = new URLSearchParams(await readBody(req));
  const userId = (params.get("user_id") || "").trim();
  const amount = parseFloatValue(params.get("amount"));
  const name = (params.get("name") || "").trim();
  const description = (params.get("description") || "").trim();

  if (!userId) {
    sendJson(res, 400, { error: "User ID is required." });
    return;
  }

  if (amount === null) {
    sendJson(res, 400, { error: "Increment must be a valid number." });
    return;
  }

  const existingMetadata = await leaderboard.getUserMetadata(userId);
  const metadata = Object.keys(existingMetadata).length > 0
    ? { ...existingMetadata }
    : {
        name: name || userId,
        description: description || "Created during score increment.",
      };

  if (Object.keys(existingMetadata).length > 0) {
    if (name) {
      metadata.name = name;
    }
    if (description) {
      metadata.description = description;
    }
  }

  const entry = await leaderboard.incrementScore(userId, amount, metadata);
  sendJson(res, 200, {
    message: "Score updated.",
    entry,
    maxEntries: leaderboard.maxEntries,
  });
}

async function handleConfigUpdate(req, res) {
  const params = new URLSearchParams(await readBody(req));
  const maxEntries = parsePositiveInt(params.get("max_entries"));
  if (maxEntries === null) {
    sendJson(res, 400, { error: "Max entries must be a whole number greater than 0." });
    return;
  }

  const trimmedUserIds = await leaderboard.setMaxEntries(maxEntries);
  sendJson(res, 200, {
    message: "Leaderboard limit updated.",
    maxEntries: leaderboard.maxEntries,
    trimmedUserIds,
  });
}

async function handleReset(res) {
  await resetDemoData();
  sendJson(res, 200, {
    message: "Demo leaderboard reset.",
    maxEntries: leaderboard.maxEntries,
  });
}

function getHtmlPage() {
  return `<!DOCTYPE html>
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
    const banner = document.getElementById("banner");

    function setBanner(message, isSuccess = true) {
      banner.textContent = message;
      banner.className = "banner" + (isSuccess ? " success" : "");
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
        const description = metadata.description || "";
        return \`
          <tr>
            <td>#\${entry.rank}</td>
            <td><strong>\${entry.userId}</strong><br><span>\${name}</span></td>
            <td>\${entry.score}</td>
            <td>\${description}</td>
          </tr>
        \`;
      }).join("");
    }

    async function refreshState() {
      const top = document.getElementById("top-count").value || "5";
      const around = document.getElementById("around-count").value || "5";
      const rank = document.getElementById("around-rank").value || "3";
      const response = await fetch(\`/api/state?top=\${encodeURIComponent(top)}&around=\${encodeURIComponent(around)}&rank=\${encodeURIComponent(rank)}\`);
      const data = await response.json();

      document.getElementById("leaderboard-key").textContent = data.leaderboardKey;
      document.getElementById("leaderboard-size").textContent = data.size;
      document.getElementById("leaderboard-limit").textContent = data.maxEntries;
      document.getElementById("max-entries").value = data.maxEntries;

      renderRows("top-table", data.topEntries);
      renderRows("around-table", data.aroundEntries);
    }

    async function postForm(url, form) {
      const response = await fetch(url, {
        method: "POST",
        body: new URLSearchParams(new FormData(form)),
      });
      return response.json();
    }

    document.getElementById("upsert-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = await postForm("/api/players", event.target);
      if (data.error) {
        setBanner(data.error, false);
        return;
      }
      const trimmed = data.entry.trimmedUserIds || [];
      const trimmedText = trimmed.length ? \` Trimmed: \${trimmed.join(", ")}.\` : "";
      setBanner(\`Saved \${data.entry.userId} at rank #\${data.entry.rank} with score \${data.entry.score}.\${trimmedText}\`);
      await refreshState();
    });

    document.getElementById("increment-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = await postForm("/api/increment", event.target);
      if (data.error) {
        setBanner(data.error, false);
        return;
      }
      const trimmed = data.entry.trimmedUserIds || [];
      const trimmedText = trimmed.length ? \` Trimmed: \${trimmed.join(", ")}.\` : "";
      setBanner(\`Updated \${data.entry.userId} to score \${data.entry.score} at rank #\${data.entry.rank}.\${trimmedText}\`);
      await refreshState();
    });

    document.getElementById("config-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = await postForm("/api/config", event.target);
      if (data.error) {
        setBanner(data.error, false);
        return;
      }
      const trimmed = data.trimmedUserIds || [];
      const trimmedText = trimmed.length ? \` Trimmed: \${trimmed.join(", ")}.\` : "";
      setBanner(\`Leaderboard limit set to \${data.maxEntries}.\${trimmedText}\`);
      await refreshState();
    });

    document.getElementById("refresh-button").addEventListener("click", refreshState);

    document.getElementById("reset-button").addEventListener("click", async () => {
      const response = await fetch("/api/reset", { method: "POST" });
      const data = await response.json();
      setBanner(data.message);
      await refreshState();
    });

    refreshState().catch((error) => {
      setBanner(\`Failed to load leaderboard state: \${error}\`, false);
    });
  </script>
</body>
</html>`;
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      sendHtml(res, getHtmlPage());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
      await handleStateRequest(url, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/players") {
      await handlePlayerUpsert(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/increment") {
      await handleIncrement(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/config") {
      await handleConfigUpdate(req, res);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/reset") {
      await handleReset(res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  } catch (error) {
    console.error("Request error:", error);
    sendJson(res, 500, { error: "Internal Server Error" });
  }
}

async function main() {
  const args = parseArgs();

  redisClient = createClient({
    socket: {
      host: args.redisHost,
      port: args.redisPort,
    },
  });

  redisClient.on("error", (error) => {
    console.error("Redis error:", error.message);
  });

  try {
    await redisClient.connect();
    await redisClient.ping();
  } catch (error) {
    console.error(`Failed to connect to Redis at ${args.redisHost}:${args.redisPort}`);
    console.error(error.message);
    process.exit(1);
  }

  leaderboard = new RedisLeaderboard({
    redisClient,
    key: "leaderboard:demo",
    maxEntries: args.maxEntries,
  });
  await resetDemoData();

  const server = http.createServer(requestHandler);
  server.listen(args.port, args.host, () => {
    console.log(`Leaderboard demo server running at http://${args.host}:${args.port}`);
    console.log(`Connected to Redis at ${args.redisHost}:${args.redisPort}`);
    console.log(`Keeping the top ${leaderboard.maxEntries} entries`);
    console.log("Press Ctrl+C to stop.");
  });

  process.on("SIGINT", async () => {
    console.log("\nStopping server.");
    server.close();
    await redisClient.quit();
    process.exit(0);
  });
}

main();
