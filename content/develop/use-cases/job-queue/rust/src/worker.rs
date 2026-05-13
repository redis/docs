//! Mock background worker for the job-queue demo.
//!
//! A worker pulls jobs off the queue, simulates work by sleeping for a
//! configurable latency, and either completes the job, fails it, or
//! intentionally hangs to simulate a worker crash that the reclaimer must
//! recover from. This is the demo-side stand-in for whatever real work your
//! application would run in the background (sending emails, transcoding
//! video, calling third-party webhooks, etc.).

use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use rand::Rng;
use serde_json::json;
use tokio::sync::{watch, Mutex};
use tokio::task::JoinHandle;

use crate::job_queue::{ClaimedJob, RedisJobQueue};

/// Knobs shared by every worker in a pool. Held under a mutex so the demo
/// server can adjust them at runtime.
#[derive(Clone, Debug)]
pub struct WorkerConfig {
    pub work_latency_ms: u64,
    pub fail_rate: f64,
    pub hang_rate: f64,
}

impl Default for WorkerConfig {
    fn default() -> Self {
        Self {
            work_latency_ms: 400,
            fail_rate: 0.0,
            hang_rate: 0.0,
        }
    }
}

/// A single background worker task.
struct Worker {
    name: String,
    queue: RedisJobQueue,
    config: Arc<Mutex<WorkerConfig>>,
    stop_rx: watch::Receiver<bool>,
    processed: Arc<AtomicI64>,
}

impl Worker {
    fn new(
        name: String,
        queue: RedisJobQueue,
        config: Arc<Mutex<WorkerConfig>>,
        stop_rx: watch::Receiver<bool>,
    ) -> Self {
        Self {
            name,
            queue,
            config,
            stop_rx,
            processed: Arc::new(AtomicI64::new(0)),
        }
    }

    async fn run(self) {
        while !*self.stop_rx.borrow() {
            let job = match self.queue.claim(500).await {
                Ok(Some(job)) => job,
                Ok(None) => continue,
                Err(err) => {
                    eprintln!("[{}] claim error: {}", self.name, err);
                    tokio::time::sleep(Duration::from_millis(200)).await;
                    continue;
                }
            };

            self.process(job).await;
        }
    }

    async fn process(&self, job: ClaimedJob) {
        let cfg = self.config.lock().await.clone();
        let outcome = pick_outcome(cfg.fail_rate, cfg.hang_rate);
        tokio::time::sleep(Duration::from_millis(cfg.work_latency_ms)).await;

        match outcome {
            Outcome::Hang => {
                // Simulate a worker that crashed mid-job: don't complete,
                // don't fail. The reclaimer will move this job back to
                // pending once the visibility timeout elapses.
            }
            Outcome::Fail => {
                let msg = format!("{} simulated failure", self.name);
                if let Err(err) = self.queue.fail(&job, &msg).await {
                    eprintln!("[{}] fail error: {}", self.name, err);
                }
            }
            Outcome::Ok => {
                self.processed.fetch_add(1, Ordering::Relaxed);
                let result = json!({
                    "worker": self.name,
                    "echo": job.payload,
                    "attempts": job.attempts,
                });
                if let Err(err) = self.queue.complete(&job, result).await {
                    eprintln!("[{}] complete error: {}", self.name, err);
                }
            }
        }
    }
}

enum Outcome {
    Hang,
    Fail,
    Ok,
}

fn pick_outcome(fail_rate: f64, hang_rate: f64) -> Outcome {
    let roll: f64 = rand::thread_rng().gen();
    if roll < hang_rate {
        Outcome::Hang
    } else if roll < hang_rate + fail_rate {
        Outcome::Fail
    } else {
        Outcome::Ok
    }
}

/// A handle to a running worker task plus its shared `processed` counter.
struct WorkerHandle {
    handle: JoinHandle<()>,
    processed: Arc<AtomicI64>,
}

/// A pool of named worker tasks that can be started and stopped.
pub struct WorkerPool {
    queue: RedisJobQueue,
    config: Arc<Mutex<WorkerConfig>>,
    size: Mutex<usize>,
    state: Mutex<PoolState>,
}

