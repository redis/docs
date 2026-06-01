// Redis feature-store demo server (Go).
//
// Create a tiny main.go shim in cmd/demo_server (Go's package main
// cannot live in the same directory as package featurestore):
//
//	package main
//
//	import (
//		"log"
//		"os"
//
//		fs "featurestore"
//	)
//
//	func main() {
//		if err := fs.RunDemoServer(os.Args[1:]); err != nil {
//			log.Fatal(err)
//		}
//	}
//
// Build and run with:
//
//	go run ./cmd/demo_server
//
// Then visit http://localhost:8087.
//
// Use the UI to:
//
//   - Bulk-load (re-materialize) the batch features, optionally with a
//     short TTL so you can watch a whole entity expire on schedule.
//   - Pause the streaming worker and watch the streaming fields drop
//     out via HEXPIRE while the batch fields remain populated under
//     the longer key-level TTL — the *mixed staleness* story made
//     visible.
//   - Pull features for one user (HMGET) and see the value, per-field
//     TTL, and read latency.
//   - Batch-score N users in one round trip and see the per-entity /
//     per-round-trip latency split.
//   - Inspect a single user's hash in detail with field-level TTLs.
package featurestore

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// FeatureStoreDemo wires the FeatureStore and StreamingWorker
// together with reset / materialize / toggle helpers used by the
// HTTP handlers.
type FeatureStoreDemo struct {
	store  *FeatureStore
	worker *StreamingWorker
	seed   int64

	mu sync.Mutex
}

// NewFeatureStoreDemo bundles the store and worker for the HTTP
// server. seed is the PRNG seed used by the batch synthesizer.
func NewFeatureStoreDemo(store *FeatureStore, worker *StreamingWorker, seed int64) *FeatureStoreDemo {
	return &FeatureStoreDemo{store: store, worker: worker, seed: seed}
}

// Materialize bulk-loads `count` synthetic users with the supplied
// key-level TTL.
func (d *FeatureStoreDemo) Materialize(ctx context.Context, count int, ttl time.Duration) (loaded int, elapsed time.Duration, err error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	rows := SynthesizeUsers(count, d.seed)
	start := time.Now()
	loaded, err = d.store.BulkLoad(ctx, rows, ttl)
	elapsed = time.Since(start)
	return
}

// Reset drops every entity under the key prefix. Pauses the
// streaming worker around the DEL sweep so a concurrent tick can't
// recreate a user that was just enumerated for deletion (streaming
// HSET creates the key if it's missing, and that would leave behind
// a streaming-only hash with no key-level TTL). Pause() only blocks
// *future* ticks — WaitForIdle() flushes an already-running tick
// before the DEL sweep starts.
func (d *FeatureStoreDemo) Reset(ctx context.Context) (int64, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	wasPaused := d.worker.IsPaused()
	if d.worker.IsRunning() {
		if !wasPaused {
			d.worker.Pause()
		}
		d.worker.WaitForIdle()
	}
	defer func() {
		if d.worker.IsRunning() && !wasPaused {
			d.worker.Resume()
		}
	}()
	deleted, err := d.store.Reset(ctx)
	if err != nil {
		return deleted, err
	}
	d.store.ResetStats()
	d.worker.ResetStats()
	return deleted, nil
}

// ToggleWorker pauses or resumes the streaming worker. Starts the
// goroutine if it wasn't running. The worker owns its own
// background-context lifecycle, so we don't plumb the request
// context in here (it would cancel as soon as the HTTP response
// completes and the worker would die on the next tick).
func (d *FeatureStoreDemo) ToggleWorker() (paused, running bool) {
	d.mu.Lock()
	defer d.mu.Unlock()
	if !d.worker.IsRunning() {
		d.worker.Start()
	}
	if d.worker.IsPaused() {
		d.worker.Resume()
	} else {
		d.worker.Pause()
	}
	return d.worker.IsPaused(), d.worker.IsRunning()
}

// -------------------------------------------------------------------
// HTTP handlers
// -------------------------------------------------------------------

type httpServer struct {
	store  *FeatureStore
	worker *StreamingWorker
	demo   *FeatureStoreDemo
}

