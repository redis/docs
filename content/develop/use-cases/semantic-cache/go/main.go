// Redis semantic-cache demo server (Go).
//
// Run this file and visit http://localhost:8088 to drive a small
// semantic-cache demo backed by Redis Search. The UI lets you:
//
//   - Type a natural-language prompt and watch the cache decide hit
//     or miss. On a hit Redis returns the cached response in tens of
//     milliseconds and the demo LLM is not called at all; on a miss
//     the demo LLM "thinks" for ~1.5 s before answering and the new
//     prompt, response, and embedding are written back to Redis for
//     next time.
//   - Adjust the cosine-distance threshold to see how close a
//     paraphrase must be for the cache to serve it.
//   - Switch tenant, locale, or model version to see metadata
//     isolation in action — entries written under one tenant cannot
//     be served to another, because the TAG filter goes into the
//     same FT.SEARCH call as the KNN.
//   - Inspect every cached entry with TTL and hit count, and drop
//     individual entries to simulate eviction.
//
// The server holds a single `LocalEmbedder`, a single
// `RedisSemanticCache`, and a single `MockLLM` for the lifetime of
// the process. The first run downloads the embedding model into the
// local `./models` directory; everything after is local.

package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime/debug"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

// SemanticCacheDemo owns the cache, embedder, and LLM for the
// lifetime of the process. The handlers thread requests through
// `RunQuery` and the seed / reset endpoints reuse `Seed` so there's
// only one description of the cache lifecycle.
type SemanticCacheDemo struct {
	Cache         *RedisSemanticCache
	Embedder      *LocalEmbedder
	LLM           *MockLLM
	DefaultTenant string
	DefaultLocale string
}

// Seed clears every entry in scope and re-populates the FAQ list.
func (d *SemanticCacheDemo) Seed(ctx context.Context) (int, error) {
	if _, err := d.Cache.Clear(ctx); err != nil {
		return 0, err
	}
	return Seed(ctx, d.Cache, d.Embedder, SeedOptions{
		Tenant:       d.DefaultTenant,
		Locale:       d.DefaultLocale,
		ModelVersion: d.LLM.ModelVersion,
	})
}

// QueryParams collects what the /query endpoint accepts. `LookupOnly`
// is the toggle the UI uses to sweep the threshold against a fixed
// prompt without polluting the cache.
type QueryParams struct {
	Prompt       string
	Tenant       string
	Locale       string
	ModelVersion string
	Threshold    float64
	LookupOnly   bool
}

// RunQuery is the hot path: embed, look up, optionally call the LLM,
// cache.
//
// Timings are taken with `time.Now()` around each bounded step so
// the UI can display the embed / lookup / LLM breakdown separately.
// The cache write on a miss is *not* included in `total_ms` so the
// latency number reflects the user-facing wait, not the background
// bookkeeping.
func (d *SemanticCacheDemo) RunQuery(ctx context.Context, p QueryParams) (map[string]any, error) {
	threshold := p.Threshold

	t0 := time.Now()
	queryVec, err := d.Embedder.EncodeOne(ctx, p.Prompt)
	if err != nil {
		return nil, fmt.Errorf("embed: %w", err)
	}
	embedMs := msSince(t0)

	t1 := time.Now()
	result, err := d.Cache.Lookup(ctx, queryVec, LookupParams{
		Tenant:            p.Tenant,
		Locale:            p.Locale,
		ModelVersion:      p.ModelVersion,
		DistanceThreshold: &threshold,
	})
	if err != nil {
		return nil, fmt.Errorf("lookup: %w", err)
	}
	lookupMs := msSince(t1)

	if result.Hit != nil {
		hit := result.Hit
		return map[string]any{
			"outcome":        "hit",
			"response":       hit.Response,
			"entry_id":       hit.ID,
			"distance":       hit.Distance,
			"ttl_seconds":    hit.TTLSeconds,
			"hit_count":      hit.HitCount,
			"threshold":      threshold,
			"embed_ms":       embedMs,
			"lookup_ms":      lookupMs,
			"llm_ms":         nil,
			"total_ms":       embedMs + lookupMs,
			"tokens_avoided": estimateResponseTokens(hit.Prompt, hit.Response),
			"ms_avoided":     d.LLM.LatencyMs,
		}, nil
	}

	miss := result.Miss

	// Miss path. In "lookup only" mode the demo reports the miss
	// without actually calling the LLM — useful for sweeping the
	// threshold against a fixed prompt to see where the cutoff
	// would fall without polluting the cache.
	if p.LookupOnly {
		return map[string]any{
			"outcome":          "miss",
			"response":         "(LLM not called in lookup-only mode)",
			"nearest_distance": miss.NearestDistance,
			"threshold":        threshold,
			"wrote_entry_id":   nil,
			"embed_ms":         embedMs,
			"lookup_ms":        lookupMs,
			"llm_ms":           nil,
			"total_ms":         embedMs + lookupMs,
		}, nil
	}

	t2 := time.Now()
	llmResp := d.LLM.Complete(p.Prompt)
	llmMs := msSince(t2)

	// Write the new entry back. The embedding is the same vector we
	// already used for the lookup — no need to re-encode.
	entryID, err := d.Cache.Put(ctx, PutParams{
		Prompt:       p.Prompt,
		Response:     llmResp.Response,
		Embedding:    queryVec,
		Tenant:       p.Tenant,
		Locale:       p.Locale,
		ModelVersion: p.ModelVersion,
	})
	if err != nil {
		return nil, fmt.Errorf("put: %w", err)
	}

	return map[string]any{
		"outcome":          "miss",
		"response":         llmResp.Response,
		"nearest_distance": miss.NearestDistance,
		"threshold":        threshold,
		"wrote_entry_id":   entryID,
		"embed_ms":         embedMs,
		"lookup_ms":        lookupMs,
		"llm_ms":           llmMs,
		"total_ms":         embedMs + lookupMs + llmMs,
	}, nil
}

