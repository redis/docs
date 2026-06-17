---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis cache-aside layer in PHP with Predis
linkTitle: Predis example (PHP)
title: Redis cache-aside with Predis
weight: 7
---

This guide shows you how to implement a Redis cache-aside layer in PHP with the [Predis](https://github.com/predis/predis) client library. It includes a small local web server built on PHP's built-in development server so you can see cache hits, misses, invalidation on write, and stampede protection in action.

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

1. The application calls `$cache->get($productId, fn($id) => $primary->read($id))`
2. The helper runs `HGETALL` against `cache:product:{id}`
3. On a hit, the cached hash is returned directly
4. On a miss, the helper acquires a Lua-backed single-flight lock and invokes the loader to fetch from the primary
5. The helper writes the result back to Redis with `HSET` plus `EXPIRE` and releases the lock
6. Concurrent worker processes that fail to acquire the lock wait briefly for the cache to populate, then return that value instead of issuing their own primary read

On a write, the application updates the primary and then deletes the cache key, so the next read repopulates from the new source value.

## State across stateless requests

PHP requests do not share process memory, so the demo keeps everything that needs to persist between requests in Redis itself:

* Hit, miss, and stampede counters live in the `demo:cache_stats` hash, incremented atomically with `HINCRBY`.
* The mock primary's read counter and per-record state live under `demo:primary:*` keys.

This is a cache-aside pattern detail rather than a Redis one — the same helper would use process-local counters in a long-running PHP-FPM or Roadrunner deployment, but the public method surface stays the same.

## The cache-aside helper

The `RedisCache` class wraps the cache-aside operations
([source](Cache.php)):

```php
require_once 'vendor/autoload.php';
require_once 'Cache.php';
require_once 'Primary.php';

use Predis\Client as PredisClient;

$redis = new PredisClient(['host' => 'localhost', 'port' => 6379]);
$primary = new MockPrimaryStore($redis, readLatencyMs: 150);
$cache = new RedisCache($redis, ttl: 30);

// Read through the cache.
$result = $cache->get('p-001', fn(string $id) => $primary->read($id));
echo "hit={$result['hit']} latency={$result['redis_latency_ms']} ms\n";

// Update a single field without rewriting the whole record.
$cache->updateField('p-001', 'stock', '41');

// Invalidate the cache key on a write to the primary.
$primary->updateField('p-001', 'price_cents', '699');
$cache->invalidate('p-001');
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
* [`HMSET`]({{< relref "/commands/hmset" >}}) plus [`EXPIRE`]({{< relref "/commands/expire" >}}) to repopulate after a miss
* [`DEL`]({{< relref "/commands/del" >}}) to invalidate on writes
* [`TTL`]({{< relref "/commands/ttl" >}}) to surface remaining staleness in the demo UI
* [`EVAL`]({{< relref "/commands/eval" >}}) for the Lua single-flight lock that prevents stampedes
* [`WATCH`]({{< relref "/commands/watch" >}})/[`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) for the conditional field update path
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the cross-request hit/miss counters

## Cache-aside reads

The `get()` method runs `HGETALL` on the cache key first. On a hit it returns the cached hash and increments the hit counter. On a miss, it delegates to a single-flight loader:

```php
public function get(string $entityId, callable $loader): array
{
    $cacheKey = $this->cacheKey($entityId);

    $started = self::monotonicMs();
    $cached = $this->redis->hgetall($cacheKey);
    $redisLatencyMs = self::monotonicMs() - $started;

    if (is_array($cached) && count($cached) > 0) {
        $this->recordHit();
        return ['record' => $cached, 'hit' => true, 'redis_latency_ms' => $redisLatencyMs];
    }

    $this->recordMiss();
    $record = $this->loadWithSingleFlight($entityId, $loader);
    return ['record' => $record, 'hit' => false, 'redis_latency_ms' => $redisLatencyMs];
}
```

The returned array includes the measured Redis round-trip time so the demo UI can show the latency difference between a hit and a miss.

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

The PHP side runs both scripts via `EVAL` on every miss:

```php
private function loadWithSingleFlight(string $entityId, callable $loader): ?array
{
    $cacheKey = $this->cacheKey($entityId);
    $lockKey = $this->lockKey($entityId);
    $token = bin2hex(random_bytes(8));

    $acquired = (int) $this->redis->eval(
        self::ACQUIRE_LOCK_SCRIPT, 1, $lockKey, $token, (string) $this->lockTtlMs
    );

    if ($acquired === 1) {
        try {
            $record = $loader($entityId);
            if ($record === null) return null;
            $this->redis->transaction(function ($pipe) use ($cacheKey, $record): void {
                $pipe->del([$cacheKey]);
                $pipe->hmset($cacheKey, $record);
                $pipe->expire($cacheKey, $this->ttl);
            });
            return $record;
        } finally {
            $this->redis->eval(self::RELEASE_LOCK_SCRIPT, 1, $lockKey, $token);
        }
    }

    $this->recordStampedeSuppressed();
    $deadline = self::monotonicMs() + $this->lockTtlMs;
    while (self::monotonicMs() < $deadline) {
        usleep($this->waitPollMs * 1000);
        $cached = $this->redis->hgetall($cacheKey);
        if (is_array($cached) && count($cached) > 0) return $cached;
    }
    return $loader($entityId);
}
```

The unique `token` per caller is what makes the release script safe — only the caller that actually holds the lock can release it.

## Invalidation on write

