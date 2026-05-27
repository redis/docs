// Mock background worker for the job-queue demo.
//
// A worker pulls jobs off the queue, simulates work by sleeping for a
// configurable latency, and either completes the job, fails it, or
// intentionally hangs to simulate a worker crash that the reclaimer must
// recover from. This is the demo-side stand-in for whatever real work
// your application would run in the background (sending emails,
// transcoding video, calling third-party webhooks, etc.).
package jobqueue

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"sync/atomic"
	"time"
)

// Worker is a single background goroutine that drains a Redis job queue.
type Worker struct {
	name  string
	queue *RedisJobQueue

	mu            sync.Mutex
	workLatencyMs int
	failRate      float64
	hangRate      float64

	processed atomic.Int64

	// Lifecycle
	runMu  sync.Mutex
	cancel context.CancelFunc
	done   chan struct{}
	rng    *rand.Rand
}

// NewWorker creates a new Worker bound to the given queue.
func NewWorker(name string, queue *RedisJobQueue, workLatencyMs int, failRate, hangRate float64) *Worker {
	return &Worker{
		name:          name,
		queue:         queue,
		workLatencyMs: workLatencyMs,
		failRate:      failRate,
		hangRate:      hangRate,
		rng:           rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Configure updates the worker's runtime knobs. Safe to call while the
// worker is running.
func (w *Worker) Configure(workLatencyMs int, failRate, hangRate float64) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.workLatencyMs = workLatencyMs
	w.failRate = failRate
	w.hangRate = hangRate
}

func (w *Worker) snapshot() (int, float64, float64) {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.workLatencyMs, w.failRate, w.hangRate
}

// Start runs the worker loop in a new goroutine. If the worker is already
// running, Start is a no-op. If a previous run is shutting down it waits
// for it to finish first.
func (w *Worker) Start(parent context.Context) {
	w.runMu.Lock()
	defer w.runMu.Unlock()

	if w.done != nil {
		select {
		case <-w.done:
			// Previous run finished; we can start a new one.
		default:
			// Still running.
			return
		}
	}

	ctx, cancel := context.WithCancel(parent)
	w.cancel = cancel
	done := make(chan struct{})
	w.done = done
	go w.run(ctx, done)
}

// Stop signals the worker to shut down. It does not block.
func (w *Worker) Stop() {
	w.runMu.Lock()
	cancel := w.cancel
	w.runMu.Unlock()
	if cancel != nil {
		cancel()
	}
}

// IsAlive reports whether the worker's goroutine is currently running.
func (w *Worker) IsAlive() bool {
	w.runMu.Lock()
	done := w.done
	w.runMu.Unlock()
	if done == nil {
		return false
	}
	select {
	case <-done:
		return false
	default:
		return true
	}
}

// Processed returns the number of jobs this worker has successfully
// completed since it was created.
func (w *Worker) Processed() int64 {
	return w.processed.Load()
}

// ResetProcessed zeroes this worker's processed counter.
func (w *Worker) ResetProcessed() {
	w.processed.Store(0)
}

func (w *Worker) run(ctx context.Context, done chan struct{}) {
	defer close(done)
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		job, err := w.queue.Claim(ctx, 500)
		if err != nil {
			// On error, back off briefly and retry unless cancelled.
			select {
			case <-ctx.Done():
				return
			case <-time.After(100 * time.Millisecond):
				continue
			}
		}
		if job == nil {
			continue
		}
		w.process(ctx, job)
	}
}

func (w *Worker) process(ctx context.Context, job *ClaimedJob) {
	// Decide outcome up front so the latency reflects "work was tried".
	outcome := w.pickOutcome()
	latency, _, _ := w.snapshot()
	if latency > 0 {
		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Duration(latency) * time.Millisecond):
		}
	}

	switch outcome {
	case "hang":
		// Simulate a worker that crashed mid-job: don't complete, don't
		// fail. The reclaimer will move this job back to pending once the
		// visibility timeout elapses.
		return
	case "fail":
		_, _ = w.queue.Fail(ctx, job, fmt.Sprintf("%s simulated failure", w.name))
		return
	default:
		// "ok"
		ok, err := w.queue.Complete(ctx, job, map[string]any{
			"worker":   w.name,
			"echo":     job.Payload,
			"attempts": job.Attempts,
		})
		if err == nil && ok {
			w.processed.Add(1)
		}
	}
}

