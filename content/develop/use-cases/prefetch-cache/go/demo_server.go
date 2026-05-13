// Redis prefetch-cache demo server.
//
// Create a main.go file in a subdirectory (Go's package main can't live
// in the same directory as package prefetchcache):
//
//	mkdir -p cmd/demo
//	cat > cmd/demo/main.go <<'EOF'
//	package main
//
//	import "prefetchcache"
//
//	func main() { prefetchcache.RunDemoServer() }
//	EOF
//
// Then build and run:
//
//	go mod tidy
//	go run ./cmd/demo --port 8784
//
// Visit http://localhost:8784 to watch a prefetch cache in action: the
// demo bulk-loads every primary record into Redis on startup, runs a
// background sync worker that applies primary mutations within
// milliseconds, and lets you add, update, delete, and re-prefetch
// records to see how the cache stays current without ever falling back
// to the primary on the read path.
package prefetchcache

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
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

type demoServer struct {
	cache   *PrefetchCache
	primary *MockPrimaryStore
	sync    *SyncWorker
}

// RunDemoServer parses CLI flags and starts the prefetch-cache demo
// HTTP server. It is the entry point your cmd/demo/main.go shim calls.
func RunDemoServer() {
	host := flag.String("host", "127.0.0.1", "HTTP bind host")
	port := flag.Int("port", 8784, "HTTP bind port")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	cachePrefix := flag.String("cache-prefix", "cache:category:", "Cache key prefix")
	ttlSeconds := flag.Int("ttl-seconds", 3600, "Safety-net TTL in seconds (refreshed on every sync event)")
	primaryLatencyMs := flag.Int("primary-latency-ms", 80,
		"Simulated primary read latency (only affects bulk loads and reconciliations)")
	flag.Parse()

	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("could not reach Redis at %s:%d: %v", *redisHost, *redisPort, err)
	}

	cache := NewPrefetchCache(client, *cachePrefix, *ttlSeconds)
	primary := NewMockPrimaryStore(*primaryLatencyMs)
	syncWorker := NewSyncWorker(primary, cache)

	started := time.Now()
	if _, err := cache.Clear(ctx); err != nil {
		log.Fatalf("clear cache: %v", err)
	}
	loaded, err := cache.BulkLoad(ctx, primary.ListRecords())
	if err != nil {
		log.Fatalf("bulk load: %v", err)
	}
	elapsedMs := float64(time.Since(started).Microseconds()) / 1000.0
	syncWorker.Start()

	srv := &demoServer{cache: cache, primary: primary, sync: syncWorker}

	mux := http.NewServeMux()
	mux.HandleFunc("/", srv.handleRoot)
	mux.HandleFunc("/categories", srv.handleCategories)
	mux.HandleFunc("/read", srv.handleRead)
	mux.HandleFunc("/stats", srv.handleStats)
	mux.HandleFunc("/update", srv.handleUpdate)
	mux.HandleFunc("/add", srv.handleAdd)
	mux.HandleFunc("/delete", srv.handleDelete)
	mux.HandleFunc("/invalidate", srv.handleInvalidate)
	mux.HandleFunc("/clear", srv.handleClear)
	mux.HandleFunc("/reprefetch", srv.handleReprefetch)
	mux.HandleFunc("/reset", srv.handleReset)

	addr := fmt.Sprintf("%s:%d", *host, *port)
	httpSrv := &http.Server{Addr: addr, Handler: mux}

	go func() {
		log.Printf("Redis prefetch-cache demo server listening on http://%s", addr)
		log.Printf("Using Redis at %s:%d with cache prefix '%s' and TTL %ds",
			*redisHost, *redisPort, *cachePrefix, *ttlSeconds)
		log.Printf("Prefetched %d records in %.1f ms; sync worker running", loaded, elapsedMs)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http server: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	<-sigCh
	log.Print("shutting down")
	syncWorker.Stop(2 * time.Second)
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

func (s *demoServer) handleCategories(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ids, err := s.cache.IDs(r.Context())
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	if ids == nil {
		ids = []string{}
	}
	primaryIDs := s.primary.ListIDs()
	if primaryIDs == nil {
		primaryIDs = []string{}
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"cache_ids":   ids,
		"primary_ids": primaryIDs,
	})
}

