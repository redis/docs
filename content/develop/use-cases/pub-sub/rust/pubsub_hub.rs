//! Redis-backed pub/sub hub helper.
//!
//! Wraps PUBLISH / SUBSCRIBE / PSUBSCRIBE plus the introspection commands
//! (PUBSUB CHANNELS, PUBSUB NUMSUB, PUBSUB NUMPAT) into a small, named API
//! that:
//!
//! * publishes JSON-encoded messages to a channel and counts how many
//!   subscribers Redis reported delivering to
//! * creates named in-process subscribers that own a `redis::aio::PubSub`
//!   connection and a background task pumping messages into a ring buffer
//! * tracks per-channel publish counters and per-subscriber received counts
//!   for the demo UI
//!
//! Pub/sub has at-most-once delivery: a message that arrives while a
//! subscriber is disconnected is gone. If you need persistence or replay,
//! use Redis Streams instead.

use futures_util::StreamExt;
use redis::aio::ConnectionManager;
use redis::{AsyncCommands, Client, RedisResult};
use serde::Serialize;
use serde_json::Value;
use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::sync::oneshot;
use tokio::task::JoinHandle;

/// Maximum number of messages retained per subscriber for UI inspection.
pub const DEFAULT_BUFFER_SIZE: usize = 50;

/// Errors that can be raised by hub operations.
#[derive(Debug)]
pub enum HubError {
    /// A subscription with the same name already exists.
    DuplicateName(String),
    /// Caller passed an empty list of channels or patterns.
    EmptyTargets,
    /// Underlying Redis error.
    Redis(redis::RedisError),
}

impl std::fmt::Display for HubError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            HubError::DuplicateName(name) => {
                write!(f, "subscription named '{}' already exists", name)
            }
            HubError::EmptyTargets => {
                write!(f, "subscription requires at least one channel or pattern")
            }
            HubError::Redis(err) => write!(f, "{}", err),
        }
    }
}

impl std::error::Error for HubError {}

impl From<redis::RedisError> for HubError {
    fn from(err: redis::RedisError) -> Self {
        HubError::Redis(err)
    }
}

/// Message shape delivered to every Subscription's ring buffer. Pattern
/// subscriptions carry the original pattern in `pattern`; exact-match
/// subscriptions leave it None.
#[derive(Debug, Clone, Serialize)]
pub struct ReceivedMessage {
    pub channel: String,
    pub pattern: Option<String>,
    pub payload: Value,
    pub received_at_ms: i64,
}

/// A named in-process subscriber bound to one or more channels or patterns.
///
/// Each `Subscription` owns its own `redis::aio::PubSub` connection and a
/// background tokio task that pumps incoming messages into the ring buffer.
/// Subscriptions are independent: closing one does not affect another, even
/// if they share channels.
pub struct Subscription {
    name: String,
    targets: Vec<String>,
    is_pattern: bool,
    buffer: Mutex<VecDeque<ReceivedMessage>>,
    received: AtomicU64,
    closed: AtomicBool,
    buffer_size: usize,
    // Stop signal for the background task; wrapped so close() can take it.
    stop_tx: Mutex<Option<oneshot::Sender<()>>>,
    // Join handle for the background dispatch task.
    task: Mutex<Option<JoinHandle<()>>>,
}

impl Subscription {
    #[allow(dead_code)]
    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn targets(&self) -> Vec<String> {
        self.targets.clone()
    }

    pub fn is_pattern(&self) -> bool {
        self.is_pattern
    }

    pub fn received_total(&self) -> u64 {
        self.received.load(Ordering::Relaxed)
    }

    /// Return up to `limit` of the most recently received messages, newest first.
    pub fn messages(&self, limit: Option<usize>) -> Vec<ReceivedMessage> {
        let buf = self.buffer.lock().expect("subscription buffer poisoned");
        match limit {
            Some(n) => buf.iter().take(n).cloned().collect(),
            None => buf.iter().cloned().collect(),
        }
    }

    pub fn reset_received(&self) {
        let mut buf = self.buffer.lock().expect("subscription buffer poisoned");
        buf.clear();
        self.received.store(0, Ordering::Relaxed);
    }