When a write hits the primary, the application invalidates the cache key. The next read pulls fresh data from the primary:

```php
public function invalidate(string $entityId): bool
{
    return ((int) $this->redis->del([$this->cacheKey($entityId)])) === 1;
}
```

This is the simplest and safest pattern: never try to keep the cache and primary in sync directly, just delete the cache entry and let the next read repopulate it.

## Field-level updates

Because each record is stored as a hash, the cache helper can also update a single field in place without re-serializing the full record. The update only writes if the entry is already cached, so a partial record can never appear in Redis:

```php
public function updateField(string $entityId, string $field, string $value): bool
{
    $cacheKey = $this->cacheKey($entityId);
    while (true) {
        $this->redis->watch($cacheKey);
        if ((int) $this->redis->exists($cacheKey) === 0) {
            $this->redis->unwatch();
            return false;
        }
        $result = $this->redis->transaction(function ($pipe) use ($cacheKey, $field, $value): void {
            $pipe->hset($cacheKey, $field, $value);
            $pipe->expire($cacheKey, $this->ttl);
        });
        if ($result !== null) {
            return true;
        }
        // null means WATCH detected a change — retry.
    }
}
```

This is useful for hot fields that change more often than the rest of the record (a stock counter, a view count) and would otherwise force a full reload.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* PHP 8.1 or later is installed.
* The Predis library is installed via Composer:

```bash
composer require predis/predis
```

If your Redis server is running elsewhere, set `REDIS_HOST` and `REDIS_PORT` in the environment before starting the demo.

## Running the demo

A local demo server is included to show the cache-aside layer in action
([source](demo_server.php)):

```bash
php -S localhost:8080 demo_server.php
```

The demo server uses PHP's built-in development server plus a separate worker script (`stampede_worker.php`) for the concurrent stampede test. The PHP CLI server is single-threaded, so the demo launches independent PHP processes via `proc_open` to get genuine parallelism for that test.

It exposes a small interactive page where you can:

* Read a product through the cache and see whether it was a hit or a miss
* Compare the measured Redis round-trip against the simulated primary read latency
* Watch the cache TTL count down between requests
* Update a field on the primary and see the cache invalidate automatically
* Run a stampede test that spawns N concurrent worker processes against a freshly-invalidated key and confirms only one of them reaches the primary
* Reset the hit/miss counters at any time

After starting the server, visit `http://localhost:8080`.

## The mock primary store

To make the demo self-contained, the example includes a `MockPrimaryStore` that stands in for a slow disk-backed database
([source](Primary.php)):

```php
public function read(string $id): ?array
{
    usleep($this->readLatencyMs * 1000);
    $this->redis->incr(self::READS_KEY);
    $record = $this->redis->hgetall(self::RECORDS_KEY_PREFIX . $id);
    return is_array($record) && count($record) > 0 ? $record : null;
}
```

Every call to `read()` sleeps for `$readLatencyMs` so the difference between a cache hit and a miss is obvious in the UI. Records are seeded into Redis under `demo:primary:product:{id}` so updates and the read counter survive between requests.

For the stampede test, an N-worker burst against a cold key should produce exactly one increment of `demo:primary:reads`, confirming that single-flight is working.

In a real application this would be replaced by a SQL query, an HTTP call to a downstream service, or any other slow-but-authoritative source.

## Production usage

This guide uses a deliberately small local demo so you can focus on the cache-aside pattern. In production, you will usually want to harden several aspects of it.

### Choose a TTL that matches your staleness tolerance

The TTL is the upper bound on how long a stale value can be served. Shorter TTLs mean lower hit rates and more primary load; longer TTLs mean higher hit rates and more stale reads between writes. Pick the value that matches your business tolerance for stale data, and combine it with explicit invalidation on writes for the cases where you cannot tolerate any staleness.

### Invalidate, don't try to keep the cache in sync

When the underlying record changes, delete the cache key rather than rewriting it. Cache-aside is robust precisely because it never assumes the cache holds the latest value — the next read always re-fetches from the primary on a miss.

### Handle missing records explicitly

In this demo, a missing record returns `null` and nothing is cached. In a real system you may want to cache "not found" sentinels with a short TTL to absorb load from probing for non-existent IDs, while making sure the sentinel TTL is shorter than the positive cache entry so a newly-created record becomes visible quickly.

### Tune the single-flight lock TTL

The lock TTL needs to be longer than the worst-case primary read latency so a slow loader does not lose the lock midway. The unique token in `RELEASE_LOCK_SCRIPT` ensures the original caller does not delete someone else's lock if its lock has expired.

### Use a long-running PHP runtime in production

The PHP built-in server used here is fine for local development, but in production you will typically run PHP under PHP-FPM, Apache mod_php, FrankenPHP, or Roadrunner. The cache-aside helper code is unchanged, but you can move the hit/miss counters into shared memory (APCu, Roadrunner KV) instead of Redis if you want to avoid the per-request increment.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:product:{id}`) so different services cannot clobber each other's entries.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache key directly to confirm the application is writing the fields and TTL you expect:

```bash
redis-cli HGETALL cache:product:p-001
redis-cli TTL cache:product:p-001
```

## Learn more

* [Predis on GitHub](https://github.com/predis/predis) - Install and use the PHP Redis client
* [SET command]({{< relref "/commands/set" >}}) - Set a string with TTL options (`EX`, `PX`, `NX`)
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Atomic single-flight locks and stampede mitigation
