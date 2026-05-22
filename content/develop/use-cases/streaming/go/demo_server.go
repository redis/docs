// Redis streaming demo server.
//
// Create a main.go shim in a subdirectory (Go's package main cannot
// live in the same directory as package streaming):
//
//	mkdir -p cmd/demo
//	cat > cmd/demo/main.go <<'EOF'
//	package main
//
//	import "streaming"
//
//	func main() { streaming.RunDemoServer() }
//	EOF
//
// Then build and run:
//
//	go mod tidy
//	go run ./cmd/demo --port 8083
//
// Visit http://localhost:8083 to watch a Redis Stream in action:
// producers append events to a single stream, two independent consumer
// groups read the same stream at their own pace, and within the
// "notifications" group two consumers share the work. Crash a consumer
// to drop deliveries mid-process, run XAUTOCLAIM to reassign the stuck
// entries, replay any ID range with XRANGE, and trim retention with
// XTRIM.
package streaming

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

// EventTypes are the four order-event types the demo produces.
var EventTypes = []string{
	"order.placed",
	"order.paid",
	"order.shipped",
	"order.cancelled",
}

// DefaultGroups is the seed topology — group → consumer names.
var DefaultGroups = []groupSeed{
	{Name: "notifications", Consumers: []string{"worker-a", "worker-b"}},
	{Name: "analytics", Consumers: []string{"worker-c"}},
}

type groupSeed struct {
	Name      string
	Consumers []string
}

// StreamingDemo is the in-memory registry of consumer workers.
//
// http.ServeMux dispatches every HTTP request on a fresh goroutine, so
// any code that mutates workers (or iterates while another handler is
// mutating it) needs the lock.
type StreamingDemo struct {
	stream  *EventStream
	mu      sync.Mutex
	workers map[workerKey]*ConsumerWorker
}

type workerKey struct {
	Group string
	Name  string
}

// NewStreamingDemo constructs an empty demo around the given stream.
func NewStreamingDemo(stream *EventStream) *StreamingDemo {
	return &StreamingDemo{
		stream:  stream,
		workers: make(map[workerKey]*ConsumerWorker),
	}
}

// Seed creates the default groups and consumer workers. Returns the
// total number of workers seeded.
func (d *StreamingDemo) Seed(ctx context.Context, groups []groupSeed) (int, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	total := 0
	for _, g := range groups {
		if err := d.stream.EnsureGroup(ctx, g.Name, "0-0"); err != nil {
			return total, err
		}
		for _, name := range g.Consumers {
			key := workerKey{Group: g.Name, Name: name}
			if _, ok := d.workers[key]; ok {
				continue
			}
			worker := NewConsumerWorker(d.stream, g.Name, name)
			worker.Start()
			d.workers[key] = worker
			total++
		}
	}
	return total, nil
}

// AddWorker adds one consumer to a group. Returns false if a consumer
// with that group+name pair already exists.
func (d *StreamingDemo) AddWorker(ctx context.Context, group, name string) (bool, error) {
	d.mu.Lock()
	defer d.mu.Unlock()
	key := workerKey{Group: group, Name: name}
	if _, ok := d.workers[key]; ok {
		return false, nil
	}
	if err := d.stream.EnsureGroup(ctx, group, "0-0"); err != nil {
		return false, err
	}
	worker := NewConsumerWorker(d.stream, group, name)
	worker.Start()
	d.workers[key] = worker
	return true, nil
}

// removeWorkerResult mirrors the Python reference's return shape.
type removeWorkerResult struct {
	Removed         bool   `json:"removed"`
	Reason          string `json:"reason,omitempty"`
	Message         string `json:"message,omitempty"`
	HandedOverTo    string `json:"handed_over_to,omitempty"`
	HandedOverCount int    `json:"handed_over_count,omitempty"`
}

