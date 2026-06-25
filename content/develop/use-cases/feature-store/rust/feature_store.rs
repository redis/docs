//! `FeatureStore` async helper around a `redis::aio::ConnectionManager`.
//!
//! ConnectionManager is the canonical "single-connection across many
//! async tasks" abstraction in redis-rs: it owns the multiplexed
//! `MultiplexedConnection` underneath and transparently reconnects on
//! a closed socket. The struct holds `Clone` handles, so wiring one
//! into HTTP handlers and a streaming worker is just `clone()`s.

use std::collections::BTreeMap;
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::Arc;

use redis::aio::ConnectionManager;
use redis::{AsyncCommands, FromRedisValue, RedisResult, Value};
use serde::Serialize;

/// Default batch feature schema. Daily aggregates computed offline
/// and bulk-loaded once per materialization cycle.
pub const DEFAULT_BATCH_FIELDS: &[&str] = &[
    "country_iso",
    "risk_segment",
    "account_age_days",
    "tx_count_7d",
    "avg_amount_30d",
    "chargeback_count_180d",
];

/// Default streaming feature schema. Updated by the streaming worker
/// as new events arrive, with a per-field TTL so each field
/// self-expires when its upstream pipeline stops.
pub const DEFAULT_STREAMING_FIELDS: &[&str] = &[
    "last_login_ts",
    "last_device_id",
    "tx_count_5m",
    "failed_logins_15m",
    "session_country",
];

pub const DEFAULT_BATCH_TTL_SECONDS: u64 = 24 * 60 * 60;
pub const DEFAULT_STREAMING_TTL_SECONDS: u64 = 5 * 60;
pub const DEFAULT_KEY_PREFIX: &str = "fs:user:";

/// One feature value the helper knows how to encode.
#[derive(Debug, Clone)]
pub enum FeatureValue {
    Str(String),
    Bool(bool),
    Int(i64),
    Float(f64),
}

impl FeatureValue {
    /// Render the value as the string Redis hash fields require.
    /// Booleans become "true"/"false" so they round-trip cleanly
    /// through redis-cli and the other clients.
    pub fn encode(&self) -> String {
        match self {
            FeatureValue::Str(s) => s.clone(),
            FeatureValue::Bool(b) => (if *b { "true" } else { "false" }).into(),
            FeatureValue::Int(i) => i.to_string(),
            FeatureValue::Float(f) => {
                if f.fract() == 0.0 {
                    format!("{:.1}", f)
                } else {
                    f.to_string()
                }
            }
        }
    }
}

impl From<&str> for FeatureValue {
    fn from(s: &str) -> Self { FeatureValue::Str(s.into()) }
}
impl From<String> for FeatureValue {
    fn from(s: String) -> Self { FeatureValue::Str(s) }
}
impl From<bool> for FeatureValue {
    fn from(b: bool) -> Self { FeatureValue::Bool(b) }
}
impl From<i32> for FeatureValue {
    fn from(i: i32) -> Self { FeatureValue::Int(i as i64) }
}
impl From<i64> for FeatureValue {
    fn from(i: i64) -> Self { FeatureValue::Int(i) }
}
impl From<u64> for FeatureValue {
    fn from(i: u64) -> Self { FeatureValue::Int(i as i64) }
}
impl From<f64> for FeatureValue {
    fn from(f: f64) -> Self { FeatureValue::Float(f) }
}

/// One row of features for one entity. Insertion order is preserved
/// so the demo's debug views read in a stable order.
pub type FeatureMap = BTreeMap<String, FeatureValue>;

#[derive(Debug, Clone, Serialize)]
pub struct Stats {
    pub batch_writes_total: i64,
    pub streaming_writes_total: i64,
    pub reads_total: i64,
    pub read_fields_total: i64,
}

#[derive(Clone)]
pub struct FeatureStore {
    conn: ConnectionManager,
    key_prefix: String,
    batch_ttl_seconds: u64,
    streaming_ttl_seconds: u64,
    counters: Arc<Counters>,
}

struct Counters {
    batch_writes_total: AtomicI64,
    streaming_writes_total: AtomicI64,
    reads_total: AtomicI64,
    read_fields_total: AtomicI64,
}

