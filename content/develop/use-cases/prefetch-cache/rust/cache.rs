//! Redis prefetch-cache helper.
//!
//! Each cached entity is stored as a Redis hash under
//! `cache:{prefix}:{id}` with a long safety-net TTL that bounds memory if
//! the sync pipeline ever stops, but is not the freshness mechanism.
//! Freshness comes from the `apply_change` path, which the sync worker
//! calls every time a primary mutation arrives.
//!
//! Reads run `HGETALL` against Redis only. A miss is not a fall-back
//! trigger — the application treats it as an error or a deliberate
//! `invalidate` for testing. In production a sustained miss rate means
//! the prefetch or the sync pipeline is broken, not that the primary
//! should be re-queried on the request path.

use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;

use redis::{aio::ConnectionManager, AsyncCommands, AsyncIter, RedisResult};

use crate::primary::ChangeEvent;

#[derive(Debug, Clone)]
pub struct CacheConfig {
    pub prefix: String,
    pub ttl_seconds: i64,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            prefix: "cache:category:".to_string(),
            ttl_seconds: 3600,
        }
    }
}

#[derive(Debug, Clone)]
pub struct GetResult {
    pub record: Option<HashMap<String, String>>,
    pub hit: bool,
    pub redis_latency_ms: f64,
}

#[derive(Default)]
struct CacheStats {
    hits: AtomicU64,
    misses: AtomicU64,
    prefetched: AtomicU64,
    sync_events_applied: AtomicU64,
    // sync lag is tracked as integer microseconds so we can use atomics
    // without an extra mutex. Converted to f64 ms at read time.
    sync_lag_us_total: AtomicU64,
    sync_lag_samples: AtomicU64,
}

#[derive(Clone)]
pub struct PrefetchCache {
    conn: ConnectionManager,
    cfg: CacheConfig,
    stats: Arc<CacheStats>,
}

impl PrefetchCache {
    pub fn new(conn: ConnectionManager, cfg: CacheConfig) -> Self {
        Self {
            conn,
            cfg,
            stats: Arc::new(CacheStats::default()),
        }
    }

    pub fn ttl_seconds(&self) -> i64 {
        self.cfg.ttl_seconds
    }

    #[allow(dead_code)]
    pub fn prefix(&self) -> &str {
        &self.cfg.prefix
    }

    fn cache_key(&self, id: &str) -> String {
        format!("{}{}", self.cfg.prefix, id)
    }

