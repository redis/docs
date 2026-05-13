---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Rust with redis-rs
linkTitle: redis-rs example (Rust)
title: Redis prefetch cache with redis-rs
weight: 9
---

This guide shows you how to implement a Redis prefetch cache in Rust with the [`redis`](https://crates.io/crates/redis) crate (redis-rs). It includes a small local web server built with [`axum`](https://github.com/tokio-rs/axum) and [`tokio`](https://tokio.rs/) so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

## Overview

Prefetch caching pre-loads a working set of reference data into Redis before the first request arrives, so every read on the request path is a cache hit. A separate sync worker keeps the cache current as the source of truth changes — there is no fall-back to the primary on the read path.

That gives you:

* Near-100% cache hit ratios for reference and master data
* Sub-millisecond reads for lookup-heavy paths at peak traffic
* All reference-data reads offloaded from the primary database
* Source-database changes propagated into Redis within a few milliseconds
* A long safety-net TTL that bounds memory if the sync pipeline ever stops

In this example, each cached category is stored as a Redis hash under a key like `cache:category:{id}`. The hash holds the category fields (`id`, `name`, `display_order`, `featured`, `parent_id`) and the key has a long safety-net TTL that the sync worker refreshes on every add or update event. Delete events remove the cache key outright, so there is no TTL to refresh in that case.

## How it works

The flow has three independent paths:

1. **On startup**, the demo server calls `cache.bulk_load(primary.list_records().await).await`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.get(entity_id).await`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process `tokio::sync::mpsc` channel. The sync worker task drains the channel and calls `cache.apply_change(event).await`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process change channel is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` struct wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/rust/cache.rs)):

```rust
use redis::aio::ConnectionManager;
use redis::Client;

let client = Client::open("redis://localhost:6379/")?;
let conn = ConnectionManager::new(client).await?;

let cache = PrefetchCache::new(conn, CacheConfig::default());
let primary = MockPrimaryStore::new(80);

// Pre-load every primary record into Redis in one pipelined round trip.
let records = primary.list_records().await;
cache.bulk_load(records).await?;

// Start the sync worker so primary mutations propagate into Redis.
let sync = Arc::new(SyncWorker::new(primary.clone(), cache.clone()));
sync.start().await;

// Read paths now go to Redis only.
let result = cache.get("cat-001").await?;
```

The helper uses [`ConnectionManager`](https://docs.rs/redis/latest/redis/aio/struct.ConnectionManager.html), which is cheap to clone, auto-reconnects on failure, and is the recommended way to share a redis-rs connection across tokio tasks.

### Data model

Each cached category is stored in a Redis hash:

```text
cache:category:cat-001
  id            = cat-001
  name          = Beverages
  display_order = 1
  featured      = true
  parent_id     = 
```

The implementation uses:

* [`HSET`]({{< relref "/commands/hset" >}}) + [`EXPIRE`]({{< relref "/commands/expire" >}}), pipelined, for the bulk load and every sync event
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) on the read path
* [`DEL`]({{< relref "/commands/del" >}}) for sync-delete events and explicit invalidation
* [`SCAN`]({{< relref "/commands/scan" >}}) to enumerate the cached keyspace and to clear the prefix
* [`TTL`]({{< relref "/commands/ttl" >}}) to surface remaining safety-net time in the demo UI

## Bulk load on startup

The `bulk_load` method pipelines a `DEL` + `HSET` + `EXPIRE` triple for every record. The pipeline is sent in a single round trip, so loading thousands of records takes one network RTT plus the time Redis spends executing the commands locally — typically tens of milliseconds even for a large reference table:

```rust
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
```

