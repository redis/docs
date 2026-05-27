//! Background consumer task for a single consumer in a consumer group.
//!
//! Each worker owns a tokio task that loops on `XREADGROUP >` with a
//! short block timeout and acks every entry it processes. Recovery of
//! stuck PEL entries (this consumer's, or anyone else's) happens
//! through `reap_idle_pel()`, which is the textbook Streams pattern:
//! each consumer periodically (or on demand) calls `XAUTOCLAIM` with
//! itself as the target, then processes whatever it claimed. The
//! demo's "XAUTOCLAIM to selected" button is exactly that call.
//!
//! Two demo-only levers are wired into the loop:
//!
//! * `pause()` parks the worker (so its pending entries age into the
//!   `XAUTOCLAIM` window without being consumed by `>` reads).
//! * `crash_next(n)` tells the worker to drop its next `n` deliveries
//!   on the floor without acking them — the same effect as a worker
//!   process dying mid-message. Those entries stay in the group's PEL
//!   until `reap_idle_pel` recovers them.
//!
//! Real consumers do not need either lever; they only need
//! `XREADGROUP` → process → `XACK` in `_run` and a periodic
//! `reap_idle_pel` call to recover stuck entries.

use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use std::time::Duration;

use serde::Serialize;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;

use crate::event_stream::{Entry, EventStream};

/// One row in the worker's "recent activity" tail. The demo UI renders
/// it as a small badge stack so you can see whether the entry was
/// acked or dropped on the floor.
#[derive(Debug, Clone, Serialize)]
pub struct RecentEntry {
    pub id: String,
    #[serde(rename = "type")]
    pub event_type: String,
    pub fields: HashMap<String, String>,
    pub acked: bool,
    pub note: String,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct ConsumerStatus {
    pub name: String,
    pub group: String,
    pub processed: u64,
    pub reaped: u64,
    pub crashed_drops: u64,
    pub paused: bool,
    pub crash_queued: u64,
    pub alive: bool,
}

/// Result of one `XAUTOCLAIM(self) + process` pass.
#[derive(Debug, Clone, Serialize, Default)]
pub struct ReapResult {
    pub claimed: u64,
    pub processed: u64,
    pub deleted_ids: Vec<String>,
}

#[derive(Default)]
struct WorkerInner {
    recent: VecDeque<RecentEntry>,
    processed: u64,
    reaped: u64,
    crashed_drops: u64,
    crash_next: u64,
    paused: bool,
    stop: bool,
}

/// One consumer in a consumer group, running on its own tokio task.
///
/// Cheap to clone (`Arc<...>`). Hold one per registered consumer in the
/// demo's `(group, name)` registry.
pub struct ConsumerWorker {
    stream: EventStream,
    pub group: String,
    pub name: String,
    process_latency: Duration,
    recent_capacity: usize,
    inner: Mutex<WorkerInner>,
    handle: Mutex<Option<JoinHandle<()>>>,
}

impl ConsumerWorker {
    pub fn new(
        stream: EventStream,
        group: impl Into<String>,
        name: impl Into<String>,
    ) -> Arc<Self> {
        Arc::new(Self {
            stream,
            group: group.into(),
            name: name.into(),
            process_latency: Duration::from_millis(25),
            recent_capacity: 20,
            inner: Mutex::new(WorkerInner::default()),
            handle: Mutex::new(None),
        })
    }

    // ------------------------------------------------------------------
    // Lifecycle
    // ------------------------------------------------------------------

    /// Spawn the read-process-ack loop on a tokio task. Calling
    /// `start()` on a worker that's already running is a no-op.
    pub async fn start(self: &Arc<Self>) {
        let mut handle_guard = self.handle.lock().await;
        if let Some(h) = handle_guard.as_ref() {
            if !h.is_finished() {
                return;
            }
        }
        {
            let mut inner = self.inner.lock().await;
            inner.stop = false;
        }
        let me = Arc::clone(self);
        let handle = tokio::spawn(async move {
            me.run_loop().await;
        });
        *handle_guard = Some(handle);
    }