    fn strip_prefix<'a>(&self, key: &'a str) -> &'a str {
        key.strip_prefix(self.cfg.prefix.as_str()).unwrap_or(key)
    }

    /// Pipeline `DEL` + `HSET` + `EXPIRE` for every record. Returns the
    /// count loaded.
    ///
    /// The pipeline is non-transactional: it is fast on startup (when
    /// nothing is reading the cache) and on the live `/reprefetch` path
    /// (when the demo pauses the sync worker around the call). Calling
    /// `bulk_load` on a cache that is actively being read and written
    /// to can briefly expose a key that has been deleted but not yet
    /// rewritten; pause the writers first or rewrite this with an
    /// atomic pipeline if that matters.
    pub async fn bulk_load(
        &self,
        records: Vec<HashMap<String, String>>,
    ) -> RedisResult<u64> {
        let mut pipe = redis::pipe();
        let mut loaded: u64 = 0;
        for record in &records {
            let entity_id = match record.get("id") {
                Some(v) if !v.is_empty() => v.clone(),
                _ => continue,
            };
            let cache_key = self.cache_key(&entity_id);
            let pairs: Vec<(String, String)> =
                record.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
            pipe.del(&cache_key).ignore();
            pipe.hset_multiple(&cache_key, &pairs).ignore();
            pipe.expire(&cache_key, self.cfg.ttl_seconds).ignore();
            loaded += 1;
        }
        if loaded > 0 {
            let mut conn = self.conn.clone();
            pipe.query_async::<_, ()>(&mut conn).await?;
        }
        self.stats.prefetched.fetch_add(loaded, Ordering::Relaxed);
        Ok(loaded)
    }

    /// Return `(record, hit, redis_latency_ms)` for an `HGETALL` against Redis.
    ///
    /// Prefetch-cache reads do not fall back to the primary. A miss is a
    /// signal that the cache is incomplete, not a trigger to re-query
    /// the source. The caller decides how to surface it.
    pub async fn get(&self, entity_id: &str) -> RedisResult<GetResult> {
        let cache_key = self.cache_key(entity_id);
        let mut conn = self.conn.clone();

        let started = Instant::now();
        let cached: HashMap<String, String> = conn.hgetall(&cache_key).await?;
        let redis_latency_ms = started.elapsed().as_secs_f64() * 1000.0;

        if !cached.is_empty() {
            self.stats.hits.fetch_add(1, Ordering::Relaxed);
            Ok(GetResult {
                record: Some(cached),
                hit: true,
                redis_latency_ms,
            })
        } else {
            self.stats.misses.fetch_add(1, Ordering::Relaxed);
            Ok(GetResult {
                record: None,
                hit: false,
                redis_latency_ms,
            })
        }
    }

    /// Apply a primary change event to Redis.
    ///
    /// For an `upsert`, rewrite the hash and refresh the safety-net TTL
    /// in a `MULTI`/`EXEC` pipeline. For a `delete`, remove the cache
    /// key. If `op == "upsert"` and `fields` is missing or empty,
    /// return early — calling `HSET` with no pairs raises in most
    /// clients, and there is nothing to write anyway.
    pub async fn apply_change(&self, change: &ChangeEvent) -> RedisResult<()> {
        if change.id.is_empty() {
            return Ok(());
        }
        let cache_key = self.cache_key(&change.id);
        let mut conn = self.conn.clone();

        match change.op.as_str() {
            "upsert" => {
                let fields = match &change.fields {
                    Some(f) if !f.is_empty() => f,
                    _ => {
                        // Malformed upsert with no fields. Skip rather
                        // than crash the sync worker. A real CDC
                        // consumer would route this to a dead-letter
                        // queue and alert; the demo just drops it.
                        return Ok(());
                    }
                };
                let pairs: Vec<(String, String)> =
                    fields.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
                redis::pipe()
                    .atomic()
                    .del(&cache_key)
                    .ignore()
                    .hset_multiple(&cache_key, &pairs)
                    .ignore()
                    .expire(&cache_key, self.cfg.ttl_seconds)
                    .ignore()
                    .query_async::<_, ()>(&mut conn)
                    .await?;
            }
            "delete" => {
                let _: i64 = conn.del(&cache_key).await?;
            }
            _ => return Ok(()),
        }

        self.stats
            .sync_events_applied
            .fetch_add(1, Ordering::Relaxed);

        // Record sync lag: now_ms - change.timestamp_ms, clamped >= 0.
        let now_ms = now_unix_ms();
        let lag_ms = (now_ms - change.timestamp_ms).max(0.0);
        let lag_us = (lag_ms * 1000.0) as u64;
        self.stats
            .sync_lag_us_total
            .fetch_add(lag_us, Ordering::Relaxed);
        self.stats.sync_lag_samples.fetch_add(1, Ordering::Relaxed);
        Ok(())
    }

    /// Delete one cache key. Demo-only: simulates a broken sync pipeline.
    pub async fn invalidate(&self, entity_id: &str) -> RedisResult<bool> {
        let mut conn = self.conn.clone();
        let n: i64 = conn.del(self.cache_key(entity_id)).await?;
        Ok(n == 1)
    }

    /// Delete every key under this cache's prefix and return the count.
    pub async fn clear(&self) -> RedisResult<u64> {
        let mut conn = self.conn.clone();
        let pattern = format!("{}*", self.cfg.prefix);
        let mut keys: Vec<String> = Vec::new();
        {
            let mut iter: AsyncIter<String> = conn.scan_match(&pattern).await?;
            while let Some(key) = iter.next_item().await {
                keys.push(key);
            }
        }
        if keys.is_empty() {
            return Ok(0);
        }
        let mut deleted: u64 = 0;
        let mut conn = self.conn.clone();
        for chunk in keys.chunks(500) {
            let mut pipe = redis::pipe();
            for key in chunk {
                pipe.del(key);
            }
            let results: Vec<i64> = pipe.query_async(&mut conn).await?;
            deleted += results.into_iter().filter(|n| *n > 0).count() as u64;
        }
        Ok(deleted)
    }

    /// Return every entity id currently in the cache, sorted, prefix stripped.
    pub async fn ids(&self) -> RedisResult<Vec<String>> {
        let mut conn = self.conn.clone();
        let pattern = format!("{}*", self.cfg.prefix);
        let mut out: Vec<String> = Vec::new();
        let mut iter: AsyncIter<String> = conn.scan_match(&pattern).await?;
        while let Some(key) = iter.next_item().await {
            out.push(self.strip_prefix(&key).to_string());
        }
        out.sort();
        Ok(out)
    }

    pub async fn ttl_remaining(&self, entity_id: &str) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        Ok(conn.ttl(self.cache_key(entity_id)).await?)
    }

    pub fn stats(&self) -> serde_json::Value {
        let hits = self.stats.hits.load(Ordering::Relaxed);
        let misses = self.stats.misses.load(Ordering::Relaxed);
        let prefetched = self.stats.prefetched.load(Ordering::Relaxed);
        let sync_events_applied = self.stats.sync_events_applied.load(Ordering::Relaxed);
        let sync_lag_us_total = self.stats.sync_lag_us_total.load(Ordering::Relaxed);
        let sync_lag_samples = self.stats.sync_lag_samples.load(Ordering::Relaxed);
        let total = hits + misses;
        let hit_rate_pct = if total == 0 {
            0.0
        } else {
            ((1000 * hits / total) as f64) / 10.0
        };
        let sync_lag_ms_avg = if sync_lag_samples == 0 {
            0.0
        } else {
            let avg_us = sync_lag_us_total as f64 / sync_lag_samples as f64;
            (avg_us / 10.0).round() / 100.0
        };
        serde_json::json!({
            "hits": hits,
            "misses": misses,
            "hit_rate_pct": hit_rate_pct,
            "prefetched": prefetched,
            "sync_events_applied": sync_events_applied,
            "sync_lag_ms_avg": sync_lag_ms_avg,
        })
    }

    pub fn reset_stats(&self) {
        self.stats.hits.store(0, Ordering::Relaxed);
        self.stats.misses.store(0, Ordering::Relaxed);
        self.stats.prefetched.store(0, Ordering::Relaxed);
        self.stats.sync_events_applied.store(0, Ordering::Relaxed);
        self.stats.sync_lag_us_total.store(0, Ordering::Relaxed);
        self.stats.sync_lag_samples.store(0, Ordering::Relaxed);
    }
}

fn now_unix_ms() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs_f64() * 1000.0)
        .unwrap_or(0.0)
}
