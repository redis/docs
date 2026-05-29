package featurestore

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

// Streaming feature updater for the demo.
//
// Stands in for whatever Flink, Kafka Streams, or bespoke service
// computes the real-time features in a real deployment. In production
// this code lives in the streaming layer; here it runs as a goroutine
// next to the demo server so the page can start, pause, and resume it
// from the UI.
//
// Every tick the worker picks a few random users and writes a new
// value for each streaming feature, with a per-field HEXPIRE so the
// field self-expires if the worker is paused. Pause the worker for
// longer than StreamingTTL and the streaming fields drop out of the
// hash while the batch fields remain populated under the longer
// key-level TTL — the *mixed staleness* story made visible.

var (
	deviceIDs           = []string{"ios-1a4c", "ios-9f02", "and-7b21", "and-2d18", "web-chr-1", "web-saf-1", "web-ff-2"}
	sessionCountries    = []string{"US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL"}
	failedLoginBuckets  = []int{0, 1, 2, 5}
	failedLoginWeights  = []int{70, 20, 8, 2}
)

// WorkerStats is the JSON-friendly view of a StreamingWorker's
// state. The demo UI polls this every refresh.
type WorkerStats struct {
	Running     bool  `json:"running"`
	Paused      bool  `json:"paused"`
	TickCount   int64 `json:"tick_count"`
	WritesCount int64 `json:"writes_count"`
}

// StreamingWorker writes random streaming features on a tick.
type StreamingWorker struct {
	store        *FeatureStore
	tick         time.Duration
	usersPerTick int
	rng          *rand.Rand
	rngMu        sync.Mutex

	running      atomic.Bool
	paused       atomic.Bool
	tickInFlight atomic.Bool
	tickCount    atomic.Int64
	writesCount  atomic.Int64
	stopCh       chan struct{}
	doneCh       chan struct{}
}

// NewStreamingWorker constructs a worker that touches usersPerTick
// users every tick.
func NewStreamingWorker(store *FeatureStore, tick time.Duration, usersPerTick int, seed int64) *StreamingWorker {
	if tick == 0 {
		tick = time.Second
	}
	if usersPerTick == 0 {
		usersPerTick = 5
	}
	return &StreamingWorker{
		store:        store,
		tick:         tick,
		usersPerTick: usersPerTick,
		rng:          rand.New(rand.NewSource(seed)),
	}
}

// Start launches the goroutine that ticks. Safe to call when the
// worker is already running (no-op in that case).
//
// The worker uses an internal `context.Background()`-derived context
// rather than one passed in by the caller: the HTTP toggle handler
// runs on a request-scoped context that cancels as soon as the
// response completes, which would kill the worker on the very next
// tick. Lifecycle is owned by ``Stop`` (and the internal ``stopCh``).
func (w *StreamingWorker) Start() {
	if !w.running.CompareAndSwap(false, true) {
		return
	}
	w.paused.Store(false)
	w.stopCh = make(chan struct{})
	w.doneCh = make(chan struct{})
	go w.run(context.Background())
}

// Stop signals the worker to exit and waits for any in-flight tick
// to settle. Safe to call multiple times.
func (w *StreamingWorker) Stop() {
	if !w.running.CompareAndSwap(true, false) {
		return
	}
	close(w.stopCh)
	<-w.doneCh
}

// Pause prevents new ticks from running. An already-running tick is
// not interrupted; use WaitForIdle to wait for it.
func (w *StreamingWorker) Pause() { w.paused.Store(true) }

// Resume re-enables ticks.
func (w *StreamingWorker) Resume() { w.paused.Store(false) }

// IsPaused returns whether the worker is paused.
func (w *StreamingWorker) IsPaused() bool { return w.paused.Load() }

// IsRunning returns whether the goroutine is active.
func (w *StreamingWorker) IsRunning() bool { return w.running.Load() }

