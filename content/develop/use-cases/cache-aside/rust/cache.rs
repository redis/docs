//! Cache-aside helper backed by Redis hashes with TTL and Lua-backed
//! single-flight stampede protection.

use rand::RngCore;
use redis::{aio::ConnectionManager, AsyncCommands, RedisResult, Script};
use std::collections::HashMap;
use std::future::Future;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

const ACQUIRE_LOCK_SCRIPT: &str = r#"
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
end
return 0
"#;

const RELEASE_LOCK_SCRIPT: &str = r#"
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
"#;

#[derive(Debug, Clone)]
pub struct CacheConfig {
    pub prefix: String,
    pub ttl: usize,
    pub lock_ttl_ms: u64,
    pub wait_poll_ms: u64,
}

impl Default for CacheConfig {
    fn default() -> Self {
        Self {
            prefix: "cache:product:".to_string(),
            ttl: 30,
            lock_ttl_ms: 2000,
            wait_poll_ms: 25,
        }
    }
}

#[derive(Debug, Clone)]
pub struct CacheResult {
    pub record: Option<HashMap<String, String>>,
    pub hit: bool,
    pub redis_latency_ms: f64,
}

#[derive(Default)]
struct CacheStats {
    hits: AtomicU64,
    misses: AtomicU64,
    stampedes_suppressed: AtomicU64,
}

#[derive(Clone)]
pub struct RedisCache {
    conn: ConnectionManager,
    cfg: CacheConfig,
    stats: Arc<CacheStats>,
    acquire_script: Arc<Script>,
    release_script: Arc<Script>,
}

impl RedisCache {
    pub fn new(conn: ConnectionManager, cfg: CacheConfig) -> Self {
        Self {
            conn,
            cfg,
            stats: Arc::new(CacheStats::default()),
            acquire_script: Arc::new(Script::new(ACQUIRE_LOCK_SCRIPT)),
            release_script: Arc::new(Script::new(RELEASE_LOCK_SCRIPT)),
        }
    }

    pub fn ttl(&self) -> usize {
        self.cfg.ttl
    }

    fn cache_key(&self, id: &str) -> String {
        format!("{}{}", self.cfg.prefix, id)
    }

    fn lock_key(&self, id: &str) -> String {
        format!("lock:{}{}", self.cfg.prefix, id)
    }

    /// Read through the cache. On a miss, calls `loader` (single-flight: only
    /// one concurrent caller actually invokes it).
    pub async fn get<F, Fut>(&self, id: &str, loader: F) -> RedisResult<CacheResult>
    where
        F: Fn(String) -> Fut,
        Fut: Future<Output = Option<HashMap<String, String>>>,
    {
        let cache_key = self.cache_key(id);
        let mut conn = self.conn.clone();

        let started = Instant::now();
        let cached: HashMap<String, String> = conn.hgetall(&cache_key).await?;
        let redis_latency_ms = started.elapsed().as_secs_f64() * 1000.0;

        if !cached.is_empty() {
            self.stats.hits.fetch_add(1, Ordering::Relaxed);
            return Ok(CacheResult {
                record: Some(cached),
                hit: true,
                redis_latency_ms,
            });
        }

        self.stats.misses.fetch_add(1, Ordering::Relaxed);
        let record = self.load_with_single_flight(id, &loader).await?;
        Ok(CacheResult {
            record,
            hit: false,
            redis_latency_ms,
        })
    }

