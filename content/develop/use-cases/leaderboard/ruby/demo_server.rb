#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "uri"
require "webrick"
require "redis"
require_relative "leaderboard"

SAMPLE_PLAYERS = [
  { user_id: "player-1", score: 980, metadata: { "name" => "Avery", "description" => "Steady climber who never wastes a turn." } },
  { user_id: "player-2", score: 1310, metadata: { "name" => "Mina", "description" => "Always finds a way into the top three." } },
  { user_id: "player-3", score: 1175, metadata: { "name" => "Noah", "description" => "Takes big swings and occasionally lands them." } },
  { user_id: "player-4", score: 1435, metadata: { "name" => "Priya", "description" => "Current pace-setter with a ruthless endgame." } },
  { user_id: "player-5", score: 1080, metadata: { "name" => "Jules", "description" => "Quietly consistent and hard to catch." } },
  { user_id: "player-6", score: 1240, metadata: { "name" => "Rin", "description" => "Moves fast after every weekly reset." } }
].freeze

port = Integer(ENV["PORT"] || 8080)
redis_host = ENV["REDIS_HOST"] || "localhost"
redis_port = Integer(ENV["REDIS_PORT"] || 6379)

ARGV.each_with_index do |arg, index|
  case arg
  when "--port"
    port = Integer(ARGV[index + 1])
  when "--redis-host"
    redis_host = ARGV[index + 1]
  when "--redis-port"
    redis_port = Integer(ARGV[index + 1])
  end
end

begin
  redis_client = Redis.new(host: redis_host, port: redis_port)
  redis_client.ping
  puts "Connected to Redis at #{redis_host}:#{redis_port}"
rescue Redis::BaseError => e
  warn "Failed to connect to Redis: #{e.message}"
  warn "Make sure Redis is running at #{redis_host}:#{redis_port}"
  exit 1
end

$leaderboard = RedisLeaderboard.new(redis: redis_client, key: "leaderboard:demo", max_entries: 100)

def seed_sample_data
  $leaderboard.clear
  SAMPLE_PLAYERS.each do |player|
    $leaderboard.upsert_user(player[:user_id], player[:score], player[:metadata])
  end
end

seed_sample_data

def parse_positive_int(value, default)
  Integer(value)
rescue StandardError
  default
else
  value = Integer(value)
  value.positive? ? value : default
end

def json_response(res, payload, status: 200)
  res.status = status
  res["Content-Type"] = "application/json"
  res.body = JSON.generate(payload)
end

