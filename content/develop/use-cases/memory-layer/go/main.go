// Redis agent-memory demo server (Go).
//
// Run this file and visit http://localhost:8090 to drive a small
// agent-memory demo backed by Redis Hashes, JSON, Search, and
// Streams. The UI lets you type a turn, watch working memory update,
// see semantically similar long-term memories recalled, watch the
// write-time deduplication skip near-duplicates, and inspect the
// per-thread event log.
//
// The server holds a single `LocalEmbedder`, one `AgentSession`, one
// `LongTermMemory`, and one `AgentEventLog` for the lifetime of the
// process. The first run downloads the embedding model into the
// local `./models` directory; everything after is local.

package main

import (
	"context"
	"encoding/json"
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
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

// stackLabel is the badge the same HTML uses to identify which
// language demo the user is looking at.
const stackLabel = "go-redis + Hugot + net/http"

// maxBodyBytes caps POST bodies so a runaway client (or a `curl
// --data-binary @big-file` by mistake) can't accumulate unbounded
// memory before the handler runs. The demo's largest legitimate body
// is a few hundred bytes of form-encoded query fields.
const maxBodyBytes = 1 * 1024 * 1024

// AgentMemoryDemo owns the three Redis-backed helpers and the
// embedder for the lifetime of the process.
//
// `SeedAll` / `NewThread` / `HandleTurn` all touch `currentThreadID`
// — `currentThreadID` is wrapped in a `sync.Mutex`, but the lock is
// released after each rotation or read, so a turn racing with
// `/new_thread` or `/reset` can capture the old id and apply to the
// previous thread. The demo is single-user in practice, so the race
// never triggers; a multi-user agent would carry the thread id on
// each request instead of holding it as shared server state. See the
// walkthrough's "Concurrency caveats" section.
type AgentMemoryDemo struct {
	Session          *AgentSession
	Memory           *LongTermMemory
	Events           *AgentEventLog
	Embedder         *LocalEmbedder
	DefaultUser      string
	DefaultNamespace string

	mu              sync.Mutex
	currentThreadID string
}

// NewAgentMemoryDemo wires the helpers together and seeds an initial
// thread id.
func NewAgentMemoryDemo(
	session *AgentSession,
	memory *LongTermMemory,
	events *AgentEventLog,
	embedder *LocalEmbedder,
) *AgentMemoryDemo {
	return &AgentMemoryDemo{
		Session:          session,
		Memory:           memory,
		Events:           events,
		Embedder:         embedder,
		DefaultUser:      "default",
		DefaultNamespace: "default",
		currentThreadID:  session.NewThreadID(),
	}
}

// CurrentThreadID returns the demo's active thread id.
func (d *AgentMemoryDemo) CurrentThreadID() string {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.currentThreadID
}

// SeedAll drops every long-term memory, every working-memory hash
// for the active thread, and the active event stream, then re-seeds
// the canonical memories and starts a fresh thread.
func (d *AgentMemoryDemo) SeedAll(ctx context.Context, user, namespace string) (int, error) {
	if _, err := d.Memory.Clear(ctx); err != nil {
		return 0, err
	}
	threadID := d.CurrentThreadID()
	if _, err := d.Session.Delete(ctx, threadID); err != nil {
		return 0, err
	}
	if _, err := d.Events.Clear(ctx, threadID); err != nil {
		return 0, err
	}
	written, err := Seed(ctx, d.Memory, d.Embedder, user, namespace, "seed")
	if err != nil {
		return written, err
	}
	d.mu.Lock()
	d.currentThreadID = d.Session.NewThreadID()
	d.mu.Unlock()
	return written, nil
}

// NewThread starts a fresh thread. Long-term memory is unaffected.
func (d *AgentMemoryDemo) NewThread(ctx context.Context, user, namespace string) (string, error) {
	oldID := d.CurrentThreadID()
	if _, err := d.Events.Clear(ctx, oldID); err != nil {
		return "", err
	}
	newID := d.Session.NewThreadID()
	if _, err := d.Session.Start(ctx, newID, StartParams{
		User:  user,
		Agent: "demo-agent",
		Goal:  "",
	}); err != nil {
		return "", err
	}
	if _, err := d.Events.Record(ctx, newID, "thread_started",
		fmt.Sprintf("user=%s namespace=%s", user, namespace)); err != nil {
		return "", err
	}
	d.mu.Lock()
	d.currentThreadID = newID
	d.mu.Unlock()
	return newID, nil
}

// TurnParams collects what /turn accepts.
type TurnParams struct {
	Text      string
	User      string
	Namespace string
	Kind      string // "episodic", "semantic", or "skip"
	Role      string
	Threshold float64
	Action    string // "turn" or "goal"
}

// HandleTurn runs one pass through the agent loop: append, recall,
// remember, log.
//
// The order matters. We embed once and reuse the vector for both the
// recall and (if asked) the remember step — no point encoding the
// same text twice. Recall runs *before* the remember write so the
// agent doesn't see its own just-written turn as a recalled memory.
func (d *AgentMemoryDemo) HandleTurn(ctx context.Context, p TurnParams) (map[string]any, error) {
	threadID := d.CurrentThreadID()

	t0 := time.Now()
	vec, err := d.Embedder.EncodeOne(ctx, p.Text)
	if err != nil {
		return nil, fmt.Errorf("embed: %w", err)
	}
	embedMs := msSince(t0)

	// `SetGoal` only touches the goal field so existing turns aren't
	// wiped; `AppendTurn` carries the request `user` through to the
	// auto-create path so a first turn for a new thread doesn't land
	// under the default user.
	var sessionAction string
	if p.Action == "goal" {
		if _, err := d.Session.SetGoal(ctx, threadID, p.Text, StartParams{
			User:  p.User,
			Agent: "demo-agent",
		}); err != nil {
			return nil, fmt.Errorf("set goal: %w", err)
		}
		sessionAction = "goal_set"
	} else {
		if _, err := d.Session.AppendTurn(ctx, threadID, AppendTurnParams{
			Role:    p.Role,
			Content: p.Text,
			User:    p.User,
			Agent:   "demo-agent",
		}); err != nil {
			return nil, fmt.Errorf("append turn: %w", err)
		}
		sessionAction = "turn_appended:" + p.Role
	}

	t1 := time.Now()
	threshold := p.Threshold
	recalled, err := d.Memory.Recall(ctx, RecallParams{
		QueryEmbedding:    vec,
		User:              p.User,
		Namespace:         p.Namespace,
		K:                 5,
		DistanceThreshold: &threshold,
	})
	if err != nil {
		return nil, fmt.Errorf("recall: %w", err)
	}
	recallMs := msSince(t1)

	writeSkipped := p.Kind == "skip" || p.Action == "goal"
	var writeResult *WriteResult
	var writeMs float64
	if !writeSkipped {
		t2 := time.Now()
		r, err := d.Memory.Remember(ctx, RememberParams{
			Text:         p.Text,
			Embedding:    vec,
			User:         p.User,
			Namespace:    p.Namespace,
			Kind:         p.Kind,
			SourceThread: threadID,
		})
		if err != nil {
			return nil, fmt.Errorf("remember: %w", err)
		}
		writeResult = &r
		writeMs = msSince(t2)
	}

	var detail string
	if writeResult != nil {
		if writeResult.Deduped {
			detail = "deduped onto " + writeResult.ID
		} else {
			detail = "wrote " + writeResult.ID + " as " + p.Kind
		}
	}
	if _, err := d.Events.Record(ctx, threadID, sessionAction, detail); err != nil {
		return nil, fmt.Errorf("event log: %w", err)
	}

	payload := map[string]any{
		"thread_id":         threadID,
		"write_skipped":     writeSkipped,
		"memory_id":         nil,
		"deduped":           false,
		"existing_distance": nil,
		"kind":              nil,
		"recalled":          recalled,
		"embed_ms":          embedMs,
		"recall_ms":         recallMs,
		"write_ms":          writeMs,
	}
	if writeResult != nil {
		payload["memory_id"] = writeResult.ID
		payload["deduped"] = writeResult.Deduped
		payload["existing_distance"] = writeResult.ExistingDistance
	}
	if !writeSkipped {
		payload["kind"] = p.Kind
	}
	return payload, nil
}

// ---- /state shape ---------------------------------------------------

type stateIndex struct {
	NumDocs                int     `json:"num_docs"`
	IndexingFailures       int     `json:"indexing_failures"`
	IndexName              string  `json:"index_name"`
	Model                  string  `json:"model"`
	SessionTTLSeconds      int     `json:"session_ttl_seconds"`
	DedupThreshold         float64 `json:"dedup_threshold"`
	DefaultRecallThreshold float64 `json:"default_recall_threshold"`
	StackLabel             string  `json:"stack_label"`
}

type stateResponse struct {
	Index    stateIndex     `json:"index"`
	ThreadID string         `json:"thread_id"`
	Session  *SessionState  `json:"session"`
	Memories []MemoryRecord `json:"memories"`
	Events   []AgentEvent   `json:"events"`
	// `recalled` is populated by /turn; on plain /state reads the UI
	// keeps showing the last turn's result, which is the useful
	// behaviour for an "agent" panel.
	Recalled []MemoryRecord `json:"recalled"`
}

func (d *AgentMemoryDemo) buildState(ctx context.Context, user, namespace string) (stateResponse, error) {
	info := d.Memory.IndexInfo(ctx)
	threadID := d.CurrentThreadID()
	session, err := d.Session.Load(ctx, threadID)
	if err != nil {
		return stateResponse{}, err
	}
	memories, err := d.Memory.ListMemories(ctx, user, namespace, "", 200)
	if err != nil {
		return stateResponse{}, err
	}
	events, err := d.Events.Recent(ctx, threadID, 20)
	if err != nil {
		return stateResponse{}, err
	}
	return stateResponse{
		Index: stateIndex{
			NumDocs:                info.NumDocs,
			IndexingFailures:       info.IndexingFailures,
			IndexName:              d.Memory.IndexName,
			Model:                  d.Embedder.ModelName,
			SessionTTLSeconds:      d.Session.DefaultTTLSeconds,
			DedupThreshold:         d.Memory.DedupThreshold,
			DefaultRecallThreshold: d.Memory.RecallThreshold,
			StackLabel:             stackLabel,
		},
		ThreadID: threadID,
		Session:  session,
		Memories: memories,
		Events:   events,
		Recalled: []MemoryRecord{},
	}, nil
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
// body. `strconv.ParseFloat` happily handles "nan" / "inf"; either
// would silently turn recall into "every memory" or "nothing".
// Clamp to the meaningful cosine-distance range so a malformed POST
// can't override the threshold semantics.
func clampThreshold(raw string, fallback float64) float64 {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(raw), 64)
	if err != nil || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return fallback
	}
	if parsed < 0 {
		return 0
	}
	if parsed > 2 {
		return 2
	}
	return parsed
}