    async fn load_with_single_flight<F, Fut>(
        &self,
        id: &str,
        loader: &F,
    ) -> RedisResult<Option<HashMap<String, String>>>
    where
        F: Fn(String) -> Fut,
        Fut: Future<Output = Option<HashMap<String, String>>>,
    {
        let cache_key = self.cache_key(id);
        let lock_key = self.lock_key(id);
        let token = random_token();

        let mut conn = self.conn.clone();
        let acquired: i64 = self
            .acquire_script
            .key(&lock_key)
            .arg(token.as_str())
            .arg(self.cfg.lock_ttl_ms.to_string())
            .invoke_async(&mut conn)
            .await?;

        if acquired == 1 {
            let result = self.populate_after_lock(id, loader, &cache_key).await;
            // Release the lock regardless of whether the loader succeeded.
            let _ = self
                .release_script
                .key(&lock_key)
                .arg(token.as_str())
                .invoke_async::<_, i64>(&mut conn)
                .await;
            return result;
        }

        self.stats.stampedes_suppressed.fetch_add(1, Ordering::Relaxed);
        let deadline = Instant::now() + Duration::from_millis(self.cfg.lock_ttl_ms);
        while Instant::now() < deadline {
            tokio::time::sleep(Duration::from_millis(self.cfg.wait_poll_ms)).await;
            let cached: HashMap<String, String> = conn.hgetall(&cache_key).await?;
            if !cached.is_empty() {
                return Ok(Some(cached));
            }
        }
        // Lock holder did not populate in time — fall through to a direct read.
        Ok(loader(id.to_string()).await)
    }

    async fn populate_after_lock<F, Fut>(
        &self,
        id: &str,
        loader: &F,
        cache_key: &str,
    ) -> RedisResult<Option<HashMap<String, String>>>
    where
        F: Fn(String) -> Fut,
        Fut: Future<Output = Option<HashMap<String, String>>>,
    {
        let record = loader(id.to_string()).await;
        if let Some(map) = &record {
            let mut conn = self.conn.clone();
            let pairs: Vec<(String, String)> =
                map.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
            redis::pipe()
                .atomic()
                .del(cache_key)
                .ignore()
                .hset_multiple(cache_key, &pairs)
                .ignore()
                .expire(cache_key, self.cfg.ttl as i64)
                .ignore()
                .query_async::<_, ()>(&mut conn)
                .await?;
        }
        Ok(record)
    }

    pub async fn invalidate(&self, id: &str) -> RedisResult<bool> {
        let mut conn = self.conn.clone();
        let n: i64 = conn.del(self.cache_key(id)).await?;
        Ok(n == 1)
    }

    /// Update a single field in place if the entry is cached. Uses a
    /// CAS-style transaction so a concurrent invalidate cannot create a
    /// partial record.
    #[allow(dead_code)]
    pub async fn update_field(&self, id: &str, field: &str, value: &str) -> RedisResult<bool> {
        let cache_key = self.cache_key(id);
        let mut conn = self.conn.clone();
        loop {
            redis::cmd("WATCH")
                .arg(&cache_key)
                .query_async::<_, ()>(&mut conn)
                .await?;
            let exists: i64 = conn.exists(&cache_key).await?;
            if exists == 0 {
                redis::cmd("UNWATCH").query_async::<_, ()>(&mut conn).await?;
                return Ok(false);
            }
            let result: Option<((),)> = redis::pipe()
                .atomic()
                .hset(&cache_key, field, value)
                .ignore()
                .expire(&cache_key, self.cfg.ttl as i64)
                .query_async(&mut conn)
                .await?;
            if result.is_some() {
                return Ok(true);
            }
            // EXEC returned nil — WATCH detected a change. Retry.
        }
    }

    pub async fn ttl_remaining(&self, id: &str) -> RedisResult<i64> {
        let mut conn = self.conn.clone();
        Ok(conn.ttl(self.cache_key(id)).await?)
    }

    pub fn stats(&self) -> serde_json::Value {
        let hits = self.stats.hits.load(Ordering::Relaxed);
        let misses = self.stats.misses.load(Ordering::Relaxed);
        let stampedes = self.stats.stampedes_suppressed.load(Ordering::Relaxed);
        let total = hits + misses;
        let hit_rate_pct = if total == 0 {
            0.0
        } else {
            ((1000 * hits / total) as f64) / 10.0
        };
        serde_json::json!({
            "hits": hits,
            "misses": misses,
            "stampedes_suppressed": stampedes,
            "hit_rate_pct": hit_rate_pct,
        })
    }

    pub fn reset_stats(&self) {
        self.stats.hits.store(0, Ordering::Relaxed);
        self.stats.misses.store(0, Ordering::Relaxed);
        self.stats.stampedes_suppressed.store(0, Ordering::Relaxed);
    }
}

fn random_token() -> String {
    let mut bytes = [0u8; 8];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}
