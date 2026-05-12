#!/usr/bin/env node
/**
 * Redis job-queue demo server.
 *
 * Run this file and visit http://localhost:8791 to enqueue jobs, watch a
 * pool of workers drain the queue, simulate worker crashes, and trigger
 * a reclaim sweep that pulls timed-out jobs back to pending.
 */

"use strict";

const http = require("http");
const { URL, URLSearchParams } = require("url");
const { createClient } = require("redis");

const { RedisJobQueue } = require("./job_queue");
const { WorkerPool } = require("./worker");

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    host: "127.0.0.1",
    port: 8791,
    redisHost: "localhost",
    redisPort: 6379,
    visibilityMs: 5000,
    workers: 0,
    queueName: "jobs",
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
      case "--visibility-ms":
        config.visibilityMs = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      case "--workers":
        config.workers = Number.parseInt(args[i + 1], 10);
        i += 1;
        break;
      case "--queue-name":
        config.queueName = args[i + 1];
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
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function readForm(req) {
  const body = await readBody(req);
  const params = new URLSearchParams(body);
  const result = {};
  for (const [key, value] of params.entries()) {
    if (!(key in result)) {
      result[key] = value;
    }
  }
  return result;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(html),
  });
  res.end(html);
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

function htmlPage(visibilityMs) {
  return `<!DOCTYPE html>
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
    <div class="pill">node-redis + Node.js standard http module</div>
    <h1>Redis Job Queue Demo</h1>
    <p class="lede">
      Enqueue background jobs and watch a pool of workers drain them through Redis.
      Pending jobs sit in a list; each worker uses <code>BRPOPLPUSH</code> to atomically
      claim a job and move it to a processing list. Completed jobs move to a short
      history. If a worker hangs past the ${visibilityMs} ms visibility timeout,
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
        ${visibilityMs} ms visibility timeout back to pending.</p>
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
      view.innerHTML = \`
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
      \`;
    }

    function renderJobList(elementId, jobs, countId, badgeClass) {
      const list = document.getElementById(elementId);
      const count = document.getElementById(countId);
      count.textContent = jobs.length;
      count.className = \`badge \${badgeClass}\`;
      if (!jobs.length) { list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }
      list.innerHTML = jobs.map((job) => {
        const payload = job.payload && typeof job.payload === "object"
          ? JSON.stringify(job.payload)
          : escapeHtml(job.payload || "");
        const extra = job.last_error
          ? \` &middot; <span class=meta>error: \${escapeHtml(job.last_error)}</span>\`
          : job.result
            ? \` &middot; <span class=meta>result: \${escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}</span>\`
            : "";
        return \`<li>
          <strong>\${escapeHtml(job.id)}</strong>
          <span class=badge \${badgeClass}>\${escapeHtml(job.status)}</span>
          <span class=meta>attempts: \${job.attempts}</span>
          \${extra}
          <div class=meta>\${escapeHtml(payload)}</div>
        </li>\`;
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
      setStatus(\`Enqueued \${data.enqueued.length} job(s).\`, "ok");
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
      setStatus(\`Reclaimed \${data.reclaimed.length} job(s).\`, "ok");
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
`;
}

async function summarizeJob(queue, jobId) {
  const meta = (await queue.getJob(jobId)) || {};
  return {
    id: jobId,
    status: meta.status || "unknown",
    attempts: Number.parseInt(meta.attempts || "0", 10) || 0,
    payload: meta.payload || {},
    result: meta.result === undefined ? null : meta.result,
    last_error: meta.last_error === undefined ? null : meta.last_error,
  };
}

async function buildJobs(queue) {
  const [pendingIds, processingIds, completedIds, failedIds] = await Promise.all([
    queue.listPending(),
    queue.listProcessing(),
    queue.listCompleted(),
    queue.listFailed(),
  ]);
  const completedSlice = completedIds.slice(0, 10);
  const failedSlice = failedIds.slice(0, 10);
  const [pending, processing, completed, failed] = await Promise.all([
    Promise.all(pendingIds.map((id) => summarizeJob(queue, id))),
    Promise.all(processingIds.map((id) => summarizeJob(queue, id))),
    Promise.all(completedSlice.map((id) => summarizeJob(queue, id))),
    Promise.all(failedSlice.map((id) => summarizeJob(queue, id))),
  ]);
  return { pending, processing, completed, failed };
}

async function buildStats(queue, pool) {
  const stats = await queue.stats();
  stats.workers_running = pool.running();
  stats.worker_processed_total = pool.totalProcessed();
  stats.work_latency_ms = pool.workLatencyMs;
  stats.fail_rate = pool.failRate;
  stats.hang_rate = pool.hangRate;
  return stats;
}

function clampInt(value, fallback, lo, hi) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(lo, Math.min(hi, parsed));
}

