//! Streaming feature updater for the demo.
//!
//! Stands in for whatever Flink, Kafka Streams, or bespoke service
//! computes the real-time features in a real deployment. In
//! production this code lives in the streaming layer; here it runs
//! as a tokio task next to the demo server so the UI can start,
//! pause, and resume it.
//!
//! Every tick the worker picks a few random users and writes a new
//! value for each streaming feature, with a per-field `HEXPIRE` so
//! the field self-expires if the worker is paused. Pause it for
//! longer than `streaming_ttl_seconds` and the streaming fields drop
//! out of the hash while the batch fields remain populated under the
//! longer key-level TTL — the *mixed staleness* story made visible.

use std::collections::BTreeMap;
use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use rand::rngs::StdRng;
use rand::seq::SliceRandom;
use rand::{Rng, SeedableRng};
use serde::Serialize;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio::time;

use crate::feature_store::{FeatureMap, FeatureStore, FeatureValue};

const DEVICE_IDS: &[&str] = &[
    "ios-1a4c", "ios-9f02", "and-7b21", "and-2d18",
    "web-chr-1", "web-saf-1", "web-ff-2",
];
const SESSION_COUNTRIES: &[&str] = &[
    "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL",
];
const FAILED_LOGIN_BUCKETS: &[i64] = &[0, 1, 2, 5];
const FAILED_LOGIN_WEIGHTS: &[u32] = &[70, 20, 8, 2];

#[derive(Debug, Clone, Serialize)]
pub struct WorkerStats {
    pub running: bool,
    pub paused: bool,
    pub tick_count: i64,
    pub writes_count: i64,
}

/// Shared state the worker task and the public API both hold.
struct State {
    store: FeatureStore,
    tick: Duration,
    users_per_tick: usize,
    rng: Mutex<StdRng>,
    running: AtomicBool,
    paused: AtomicBool,
    tick_in_flight: AtomicBool,
    tick_count: AtomicI64,
    writes_count: AtomicI64,
    /// Signals the task to exit. Tokio doesn't need a separate done
    /// channel because awaiting the JoinHandle gives us the same
    /// "wait until the task actually exits" semantics.
    stop: AtomicBool,
}

#[derive(Clone)]
pub struct StreamingWorker {
    state: Arc<State>,
    /// Owned by the controlling code so that Stop() can `await` it.
    /// Wrapped in `Mutex<Option<...>>` so `start()` and `stop()` can
    /// swap the handle in and out without consuming the worker.
    handle: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl StreamingWorker {
    pub fn new(
        store: FeatureStore,
        tick: Duration,
        users_per_tick: usize,
        seed: u64,
    ) -> Self {
        let tick = if tick.is_zero() { Duration::from_secs(1) } else { tick };
        let users_per_tick = users_per_tick.max(1);
        Self {
            state: Arc::new(State {
                store,
                tick,
                users_per_tick,
                rng: Mutex::new(StdRng::seed_from_u64(seed)),
                running: AtomicBool::new(false),
                paused: AtomicBool::new(false),
                tick_in_flight: AtomicBool::new(false),
                tick_count: AtomicI64::new(0),
                writes_count: AtomicI64::new(0),
                stop: AtomicBool::new(false),
            }),
            handle: Arc::new(Mutex::new(None)),
        }
    }

    pub fn users_per_tick(&self) -> usize { self.state.users_per_tick }

    /// Spawn the tick task. No-op if already running.
    pub async fn start(&self) {
        if self
            .state
            .running
            .compare_exchange(false, true, Ordering::Relaxed, Ordering::Relaxed)
            .is_err()
        {
            return;
        }
        self.state.paused.store(false, Ordering::Relaxed);
        self.state.stop.store(false, Ordering::Relaxed);
        let state = self.state.clone();
        let handle = tokio::spawn(async move { run(state).await });
        *self.handle.lock().await = Some(handle);
    }

    /// Signal the task to exit, await its JoinHandle, then settle.
    pub async fn stop(&self) {
        if self
            .state
            .running
            .compare_exchange(true, false, Ordering::Relaxed, Ordering::Relaxed)
            .is_err()
        {
            return;
        }
        self.state.stop.store(true, Ordering::Relaxed);
        let mut slot = self.handle.lock().await;
        if let Some(h) = slot.take() {
            let _ = h.await;
        }
        // Final flag reset in case the task panicked before its own
        // `finally`-style cleanup ran.
        self.state.tick_in_flight.store(false, Ordering::Relaxed);
    }

    pub fn pause(&self) { self.state.paused.store(true, Ordering::Relaxed); }
    pub fn resume(&self) { self.state.paused.store(false, Ordering::Relaxed); }

    pub fn is_running(&self) -> bool { self.state.running.load(Ordering::Relaxed) }
    pub fn is_paused(&self) -> bool { self.state.paused.load(Ordering::Relaxed) }

    /// Block until any in-flight tick has finished. `pause()` only
    /// stops *future* ticks from running; this is what callers (a
    /// reset that's about to DEL every entity, for example) use to
    /// flush a mid-flight tick before they touch state the tick
    /// might still be writing to.
    pub async fn wait_for_idle(&self) {
        while self.state.tick_in_flight.load(Ordering::Relaxed) {
            tokio::time::sleep(Duration::from_millis(20)).await;
        }
    }

    pub fn stats(&self) -> WorkerStats {
        WorkerStats {
            running: self.is_running(),
            paused: self.is_paused(),
            tick_count: self.state.tick_count.load(Ordering::Relaxed),
            writes_count: self.state.writes_count.load(Ordering::Relaxed),
        }
    }

    pub fn reset_stats(&self) {
        self.state.tick_count.store(0, Ordering::Relaxed);
        self.state.writes_count.store(0, Ordering::Relaxed);
    }
}

async fn run(state: Arc<State>) {
    // Clear `running` and `tick_in_flight` no matter how this future
    // exits — a panic in `do_tick`, a manual stop signal, or anything
    // else. Without this, a one-shot failure would leave the worker
    // looking like it's running and refusing to restart.
    struct Guard<'a>(&'a State);
    impl Drop for Guard<'_> {
        fn drop(&mut self) {
            self.0.running.store(false, Ordering::Relaxed);
            self.0.tick_in_flight.store(false, Ordering::Relaxed);
        }
    }
    let _guard = Guard(&state);

    let mut interval = time::interval(state.tick);
    // The first tick fires immediately by default; skip it so we
    // behave like every other client's worker (wait one tick before
    // the first write).
    interval.set_missed_tick_behavior(time::MissedTickBehavior::Skip);
    interval.tick().await;

    loop {
        if state.stop.load(Ordering::Relaxed) { return; }
        interval.tick().await;
        if state.stop.load(Ordering::Relaxed) { return; }

        // Set tick_in_flight *before* the pause check so a concurrent
        // pause()+wait_for_idle() can never observe tick_in_flight=false
        // in the window between the pause check and the actual
        // do_tick call. The flag is cleared in all exit paths below.
        state.tick_in_flight.store(true, Ordering::Relaxed);
        let result = if !state.paused.load(Ordering::Relaxed) {
            do_tick(&state).await
        } else {
            Ok(())
        };
        state.tick_in_flight.store(false, Ordering::Relaxed);
        if let Err(e) = result {
            eprintln!("[streaming-worker] tick failed: {e}");
        }
    }
}