A plain `redis::pipe()` (without `.atomic()`) is intentional on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulk_load` directly from your own code on a cache that is already serving reads, either pause your writers first or switch to `redis::pipe().atomic()` so callers cannot observe a half-loaded record.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```rust
pub async fn get(&self, entity_id: &str) -> RedisResult<GetResult> {
    let cache_key = self.cache_key(entity_id);
    let mut conn = self.conn.clone();

    let started = Instant::now();
    let cached: HashMap<String, String> = conn.hgetall(&cache_key).await?;
    let redis_latency_ms = started.elapsed().as_secs_f64() * 1000.0;

    if !cached.is_empty() {
        self.stats.hits.fetch_add(1, Ordering::Relaxed);
        Ok(GetResult { record: Some(cached), hit: true, redis_latency_ms })
    } else {
        self.stats.misses.fetch_add(1, Ordering::Relaxed);
        Ok(GetResult { record: None, hit: false, redis_latency_ms })
    }
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `apply_change` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one `MULTI`/`EXEC` pipeline so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```rust
pub async fn apply_change(&self, change: &ChangeEvent) -> RedisResult<()> {
    let cache_key = self.cache_key(&change.id);
    let mut conn = self.conn.clone();

    match change.op.as_str() {
        "upsert" => {
            let fields = match &change.fields {
                Some(f) if !f.is_empty() => f,
                _ => return Ok(()),
            };
            let pairs: Vec<(String, String)> =
                fields.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
            redis::pipe()
                .atomic()
                .del(&cache_key).ignore()
                .hset_multiple(&cache_key, &pairs).ignore()
                .expire(&cache_key, self.cfg.ttl_seconds).ignore()
                .query_async::<_, ()>(&mut conn).await?;
        }
        "delete" => {
            let _: i64 = conn.del(&cache_key).await?;
        }
        _ => {}
    }
    Ok(())
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis. The early return on empty `fields` matters: redis-rs panics if you call `hset_multiple` with an empty slice, so a malformed upsert with no fields is dropped (in a real CDC consumer you would route it to a dead-letter queue).

## The sync worker

The `SyncWorker` runs a long-lived `tokio::task` that polls the primary's change channel with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/rust/sync_worker.rs)):

```rust
async fn run_loop(
    primary: Arc<MockPrimaryStore>,
    cache: PrefetchCache,
    poll_timeout: Duration,
    state: WorkerState,
) {
    loop {
        if *state.stop_rx.borrow() { return; }
        if *state.pause_rx.borrow() {
            state.idle_notify.notify_waiters();
            // park until the pause is lifted or the worker is stopped
            // ...
            continue;
        }
        match primary.next_change(poll_timeout).await {
            Some(change) => {
                if let Err(err) = cache.apply_change(&change).await {
                    eprintln!("[sync] failed to apply {:?} id={}: {}", change.op, change.id, err);
                }
            }
            None => continue,
        }
    }
}
```

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `invalidate(entity_id)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `clear()` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `bulk_load(primary.list_records().await).await` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`clear()` and `bulk_load()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.list_records()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```rust
let _ = state.sync.pause(Duration::from_secs(2)).await;
let _ = state.cache.clear().await.unwrap_or(0);
let records = state.primary.list_records().await;
let loaded = state.cache.bulk_load(records).await.unwrap_or(0);
state.sync.resume().await;
```

`pause()` flips a `tokio::sync::watch` flag and blocks on a `tokio::sync::Notify` until the worker confirms it has parked. Change events that arrive during the pause sit in the primary's channel and apply in order once `resume()` is called, so no event is lost.

## Hit/miss accounting

The helper keeps thread-safe atomic counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```rust
pub fn stats(&self) -> serde_json::Value {
    let hits = self.stats.hits.load(Ordering::Relaxed);
    let misses = self.stats.misses.load(Ordering::Relaxed);
    // ...
    serde_json::json!({
        "hits": hits,
        "misses": misses,
        "hit_rate_pct": hit_rate_pct,
        "prefetched": prefetched,
        "sync_events_applied": sync_events_applied,
        "sync_lag_ms_avg": sync_lag_ms_avg,
    })
}
```

In production you would emit these as Prometheus counters and gauges. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* You have a working [Rust toolchain](https://www.rust-lang.org/tools/install) (`cargo` 1.70+).
* The demo's `Cargo.toml` pins the `redis` crate at 0.24+ with the `tokio-comp`, `aio`, and `connection-manager` features; `cargo build` will pull the rest of the dependency graph.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of five files. Download them from the [`rust` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/rust) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/rust
curl -O $BASE/Cargo.toml
curl -O $BASE/cache.rs
curl -O $BASE/primary.rs
curl -O $BASE/sync_worker.rs
curl -O $BASE/demo_server.rs
```

### Start the demo server

From that directory:

```bash
cargo run --bin demo_server
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8790
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 90.1 ms; sync worker running
```

After starting the server, visit `http://localhost:8790`.

The demo accepts these flags:

* `--host` / `--port` — HTTP bind host and port (defaults to `127.0.0.1:8790`)
* `--redis-host` / `--redis-port` — Redis location
* `--cache-prefix` — cache key prefix (default `cache:category:`)
* `--ttl-seconds` — safety-net TTL in seconds (default `3600`)
* `--primary-latency-ms` — simulated primary read latency (default `80`)

It exposes a small interactive page where you can:

* See which IDs are in the cache and in the primary, side by side
* Read a category through the cache and confirm every read is a hit
* Update a field on the primary and watch the sync worker rewrite the cache hash
* Add and delete categories and watch them appear and disappear from the cache
* Invalidate one key or clear the entire cache to simulate a sync-pipeline failure
* Re-prefetch from the primary to recover from a broken cache state
* Watch the average sync lag, and confirm primary reads stay at one until you re-prefetch — each `/reprefetch` adds another primary read for the snapshot, but normal request traffic never reaches the primary at all

## The mock primary store

To make the demo self-contained, the example includes a `MockPrimaryStore` that stands in for a source-of-truth database
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/rust/primary.rs)):