func (s *httpServer) handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleIndex)
	mux.HandleFunc("/state", s.handleState)
	mux.HandleFunc("/inspect", s.handleInspect)
	mux.HandleFunc("/bulk-load", s.handleBulkLoad)
	mux.HandleFunc("/reset", s.handleReset)
	mux.HandleFunc("/worker/toggle", s.handleToggleWorker)
	mux.HandleFunc("/read", s.handleRead)
	mux.HandleFunc("/batch-read", s.handleBatchRead)
	return mux
}

func (s *httpServer) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(s.htmlPage()))
}

func (s *httpServer) handleState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ctx := r.Context()
	ids, err := s.store.ListEntityIDs(ctx, 500)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	// Cap the dropdown list at 500 but report the true count
	// separately so the UI doesn't silently understate the store.
	count, err := s.store.CountEntities(ctx)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, map[string]any{
		"key_prefix":             s.store.KeyPrefix,
		"batch_ttl_seconds":      int(s.store.BatchTTL.Seconds()),
		"streaming_ttl_seconds":  int(s.store.StreamingTTL.Seconds()),
		"entity_count":           count,
		"entity_ids":             ids,
		"stats":                  s.store.Stats(),
		"worker":                 s.worker.Stats(),
	})
}

func (s *httpServer) handleInspect(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	user := strings.TrimSpace(r.URL.Query().Get("user"))
	if user == "" {
		jsonError(w, fmt.Errorf("user is required"), http.StatusBadRequest)
		return
	}
	ctx := r.Context()
	full, err := s.store.GetFeatures(ctx, user, nil)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	keyTTL, err := s.store.KeyTTLSeconds(ctx, user)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	if len(full) == 0 {
		jsonResponse(w, http.StatusOK, map[string]any{
			"exists":           false,
			"key_ttl_seconds":  keyTTL,
		})
		return
	}
	// Iterate the known schema (batch + streaming) plus any extras the
	// hash carries. Expired streaming fields surface as ttl_seconds=-2
	// in the Inspect view instead of silently disappearing, which is
	// exactly the debugging view someone hits "Inspect" for.
	seen := make(map[string]struct{}, len(DefaultBatchFields)+len(DefaultStreamingFields))
	names := make([]string, 0, len(DefaultBatchFields)+len(DefaultStreamingFields)+len(full))
	for _, n := range DefaultBatchFields {
		names = append(names, n)
		seen[n] = struct{}{}
	}
	for _, n := range DefaultStreamingFields {
		names = append(names, n)
		seen[n] = struct{}{}
	}
	for n := range full {
		if _, ok := seen[n]; !ok {
			names = append(names, n)
		}
	}
	ttls, err := s.store.FieldTTLsSeconds(ctx, user, names)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	rows := make([]map[string]any, 0, len(names))
	for _, n := range names {
		ttl, ok := ttls[n]
		if !ok {
			ttl = -2
		}
		rows = append(rows, map[string]any{
			"name":        n,
			"value":       full[n],
			"ttl_seconds": ttl,
		})
	}
	sort.Slice(rows, func(i, j int) bool {
		return rows[i]["name"].(string) < rows[j]["name"].(string)
	})
	jsonResponse(w, http.StatusOK, map[string]any{
		"exists":           true,
		"key_ttl_seconds":  keyTTL,
		"fields":           rows,
	})
}

func (s *httpServer) handleBulkLoad(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	count := clampInt(parseInt(r.FormValue("count"), 200), 1, 2000)
	ttlSeconds := clampInt(parseInt(r.FormValue("ttl"), 86400), 5, 172800)
	loaded, elapsed, err := s.demo.Materialize(r.Context(), count, time.Duration(ttlSeconds)*time.Second)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, map[string]any{
		"loaded":       loaded,
		"ttl_seconds":  ttlSeconds,
		"elapsed_ms":   float64(elapsed.Microseconds()) / 1000.0,
	})
}

func (s *httpServer) handleReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	deleted, err := s.demo.Reset(r.Context())
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, map[string]any{"deleted": deleted})
}

func (s *httpServer) handleToggleWorker(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	paused, running := s.demo.ToggleWorker()
	jsonResponse(w, http.StatusOK, map[string]any{
		"paused":  paused,
		"running": running,
	})
}