func msSince(t time.Time) float64 {
	return float64(time.Since(t)) / float64(time.Millisecond)
}

func estimateResponseTokens(prompt, response string) int {
	n := (len(prompt) + len(response)) / 4
	if n < 1 {
		return 1
	}
	return n
}

// ---- HTTP plumbing --------------------------------------------------

func sendJSON(w http.ResponseWriter, payload any, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("[demo] encode: %v", err)
	}
}

func sendHTML(w http.ResponseWriter, html string, status int) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(status)
	_, _ = io.WriteString(w, html)
}

// clampThreshold sanitises the threshold parameter from the form
// body. `strconv.ParseFloat` happily handles "nan" → NaN and "inf"
// → +Inf. Either would silently turn the lookup into a permanent
// hit (NaN comparisons are always false, so `distance > NaN` cannot
// reject) or a permanent miss. Clamp to the meaningful
// cosine-distance range so a malformed POST can't override the
// threshold semantics.
func clampThreshold(raw string) float64 {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return 0.5
	}
	if parsed < 0 {
		return 0
	}
	if parsed > 2 {
		return 2
	}
	return parsed
}

// State is the response shape of /state. It is intentionally the
// same shape the Python and Node demos serve so the shared HTML
// works without modification.
type State struct {
	Index struct {
		NumDocs            int     `json:"num_docs"`
		IndexName          string  `json:"index_name"`
		IndexingFailures   int     `json:"indexing_failures"`
		VectorIndexSizeMB  float64 `json:"vector_index_size_mb"`
		Model              string  `json:"model"`
		MockLLMLatencyMs   float64 `json:"mock_llm_latency_ms"`
		// DefaultThreshold is what the --threshold flag actually
		// configures; the UI slider initialises to this on first
		// load so the flag visibly changes the demo's behaviour.
		// StackLabel lets the same HTML render a per-language badge
		// (redis-py, node-redis, go-redis, …) without forking the
		// file per language.
		DefaultThreshold   float64 `json:"default_threshold"`
		StackLabel         string  `json:"stack_label"`
	} `json:"index"`
	Entries []Entry `json:"entries"`
}

func buildState(ctx context.Context, cache *RedisSemanticCache, embedder *LocalEmbedder, llm *MockLLM, stackLabel string) (State, error) {
	info := cache.FTInfo(ctx)
	entries, err := cache.ListEntries(ctx, 200)
	if err != nil {
		return State{}, err
	}
	var s State
	s.Index.NumDocs = info.NumDocs
	s.Index.IndexName = cache.IndexName
	s.Index.IndexingFailures = info.IndexingFailures
	s.Index.VectorIndexSizeMB = info.VectorIndexSizeMB
	s.Index.Model = embedder.ModelName
	s.Index.MockLLMLatencyMs = llm.LatencyMs
	s.Index.DefaultThreshold = cache.DistanceThreshold
	s.Index.StackLabel = stackLabel
	s.Entries = entries
	return s, nil
}