func (s *demoServer) handleRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := r.URL.Query().Get("id")
	if id == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id'."})
		return
	}
	result, err := s.cache.Get(r.Context(), id)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	ttl, err := s.cache.TTLRemaining(r.Context(), id)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	var record any
	if result.Record == nil {
		record = nil
	} else {
		record = result.Record
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"id":                id,
		"record":            record,
		"hit":               result.Hit,
		"redis_latency_ms":  roundTo(result.RedisLatencyMs, 2),
		"ttl_remaining":     ttl,
		"stats":             s.buildStats(),
	})
}

func (s *demoServer) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.writeJSON(w, http.StatusOK, s.buildStats())
}

func (s *demoServer) handleUpdate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := r.FormValue("id")
	field := r.FormValue("field")
	value := r.FormValue("value")
	if id == "" || field == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id' or 'field'."})
		return
	}
	if !s.primary.UpdateField(id, field, value) {
		s.writeJSON(w, http.StatusNotFound, map[string]any{"error": fmt.Sprintf("Unknown category '%s'.", id)})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"id":    id,
		"field": field,
		"value": value,
		"stats": s.buildStats(),
	})
}

func (s *demoServer) handleAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := strings.TrimSpace(r.FormValue("id"))
	name := strings.TrimSpace(r.FormValue("name"))
	if id == "" || name == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id' or 'name'."})
		return
	}
	displayOrder := r.FormValue("display_order")
	if displayOrder == "" {
		displayOrder = "99"
	}
	featured := r.FormValue("featured")
	if featured == "" {
		featured = "false"
	}
	parentID := r.FormValue("parent_id")
	record := map[string]string{
		"id":            id,
		"name":          name,
		"display_order": displayOrder,
		"featured":      featured,
		"parent_id":     parentID,
	}
	if !s.primary.AddRecord(record) {
		s.writeJSON(w, http.StatusConflict, map[string]any{"error": fmt.Sprintf("Category '%s' already exists.", id)})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"id":     id,
		"record": record,
		"stats":  s.buildStats(),
	})
}

func (s *demoServer) handleDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := r.FormValue("id")
	if id == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id'."})
		return
	}
	if !s.primary.DeleteRecord(id) {
		s.writeJSON(w, http.StatusNotFound, map[string]any{"error": fmt.Sprintf("Unknown category '%s'.", id)})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"id":    id,
		"stats": s.buildStats(),
	})
}

func (s *demoServer) handleInvalidate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
		return
	}
	id := r.FormValue("id")
	if id == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]any{"error": "Missing 'id'."})
		return
	}
	deleted, err := s.cache.Invalidate(r.Context(), id)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"id":      id,
		"deleted": deleted,
		"stats":   s.buildStats(),
	})
}

// pauseMu serialises /clear and /reprefetch so two concurrent admin
// callers cannot pause/resume each other into a sync-worker live state.
var pauseMu sync.Mutex

func (s *demoServer) handleClear(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	pauseMu.Lock()
	defer pauseMu.Unlock()
	// Pause the sync worker so it cannot recreate keys between SCAN
	// and DEL. Queued events accumulate and apply after resume.
	s.sync.Pause(2 * time.Second)
	deleted, err := s.cache.Clear(r.Context())
	s.sync.Resume()
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"deleted": deleted,
		"stats":   s.buildStats(),
	})
}

func (s *demoServer) handleReprefetch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	pauseMu.Lock()
	defer pauseMu.Unlock()
	// Pause the sync worker so it cannot interleave with the clear
	// + snapshot + bulk_load sequence. Without this, a change applied
	// between ListRecords() and BulkLoad() would be overwritten by
	// the stale snapshot.
	s.sync.Pause(2 * time.Second)
	started := time.Now()
	var loaded int
	var clearErr, loadErr error
	if _, clearErr = s.cache.Clear(r.Context()); clearErr == nil {
		loaded, loadErr = s.cache.BulkLoad(r.Context(), s.primary.ListRecords())
	}
	elapsedMs := float64(time.Since(started).Microseconds()) / 1000.0
	s.sync.Resume()
	if clearErr != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": clearErr.Error()})
		return
	}
	if loadErr != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]any{"error": loadErr.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]any{
		"loaded":     loaded,
		"elapsed_ms": roundTo(elapsedMs, 2),
		"stats":      s.buildStats(),
	})
}