func (s *httpServer) handleRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	user := strings.TrimSpace(r.FormValue("user"))
	if user == "" {
		jsonError(w, fmt.Errorf("user is required"), http.StatusBadRequest)
		return
	}
	fields := nonEmpty(r.Form["field"])
	ctx := r.Context()
	start := time.Now()
	var values map[string]string
	if len(fields) > 0 {
		var err error
		values, err = s.store.GetFeatures(ctx, user, fields)
		if err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
	} else {
		values = map[string]string{}
	}
	elapsed := time.Since(start)
	ttls := map[string]int64{}
	if len(fields) > 0 {
		var err error
		ttls, err = s.store.FieldTTLsSeconds(ctx, user, fields)
		if err != nil {
			jsonError(w, err, http.StatusInternalServerError)
			return
		}
	}
	keyTTL, err := s.store.KeyTTLSeconds(ctx, user)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	jsonResponse(w, http.StatusOK, map[string]any{
		"requested":         fields,
		"values":            values,
		"ttls":              ttls,
		"key_ttl_seconds":   keyTTL,
		"returned_count":    len(values),
		"elapsed_ms":        float64(elapsed.Microseconds()) / 1000.0,
	})
}

func (s *httpServer) handleBatchRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		jsonError(w, err, http.StatusBadRequest)
		return
	}
	count := clampInt(parseInt(r.FormValue("count"), 100), 1, 500)
	fields := nonEmpty(r.Form["field"])
	if len(fields) == 0 {
		fields = append([]string{}, DefaultStreamingFields...)
		fields = append(fields, "risk_segment")
	}
	ctx := r.Context()
	ids, err := s.store.ListEntityIDs(ctx, int64(count*2))
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	if len(ids) > count {
		ids = ids[:count]
	}
	start := time.Now()
	rows, err := s.store.BatchGetFeatures(ctx, ids, fields)
	if err != nil {
		jsonError(w, err, http.StatusInternalServerError)
		return
	}
	elapsed := time.Since(start)
	sampleN := 10
	if sampleN > len(ids) {
		sampleN = len(ids)
	}
	sample := make([]map[string]any, sampleN)
	for i := 0; i < sampleN; i++ {
		sample[i] = map[string]any{
			"id":           ids[i],
			"field_count":  len(rows[ids[i]]),
		}
	}
	jsonResponse(w, http.StatusOK, map[string]any{
		"entity_count":  len(ids),
		"field_count":   len(fields),
		"elapsed_ms":    float64(elapsed.Microseconds()) / 1000.0,
		"sample":        sample,
	})
}

// -------------------------------------------------------------------
// HTTP plumbing
// -------------------------------------------------------------------