```rust
pub struct MockPrimaryStore {
    pub read_latency_ms: u64,
    reads: AtomicU64,
    inner: Mutex<Inner>,                          // records + tx
    rx: Mutex<mpsc::UnboundedReceiver<ChangeEvent>>,
}

pub async fn update_field(&self, entity_id: &str, field: &str, value: &str) -> bool {
    let mut inner = self.inner.lock().await;
    // ... mutate the record ...
    emit_locked(&inner.tx, CHANGE_OP_UPSERT, entity_id, Some(snapshot));
    true
}
```

Every mutation appends a change event to an in-process [`tokio::sync::mpsc`](https://docs.rs/tokio/latest/tokio/sync/mpsc/index.html) channel. The emit happens **while the mutation lock is held**, so two concurrent updates cannot interleave their channel sends — the queue order always matches the order in which the records map was mutated. The sync worker drains the channel with a 50 ms timeout via `tokio::time::timeout` and applies each event to Redis. In a real system this channel is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

## Production usage

This guide uses a deliberately small local demo so you can focus on the prefetch-cache pattern. In production, you will usually want to harden several aspects of it.

### Replace the in-process change channel with a real CDC pipeline

The demo's in-process channel is the simplest possible stand-in for a CDC change feed. In production, the change feed lives outside the application process: an RDI pipeline configured against your primary database, Debezium connectors writing to Kafka or a Redis stream, or your application explicitly publishing change events from the write path. Whatever you choose, the consumer side stays the same — read events, apply them to Redis, advance the offset.

### Use a long safety-net TTL, not a freshness TTL

The TTL on each cache key is a **safety net**: it bounds memory if the sync pipeline silently stops, so a stuck consumer cannot leave stale data in Redis indefinitely. The TTL is not the freshness mechanism — freshness comes from the sync worker, which refreshes the TTL on every add or update event (delete events remove the key). Pick a TTL that is comfortably longer than your worst-case sync lag plus your alerting window, so a transient sync hiccup never expires hot keys.

### Decide what to do on a cache miss

A prefetch cache treats a miss as an error or a missing record. The two reasonable strategies are:

* **Return a 404 to the user.** Appropriate when the cache is authoritative for the lookup — for example, when the user is asking for a category by ID and the ID is not in the cache.
* **Page on-call.** A sustained miss rate on IDs you know exist is an incident: either the prefetch did not run, or the sync pipeline is broken.

Whichever you choose, do not fall back to the primary on the read path — that is what cache-aside is for, and conflating the two patterns breaks the load-isolation guarantee that prefetch provides.

### Bound the working set to what fits in memory

Prefetch only works if the entire dataset fits in Redis memory with headroom. Estimate the size of your reference data, multiply by a growth factor, and confirm the result fits within your Redis instance's `maxmemory` minus what other use cases need. If the working set grows beyond what Redis can hold, switch the dataset to a cache-aside pattern instead — the request path will pay miss latency, but you will not OOM.

### Reconcile periodically against the primary

CDC pipelines are eventually consistent: an event can be lost (broker outage, consumer crash, configuration drift) and the cache can silently diverge from the source. Run a periodic reconciliation job that re-reads all primary records, compares them against the cache, and either re-prefetches or fixes individual entries. Even running it once a day catches drift that ad-hoc inspection would miss.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:category:{id}`) so different services cannot clobber each other's entries. `CacheConfig::prefix` takes the prefix exactly for this; the demo also accepts `--cache-prefix` on the command line.

### Use `ConnectionManager`, not a bare connection

`redis::aio::ConnectionManager` is the recommended async connection type for redis-rs. It is cheap to clone (the demo passes a clone to every async task), reconnects automatically on transient failures, and pipelines commands behind the scenes. A bare `redis::aio::Connection` is not `Clone` and cannot be safely shared across tokio tasks. If you need a true connection pool — for example, to fan out heavy `MULTI`/`EXEC` traffic across multiple sockets — use [`deadpool-redis`](https://crates.io/crates/deadpool-redis) or [`bb8-redis`](https://crates.io/crates/bb8-redis).

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache keys directly to confirm the bulk load and the sync worker are writing what you expect:

```bash
redis-cli --scan --pattern 'cache:category:*'
redis-cli HGETALL cache:category:cat-001
redis-cli TTL cache:category:cat-001
```

If a key is missing for an ID that still exists in the primary, the prefetch did not run, the key expired without a sync refresh, or someone invalidated it. If a key is still present for an ID that was deleted in the primary, the delete event has not yet been applied. If the TTL is much lower than the configured safety-net value on a hot key, the sync worker is not keeping up.

## Learn more

* [redis-rs crate](https://crates.io/crates/redis) - Install and use the Rust Redis client
* [`HSET`]({{< relref "/commands/hset" >}}) - Write hash fields
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [`EXPIRE`]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [`DEL`]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [`SCAN`]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [`TTL`]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