impl FeatureStore {
    pub fn new(
        conn: ConnectionManager,
        key_prefix: impl Into<String>,
        batch_ttl_seconds: u64,
        streaming_ttl_seconds: u64,
    ) -> Self {
        Self {
            conn,
            key_prefix: key_prefix.into(),
            batch_ttl_seconds,
            streaming_ttl_seconds,
            counters: Arc::new(Counters {
                batch_writes_total: AtomicI64::new(0),
                streaming_writes_total: AtomicI64::new(0),
                reads_total: AtomicI64::new(0),
                read_fields_total: AtomicI64::new(0),
            }),
        }
    }

    pub fn key_prefix(&self) -> &str { &self.key_prefix }
    pub fn batch_ttl_seconds(&self) -> u64 { self.batch_ttl_seconds }
    pub fn streaming_ttl_seconds(&self) -> u64 { self.streaming_ttl_seconds }

    pub fn key_for(&self, entity_id: &str) -> String {
        format!("{}{}", self.key_prefix, entity_id)
    }

    // ---------------------------------------------------------------
    // Batch ingestion (materialization)
    // ---------------------------------------------------------------

    /// Materialize a batch of entities into Redis.
    ///
    /// One `HSET` plus one `EXPIRE` per entity, all queued through a
    /// non-transactional pipeline so the whole batch ships in a
    /// single network round trip.
    pub async fn bulk_load(
        &self,
        rows: &[(String, FeatureMap)],
        ttl_seconds: u64,
    ) -> RedisResult<usize> {
        if rows.is_empty() { return Ok(0); }
        let mut pipe = redis::pipe();
        for (entity_id, fields) in rows {
            let key = self.key_for(entity_id);
            let encoded: Vec<(&str, String)> = fields
                .iter()
                .map(|(k, v)| (k.as_str(), v.encode()))
                .collect();
            pipe.hset_multiple(&key, &encoded).ignore();
            pipe.expire(&key, ttl_seconds as i64).ignore();
        }
        let mut conn = self.conn.clone();
        pipe.query_async::<()>(&mut conn).await?;
        self.counters
            .batch_writes_total
            .fetch_add(rows.len() as i64, Ordering::Relaxed);
        Ok(rows.len())
    }

    pub async fn update_batch_feature(
        &self,
        entity_id: &str,
        field: &str,
        value: FeatureValue,
    ) -> RedisResult<()> {
        let mut conn = self.conn.clone();
        let _: () = conn.hset(self.key_for(entity_id), field, value.encode()).await?;
        self.counters
            .batch_writes_total
            .fetch_add(1, Ordering::Relaxed);
        Ok(())
    }

    // ---------------------------------------------------------------
    // Streaming ingestion
    // ---------------------------------------------------------------

    /// Write streaming features with a per-field TTL.
    ///
    /// `HSET` + `HEXPIRE` are queued in a single pipeline so Redis
    /// runs them in order on the server: the `HSET` first creates or
    /// overwrites the fields, then `HEXPIRE` attaches a TTL to each
    /// of those same fields.
    ///
    /// `HEXPIRE` returns one status code per field:
    /// `1` = TTL set, `2` = the expiry was 0 or in the past (so Redis
    /// deleted the field instead), `0` = an NX/XX/GT/LT conditional
    /// flag wasn't met, `-2` = no such field or key. We always
    /// follow `HSET` with `HEXPIRE` so any code other than `1` means
    /// the per-field TTL invariant didn't hold — the helper returns
    /// a `RedisError` rather than silently leaving a streaming field
    /// without an expiry attached.
    pub async fn update_streaming(
        &self,
        entity_id: &str,
        fields: &FeatureMap,
        ttl_seconds: u64,
    ) -> RedisResult<()> {
        if fields.is_empty() { return Ok(()); }
        let key = self.key_for(entity_id);
        let encoded: Vec<(&str, String)> = fields
            .iter()
            .map(|(k, v)| (k.as_str(), v.encode()))
            .collect();
        let names: Vec<&str> = fields.keys().map(|s| s.as_str()).collect();

        let mut pipe = redis::pipe();
        pipe.hset_multiple(&key, &encoded).ignore();
        // HEXPIRE wire form: HEXPIRE key seconds FIELDS count field...
        let mut hexpire = redis::cmd("HEXPIRE");
        hexpire.arg(&key).arg(ttl_seconds).arg("FIELDS").arg(names.len());
        for n in &names { hexpire.arg(n); }
        pipe.add_command(hexpire);

        let mut conn = self.conn.clone();
        // The pipeline returns one entry per non-ignored command;
        // HSET's reply was dropped with .ignore() above, so there is
        // exactly one entry left — HEXPIRE's per-field code list
        // (itself a Vec<i64>). We unwrap the outer Vec to get at
        // those codes.
        let pipe_result: Vec<Vec<i64>> = pipe.query_async(&mut conn).await?;
        let codes = pipe_result.into_iter().next().unwrap_or_default();
        for code in &codes {
            if *code != 1 {
                return Err(redis::RedisError::from((
                    redis::ErrorKind::ResponseError,
                    "HEXPIRE invariant violated",
                    format!(
                        "HEXPIRE did not set every field TTL for {key}: {codes:?}"
                    ),
                )));
            }
        }
        self.counters
            .streaming_writes_total
            .fetch_add(fields.len() as i64, Ordering::Relaxed);
        Ok(())
    }