function clampFloat(value, fallback, lo, hi) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(lo, Math.min(hi, parsed));
}

async function handleEnqueue(queue, pool, req, res) {
  const params = await readForm(req);
  const kind = params.kind || "email";
  const recipient = params.recipient || "user@example.com";
  const count = clampInt(params.count, 1, 1, 50);

  const ids = [];
  for (let i = 0; i < count; i += 1) {
    const payload = { kind, recipient, n: i + 1 };
    // eslint-disable-next-line no-await-in-loop
    ids.push(await queue.enqueue(payload));
  }
  sendJson(res, 200, {
    enqueued: ids,
    stats: await buildStats(queue, pool),
  });
}

async function handleWorkersStart(queue, pool, req, res) {
  const params = await readForm(req);
  const size = clampInt(params.size, 2, 0, 8);
  const workLatencyMs = clampInt(params.work_latency_ms, 400, 0, 60000);
  const failRate = clampFloat(params.fail_rate, 0, 0, 1);
  const hangRate = clampFloat(params.hang_rate, 0, 0, 1);

  pool.configure({ workLatencyMs, failRate, hangRate });
  pool.resize(size);
  pool.start();
  sendJson(res, 200, await buildStats(queue, pool));
}

async function handleWorkersStop(queue, pool, _req, res) {
  pool.stop();
  sendJson(res, 200, await buildStats(queue, pool));
}

async function handleWorkersConfigure(queue, pool, req, res) {
  const params = await readForm(req);
  const update = {};
  if ("work_latency_ms" in params) {
    update.workLatencyMs = Number.parseInt(params.work_latency_ms, 10);
  }
  if ("fail_rate" in params) {
    update.failRate = Number.parseFloat(params.fail_rate);
  }
  if ("hang_rate" in params) {
    update.hangRate = Number.parseFloat(params.hang_rate);
  }
  pool.configure(update);
  sendJson(res, 200, await buildStats(queue, pool));
}

async function handleReclaim(queue, pool, _req, res) {
  const reclaimed = await queue.reclaimStuck();
  sendJson(res, 200, {
    reclaimed,
    stats: await buildStats(queue, pool),
  });
}

async function handleReset(queue, pool, _req, res) {
  pool.stop();
  await new Promise((r) => setTimeout(r, 100));
  await queue.purge();
  pool.resetProcessed();
  sendJson(res, 200, { stats: await buildStats(queue, pool) });
}

function makeHandler(queue, pool) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const { method } = req;
      const path = url.pathname;

      if (method === "GET" && (path === "/" || path === "/index.html")) {
        sendHtml(res, 200, htmlPage(queue.visibilityMs));
        return;
      }
      if (method === "GET" && path === "/jobs") {
        sendJson(res, 200, await buildJobs(queue));
        return;
      }
      if (method === "GET" && path === "/stats") {
        sendJson(res, 200, await buildStats(queue, pool));
        return;
      }
      if (method === "POST" && path === "/enqueue") {
        await handleEnqueue(queue, pool, req, res);
        return;
      }
      if (method === "POST" && path === "/workers/start") {
        await handleWorkersStart(queue, pool, req, res);
        return;
      }
      if (method === "POST" && path === "/workers/stop") {
        await handleWorkersStop(queue, pool, req, res);
        return;
      }
      if (method === "POST" && path === "/workers/configure") {
        await handleWorkersConfigure(queue, pool, req, res);
        return;
      }
      if (method === "POST" && path === "/reclaim") {
        await handleReclaim(queue, pool, req, res);
        return;
      }
      if (method === "POST" && path === "/reset") {
        await handleReset(queue, pool, req, res);
        return;
      }
      sendNotFound(res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[demo] handler error:", err);
      sendJson(res, 500, { error: String(err && err.message ? err.message : err) });
    }
  };
}

async function main() {
  const config = parseArgs();
  const client = createClient({
    socket: { host: config.redisHost, port: config.redisPort },
  });
  client.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("[redis] error:", err);
  });
  await client.connect();

  const queue = new RedisJobQueue({
    redisClient: client,
    queueName: config.queueName,
    visibilityMs: config.visibilityMs,
  });
  const pool = new WorkerPool({ queue, size: 0 });
  if (config.workers > 0) {
    pool.resize(config.workers);
    pool.start();
  }

  const server = http.createServer(makeHandler(queue, pool));
  server.listen(config.port, config.host, () => {
    // eslint-disable-next-line no-console
    console.log(
      `Redis job-queue demo server listening on http://${config.host}:${config.port}`,
    );
    // eslint-disable-next-line no-console
    console.log(`Using Redis at ${config.redisHost}:${config.redisPort}`);
    // eslint-disable-next-line no-console
    console.log(`Visibility timeout: ${config.visibilityMs} ms`);
  });

  const shutdown = async () => {
    pool.stop();
    server.close();
    try {
      await client.quit();
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