// jsonRecover turns any panic in a handler into a JSON 500 instead
// of the default plain-text stack trace. Without this the client's
// `await res.json()` would explode with an opaque parse error.
func jsonRecover(w http.ResponseWriter) {
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

func makeHandler(demo *AgentMemoryDemo, htmlPage string) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w)
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			sendJSON(w, map[string]any{"error": "not found"}, http.StatusNotFound)
			return
		}
		if r.Method != http.MethodGet {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		sendHTML(w, htmlPage, http.StatusOK)
	})

	mux.HandleFunc("/state", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w)
		if r.Method != http.MethodGet {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		q := r.URL.Query()
		user := orDefault(q.Get("user"), demo.DefaultUser)
		namespace := orDefault(q.Get("namespace"), demo.DefaultNamespace)
		s, err := demo.buildState(r.Context(), user, namespace)
		if err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, s, http.StatusOK)
	})

	mux.HandleFunc("/turn", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		if err := r.ParseForm(); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		text := strings.TrimSpace(r.PostForm.Get("text"))
		if text == "" {
			sendJSON(w, map[string]any{"error": "text is required"}, http.StatusBadRequest)
			return
		}
		payload, err := demo.HandleTurn(r.Context(), TurnParams{
			Text:      text,
			User:      orDefault(r.PostForm.Get("user"), "default"),
			Namespace: orDefault(r.PostForm.Get("namespace"), "default"),
			Kind:      orDefault(r.PostForm.Get("kind"), "episodic"),
			Role:      orDefault(r.PostForm.Get("role"), "user"),
			Threshold: clampThreshold(r.PostForm.Get("threshold"), demo.Memory.RecallThreshold),
			Action:    orDefault(r.PostForm.Get("action"), "turn"),
		})
		if err != nil {
			log.Printf("[demo] turn: %v", err)
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, payload, http.StatusOK)
	})

	mux.HandleFunc("/new_thread", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		if err := r.ParseForm(); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		user := orDefault(r.PostForm.Get("user"), "default")
		namespace := orDefault(r.PostForm.Get("namespace"), "default")
		tid, err := demo.NewThread(r.Context(), user, namespace)
		if err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, map[string]any{"thread_id": tid}, http.StatusOK)
	})

	mux.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		if err := r.ParseForm(); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		user := orDefault(r.PostForm.Get("user"), "default")
		namespace := orDefault(r.PostForm.Get("namespace"), "default")
		seeded, err := demo.SeedAll(r.Context(), user, namespace)
		if err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, map[string]any{"seeded": seeded}, http.StatusOK)
	})

	mux.HandleFunc("/drop_memory", func(w http.ResponseWriter, r *http.Request) {
		defer jsonRecover(w)
		if r.Method != http.MethodPost {
			sendJSON(w, map[string]any{"error": "method not allowed"}, http.StatusMethodNotAllowed)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		if err := r.ParseForm(); err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusBadRequest)
			return
		}
		memoryID := strings.TrimSpace(r.PostForm.Get("memory_id"))
		if memoryID == "" {
			sendJSON(w, map[string]any{"error": "memory_id is required"}, http.StatusBadRequest)
			return
		}
		deleted, err := demo.Memory.DeleteMemory(r.Context(), memoryID)
		if err != nil {
			sendJSON(w, map[string]any{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, map[string]any{"deleted": deleted, "memory_id": memoryID}, http.StatusOK)
	})

	return mux
}