    // ---------------------------------------------------------------
    // Inference reads
    // ---------------------------------------------------------------

    /// Retrieve a subset of features for one entity with `HMGET`.
    /// Returns only the fields that actually exist on the hash —
    /// missing fields are dropped from the result.
    pub async fn get_features(
        &self,
        entity_id: &str,
        field_names: &[&str],
    ) -> RedisResult<BTreeMap<String, String>> {
        if field_names.is_empty() {
            return Ok(BTreeMap::new());
        }
        let key = self.key_for(entity_id);
        let mut conn = self.conn.clone();
        let values: Vec<Option<String>> = conn.hget(&key, field_names).await?;
        let mut out = BTreeMap::new();
        for (n, v) in field_names.iter().zip(values.into_iter()) {
            if let Some(s) = v {
                out.insert((*n).to_string(), s);
            }
        }
        self.counters.reads_total.fetch_add(1, Ordering::Relaxed);
        self.counters
            .read_fields_total
            .fetch_add(out.len() as i64, Ordering::Relaxed);
        Ok(out)
    }

    /// Full-hash read via `HGETALL`. Useful for debugging but the
    /// model server should always go through `get_features` with an
    /// explicit field list.
    pub async fn get_all_features(
        &self,
        entity_id: &str,
    ) -> RedisResult<BTreeMap<String, String>> {
        let mut conn = self.conn.clone();
        let map: BTreeMap<String, String> = conn.hgetall(self.key_for(entity_id)).await?;
        self.counters.reads_total.fetch_add(1, Ordering::Relaxed);
        self.counters
            .read_fields_total
            .fetch_add(map.len() as i64, Ordering::Relaxed);
        Ok(map)
    }

    /// Pipeline `HMGET` across many entities for batch scoring. One
    /// round trip for the whole batch.
    pub async fn batch_get_features(
        &self,
        entity_ids: &[String],
        field_names: &[&str],
    ) -> RedisResult<BTreeMap<String, BTreeMap<String, String>>> {
        if entity_ids.is_empty() || field_names.is_empty() {
            return Ok(BTreeMap::new());
        }
        let mut pipe = redis::pipe();
        for id in entity_ids {
            pipe.hget(self.key_for(id), field_names);
        }
        let mut conn = self.conn.clone();
        let rows: Vec<Vec<Option<String>>> = pipe.query_async(&mut conn).await?;

        let mut out = BTreeMap::new();
        let mut seen = 0i64;
        for (id, values) in entity_ids.iter().zip(rows.into_iter()) {
            let mut row = BTreeMap::new();
            for (n, v) in field_names.iter().zip(values.into_iter()) {
                if let Some(s) = v {
                    row.insert((*n).to_string(), s);
                    seen += 1;
                }
            }
            out.insert(id.clone(), row);
        }
        self.counters
            .reads_total
            .fetch_add(entity_ids.len() as i64, Ordering::Relaxed);
        self.counters.read_fields_total.fetch_add(seen, Ordering::Relaxed);
        Ok(out)
    }

    // ---------------------------------------------------------------
    // TTL inspection (used by the demo UI)
    // ---------------------------------------------------------------

