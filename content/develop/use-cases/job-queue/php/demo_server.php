<?php
/**
 * Redis job-queue demo server.
 *
 * Run with:
 *     php -S 127.0.0.1:8796 demo_server.php
 *
 * Visit http://127.0.0.1:8796 to enqueue jobs, watch a pool of workers
 * drain the queue, simulate worker crashes, and trigger a reclaim sweep
 * that pulls timed-out jobs back to pending.
 *
 * Because php -S runs each HTTP request in a fresh process, the workers
 * can't be hosted inside this server. Instead the "Start workers" button
 * spawns one `php worker.php` OS process per worker via proc_open and
 * tracks their PIDs in Redis (demo:workers:pids). "Stop workers" reads
 * those PIDs and sends SIGTERM.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/JobQueue.php';
require_once __DIR__ . '/JobWorker.php';
require_once __DIR__ . '/WorkerSupervisor.php';

use Predis\Client as PredisClient;

$redisHost = getenv('REDIS_HOST') ?: '127.0.0.1';
$redisPort = (int) (getenv('REDIS_PORT') ?: 6379);
$visibilityMs = (int) (getenv('VISIBILITY_MS') ?: 5000);

try {
    $redis = new PredisClient([
        'host' => $redisHost,
        'port' => $redisPort,
    ]);
    $redis->ping();
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "Failed to connect to Redis at {$redisHost}:{$redisPort}: " . $e->getMessage();
    exit(1);
}

$queue = new JobQueue($redis, 'jobs', $visibilityMs);
$supervisor = new WorkerSupervisor(
    $redis,
    $queue,
    __DIR__ . '/worker.php',
    $visibilityMs,
    3
);

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($method === 'GET' && ($path === '/' || $path === '/index.html')) {
    send_html(render_page($queue->getVisibilityMs()));
    return;
}

if ($method === 'GET' && $path === '/jobs') {
    send_json(build_jobs($queue));
    return;
}

if ($method === 'GET' && $path === '/stats') {
    send_json(build_stats($queue, $supervisor));
    return;
}

if ($method === 'POST' && $path === '/enqueue') {
    handle_enqueue($queue, $supervisor);
    return;
}

if ($method === 'POST' && $path === '/workers/start') {
    handle_workers_start($queue, $supervisor);
    return;
}

if ($method === 'POST' && $path === '/workers/stop') {
    $supervisor->stop();
    send_json(build_stats($queue, $supervisor));
    return;
}

if ($method === 'POST' && $path === '/workers/configure') {
    handle_workers_configure($queue, $supervisor);
    return;
}

if ($method === 'POST' && $path === '/reclaim') {
    $reclaimed = $queue->reclaimStuck();
    send_json([
        'reclaimed' => $reclaimed,
        'stats' => build_stats($queue, $supervisor),
    ]);
    return;
}

if ($method === 'POST' && $path === '/reset') {
    $supervisor->stop();
    usleep(100 * 1000);
    $queue->purge();
    $supervisor->forget();
    send_json(['stats' => build_stats($queue, $supervisor)]);
    return;
}

http_response_code(404);
echo 'Not Found';

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

function handle_enqueue(JobQueue $queue, WorkerSupervisor $supervisor): void
{
    $params = read_form_data();
    $kind = (string) ($params['kind'] ?? 'email');
    $recipient = (string) ($params['recipient'] ?? '') ?: 'user@example.com';
    $count = (int) ($params['count'] ?? 1);
    $count = max(1, min(50, $count));

    $ids = [];
    for ($i = 0; $i < $count; $i++) {
        $ids[] = $queue->enqueue([
            'kind' => $kind,
            'recipient' => $recipient,
            'n' => $i + 1,
        ]);
    }

    send_json([
        'enqueued' => $ids,
        'stats' => build_stats($queue, $supervisor),
    ]);
}

function handle_workers_start(JobQueue $queue, WorkerSupervisor $supervisor): void
{
    $params = read_form_data();
    $size = isset($params['size']) ? (int) $params['size'] : 2;
    $latency = isset($params['work_latency_ms']) ? (int) $params['work_latency_ms'] : 400;
    $failRate = isset($params['fail_rate']) ? (float) $params['fail_rate'] : 0.0;
    $hangRate = isset($params['hang_rate']) ? (float) $params['hang_rate'] : 0.0;
    $supervisor->start($size, $latency, $failRate, $hangRate);
    send_json(build_stats($queue, $supervisor));
}

function handle_workers_configure(JobQueue $queue, WorkerSupervisor $supervisor): void
{
    $params = read_form_data();
    $latency = isset($params['work_latency_ms']) ? (int) $params['work_latency_ms'] : null;
    $failRate = isset($params['fail_rate']) ? (float) $params['fail_rate'] : null;
    $hangRate = isset($params['hang_rate']) ? (float) $params['hang_rate'] : null;
    $supervisor->configure($latency, $failRate, $hangRate);
    send_json(build_stats($queue, $supervisor));
}

function build_jobs(JobQueue $queue): array
{
    $pendingIds = $queue->listPending();
    $processingIds = $queue->listProcessing();
    $completedIds = array_slice($queue->listCompleted(), 0, 10);
    $failedIds = array_slice($queue->listFailed(), 0, 10);

    return [
        'pending' => array_map(fn(string $id) => summarize_job($queue, $id), $pendingIds),
        'processing' => array_map(fn(string $id) => summarize_job($queue, $id), $processingIds),
        'completed' => array_map(fn(string $id) => summarize_job($queue, $id), $completedIds),
        'failed' => array_map(fn(string $id) => summarize_job($queue, $id), $failedIds),
    ];
}

function summarize_job(JobQueue $queue, string $jobId): array
{
    $meta = $queue->getJob($jobId) ?? [];
    return [
        'id' => $jobId,
        'status' => $meta['status'] ?? 'unknown',
        'attempts' => (int) ($meta['attempts'] ?? 0),
        'payload' => $meta['payload'] ?? new stdClass(),
        'result' => $meta['result'] ?? null,
        'last_error' => $meta['last_error'] ?? null,
    ];
}

function build_stats(JobQueue $queue, WorkerSupervisor $supervisor): array
{
    $stats = $queue->stats();
    $cfg = $supervisor->getConfig();
    $stats['workers_running'] = $supervisor->running();
    $stats['worker_processed_total'] = $stats['completed_total']; // PHP workers don't keep a per-process counter.
    $stats['work_latency_ms'] = $cfg['work_latency_ms'];
    $stats['fail_rate'] = $cfg['fail_rate'];
    $stats['hang_rate'] = $cfg['hang_rate'];
    return $stats;
}

function read_form_data(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $parsed = [];
    parse_str($raw, $parsed);
    return $parsed;
}

function send_html(string $html, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
}

function send_json($payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function render_page(int $visibilityMs): string
{
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Job Queue Demo</title>
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
      --hit: #c9e7d2;
      --miss: #f5d6c6;
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
      max-width: 1080px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
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
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    .badge.pending { background: #f4e4c1; color: #5e4514; }
    .badge.processing { background: var(--miss); color: #6b3220; }
    .badge.completed { background: var(--hit); color: #1d4a2c; }
    .badge.failed { background: #f0c2bc; color: #6b1f1c; }
    .job-list { list-style: none; padding: 0; margin: 8px 0 0; max-height: 230px; overflow-y: auto; }
    .job-list li {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 6px;
      background: #fffdf8;
      font-size: 0.92rem;
    }
    .job-list li .meta { color: var(--muted); font-size: 0.85rem; }
    pre {
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
    }
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
    <div class="pill">Predis + PHP built-in dev server</div>
    <h1>Redis Job Queue Demo</h1>
    <p class="lede">
      Enqueue background jobs and watch a pool of workers drain them through Redis.
      Pending jobs sit in a list; each worker uses <code>BRPOPLPUSH</code> to atomically
      claim a job and move it to a processing list. Completed jobs move to a short
      history. If a worker hangs past the {$visibilityMs} ms visibility timeout,
      the reclaimer moves its job back to pending so no work is lost.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Enqueue jobs</h2>
        <label for="job-kind">Kind</label>
        <select id="job-kind">
          <option value="email">email</option>
          <option value="webhook">webhook</option>
          <option value="thumbnail">thumbnail</option>
          <option value="invoice">invoice</option>
        </select>
        <label for="job-recipient">Recipient / target</label>
        <input id="job-recipient" value="user@example.com">
        <label for="job-count">How many</label>
        <input id="job-count" type="number" value="5" min="1" max="50">
        <button id="enqueue-button">Enqueue</button>
      </section>

      <section class="panel">
        <h2>Worker pool</h2>
        <label for="worker-size">Workers</label>
        <input id="worker-size" type="number" value="2" min="0" max="8">
        <label for="work-latency">Work latency (ms)</label>
        <input id="work-latency" type="number" value="400" min="0" max="5000">
        <label for="fail-rate">Failure rate (0–1)</label>
        <input id="fail-rate" type="number" step="0.05" min="0" max="1" value="0">
        <label for="hang-rate">Hang rate (simulated crash)</label>
        <input id="hang-rate" type="number" step="0.05" min="0" max="1" value="0">
        <button id="start-button">Start / apply</button>
        <button id="stop-button" class="secondary">Stop workers</button>
      </section>

      <section class="panel">
        <h2>Reclaim &amp; reset</h2>
        <p>Reclaim moves any job sitting in the processing list past the
        {$visibilityMs} ms visibility timeout back to pending.</p>
        <button id="reclaim-button">Run reclaim sweep</button>
        <button id="reset-button" class="secondary">Reset queue</button>
      </section>

      <section class="panel">
        <h2>Queue stats</h2>
        <div id="stats-view">Loading...</div>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Pending <span id="pending-count" class="badge pending">0</span></h2>
        <ul id="pending-list" class="job-list"></ul>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Processing <span id="processing-count" class="badge processing">0</span></h2>
        <ul id="processing-list" class="job-list"></ul>
      </section>

      <section class="panel">
        <h2>Recent completed <span id="completed-count" class="badge completed">0</span></h2>
        <ul id="completed-list" class="job-list"></ul>
      </section>

      <section class="panel">
        <h2>Recent failed <span id="failed-count" class="badge failed">0</span></h2>
        <ul id="failed-list" class="job-list"></ul>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[c]);
    }

    function renderStats(stats) {
      const view = document.getElementById("stats-view");
      if (!stats) { view.textContent = "(no data)"; return; }
      view.innerHTML = `
        <dl>
          <dt>Workers running</dt><dd>\${stats.workers_running}</dd>
          <dt>Pending depth</dt><dd>\${stats.pending_depth}</dd>
          <dt>Processing depth</dt><dd>\${stats.processing_depth}</dd>
          <dt>Enqueued total</dt><dd>\${stats.enqueued_total}</dd>
          <dt>Completed total</dt><dd>\${stats.completed_total}</dd>
          <dt>Failed total</dt><dd>\${stats.failed_total}</dd>
          <dt>Reclaimed total</dt><dd>\${stats.reclaimed_total}</dd>
          <dt>Worker processed</dt><dd>\${stats.worker_processed_total}</dd>
          <dt>Visibility timeout</dt><dd>\${stats.visibility_ms} ms</dd>
          <dt>Work latency</dt><dd>\${stats.work_latency_ms} ms</dd>
          <dt>Failure rate</dt><dd>\${stats.fail_rate}</dd>
          <dt>Hang rate</dt><dd>\${stats.hang_rate}</dd>
        </dl>
      `;
    }

    function renderJobList(elementId, jobs, countId, badgeClass) {
      const list = document.getElementById(elementId);
      const count = document.getElementById(countId);
      count.textContent = jobs.length;
      count.className = `badge \${badgeClass}`;
      if (!jobs.length) { list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }
      list.innerHTML = jobs.map((job) => {
        const payload = job.payload && typeof job.payload === "object"
          ? JSON.stringify(job.payload)
          : escapeHtml(job.payload || "");
        const extra = job.last_error
          ? ` &middot; <span class=meta>error: \${escapeHtml(job.last_error)}</span>`
          : job.result
            ? ` &middot; <span class=meta>result: \${escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}</span>`
            : "";
        return `<li>
          <strong>\${escapeHtml(job.id)}</strong>
          <span class=badge \${badgeClass}>\${escapeHtml(job.status)}</span>
          <span class=meta>attempts: \${job.attempts}</span>
          \${extra}
          <div class=meta>\${escapeHtml(payload)}</div>
        </li>`;
      }).join("");
    }

    async function refresh() {
      const [jobsResponse, statsResponse] = await Promise.all([
        fetch("/jobs"),
        fetch("/stats"),
      ]);
      const jobs = await jobsResponse.json();
      const stats = await statsResponse.json();
      renderStats(stats);
      renderJobList("pending-list", jobs.pending, "pending-count", "pending");
      renderJobList("processing-list", jobs.processing, "processing-count", "processing");
      renderJobList("completed-list", jobs.completed, "completed-count", "completed");
      renderJobList("failed-list", jobs.failed, "failed-count", "failed");
    }

    document.getElementById("enqueue-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        kind: document.getElementById("job-kind").value,
        recipient: document.getElementById("job-recipient").value,
        count: document.getElementById("job-count").value,
      });
      const response = await fetch("/enqueue", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Enqueue failed.", "error"); return; }
      setStatus(`Enqueued \${data.enqueued.length} job(s).`, "ok");
      refresh();
    });

    document.getElementById("start-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        size: document.getElementById("worker-size").value,
        work_latency_ms: document.getElementById("work-latency").value,
        fail_rate: document.getElementById("fail-rate").value,
        hang_rate: document.getElementById("hang-rate").value,
      });
      await fetch("/workers/start", { method: "POST", body });
      setStatus("Workers started.", "ok");
      refresh();
    });

    document.getElementById("stop-button").addEventListener("click", async () => {
      await fetch("/workers/stop", { method: "POST" });
      setStatus("Workers stopped.", "ok");
      refresh();
    });

    document.getElementById("reclaim-button").addEventListener("click", async () => {
      const response = await fetch("/reclaim", { method: "POST" });
      const data = await response.json();
      setStatus(`Reclaimed \${data.reclaimed.length} job(s).`, "ok");
      refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      await fetch("/reset", { method: "POST" });
      setStatus("Queue reset.", "ok");
      refresh();
    });

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>
HTML;
}