    /// Signal the background task to exit and await it. Safe to call more than once.
    pub async fn close(&self) {
        if self.closed.swap(true, Ordering::SeqCst) {
            return;
        }
        let stop_tx = self
            .stop_tx
            .lock()
            .expect("subscription stop lock poisoned")
            .take();
        if let Some(tx) = stop_tx {
            // Receiver may have already exited; drop is harmless either way.
            let _ = tx.send(());
        }
        let task = self
            .task
            .lock()
            .expect("subscription task lock poisoned")
            .take();
        if let Some(handle) = task {
            let _ = handle.await;
        }
    }

    pub fn is_alive(&self) -> bool {
        !self.closed.load(Ordering::Relaxed)
    }

    /// Snapshot the subscription's metadata for the demo /state endpoint.
    pub fn to_json(&self) -> Value {
        serde_json::json!({
            "name": self.name,
            "targets": self.targets,
            "is_pattern": self.is_pattern,
            "received_total": self.received_total(),
            "alive": self.is_alive(),
        })
    }
}

/// In-process publisher and registry of named subscriptions.
#[derive(Clone)]
pub struct PubSubHub {
    inner: Arc<HubInner>,
}

struct HubInner {
    client: Client,
    publisher: ConnectionManager,
    introspect: ConnectionManager,
    buffer_size: usize,
    subscriptions: Mutex<HashMap<String, Arc<Subscription>>>,
    published_total: AtomicU64,
    delivered_total: AtomicU64,
    channel_published: Mutex<HashMap<String, u64>>,
}

/// Snapshot of hub-level counters. Serialised with snake_case keys to match
/// the reference Python `/state` payload.
#[derive(Debug, Clone, Serialize)]
pub struct Stats {
    pub published_total: u64,
    pub delivered_total: u64,
    pub received_total: u64,
    pub active_subscriptions: u64,
    pub channel_published: HashMap<String, u64>,
    pub pattern_subscriptions: i64,
}

impl PubSubHub {
    /// Build a hub from a `redis::Client`. The hub creates two
    /// `ConnectionManager`s: one for ordinary commands (PUBLISH, PUBSUB
    /// introspection) and a separate one for the same purposes from
    /// other code paths — sharing across handlers is cheap and safe
    /// because `ConnectionManager` is `Clone`.
    pub async fn new(client: Client, buffer_size: usize) -> RedisResult<Self> {
        let publisher = ConnectionManager::new(client.clone()).await?;
        let introspect = publisher.clone();
        Ok(Self {
            inner: Arc::new(HubInner {
                client,
                publisher,
                introspect,
                buffer_size,
                subscriptions: Mutex::new(HashMap::new()),
                published_total: AtomicU64::new(0),
                delivered_total: AtomicU64::new(0),
                channel_published: Mutex::new(HashMap::new()),
            }),
        })
    }

    /// Publish a JSON-encoded message to `channel` and return Redis'
    /// delivered count (the integer that `PUBLISH` itself returns).
    pub async fn publish(&self, channel: &str, message: &Value) -> RedisResult<i64> {
        let payload = serde_json::to_string(message)
            .unwrap_or_else(|_| serde_json::to_string(&Value::Null).unwrap());
        let mut conn = self.inner.publisher.clone();
        let delivered: i64 = conn.publish(channel, payload).await?;
        self.inner.published_total.fetch_add(1, Ordering::Relaxed);
        self.inner
            .delivered_total
            .fetch_add(delivered as u64, Ordering::Relaxed);
        let mut chan = self
            .inner
            .channel_published
            .lock()
            .expect("channel_published lock poisoned");
        *chan.entry(channel.to_string()).or_insert(0) += 1;
        Ok(delivered)
    }

    /// Register a named exact-match subscription on one or more channels.
    pub async fn subscribe(
        &self,
        name: &str,
        channels: Vec<String>,
    ) -> Result<Arc<Subscription>, HubError> {
        self.register(name, channels, false).await
    }

