---
aliases:
- /develop/use-cases/cache-aside/node-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis cache-aside layer in Node.js with node-redis
linkTitle: node-redis example (Node.js)
title: Redis cache-aside with node-redis
weight: 2
---

This guide shows you how to implement a Redis cache-aside layer in Node.js with [`node-redis`]({{< relref "/develop/clients/nodejs" >}}). It includes a small local web server built with Node's standard `http` module so you can see cache hits, misses, invalidation on write, and stampede protection in action.

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

1. The application calls `cache.get(productId, loader)`
2. The helper runs `HGETALL` against `cache:product:{id}`
3. On a hit, the cached hash is returned directly
4. On a miss, the helper acquires a Lua-backed single-flight lock and calls `loader(productId)` to read the primary
5. The helper writes the result back to Redis with `HSET` plus `EXPIRE` and releases the lock
6. Concurrent callers that fail to acquire the lock wait briefly for the cache to populate, then return that value instead of issuing their own primary read

On a write, the application updates the primary and then deletes the cache key, so the next read repopulates from the new source value.

## The cache-aside helper

The `RedisCache` class wraps the cache-aside operations
([source](cache.js)):

```javascript
const { createClient } = require("redis");
const { RedisCache } = require("./cache");
const { MockPrimaryStore } = require("./primary");

const client = createClient({ socket: { host: "localhost", port: 6379 } });
await client.connect();

const primary = new MockPrimaryStore({ readLatencyMs: 150 });
const cache = new RedisCache({ redisClient: client, ttl: 30 });

// Read through the cache.
const { record, hit, redisLatencyMs } = await cache.get("p-001", (id) => primary.read(id));

// Update a single field without rewriting the whole record.
await cache.updateField("p-001", "stock", "41");

// Invalidate the cache key on a write to the primary.
primary.updateField("p-001", "price_cents", "699");
await cache.invalidate("p-001");
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

```javascript
async get(entityId, loader) {
  const cacheKey = this._cacheKey(entityId);

  const started = process.hrtime.bigint();
  const cached = await this.redis.hGetAll(cacheKey);
  const redisLatencyMs = Number(process.hrtime.bigint() - started) / 1e6;

  if (cached && Object.keys(cached).length > 0) {
    this._stats.hits += 1;
    return { record: cached, hit: true, redisLatencyMs };
  }

  this._stats.misses += 1;
  const record = await this._loadWithSingleFlight(entityId, loader);
  return { record, hit: false, redisLatencyMs };
}
```

The return object includes the measured Redis round-trip time so the demo UI can show the latency difference between a hit and a miss.

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

The Node.js side runs both scripts via `EVAL` on every miss:

```javascript
async _loadWithSingleFlight(entityId, loader) {
  const cacheKey = this._cacheKey(entityId);
  const lockKey = this._lockKey(entityId);
  const token = randomBytes(8).toString("hex");

  const acquired = await this.redis.eval(ACQUIRE_LOCK_SCRIPT, {
    keys: [lockKey],
    arguments: [token, String(this.lockTtlMs)],
  });

  if (acquired === 1) {
    try {
      const record = await loader(entityId);
      if (record == null) return null;
      const multi = this.redis.multi();
      multi.del(cacheKey);
      multi.hSet(cacheKey, record);
      multi.expire(cacheKey, this.ttl);
      await multi.exec();
      return record;
    } finally {
      await this.redis.eval(RELEASE_LOCK_SCRIPT, {
        keys: [lockKey],
        arguments: [token],
      });
    }
  }

  this._stats.stampedesSuppressed += 1;
  const deadline = Date.now() + this.lockTtlMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, this.waitPollMs));
    const cached = await this.redis.hGetAll(cacheKey);
    if (cached && Object.keys(cached).length > 0) return cached;
  }
  return loader(entityId);
}
```

The unique `token` per caller is what makes the release script safe — only the caller that actually holds the lock can release it.

## Invalidation on write

When a write hits the primary, the application invalidates the cache key. The next read pulls fresh data from the primary:

```javascript
async invalidate(entityId) {
  const deleted = await this.redis.del(this._cacheKey(entityId));
  return deleted === 1;
}
```

This is the simplest and safest pattern: never try to keep the cache and primary in sync directly, just delete the cache entry and let the next read repopulate it.

## Field-level updates

Because each record is stored as a hash, the cache helper can also update a single field in place without re-serializing the full record. The update only writes if the entry is already cached, so a partial record can never appear in Redis:

```javascript
async updateField(entityId, field, value) {
  const cacheKey = this._cacheKey(entityId);
  while (true) {
    await this.redis.watch(cacheKey);
    const exists = await this.redis.exists(cacheKey);
    if (!exists) {
      await this.redis.unwatch();
      return false;
    }
    const result = await this.redis
      .multi()
      .hSet(cacheKey, field, String(value))
      .expire(cacheKey, this.ttl)
      .exec();
    if (result === null) continue;
    return true;
  }
}
```

This is useful for hot fields that change more often than the rest of the record (a stock counter, a view count) and would otherwise force a full reload.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, and stampedes that were suppressed by the single-flight lock. The demo UI surfaces these so you can see the cache absorbing load:

```javascript
stats() {
  const total = this._stats.hits + this._stats.misses;
  const hitRate = total > 0 ? Math.round((1000 * this._stats.hits) / total) / 10 : 0;
  return {
    hits: this._stats.hits,
    misses: this._stats.misses,
    stampedes_suppressed: this._stats.stampedesSuppressed,
    hit_rate_pct: hitRate,
  };
}
```

In production you would emit these as Prometheus counters or push them into your metrics pipeline rather than holding them in process memory.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Node.js 18 or later is installed.
* The `redis` package is installed:

```bash
npm install redis
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the cache-aside layer in action
([source](demoServer.js)):

