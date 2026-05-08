//! In-memory stand-in for a slow primary database.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::Duration;

pub struct MockPrimaryStore {
    pub read_latency_ms: u64,
    reads: AtomicU64,
    records: Mutex<HashMap<String, HashMap<String, String>>>,
}

impl MockPrimaryStore {
    pub fn new(read_latency_ms: u64) -> Self {
        let mut records = HashMap::new();
        records.insert("p-001".to_string(), make_record("p-001", "Sourdough Loaf", "650", "42"));
        records.insert("p-002".to_string(), make_record("p-002", "Espresso Beans 250g", "1495", "120"));
        records.insert("p-003".to_string(), make_record("p-003", "Olive Oil 500ml", "1200", "8"));
        records.insert("p-004".to_string(), make_record("p-004", "Sea Salt Flakes", "475", "60"));
        Self {
            read_latency_ms,
            reads: AtomicU64::new(0),
            records: Mutex::new(records),
        }
    }

    pub fn list_ids(&self) -> Vec<String> {
        let map = self.records.lock().unwrap();
        let mut ids: Vec<String> = map.keys().cloned().collect();
        ids.sort();
        ids
    }

    pub async fn read(&self, id: &str) -> Option<HashMap<String, String>> {
        tokio::time::sleep(Duration::from_millis(self.read_latency_ms)).await;
        self.reads.fetch_add(1, Ordering::Relaxed);
        let map = self.records.lock().unwrap();
        map.get(id).cloned()
    }

    pub fn update_field(&self, id: &str, field: &str, value: &str) -> bool {
        let mut map = self.records.lock().unwrap();
        if let Some(record) = map.get_mut(id) {
            record.insert(field.to_string(), value.to_string());
            true
        } else {
            false
        }
    }

    pub fn reads(&self) -> u64 {
        self.reads.load(Ordering::Relaxed)
    }

    pub fn reset_reads(&self) {
        self.reads.store(0, Ordering::Relaxed);
    }
}

fn make_record(id: &str, name: &str, price_cents: &str, stock: &str) -> HashMap<String, String> {
    let mut m = HashMap::new();
    m.insert("id".to_string(), id.to_string());
    m.insert("name".to_string(), name.to_string());
    m.insert("price_cents".to_string(), price_cents.to_string());
    m.insert("stock".to_string(), stock.to_string());
    m
}
