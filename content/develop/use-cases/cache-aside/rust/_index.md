---
aliases:
- /develop/use-cases/cache-aside/redis-rs
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis cache-aside layer in Rust with redis-rs
linkTitle: redis-rs example (Rust)
title: Redis cache-aside with redis-rs
weight: 9
---

This guide shows you how to implement a Redis cache-aside layer in Rust with the [redis](https://crates.io/crates/redis) crate (redis-rs). It includes a small local web server built on [axum](https://github.com/tokio-rs/axum) so you can see cache hits, misses, invalidation on write, and stampede protection in action.

## Overview

Cache-aside is one of the most common Redis use cases for read-heavy applications. Instead of querying the primary database on every request, the application checks Redis first and only falls back to the primary on a miss. The result is written back to Redis with a TTL so the next read is served from memory.

That gives you:

* Sub-millisecond reads for the hot working set
* Bounded staleness — every entry expires within a known window
* Reduced primary database load proportional to hit rate
* Field-level updates without re-serializing the full record
* Protection against cache stampedes when popular keys expire under load

In this example, each cached product is stored as a Redis hash under a key like `cache:product:{id}`. The hash holds the product fields (`id`, `name`, `price_cents`, `stock`) and the key has a TTL so stale data is bounded automatically.

## How it works

The flow on every read looks like this:

1. The application calls `cache.get(id, |key| async { primary.read(&key).await })`
2. The helper runs `HGETALL` against `cache:product:{id}`
3. On a hit, the cached hash is returned directly
4. On a miss, the helper acquires a Lua-backed single-flight lock and awaits the loader to fetch from the primary
5. The helper writes the result back to Redis with `HSET` plus `EXPIRE` and releases the lock
6. Concurrent tasks that fail to acquire the lock wait briefly for the cache to populate, then return that value instead of issuing their own primary read

On a write, the application updates the primary and then deletes the cache key, so the next read repopulates from the new source value.

## The cache-aside helper

The `RedisCache` struct wraps the cache-aside operations
([source](cache.rs)):

```rust
use redis::aio::ConnectionManager;
use redis::Client;
use std::sync::Arc;

mod cache;
mod primary;

use cache::{CacheConfig, RedisCache};
use primary::MockPrimaryStore;

#[tokio::main]
async fn main() -> redis::RedisResult<()> {
    let client = Client::open("redis://localhost:6379/")?;
    let conn = ConnectionManager::new(client).await?;
    let primary = Arc::new(MockPrimaryStore::new(150));
    let cache = RedisCache::new(conn, CacheConfig::default());

    // Read through the cache.
    let primary_clone = primary.clone();
    let result = cache
        .get("p-001", |key| {
            let p = primary_clone.clone();
            async move { p.read(&key).await }
        })
        .await?;
    println!("hit={} latency={:.2}ms", result.hit, result.redis_latency_ms);

    // Update a single field without rewriting the whole record.
    cache.update_field("p-001", "stock", "41").await?;

    // Invalidate the cache key on a write to the primary.
    primary.update_field("p-001", "price_cents", "699");
    cache.invalidate("p-001").await?;
    Ok(())
}
```

### Data model

Each cached product is stored in a Redis hash:

```text
cache:product:p-001
  id          = p-001
  name        = Sourdough Loaf
  price_cents = 650
  stock       = 42
```

The implementation uses:

* [`HGETALL`]({{< relref "/commands/hgetall" >}}) to read the cached record
* [`HSET`]({{< relref "/commands/hset" >}}) plus [`EXPIRE`]({{< relref "/commands/expire" >}}) to repopulate after a miss
* [`DEL`]({{< relref "/commands/del" >}}) to invalidate on writes
* [`TTL`]({{< relref "/commands/ttl" >}}) to surface remaining staleness in the demo UI
* [`EVAL`]({{< relref "/commands/eval" >}}) for the Lua single-flight lock that prevents stampedes
* [`WATCH`]({{< relref "/commands/watch" >}})/[`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) for the conditional field update path

## Cache-aside reads

The `get()` method runs `HGETALL` on the cache key first. On a hit it returns the cached hash and increments the hit counter. On a miss, it delegates to a single-flight loader:

```rust
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
        return Ok(CacheResult { record: Some(cached), hit: true, redis_latency_ms });
    }

    self.stats.misses.fetch_add(1, Ordering::Relaxed);
    let record = self.load_with_single_flight(id, &loader).await?;
    Ok(CacheResult { record, hit: false, redis_latency_ms })
}
```

The returned `CacheResult` includes the measured Redis round-trip time so the demo UI can show the latency difference between a hit and a miss.

## Stampede protection with a Lua lock

When a popular key expires, every concurrent reader observes the miss at the same instant. Without coordination, all of them would query the primary and overwrite the cache redundantly — a *cache stampede*.

The helper uses a tiny Lua script to acquire a short-lived lock atomically. Only the task that wins the `SET NX` becomes the primary loader; the rest poll the cache briefly and return the value the lock holder writes:

```lua
-- Acquire a short-lived lock with SET NX PX. Returns 1 on acquire, 0 otherwise.
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
end
return 0
```

A second script releases the lock only if the caller still owns it, so a lock that timed out and was re-acquired by someone else cannot be released by mistake:

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
```

The Rust side wraps both scripts in `redis::Script` and runs them on every miss:

```rust
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
    Ok(loader(id.to_string()).await)
}
```

The unique `token` per caller is what makes the release script safe — only the task that actually holds the lock can release it.

## Invalidation on write

When a write hits the primary, the application invalidates the cache key. The next read pulls fresh data from the primary:

