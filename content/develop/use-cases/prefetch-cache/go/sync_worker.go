// Background sync worker for the prefetch-cache demo.
//
// A daemon goroutine drains the primary's change channel and applies
// each event to Redis through PrefetchCache.ApplyChange. In a real
// system, the channel is replaced by a CDC pipeline (Redis Data
// Integration, Debezium, or an equivalent) that tails the primary's
// binlog/WAL and writes the same shape of events.
//
// The worker exposes Pause() and Resume() so maintenance paths
// (/reprefetch, Clear()) can stop event application without tearing
// the goroutine down. Pause() blocks until the worker is parked, so
// the caller knows no apply is in flight by the time it returns.
package prefetchcache

import (
	"context"
	"log"
	"sync"
	"time"
)

// SyncWorker drains primary change events into Redis on a goroutine.
type SyncWorker struct {
	primary       *MockPrimaryStore
	cache         *PrefetchCache
	pollTimeout   time.Duration

	mu          sync.Mutex
	running     bool
	cancel      context.CancelFunc
	done        chan struct{}
	paused      bool
	pausedIdle  chan struct{} // closed (replaced with a fresh chan) every time the loop parks
	resumeCh    chan struct{} // closed by Resume to wake the parked loop
}

// NewSyncWorker creates a SyncWorker. The default poll timeout (50 ms)
// matches the Python reference.
func NewSyncWorker(primary *MockPrimaryStore, cache *PrefetchCache) *SyncWorker {
	return &SyncWorker{
		primary:     primary,
		cache:       cache,
		pollTimeout: 50 * time.Millisecond,
		pausedIdle:  make(chan struct{}),
		resumeCh:    make(chan struct{}),
	}
}

// Start spawns the worker goroutine if it is not already running.
func (w *SyncWorker) Start() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.running {
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	w.cancel = cancel
	w.done = done
	w.running = true
	go w.run(ctx, done)
}

// Stop signals the worker to exit and waits up to joinTimeout for the
// goroutine to finish.
//
// If the join times out the worker is wedged inside ApplyChange; we
// leave w.running true so a subsequent Start() does not spawn a second
// worker on top of the orphan.
func (w *SyncWorker) Stop(joinTimeout time.Duration) {
	w.mu.Lock()
	if !w.running {
		w.mu.Unlock()
		return
	}
	cancel := w.cancel
	done := w.done
	// Close resumeCh inside the lock so a concurrent Resume cannot
	// pass the "already closed?" check and then race us to close()
	// the same channel twice (which would panic).
	closeOnce(w.resumeCh)
	w.mu.Unlock()

	cancel()

	select {
	case <-done:
		w.mu.Lock()
		w.running = false
		w.cancel = nil
		w.done = nil
		w.mu.Unlock()
	case <-time.After(joinTimeout):
		// Worker is wedged: leave running=true so Start() is a no-op
		// rather than producing a second worker.
	}
}

// Pause sets the pause flag and blocks until the worker confirms it is
// parked, up to timeout. Returns true if confirmed paused.
//
// While paused, change events accumulate on the primary's channel and
// apply in order after Resume(). Calling Pause while already paused is
// idempotent and returns immediately.
func (w *SyncWorker) Pause(timeout time.Duration) bool {
	w.mu.Lock()
	if !w.running {
		w.paused = true
		w.mu.Unlock()
		return true
	}
	if w.paused {
		idle := w.pausedIdle
		w.mu.Unlock()
		// Already paused -- wait for the current idle signal (which
		// is closed once the worker is parked).
		select {
		case <-idle:
			return true
		case <-time.After(timeout):
			return false
		}
	}
	// Replace the resume channel with a fresh one so any prior
	// Resume() does not immediately unblock this pause.
	w.resumeCh = make(chan struct{})
	// Reset the idle channel: a fresh one will be closed by the
	// worker when it parks.
	w.pausedIdle = make(chan struct{})
	idle := w.pausedIdle
	w.paused = true
	w.mu.Unlock()

	select {
	case <-idle:
		return true
	case <-time.After(timeout):
		return false
	}
}

// Resume clears the pause flag and wakes the parked worker goroutine.
func (w *SyncWorker) Resume() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if !w.paused {
		return
	}
	w.paused = false
	// Close inside the lock so a concurrent Stop cannot pass the
	// "already closed?" check and then race us to close() the same
	// channel twice (which would panic).
	closeOnce(w.resumeCh)
}

// closeOnce closes ch if it isn't already closed. Callers MUST hold
// w.mu while invoking it (the non-blocking receive + close pair is not
// atomic on its own; the mutex provides the missing serialisation).
func closeOnce(ch chan struct{}) {
	select {
	case <-ch:
		// Already closed.
	default:
		close(ch)
	}
}

func (w *SyncWorker) run(ctx context.Context, done chan struct{}) {
	defer close(done)
	for {
		// Bail out promptly on cancel.
		select {
		case <-ctx.Done():
			return
		default:
		}

		// Park if paused.
		w.mu.Lock()
		paused := w.paused
		idle := w.pausedIdle
		resumeCh := w.resumeCh
		w.mu.Unlock()
		if paused {
			// Signal "I am parked, no apply in flight". Closing the
			// channel lets every waiter on Pause() observe it.
			select {
			case <-idle:
				// Already closed -- nothing to do.
			default:
				close(idle)
			}
			// Wait for Resume() to close resumeCh, or for Stop() to
			// cancel the context.
			select {
			case <-resumeCh:
			case <-ctx.Done():
				return
			}
			continue
		}

		change, ok := w.primary.NextChange(w.pollTimeout)
		if !ok {
			continue
		}
		if err := w.cache.ApplyChange(ctx, change); err != nil {
			// Demo behaviour: log and drop the event. A production
			// CDC consumer would retry with bounded backoff and
			// expose a dead-letter / error counter; see the guide's
			// "Production usage" section.
			log.Printf("[sync] failed to apply %s %s: %v", change.Op, change.ID, err)
		}
	}
}