    /// Seconds until the entity key expires: positive means TTL
    /// remaining, `-1` means no key-level TTL set, `-2` means the
    /// key doesn't exist.
    pub async fn key_ttl_seconds(&self, entity_id: &str) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        conn.ttl(self.key_for(entity_id)).await
    }

    /// Per-field TTL via `HTTL` (Redis 7.4+). Each value mirrors
    /// `TTL`'s convention: positive seconds remaining, `-1` no field
    /// TTL, `-2` field (or key) missing.
    pub async fn field_ttls_seconds(
        &self,
        entity_id: &str,
        field_names: &[&str],
    ) -> RedisResult<BTreeMap<String, i64>> {
        if field_names.is_empty() {
            return Ok(BTreeMap::new());
        }
        let key = self.key_for(entity_id);
        let mut cmd = redis::cmd("HTTL");
        cmd.arg(&key).arg("FIELDS").arg(field_names.len());
        for n in field_names { cmd.arg(*n); }
        let mut conn = self.conn.clone();
        // HTTL on a missing key still returns a flat list of -2s
        // (one per requested field), so we don't need a defensive
        // shape coercion here the way redis-py and Lettuce do for
        // their respective clients.
        let values: Value = cmd.query_async(&mut conn).await?;
        let codes: Vec<i64> = Vec::<i64>::from_redis_value(&values).unwrap_or_else(|_| {
            // Defensive fallback: if the client ever returns nil for
            // a missing key, treat every field as -2.
            field_names.iter().map(|_| -2).collect()
        });
        let mut out = BTreeMap::new();
        for (n, v) in field_names.iter().zip(codes.into_iter()) {
            out.insert((*n).to_string(), v);
        }
        Ok(out)
    }

    // ---------------------------------------------------------------
    // Demo housekeeping
    // ---------------------------------------------------------------

    /// Enumerate up to `limit` entity IDs by scanning `keyPrefix*`.
    /// `SCAN` is non-blocking; the demo uses it for UI dropdowns,
    /// not as a serving primitive. Result is sorted.
    pub async fn list_entity_ids(&self, limit: usize) -> RedisResult<Vec<String>> {
        use redis::AsyncIter;
        let pattern = format!("{}*", self.key_prefix);
        let mut conn = self.conn.clone();
        let mut iter: AsyncIter<String> = conn.scan_match(&pattern).await?;
        let mut ids: Vec<String> = Vec::new();
        let prefix_len = self.key_prefix.len();
        while let Some(k) = iter.next_item().await {
            if k.len() > prefix_len {
                ids.push(k[prefix_len..].to_string());
            }
            if ids.len() >= limit { break; }
        }
        ids.sort();
        Ok(ids)
    }

    /// Count every entity under the key prefix. Loops `SCAN` without
    /// an in-memory cap so the UI can show the true total even when
    /// more keys exist than `list_entity_ids` returns.
    pub async fn count_entities(&self) -> RedisResult<i64> {
        use redis::AsyncIter;
        let pattern = format!("{}*", self.key_prefix);
        let mut conn = self.conn.clone();
        let mut iter: AsyncIter<String> = conn.scan_match(&pattern).await?;
        let mut n = 0i64;
        while let Some(_k) = iter.next_item().await {
            n += 1;
        }
        Ok(n)
    }

    pub async fn delete_entity(&self, entity_id: &str) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        conn.del(self.key_for(entity_id)).await
    }

    /// Drop every entity under the key prefix. Used by the demo
    /// reset path; collects keys with `SCAN` then issues variadic
    /// `DEL` in batches of 500.
    pub async fn reset(&self) -> RedisResult<i64> {
        use redis::AsyncIter;
        let pattern = format!("{}*", self.key_prefix);
        let mut conn = self.conn.clone();
        let mut deleted = 0i64;
        let mut batch: Vec<String> = Vec::with_capacity(500);
        let mut iter: AsyncIter<String> = conn.scan_match(&pattern).await?;
        while let Some(k) = iter.next_item().await {
            batch.push(k);
            if batch.len() >= 500 {
                let n: i64 = self.conn.clone().del(batch.as_slice()).await?;
                deleted += n;
                batch.clear();
            }
        }
        if !batch.is_empty() {
            let n: i64 = self.conn.clone().del(batch.as_slice()).await?;
            deleted += n;
        }
        Ok(deleted)
    }

    pub fn stats(&self) -> Stats {
        Stats {
            batch_writes_total: self.counters.batch_writes_total.load(Ordering::Relaxed),
            streaming_writes_total: self.counters.streaming_writes_total.load(Ordering::Relaxed),
            reads_total: self.counters.reads_total.load(Ordering::Relaxed),
            read_fields_total: self.counters.read_fields_total.load(Ordering::Relaxed),
        }
    }

    pub fn reset_stats(&self) {
        self.counters.batch_writes_total.store(0, Ordering::Relaxed);
        self.counters.streaming_writes_total.store(0, Ordering::Relaxed);
        self.counters.reads_total.store(0, Ordering::Relaxed);
        self.counters.read_fields_total.store(0, Ordering::Relaxed);
    }
}
