#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "redis"
require "uri"
require "webrick"
require_relative "cache"
require_relative "primary"

HTML_TEMPLATE = DATA.read

port = Integer(ENV["PORT"] || 8080)
redis_host = ENV["REDIS_HOST"] || "localhost"
redis_port = Integer(ENV["REDIS_PORT"] || 6379)
ttl = Integer(ENV["CACHE_TTL"] || 30)
primary_latency_ms = Integer(ENV["PRIMARY_LATENCY_MS"] || 150)

ARGV.each_with_index do |arg, i|
  case arg
  when "--port" then port = Integer(ARGV[i + 1])
  when "--redis-host" then redis_host = ARGV[i + 1]
  when "--redis-port" then redis_port = Integer(ARGV[i + 1])
  when "--ttl" then ttl = Integer(ARGV[i + 1])
  when "--primary-latency-ms" then primary_latency_ms = Integer(ARGV[i + 1])
  end
end

begin
  redis_client = Redis.new(host: redis_host, port: redis_port)
  redis_client.ping
rescue Redis::CannotConnectError => e
  warn "Failed to connect to Redis at #{redis_host}:#{redis_port}: #{e.message}"
  exit 1
end

$cache = RedisCache.new(redis: redis_client, ttl: ttl)
$primary = MockPrimaryStore.new(read_latency_ms: primary_latency_ms)

def round2(value)
  (value * 100).to_i / 100.0
end

def build_stats
  stats = $cache.stats
  stats["primary_reads_total"] = $primary.reads
  stats["primary_read_latency_ms"] = $primary.read_latency_ms
  stats
end

def parse_form(req)
  URI.decode_www_form(req.body || "").to_h
end

def json_response(res, payload, status: 200)
  res.status = status
  res["Content-Type"] = "application/json"
  res.body = JSON.generate(payload)
end