func (s *demoServer) handleReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.cache.ResetStats()
	s.primary.ResetReads()
	s.writeJSON(w, http.StatusOK, s.buildStats())
}

// --- helpers ---

func (s *demoServer) buildStats() map[string]any {
	stats := s.cache.Stats()
	stats["primary_reads_total"] = s.primary.Reads()
	stats["primary_read_latency_ms"] = s.primary.ReadLatencyMs()
	return stats
}

func (s *demoServer) writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (s *demoServer) htmlPage() string {
	return strings.ReplaceAll(htmlTemplate, "__CACHE_TTL__", strconv.Itoa(s.cache.TTLSeconds()))
}

// htmlTemplate is the inline demo UI, ported verbatim from the Python
// reference. The only substitutions are the pill text (top of <body>)
// and __CACHE_TTL__.
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Prefetch Cache Demo</title>
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
    main { max-width: 980px; margin: 0 auto; padding: 48px 20px 72px; }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 52rem; font-size: 1.1rem; color: var(--muted); }
    .grid {
      display: grid; gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
      display: inline-block; border-radius: 999px;
      background: #efe2cf; color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.9rem; margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%; padding: 10px 12px;
      border-radius: 10px; border: 1px solid #cfbca6;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 11px 18px; font: inherit; cursor: pointer;
      margin-right: 8px; margin-top: 12px;
    }
    button.secondary { background: #38424a; }
    button.danger { background: #8a3a3a; }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    button.danger:hover { background: #6b2929; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 3px 8px; font-size: 0.85rem; font-weight: bold;
    }
    .badge.hit { background: var(--hit); color: #1d4a2c; }
    .badge.miss { background: var(--miss); color: #6b3220; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 120px; }
    #status {
      margin-top: 20px; padding: 14px 16px;
      border-radius: 14px; display: none;
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
    <div class="pill">go-redis + Go net/http</div>
    <h1>Redis Prefetch Cache Demo</h1>
    <p class="lede">
      Every record from the primary store has been pre-loaded into Redis.
      Reads run <code>HGETALL</code> against Redis only &mdash; there is no
      fall-back to the primary on the read path. When you add, update, or
      delete a record, the primary emits a change event that a background
      sync worker applies to Redis within a few milliseconds. A long
      safety-net TTL (__CACHE_TTL__ s) is refreshed on every add or update
      event (delete events remove the key) and bounds memory if sync ever stops.
    </p>

    <div class="grid">
      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Cache state</h2>
        <div id="state-view">Loading...</div>
        <button id="refresh-state">Refresh state</button>
      </section>

      <section class="panel">
        <h2>Read a category</h2>
        <p>Reads come from Redis only. Every read should be a hit because
        the cache was pre-loaded and the sync worker keeps it current.</p>
        <label for="read-id">Category ID</label>
        <select id="read-id"></select>
        <button id="read-button">Read from cache</button>
      </section>

      <section class="panel">
        <h2>Update a field</h2>
        <p>Updates write to the primary. The sync worker picks up the
        change event and rewrites the cache hash within milliseconds.</p>
        <label for="update-id">Category</label>
        <select id="update-id"></select>
        <label for="update-field">Field</label>
        <select id="update-field">
          <option value="name">name</option>
          <option value="display_order">display_order</option>
          <option value="featured">featured</option>
          <option value="parent_id">parent_id</option>
        </select>
        <label for="update-value">New value</label>
        <input id="update-value" value="true">
        <button id="update-button">Apply update</button>
      </section>

      <section class="panel">
        <h2>Add a category</h2>
        <p>Inserts to the primary propagate to the cache through the same
        sync path.</p>
        <label for="add-id">ID</label>
        <input id="add-id" value="cat-006">
        <label for="add-name">Name</label>
        <input id="add-name" value="Seasonal">
        <label for="add-display-order">Display order</label>
        <input id="add-display-order" value="6">
        <button id="add-button">Add to primary</button>
      </section>

      <section class="panel">
        <h2>Delete a category</h2>
        <p>Deletes remove the record from the primary, and the sync worker
        removes the cache entry.</p>
        <label for="delete-id">Category</label>
        <select id="delete-id"></select>
        <button id="delete-button" class="danger">Delete from primary</button>
      </section>

      <section class="panel">
        <h2>Break the cache</h2>
        <p>Simulate a failure of the sync pipeline. Reads against the
        affected key(s) return a miss until you re-prefetch.</p>
        <label for="invalidate-id">Category</label>
        <select id="invalidate-id"></select>
        <div class="row">
          <button id="invalidate-button" class="secondary">Invalidate one</button>
          <button id="clear-button" class="danger">Clear all</button>
        </div>
        <button id="reprefetch-button">Re-prefetch from primary</button>
      </section>

      <section class="panel">
        <h2>Cache stats</h2>
        <div id="stats-view">Loading...</div>
        <button id="reset-button" class="secondary">Reset counters</button>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Last result</h2>
        <div id="result-view"><p>Read a category to see the cached record and timing.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const stateView = document.getElementById("state-view");
    const readIdSelect = document.getElementById("read-id");
    const updateIdSelect = document.getElementById("update-id");
    const updateField = document.getElementById("update-field");
    const updateValue = document.getElementById("update-value");
    const addId = document.getElementById("add-id");
    const addName = document.getElementById("add-name");
    const addDisplayOrder = document.getElementById("add-display-order");
    const deleteIdSelect = document.getElementById("delete-id");
    const invalidateIdSelect = document.getElementById("invalidate-id");
    const statsView = document.getElementById("stats-view");
    const resultView = document.getElementById("result-view");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderState(data) {
      const cacheIds = data.cache_ids || [];
      const primaryIds = data.primary_ids || [];
      const missing = primaryIds.filter((id) => !cacheIds.includes(id));
      const orphaned = cacheIds.filter((id) => !primaryIds.includes(id));
      stateView.innerHTML = ` + "`" + `
        <dl>
          <dt>In cache</dt><dd>${cacheIds.length} (${cacheIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
          <dt>In primary</dt><dd>${primaryIds.length} (${primaryIds.map(escapeHtml).join(", ") || "&mdash;"})</dd>
          <dt>Missing from cache</dt><dd>${missing.length ? missing.map(escapeHtml).join(", ") : "none"}</dd>
          <dt>Orphaned in cache</dt><dd>${orphaned.length ? orphaned.map(escapeHtml).join(", ") : "none"}</dd>
        </dl>` + "`" + `;
      const select = (el, ids) => {
        const previous = el.value;
        el.innerHTML = ids.map((id) =>
          ` + "`" + `<option value="${escapeHtml(id)}">${escapeHtml(id)}</option>` + "`" + `).join("");
        if (ids.includes(previous)) el.value = previous;
      };
      select(readIdSelect, cacheIds.length ? cacheIds : primaryIds);
      select(updateIdSelect, primaryIds);
      select(deleteIdSelect, primaryIds);
      select(invalidateIdSelect, cacheIds);
    }

    function renderStats(stats) {
      if (!stats) { statsView.textContent = "(no data)"; return; }
      statsView.innerHTML = ` + "`" + `
        <dl>
          <dt>Hits</dt><dd>${stats.hits}</dd>
          <dt>Misses</dt><dd>${stats.misses}</dd>
          <dt>Hit rate</dt><dd>${stats.hit_rate_pct}%</dd>
          <dt>Prefetched</dt><dd>${stats.prefetched}</dd>
          <dt>Sync events applied</dt><dd>${stats.sync_events_applied}</dd>
          <dt>Avg sync lag</dt><dd>${stats.sync_lag_ms_avg} ms</dd>
          <dt>Primary reads (total)</dt><dd>${stats.primary_reads_total}</dd>
        </dl>` + "`" + `;
    }

    function renderRead(data) {
      if (!data || !data.record) {
        resultView.innerHTML = ` + "`" + `<p><span class="badge miss">cache miss</span> &nbsp;
          No entry in Redis for <strong>${escapeHtml(data.id)}</strong>.</p>
          <p>With a healthy prefetch and sync, this should never happen on
          a valid id &mdash; it means either the sync pipeline is behind
          or the entry has been invalidated.</p>` + "`" + `;
        return;
      }
      const r = data.record;
      const badge = data.hit
        ? '<span class="badge hit">cache hit</span>'
        : '<span class="badge miss">cache miss</span>';
      resultView.innerHTML = ` + "`" + `
        <p>${badge} &nbsp; Redis read: <strong>${data.redis_latency_ms} ms</strong>
           &nbsp; TTL remaining: <strong>${data.ttl_remaining} s</strong></p>
        <dl>
          <dt>id</dt><dd>${escapeHtml(r.id ?? "")}</dd>
          <dt>name</dt><dd>${escapeHtml(r.name ?? "")}</dd>
          <dt>display_order</dt><dd>${escapeHtml(r.display_order ?? "")}</dd>
          <dt>featured</dt><dd>${escapeHtml(r.featured ?? "")}</dd>
          <dt>parent_id</dt><dd>${escapeHtml(r.parent_id ?? "")}</dd>
        </dl>` + "`" + `;
    }

    async function loadState() {
      const [state, stats] = await Promise.all([
        fetch("/categories").then((r) => r.json()),
        fetch("/stats").then((r) => r.json()),
      ]);
      renderState(state);
      renderStats(stats);
    }

    async function refreshAfter(message, kind, payload) {
      if (payload && payload.stats) renderStats(payload.stats);
      await loadState();
      setStatus(message, kind);
    }

    document.getElementById("refresh-state").addEventListener("click", loadState);

    document.getElementById("read-button").addEventListener("click", async () => {
      const id = readIdSelect.value;
      if (!id) { setStatus("No id selected.", "error"); return; }
      const r = await fetch(` + "`" + `/read?id=${encodeURIComponent(id)}` + "`" + `);
      const d = await r.json();
      renderRead(d);
      if (d.stats) renderStats(d.stats);
      setStatus(d.hit ? "Served from Redis." : "Cache miss — no entry in Redis.", d.hit ? "ok" : "error");
    });

    document.getElementById("update-button").addEventListener("click", async () => {
      const id = updateIdSelect.value;
      const body = new URLSearchParams({ id, field: updateField.value, value: updateValue.value });
      const r = await fetch("/update", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Update failed.", "error"); return; }
      refreshAfter("Primary updated; sync worker will apply the change to Redis.", "ok", d);
    });

    document.getElementById("add-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        id: addId.value,
        name: addName.value,
        display_order: addDisplayOrder.value,
        featured: "false",
        parent_id: "",
      });
      const r = await fetch("/add", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
      refreshAfter("Added to primary; sync worker will populate the cache.", "ok", d);
    });

    document.getElementById("delete-button").addEventListener("click", async () => {
      const id = deleteIdSelect.value;
      const body = new URLSearchParams({ id });
      const r = await fetch("/delete", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Delete failed.", "error"); return; }
      refreshAfter("Deleted from primary; sync worker will remove the cache entry.", "ok", d);
    });

    document.getElementById("invalidate-button").addEventListener("click", async () => {
      const id = invalidateIdSelect.value;
      if (!id) { setStatus("Nothing in the cache to invalidate.", "error"); return; }
      const body = new URLSearchParams({ id });
      const r = await fetch("/invalidate", { method: "POST", body });
      const d = await r.json();
      refreshAfter(d.deleted ? ` + "`" + `Cache entry for ${id} deleted.` + "`" + ` : "No cache entry to delete.", "ok", d);
    });

    document.getElementById("clear-button").addEventListener("click", async () => {
      const r = await fetch("/clear", { method: "POST" });
      const d = await r.json();
      refreshAfter(` + "`" + `Cleared ${d.deleted} cache entries. Reads will miss until you re-prefetch.` + "`" + `, "ok", d);
    });

    document.getElementById("reprefetch-button").addEventListener("click", async () => {
      setStatus("Re-prefetching all records...", "ok");
      const r = await fetch("/reprefetch", { method: "POST" });
      const d = await r.json();
      refreshAfter(` + "`" + `Re-prefetched ${d.loaded} records in ${d.elapsed_ms} ms.` + "`" + `, "ok", d);
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      renderStats(d);
      setStatus("Counters reset.", "ok");
    });

    loadState();
  </script>
</body>
</html>
`