// WaitForIdle blocks until any in-flight tick has finished its
// current updateStreaming loop. Pause() only stops *future* ticks
// from running — it does not interrupt one that is already
// mid-flight. Callers that need a quiesced worker (a reset that's
// about to DEL every entity, for example) must Pause() AND
// WaitForIdle() before they touch state the tick might still be
// writing to.
func (w *StreamingWorker) WaitForIdle() {
	for w.tickInFlight.Load() {
		time.Sleep(20 * time.Millisecond)
	}
}

// Stats returns a snapshot of the worker's counters and state.
func (w *StreamingWorker) Stats() WorkerStats {
	return WorkerStats{
		Running:     w.IsRunning(),
		Paused:      w.IsPaused(),
		TickCount:   w.tickCount.Load(),
		WritesCount: w.writesCount.Load(),
	}
}

// ResetStats zeroes the tick and writes counters.
func (w *StreamingWorker) ResetStats() {
	w.tickCount.Store(0)
	w.writesCount.Store(0)
}

func (w *StreamingWorker) run(ctx context.Context) {
	// Whatever exits this goroutine — stopCh, ctx.Done(), or a future
	// panic-recovery path — must clear `running` so a later Start()
	// can spin a fresh goroutine. Without this, a one-shot ctx cancel
	// (or any unexpected exit) leaves IsRunning() returning true
	// forever, and ToggleWorker's CompareAndSwap refuses to restart.
	defer func() {
		w.running.Store(false)
		w.tickInFlight.Store(false)
		close(w.doneCh)
	}()
	t := time.NewTicker(w.tick)
	defer t.Stop()
	for {
		select {
		case <-w.stopCh:
			return
		case <-ctx.Done():
			return
		case <-t.C:
			// Set tickInFlight *before* the pause check so a
			// concurrent Pause()+WaitForIdle() can never see
			// tickInFlight=false in the window between the pause
			// check and the actual doTick call.
			w.tickInFlight.Store(true)
			if !w.paused.Load() {
				if err := w.doTick(ctx); err != nil {
					log.Printf("[streaming-worker] tick failed: %v", err)
				}
			}
			w.tickInFlight.Store(false)
		}
	}
}

func (w *StreamingWorker) doTick(ctx context.Context) error {
	ids, err := w.store.ListEntityIDs(ctx, 500)
	if err != nil {
		return fmt.Errorf("list entity ids: %w", err)
	}
	if len(ids) == 0 {
		return nil
	}

	w.rngMu.Lock()
	n := w.usersPerTick
	if n > len(ids) {
		n = len(ids)
	}
	chosen := w.rng.Perm(len(ids))[:n]
	picks := make([]string, n)
	for i, idx := range chosen {
		picks[i] = ids[idx]
	}
	w.rngMu.Unlock()

	nowMs := time.Now().UnixMilli()
	for _, id := range picks {
		fields := FeatureMap{
			"last_login_ts":     nowMs,
			"last_device_id":    w.choice(deviceIDs),
			"tx_count_5m":       w.intn(13),
			"failed_logins_15m": w.weightedInt(failedLoginBuckets, failedLoginWeights),
			"session_country":   w.choice(sessionCountries),
		}
		if err := w.store.UpdateStreaming(ctx, id, fields, 0); err != nil {
			return fmt.Errorf("update streaming for %s: %w", id, err)
		}
		w.writesCount.Add(int64(len(fields)))
	}
	w.tickCount.Add(1)
	return nil
}

func (w *StreamingWorker) choice(items []string) string {
	w.rngMu.Lock()
	defer w.rngMu.Unlock()
	return items[w.rng.Intn(len(items))]
}

func (w *StreamingWorker) intn(n int) int {
	w.rngMu.Lock()
	defer w.rngMu.Unlock()
	return w.rng.Intn(n)
}

func (w *StreamingWorker) weightedInt(items []int, weights []int) int {
	w.rngMu.Lock()
	defer w.rngMu.Unlock()
	total := 0
	for _, x := range weights {
		total += x
	}
	r := w.rng.Intn(total)
	for i, x := range weights {
		r -= x
		if r < 0 {
			return items[i]
		}
	}
	return items[len(items)-1]
}