type serverDeps struct {
	cache      *RedisSemanticCache
	embedder   *LocalEmbedder
	llm        *MockLLM
	demo       *SemanticCacheDemo
	htmlPage   string
	stackLabel string
}

// Cap POST bodies so a runaway client (or, more realistically, a
// `curl --data-binary @big-file` by mistake) can't accumulate
// unbounded memory before the handler runs. The demo's largest
// legitimate body is a few hundred bytes of form-encoded query
// fields; 1 MiB is a generous ceiling and matches the Node demo's
// readBody cap. Go's `ParseForm` defaults to 10 MiB on top of this
// — we tighten the cap by wrapping the request body in
// `http.MaxBytesReader` at the start of each POST handler.
const maxBodyBytes = 1 * 1024 * 1024

// jsonRecover turns any panic in a handler into a JSON 500 instead
// of letting the default net/http handler render a plain-text stack
// trace. Without this wrapper the client's `await res.json()`
// explodes with an opaque parse error instead of surfacing what
// actually went wrong.
func jsonRecover(w http.ResponseWriter, r *http.Request) {
	if rec := recover(); rec != nil {
		log.Printf("[demo] panic: %v\n%s", rec, debug.Stack())
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"error": fmt.Sprintf("%v", rec),
			"type":  "panic",
		})
	}
}

func makeHandler(deps *serverDeps) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w, r)
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			sendJSON(w, map[string]any{"error": "not found"}, http.StatusNotFound)
			return
		}
		if r.Method != http.MethodGet {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		sendHTML(w, deps.htmlPage, http.StatusOK)
	})

	mux.HandleFunc("/state", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w, r)
		if r.Method != http.MethodGet {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		s, err := buildState(r.Context(), deps.cache, deps.embedder, deps.llm, deps.stackLabel)
		if err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, s, http.StatusOK)
	})

	mux.HandleFunc("/query", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w, r)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		if err := r.ParseForm(); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		prompt := strings.TrimSpace(r.PostForm.Get("prompt"))
		if prompt == "" {
			sendJSON(w, map[string]any{"error": "prompt is required"}, http.StatusBadRequest)
			return
		}
		tenant := orDefault(r.PostForm.Get("tenant"), "acme")
		locale := orDefault(r.PostForm.Get("locale"), "en")
		modelVersion := orDefault(r.PostForm.Get("model_version"), deps.llm.ModelVersion)
		threshold := clampThreshold(r.PostForm.Get("threshold"))
		lookupOnly := r.PostForm.Get("lookup_only") != ""

		payload, err := deps.demo.RunQuery(r.Context(), QueryParams{
			Prompt:       prompt,
			Tenant:       tenant,
			Locale:       locale,
			ModelVersion: modelVersion,
			Threshold:    threshold,
			LookupOnly:   lookupOnly,
		})
		if err != nil {
			log.Printf("[demo] query: %v", err)
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, payload, http.StatusOK)
	})

	mux.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w, r)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		if _, err := deps.demo.Seed(r.Context()); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, map[string]any{"ok": true}, http.StatusOK)
	})

	mux.HandleFunc("/drop", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w, r)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		if err := r.ParseForm(); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		entryID := strings.TrimSpace(r.PostForm.Get("entry_id"))
		if entryID == "" {
			sendJSON(w, map[string]any{"error": "entry_id is required"}, http.StatusBadRequest)
			return
		}
		deleted, err := deps.cache.DeleteEntry(r.Context(), entryID)
		if err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, map[string]any{"deleted": deleted, "entry_id": entryID}, http.StatusOK)
	})

	return mux
}

func orDefault(s, dflt string) string {
	if s == "" {
		return dflt
	}
	return s
}

// ---- Main -----------------------------------------------------------

type flags struct {
	host         string
	port         int
	redisHost    string
	redisPort    int
	indexName    string
	keyPrefix    string
	ttlSeconds   int
	threshold    float64
	llmLatencyMs float64
	noReset      bool
}