def html_page(product_ids, primary_latency_ms, cache_ttl)
  options = product_ids.map { |id| %(<option value="#{WEBrick::HTMLUtils.escape(id)}">#{WEBrick::HTMLUtils.escape(id)}</option>) }.join

  HTML_TEMPLATE
    .sub("{{OPTIONS}}", options)
    .sub("{{PRIMARY_LATENCY}}", primary_latency_ms.to_s)
    .sub("{{CACHE_TTL}}", cache_ttl.to_s)
end

server = WEBrick::HTTPServer.new(
  Port: port,
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
  AccessLog: [[File.open(File::NULL, "w"), WEBrick::AccessLog::COMMON_LOG_FORMAT]]
)

server.mount_proc "/" do |_req, res|
  res["Content-Type"] = "text/html; charset=utf-8"
  res.body = html_page($primary.list_ids, $primary.read_latency_ms, $cache.ttl)
end

server.mount_proc "/products" do |_req, res|
  json_response(res, { products: $primary.list_ids })
end

server.mount_proc "/read" do |req, res|
  id = (req.query_string || "").then { |q| URI.decode_www_form(q).to_h["id"] || "" }
  if id.empty?
    json_response(res, { error: "Missing 'id' query parameter." }, status: 400)
    next
  end
  started = Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
  result = $cache.get(id) { |k| $primary.read(k) }
  total_ms = Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0 - started

  if result[:record].nil?
    json_response(res, { error: "No record for '#{id}'." }, status: 404)
    next
  end

  json_response(res, {
    id: id,
    record: result[:record],
    hit: result[:hit],
    redis_latency_ms: round2(result[:redis_latency_ms]),
    total_latency_ms: round2(total_ms),
    ttl_remaining: $cache.ttl_remaining(id),
    stats: build_stats,
  })
end

server.mount_proc "/stats" do |_req, res|
  json_response(res, build_stats)
end

server.mount_proc "/invalidate" do |req, res|
  form = parse_form(req)
  id = form["id"] || ""
  if id.empty?
    json_response(res, { error: "Missing 'id'." }, status: 400)
    next
  end
  deleted = $cache.invalidate(id)
  json_response(res, { id: id, deleted: deleted, stats: build_stats })
end

server.mount_proc "/update" do |req, res|
  form = parse_form(req)
  id = form["id"] || ""
  field = form["field"] || ""
  value = form["value"] || ""
  if id.empty? || field.empty?
    json_response(res, { error: "Missing 'id' or 'field'." }, status: 400)
    next
  end
  unless $primary.update_field(id, field, value)
    json_response(res, { error: "Unknown product." }, status: 404)
    next
  end
  $cache.invalidate(id)
  json_response(res, { id: id, field: field, value: value, stats: build_stats })
end

server.mount_proc "/stampede" do |req, res|
  form = parse_form(req)
  id = form["id"] || ""
  if id.empty?
    json_response(res, { error: "Missing 'id'." }, status: 400)
    next
  end
  concurrency = (form["concurrency"] || "20").to_i
  concurrency = 20 if concurrency < 2
  concurrency = 50 if concurrency > 50

  $cache.invalidate(id)
  before = $primary.reads
  started = Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0
  threads = Array.new(concurrency) { Thread.new { $cache.get(id) { |k| $primary.read(k) } } }
  results = threads.map(&:value)
  elapsed_ms = Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000.0 - started
  during = $primary.reads - before

  json_response(res, {
    id: id,
    concurrency: concurrency,
    primary_reads: during,
    elapsed_ms: round2(elapsed_ms),
    results: results.map { |r| { hit: r[:hit], redis_latency_ms: round2(r[:redis_latency_ms]), found: !r[:record].nil? } },
    stats: build_stats,
  })
end

server.mount_proc "/reset" do |_req, res|
  $cache.reset_stats
  $primary.reset_reads
  json_response(res, build_stats)
end

trap("INT") { server.shutdown }
puts "Redis cache-aside demo server listening on http://0.0.0.0:#{port}"
puts "Using Redis at #{redis_host}:#{redis_port} with cache TTL #{ttl}s"
puts "Mock primary read latency: #{primary_latency_ms} ms"
server.start

__END__
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redis Cache-Aside Demo</title>
    <style>
      :root { --bg:#f6f1e8;--panel:#fffaf2;--ink:#1f2933;--accent:#b8572f;--accent-dark:#8f421f;
        --muted:#5d6b75;--line:#e7d9c6;--ok:#d7f0de;--warn:#f7dfd7;--hit:#c9e7d2;--miss:#f5d6c6; }
      * { box-sizing:border-box; }
      body { margin:0;font-family:Georgia,"Times New Roman",serif;color:var(--ink);
        background:radial-gradient(circle at top left,#fff7ea,transparent 32rem),
          linear-gradient(180deg,#f3ecdf 0%,var(--bg) 100%);min-height:100vh; }
      main { max-width:980px;margin:0 auto;padding:48px 20px 72px; }
      h1 { font-size:clamp(2.2rem,5vw,4rem);line-height:1;margin-bottom:12px; }
      p.lede { max-width:52rem;font-size:1.1rem;color:var(--muted); }
      .grid { display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-top:28px; }
      .panel { background:rgba(255,250,242,0.92);border:1px solid var(--line);border-radius:18px;
        padding:22px;box-shadow:0 16px 50px rgba(105,74,45,0.08); }
      .panel h2 { margin-top:0;margin-bottom:10px; }
      .pill { display:inline-block;border-radius:999px;background:#efe2cf;color:var(--accent-dark);
        padding:6px 10px;font-size:0.9rem;margin-bottom:12px; }
      label { display:block;font-weight:bold;margin:12px 0 6px; }
      input,select { width:100%;padding:10px 12px;border-radius:10px;border:1px solid #cfbca6;font:inherit;background:white; }
      button { appearance:none;border:0;border-radius:999px;background:var(--accent);color:white;
        padding:11px 18px;font:inherit;cursor:pointer;margin-right:8px;margin-top:12px; }
      button.secondary { background:#38424a; }
      button:hover { background:var(--accent-dark); }
      button.secondary:hover { background:#20282e; }
      dl { display:grid;grid-template-columns:max-content 1fr;gap:8px 14px;margin:0; }
      dt { font-weight:bold; } dd { margin:0;word-break:break-word; }
      .badge { display:inline-block;border-radius:6px;padding:3px 8px;font-size:0.85rem;font-weight:bold; }
      .badge.hit { background:var(--hit);color:#1d4a2c; }
      .badge.miss { background:var(--miss);color:#6b3220; }
      #status { margin-top:20px;padding:14px 16px;border-radius:14px;display:none; }
      #status.ok { display:block;background:var(--ok); }
      #status.error { display:block;background:var(--warn); }
      @media (max-width:600px){ main{padding-top:28px;} button{width:100%;} }
    </style>
  </head>
  <body>
    <main>
      <div class="pill">redis-rb + WEBrick demo</div>
      <h1>Redis Cache-Aside Demo</h1>
      <p class="lede">
        Read product records through Redis. The first read of any key falls
        through to a deliberately slow primary store ({{PRIMARY_LATENCY}} ms per
        read); subsequent reads come from Redis until the {{CACHE_TTL}}-second TTL
        expires or the entry is invalidated. The stampede test fires concurrent
        reads at a cold key to show a single-flight Lua lock funnelling them
        down to one primary read.
      </p>
      <div class="grid">
        <section class="panel">
          <h2>Read a product</h2>
          <label for="product-id">Product ID</label>
          <select id="product-id">{{OPTIONS}}</select>
          <button id="read-button">Read through cache</button>
          <button id="invalidate-button" class="secondary">Invalidate cache</button>
          <p>Read once to populate the cache, then again to see the hit. Wait
          for the TTL to pass or click <em>Invalidate</em> to force a miss.</p>
        </section>
        <section class="panel">
          <h2>Update a field</h2>
          <p>Updating writes to the primary and deletes the cache entry, so the
          next read sees the new value.</p>
          <label for="update-field">Field</label>
          <select id="update-field">
            <option value="name">name</option>
            <option value="price_cents">price_cents</option>
            <option value="stock">stock</option>
          </select>
          <label for="update-value">New value</label>
          <input id="update-value" value="999">
          <button id="update-button">Apply update</button>
        </section>
        <section class="panel">
          <h2>Stampede test</h2>
          <p>Invalidates the selected key, then fires N concurrent reads. With
          single-flight enabled, only one of those reads should hit the primary.</p>
          <label for="stampede-concurrency">Concurrent readers</label>
          <input id="stampede-concurrency" type="number" value="20" min="2" max="50">
          <button id="stampede-button">Run stampede test</button>
        </section>
        <section class="panel">
          <h2>Cache stats</h2>
          <div id="stats-view">Loading...</div>
          <button id="reset-button" class="secondary">Reset counters</button>
        </section>
        <section class="panel" style="grid-column: 1 / -1;">
          <h2>Last result</h2>
          <div id="result-view"><p>Read a product to see the cached record and timing.</p></div>
        </section>
      </div>
      <div id="status"></div>
    </main>
    <script>
      const productSelect = document.getElementById("product-id");
      const updateField = document.getElementById("update-field");
      const updateValue = document.getElementById("update-value");
      const stampedeConcurrency = document.getElementById("stampede-concurrency");
      const statsView = document.getElementById("stats-view");
      const resultView = document.getElementById("result-view");
      const statusBox = document.getElementById("status");
      function setStatus(message, kind) { statusBox.textContent = message; statusBox.className = kind; }
      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (c) =>
          ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
      function renderStats(stats) {
        if (!stats) { statsView.textContent = "(no data)"; return; }
        statsView.innerHTML = `<dl>
          <dt>Hits</dt><dd>${stats.hits}</dd>
          <dt>Misses</dt><dd>${stats.misses}</dd>
          <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
          <dt>Stampedes suppressed</dt><dd>${stats.stampedes_suppressed}</dd>
          <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
          <dt>Primary read latency</dt><dd>${stats.primary_read_latency_ms} ms</dd>
        </dl>`;
      }
      function renderRead(data) {
        if (!data || !data.record) { resultView.innerHTML = "<p>(no record)</p>"; return; }
        const r = data.record;
        const badge = data.hit ? '<span class="badge hit">cache hit</span>' : '<span class="badge miss">cache miss</span>';
        resultView.innerHTML = `<p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
          &nbsp; Total: <strong>${data.total_latency_ms} ms</strong>
          &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
          <dl>
            <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
            <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
            <dt>price_cents</dt><dd>${escapeHtml(r.price_cents ?? "")}</dd>
            <dt>stock</dt><dd>${escapeHtml(r.stock ?? "")}</dd>
          </dl>`;
      }
      function renderStampede(data) {
        const hits = data.results.filter((r) => r.hit).length;
        const misses = data.results.length - hits;
        resultView.innerHTML = `<p>Fired <strong>${data.concurrency}</strong> concurrent reads in
          <strong>${data.elapsed_ms}</strong> ms.</p>
          <p>Cache misses: <strong>${misses}</strong> &nbsp;
             Cache hits: <strong>${hits}</strong> &nbsp;
             Primary reads: <strong>${data.primary_reads}</strong></p>
          <p>With stampede protection, primary reads should be 1 even though all
             ${data.concurrency} callers raced for a cold key. Without it, every
             concurrent miss would query the primary independently.</p>`;
      }
      async function loadStats() { renderStats(await (await fetch("/stats")).json()); }
      document.getElementById("read-button").addEventListener("click", async () => {
        const id = productSelect.value;
        const r = await fetch(`/read?id=${encodeURIComponent(id)}`);
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
        renderRead(d); renderStats(d.stats);
        setStatus(d.hit ? "Served from Redis." : "Loaded from primary and cached.", "ok");
      });
      document.getElementById("invalidate-button").addEventListener("click", async () => {
        const id = productSelect.value;
        const r = await fetch("/invalidate", { method: "POST", body: new URLSearchParams({ id }) });
        const d = await r.json();
        renderStats(d.stats);
        setStatus(d.deleted ? "Cache key deleted." : "No cache entry to delete.", "ok");
      });
      document.getElementById("update-button").addEventListener("click", async () => {
        const id = productSelect.value;
        const r = await fetch("/update", { method: "POST",
          body: new URLSearchParams({ id, field: updateField.value, value: updateValue.value }) });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
        renderStats(d.stats); setStatus("Primary updated; cache invalidated.", "ok");
      });
      document.getElementById("stampede-button").addEventListener("click", async () => {
        const id = productSelect.value;
        setStatus("Running stampede test...", "ok");
        const r = await fetch("/stampede", { method: "POST",
          body: new URLSearchParams({ id, concurrency: stampedeConcurrency.value }) });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Test failed.", "error"); return; }
        renderStampede(d); renderStats(d.stats);
        setStatus(`Stampede complete: ${d.primary_reads} primary read(s) for ${d.concurrency} concurrent callers.`, "ok");
      });
      document.getElementById("reset-button").addEventListener("click", async () => {
        const r = await fetch("/reset", { method: "POST" });
        renderStats(await r.json()); setStatus("Counters reset.", "ok");
      });
      loadStats();
    </script>
  </body>
  </html>