```rust
pub async fn invalidate(&self, id: &str) -> RedisResult<bool> {
    let mut conn = self.conn.clone();
    let n: i64 = conn.del(self.cache_key(id)).await?;
    Ok(n == 1)
}
```

This is the simplest and safest pattern: never try to keep the cache and primary in sync directly, just delete the cache entry and let the next read repopulate it.

## Field-level updates

Because each record is stored as a hash, the cache helper can also update a single field in place without re-serializing the full record. The update only writes if the entry is already cached, so a partial record can never appear in Redis:

```rust
pub async fn update_field(&self, id: &str, field: &str, value: &str) -> RedisResult<bool> {
    let cache_key = self.cache_key(id);
    let mut conn = self.conn.clone();
    loop {
        redis::cmd("WATCH").arg(&cache_key).query_async::<_, ()>(&mut conn).await?;
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
```

This is useful for hot fields that change more often than the rest of the record (a stock counter, a view count) and would otherwise force a full reload.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, and stampedes that were suppressed by the single-flight lock. The demo UI surfaces these so you can see the cache absorbing load:

```rust
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
```

In production you would emit these as `metrics`/`prometheus` counters or push them into your observability stack rather than holding them as `AtomicU64`s in process memory.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The Rust toolchain is installed (rustup, cargo).
* Dependencies are declared in `Cargo.toml`:

```toml
[dependencies]
redis = { version = "0.24", features = ["tokio-comp", "aio", "connection-manager"] }
tokio = { version = "1", features = ["full"] }
axum = "0.7"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rand = "0.8"
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the cache-aside layer in action
([source](demo_server.rs)):

```bash
cargo run --release -- --port 8080 --redis-host localhost --redis-port 6379
```

The demo server uses Tokio's async runtime plus axum for HTTP handling:

* [`tokio`](https://crates.io/crates/tokio) for the async runtime
* [`axum`](https://crates.io/crates/axum) for the web server
* [`redis::aio::ConnectionManager`](https://docs.rs/redis/latest/redis/aio/struct.ConnectionManager.html) for shared multiplexed connections
* [`redis::Script`](https://docs.rs/redis/latest/redis/struct.Script.html) for the Lua single-flight scripts

It exposes a small interactive page where you can:

* Read a product through the cache and see whether it was a hit or a miss
* Compare the measured Redis round-trip against the simulated primary read latency
* Watch the cache TTL count down between requests
* Update a field on the primary and see the cache invalidate automatically
* Run a stampede test that fires many concurrent reads at a freshly-invalidated key and confirms only one of them reaches the primary
* Reset the hit/miss counters at any time

After starting the server, visit `http://localhost:8080`.

## The mock primary store

To make the demo self-contained, the example includes a `MockPrimaryStore` that stands in for a slow disk-backed database
([source](primary.rs)):

```rust
pub async fn read(&self, id: &str) -> Option<HashMap<String, String>> {
    tokio::time::sleep(Duration::from_millis(self.read_latency_ms)).await;
    self.reads.fetch_add(1, Ordering::Relaxed);
    let map = self.records.lock().unwrap();
    map.get(id).cloned()
}
```

Every call to `read()` sleeps for `read_latency_ms` so the difference between a cache hit and a miss is obvious in the UI. The store also tracks the total number of primary reads, which the stampede test uses to confirm that single-flight is working — for N concurrent readers against a cold key, you should see exactly one primary read.

In a real application this would be replaced by a SQLx query, an HTTP call to a downstream service, or any other slow-but-authoritative source.

## Production usage

This guide uses a deliberately small local demo so you can focus on the cache-aside pattern. In production, you will usually want to harden several aspects of it.

### Choose a TTL that matches your staleness tolerance

The TTL is the upper bound on how long a stale value can be served. Shorter TTLs mean lower hit rates and more primary load; longer TTLs mean higher hit rates and more stale reads between writes. Pick the value that matches your business tolerance for stale data, and combine it with explicit invalidation on writes for the cases where you cannot tolerate any staleness.

### Invalidate, don't try to keep the cache in sync

When the underlying record changes, delete the cache key rather than rewriting it. Cache-aside is robust precisely because it never assumes the cache holds the latest value — the next read always re-fetches from the primary on a miss.

### Handle missing records explicitly

In this demo, a missing record returns `None` and nothing is cached. In a real system you may want to cache "not found" sentinels with a short TTL to absorb load from probing for non-existent IDs, while making sure the sentinel TTL is shorter than the positive cache entry so a newly-created record becomes visible quickly.

### Tune the single-flight lock TTL

The lock TTL needs to be longer than the worst-case primary read latency so a slow loader does not lose the lock midway. The unique token in `RELEASE_LOCK_SCRIPT` ensures the original caller does not delete someone else's lock if its lock has expired.

### `ConnectionManager` vs `MultiplexedConnection`

The demo uses `redis::aio::ConnectionManager`, which transparently reconnects on transient failures and is cheap to clone for use across many concurrent tokio tasks. For very high-throughput workloads you may also want to look at `bb8-redis` or `deadpool-redis` for explicit pooling.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:product:{id}`) so different services cannot clobber each other's entries.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache key directly to confirm the application is writing the fields and TTL you expect:

```bash
redis-cli HGETALL cache:product:p-001
redis-cli TTL cache:product:p-001
```

## Learn more

* [redis crate on crates.io](https://crates.io/crates/redis) - Install and use the Rust Redis client
* [SET command]({{< relref "/commands/set" >}}) - Set a string with TTL options (`EX`, `PX`, `NX`)
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Atomic single-flight locks and stampede mitigation