    /// Register a named pattern subscription on one or more glob patterns.
    pub async fn psubscribe(
        &self,
        name: &str,
        patterns: Vec<String>,
    ) -> Result<Arc<Subscription>, HubError> {
        self.register(name, patterns, true).await
    }

    async fn register(
        &self,
        name: &str,
        targets: Vec<String>,
        is_pattern: bool,
    ) -> Result<Arc<Subscription>, HubError> {
        if targets.is_empty() {
            return Err(HubError::EmptyTargets);
        }
        {
            let subs = self
                .inner
                .subscriptions
                .lock()
                .expect("subscriptions lock poisoned");
            if subs.contains_key(name) {
                return Err(HubError::DuplicateName(name.to_string()));
            }
        }

        // Each subscription owns its own pub/sub connection. Sharing one
        // connection across subscribers would couple their lifetimes —
        // closing one would close the channel for the others.
        let mut pubsub = self.inner.client.get_async_pubsub().await?;
        if is_pattern {
            for pattern in &targets {
                pubsub.psubscribe(pattern).await?;
            }
        } else {
            for channel in &targets {
                pubsub.subscribe(channel).await?;
            }
        }

        let (stop_tx, stop_rx) = oneshot::channel();
        let sub = Arc::new(Subscription {
            name: name.to_string(),
            targets: targets.clone(),
            is_pattern,
            buffer: Mutex::new(VecDeque::with_capacity(self.inner.buffer_size)),
            received: AtomicU64::new(0),
            closed: AtomicBool::new(false),
            buffer_size: self.inner.buffer_size,
            stop_tx: Mutex::new(Some(stop_tx)),
            task: Mutex::new(None),
        });

        // The spawned task owns `pubsub`. The Stream returned by
        // `pubsub.on_message()` borrows from `pubsub`, so the task body
        // is built around that local borrow — moving the PubSub out
        // mid-task would invalidate the stream.
        let sub_for_task = sub.clone();
        let targets_for_task = targets.clone();
        let handle = tokio::spawn(async move {
            // Block keeps the `stream` borrow (which holds &mut pubsub)
            // confined so we can call unsubscribe afterwards.
            {
                let mut stop_rx = stop_rx;
                let mut stream = pubsub.on_message();
                loop {
                    tokio::select! {
                        biased;
                        _ = &mut stop_rx => break,
                        next = stream.next() => {
                            match next {
                                Some(msg) => dispatch(&sub_for_task, &msg),
                                None => break,
                            }
                        }
                    }
                }
            }
            // Best-effort clean-up so Redis releases the channel slot
            // before the connection actually drops. Ignore errors: the
            // connection may already be closing.
            for target in &targets_for_task {
                if is_pattern {
                    let _ = pubsub.punsubscribe(target).await;
                } else {
                    let _ = pubsub.unsubscribe(target).await;
                }
            }
            drop(pubsub);
        });

        sub.task
            .lock()
            .expect("subscription task lock poisoned")
            .replace(handle);

        let mut subs = self
            .inner
            .subscriptions
            .lock()
            .expect("subscriptions lock poisoned");
        subs.insert(name.to_string(), sub.clone());
        Ok(sub)
    }

    /// Close and remove the named subscription. Returns true if it existed.
    pub async fn unsubscribe(&self, name: &str) -> bool {
        let sub = {
            let mut subs = self
                .inner
                .subscriptions
                .lock()
                .expect("subscriptions lock poisoned");
            subs.remove(name)
        };
        match sub {
            Some(s) => {
                s.close().await;
                true
            }
            None => false,
        }
    }

    pub fn subscriptions(&self) -> Vec<Arc<Subscription>> {
        let subs = self
            .inner
            .subscriptions
            .lock()
            .expect("subscriptions lock poisoned");
        subs.values().cloned().collect()
    }

    #[allow(dead_code)]
    pub fn get_subscription(&self, name: &str) -> Option<Arc<Subscription>> {
        let subs = self
            .inner
            .subscriptions
            .lock()
            .expect("subscriptions lock poisoned");
        subs.get(name).cloned()
    }