// RemoveWorker safely removes a consumer.
//
// XGROUP DELCONSUMER destroys the consumer's PEL entries outright, so
// any pending message it still owned would become unreachable. Before
// deleting, hand its PEL off to another consumer in the same group
// with XCLAIM. Without a peer consumer to take over, refuse to delete
// and leave the worker in place so the user can add a peer first.
func (d *StreamingDemo) RemoveWorker(ctx context.Context, group, name string) (removeWorkerResult, int) {
	d.mu.Lock()
	key := workerKey{Group: group, Name: name}
	worker, ok := d.workers[key]
	if !ok {
		d.mu.Unlock()
		return removeWorkerResult{Removed: false, Reason: "not-found"}, http.StatusOK
	}
	peers := []string{}
	for k := range d.workers {
		if k.Group == group && k.Name != name {
			peers = append(peers, k.Name)
		}
	}
	if len(peers) == 0 {
		d.mu.Unlock()
		return removeWorkerResult{
			Removed: false,
			Reason:  "no-peer",
			Message: fmt.Sprintf(
				"%s/%s still owns pending entries and is the only consumer in its group; add another consumer first so its PEL can be handed over before deletion.",
				group, name,
			),
		}, http.StatusConflict
	}
	sort.Strings(peers)
	handoverTo := peers[0]
	d.mu.Unlock()

	// Run the handover BEFORE removing the worker from the registry.
	// XGROUP DELCONSUMER would destroy the source's pending list, so
	// any handover failure must abort the removal — leaving the worker
	// in place lets the user retry once the underlying Redis issue is
	// resolved. (The worker keeps consuming during the handover; XCLAIM
	// with MIN-IDLE-TIME 0 races acks gracefully — anything the worker
	// acks during the window is gone from XPENDING and isn't moved.)
	claimed, err := d.stream.HandoverPending(ctx, group, name, handoverTo, 100)
	if err != nil {
		return removeWorkerResult{
			Removed: false,
			Reason:  "handover-failed",
			Message: fmt.Sprintf(
				"Handover from %s/%s to %s failed before XGROUP DELCONSUMER could run: %v. %s/%s is still in the group; retry the remove or investigate the Redis error before deleting (DELCONSUMER would destroy the source consumer's pending entries).",
				group, name, handoverTo, err, group, name,
			),
		}, http.StatusConflict
	}

	// Handover succeeded; now safe to remove from the registry, stop
	// the worker, and destroy the consumer record in Redis.
	d.mu.Lock()
	delete(d.workers, key)
	d.mu.Unlock()
	worker.Stop(2 * time.Second)
	if _, err := d.stream.DeleteConsumer(ctx, group, name); err != nil {
		log.Printf("[demo] delconsumer %s/%s: %v", group, name, err)
	}
	return removeWorkerResult{
		Removed:         true,
		HandedOverTo:    handoverTo,
		HandedOverCount: claimed,
	}, http.StatusOK
}

// GetWorker returns the worker for a (group, name) pair, or nil.
func (d *StreamingDemo) GetWorker(group, name string) *ConsumerWorker {
	d.mu.Lock()
	defer d.mu.Unlock()
	return d.workers[workerKey{Group: group, Name: name}]
}

// WorkersSnapshot returns a stable list of (key, worker) safe to use
// outside the lock.
func (d *StreamingDemo) WorkersSnapshot() []workerSnap {
	d.mu.Lock()
	defer d.mu.Unlock()
	out := make([]workerSnap, 0, len(d.workers))
	for k, w := range d.workers {
		out = append(out, workerSnap{Key: k, Worker: w})
	}
	return out
}

type workerSnap struct {
	Key    workerKey
	Worker *ConsumerWorker
}

// StopAll stops every worker. Used by reset and shutdown.
func (d *StreamingDemo) StopAll() {
	d.mu.Lock()
	workers := make([]*ConsumerWorker, 0, len(d.workers))
	for _, w := range d.workers {
		workers = append(workers, w)
	}
	d.workers = make(map[workerKey]*ConsumerWorker)
	d.mu.Unlock()
	for _, w := range workers {
		w.Stop(2 * time.Second)
	}
}

// Reset stops every worker, drops the stream, resets stats, and re-seeds.
func (d *StreamingDemo) Reset(ctx context.Context) (int, error) {
	d.StopAll()
	if err := d.stream.DeleteStream(ctx); err != nil {
		return 0, err
	}
	d.stream.ResetStats()
	return d.Seed(ctx, DefaultGroups)
}

// ------------------------------------------------------------------
// HTTP server
// ------------------------------------------------------------------

type httpServer struct {
	stream *EventStream
	demo   *StreamingDemo
}

func (s *httpServer) writeJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("[demo] write json: %v", err)
	}
}

func (s *httpServer) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}
	html := strings.NewReplacer(
		"__STREAM_KEY__", s.stream.StreamKey(),
		"__MAXLEN__", fmt.Sprintf("%d", s.stream.MaxlenApprox()),
		"__CLAIM_IDLE__", fmt.Sprintf("%d", s.stream.ClaimMinIdleMs()),
	).Replace(htmlTemplate)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(html))
}

type stateResponse struct {
	Stream  StreamInfo               `json:"stream"`
	Tail    []Entry                  `json:"tail"`
	Groups  []map[string]interface{} `json:"groups"`
	Pending []map[string]interface{} `json:"pending"`
	Stats   Stats                    `json:"stats"`
}