    /// Set the stop flag and wait briefly for the task to exit. We do
    /// not `abort()` the task — letting it exit at the next loop iter
    /// lets any in-flight ack complete.
    pub async fn stop(&self) {
        {
            let mut inner = self.inner.lock().await;
            inner.stop = true;
        }
        let mut handle_guard = self.handle.lock().await;
        if let Some(h) = handle_guard.as_mut() {
            // The read loop blocks for up to 500ms in `consume`; give
            // it a beat to wake up and check the stop flag.
            let _ = tokio::time::timeout(Duration::from_secs(2), h).await;
        }
        *handle_guard = None;
    }

    // ------------------------------------------------------------------
    // Demo levers
    // ------------------------------------------------------------------

    #[allow(dead_code)]
    pub async fn pause(&self) {
        let mut inner = self.inner.lock().await;
        inner.paused = true;
    }

    #[allow(dead_code)]
    pub async fn resume(&self) {
        let mut inner = self.inner.lock().await;
        inner.paused = false;
    }

    /// Drop the next `count` deliveries without acking them.
    ///
    /// The entries stay in the group's PEL with their delivery counter
    /// incremented, so `XAUTOCLAIM` can recover them once they exceed
    /// the idle threshold.
    pub async fn crash_next(&self, count: u64) {
        let mut inner = self.inner.lock().await;
        inner.crash_next = inner.crash_next.saturating_add(count);
    }

    // ------------------------------------------------------------------
    // Introspection
    // ------------------------------------------------------------------

    pub async fn recent(&self) -> Vec<RecentEntry> {
        let inner = self.inner.lock().await;
        inner.recent.iter().cloned().collect()
    }

    pub async fn status(&self) -> ConsumerStatus {
        let inner = self.inner.lock().await;
        let alive = {
            let handle = self.handle.lock().await;
            handle.as_ref().map(|h| !h.is_finished()).unwrap_or(false)
        };
        ConsumerStatus {
            name: self.name.clone(),
            group: self.group.clone(),
            processed: inner.processed,
            reaped: inner.reaped,
            crashed_drops: inner.crashed_drops,
            paused: inner.paused,
            crash_queued: inner.crash_next,
            alive,
        }
    }

    // ------------------------------------------------------------------
    // Recovery
    // ------------------------------------------------------------------

    /// Run `XAUTOCLAIM` into self and process the claimed entries.
    ///
    /// Returns a summary with `claimed`, `processed`, and `deleted_ids`
    /// counts. Safe to call from any task — the heavy lifting is
    /// `EventStream::autoclaim` (a Redis call) plus the per-entry
    /// dispatch via `dispatch_locked`.
    ///
    /// `deleted_ids` are PEL entries whose stream payload was already
    /// trimmed by `MAXLEN ~` / `XTRIM` before the sweep ran. Redis 7+
    /// removes them from the PEL inside `XAUTOCLAIM` itself, so the
    /// caller does not have to `XACK` them; they are reported so the
    /// caller can route them to a dead-letter store.
    pub async fn reap_idle_pel(&self) -> ReapResult {
        let (claimed, deleted) = match self
            .stream
            .autoclaim(&self.group, &self.name, 100, "0-0", 10)
            .await
        {
            Ok(v) => v,
            Err(err) => {
                eprintln!(
                    "[{}/{}] reap: XAUTOCLAIM failed: {}",
                    self.group, self.name, err
                );
                return ReapResult::default();
            }
        };
        let mut processed: u64 = 0;
        for (entry_id, fields) in claimed.iter() {
            // Reap path: handle each entry inline. Sleep first to match
            // the read-loop processing latency, then ack-or-drop in the
            // same code path the read loop uses.
            tokio::time::sleep(self.process_latency).await;
            match self.handle_entry(entry_id.clone(), fields.clone()).await {
                Ok(()) => {
                    processed += 1;
                }
                Err(err) => {
                    eprintln!(
                        "[{}/{}] reap failed on {}: {}",
                        self.group, self.name, entry_id, err
                    );
                }
            }
        }
        {
            let mut inner = self.inner.lock().await;
            inner.reaped = inner.reaped.saturating_add(processed);
        }
        ReapResult {
            claimed: claimed.len() as u64,
            processed,
            deleted_ids: deleted,
        }
    }