    /// PUBSUB CHANNELS — list channels with at least one exact-match subscriber.
    pub async fn active_channels(&self, pattern: &str) -> RedisResult<Vec<String>> {
        let mut conn = self.inner.introspect.clone();
        let channels: Vec<String> = redis::cmd("PUBSUB")
            .arg("CHANNELS")
            .arg(pattern)
            .query_async(&mut conn)
            .await?;
        let mut sorted = channels;
        sorted.sort();
        Ok(sorted)
    }

    /// PUBSUB NUMSUB — subscriber count per channel (exact-match only).
    pub async fn channel_subscriber_counts(
        &self,
        channels: &[String],
    ) -> RedisResult<HashMap<String, i64>> {
        if channels.is_empty() {
            return Ok(HashMap::new());
        }
        let mut conn = self.inner.introspect.clone();
        let mut cmd = redis::cmd("PUBSUB");
        cmd.arg("NUMSUB");
        for ch in channels {
            cmd.arg(ch);
        }
        let pairs: Vec<(String, i64)> = cmd.query_async(&mut conn).await?;
        Ok(pairs.into_iter().collect())
    }

    /// PUBSUB NUMPAT — total active pattern subscriptions across all clients.
    pub async fn pattern_subscriber_count(&self) -> RedisResult<i64> {
        let mut conn = self.inner.introspect.clone();
        let n: i64 = redis::cmd("PUBSUB")
            .arg("NUMPAT")
            .query_async(&mut conn)
            .await?;
        Ok(n)
    }

    /// Combined publish and subscribe counters plus the current registry size.
    pub async fn stats(&self) -> Stats {
        let subs = self.subscriptions();
        let received_total: u64 = subs.iter().map(|s| s.received_total()).sum();
        let channel_published = self
            .inner
            .channel_published
            .lock()
            .expect("channel_published lock poisoned")
            .clone();
        let pattern_subscriptions = self.pattern_subscriber_count().await.unwrap_or(0);
        Stats {
            published_total: self.inner.published_total.load(Ordering::Relaxed),
            delivered_total: self.inner.delivered_total.load(Ordering::Relaxed),
            received_total,
            active_subscriptions: subs.len() as u64,
            channel_published,
            pattern_subscriptions,
        }
    }

    /// Reset publish/delivery counters and clear every subscription's buffer.
    pub fn reset_stats(&self) {
        self.inner.published_total.store(0, Ordering::Relaxed);
        self.inner.delivered_total.store(0, Ordering::Relaxed);
        self.inner
            .channel_published
            .lock()
            .expect("channel_published lock poisoned")
            .clear();
        for sub in self.subscriptions() {
            sub.reset_received();
        }
    }

    /// Close every active subscription. Safe to call more than once.
    pub async fn shutdown(&self) {
        let subs: Vec<Arc<Subscription>> = {
            let mut map = self
                .inner
                .subscriptions
                .lock()
                .expect("subscriptions lock poisoned");
            let drained: Vec<Arc<Subscription>> = map.values().cloned().collect();
            map.clear();
            drained
        };
        for sub in subs {
            sub.close().await;
        }
    }
}

// The redis::Msg delivered by `on_message` carries the channel name as a
// `&str` borrow into the underlying connection buffer; we copy out into an
// owned ReceivedMessage so the lifetime is no longer tied to the stream.
fn dispatch(sub: &Arc<Subscription>, msg: &redis::Msg) {
    let channel = msg.get_channel_name().to_string();
    let pattern = msg.get_pattern::<String>().ok();
    let raw_payload: String = msg.get_payload().unwrap_or_default();
    let payload: Value = serde_json::from_str(&raw_payload).unwrap_or(Value::String(raw_payload));
    let received_at_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    let message = ReceivedMessage {
        channel,
        pattern,
        payload,
        received_at_ms,
    };
    let mut buf = sub.buffer.lock().expect("subscription buffer poisoned");
    if buf.len() == sub.buffer_size {
        buf.pop_back();
    }
    buf.push_front(message);
    sub.received.fetch_add(1, Ordering::Relaxed);
}
