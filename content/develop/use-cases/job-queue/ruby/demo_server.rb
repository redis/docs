#!/usr/bin/env ruby
# Redis job-queue demo server.
#
# Run this file and visit http://localhost:8797 to enqueue jobs, watch a
# pool of workers drain the queue, simulate worker crashes, and trigger a
# reclaim sweep that pulls timed-out jobs back to pending.

require 'cgi'
require 'json'
require 'optparse'
require 'redis'
require 'webrick'

require_relative 'job_queue'
require_relative 'worker'

def parse_args(argv)
  opts = {
    host: '127.0.0.1',
    port: 8797,
    redis_host: 'localhost',
    redis_port: 6379,
    visibility_ms: 5000,
    workers: 0,
    queue_name: 'jobs',
  }
  OptionParser.new do |o|
    o.banner = 'Usage: demo_server.rb [options]'
    o.on('--host HOST', 'HTTP bind host') { |v| opts[:host] = v }
    o.on('--port PORT', Integer, 'HTTP bind port') { |v| opts[:port] = v }
    o.on('--redis-host HOST', 'Redis host') { |v| opts[:redis_host] = v }
    o.on('--redis-port PORT', Integer, 'Redis port') { |v| opts[:redis_port] = v }
    o.on('--visibility-ms MS', Integer, 'Reclaim window in milliseconds') { |v| opts[:visibility_ms] = v }
    o.on('--workers N', Integer, 'Start this many workers immediately') { |v| opts[:workers] = v }
    o.on('--queue-name NAME', 'Queue name (default: jobs)') { |v| opts[:queue_name] = v }
  end.parse!(argv)
  opts
end

def parse_form(body)
  CGI.parse(body.to_s)
end

def clamp_int(value, lo, hi, default)
  v = Integer(value)
  [[v, lo].max, hi].min
rescue ArgumentError, TypeError
  default
end

def clamp_float(value, lo, hi, default)
  v = Float(value)
  [[v, lo].max, hi].min
rescue ArgumentError, TypeError
  default
end

def summarize_job(queue, job_id)
  meta = queue.get_job(job_id) || {}
  {
    'id' => job_id,
    'status' => meta['status'] || 'unknown',
    'attempts' => (meta['attempts'] || 0).to_i,
    'payload' => meta['payload'] || {},
    'result' => meta['result'],
    'last_error' => meta['last_error'],
  }
end

def build_jobs(queue)
  {
    'pending' => queue.list_pending.map { |id| summarize_job(queue, id) },
    'processing' => queue.list_processing.map { |id| summarize_job(queue, id) },
    'completed' => queue.list_completed.first(10).map { |id| summarize_job(queue, id) },
    'failed' => queue.list_failed.first(10).map { |id| summarize_job(queue, id) },
  }
end

def build_stats(queue, pool)
  stats = queue.stats
  stats['workers_running'] = pool.running
  stats['worker_processed_total'] = pool.total_processed
  stats['work_latency_ms'] = pool.work_latency_ms
  stats['fail_rate'] = pool.fail_rate
  stats['hang_rate'] = pool.hang_rate
  stats
end

def html_page(visibility_ms)
  <<~HTML
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
        <div class="pill">redis-rb + WEBrick</div>
        <h1>Redis Job Queue Demo</h1>
        <p class="lede">
          Enqueue background jobs and watch a pool of workers drain them through Redis.
          Pending jobs sit in a list; each worker uses <code>BRPOPLPUSH</code> to atomically
          claim a job and move it to a processing list. Completed jobs move to a short
          history. If a worker hangs past the #{visibility_ms} ms visibility timeout,
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
            <label for="fail-rate">Failure rate (0-1)</label>
            <input id="fail-rate" type="number" step="0.05" min="0" max="1" value="0">
            <label for="hang-rate">Hang rate (simulated crash)</label>
            <input id="hang-rate" type="number" step="0.05" min="0" max="1" value="0">
            <button id="start-button">Start / apply</button>
            <button id="stop-button" class="secondary">Stop workers</button>
          </section>

          <section class="panel">
            <h2>Reclaim &amp; reset</h2>
            <p>Reclaim moves any job sitting in the processing list past the
            #{visibility_ms} ms visibility timeout back to pending.</p>
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
              <dt>Workers running</dt><dd>${stats.workers_running}</dd>
              <dt>Pending depth</dt><dd>${stats.pending_depth}</dd>
              <dt>Processing depth</dt><dd>${stats.processing_depth}</dd>
              <dt>Enqueued total</dt><dd>${stats.enqueued_total}</dd>
              <dt>Completed total</dt><dd>${stats.completed_total}</dd>
              <dt>Failed total</dt><dd>${stats.failed_total}</dd>
              <dt>Reclaimed total</dt><dd>${stats.reclaimed_total}</dd>
              <dt>Worker processed</dt><dd>${stats.worker_processed_total}</dd>
              <dt>Visibility timeout</dt><dd>${stats.visibility_ms} ms</dd>
              <dt>Work latency</dt><dd>${stats.work_latency_ms} ms</dd>
              <dt>Failure rate</dt><dd>${stats.fail_rate}</dd>
              <dt>Hang rate</dt><dd>${stats.hang_rate}</dd>
            </dl>
          `;
        }

        function renderJobList(elementId, jobs, countId, badgeClass) {
          const list = document.getElementById(elementId);
          const count = document.getElementById(countId);
          count.textContent = jobs.length;
          count.className = `badge ${badgeClass}`;
          if (!jobs.length) { list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }
          list.innerHTML = jobs.map((job) => {
            const payload = job.payload && typeof job.payload === "object"
              ? JSON.stringify(job.payload)
              : escapeHtml(job.payload || "");
            const extra = job.last_error
              ? ` &middot; <span class=meta>error: ${escapeHtml(job.last_error)}</span>`
              : job.result
                ? ` &middot; <span class=meta>result: ${escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}</span>`
                : "";
            return `<li>
              <strong>${escapeHtml(job.id)}</strong>
              <span class=badge ${badgeClass}>${escapeHtml(job.status)}</span>
              <span class=meta>attempts: ${job.attempts}</span>
              ${extra}
              <div class=meta>${escapeHtml(payload)}</div>
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
          setStatus(`Enqueued ${data.enqueued.length} job(s).`, "ok");
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
          setStatus(`Reclaimed ${data.reclaimed.length} job(s).`, "ok");
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
  HTML