def html_page
  <<~HTML
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redis Leaderboard Demo</title>
        <style>
            :root { color-scheme: light; --bg: #f7f4ec; --panel: #fffaf0; --panel-strong: #f0e6d2; --text: #1f2933; --muted: #52606d; --line: #d7cab2; --accent: #b45309; --accent-dark: #7c2d12; --good: #166534; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 28%), linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%); color: var(--text); }
            main { max-width: 1120px; margin: 0 auto; padding: 32px 20px 48px; }
            h1, h2, h3 { margin-top: 0; color: #3b2f2f; }
            p { color: var(--muted); line-height: 1.5; }
            .hero { background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(124, 45, 18, 0.08)); border: 1px solid var(--line); border-radius: 20px; padding: 28px; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }
            .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; padding: 20px; box-shadow: 0 14px 40px rgba(31, 41, 51, 0.05); }
            .banner { background: var(--panel-strong); color: var(--accent-dark); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; min-height: 48px; }
            form { display: grid; gap: 10px; }
            label { font-size: 0.95rem; font-weight: 700; color: #4b3b30; }
            input, textarea, button { font: inherit; }
            input, textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: #fffdf8; color: var(--text); }
            textarea { min-height: 90px; resize: vertical; }
            button { border: 0; border-radius: 999px; padding: 11px 16px; background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white; cursor: pointer; font-weight: 700; }
            button.secondary { background: #e6dcc8; color: #4b3b30; }
            .inline { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
            .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
            .statline { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; color: var(--muted); font-size: 0.95rem; }
            .table-wrap { overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid rgba(215, 202, 178, 0.8); vertical-align: top; }
            th { color: #4b3b30; font-size: 0.95rem; }
            .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; background: rgba(180, 83, 9, 0.1); color: var(--accent-dark); font-size: 0.85rem; font-weight: 700; }
            .success { color: var(--good); }
            @media (max-width: 720px) { .inline { grid-template-columns: 1fr; } }
        </style>
    </head>
    <body>
        <main>
            <section class="hero">
                <h1>Redis leaderboard demo</h1>
                <p>This demo stores scores in a Redis sorted set and keeps player details in per-user hashes. You can inspect the top performers, look around a rank position, and trim the board to a fixed size.</p>
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
                <section class="panel"><h2>Top entries</h2><div class="table-wrap"><table><thead><tr><th>Rank</th><th>User</th><th>Score</th><th>Metadata</th></tr></thead><tbody id="top-table"></tbody></table></div></section>
                <section class="panel"><h2>Entries around rank</h2><div class="table-wrap"><table><thead><tr><th>Rank</th><th>User</th><th>Score</th><th>Metadata</th></tr></thead><tbody id="around-table"></tbody></table></div></section>
            </div>
        </main>
        <script>
            const banner = document.getElementById('banner');
            function setBanner(message, isSuccess = true) { banner.textContent = message; banner.className = 'banner' + (isSuccess ? ' success' : ''); }
            function renderRows(targetId, entries) {
                const target = document.getElementById(targetId);
                if (!entries.length) { target.innerHTML = '<tr><td colspan="4">No entries found for this view.</td></tr>'; return; }
                target.innerHTML = entries.map((entry) => {
                    const metadata = entry.metadata || {};
                    const name = metadata.name || entry.user_id;
                    const description = metadata.description || '';
                    return `<tr><td>#${entry.rank}</td><td><strong>${entry.user_id}</strong><br><span>${name}</span></td><td>${entry.score}</td><td>${description}</td></tr>`;
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
                const response = await fetch(url, { method: 'POST', body: new URLSearchParams(new FormData(form)) });
                return response.json();
            }
            document.getElementById('upsert-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                const data = await postForm('/api/players', event.target);
                if (data.error) { setBanner(data.error, false); return; }
                const trimmed = data.entry.trimmed_user_ids || [];
                const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                setBanner(`Saved ${data.entry.user_id} at rank #${data.entry.rank} with score ${data.entry.score}.${trimmedText}`);
                await refreshState();
            });
            document.getElementById('increment-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                const data = await postForm('/api/increment', event.target);
                if (data.error) { setBanner(data.error, false); return; }
                const trimmed = data.entry.trimmed_user_ids || [];
                const trimmedText = trimmed.length ? ` Trimmed: ${trimmed.join(', ')}.` : '';
                setBanner(`Updated ${data.entry.user_id} to score ${data.entry.score} at rank #${data.entry.rank}.${trimmedText}`);
                await refreshState();
            });
            document.getElementById('config-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                const data = await postForm('/api/config', event.target);
                if (data.error) { setBanner(data.error, false); return; }
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
            refreshState().catch((error) => setBanner(`Failed to load leaderboard state: ${error}`, false));
        </script>
    </body>
    </html>
  HTML
end

server = WEBrick::HTTPServer.new(
  Port: port,
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
  AccessLog: [[File.open(File::NULL, "w"), WEBrick::AccessLog::COMMON_LOG_FORMAT]]
)

server.mount_proc "/" do |req, res|
  if req.request_method == "GET" && ["/", "/index.html"].include?(req.path)
    res["Content-Type"] = "text/html"
    res.body = html_page
  elsif req.request_method == "GET" && req.path == "/api/state"
    top_count = parse_positive_int(req.query["top"], 5)
    around_rank = parse_positive_int(req.query["rank"], 3)
    around_count = parse_positive_int(req.query["around"], 5)
    json_response(res, {
      leaderboard_key: $leaderboard.key,
      max_entries: $leaderboard.max_entries,
      top_count: top_count,
      around_rank: around_rank,
      around_count: around_count,
      size: $leaderboard.get_size,
      top_entries: $leaderboard.get_top(top_count),
      around_entries: $leaderboard.get_around_rank(around_rank, around_count)
    })
  else
    res.status = 404
    res.body = "Not Found"
  end
end

server.mount_proc "/api/players" do |req, res|
  unless req.request_method == "POST"
    res.status = 405
    res.body = "Method Not Allowed"
    next
  end

  params = URI.decode_www_form(req.body || "").to_h
  user_id = params.fetch("user_id", "").strip
  if user_id.empty?
    json_response(res, { error: "User ID is required." }, status: 400)
    next
  end

  begin
    score = Float(params.fetch("score"))
  rescue StandardError
    json_response(res, { error: "Score must be a valid number." }, status: 400)
    next
  end

  entry = $leaderboard.upsert_user(
    user_id,
    score,
    {
      "name" => params.fetch("name", "").strip.empty? ? user_id : params.fetch("name").strip,
      "description" => params.fetch("description", "").strip.empty? ? "No description provided." : params.fetch("description").strip
    }
  )

  json_response(res, { message: "Player saved.", entry: entry, max_entries: $leaderboard.max_entries })
end

server.mount_proc "/api/increment" do |req, res|
  unless req.request_method == "POST"
    res.status = 405
    res.body = "Method Not Allowed"
    next
  end

  params = URI.decode_www_form(req.body || "").to_h
  user_id = params.fetch("user_id", "").strip
  if user_id.empty?
    json_response(res, { error: "User ID is required." }, status: 400)
    next
  end

  begin
    amount = Float(params.fetch("amount"))
  rescue StandardError
    json_response(res, { error: "Increment must be a valid number." }, status: 400)
    next
  end

  metadata = $leaderboard.get_user_metadata(user_id)
  if metadata.empty?
    metadata = {
      "name" => params.fetch("name", "").strip.empty? ? user_id : params.fetch("name").strip,
      "description" => params.fetch("description", "").strip.empty? ? "Created during score increment." : params.fetch("description").strip
    }
  else
    metadata["name"] = params.fetch("name").strip if params.key?("name") && !params.fetch("name").strip.empty?
    metadata["description"] = params.fetch("description").strip if params.key?("description") && !params.fetch("description").strip.empty?
  end

  entry = $leaderboard.increment_score(user_id, amount, metadata)
  json_response(res, { message: "Score updated.", entry: entry, max_entries: $leaderboard.max_entries })
end

server.mount_proc "/api/config" do |req, res|
  unless req.request_method == "POST"
    res.status = 405
    res.body = "Method Not Allowed"
    next
  end

  params = URI.decode_www_form(req.body || "").to_h
  max_entries = parse_positive_int(params["max_entries"], 0)
  if max_entries < 1
    json_response(res, { error: "Max entries must be a whole number greater than 0." }, status: 400)
    next
  end

  trimmed_user_ids = $leaderboard.set_max_entries(max_entries)
  json_response(res, { message: "Leaderboard limit updated.", max_entries: $leaderboard.max_entries, trimmed_user_ids: trimmed_user_ids })
end

server.mount_proc "/api/reset" do |req, res|
  unless req.request_method == "POST"
    res.status = 405
    res.body = "Method Not Allowed"
    next
  end

  seed_sample_data
  json_response(res, { message: "Demo leaderboard reset.", max_entries: $leaderboard.max_entries })
end

trap("INT") { server.shutdown }
trap("TERM") { server.shutdown }

puts "Server started at http://localhost:#{port}"
puts "Open your browser and visit http://localhost:#{port}"
puts "Press Ctrl+C to stop the server"

server.start
