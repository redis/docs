// Redis job-queue demo server.
//
// Create a main.go file in the same directory:
//
//	package main
//
//	import "jobqueue"
//
//	func main() { jobqueue.RunDemoServer() }
//
// Then run:
//
//	go build -o demo ./...
//	./demo -port 8792 -redis-host localhost -redis-port 6379
//
// Visit http://localhost:8792 to enqueue jobs, watch a pool of workers
// drain the queue, simulate worker crashes, and trigger a reclaim sweep
// that pulls timed-out jobs back to pending.
package jobqueue

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

type demoServer struct {
	queue *RedisJobQueue
	pool  *WorkerPool
}

// RunDemoServer is the entry point for the demo. Build a small main.go
// next to this file that calls jobqueue.RunDemoServer().
func RunDemoServer() {
	host := flag.String("host", "127.0.0.1", "HTTP bind host")
	port := flag.Int("port", 8792, "HTTP bind port")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	visibilityMs := flag.Int("visibility-ms", 5000, "Reclaim window for stuck jobs in milliseconds")
	queueName := flag.String("queue-name", "jobs", "Logical queue name used in Redis keys")
	startWorkers := flag.Int("workers", 0, "Start this many workers immediately (default 0 -- UI controls them)")
	flag.Parse()

	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("could not reach Redis at %s:%d: %v", *redisHost, *redisPort, err)
	}

	queue := NewRedisJobQueue(client, Options{
		QueueName:    *queueName,
		VisibilityMs: *visibilityMs,
	})
	pool := NewWorkerPool(ctx, queue, 0, 400, 0, 0)
	if *startWorkers > 0 {
		pool.Resize(*startWorkers)
		pool.Start()
	}

	srv := &demoServer{queue: queue, pool: pool}

	mux := http.NewServeMux()
	mux.HandleFunc("/", srv.handleRoot)
	mux.HandleFunc("/jobs", srv.handleJobs)
	mux.HandleFunc("/stats", srv.handleStats)
	mux.HandleFunc("/enqueue", srv.handleEnqueue)
	mux.HandleFunc("/workers/start", srv.handleWorkersStart)
	mux.HandleFunc("/workers/stop", srv.handleWorkersStop)
	mux.HandleFunc("/workers/configure", srv.handleWorkersConfigure)
	mux.HandleFunc("/reclaim", srv.handleReclaim)
	mux.HandleFunc("/reset", srv.handleReset)

	addr := fmt.Sprintf("%s:%d", *host, *port)
	httpSrv := &http.Server{Addr: addr, Handler: mux}

	go func() {
		log.Printf("Redis job-queue demo server listening on http://%s", addr)
		log.Printf("Using Redis at %s:%d", *redisHost, *redisPort)
		log.Printf("Visibility timeout: %d ms", *visibilityMs)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http server: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	<-sigCh
	log.Print("shutting down")
	pool.Stop()
	cancel()
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer shutdownCancel()
	_ = httpSrv.Shutdown(shutdownCtx)
}

// --- HTTP handlers ---

func (s *demoServer) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(s.htmlPage()))
}

func (s *demoServer) handleJobs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	payload, err := s.buildJobs(r.Context())
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, payload)
}

func (s *demoServer) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	stats, err := s.buildStats(r.Context())
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, stats)
}

func (s *demoServer) handleEnqueue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	kind := r.FormValue("kind")
	if kind == "" {
		kind = "email"
	}
	recipient := r.FormValue("recipient")
	if recipient == "" {
		recipient = "user@example.com"
	}
	count := 1
	if raw := r.FormValue("count"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			count = n
		}
	}
	if count < 1 {
		count = 1
	}
	if count > 50 {
		count = 50
	}

	ids := make([]string, 0, count)
	for i := 0; i < count; i++ {
		payload := map[string]any{
			"kind":      kind,
			"recipient": recipient,
			"n":         i + 1,
		}
		id, err := s.queue.Enqueue(r.Context(), payload)
		if err != nil {
			s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		ids = append(ids, id)
	}
	stats, _ := s.buildStats(r.Context())
	s.writeJSON(w, http.StatusOK, map[string]any{"enqueued": ids, "stats": stats})
}

