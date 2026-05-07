// Redis Cache-Aside Demo Server
//
// Create a main.go file in the same directory:
//
//	package main
//
//	import "cacheaside"
//
//	func main() { cacheaside.RunDemoServer() }
//
// Then run:
//
//	go build -o demo ./...
//	./demo --port 8080 --redis-host localhost --redis-port 6379
package cacheaside

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"html"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type demoServer struct {
	cache   *RedisCache
	primary *MockPrimaryStore
}

// RunDemoServer parses CLI flags and starts the cache-aside demo HTTP server.
func RunDemoServer() {
	port := flag.Int("port", 8080, "HTTP bind port")
	host := flag.String("host", "127.0.0.1", "HTTP bind host")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	ttl := flag.Int("ttl", 30, "Cache TTL in seconds")
	primaryLatencyMs := flag.Int("primary-latency-ms", 150, "Simulated primary latency")
	flag.Parse()

	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})
	defer client.Close()

	if err := client.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("connect Redis at %s:%d: %v", *redisHost, *redisPort, err)
	}

	cache, err := New(Config{
		Client: client,
		TTL:    time.Duration(*ttl) * time.Second,
	})
	if err != nil {
		log.Fatalf("create cache: %v", err)
	}
	primary := NewMockPrimaryStore(time.Duration(*primaryLatencyMs) * time.Millisecond)

	s := &demoServer{cache: cache, primary: primary}

	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleIndex)
	mux.HandleFunc("/products", s.handleProducts)
	mux.HandleFunc("/read", s.handleRead)
	mux.HandleFunc("/stats", s.handleStats)
	mux.HandleFunc("/invalidate", s.handleInvalidate)
	mux.HandleFunc("/update", s.handleUpdate)
	mux.HandleFunc("/stampede", s.handleStampede)
	mux.HandleFunc("/reset", s.handleReset)

	addr := fmt.Sprintf("%s:%d", *host, *port)
	log.Printf("Redis cache-aside demo server listening on http://%s", addr)
	log.Printf("Using Redis at %s:%d with cache TTL %ds", *redisHost, *redisPort, *ttl)
	log.Printf("Mock primary read latency: %d ms", *primaryLatencyMs)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func (s *demoServer) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	page := htmlPage(s.primary.ListIDs(), int(s.primary.ReadLatency/time.Millisecond), int(s.cache.ttl.Seconds()))
	_, _ = w.Write([]byte(page))
}

func (s *demoServer) handleProducts(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"products": s.primary.ListIDs()})
}

func (s *demoServer) handleRead(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id' query parameter."})
		return
	}
	start := time.Now()
	res, err := s.cache.Get(r.Context(), id, s.primary.Read)
	totalMs := float64(time.Since(start).Microseconds()) / 1000.0
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	if res.Record == nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": fmt.Sprintf("No record for '%s'.", id)})
		return
	}
	ttl, _ := s.cache.TTLRemaining(r.Context(), id)
	writeJSON(w, http.StatusOK, map[string]any{
		"id":               id,
		"record":           res.Record,
		"hit":              res.Hit,
		"redis_latency_ms": round2(res.RedisLatencyMs),
		"total_latency_ms": round2(totalMs),
		"ttl_remaining":    ttl,
		"stats":            s.buildStats(),
	})
}

func (s *demoServer) handleStats(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.buildStats())
}

func (s *demoServer) handleInvalidate(w http.ResponseWriter, r *http.Request) {
	form, err := parseForm(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := form.Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id'."})
		return
	}
	deleted, err := s.cache.Invalidate(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "deleted": deleted, "stats": s.buildStats()})
}

func (s *demoServer) handleUpdate(w http.ResponseWriter, r *http.Request) {
	form, err := parseForm(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := form.Get("id")
	field := form.Get("field")
	value := form.Get("value")
	if id == "" || field == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id' or 'field'."})
		return
	}
	if !s.primary.UpdateField(id, field, value) {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "Unknown product."})
		return
	}
	if _, err := s.cache.Invalidate(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"id": id, "field": field, "value": value, "stats": s.buildStats()})
}

