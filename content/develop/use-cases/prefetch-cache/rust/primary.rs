//! Mock primary data store for the prefetch-cache demo.
//!
//! This stands in for a source-of-truth database (Postgres, MySQL,
//! Mongo, etc.) that holds reference data the application serves to
//! users.
//!
//! Every mutation appends a change event to an in-process queue, which
//! the sync worker drains and applies to Redis. In a real system the
//! queue is replaced by a CDC pipeline — Redis Data Integration,
//! Debezium plus a lightweight consumer, or an equivalent tool that
//! tails the source's binlog/WAL and pushes changes into Redis.
//!
//! The store also exposes `read_latency_ms` so the demo can illustrate
//! how much slower a direct primary read would be than a Redis hit.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::{mpsc, Mutex};

pub const CHANGE_OP_UPSERT: &str = "upsert";
pub const CHANGE_OP_DELETE: &str = "delete";

#[derive(Debug, Clone)]
pub struct ChangeEvent {
    pub op: String,
    pub id: String,
    pub fields: Option<HashMap<String, String>>,
    pub timestamp_ms: f64,
}

struct Inner {
    records: HashMap<String, HashMap<String, String>>,
    tx: mpsc::UnboundedSender<ChangeEvent>,
}

pub struct MockPrimaryStore {
    pub read_latency_ms: u64,
    reads: AtomicU64,
    inner: Mutex<Inner>,
    rx: Mutex<mpsc::UnboundedReceiver<ChangeEvent>>,
}

impl MockPrimaryStore {
    pub fn new(read_latency_ms: u64) -> Arc<Self> {
        let (tx, rx) = mpsc::unbounded_channel::<ChangeEvent>();
        let mut records: HashMap<String, HashMap<String, String>> = HashMap::new();
        records.insert(
            "cat-001".to_string(),
            make_record("cat-001", "Beverages", "1", "true", ""),
        );
        records.insert(
            "cat-002".to_string(),
            make_record("cat-002", "Bakery", "2", "true", ""),
        );
        records.insert(
            "cat-003".to_string(),
            make_record("cat-003", "Pantry Staples", "3", "false", ""),
        );
        records.insert(
            "cat-004".to_string(),
            make_record("cat-004", "Frozen", "4", "false", ""),
        );
        records.insert(
            "cat-005".to_string(),
            make_record("cat-005", "Specialty Cheeses", "5", "false", "cat-002"),
        );

        Arc::new(Self {
            read_latency_ms,
            reads: AtomicU64::new(0),
            inner: Mutex::new(Inner { records, tx }),
            rx: Mutex::new(rx),
        })
    }

    pub async fn list_ids(&self) -> Vec<String> {
        // Metadata-only query: no sleep, no counter increment.
        let inner = self.inner.lock().await;
        let mut ids: Vec<String> = inner.records.keys().cloned().collect();
        ids.sort();
        ids
    }

    /// Return every record. Used by the cache's bulk-load path on startup.
    pub async fn list_records(&self) -> Vec<HashMap<String, String>> {
        tokio::time::sleep(Duration::from_millis(self.read_latency_ms)).await;
        self.reads.fetch_add(1, Ordering::Relaxed);
        let inner = self.inner.lock().await;
        inner.records.values().cloned().collect()
    }

    /// Single-record read. Not on the demo's normal read path.
    #[allow(dead_code)]
    pub async fn read(&self, entity_id: &str) -> Option<HashMap<String, String>> {
        tokio::time::sleep(Duration::from_millis(self.read_latency_ms)).await;
        self.reads.fetch_add(1, Ordering::Relaxed);
        let inner = self.inner.lock().await;
        inner.records.get(entity_id).cloned()
    }

    pub async fn add_record(&self, record: HashMap<String, String>) -> bool {
        let entity_id = match record.get("id") {
            Some(v) if !v.is_empty() => v.clone(),
            _ => return false,
        };
        let mut inner = self.inner.lock().await;
        if inner.records.contains_key(&entity_id) {
            return false;
        }
        inner.records.insert(entity_id.clone(), record.clone());
        // Emit while the lock is held so the queue order matches the
        // mutation order. Two concurrent callers cannot interleave
        // mutation A → mutation B → emit B → emit A.
        emit_locked(&inner.tx, CHANGE_OP_UPSERT, &entity_id, Some(record));
        true
    }

    pub async fn update_field(&self, entity_id: &str, field: &str, value: &str) -> bool {
        let mut inner = self.inner.lock().await;
        let snapshot = match inner.records.get_mut(entity_id) {
            Some(record) => {
                record.insert(field.to_string(), value.to_string());
                record.clone()
            }
            None => return false,
        };
        emit_locked(&inner.tx, CHANGE_OP_UPSERT, entity_id, Some(snapshot));
        true
    }

    pub async fn delete_record(&self, entity_id: &str) -> bool {
        let mut inner = self.inner.lock().await;
        if inner.records.remove(entity_id).is_none() {
            return false;
        }
        emit_locked(&inner.tx, CHANGE_OP_DELETE, entity_id, None);
        true
    }

    /// Block up to `timeout` for the next change event.
    pub async fn next_change(&self, timeout: Duration) -> Option<ChangeEvent> {
        let mut rx = self.rx.lock().await;
        match tokio::time::timeout(timeout, rx.recv()).await {
            Ok(Some(event)) => Some(event),
            Ok(None) => None,
            Err(_) => None,
        }
    }

    pub fn reads(&self) -> u64 {
        self.reads.load(Ordering::Relaxed)
    }

    pub fn reset_reads(&self) {
        self.reads.store(0, Ordering::Relaxed);
    }
}

/// Append a change event to the feed. Caller must hold the mutation
/// lock. Holding the lock here is what guarantees that the queue order
/// matches the order in which the records map was mutated.
fn emit_locked(
    tx: &mpsc::UnboundedSender<ChangeEvent>,
    op: &str,
    entity_id: &str,
    fields: Option<HashMap<String, String>>,
) {
    let _ = tx.send(ChangeEvent {
        op: op.to_string(),
        id: entity_id.to_string(),
        fields,
        timestamp_ms: now_unix_ms(),
    });
}

fn make_record(
    id: &str,
    name: &str,
    display_order: &str,
    featured: &str,
    parent_id: &str,
) -> HashMap<String, String> {
    let mut m = HashMap::new();
    m.insert("id".to_string(), id.to_string());
    m.insert("name".to_string(), name.to_string());
    m.insert("display_order".to_string(), display_order.to_string());
    m.insert("featured".to_string(), featured.to_string());
    m.insert("parent_id".to_string(), parent_id.to_string());
    m
}

fn now_unix_ms() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs_f64() * 1000.0)
        .unwrap_or(0.0)
}