type consumerDetail struct {
	Name         string        `json:"name"`
	Group        string        `json:"group"`
	Processed    int64         `json:"processed"`
	Reaped       int64         `json:"reaped"`
	CrashedDrops int64         `json:"crashed_drops"`
	Paused       bool          `json:"paused"`
	CrashQueued  int           `json:"crash_queued"`
	Alive        bool          `json:"alive"`
	Pending      int64         `json:"pending"`
	IdleMs       int64         `json:"idle_ms"`
	Recent       []RecentEntry `json:"recent"`
}

func (s *httpServer) handleState(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	streamInfo, _ := s.stream.InfoStream(ctx)
	groups, _ := s.stream.InfoGroups(ctx)
	workers := s.demo.WorkersSnapshot()

	groupsDetail := make([]map[string]interface{}, 0, len(groups))
	pendingRows := make([]map[string]interface{}, 0)

	for _, group := range groups {
		consumerInfos, _ := s.stream.InfoConsumers(ctx, group.Name)
		byName := make(map[string]ConsumerInfo, len(consumerInfos))
		for _, ci := range consumerInfos {
			byName[ci.Name] = ci
		}

		consumers := make([]consumerDetail, 0)
		seen := make(map[string]bool)
		for _, ws := range workers {
			if ws.Key.Group != group.Name {
				continue
			}
			info := byName[ws.Key.Name]
			status := ws.Worker.Status()
			consumers = append(consumers, consumerDetail{
				Name:         status.Name,
				Group:        status.Group,
				Processed:    status.Processed,
				Reaped:       status.Reaped,
				CrashedDrops: status.CrashedDrops,
				Paused:       status.Paused,
				CrashQueued:  status.CrashQueued,
				Alive:        status.Alive,
				Pending:      info.Pending,
				IdleMs:       info.IdleMs,
				Recent:       ws.Worker.Recent(),
			})
			seen[ws.Key.Name] = true
		}
		// Surface consumers Redis knows about but our registry doesn't
		// (orphans after a process restart, manual XGROUP CREATECONSUMER).
		for _, ci := range consumerInfos {
			if seen[ci.Name] {
				continue
			}
			consumers = append(consumers, consumerDetail{
				Name:    ci.Name,
				Group:   group.Name,
				Pending: ci.Pending,
				IdleMs:  ci.IdleMs,
				Recent:  []RecentEntry{},
			})
		}
		sort.Slice(consumers, func(i, j int) bool {
			return consumers[i].Name < consumers[j].Name
		})

		groupsDetail = append(groupsDetail, map[string]interface{}{
			"name":              group.Name,
			"consumers":         group.Consumers,
			"pending":           group.Pending,
			"last_delivered_id": group.LastDeliveredID,
			"lag":               group.Lag,
			"consumers_detail":  consumers,
		})

		pendingDetail, _ := s.stream.PendingDetail(ctx, group.Name, 50)
		for _, p := range pendingDetail {
			pendingRows = append(pendingRows, map[string]interface{}{
				"group":      group.Name,
				"id":         p.ID,
				"consumer":   p.Consumer,
				"idle_ms":    p.IdleMs,
				"deliveries": p.Deliveries,
			})
		}
	}

	tail, _ := s.stream.Tail(ctx, 10)
	if tail == nil {
		tail = []Entry{}
	}

	s.writeJSON(w, http.StatusOK, stateResponse{
		Stream:  streamInfo,
		Tail:    tail,
		Groups:  groupsDetail,
		Pending: pendingRows,
		Stats:   s.stream.Stats(),
	})
}

func (s *httpServer) handleProduce(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad form"})
		return
	}
	count := clamp(parseIntOr(r.FormValue("count"), 1), 1, 500)
	eventType := strings.TrimSpace(r.FormValue("type"))
	events := make([]ProducerEvent, 0, count)
	for i := 0; i < count; i++ {
		picked := eventType
		if picked == "" {
			picked = EventTypes[rand.Intn(len(EventTypes))]
		}
		events = append(events, ProducerEvent{Type: picked, Payload: fakePayload()})
	}
	ids, err := s.stream.ProduceBatch(r.Context(), events)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"produced": len(ids),
		"ids":      ids,
	})
}

func (s *httpServer) handleAddWorker(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad form"})
		return
	}
	group := strings.TrimSpace(r.FormValue("group"))
	name := strings.TrimSpace(r.FormValue("name"))
	if group == "" || name == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "group and name are required"})
		return
	}
	added, err := s.demo.AddWorker(r.Context(), group, name)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if !added {
		s.writeJSON(w, http.StatusConflict, map[string]string{"error": fmt.Sprintf("%s/%s already exists", group, name)})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]string{"group": group, "name": name})
}

func (s *httpServer) handleRemoveWorker(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad form"})
		return
	}
	group := strings.TrimSpace(r.FormValue("group"))
	name := strings.TrimSpace(r.FormValue("name"))
	result, status := s.demo.RemoveWorker(r.Context(), group, name)
	s.writeJSON(w, status, result)
}

