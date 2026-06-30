// Background consumer goroutine for a single consumer in a consumer group.
//
// Each worker owns a goroutine that loops on XREADGROUP > with a short
// block timeout and acks every entry it processes. Recovery of stuck
// PEL entries (this consumer's, or anyone else's) happens through
// ReapIdlePel(), which is the textbook Streams pattern: each consumer
// periodically (or on demand) calls XAUTOCLAIM with itself as the
// target, then processes whatever it claimed. The demo's "XAUTOCLAIM
// to selected" button is exactly that call.
//
// Two demo-only levers are wired into the loop:
//
//   - Pause() parks the worker (so its pending entries age into the
//     XAUTOCLAIM window without being consumed by ">" reads).
//   - CrashNext(n) tells the worker to drop its next n deliveries on
//     the floor without acking them — the same effect as a worker
//     process dying mid-message. Those entries stay in the group's
//     PEL until ReapIdlePel recovers them.
//
// Real consumers do not need either lever; they only need
// XREADGROUP → process → XACK in run() and a periodic ReapIdlePel call
// to recover stuck entries.

package streaming

import (
	"context"
	"log"
	"sync"
	"time"
)

// RecentEntry is one slot in the worker's recent-deliveries buffer.
type RecentEntry struct {
	ID     string            `json:"id"`
	Type   string            `json:"type"`
	Fields map[string]string `json:"fields"`
	Acked  bool              `json:"acked"`
	Note   string            `json:"note,omitempty"`
}

// ConsumerStatus is the JSON-friendly view of one worker's state.
type ConsumerStatus struct {
	Name         string `json:"name"`
	Group        string `json:"group"`
	Processed    int64  `json:"processed"`
	Reaped       int64  `json:"reaped"`
	CrashedDrops int64  `json:"crashed_drops"`
	Paused       bool   `json:"paused"`
	CrashQueued  int    `json:"crash_queued"`
	Alive        bool   `json:"alive"`
}

// ReapResult is what ReapIdlePel returns.
type ReapResult struct {
	Claimed    int      `json:"claimed"`
	Processed  int      `json:"processed"`
	DeletedIDs []string `json:"deleted_ids"`
}

// ConsumerWorker is one consumer in a consumer group, running on its
// own goroutine.
type ConsumerWorker struct {
	stream           *EventStream
	group            string
	name             string
	processLatencyMs int
	recentCap        int

	mu            sync.Mutex
	processed     int64
	reaped        int64
	crashedDrops  int64
	crashNext     int
	paused        bool
	recent        []RecentEntry

	startStopMu sync.Mutex
	cancel      context.CancelFunc
	done        chan struct{}
	alive       bool
}

// NewConsumerWorker constructs a worker. processLatencyMs simulates
// per-entry processing time so the demo's UI has something to show.
func NewConsumerWorker(stream *EventStream, group, name string) *ConsumerWorker {
	return &ConsumerWorker{
		stream:           stream,
		group:            group,
		name:             name,
		processLatencyMs: 25,
		recentCap:        20,
		recent:           make([]RecentEntry, 0, 20),
	}
}