func msSince(t time.Time) float64 {
	return float64(time.Since(t)) / float64(time.Millisecond)
}

// ---- Main -----------------------------------------------------------

type flags struct {
	host              string
	port              int
	redisHost         string
	redisPort         int
	memIndexName      string
	memKeyPrefix      string
	sessionKeyPrefix  string
	eventKeyPrefix    string
	sessionTTLSeconds int
	dedupThreshold    float64
	recallThreshold   float64
	noReset           bool
}

func parseFlags() flags {
	var f flags
	flag.StringVar(&f.host, "host", "127.0.0.1", "interface to bind to")
	flag.IntVar(&f.port, "port", 8090, "HTTP port for the demo UI")
	flag.StringVar(&f.redisHost, "redis-host", "localhost", "Redis host")
	flag.IntVar(&f.redisPort, "redis-port", 6379, "Redis port")
	flag.StringVar(&f.memIndexName, "mem-index-name", "agentmem:idx", "memory search index name")
	flag.StringVar(&f.memKeyPrefix, "mem-key-prefix", "agent:mem:", "JSON memory key prefix")
	flag.StringVar(&f.sessionKeyPrefix, "session-key-prefix", "agent:session:", "session hash key prefix")
	flag.StringVar(&f.eventKeyPrefix, "event-key-prefix", "agent:events:", "event stream key prefix")
	flag.IntVar(&f.sessionTTLSeconds, "session-ttl-seconds", 3600, "TTL applied to every session hash write")
	flag.Float64Var(&f.dedupThreshold, "dedup-threshold", DefaultDedupThreshold, "cosine-distance cutoff for write-time dedup")
	flag.Float64Var(&f.recallThreshold, "recall-threshold", DefaultRecallThreshold, "default cosine-distance cutoff for recall")
	flag.BoolVar(&f.noReset, "no-reset", false, "skip clearing and re-seeding on startup")
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

	session := NewAgentSession(client, f.sessionKeyPrefix, f.sessionTTLSeconds, DefaultMaxTurns)
	memory := NewLongTermMemory(
		client,
		f.memIndexName,
		f.memKeyPrefix,
		VectorDim,
		f.dedupThreshold,
		f.recallThreshold,
		nil,
	)
	if err := memory.CreateIndex(ctx); err != nil {
		log.Fatalf("creating index: %v", err)
	}
	events := NewAgentEventLog(client, f.eventKeyPrefix, DefaultMaxLen)

	fmt.Println("Loading embedding model (first run downloads the ONNX weights)...")
	embedder, err := NewLocalEmbedder(ctx, "", "")
	if err != nil {
		log.Fatalf("loading embedder: %v", err)
	}
	defer embedder.Close()

	demo := NewAgentMemoryDemo(session, memory, events, embedder)

	if !f.noReset {
		fmt.Printf("Dropping any existing memories under '%s*' and re-seeding from the sample memory list (pass --no-reset to keep).\n",
			f.memKeyPrefix)
		seeded, err := demo.SeedAll(ctx, "default", "default")
		if err != nil {
			log.Fatalf("seeding: %v", err)
		}
		fmt.Printf("Seeded %d memories.\n", seeded)
	}

	// Load index.html once and substitute the template tokens so the
	// docs panel shows the actual values in use.
	htmlPath, err := locateIndexHTML()
	if err != nil {
		log.Fatalf("locating index.html: %v", err)
	}
	rawHTML, err := os.ReadFile(htmlPath)
	if err != nil {
		log.Fatalf("reading %s: %v", htmlPath, err)
	}
	htmlPage := string(rawHTML)
	htmlPage = strings.ReplaceAll(htmlPage, "__SESSION_PREFIX__", f.sessionKeyPrefix)
	htmlPage = strings.ReplaceAll(htmlPage, "__MEM_PREFIX__", f.memKeyPrefix)
	htmlPage = strings.ReplaceAll(htmlPage, "__MEM_INDEX__", f.memIndexName)
	htmlPage = strings.ReplaceAll(htmlPage, "__EVENT_PREFIX__", f.eventKeyPrefix)

	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", f.host, f.port),
		Handler:      makeHandler(demo, htmlPage),
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	fmt.Printf("Redis agent memory demo listening on http://%s:%d\n", f.host, f.port)
	fmt.Printf("Using Redis at %s:%d with memory index '%s'\n",
		f.redisHost, f.redisPort, f.memIndexName)

	// Run the server in a goroutine so we can shut down cleanly on
	// SIGINT/SIGTERM.
	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.ListenAndServe()
	}()
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	select {
	case sig := <-sigCh:
		fmt.Printf("\nReceived %s, shutting down...\n", sig)
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
	case err := <-errCh:
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("server: %v", err)
		}
	}
}

// locateIndexHTML looks for `index.html` first next to the executable
// (so `go install` + run from anywhere keeps working) and then in the
// process's working directory (the `go run .` case).
func locateIndexHTML() (string, error) {
	exe, err := os.Executable()
	if err == nil {
		candidate := filepath.Join(filepath.Dir(exe), "index.html")
		if _, statErr := os.Stat(candidate); statErr == nil {
			return candidate, nil
		}
	}
	cwd, err := os.Getwd()
	if err == nil {
		candidate := filepath.Join(cwd, "index.html")
		if _, statErr := os.Stat(candidate); statErr == nil {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("index.html not found next to binary or in cwd")
}