func jsonResponse(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func jsonError(w http.ResponseWriter, err error, status int) {
	jsonResponse(w, status, map[string]any{"error": err.Error()})
}

func parseInt(s string, def int) int {
	if s == "" {
		return def
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return def
	}
	return n
}

func clampInt(n, low, high int) int {
	if n < low {
		return low
	}
	if n > high {
		return high
	}
	return n
}

func nonEmpty(in []string) []string {
	out := make([]string, 0, len(in))
	for _, v := range in {
		if v != "" {
			out = append(out, v)
		}
	}
	return out
}

func (s *httpServer) htmlPage() string {
	batchFieldsJSON, _ := json.Marshal(DefaultBatchFields)
	streamFieldsJSON, _ := json.Marshal(DefaultStreamingFields)
	return strings.NewReplacer(
		"__KEY_PREFIX__", s.store.KeyPrefix,
		"__STREAM_TTL__", strconv.Itoa(int(s.store.StreamingTTL.Seconds())),
		"__USERS_PER_TICK__", strconv.Itoa(s.worker.usersPerTick),
		"__BATCH_FIELDS_JSON__", string(batchFieldsJSON),
		"__STREAM_FIELDS_JSON__", string(streamFieldsJSON),
	).Replace(htmlTemplate)
}

// RunDemoServer parses CLI flags, opens a Redis client, seeds the
// store, starts the streaming worker, and serves HTTP. Intended to be
// called from cmd/demo_server/main.go.
func RunDemoServer(args []string) error {
	fs := flag.NewFlagSet("demo_server", flag.ExitOnError)
	host := fs.String("host", "127.0.0.1", "HTTP bind host")
	port := fs.Int("port", 8087, "HTTP bind port")
	redisAddr := fs.String("redis-addr", "localhost:6379", "Redis host:port")
	keyPrefix := fs.String("key-prefix", "fs:user:", "Hash key prefix")
	batchTTLSeconds := fs.Int("batch-ttl-seconds", 24*60*60, "Key-level TTL on bulk-loaded users")
	streamingTTLSeconds := fs.Int("streaming-ttl-seconds", 5*60, "Per-field TTL on streaming features")
	usersPerTick := fs.Int("users-per-tick", 5, "Streaming users per tick")
	seedUsers := fs.Int("seed-users", 200, "Users to materialize on startup")
	noReset := fs.Bool("no-reset", false, "Keep any existing data under --key-prefix on startup")
	if err := fs.Parse(args); err != nil {
		return err
	}

	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: *redisAddr})
	defer rdb.Close()

	store := NewFeatureStore(rdb, *keyPrefix,
		time.Duration(*batchTTLSeconds)*time.Second,
		time.Duration(*streamingTTLSeconds)*time.Second)
	worker := NewStreamingWorker(store, time.Second, *usersPerTick, 1337)
	demo := NewFeatureStoreDemo(store, worker, 42)

	if !*noReset {
		fmt.Printf("Dropping any existing users under '%s*' for a clean demo run (pass --no-reset to keep them).\n", *keyPrefix)
		if _, err := store.Reset(ctx); err != nil {
			return fmt.Errorf("reset on start: %w", err)
		}
		store.ResetStats()
	}
	seeded, _, err := demo.Materialize(ctx, *seedUsers, store.BatchTTL)
	if err != nil {
		return fmt.Errorf("seed materialize: %w", err)
	}

	worker.Start()
	defer worker.Stop()

	srv := &httpServer{store: store, worker: worker, demo: demo}
	addr := fmt.Sprintf("%s:%d", *host, *port)
	hs := &http.Server{Addr: addr, Handler: srv.handler()}

	fmt.Printf("Redis feature-store demo server listening on http://%s\n", addr)
	fmt.Printf("Using Redis at %s with key prefix '%s' (batch TTL %ds, streaming TTL %ds)\n",
		*redisAddr, *keyPrefix, *batchTTLSeconds, *streamingTTLSeconds)
	fmt.Printf("Materialized %d user(s); streaming worker running.\n", seeded)

	if err := hs.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("listen: %w", err)
	}
	return nil
}

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Feature Store Demo (Go)</title>
  <style>
    :root {
      --bg: #eef3f1;
      --panel: #ffffff;
      --ink: #1d2730;
      --accent: #267d6b;
      --accent-dark: #1a594c;
      --muted: #5c6770;
      --line: #d4dfdb;
      --ok: #d2ecdf;
      --warn: #f8e0d0;
      --pill: #d9ebe6;
      --batch: #e6e0f0;
      --stream: #d9ebe6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #f3faf7, transparent 32rem),
        linear-gradient(180deg, #ecf2f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main { max-width: 1080px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 58rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid; gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 24px;
    }
    .panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill {
      display: inline-block; border-radius: 999px;
      background: var(--pill); color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px;
    }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small { padding: 5px 10px; font-size: 0.85rem; margin-top: 4px; }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 110px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.batch { background: var(--batch); color: #43326a; }
    .badge.stream { background: var(--stream); color: #1d4a2c; }
    .badge.expired { background: var(--warn); color: #6b3220; }
    .badge.untracked { background: #eceff1; color: #3b4951; }
    .badge.running { background: var(--ok); color: #1d4a2c; }
    .badge.paused { background: var(--warn); color: #6b3220; }
    .ttl-pos { color: #1a594c; font-weight: bold; }
    .ttl-neg { color: #6b3220; }
    .field-list { display: flex; gap: 6px 12px; flex-wrap: wrap; }
    .field-list label {
      display: inline-flex; align-items: center; gap: 4px;
      margin: 0; font-weight: normal; font-size: 0.9rem;
    }
    .field-list input { width: auto; }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">go-redis + Go standard net/http</div>
    <h1>Redis Feature Store Demo</h1>
    <p class="lede">
      A small fraud-scoring feature store. Each user is one Redis hash
      at <code>__KEY_PREFIX__{id}</code> with a batch-materialized
      <span class="badge batch">batch</span> half (daily aggregates,
      24-hour key-level <code>EXPIRE</code>) and a streaming
      <span class="badge stream">streaming</span> half (real-time
      signals, <code>__STREAM_TTL__</code>s per-field <code>HEXPIRE</code>).
      Inference reads any subset with one <code>HMGET</code>; batch
      scoring pipelines <code>HMGET</code> across N users.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Store state</h2>
        <div id="store-view">Loading...</div>
      </section>

      <section class="panel">
        <h2>Materialize batch features</h2>
        <p>Calls <code>HSET</code> + <code>EXPIRE</code> for each user
          through one go-redis <code>Pipeline</code>, so the whole
          batch ships in one round trip.</p>
        <label for="bulk-count">How many users</label>
        <input id="bulk-count" type="number" min="1" max="2000" value="200">
        <label for="bulk-ttl">Key-level TTL (seconds)</label>
        <input id="bulk-ttl" type="number" min="5" max="172800" value="86400">
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Drop the TTL to e.g. 30 s and watch entities disappear on
          schedule — the same thing that happens if a daily refresher
          fails.
        </p>
        <button id="bulk-button">Bulk-load</button>
        <button id="reset-button" class="danger">Reset (drop every user)</button>
      </section>

      <section class="panel">
        <h2>Streaming worker</h2>
        <p>Picks <code>__USERS_PER_TICK__</code> users per tick, writes the
          streaming features, applies <code>HEXPIRE</code>
          <code>__STREAM_TTL__</code>s per field. Pause it and the
          streaming fields drop out via per-field TTL while the batch
          fields stay populated.</p>
        <div id="worker-view"></div>
        <button id="worker-pause-button" class="secondary">Pause / resume</button>
      </section>

      <section class="panel wide">
        <h2>Inference read (HMGET)</h2>
        <p>Pick a user and a feature subset. One <code>HMGET</code>
          round trip returns whatever the model needs.</p>
        <div class="row">
          <div>
            <label for="read-user">User</label>
            <select id="read-user"></select>
          </div>
          <div>
            <label>&nbsp;</label>
            <button id="read-button" class="secondary">Read features</button>
          </div>
        </div>
        <h3>Feature subset</h3>
        <p class="mono" style="font-size: 0.85rem; color: var(--muted);">
          Tick to include in the <code>HMGET</code>. Per-field TTL is
          shown next to each field in the result table.
        </p>
        <div id="read-fields" class="field-list"></div>
        <div id="read-result" style="margin-top: 16px;">
          <p>Pick a user and click <strong>Read features</strong>.</p>
        </div>
      </section>

      <section class="panel">
        <h2>Batch scoring</h2>
        <p>Pipelined <code>HMGET</code> across N random users via go-redis
          <code>Pipeline.Exec</code>. One network round trip for the
          whole batch.</p>
        <label for="batch-count">How many users</label>
        <input id="batch-count" type="number" min="1" max="500" value="100">
        <button id="batch-button" class="secondary">Pipeline HMGET</button>
        <div id="batch-result" style="margin-top: 14px;">
          <p>(no batch read yet)</p>
        </div>
      </section>

      <section class="panel">
        <h2>Inspect one user</h2>
        <p><code>HGETALL</code> plus per-field <code>HTTL</code> and
          key-level <code>TTL</code>. Useful for spotting which
          streaming fields have already expired.</p>
        <label for="inspect-user">User</label>
        <select id="inspect-user"></select>
        <button id="inspect-button">Inspect</button>
        <div id="inspect-result" style="margin-top: 14px;">
          <p>(pick a user and click Inspect)</p>
        </div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const BATCH_FIELDS = __BATCH_FIELDS_JSON__;
    const STREAM_FIELDS = __STREAM_FIELDS_JSON__;

    const storeView = document.getElementById("store-view");
    const workerView = document.getElementById("worker-view");
    const readUserSelect = document.getElementById("read-user");
    const inspectUserSelect = document.getElementById("inspect-user");
    const readFieldsBox = document.getElementById("read-fields");
    const readResult = document.getElementById("read-result");
    const batchResult = document.getElementById("batch-result");
    const inspectResult = document.getElementById("inspect-result");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function classifyField(name) {
      if (BATCH_FIELDS.includes(name)) return "batch";
      if (STREAM_FIELDS.includes(name)) return "stream";
      return "other";
    }

    function ttlLabel(seconds) {
      if (seconds === -2) return '<span class="badge expired">missing</span>';
      if (seconds === -1) return '<span class="badge untracked">no TTL</span>';
      return ` + "`<span class=\"ttl-pos mono\">${seconds}s</span>`" + `;
    }

    function renderStore(state) {
      const stats = state.stats || {};
      storeView.innerHTML = ` + "`" + `
        <dl>
          <dt>Users in store</dt><dd>${state.entity_count}</dd>
          <dt>Key prefix</dt><dd class="mono">${escapeHtml(state.key_prefix)}*</dd>
          <dt>Batch TTL</dt><dd>${state.batch_ttl_seconds}s</dd>
          <dt>Streaming TTL</dt><dd>${state.streaming_ttl_seconds}s</dd>
          <dt>Batch writes</dt><dd>${stats.batch_writes_total ?? 0}</dd>
          <dt>Streaming writes</dt><dd>${stats.streaming_writes_total ?? 0}</dd>
          <dt>Reads</dt><dd>${stats.reads_total ?? 0}</dd>
          <dt>Fields returned</dt><dd>${stats.read_fields_total ?? 0}</dd>
        </dl>
      ` + "`" + `;
    }

    function renderWorker(state) {
      const w = state.worker || {};
      const badge = w.paused
        ? '<span class="badge paused">paused</span>'
        : w.running
          ? '<span class="badge running">running</span>'
          : '<span class="badge expired">stopped</span>';
      workerView.innerHTML = ` + "`" + `
        <p>${badge} <span class="mono">ticks=${w.tick_count ?? 0}
          writes=${w.writes_count ?? 0}</span></p>
      ` + "`" + `;
    }

    function populateUserSelects(ids) {
      for (const sel of [readUserSelect, inspectUserSelect]) {
        const previous = sel.value;
        sel.innerHTML = ids.map((id) =>
          ` + "`<option value=\"${escapeHtml(id)}\">${escapeHtml(id)}</option>`" + `
        ).join("");
        if (ids.includes(previous)) sel.value = previous;
      }
    }

    function renderFieldPicker() {
      const allFields = [...BATCH_FIELDS, ...STREAM_FIELDS];
      readFieldsBox.innerHTML = allFields.map((f) => {
        const kind = classifyField(f);
        const checked = ["risk_segment", "tx_count_7d", "avg_amount_30d",
                         "tx_count_5m", "failed_logins_15m"].includes(f)
                         ? "checked" : "";
        return ` + "`<label>" + `
          <input type="checkbox" name="field" value="${escapeHtml(f)}" ${checked}>
          <span class="badge ${kind}">${kind}</span>
          <span class="mono">${escapeHtml(f)}</span>
        </label>` + "`" + `;
      }).join("");
    }

    function selectedReadFields() {
      return Array.from(
        readFieldsBox.querySelectorAll('input[name="field"]:checked')
      ).map((el) => el.value);
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStore(state);
      renderWorker(state);
      populateUserSelects(state.entity_ids || []);
    }

    document.getElementById("bulk-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("bulk-count").value, 10) || 1;
      const ttl = parseInt(document.getElementById("bulk-ttl").value, 10) || 86400;
      const body = new URLSearchParams({ count, ttl });
      const r = await fetch("/bulk-load", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Bulk-load failed.", "error"); return; }
      setStatus(
        ` + "`Materialized ${d.loaded} user(s) with a ${d.ttl_seconds}s key-level TTL in ${d.elapsed_ms.toFixed(1)} ms.`" + `,
        "ok",
      );
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop every user from the store?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Reset failed.", "error"); return; }
      setStatus(` + "`Reset. Dropped ${d.deleted} user(s).`" + `, "ok");
      await refresh();
    });

    document.getElementById("worker-pause-button").addEventListener("click", async () => {
      const r = await fetch("/worker/toggle", { method: "POST" });
      const d = await r.json();
      setStatus(d.paused ? "Streaming worker paused." : "Streaming worker resumed.", "ok");
      await refresh();
    });

    document.getElementById("read-button").addEventListener("click", async () => {
      const user = readUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const fields = selectedReadFields();
      const body = new URLSearchParams();
      body.set("user", user);
      for (const f of fields) body.append("field", f);
      const r = await fetch("/read", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Read failed.", "error"); return; }
      const rows = (d.requested || []).map((name) => {
        const value = d.values[name];
        const ttl = d.ttls[name];
        const kind = classifyField(name);
        return ` + "`<tr>" + `
          <td><span class="badge ${kind}">${kind}</span> <span class="mono">${escapeHtml(name)}</span></td>
          <td class="mono">${value === undefined || value === null
            ? '<span class="badge expired">missing</span>'
            : escapeHtml(value)}</td>
          <td>${ttlLabel(ttl)}</td>
        </tr>` + "`" + `;
      }).join("");
      readResult.innerHTML = ` + "`" + `
        <p><strong>HMGET</strong> ${escapeHtml(user)} (${d.requested.length} field(s))
          returned ${d.returned_count} value(s) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>.
          Key-level TTL: ${ttlLabel(d.key_ttl_seconds)}.</p>
        ${d.requested.length === 0 ? "" :
          ` + "`<table>" + `
            <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>` + "`" + `}
      ` + "`" + `;
    });

    document.getElementById("batch-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("batch-count").value, 10) || 1;
      const fields = selectedReadFields();
      const body = new URLSearchParams();
      body.set("count", count);
      for (const f of fields) body.append("field", f);
      const r = await fetch("/batch-read", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Batch read failed.", "error"); return; }
      const perEntity = d.entity_count === 0 ? 0 : d.elapsed_ms / d.entity_count;
      const rows = (d.sample || []).map((row) => ` + "`" + `
        <tr>
          <td class="mono">${escapeHtml(row.id)}</td>
          <td>${row.field_count}</td>
        </tr>` + "`" + `).join("");
      batchResult.innerHTML = ` + "`" + `
        <p>Pipelined <code>HMGET</code> across <strong>${d.entity_count}</strong> users
          (${d.field_count} field(s) each) in
          <strong>${d.elapsed_ms.toFixed(2)} ms</strong>
          (~${perEntity.toFixed(3)} ms / user, one network round trip total).</p>
        ${(d.sample || []).length === 0 ? "" :
          ` + "`<h3>Sample</h3>" + `
           <table>
             <thead><tr><th>user</th><th>fields returned</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>` + "`" + `}
      ` + "`" + `;
    });

    document.getElementById("inspect-button").addEventListener("click", async () => {
      const user = inspectUserSelect.value;
      if (!user) { setStatus("Pick a user first.", "error"); return; }
      const params = new URLSearchParams({ user });
      const r = await fetch(` + "`/inspect?${params.toString()}`" + `);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Inspect failed.", "error"); return; }
      const rows = (d.fields || []).map((f) => ` + "`" + `
        <tr>
          <td><span class="badge ${classifyField(f.name)}">${classifyField(f.name)}</span>
              <span class="mono">${escapeHtml(f.name)}</span></td>
          <td class="mono">${escapeHtml(f.value)}</td>
          <td>${ttlLabel(f.ttl_seconds)}</td>
        </tr>` + "`" + `).join("");
      inspectResult.innerHTML = d.exists === false
        ? ` + "`<p><span class=\"badge expired\">missing</span> <code>${escapeHtml(user)}</code> isn't in the store. Either it was never materialized or its key-level TTL expired.</p>`" + `
        : ` + "`<p>Key-level TTL: ${ttlLabel(d.key_ttl_seconds)} &nbsp; (${d.fields.length} field(s))</p>" + `
           <table>
             <thead><tr><th>field</th><th>value</th><th>per-field TTL</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>` + "`" + `;
    });

    renderFieldPicker();
    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
`