// Start spawns the worker goroutine if it isn't already running.
func (w *ConsumerWorker) Start() {
	w.startStopMu.Lock()
	defer w.startStopMu.Unlock()
	if w.alive {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	w.cancel = cancel
	w.done = done
	w.alive = true
	go w.run(ctx, done)
}

// Stop signals the worker to exit and waits up to joinTimeout for the
// goroutine to finish.
func (w *ConsumerWorker) Stop(joinTimeout time.Duration) {
	w.startStopMu.Lock()
	if !w.alive {
		w.startStopMu.Unlock()
		return
	}
	cancel := w.cancel
	done := w.done
	w.startStopMu.Unlock()

	cancel()
	select {
	case <-done:
	case <-time.After(joinTimeout):
	}
	w.startStopMu.Lock()
	w.alive = false
	w.startStopMu.Unlock()
}

// Pause parks the read loop. New deliveries stop arriving for this
// consumer; entries already in its PEL age into the XAUTOCLAIM window.
func (w *ConsumerWorker) Pause() {
	w.mu.Lock()
	w.paused = true
	w.mu.Unlock()
}

// Resume re-enables the read loop.
func (w *ConsumerWorker) Resume() {
	w.mu.Lock()
	w.paused = false
	w.mu.Unlock()
}

// CrashNext tells the worker to drop the next count deliveries on the
// floor without acking them. The entries stay in the group's PEL with
// their delivery counter incremented, so XAUTOCLAIM can recover them
// once they exceed the idle threshold.
func (w *ConsumerWorker) CrashNext(count int) {
	if count < 0 {
		count = 0
	}
	w.mu.Lock()
	w.crashNext += count
	w.mu.Unlock()
}

// Recent returns the worker's recent-deliveries buffer (newest first).
func (w *ConsumerWorker) Recent() []RecentEntry {
	w.mu.Lock()
	defer w.mu.Unlock()
	out := make([]RecentEntry, len(w.recent))
	copy(out, w.recent)
	return out
}

// Status returns the JSON-friendly view of the worker.
func (w *ConsumerWorker) Status() ConsumerStatus {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.startStopMu.Lock()
	alive := w.alive
	w.startStopMu.Unlock()
	return ConsumerStatus{
		Name:         w.name,
		Group:        w.group,
		Processed:    w.processed,
		Reaped:       w.reaped,
		CrashedDrops: w.crashedDrops,
		Paused:       w.paused,
		CrashQueued:  w.crashNext,
		Alive:        alive,
	}
}

// ReapIdlePel runs XAUTOCLAIM into self and processes the claimed entries.
//
// Returns a summary with claimed, processed, and the list of deleted
// IDs (PEL entries whose stream payload was already trimmed before the
// sweep ran). Redis 7+ removes deleted IDs from the PEL inside
// XAUTOCLAIM itself, so the caller does not have to XACK them; they
// are reported so the caller can route them to a dead-letter store.
func (w *ConsumerWorker) ReapIdlePel(ctx context.Context) (ReapResult, error) {
	claimed, deleted, err := w.stream.Autoclaim(ctx, w.group, w.name, 100, "0-0", 10)
	if err != nil {
		return ReapResult{}, err
	}
	processed := 0
	for _, entry := range claimed {
		if perErr := w.handleEntry(ctx, entry.ID, entry.Fields); perErr != nil {
			log.Printf("[%s/%s] reap failed on %s: %v", w.group, w.name, entry.ID, perErr)
			continue
		}
		processed++
	}
	w.mu.Lock()
	w.reaped += int64(processed)
	w.mu.Unlock()
	return ReapResult{
		Claimed:    len(claimed),
		Processed:  processed,
		DeletedIDs: deleted,
	}, nil
}

// run is the main loop: XREADGROUP > → process → XACK.
//
// A per-entry error (typically a failed XACK) must NOT kill the
// goroutine; that would silently halt this consumer while every other
// entry it owns sat in the PEL waiting for XAUTOCLAIM. We log and
// move on; the entry stays unacked and the next reap recovers it once
// it exceeds the idle threshold.
func (w *ConsumerWorker) run(ctx context.Context, done chan struct{}) {
	defer close(done)
	for {
		if ctx.Err() != nil {
			return
		}
		w.mu.Lock()
		paused := w.paused
		w.mu.Unlock()
		if paused {
			select {
			case <-ctx.Done():
				return
			case <-time.After(50 * time.Millisecond):
			}
			continue
		}

		entries, err := w.stream.Consume(ctx, w.group, w.name, 10, 500)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			log.Printf("[%s/%s] read failed: %v", w.group, w.name, err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(500 * time.Millisecond):
			}
			continue
		}

		for _, entry := range entries {
			if ctx.Err() != nil {
				return
			}
			w.dispatch(ctx, entry.ID, entry.Fields)
		}
	}
}

func (w *ConsumerWorker) dispatch(ctx context.Context, id string, fields map[string]string) {
	if w.processLatencyMs > 0 {
		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Duration(w.processLatencyMs) * time.Millisecond):
		}
	}
	if err := w.handleEntry(ctx, id, fields); err != nil {
		// Per-entry failure: log, leave unacked for the next reap, but
		// keep this consumer alive so its other entries don't pile up.
		log.Printf("[%s/%s] failed to handle %s: %v", w.group, w.name, id, err)
		w.pushRecent(RecentEntry{
			ID:     id,
			Type:   fields["type"],
			Fields: fields,
			Acked:  false,
			Note:   "handler error: " + err.Error(),
		})
	}
}

// handleEntry is the per-entry processor. The "crash" path drops the
// entry without acking it (incrementing crashedDrops); the normal path
// XACKs it. Returns an error only if XACK itself failed — a dropped
// entry is not an error.
func (w *ConsumerWorker) handleEntry(ctx context.Context, id string, fields map[string]string) error {
	w.mu.Lock()
	drop := w.crashNext > 0
	if drop {
		w.crashNext--
		w.crashedDrops++
	}
	w.mu.Unlock()

	if drop {
		w.pushRecent(RecentEntry{
			ID:     id,
			Type:   fields["type"],
			Fields: fields,
			Acked:  false,
			Note:   "dropped (simulated crash)",
		})
		return nil
	}

	if _, err := w.stream.Ack(ctx, w.group, []string{id}); err != nil {
		return err
	}
	w.mu.Lock()
	w.processed++
	w.mu.Unlock()
	w.pushRecent(RecentEntry{
		ID:     id,
		Type:   fields["type"],
		Fields: fields,
		Acked:  true,
	})
	return nil
}

// pushRecent inserts an entry at the head of the recent buffer,
// trimming the tail when it exceeds capacity.
func (w *ConsumerWorker) pushRecent(entry RecentEntry) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.recent = append([]RecentEntry{entry}, w.recent...)
	if len(w.recent) > w.recentCap {
		w.recent = w.recent[:w.recentCap]
	}
}