func (s *demoServer) handleWorkersStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	size := 2
	if raw := r.FormValue("size"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			size = n
		}
	}
	if size < 0 {
		size = 0
	}
	if size > 8 {
		size = 8
	}
	workLatencyMs := 400
	if raw := r.FormValue("work_latency_ms"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			workLatencyMs = n
		}
	}
	if workLatencyMs < 0 {
		workLatencyMs = 0
	}
	failRate := 0.0
	if raw := r.FormValue("fail_rate"); raw != "" {
		if f, err := strconv.ParseFloat(raw, 64); err == nil {
			failRate = f
		}
	}
	hangRate := 0.0
	if raw := r.FormValue("hang_rate"); raw != "" {
		if f, err := strconv.ParseFloat(raw, 64); err == nil {
			hangRate = f
		}
	}

	s.pool.Configure(&workLatencyMs, &failRate, &hangRate)
	s.pool.Resize(size)
	s.pool.Start()
	stats, _ := s.buildStats(r.Context())
	s.writeJSON(w, http.StatusOK, stats)
}

func (s *demoServer) handleWorkersStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.pool.Stop()
	stats, _ := s.buildStats(r.Context())
	s.writeJSON(w, http.StatusOK, stats)
}

func (s *demoServer) handleWorkersConfigure(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	var workLatencyMs *int
	if raw := r.FormValue("work_latency_ms"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			workLatencyMs = &n
		}
	}
	var failRate *float64
	if raw := r.FormValue("fail_rate"); raw != "" {
		if f, err := strconv.ParseFloat(raw, 64); err == nil {
			failRate = &f
		}
	}
	var hangRate *float64
	if raw := r.FormValue("hang_rate"); raw != "" {
		if f, err := strconv.ParseFloat(raw, 64); err == nil {
			hangRate = &f
		}
	}
	s.pool.Configure(workLatencyMs, failRate, hangRate)
	stats, _ := s.buildStats(r.Context())
	s.writeJSON(w, http.StatusOK, stats)
}

func (s *demoServer) handleReclaim(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	reclaimed, err := s.queue.ReclaimStuck(r.Context())
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	if reclaimed == nil {
		reclaimed = []string{}
	}
	stats, _ := s.buildStats(r.Context())
	s.writeJSON(w, http.StatusOK, map[string]any{"reclaimed": reclaimed, "stats": stats})
}

func (s *demoServer) handleReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.pool.Stop()
	time.Sleep(100 * time.Millisecond)
	if err := s.queue.Purge(r.Context()); err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	s.pool.ResetProcessed()
	stats, _ := s.buildStats(r.Context())
	s.writeJSON(w, http.StatusOK, map[string]any{"stats": stats})
}

// --- helpers ---

func (s *demoServer) buildJobs(ctx context.Context) (map[string]any, error) {
	pending, err := s.queue.ListPending(ctx)
	if err != nil {
		return nil, err
	}
	processing, err := s.queue.ListProcessing(ctx)
	if err != nil {
		return nil, err
	}
	completed, err := s.queue.ListCompleted(ctx)
	if err != nil {
		return nil, err
	}
	failed, err := s.queue.ListFailed(ctx)
	if err != nil {
		return nil, err
	}
	if len(completed) > 10 {
		completed = completed[:10]
	}
	if len(failed) > 10 {
		failed = failed[:10]
	}
	return map[string]any{
		"pending":    s.summarizeJobs(ctx, pending),
		"processing": s.summarizeJobs(ctx, processing),
		"completed":  s.summarizeJobs(ctx, completed),
		"failed":     s.summarizeJobs(ctx, failed),
	}, nil
}