end

# -- request handlers -------------------------------------------------------

class JobQueueServlet < WEBrick::HTTPServlet::AbstractServlet
  def initialize(server, queue, pool)
    super(server)
    @queue = queue
    @pool = pool
  end

  def do_GET(req, res)
    case req.path
    when '/', '/index.html'
      send_html(res, html_page(@queue.visibility_ms))
    when '/jobs'
      send_json(res, build_jobs(@queue))
    when '/stats'
      send_json(res, build_stats(@queue, @pool))
    else
      res.status = 404
      res.body = 'not found'
    end
  end

  def do_POST(req, res)
    case req.path
    when '/enqueue'
      handle_enqueue(req, res)
    when '/workers/start'
      handle_workers_start(req, res)
    when '/workers/stop'
      @pool.stop
      send_json(res, build_stats(@queue, @pool))
    when '/workers/configure'
      handle_workers_configure(req, res)
    when '/reclaim'
      reclaimed = @queue.reclaim_stuck
      send_json(res, 'reclaimed' => reclaimed, 'stats' => build_stats(@queue, @pool))
    when '/reset'
      @pool.stop
      sleep 0.1
      @queue.purge
      @pool.reset_processed
      send_json(res, 'stats' => build_stats(@queue, @pool))
    else
      res.status = 404
      res.body = 'not found'
    end
  end

  private

  def handle_enqueue(req, res)
    params = parse_form(req.body)
    kind = (params['kind'] || []).first || 'email'
    recipient = (params['recipient'] || []).first
    recipient = 'user@example.com' if recipient.nil? || recipient.empty?
    count = clamp_int((params['count'] || ['1']).first, 1, 50, 1)

    ids = []
    count.times do |index|
      ids << @queue.enqueue('kind' => kind, 'recipient' => recipient, 'n' => index + 1)
    end
    send_json(res, 'enqueued' => ids, 'stats' => build_stats(@queue, @pool))
  end

  def handle_workers_start(req, res)
    params = parse_form(req.body)
    size = clamp_int((params['size'] || ['2']).first, 0, 8, 2)
    work_latency_ms = clamp_int((params['work_latency_ms'] || ['400']).first, 0, 1_000_000, 400)
    fail_rate = clamp_float((params['fail_rate'] || ['0']).first, 0.0, 1.0, 0.0)
    hang_rate = clamp_float((params['hang_rate'] || ['0']).first, 0.0, 1.0, 0.0)

    @pool.configure(work_latency_ms: work_latency_ms, fail_rate: fail_rate, hang_rate: hang_rate)
    @pool.resize(size)
    @pool.start
    send_json(res, build_stats(@queue, @pool))
  end

  def handle_workers_configure(req, res)
    params = parse_form(req.body)
    kwargs = {}
    if params.key?('work_latency_ms')
      begin
        kwargs[:work_latency_ms] = Integer(params['work_latency_ms'].first)
      rescue ArgumentError, TypeError
        # ignore
      end
    end
    if params.key?('fail_rate')
      begin
        kwargs[:fail_rate] = Float(params['fail_rate'].first)
      rescue ArgumentError, TypeError
        # ignore
      end
    end
    if params.key?('hang_rate')
      begin
        kwargs[:hang_rate] = Float(params['hang_rate'].first)
      rescue ArgumentError, TypeError
        # ignore
      end
    end
    @pool.configure(**kwargs)
    send_json(res, build_stats(@queue, @pool))
  end

  def send_html(res, body)
    res.status = 200
    res['Content-Type'] = 'text/html; charset=utf-8'
    res.body = body
  end

  def send_json(res, payload)
    res.status = 200
    res['Content-Type'] = 'application/json'
    res.body = JSON.generate(payload)
  end
end

# -- entrypoint -------------------------------------------------------------

def main
  args = parse_args(ARGV)

  build_redis = -> { Redis.new(host: args[:redis_host], port: args[:redis_port]) }
  build_queue = lambda do
    RedisJobQueue.new(
      redis: build_redis.call,
      queue_name: args[:queue_name],
      visibility_ms: args[:visibility_ms],
    )
  end

  queue = build_queue.call
  pool = WorkerPool.new(queue_factory: build_queue, size: 0)
  if args[:workers] > 0
    pool.resize(args[:workers])
    pool.start
  end

  server = WEBrick::HTTPServer.new(
    BindAddress: args[:host],
    Port: args[:port],
    Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
    AccessLog: [],
  )
  server.mount('/', JobQueueServlet, queue, pool)

  trap('INT') { server.shutdown }
  trap('TERM') { server.shutdown }

  puts "Redis job-queue demo server listening on http://#{args[:host]}:#{args[:port]}"
  puts "Using Redis at #{args[:redis_host]}:#{args[:redis_port]}"
  puts "Visibility timeout: #{args[:visibility_ms]} ms"
  begin
    server.start
  ensure
    pool.stop
  end
end

main if $PROGRAM_NAME == __FILE__