func (w *Worker) pickOutcome() string {
	w.mu.Lock()
	roll := w.rng.Float64()
	failRate := w.failRate
	hangRate := w.hangRate
	w.mu.Unlock()
	if roll < hangRate {
		return "hang"
	}
	if roll < hangRate+failRate {
		return "fail"
	}
	return "ok"
}

// WorkerPool is a pool of named Worker goroutines that can be started and
// stopped together.
type WorkerPool struct {
	queue *RedisJobQueue

	mu            sync.Mutex
	workers       []*Worker
	workLatencyMs int
	failRate      float64
	hangRate      float64

	parentCtx context.Context
}

// NewWorkerPool builds a pool sized to size workers. Pass a context that
// outlives the pool (cancelling it will stop every worker).
func NewWorkerPool(ctx context.Context, queue *RedisJobQueue, size, workLatencyMs int, failRate, hangRate float64) *WorkerPool {
	p := &WorkerPool{
		queue:         queue,
		workLatencyMs: workLatencyMs,
		failRate:      failRate,
		hangRate:      hangRate,
		parentCtx:     ctx,
	}
	p.Resize(size)
	return p
}

// Resize grows or shrinks the pool to the requested size. Removed workers
// are stopped.
func (p *WorkerPool) Resize(size int) {
	p.mu.Lock()
	defer p.mu.Unlock()
	for len(p.workers) < size {
		w := NewWorker(
			fmt.Sprintf("worker-%d", len(p.workers)+1),
			p.queue,
			p.workLatencyMs,
			p.failRate,
			p.hangRate,
		)
		p.workers = append(p.workers, w)
	}
	for len(p.workers) > size {
		idx := len(p.workers) - 1
		p.workers[idx].Stop()
		p.workers = p.workers[:idx]
	}
}

// Start applies the current configuration to every worker and starts any
// that aren't already running.
func (p *WorkerPool) Start() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, w := range p.workers {
		w.Configure(p.workLatencyMs, p.failRate, p.hangRate)
		w.Start(p.parentCtx)
	}
}

// Stop signals every worker in the pool to shut down.
func (p *WorkerPool) Stop() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, w := range p.workers {
		w.Stop()
	}
}

// Running counts the workers whose goroutine is currently active.
func (p *WorkerPool) Running() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	n := 0
	for _, w := range p.workers {
		if w.IsAlive() {
			n++
		}
	}
	return n
}

// TotalProcessed sums Processed() across the pool.
func (p *WorkerPool) TotalProcessed() int64 {
	p.mu.Lock()
	defer p.mu.Unlock()
	var n int64
	for _, w := range p.workers {
		n += w.Processed()
	}
	return n
}

// ResetProcessed zeroes every worker's processed counter.
func (p *WorkerPool) ResetProcessed() {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, w := range p.workers {
		w.ResetProcessed()
	}
}

// WorkLatencyMs returns the currently configured latency.
func (p *WorkerPool) WorkLatencyMs() int {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.workLatencyMs
}

// FailRate returns the currently configured failure rate.
func (p *WorkerPool) FailRate() float64 {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.failRate
}

// HangRate returns the currently configured hang rate.
func (p *WorkerPool) HangRate() float64 {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.hangRate
}

// Configure updates one or more pool-wide knobs. Pass nil to leave a
// value unchanged.
func (p *WorkerPool) Configure(workLatencyMs *int, failRate, hangRate *float64) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if workLatencyMs != nil {
		v := *workLatencyMs
		if v < 0 {
			v = 0
		}
		p.workLatencyMs = v
	}
	if failRate != nil {
		v := *failRate
		if v < 0 {
			v = 0
		}
		if v > 1 {
			v = 1
		}
		p.failRate = v
	}
	if hangRate != nil {
		v := *hangRate
		if v < 0 {
			v = 0
		}
		if v > 1 {
			v = 1
		}
		p.hangRate = v
	}
	for _, w := range p.workers {
		w.Configure(p.workLatencyMs, p.failRate, p.hangRate)
	}
}
