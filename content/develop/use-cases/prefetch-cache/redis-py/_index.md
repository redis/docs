---
aliases:
- /develop/use-cases/prefetch-cache/python
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Python with redis-py
linkTitle: redis-py example (Python)
title: Redis prefetch cache with redis-py
weight: 1
---

This guide shows you how to implement a Redis prefetch cache in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It includes a small local web server built with the Python standard library so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

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

1. **On startup**, the demo server calls `cache.bulk_load(primary.list_records())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.get(entity_id)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process queue. The sync worker thread drains the queue and calls `cache.apply_change(event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process change queue is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/redis-py/cache.py)):

```python
import redis
from cache import PrefetchCache
from primary import MockPrimaryStore
from sync_worker import SyncWorker

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
primary = MockPrimaryStore()
cache = PrefetchCache(redis_client=r, ttl_seconds=3600)

# Pre-load every primary record into Redis in one pipelined round trip.
cache.bulk_load(primary.list_records())

# Start the sync worker so primary mutations propagate into Redis.
sync = SyncWorker(primary=primary, cache=cache)
sync.start()

# Read paths now go to Redis only.
record, hit, redis_ms = cache.get("cat-001")
```

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

```python
def bulk_load(self, records: Iterable[dict[str, str]]) -> int:
    loaded = 0
    pipe = self.redis.pipeline(transaction=False)
    for record in records:
        entity_id = record.get("id")
        if not entity_id:
            continue
        cache_key = self._cache_key(entity_id)
        pipe.delete(cache_key)
        pipe.hset(cache_key, mapping=record)
        pipe.expire(cache_key, self.ttl_seconds)
        loaded += 1
    if loaded:
        pipe.execute()
    return loaded
```

`transaction=False` is intentional on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulk_load` directly from your own code on a cache that is already serving reads, either pause your writers first or rewrite it with `pipeline(transaction=True)` so callers cannot observe a half-loaded record.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```python
def get(
    self,
    entity_id: str,
) -> tuple[Optional[dict[str, str]], bool, float]:
    cache_key = self._cache_key(entity_id)

    started = time.perf_counter()
    cached = self.redis.hgetall(cache_key)
    redis_latency_ms = (time.perf_counter() - started) * 1000.0

    if cached:
        with self._stats_lock:
            self._hits += 1
        return cached, True, redis_latency_ms

    with self._stats_lock:
        self._misses += 1
    return None, False, redis_latency_ms
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `apply_change` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one pipelined transaction so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```python
def apply_change(self, change: dict) -> None:
    op = change.get("op")
    entity_id = change.get("id")
    if not entity_id:
        return

    cache_key = self._cache_key(entity_id)

    if op == "upsert":
        fields = change.get("fields") or {}
        pipe = self.redis.pipeline(transaction=True)
        pipe.delete(cache_key)
        pipe.hset(cache_key, mapping=fields)
        pipe.expire(cache_key, self.ttl_seconds)
        pipe.execute()
    elif op == "delete":
        self.redis.delete(cache_key)
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis.

## The sync worker

The `SyncWorker` runs a daemon thread that blocks on the primary's change queue with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/redis-py/sync_worker.py)):

```python
def _run(self) -> None:
    while not self._stop_event.is_set():
        change = self.primary.next_change(timeout=self.poll_timeout_s)
        if change is None:
            continue
        try:
            self.cache.apply_change(change)
        except Exception as exc:
            print(f"[sync] failed to apply {change!r}: {exc}")
```

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `invalidate(entity_id)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `clear()` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `bulk_load(primary.list_records())` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`clear()` and `bulk_load()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.list_records()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```python
self.sync.pause()
try:
    self.cache.clear()
    self.cache.bulk_load(self.primary.list_records())
finally:
    self.sync.resume()
```

`pause()` waits for the worker to finish whatever event it is currently applying, parks the run loop, and returns. Change events that arrive during the pause sit in the primary's queue and apply in order once `resume()` is called, so no event is lost.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```python
def stats(self) -> dict[str, float]:
    with self._stats_lock:
        total = self._hits + self._misses
        hit_rate = round(100.0 * self._hits / total, 1) if total else 0.0
        avg_lag = (
            round(self._sync_lag_ms_total / self._sync_lag_samples, 2)
            if self._sync_lag_samples
            else 0.0
        )
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate_pct": hit_rate,
            "prefetched": self._prefetched,
            "sync_events_applied": self._sync_events_applied,
            "sync_lag_ms_avg": avg_lag,
        }
```

In production you would emit these as Prometheus counters and gauges. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The `redis` Python package is installed:

```bash
pip install redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of four files. Download them from the [`redis-py` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/redis-py) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/redis-py
curl -O $BASE/cache.py
curl -O $BASE/primary.py
curl -O $BASE/sync_worker.py
curl -O $BASE/demo_server.py
```

### Start the demo server

From that directory:

```bash
python3 demo_server.py
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8082
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 82.1 ms; sync worker running
```

After starting the server, visit `http://localhost:8082`.

The demo server uses only Python standard library features for HTTP handling and concurrency:

* [`http.server`](https://docs.python.org/3/library/http.server.html) for the web server
* [`urllib.parse`](https://docs.python.org/3/library/urllib.parse.html) for query and form decoding
* [`threading`](https://docs.python.org/3/library/threading.html) for the sync worker daemon

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
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/redis-py/primary.py)):

```python
class MockPrimaryStore:
    def __init__(self, read_latency_ms: int = 80) -> None:
        ...

    def list_records(self) -> list[dict[str, str]]:
        time.sleep(self.read_latency_ms / 1000.0)
        ...

    def update_field(self, entity_id: str, field: str, value: str) -> bool:
        ...
        self._emit_change(CHANGE_OP_UPSERT, entity_id, snapshot)
        return True
```

Every mutation appends a change event to an in-process [`queue.Queue`](https://docs.python.org/3/library/queue.html). The sync worker drains the queue with a 50 ms timeout and applies each event to Redis. In a real system this queue is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

## Production usage

This guide uses a deliberately small local demo so you can focus on the prefetch-cache pattern. In production, you will usually want to harden several aspects of it.

### Replace the in-process change queue with a real CDC pipeline

The demo's in-process queue is the simplest possible stand-in for a CDC change feed. In production, the change feed lives outside the application process: an RDI pipeline configured against your primary database, Debezium connectors writing to Kafka or a Redis stream, or your application explicitly publishing change events from the write path. Whatever you choose, the consumer side stays the same — read events, apply them to Redis, advance the offset.

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

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:category:{id}`) so different services cannot clobber each other's entries. The helper takes a `prefix` argument exactly for this.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache keys directly to confirm the bulk load and the sync worker are writing what you expect:

```bash
redis-cli --scan --pattern 'cache:category:*'
redis-cli HGETALL cache:category:cat-001
redis-cli TTL cache:category:cat-001
```

If a key is missing for an ID that still exists in the primary, the prefetch did not run, the key expired without a sync refresh, or someone invalidated it. If a key is still present for an ID that was deleted in the primary, the delete event has not yet been applied. If the TTL is much lower than the configured safety-net value on a hot key, the sync worker is not keeping up.

## Learn more

* [redis-py guide]({{< relref "/develop/clients/redis-py" >}}) - Install and use the Python Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
