<?php
/**
 * Redis Cache-Aside Demo (PHP / Predis).
 *
 * Run with the built-in PHP development server:
 *
 *   composer require predis/predis
 *   php -S localhost:8080 demo_server.php
 *
 * The stampede endpoint uses pcntl_fork to fire genuinely concurrent
 * processes — this works because php -S runs PHP in CLI SAPI mode.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/Cache.php';
require_once __DIR__ . '/Primary.php';

use Predis\Client as PredisClient;

$redisHost = getenv('REDIS_HOST') ?: 'localhost';
$redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
$cacheTtl = (int) (getenv('CACHE_TTL') ?: 30);
$primaryLatencyMs = (int) (getenv('PRIMARY_LATENCY_MS') ?: 150);

function makeRedis(string $host, int $port): PredisClient
{
    return new PredisClient(['host' => $host, 'port' => $port]);
}

try {
    $redis = makeRedis($redisHost, $redisPort);
    $redis->ping();
} catch (\Exception $e) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Failed to connect to Redis at {$redisHost}:{$redisPort}: {$e->getMessage()}";
    exit(1);
}

$cache = new RedisCache($redis, ttl: $cacheTtl);
$primary = new MockPrimaryStore($redis, $primaryLatencyMs);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function send_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
}

function build_stats(RedisCache $cache, MockPrimaryStore $primary): array
{
    $stats = $cache->stats();
    $stats['primary_reads_total'] = $primary->reads();
    $stats['primary_read_latency_ms'] = $primary->readLatencyMs();
    return $stats;
}

function read_form(): array
{
    $raw = file_get_contents('php://input') ?: '';
    parse_str($raw, $form);
    return is_array($form) ? $form : [];
}

function round2(float $value): float
{
    return ((int) ($value * 100)) / 100.0;
}

if ($method === 'GET' && ($path === '/' || $path === '/index.html')) {
    header('Content-Type: text/html; charset=utf-8');
    echo render_html_page($primary->listIds(), $primary->readLatencyMs(), $cache->ttl());
    exit;
}

if ($method === 'GET' && $path === '/products') {
    send_json(['products' => $primary->listIds()]);
    exit;
}

if ($method === 'GET' && $path === '/read') {
    $id = (string) ($_GET['id'] ?? '');
    if ($id === '') {
        send_json(['error' => "Missing 'id' query parameter."], 400);
        exit;
    }
    $started = microtime(true) * 1000.0;
    $result = $cache->get($id, fn(string $k) => $primary->read($k));
    $totalMs = microtime(true) * 1000.0 - $started;
    if ($result['record'] === null) {
        send_json(['error' => "No record for '{$id}'."], 404);
        exit;
    }
    send_json([
        'id' => $id,
        'record' => $result['record'],
        'hit' => $result['hit'],
        'redis_latency_ms' => round2($result['redis_latency_ms']),
        'total_latency_ms' => round2($totalMs),
        'ttl_remaining' => $cache->ttlRemaining($id),
        'stats' => build_stats($cache, $primary),
    ]);
    exit;
}

if ($method === 'GET' && $path === '/stats') {
    send_json(build_stats($cache, $primary));
    exit;
}

if ($method === 'POST' && $path === '/invalidate') {
    $form = read_form();
    $id = (string) ($form['id'] ?? '');
    if ($id === '') {
        send_json(['error' => "Missing 'id'."], 400);
        exit;
    }
    $deleted = $cache->invalidate($id);
    send_json(['id' => $id, 'deleted' => $deleted, 'stats' => build_stats($cache, $primary)]);
    exit;
}

if ($method === 'POST' && $path === '/update') {
    $form = read_form();
    $id = (string) ($form['id'] ?? '');
    $field = (string) ($form['field'] ?? '');
    $value = (string) ($form['value'] ?? '');
    if ($id === '' || $field === '') {
        send_json(['error' => "Missing 'id' or 'field'."], 400);
        exit;
    }
    if (!$primary->updateField($id, $field, $value)) {
        send_json(['error' => 'Unknown product.'], 404);
        exit;
    }
    $cache->invalidate($id);
    send_json(['id' => $id, 'field' => $field, 'value' => $value, 'stats' => build_stats($cache, $primary)]);
    exit;
}

if ($method === 'POST' && $path === '/stampede') {
    $form = read_form();
    $id = (string) ($form['id'] ?? '');
    if ($id === '') {
        send_json(['error' => "Missing 'id'."], 400);
        exit;
    }
    $concurrency = max(2, min(50, (int) ($form['concurrency'] ?? 20)));

    $cache->invalidate($id);
    $primaryBefore = $primary->reads();

    // Spawn N worker processes via proc_open so they run truly concurrently —
    // the PHP built-in dev server is single-threaded, so we cannot rely on
    // its request handling to give us parallelism.
    $started = microtime(true) * 1000.0;
    $workerScript = __DIR__ . '/stampede_worker.php';
    $procs = [];
    $pipes = [];
    $cmdArgs = [PHP_BINARY, $workerScript, $redisHost, (string) $redisPort, $id, (string) $primaryLatencyMs, (string) $cacheTtl];
    $descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    for ($i = 0; $i < $concurrency; $i++) {
        $proc = proc_open($cmdArgs, $descriptors, $childPipes);
        if (!is_resource($proc)) {
            send_json(['error' => 'Failed to launch worker process.'], 500);
            exit;
        }
        $procs[$i] = $proc;
        $pipes[$i] = $childPipes;
    }

    $results = [];
    foreach ($procs as $i => $proc) {
        $stdout = stream_get_contents($pipes[$i][1]);
        fclose($pipes[$i][1]);
        fclose($pipes[$i][2]);
        proc_close($proc);
        $decoded = json_decode($stdout ?: '', true);
        if (is_array($decoded)) {
            $results[] = $decoded;
        }
    }
    $elapsedMs = microtime(true) * 1000.0 - $started;
    $primaryDuring = $primary->reads() - $primaryBefore;

    send_json([
        'id' => $id,
        'concurrency' => $concurrency,
        'primary_reads' => $primaryDuring,
        'elapsed_ms' => round2($elapsedMs),
        'results' => $results,
        'stats' => build_stats($cache, $primary),
    ]);
    exit;
}

if ($method === 'POST' && $path === '/reset') {
    $cache->resetStats();
    $primary->resetReads();
    send_json(build_stats($cache, $primary));
    exit;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "Not Found";

function render_html_page(array $productIds, int $primaryLatencyMs, int $cacheTtl): string
{
    $options = '';
    foreach ($productIds as $id) {
        $safe = htmlspecialchars($id, ENT_QUOTES, 'UTF-8');
        $options .= "<option value=\"{$safe}\">{$safe}</option>";
    }
    return strtr(HTML_TEMPLATE, [
        '{{OPTIONS}}' => $options,
        '{{PRIMARY_LATENCY}}' => (string) $primaryLatencyMs,
        '{{CACHE_TTL}}' => (string) $cacheTtl,
    ]);
}

const HTML_TEMPLATE = <<<'HTML'
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
    <div class="pill">Predis + PHP built-in dev server</div>
    <h1>Redis Cache-Aside Demo</h1>
    <p class="lede">
      Read product records through Redis. The first read of any key falls
      through to a deliberately slow primary store ({{PRIMARY_LATENCY}} ms per
      read); subsequent reads come from Redis until the {{CACHE_TTL}}-second TTL
      expires or the entry is invalidated. The stampede test forks N concurrent
      worker processes against a cold key to show a single-flight Lua lock
      funnelling them down to one primary read.
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
        <p>Invalidates the selected key, then forks N worker processes that
        each call the cache against a cold key. Single-flight should funnel
        them all down to one primary read.</p>
        <label for="stampede-concurrency">Concurrent workers</label>
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
      resultView.innerHTML = `<p>Forked <strong>${data.concurrency}</strong> concurrent workers in
        <strong>${data.elapsed_ms}</strong> ms.</p>
        <p>Cache misses: <strong>${misses}</strong> &nbsp;
           Cache hits: <strong>${hits}</strong> &nbsp;
           Primary reads: <strong>${data.primary_reads}</strong></p>
        <p>With stampede protection, primary reads should be 1 even though all
           ${data.concurrency} workers raced for a cold key. Without it, every
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
      setStatus(`Stampede complete: ${d.primary_reads} primary read(s) for ${d.concurrency} concurrent workers.`, "ok");
    });
    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      renderStats(await r.json()); setStatus("Counters reset.", "ok");
    });
    loadStats();
  </script>
</body>
</html>
HTML;