func (s *httpServer) handleCrash(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad form"})
		return
	}
	group := strings.TrimSpace(r.FormValue("group"))
	name := strings.TrimSpace(r.FormValue("name"))
	count := parseIntOr(r.FormValue("count"), 1)
	worker := s.demo.GetWorker(group, name)
	if worker == nil {
		s.writeJSON(w, http.StatusNotFound, map[string]string{
			"error": fmt.Sprintf("unknown consumer %s/%s", group, name),
		})
		return
	}
	worker.CrashNext(count)
	s.writeJSON(w, http.StatusOK, map[string]int{"queued": count})
}

func (s *httpServer) handleAutoclaim(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad form"})
		return
	}
	group := strings.TrimSpace(r.FormValue("group"))
	consumer := strings.TrimSpace(r.FormValue("consumer"))
	if group == "" || consumer == "" {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "group and consumer are required"})
		return
	}
	worker := s.demo.GetWorker(group, consumer)
	if worker == nil {
		s.writeJSON(w, http.StatusNotFound, map[string]string{
			"error": fmt.Sprintf("unknown consumer %s/%s", group, consumer),
		})
		return
	}
	result, err := worker.ReapIdlePel(r.Context())
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	deleted := result.DeletedIDs
	if deleted == nil {
		deleted = []string{}
	}
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"claimed":     result.Claimed,
		"processed":   result.Processed,
		"deleted":     deleted,
		"min_idle_ms": s.stream.ClaimMinIdleMs(),
	})
}

func (s *httpServer) handleTrim(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		s.writeJSON(w, http.StatusBadRequest, map[string]string{"error": "bad form"})
		return
	}
	maxlen := int64(parseIntOr(r.FormValue("maxlen"), 0))
	deleted, err := s.stream.TrimMaxlen(r.Context(), maxlen)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"deleted": deleted,
		"maxlen":  maxlen,
	})
}

func (s *httpServer) handleReplay(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	start := q.Get("start")
	if start == "" {
		start = "-"
	}
	end := q.Get("end")
	if end == "" {
		end = "+"
	}
	limit := int64(clamp(parseIntOr(q.Get("count"), 20), 1, 500))
	entries, err := s.stream.Replay(r.Context(), start, end, limit)
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	if entries == nil {
		entries = []Entry{}
	}
	s.writeJSON(w, http.StatusOK, map[string]interface{}{
		"start":   start,
		"end":     end,
		"limit":   limit,
		"entries": entries,
	})
}

func (s *httpServer) handleReset(w http.ResponseWriter, r *http.Request) {
	count, err := s.demo.Reset(r.Context())
	if err != nil {
		s.writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	s.writeJSON(w, http.StatusOK, map[string]int{"consumers": count})
}

// ------------------------------------------------------------------
// Entry point
// ------------------------------------------------------------------

// RunDemoServer parses CLI flags and starts the streaming demo HTTP
// server. It is the entry point your cmd/demo/main.go shim calls.
func RunDemoServer() {
	host := flag.String("host", "127.0.0.1", "HTTP bind host")
	port := flag.Int("port", 8083, "HTTP bind port")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	streamKey := flag.String("stream-key", "demo:events:orders", "Redis Stream key")
	maxlen := flag.Int64("maxlen", 2000, "Approximate MAXLEN cap on every XADD")
	claimIdleMs := flag.Int64("claim-idle-ms", 5000,
		"Minimum idle time before XAUTOCLAIM may reassign a pending entry")
	noReset := flag.Bool("no-reset", false,
		"Keep any existing data at --stream-key instead of deleting it on startup. "+
			"By default the demo wipes the stream so each run starts from an empty state.")
	flag.Parse()

	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("could not reach Redis at %s:%d: %v", *redisHost, *redisPort, err)
	}

	stream := NewEventStream(client, *streamKey, *maxlen, *claimIdleMs)
	demo := NewStreamingDemo(stream)

	if !*noReset {
		fmt.Printf("Deleting any existing data at key '%s' for a clean demo run (pass --no-reset to keep it).\n", *streamKey)
		if err := stream.DeleteStream(ctx); err != nil {
			log.Fatalf("could not delete stream key: %v", err)
		}
	}
	seeded, err := demo.Seed(ctx, DefaultGroups)
	if err != nil {
		log.Fatalf("could not seed default groups: %v", err)
	}

	srv := &httpServer{stream: stream, demo: demo}

	mux := http.NewServeMux()
	mux.HandleFunc("/", srv.handleRoot)
	mux.HandleFunc("/state", srv.handleState)
	mux.HandleFunc("/produce", srv.handleProduce)
	mux.HandleFunc("/add-worker", srv.handleAddWorker)
	mux.HandleFunc("/remove-worker", srv.handleRemoveWorker)
	mux.HandleFunc("/crash", srv.handleCrash)
	mux.HandleFunc("/autoclaim", srv.handleAutoclaim)
	mux.HandleFunc("/trim", srv.handleTrim)
	mux.HandleFunc("/replay", srv.handleReplay)
	mux.HandleFunc("/reset", srv.handleReset)

	httpSrv := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", *host, *port),
		Handler: mux,
	}

	fmt.Printf("Redis streaming demo server listening on http://%s:%d\n", *host, *port)
	fmt.Printf(
		"Using Redis at %s:%d with stream key '%s' (MAXLEN ~ %d)\n",
		*redisHost, *redisPort, *streamKey, *maxlen,
	)
	fmt.Printf("Seeded %d consumer(s) across %d group(s)\n", seeded, len(DefaultGroups))

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("HTTP server: %v", err)
		}
	}()

	<-stop
	fmt.Println("Shutting down...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	_ = httpSrv.Shutdown(shutdownCtx)
	demo.StopAll()
}

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