    // ------------------------------------------------------------------
    // Main loop
    // ------------------------------------------------------------------

    async fn run_loop(self: Arc<Self>) {
        loop {
            // Snapshot the demo-flag state under one short lock to keep
            // the hot path lock-free.
            let (stop, paused) = {
                let inner = self.inner.lock().await;
                (inner.stop, inner.paused)
            };
            if stop {
                return;
            }
            if paused {
                tokio::time::sleep(Duration::from_millis(50)).await;
                continue;
            }

            let entries: Vec<Entry> =
                match self.stream.consume(&self.group, &self.name, 10, 500).await {
                    Ok(v) => v,
                    Err(err) => {
                        // Don't kill the task on a transient Redis
                        // error; a real consumer would log this and
                        // back off.
                        eprintln!(
                            "[{}/{}] read failed: {}",
                            self.group, self.name, err
                        );
                        tokio::time::sleep(Duration::from_millis(500)).await;
                        continue;
                    }
                };

            for (entry_id, fields) in entries {
                self.dispatch(entry_id, fields).await;
            }
        }
    }

    async fn dispatch(&self, entry_id: String, fields: HashMap<String, String>) {
        if !self.process_latency.is_zero() {
            tokio::time::sleep(self.process_latency).await;
        }
        if let Err(err) = self.handle_entry(entry_id.clone(), fields.clone()).await {
            // A failure here (typically XACK against Redis) must not
            // kill the spawned task — that would silently halt this
            // consumer while every other entry sat in its PEL waiting
            // for XAUTOCLAIM. The entry stays unacked; the next
            // ``reap_idle_pel`` call (here or on any consumer in the
            // group) can recover it once it exceeds the idle threshold.
            eprintln!(
                "[{}/{}] failed to handle {}: {}",
                self.group, self.name, entry_id, err
            );
            let event_type = fields.get("type").cloned().unwrap_or_default();
            let entry = RecentEntry {
                id: entry_id,
                event_type,
                fields,
                acked: false,
                note: format!("handler error: {}", err),
            };
            self.push_recent(entry).await;
        }
    }

    /// Handle one entry. Returns `Err` only if Redis itself failed
    /// (so the caller can log and *not* tear the task down). A drop
    /// (simulated crash) is success from the task's point of view —
    /// the entry stays in the PEL on purpose.
    async fn handle_entry(
        &self,
        entry_id: String,
        fields: HashMap<String, String>,
    ) -> Result<(), redis::RedisError> {
        // Pull the drop decision under one short lock, then act.
        let drop = {
            let mut inner = self.inner.lock().await;
            if inner.crash_next > 0 {
                inner.crash_next -= 1;
                true
            } else {
                false
            }
        };

        if drop {
            let event_type = fields.get("type").cloned().unwrap_or_default();
            let entry = RecentEntry {
                id: entry_id,
                event_type,
                fields,
                acked: false,
                note: "dropped (simulated crash)".to_string(),
            };
            {
                let mut inner = self.inner.lock().await;
                inner.crashed_drops = inner.crashed_drops.saturating_add(1);
            }
            self.push_recent(entry).await;
            return Ok(());
        }

        self.stream.ack(&self.group, vec![entry_id.clone()]).await?;
        let event_type = fields.get("type").cloned().unwrap_or_default();
        let entry = RecentEntry {
            id: entry_id,
            event_type,
            fields,
            acked: true,
            note: String::new(),
        };
        {
            let mut inner = self.inner.lock().await;
            inner.processed = inner.processed.saturating_add(1);
        }
        self.push_recent(entry).await;
        Ok(())
    }

    async fn push_recent(&self, entry: RecentEntry) {
        let mut inner = self.inner.lock().await;
        inner.recent.push_front(entry);
        while inner.recent.len() > self.recent_capacity {
            inner.recent.pop_back();
        }
    }
}