func parseFlags() flags {
	var f flags
	flag.StringVar(&f.host, "host", "127.0.0.1", "interface to bind to")
	flag.IntVar(&f.port, "port", 8088, "HTTP port for the demo UI")
	flag.StringVar(&f.redisHost, "redis-host", "localhost", "Redis host")
	flag.IntVar(&f.redisPort, "redis-port", 6379, "Redis port")
	flag.StringVar(&f.indexName, "index-name", "semcache:idx", "Redis Search index name")
	flag.StringVar(&f.keyPrefix, "key-prefix", "cache:", "key prefix for cache entries")
	flag.IntVar(&f.ttlSeconds, "ttl-seconds", 3600, "TTL applied to every cache entry")
	flag.Float64Var(&f.threshold, "threshold", 0.5, "default cosine-distance threshold for hits")
	flag.Float64Var(&f.llmLatencyMs, "llm-latency-ms", 1500, "simulated latency of the mock LLM in milliseconds")
	flag.BoolVar(&f.noReset, "no-reset", false, "skip the cache reset + seed on startup")
	flag.Parse()
	return f
}

func main() {
	f := parseFlags()

	ctx := context.Background()
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", f.redisHost, f.redisPort),
		Protocol: 2,
	})
	if err := client.Ping(ctx).Err(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: cannot reach Redis at %s:%d\n  (%v)\n",
			f.redisHost, f.redisPort, err)
		os.Exit(1)
	}

	cache := NewRedisSemanticCache(
		client,
		f.indexName,
		f.keyPrefix,
		vectorDimDefault,
		f.threshold,
		f.ttlSeconds,
	)
	if err := cache.CreateIndex(ctx); err != nil {
		log.Fatalf("creating index: %v", err)
	}

	fmt.Println("Loading embedding model (first run downloads the ONNX weights)...")
	embedder, err := NewLocalEmbedder(ctx, "", "")
	if err != nil {
		log.Fatalf("loading embedder: %v", err)
	}
	defer embedder.Close()

	llm := NewMockLLM("", f.llmLatencyMs)

	demo := &SemanticCacheDemo{
		Cache:         cache,
		Embedder:      embedder,
		LLM:           llm,
		DefaultTenant: "acme",
		DefaultLocale: "en",
	}
	if !f.noReset {
		fmt.Printf("Dropping any existing cache under '%s*' and "+
			"re-seeding from the FAQ list (pass --no-reset to keep).\n",
			f.keyPrefix)
		seeded, err := demo.Seed(ctx)
		if err != nil {
			log.Fatalf("seeding cache: %v", err)
		}
		fmt.Printf("Seeded %d entries.\n", seeded)
	}

	// Load the HTML once and replace the template tokens with the
	// configured index name and key prefix so the docs panel shows
	// the actual values in use rather than the default copies.
	here, err := executableDir()
	if err != nil {
		log.Fatalf("locating executable dir: %v", err)
	}
	rawHTML, err := os.ReadFile(filepath.Join(here, "index.html"))
	if err != nil {
		log.Fatalf("reading index.html: %v", err)
	}
	htmlPage := strings.ReplaceAll(string(rawHTML), "__INDEX_NAME__", f.indexName)
	htmlPage = strings.ReplaceAll(htmlPage, "__KEY_PREFIX__", f.keyPrefix)

	deps := &serverDeps{
		cache:      cache,
		embedder:   embedder,
		llm:        llm,
		demo:       demo,
		htmlPage:   htmlPage,
		stackLabel: "go-redis + Hugot + Go standard library HTTP server",
	}

	addr := fmt.Sprintf("%s:%d", f.host, f.port)
	server := &http.Server{
		Addr:              addr,
		Handler:           makeHandler(deps),
		ReadHeaderTimeout: 10 * time.Second,
		// ReadTimeout bounds the whole request (headers + body), not
		// just the headers — without it a slow-drip POST body can
		// hold a handler goroutine open indefinitely while
		// `ParseForm` waits for more bytes. 30 s is comfortable for
		// any realistic prompt and gives slow networks plenty of
		// margin without leaving the server exposed.
		ReadTimeout: 30 * time.Second,
	}

	go func() {
		fmt.Printf("Redis semantic cache demo listening on http://%s\n", addr)
		fmt.Printf("Using Redis at %s:%d with index '%s'\n",
			f.redisHost, f.redisPort, f.indexName)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	sig := <-stop
	fmt.Printf("\nReceived %s, shutting down...\n", sig)
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownCtx)
	_ = client.Close()
}

// executableDir returns the directory where the running binary
// lives. `go run .` puts that in a temp directory, so we fall back
// to the working directory in that case — `index.html` is expected
// to sit next to the source file the user is iterating on.
func executableDir() (string, error) {
	exe, err := os.Executable()
	if err == nil {
		dir := filepath.Dir(exe)
		if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
			return dir, nil
		}
	}
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	return wd, nil
}