async fn do_tick(state: &State) -> redis::RedisResult<()> {
    let ids = state.store.list_entity_ids(500).await?;
    if ids.is_empty() { return Ok(()); }

    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);

    // Pick `users_per_tick` random IDs without replacement.
    let picks = {
        let mut rng = state.rng.lock().await;
        let mut pool: Vec<&String> = ids.iter().collect();
        pool.shuffle(&mut *rng);
        pool.into_iter()
            .take(state.users_per_tick)
            .cloned()
            .collect::<Vec<_>>()
    };

    let mut writes = 0i64;
    for id in &picks {
        let fields = {
            let mut rng = state.rng.lock().await;
            let mut m: FeatureMap = BTreeMap::new();
            m.insert("last_login_ts".into(), FeatureValue::Int(now_ms));
            m.insert(
                "last_device_id".into(),
                FeatureValue::Str(DEVICE_IDS[rng.gen_range(0..DEVICE_IDS.len())].into()),
            );
            m.insert("tx_count_5m".into(), FeatureValue::Int(rng.gen_range(0..13)));
            m.insert(
                "failed_logins_15m".into(),
                FeatureValue::Int(weighted_pick(&mut *rng, FAILED_LOGIN_BUCKETS, FAILED_LOGIN_WEIGHTS)),
            );
            m.insert(
                "session_country".into(),
                FeatureValue::Str(SESSION_COUNTRIES[rng.gen_range(0..SESSION_COUNTRIES.len())].into()),
            );
            m
        };
        state
            .store
            .update_streaming(id, &fields, state.store.streaming_ttl_seconds())
            .await?;
        writes += fields.len() as i64;
    }
    state.tick_count.fetch_add(1, Ordering::Relaxed);
    state.writes_count.fetch_add(writes, Ordering::Relaxed);
    Ok(())
}

fn weighted_pick<R: Rng + ?Sized>(rng: &mut R, items: &[i64], weights: &[u32]) -> i64 {
    let total: u32 = weights.iter().sum();
    let mut r = rng.gen_range(0..total);
    for (i, w) in weights.iter().enumerate() {
        if r < *w { return items[i]; }
        r -= w;
    }
    items[items.len() - 1]
}