func (s *demoServer) handleStampede(w http.ResponseWriter, r *http.Request) {
	form, err := parseForm(r)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := form.Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id'."})
		return
	}
	concurrency, _ := strconv.Atoi(form.Get("concurrency"))
	if concurrency < 2 {
		concurrency = 20
	}
	if concurrency > 50 {
		concurrency = 50
	}

	if _, err := s.cache.Invalidate(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	primaryBefore := s.primary.Reads()

	results := make([]map[string]any, concurrency)
	var wg sync.WaitGroup
	wg.Add(concurrency)
	start := time.Now()
	for i := 0; i < concurrency; i++ {
		go func(i int) {
			defer wg.Done()
			res, err := s.cache.Get(r.Context(), id, s.primary.Read)
			results[i] = map[string]any{
				"hit":              res.Hit,
				"redis_latency_ms": round2(res.RedisLatencyMs),
				"found":            err == nil && res.Record != nil,
			}
		}(i)
	}
	wg.Wait()
	elapsedMs := float64(time.Since(start).Microseconds()) / 1000.0
	primaryDuring := s.primary.Reads() - primaryBefore

	writeJSON(w, http.StatusOK, map[string]any{
		"id":            id,
		"concurrency":   concurrency,
		"primary_reads": primaryDuring,
		"elapsed_ms":    round2(elapsedMs),
		"results":       results,
		"stats":         s.buildStats(),
	})
}

func (s *demoServer) handleReset(w http.ResponseWriter, _ *http.Request) {
	s.cache.ResetStats()
	s.primary.ResetReads()
	writeJSON(w, http.StatusOK, s.buildStats())
}

func (s *demoServer) buildStats() map[string]any {
	stats := s.cache.Stats()
	stats["primary_reads_total"] = s.primary.Reads()
	stats["primary_read_latency_ms"] = int(s.primary.ReadLatency / time.Millisecond)
	return stats
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func parseForm(r *http.Request) (form, error) {
	if err := r.ParseForm(); err != nil {
		return nil, err
	}
	return form(r.PostForm), nil
}

type form map[string][]string

func (f form) Get(key string) string {
	if v, ok := f[key]; ok && len(v) > 0 {
		return v[0]
	}
	return ""
}

func round2(v float64) float64 {
	return float64(int(v*100)) / 100.0
}

func htmlPage(productIDs []string, primaryLatencyMs, cacheTTL int) string {
	var opts strings.Builder
	for _, id := range productIDs {
		safe := html.EscapeString(id)
		fmt.Fprintf(&opts, `<option value="%s">%s</option>`, safe, safe)
	}

	page := strings.Replace(htmlTemplate, "{{OPTIONS}}", opts.String(), 1)
	page = strings.Replace(page, "{{PRIMARY_LATENCY}}", strconv.Itoa(primaryLatencyMs), 1)
	page = strings.Replace(page, "{{CACHE_TTL}}", strconv.Itoa(cacheTTL), 1)
	return page
}

const htmlTemplate = `<!DOCTYPE html>
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
    <div class="pill">go-redis + Go net/http</div>
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
      statsView.innerHTML = ` + "`" + `<dl>
        <dt>Hits</dt><dd>${stats.hits}</dd>
        <dt>Misses</dt><dd>${stats.misses}</dd>
        <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
        <dt>Stampedes suppressed</dt><dd>${stats.stampedes_suppressed}</dd>
        <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
        <dt>Primary read latency</dt><dd>${stats.primary_read_latency_ms} ms</dd>
      </dl>` + "`" + `;
    }
    function renderRead(data) {
      if (!data || !data.record) { resultView.innerHTML = "<p>(no record)</p>"; return; }
      const r = data.record;
      const badge = data.hit
        ? '<span class="badge hit">cache hit</span>'
        : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = ` + "`" + `<p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
        &nbsp; Total: <strong>${data.total_latency_ms} ms</strong>
        &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
          <dt>price_cents</dt><dd>${escapeHtml(r.price_cents ?? "")}</dd>
          <dt>stock</dt><dd>${escapeHtml(r.stock ?? "")}</dd>
        </dl>` + "`" + `;
    }
    function renderStampede(data) {
      const hits = data.results.filter((r) => r.hit).length;
      const misses = data.results.length - hits;
      resultView.innerHTML = ` + "`" + `<p>Fired <strong>${data.concurrency}</strong> concurrent reads in
        <strong>${data.elapsed_ms}</strong> ms.</p>
        <p>Cache misses: <strong>${misses}</strong> &nbsp;
           Cache hits: <strong>${hits}</strong> &nbsp;
           Primary reads: <strong>${data.primary_reads}</strong></p>
        <p>With stampede protection, primary reads should be 1 even though all
           ${data.concurrency} callers raced for a cold key. Without it, every
           concurrent miss would query the primary independently.</p>` + "`" + `;
    }
    async function loadStats() { renderStats(await (await fetch("/stats")).json()); }
    document.getElementById("read-button").addEventListener("click", async () => {
      const id = productSelect.value;
      const r = await fetch(` + "`" + `/read?id=${encodeURIComponent(id)}` + "`" + `);
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
      setStatus(` + "`" + `Stampede complete: ${d.primary_reads} primary read(s) for ${d.concurrency} concurrent callers.` + "`" + `, "ok");
    });
    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      renderStats(await r.json()); setStatus("Counters reset.", "ok");
    });
    loadStats();
  </script>
</body>
</html>
`