func (s *demoServer) summarizeJobs(ctx context.Context, ids []string) []map[string]any {
	out := make([]map[string]any, 0, len(ids))
	for _, id := range ids {
		meta, err := s.queue.GetJob(ctx, id)
		if err != nil || meta == nil {
			out = append(out, map[string]any{
				"id":       id,
				"status":   "unknown",
				"attempts": 0,
				"payload":  map[string]any{},
			})
			continue
		}
		status, _ := meta["status"].(string)
		if status == "" {
			status = "unknown"
		}
		attempts := 0
		if a, ok := meta["attempts"].(string); ok {
			if n, err := strconv.Atoi(a); err == nil {
				attempts = n
			}
		}
		summary := map[string]any{
			"id":       id,
			"status":   status,
			"attempts": attempts,
			"payload":  meta["payload"],
		}
		if result, ok := meta["result"]; ok {
			summary["result"] = result
		}
		if lastErr, ok := meta["last_error"].(string); ok && lastErr != "" {
			summary["last_error"] = lastErr
		}
		out = append(out, summary)
	}
	return out
}

func (s *demoServer) buildStats(ctx context.Context) (map[string]any, error) {
	stats, err := s.queue.Stats(ctx)
	if err != nil {
		return nil, err
	}
	stats["workers_running"] = s.pool.Running()
	stats["worker_processed_total"] = s.pool.TotalProcessed()
	stats["work_latency_ms"] = s.pool.WorkLatencyMs()
	stats["fail_rate"] = s.pool.FailRate()
	stats["hang_rate"] = s.pool.HangRate()
	return stats, nil
}

func (s *demoServer) writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// htmlPage returns the inline demo UI, ported verbatim from the Python
// reference (only the pill text changes).
func (s *demoServer) htmlPage() string {
	visibilityMs := s.queue.VisibilityMs()
	return fmt.Sprintf(htmlTemplate, visibilityMs, visibilityMs)
}

const htmlTemplate = `<!DOCTYPE html>
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
        linear-gradient(180deg, #f3ecdf 0%%, var(--bg) 100%%);
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
      width: 100%%;
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
      button { width: 100%%; }
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">go-redis + Go net/http</div>
    <h1>Redis Job Queue Demo</h1>
    <p class="lede">
      Enqueue background jobs and watch a pool of workers drain them through Redis.
      Pending jobs sit in a list; each worker uses <code>BLMOVE</code> to atomically
      claim a job and move it to a processing list. Completed jobs move to a short
      history. If a worker hangs past the %d ms visibility timeout,
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
        %d ms visibility timeout back to pending.</p>
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
      view.innerHTML = ` + "`" + `
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
      ` + "`" + `;
    }

    function renderJobList(elementId, jobs, countId, badgeClass) {
      const list = document.getElementById(elementId);
      const count = document.getElementById(countId);
      count.textContent = jobs.length;
      count.className = ` + "`" + `badge ${badgeClass}` + "`" + `;
      if (!jobs.length) { list.innerHTML = "<li><span class=meta>(empty)</span></li>"; return; }
      list.innerHTML = jobs.map((job) => {
        const payload = job.payload && typeof job.payload === "object"
          ? JSON.stringify(job.payload)
          : escapeHtml(job.payload || "");
        const extra = job.last_error
          ? ` + "`" + ` &middot; <span class=meta>error: ${escapeHtml(job.last_error)}</span>` + "`" + `
          : job.result
            ? ` + "`" + ` &middot; <span class=meta>result: ${escapeHtml(typeof job.result === "object" ? JSON.stringify(job.result) : job.result)}</span>` + "`" + `
            : "";
        return ` + "`" + `<li>
          <strong>${escapeHtml(job.id)}</strong>
          <span class=badge ${badgeClass}>${escapeHtml(job.status)}</span>
          <span class=meta>attempts: ${job.attempts}</span>
          ${extra}
          <div class=meta>${escapeHtml(payload)}</div>
        </li>` + "`" + `;
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
      setStatus(` + "`" + `Enqueued ${data.enqueued.length} job(s).` + "`" + `, "ok");
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
      setStatus(` + "`" + `Reclaimed ${data.reclaimed.length} job(s).` + "`" + `, "ok");
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
`