struct PoolState {
    handles: Vec<WorkerHandle>,
    stop_tx: Option<watch::Sender<bool>>,
    historical_processed: i64,
}

impl WorkerPool {
    pub fn new(queue: RedisJobQueue, size: usize, config: WorkerConfig) -> Self {
        Self {
            queue,
            config: Arc::new(Mutex::new(config)),
            size: Mutex::new(size),
            state: Mutex::new(PoolState {
                handles: Vec::new(),
                stop_tx: None,
                historical_processed: 0,
            }),
        }
    }

    /// Replace the in-memory size. Workers are not started/stopped here;
    /// call `start` afterwards.
    pub async fn resize(&self, size: usize) {
        let mut current = self.size.lock().await;
        *current = size;
    }

    /// Stop any running workers and spawn a fresh batch at the configured
    /// size. Idempotent: calling it on an already-running pool restarts it
    /// with the latest config.
    pub async fn start(&self) {
        self.stop().await;

        let size = *self.size.lock().await;
        if size == 0 {
            return;
        }

        let (stop_tx, stop_rx) = watch::channel(false);
        let mut handles: Vec<WorkerHandle> = Vec::with_capacity(size);

        for i in 0..size {
            let name = format!("worker-{}", i + 1);
            let worker = Worker::new(
                name,
                self.queue.clone(),
                self.config.clone(),
                stop_rx.clone(),
            );
            let processed = worker.processed.clone();
            let handle = tokio::spawn(worker.run());
            handles.push(WorkerHandle { handle, processed });
        }

        let mut state = self.state.lock().await;
        state.handles = handles;
        state.stop_tx = Some(stop_tx);
    }

    /// Signal workers to stop and wait for them to finish their current
    /// `claim()`/`process()` cycle. Their processed counts are folded into
    /// `historical_processed` so the running total persists across restarts.
    pub async fn stop(&self) {
        let mut state = self.state.lock().await;
        if let Some(tx) = state.stop_tx.take() {
            let _ = tx.send(true);
        }
        let handles = std::mem::take(&mut state.handles);
        let mut historical = state.historical_processed;
        drop(state);

        for h in handles {
            historical += h.processed.load(Ordering::Relaxed);
            let _ = h.handle.await;
        }

        let mut state = self.state.lock().await;
        state.historical_processed = historical;
    }

    /// Number of currently-running worker tasks.
    pub async fn running(&self) -> usize {
        let state = self.state.lock().await;
        state.handles.iter().filter(|h| !h.handle.is_finished()).count()
    }

    /// Sum of jobs processed by the live pool plus any workers from previous
    /// runs (mirrors the Python `total_processed` accumulation).
    pub async fn total_processed(&self) -> i64 {
        let state = self.state.lock().await;
        let live: i64 = state
            .handles
            .iter()
            .map(|h| h.processed.load(Ordering::Relaxed))
            .sum();
        state.historical_processed + live
    }

    /// Zero every live worker's processed counter and clear the historical
    /// accumulation, so `total_processed` returns 0 immediately after.
    pub async fn reset_processed(&self) {
        let mut state = self.state.lock().await;
        for h in &state.handles {
            h.processed.store(0, Ordering::Relaxed);
        }
        state.historical_processed = 0;
    }

    pub async fn config_snapshot(&self) -> WorkerConfig {
        self.config.lock().await.clone()
    }

    pub async fn configure(
        &self,
        work_latency_ms: Option<u64>,
        fail_rate: Option<f64>,
        hang_rate: Option<f64>,
    ) {
        let mut cfg = self.config.lock().await;
        if let Some(latency) = work_latency_ms {
            cfg.work_latency_ms = latency;
        }
        if let Some(rate) = fail_rate {
            cfg.fail_rate = rate.clamp(0.0, 1.0);
        }
        if let Some(rate) = hang_rate {
            cfg.hang_rate = rate.clamp(0.0, 1.0);
        }
    }
}