```bash
node demoServer.js
```

The demo server uses only Node's built-in modules for HTTP handling and concurrency:

* [`http`](https://nodejs.org/api/http.html) for the web server
* [`url`](https://nodejs.org/api/url.html) for query and form parsing
* [`crypto`](https://nodejs.org/api/crypto.html) for the per-caller lock token

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
([source](primary.js)):

```javascript
class MockPrimaryStore {
  constructor({ readLatencyMs = 150 } = {}) {
    this.readLatencyMs = readLatencyMs;
    ...
  }

  async read(id) {
    await new Promise((r) => setTimeout(r, this.readLatencyMs));
    ...
  }
}
```

Every call to `read()` sleeps for `readLatencyMs` so the difference between a cache hit and a miss is obvious in the UI. The store also tracks the total number of primary reads, which the stampede test uses to confirm that single-flight is working — for N concurrent readers against a cold key, you should see exactly one primary read.

In a real application this would be replaced by a SQL query, an HTTP call to a downstream service, or any other slow-but-authoritative source.

## Production usage

This guide uses a deliberately small local demo so you can focus on the cache-aside pattern. In production, you will usually want to harden several aspects of it.

### Choose a TTL that matches your staleness tolerance

The TTL is the upper bound on how long a stale value can be served. Shorter TTLs mean lower hit rates and more primary load; longer TTLs mean higher hit rates and more stale reads between writes. Pick the value that matches your business tolerance for stale data, and combine it with explicit invalidation on writes for the cases where you cannot tolerate any staleness.

### Invalidate, don't try to keep the cache in sync

When the underlying record changes, delete the cache key rather than rewriting it. Cache-aside is robust precisely because it never assumes the cache holds the latest value — the next read always re-fetches from the primary on a miss.

### Handle missing records explicitly

In this demo, a missing record returns `null` and nothing is cached. In a real system you may want to cache "not found" sentinels with a short TTL to absorb load from probing for non-existent IDs, while making sure the sentinel is shorter than the positive cache entry so a newly-created record becomes visible quickly.

### Tune the single-flight lock TTL

The lock TTL needs to be longer than the worst-case primary read latency so a slow loader does not lose the lock midway. The unique token in `RELEASE_LOCK_SCRIPT` ensures the original caller does not delete someone else's lock if its lock has expired.

### Namespace cache keys in shared Redis deployments

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:product:{id}`) so different services cannot clobber each other's entries.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache key directly to confirm the application is writing the fields and TTL you expect:

```bash
redis-cli HGETALL cache:product:p-001
redis-cli TTL cache:product:p-001
```

## Learn more

* [node-redis guide]({{< relref "/develop/clients/nodejs" >}}) - Install and use the Node.js Redis client
* [SET command]({{< relref "/commands/set" >}}) - Set a string with TTL options (`EX`, `PX`, `NX`)
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Atomic single-flight locks and stampede mitigation
