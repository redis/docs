---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis cache-aside layer in Python with redis-py
linkTitle: redis-py example (Python)
title: Redis cache-aside with redis-py
weight: 1
---

This guide shows you how to implement a Redis cache-aside layer in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It includes a small local web server built with the Python standard library so you can see cache hits, misses, invalidation on write, and stampede protection in action.

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

1. The application calls `cache.get(product_id, loader)`
2. The helper runs `HGETALL` against `cache:product:{id}`
3. On a hit, the cached hash is returned directly
4. On a miss, the helper acquires a Lua-backed single-flight lock and calls `loader(product_id)` to read the primary
5. The helper writes the result back to Redis with `HSET` plus `EXPIRE` and releases the lock
6. Concurrent callers that fail to acquire the lock wait briefly for the cache to populate, then return that value instead of issuing their own primary read

On a write, the application updates the primary and then deletes the cache key, so the next read repopulates from the new source value.

## The cache-aside helper

The `RedisCache` class wraps the cache-aside operations
([source](cache.py)):

```python
import redis
from cache import RedisCache
from primary import MockPrimaryStore

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
primary = MockPrimaryStore(read_latency_ms=150)
cache = RedisCache(redis_client=r, ttl=30)

# Read through the cache.
record, hit, redis_ms = cache.get("p-001", primary.read)

# Update a single field without rewriting the whole record.
cache.update_field("p-001", "stock", "41")

# Invalidate the cache key on a write to the primary.
primary.update_field("p-001", "price_cents", "699")
cache.invalidate("p-001")
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

The `get()` method runs `HGETALL` on the cache key first. On a hit it returns the cached hash and records the hit in an in-process counter. On a miss, it delegates to a single-flight loader:

```python
def get(
    self,
    entity_id: str,
    loader: Callable[[str], Optional[dict[str, str]]],
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

    return self._load_with_single_flight(entity_id, loader), False, redis_latency_ms
```

The return tuple includes the measured Redis round-trip time so the demo UI can show the latency difference between a hit and a miss.

## Stampede protection with a Lua lock

When a popular key expires, every concurrent reader observes the miss at the same instant. Without coordination, all of them would query the primary and overwrite the cache redundantly — a *cache stampede*.

The helper uses a tiny Lua script to acquire a short-lived lock atomically. Only the caller that wins the `SET NX` becomes the primary loader; the rest poll the cache briefly and return the value the lock holder writes:

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

The Python side wires both scripts up through `register_script` and runs them on every miss:

```python
def _load_with_single_flight(
    self,
    entity_id: str,
    loader: Callable[[str], Optional[dict[str, str]]],
) -> Optional[dict[str, str]]:
    cache_key = self._cache_key(entity_id)
    lock_key = self._lock_key(entity_id)
    token = secrets.token_hex(8)

    acquired = self._acquire_lock(
        keys=[lock_key],
        args=[token, self.lock_ttl_ms],
    )

    if acquired:
        try:
            record = loader(entity_id)
            if record is None:
                return None
            pipe = self.redis.pipeline()
            pipe.delete(cache_key)
            pipe.hset(cache_key, mapping=record)
            pipe.expire(cache_key, self.ttl)
            pipe.execute()
            return record
        finally:
            self._release_lock(keys=[lock_key], args=[token])

    # Another caller is loading. Poll briefly for the cache to populate.
    with self._stats_lock:
        self._stampedes_suppressed += 1

    deadline = time.monotonic() + (self.lock_ttl_ms / 1000.0)
    while time.monotonic() < deadline:
        time.sleep(self.wait_poll_ms / 1000.0)
        cached = self.redis.hgetall(cache_key)
        if cached:
            return cached

    return loader(entity_id)
```

The unique `token` per caller is what makes the release script safe — only the caller that actually holds the lock can release it.

## Invalidation on write

When a write hits the primary, the application invalidates the cache key. The next read pulls fresh data from the primary:

```python
def invalidate(self, entity_id: str) -> bool:
    return self.redis.delete(self._cache_key(entity_id)) == 1
```

This is the simplest and safest pattern: never try to keep the cache and primary in sync directly, just delete the cache entry and let the next read repopulate it.

## Field-level updates

Because each record is stored as a hash, the cache helper can also update a single field in place without re-serializing the full record. The update only writes if the entry is already cached, so a partial record can never appear in Redis:

```python
def update_field(self, entity_id: str, field: str, value: str) -> bool:
    cache_key = self._cache_key(entity_id)
    with self.redis.pipeline() as pipe:
        while True:
            try:
                pipe.watch(cache_key)
                if not pipe.exists(cache_key):
                    pipe.unwatch()
                    return False
                pipe.multi()
                pipe.hset(cache_key, field, value)
                pipe.expire(cache_key, self.ttl)
                pipe.execute()
                return True
            except redis.WatchError:
                continue
```

This is useful for hot fields that change more often than the rest of the record (a stock counter, a view count) and would otherwise force a full reload.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, and stampedes that were suppressed by the single-flight lock. The demo UI surfaces these so you can see the cache absorbing load:

```python
def stats(self) -> dict[str, int]:
    with self._stats_lock:
        total = self._hits + self._misses
        hit_rate = round(100.0 * self._hits / total, 1) if total else 0.0
        return {
            "hits": self._hits,
            "misses": self._misses,
            "stampedes_suppressed": self._stampedes_suppressed,
            "hit_rate_pct": hit_rate,
        }
```

In production you would emit these as Prometheus counters or push them into your metrics pipeline rather than holding them in process memory.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* The `redis` Python package is installed:

```bash
pip install redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the cache-aside layer in action
([source](demo_server.py)):

```bash
python demo_server.py
```

The demo server uses only Python standard library features for HTTP handling and concurrency:

* [`http.server`](https://docs.python.org/3/library/http.server.html) for the web server
* [`urllib.parse`](https://docs.python.org/3/library/urllib.parse.html) for query and form decoding
* [`concurrent.futures`](https://docs.python.org/3/library/concurrent.futures.html) for the stampede test thread pool

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
([source](primary.py)):

```python
class MockPrimaryStore:
    def __init__(self, read_latency_ms: int = 150) -> None:
        self.read_latency_ms = read_latency_ms
        ...

    def read(self, product_id: str) -> Optional[dict[str, str]]:
        time.sleep(self.read_latency_ms / 1000.0)
        ...
```

Every call to `read()` sleeps for `read_latency_ms` so the difference between a cache hit and a miss is obvious in the UI. The store also tracks the total number of primary reads, which the stampede test uses to confirm that single-flight is working — for N concurrent readers against a cold key, you should see exactly one primary read.

In a real application this would be replaced by a SQL query, an HTTP call to a downstream service, or any other slow-but-authoritative source.

## Production usage

This guide uses a deliberately small local demo so you can focus on the cache-aside pattern. In production, you will usually want to harden several aspects of it.

### Choose a TTL that matches your staleness tolerance

The TTL is the upper bound on how long a stale value can be served. Shorter TTLs mean lower hit rates and more primary load; longer TTLs mean higher hit rates and more stale reads between writes. Pick the value that matches your business tolerance for stale data, and combine it with explicit invalidation on writes for the cases where you cannot tolerate any staleness.

### Invalidate, don't try to keep the cache in sync

When the underlying record changes, delete the cache key rather than rewriting it. Cache-aside is robust precisely because it never assumes the cache holds the latest value — the next read always re-fetches from the primary on a miss. Trying to keep the cache and primary in sync from the application opens the door to subtle ordering bugs.

### Handle missing records explicitly

In this demo, a missing record returns `None` and nothing is cached. In a real system you may want to cache "not found" sentinels with a short TTL to absorb load from probing for non-existent IDs, while making sure the sentinel is shorter than the positive cache entry so a newly-created record becomes visible quickly.

### Tune the single-flight lock TTL

The lock TTL needs to be longer than the worst-case primary read latency so a slow loader does not lose the lock midway. If the loader exceeds the lock TTL, the lock can be re-acquired by another caller — the unique token in `RELEASE_LOCK_SCRIPT` ensures the original caller does not delete someone else's lock, but it can still cause a redundant primary read.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:product:{id}`) so different services cannot clobber each other's entries.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache key directly to confirm the application is writing the fields and TTL you expect:

```bash
redis-cli HGETALL cache:product:p-001
redis-cli TTL cache:product:p-001
```

## Learn more

* [redis-py guide]({{< relref "/develop/clients/redis-py" >}}) - Install and use the Python Redis client
* [SET command]({{< relref "/commands/set" >}}) - Set a string with TTL options (`EX`, `PX`, `NX`)
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Atomic single-flight locks and stampede mitigation