func parseIntOr(s string, fallback int) int {
	if s == "" {
		return fallback
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return fallback
	}
	return n
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

var customerNames = []string{"alice", "bob", "carol", "dan", "erin"}

func fakePayload() map[string]string {
	return map[string]string{
		"order_id": fmt.Sprintf("o-%d", 1000+rand.Intn(9000)),
		"customer": customerNames[rand.Intn(len(customerNames))],
		"amount":   fmt.Sprintf("%.2f", 5.0+rand.Float64()*245.0),
	}
}

// htmlTemplate is the inlined HTML page. __STREAM_KEY__, __MAXLEN__,
// and __CLAIM_IDLE__ placeholders are substituted per request so the
// rendered page reflects the configured values.
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Streaming Demo</title>
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
    .badge.ack { background: var(--ok); color: #1d4a2c; }
    .badge.drop { background: var(--warn); color: #6b3220; }
    .badge.idle { background: #e6e0f0; color: #43326a; }
    .group { border-top: 1px dashed var(--line); padding-top: 10px; margin-top: 10px; }
    .group:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
    .consumers { margin-top: 6px; }
    .consumer-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .consumer-row .name { font-weight: bold; min-width: 90px; }
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
    <div class="pill">go-redis + Go net/http</div>
    <h1>Redis Streaming Demo</h1>
    <p class="lede">
      Producers append events to a single Redis Stream
      (<code>__STREAM_KEY__</code>). Two consumer groups read the same
      stream independently: <code>notifications</code> shares its work
      across two consumers, <code>analytics</code> processes the full
      flow on its own. Acknowledge with <code>XACK</code>, recover
      crashed deliveries with <code>XAUTOCLAIM</code>, replay any range
      with <code>XRANGE</code>, and bound retention with <code>XTRIM</code>.
    </p>

    <div class="grid">
      <section class="panel wide">
        <h2>Stream state</h2>
        <div id="stream-view">Loading...</div>
        <button id="refresh-button" class="secondary">Refresh</button>
        <button id="reset-button" class="danger">Reset demo (drop stream and re-seed)</button>
      </section>

      <section class="panel">
        <h2>Produce events</h2>
        <p>Events are appended with <code>XADD</code> with an approximate
        <code>MAXLEN ~ __MAXLEN__</code> retention cap.</p>
        <label for="produce-count">How many</label>
        <input id="produce-count" type="number" min="1" max="500" value="10">
        <label for="produce-type">Event type</label>
        <select id="produce-type">
          <option value="">(random)</option>
          <option value="order.placed">order.placed</option>
          <option value="order.paid">order.paid</option>
          <option value="order.shipped">order.shipped</option>
          <option value="order.cancelled">order.cancelled</option>
        </select>
        <button id="produce-button">Produce</button>
      </section>

      <section class="panel">
        <h2>Replay range (XRANGE)</h2>
        <p>Reads a slice of history. Replay is independent of any
        consumer group — no cursors move, no acks happen.</p>
        <label for="replay-start">Start ID</label>
        <input id="replay-start" value="-">
        <label for="replay-end">End ID</label>
        <input id="replay-end" value="+">
        <label for="replay-count">Limit</label>
        <input id="replay-count" type="number" min="1" max="500" value="20">
        <button id="replay-button">Replay</button>
      </section>

      <section class="panel">
        <h2>Trim retention (XTRIM)</h2>
        <p>Cap the stream length. Approximate trimming releases whole
        macro-nodes, which is much cheaper than exact trimming.</p>
        <label for="trim-maxlen">MAXLEN ~</label>
        <input id="trim-maxlen" type="number" min="0" value="100">
        <button id="trim-button" class="secondary">XTRIM</button>
      </section>

      <section class="panel wide">
        <h2>Consumer groups</h2>
        <div id="groups-view">Loading...</div>
      </section>

      <section class="panel wide">
        <h2>Pending entries (XPENDING)</h2>
        <p>Entries delivered to a consumer that haven't been acked yet.
        Idle time &ge; <code>__CLAIM_IDLE__</code> ms is eligible for
        <code>XAUTOCLAIM</code>.</p>
        <div id="pending-view">Loading...</div>
        <div class="row">
          <select id="autoclaim-target"></select>
          <button id="autoclaim-button" class="secondary">XAUTOCLAIM to selected</button>
        </div>
      </section>

      <section class="panel wide">
        <h2>Last result</h2>
        <div id="result-view"><p>Produce events, replay a range, or trigger an autoclaim to see results.</p></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const streamView = document.getElementById("stream-view");
    const groupsView = document.getElementById("groups-view");
    const pendingView = document.getElementById("pending-view");
    const resultView = document.getElementById("result-view");
    const autoclaimTarget = document.getElementById("autoclaim-target");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }

    function renderStream(state) {
      const stream = state.stream || {};
      const tail = state.tail || [];
      const tailRows = tail.map((entry) => ` + "`" + `
        <tr>
          <td class="mono">${escapeHtml(entry.id)}</td>
          <td>${escapeHtml(entry.fields.type)}</td>
          <td class="mono">${escapeHtml(entry.fields.order_id || "")}</td>
          <td>${escapeHtml(entry.fields.amount || "")}</td>
          <td class="mono">${escapeHtml(entry.fields.customer || "")}</td>
        </tr>` + "`" + `).join("");
      streamView.innerHTML = ` + "`" + `
        <dl>
          <dt>Length</dt><dd>${stream.length ?? 0}</dd>
          <dt>First ID</dt><dd class="mono">${escapeHtml(stream.first_entry_id) || "&mdash;"}</dd>
          <dt>Last ID</dt><dd class="mono">${escapeHtml(stream.last_entry_id) || "&mdash;"}</dd>
          <dt>Produced</dt><dd>${state.stats.produced_total ?? 0}</dd>
          <dt>Acked</dt><dd>${state.stats.acked_total ?? 0}</dd>
          <dt>Claimed</dt><dd>${state.stats.claimed_total ?? 0}</dd>
        </dl>
        <h3>Tail (most recent)</h3>
        ${tail.length === 0 ? "<p>(empty)</p>" :
          ` + "`" + `<table>
             <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th><th>customer</th></tr></thead>
             <tbody>${tailRows}</tbody>
           </table>` + "`" + `}
      ` + "`" + `;
    }

    function renderGroups(state) {
      const groups = state.groups || [];
      if (groups.length === 0) {
        groupsView.innerHTML = "<p>No groups.</p>";
        return;
      }
      const addWorkerValues = {};
      let focusedGroup = null;
      let focusedSelectionStart = null;
      groupsView.querySelectorAll("input[id^='addworker-']").forEach((input) => {
        const group = input.id.slice("addworker-".length);
        addWorkerValues[group] = input.value;
        if (document.activeElement === input) {
          focusedGroup = group;
          focusedSelectionStart = input.selectionStart;
        }
      });
      groupsView.innerHTML = groups.map((g) => {
        const consumers = (g.consumers_detail || []).map((c) => {
          const recent = (c.recent || []).slice(0, 3).map((m) => ` + "`" + `
            <span class="mono" title="${escapeHtml(JSON.stringify(m.fields))}">
              <span class="badge ${m.acked ? "ack" : "drop"}">${m.acked ? "ack" : "drop"}</span>
              ${escapeHtml(m.id)} ${escapeHtml(m.type)}
            </span>` + "`" + `).join(" &nbsp; ");
          const badges = [];
          if (c.paused) badges.push('<span class="badge idle">paused</span>');
          if (c.crash_queued > 0) badges.push(` + "`" + `<span class="badge drop">will drop ${c.crash_queued}</span>` + "`" + `);
          return ` + "`" + `
            <div class="consumer-row">
              <span class="name">${escapeHtml(c.name)}</span>
              <span class="mono">pending=${c.pending} idle=${c.idle_ms}ms processed=${c.processed} reaped=${c.reaped ?? 0}</span>
              ${badges.join(" ")}
              <button class="small secondary" data-action="crash" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Crash next 3</button>
              <button class="small danger" data-action="remove" data-group="${escapeHtml(g.name)}" data-name="${escapeHtml(c.name)}">Remove</button>
            </div>
            ${recent ? ` + "`" + `<div class="mono" style="margin-left: 100px; font-size: 0.85rem;">${recent}</div>` + "`" + ` : ""}` + "`" + `;
        }).join("");
        return ` + "`" + `
          <div class="group">
            <h3>${escapeHtml(g.name)}
              <span class="mono" style="font-weight: normal; font-size: 0.9rem;">
                pending=${g.pending} lag=${g.lag ?? "?"} last_delivered=${escapeHtml(g.last_delivered_id)}
              </span>
            </h3>
            <div class="consumers">${consumers || "<em>(no consumers)</em>"}</div>
            <div class="row" style="max-width: 360px; margin-top: 6px;">
              <input id="addworker-${escapeHtml(g.name)}" placeholder="new-worker-name">
              <button class="small" data-action="add" data-group="${escapeHtml(g.name)}">Add consumer</button>
            </div>
          </div>` + "`" + `;
      }).join("");

      for (const [group, value] of Object.entries(addWorkerValues)) {
        const input = document.getElementById(` + "`" + `addworker-${group}` + "`" + `);
        if (input) input.value = value;
      }
      if (focusedGroup) {
        const input = document.getElementById(` + "`" + `addworker-${focusedGroup}` + "`" + `);
        if (input) {
          input.focus();
          if (focusedSelectionStart !== null) {
            try { input.setSelectionRange(focusedSelectionStart, focusedSelectionStart); } catch (_) {}
          }
        }
      }

      const previous = autoclaimTarget.value;
      const options = [];
      for (const g of groups) {
        for (const c of g.consumers_detail || []) {
          options.push(` + "`" + `<option value="${escapeHtml(g.name)}|${escapeHtml(c.name)}">${escapeHtml(g.name)} &rarr; ${escapeHtml(c.name)}</option>` + "`" + `);
        }
      }
      autoclaimTarget.innerHTML = options.join("");
      if (Array.from(autoclaimTarget.options).some((o) => o.value === previous)) {
        autoclaimTarget.value = previous;
      }
    }

    function renderPending(state) {
      const rows = (state.pending || []).map((p) => ` + "`" + `
        <tr>
          <td class="mono">${escapeHtml(p.group)}</td>
          <td class="mono">${escapeHtml(p.consumer)}</td>
          <td class="mono">${escapeHtml(p.id)}</td>
          <td>${p.idle_ms} ms</td>
          <td>${p.deliveries}</td>
        </tr>` + "`" + `).join("");
      pendingView.innerHTML = (state.pending || []).length === 0
        ? "<p>(no entries currently pending)</p>"
        : ` + "`" + `<table>
             <thead><tr><th>group</th><th>consumer</th><th>id</th><th>idle</th><th>deliveries</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>` + "`" + `;
    }

    async function refresh() {
      const r = await fetch("/state");
      const state = await r.json();
      renderStream(state);
      renderGroups(state);
      renderPending(state);
    }

    document.getElementById("refresh-button").addEventListener("click", refresh);

    document.getElementById("produce-button").addEventListener("click", async () => {
      const count = parseInt(document.getElementById("produce-count").value, 10) || 1;
      const type = document.getElementById("produce-type").value;
      const body = new URLSearchParams({ count, type });
      const r = await fetch("/produce", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Produce failed.", "error"); return; }
      setStatus(` + "`" + `Produced ${d.produced} event(s).` + "`" + `, "ok");
      resultView.innerHTML = ` + "`" + `<p>Produced <strong>${d.produced}</strong> events. New IDs:</p>
        <pre class="mono">${d.ids.map(escapeHtml).join("\n")}</pre>` + "`" + `;
      await refresh();
    });

    document.getElementById("replay-button").addEventListener("click", async () => {
      const params = new URLSearchParams({
        start: document.getElementById("replay-start").value,
        end: document.getElementById("replay-end").value,
        count: document.getElementById("replay-count").value,
      });
      const r = await fetch(` + "`" + `/replay?${params.toString()}` + "`" + `);
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Replay failed.", "error"); return; }
      setStatus(` + "`" + `Replayed ${d.entries.length} entry/entries (XRANGE).` + "`" + `, "ok");
      const rows = d.entries.map((e) => ` + "`" + `
        <tr>
          <td class="mono">${escapeHtml(e.id)}</td>
          <td>${escapeHtml(e.fields.type)}</td>
          <td class="mono">${escapeHtml(e.fields.order_id || "")}</td>
          <td>${escapeHtml(e.fields.amount || "")}</td>
        </tr>` + "`" + `).join("");
      resultView.innerHTML = ` + "`" + `
        <p>XRANGE ${escapeHtml(d.start)} &rarr; ${escapeHtml(d.end)} (limit ${d.limit})</p>
        ${d.entries.length === 0 ? "<p>(no entries)</p>" :
          ` + "`" + `<table>
            <thead><tr><th>ID</th><th>type</th><th>order_id</th><th>amount</th></tr></thead>
            <tbody>${rows}</tbody>
           </table>` + "`" + `}` + "`" + `;
    });

    document.getElementById("trim-button").addEventListener("click", async () => {
      const maxlen = document.getElementById("trim-maxlen").value;
      const body = new URLSearchParams({ maxlen });
      const r = await fetch("/trim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Trim failed.", "error"); return; }
      setStatus(` + "`" + `XTRIM removed ${d.deleted} entr${d.deleted === 1 ? "y" : "ies"}.` + "`" + `, "ok");
      await refresh();
    });

    document.getElementById("autoclaim-button").addEventListener("click", async () => {
      const target = autoclaimTarget.value;
      if (!target) { setStatus("No consumer selected.", "error"); return; }
      const [group, consumer] = target.split("|");
      const body = new URLSearchParams({ group, consumer });
      const r = await fetch("/autoclaim", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) { setStatus(d.error || "Autoclaim failed.", "error"); return; }
      const deletedCount = (d.deleted || []).length;
      const msg = deletedCount
        ? ` + "`" + `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}; ${deletedCount} pending ID(s) were already trimmed out of the stream and removed from the PEL by Redis.` + "`" + `
        : ` + "`" + `${group}/${consumer} reaped ${d.claimed} entry/entries and processed ${d.processed}.` + "`" + `;
      setStatus(msg, "ok");
      const deletedBlock = deletedCount
        ? ` + "`" + `<h3>Deleted IDs (payload already trimmed &mdash; removed from PEL by Redis)</h3>
           <p class="mono">${(d.deleted || []).map(escapeHtml).join(", ")}</p>
           <p>In production these would also be routed to a dead-letter store for offline inspection.</p>` + "`" + `
        : "";
      resultView.innerHTML = ` + "`" + `
        <p><strong>${escapeHtml(group)}/${escapeHtml(consumer)}</strong> ran <code>XAUTOCLAIM</code>
           into itself with <code>min_idle_time = ${d.min_idle_ms} ms</code>,
           claimed <strong>${d.claimed}</strong> stuck entry/entries, processed
           <strong>${d.processed}</strong>, and acked them.</p>
        ${d.claimed === 0 ? "<p>(nothing was idle enough yet &mdash; try again after a few seconds)</p>" : ""}
        ${deletedBlock}` + "`" + `;
      await refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      if (!confirm("Drop the stream and re-seed the default groups?")) return;
      const r = await fetch("/reset", { method: "POST" });
      const d = await r.json();
      setStatus(` + "`" + `Reset. ${d.consumers} consumer(s) re-seeded.` + "`" + `, "ok");
      await refresh();
    });

    document.body.addEventListener("click", async (ev) => {
      const t = ev.target.closest("button[data-action]");
      if (!t) return;
      const action = t.dataset.action;
      const group = t.dataset.group;
      if (action === "crash") {
        const name = t.dataset.name;
        const body = new URLSearchParams({ group, name, count: "3" });
        await fetch("/crash", { method: "POST", body });
        setStatus(` + "`" + `Queued next 3 deliveries to ${group}/${name} for drop.` + "`" + `, "ok");
        await refresh();
      } else if (action === "remove") {
        const name = t.dataset.name;
        if (!confirm(` + "`" + `Remove ${group}/${name}? Any pending entries it still owns will be handed over to a peer consumer in the group via XCLAIM before XGROUP DELCONSUMER.` + "`" + `)) return;
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/remove-worker", { method: "POST", body });
        const d = await r.json();
        if (!d.removed) {
          setStatus(d.message || ` + "`" + `Could not remove ${group}/${name} (${d.reason || "unknown"}).` + "`" + `, "error");
        } else if (d.handed_over_count > 0) {
          setStatus(` + "`" + `Removed ${group}/${name}. Handed ${d.handed_over_count} pending entr${d.handed_over_count === 1 ? "y" : "ies"} over to ${d.handed_over_to}.` + "`" + `, "ok");
        } else {
          setStatus(` + "`" + `Removed ${group}/${name} (no pending entries to hand over).` + "`" + `, "ok");
        }
        await refresh();
      } else if (action === "add") {
        const input = document.getElementById(` + "`" + `addworker-${group}` + "`" + `);
        const name = (input.value || "").trim();
        if (!name) { setStatus("Enter a consumer name.", "error"); return; }
        const body = new URLSearchParams({ group, name });
        const r = await fetch("/add-worker", { method: "POST", body });
        const d = await r.json();
        if (!r.ok) { setStatus(d.error || "Add failed.", "error"); return; }
        input.value = "";
        setStatus(` + "`" + `Added ${group}/${name}.` + "`" + `, "ok");
        await refresh();
      }
    });

    refresh();
    setInterval(refresh, 1500);
  </script>
</body>
</html>
`
