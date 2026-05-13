//! Background sync worker for the prefetch-cache demo.
//!
//! A long-running tokio task drains the primary's change queue and
//! applies each event to Redis through `PrefetchCache::apply_change`.
//! In a real system, the queue is replaced by a CDC pipeline (Redis
//! Data Integration, Debezium, or an equivalent) that tails the
//! primary's binlog/WAL and writes the same shape of events.
//!
//! The worker exposes `pause()` and `resume()` so maintenance paths
//! (`/reprefetch`, `clear()`) can stop event application without
//! tearing the task down. `pause()` blocks until the worker is
//! parked, so the caller knows no apply is in flight by the time it
//! returns.

use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{watch, Mutex, Notify};
use tokio::task::JoinHandle;

use crate::cache::PrefetchCache;
use crate::primary::MockPrimaryStore;

#[derive(Clone)]
struct WorkerState {
    pause_tx: watch::Sender<bool>,
    pause_rx: watch::Receiver<bool>,
    stop_tx: watch::Sender<bool>,
    stop_rx: watch::Receiver<bool>,
    idle_notify: Arc<Notify>,
}

pub struct SyncWorker {
    primary: Arc<MockPrimaryStore>,
    cache: PrefetchCache,
    poll_timeout: Duration,
    state: Mutex<Option<WorkerState>>,
    handle: Mutex<Option<JoinHandle<()>>>,
}

impl SyncWorker {
    pub fn new(
        primary: Arc<MockPrimaryStore>,
        cache: PrefetchCache,
    ) -> Self {
        Self {
            primary,
            cache,
            poll_timeout: Duration::from_millis(50),
            state: Mutex::new(None),
            handle: Mutex::new(None),
        }
    }

    pub async fn start(self: &Arc<Self>) {
        let mut handle_guard = self.handle.lock().await;
        if let Some(h) = handle_guard.as_ref() {
            if !h.is_finished() {
                return;
            }
        }

        let (pause_tx, pause_rx) = watch::channel(false);
        let (stop_tx, stop_rx) = watch::channel(false);
        let idle_notify = Arc::new(Notify::new());

        let state = WorkerState {
            pause_tx,
            pause_rx,
            stop_tx,
            stop_rx,
            idle_notify,
        };

        {
            let mut s = self.state.lock().await;
            *s = Some(state.clone());
        }

        let primary = self.primary.clone();
        let cache = self.cache.clone();
        let poll_timeout = self.poll_timeout;
        let run_state = state.clone();
        let handle = tokio::spawn(async move {
            run_loop(primary, cache, poll_timeout, run_state).await;
        });
        *handle_guard = Some(handle);
    }

    /// Signal the worker to exit and join its task. If the join times
    /// out the worker is wedged inside `apply_change`; we leave the
    /// handle populated so a subsequent `start()` does not spawn a
    /// second worker on top of the orphan.
    pub async fn stop(&self, join_timeout: Duration) {
        if let Some(state) = self.state.lock().await.as_ref() {
            let _ = state.stop_tx.send(true);
        }
        let mut handle_guard = self.handle.lock().await;
        if let Some(h) = handle_guard.as_mut() {
            match tokio::time::timeout(join_timeout, h).await {
                Ok(_) => {
                    *handle_guard = None;
                }
                Err(_) => {
                    // Timed out; leave the handle in place so a future
                    // start() will see it as still running and refuse
                    // to spawn a second worker on top of the orphan.
                }
            }
        }
    }

    /// Stop applying events and block until the worker is parked.
    /// Returns `true` once the worker has confirmed it is idle, or
    /// `false` if the timeout elapsed first. While paused, change
    /// events accumulate in the primary's queue and are applied in
    /// order after `resume()`.
    pub async fn pause(&self, timeout: Duration) -> bool {
        let state = {
            let guard = self.state.lock().await;
            match guard.as_ref() {
                Some(s) => s.clone(),
                None => return true,
            }
        };

        // Check whether the task is still alive — if it's already
        // exited or never started, treat that as "paused".
        let handle_alive = {
            let h = self.handle.lock().await;
            h.as_ref().map(|j| !j.is_finished()).unwrap_or(false)
        };
        if !handle_alive {
            let _ = state.pause_tx.send(true);
            return true;
        }

        // Subscribe to the idle notification BEFORE we flip the pause
        // flag, so we cannot miss a notification that fires between
        // the flag flip and `notified().await`.
        let notify = state.idle_notify.clone();
        let notified = notify.notified();
        tokio::pin!(notified);
        let _ = state.pause_tx.send(true);

        // If the worker is already parked, the notification may have
        // happened before we subscribed; re-check by peeking at the
        // pause state from the worker's side. The worker re-emits
        // `notify_one` on each pass through the park loop, so the
        // worst case is a one-poll-cycle wait.
        match tokio::time::timeout(timeout, &mut notified).await {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    pub async fn resume(&self) {
        if let Some(state) = self.state.lock().await.as_ref() {
            let _ = state.pause_tx.send(false);
        }
    }
}

async fn run_loop(
    primary: Arc<MockPrimaryStore>,
    cache: PrefetchCache,
    poll_timeout: Duration,
    state: WorkerState,
) {
    let WorkerState {
        pause_tx: _,
        mut pause_rx,
        stop_tx: _,
        mut stop_rx,
        idle_notify,
    } = state;

    loop {
        if *stop_rx.borrow() {
            return;
        }
        if *pause_rx.borrow() {
            // Park until the pause is lifted or the worker is stopped.
            // Re-notify on every iteration so a *new* pause() that
            // subscribes while we are still parked from the previous
            // cycle gets a wake-up within one poll interval, not after
            // the caller's full pause-timeout.
            loop {
                if *stop_rx.borrow() {
                    return;
                }
                if !*pause_rx.borrow() {
                    break;
                }
                idle_notify.notify_waiters();
                tokio::select! {
                    _ = pause_rx.changed() => {}
                    _ = stop_rx.changed() => {}
                    _ = tokio::time::sleep(poll_timeout) => {}
                }
            }
            continue;
        }

        let change = primary.next_change(poll_timeout).await;
        let change = match change {
            Some(c) => c,
            None => continue,
        };
        if let Err(err) = cache.apply_change(&change).await {
            // Demo behaviour: log and drop the event. A production
            // CDC consumer would retry with bounded backoff and
            // expose a dead-letter / error counter; see the guide's
            // "Production usage" section.
            eprintln!(
                "[sync] failed to apply {:?} id={}: {}",
                change.op, change.id, err
            );
        }
    }
}
