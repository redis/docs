---
aliases:
- /develop/use-cases/cache-aside/go-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis cache-aside layer in Go with go-redis
linkTitle: go-redis example (Go)
title: Redis cache-aside with Go
weight: 3
---

This guide shows you how to implement a Redis cache-aside layer in Go with the [`go-redis`]({{< relref "/develop/clients/go" >}}) client library. It includes a small local web server built with Go's standard `net/http` package so you can see cache hits, misses, invalidation on write, and stampede protection in action.

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

1. The application calls `cache.Get(ctx, productID, loader)`
2. The helper runs `HGETALL` against `cache:product:{id}`
3. On a hit, the cached hash is returned directly
4. On a miss, the helper acquires a Lua-backed single-flight lock and calls `loader(ctx, productID)` to read the primary
5. The helper writes the result back to Redis with `HSET` plus `EXPIRE` and releases the lock
6. Concurrent goroutines that fail to acquire the lock wait briefly for the cache to populate, then return that value instead of issuing their own primary read

On a write, the application updates the primary and then deletes the cache key, so the next read repopulates from the new source value.

## The cache-aside helper

The `RedisCache` type wraps the cache-aside operations
([source](cache.go)):

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/redis/go-redis/v9"

    "cacheaside"
)

func main() {
    client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
    primary := cacheaside.NewMockPrimaryStore(150 * time.Millisecond)
    cache, err := cacheaside.New(cacheaside.Config{
        Client: client,
        TTL:    30 * time.Second,
    })
    if err != nil {
        log.Fatal(err)
    }
    ctx := context.Background()

    // Read through the cache.
    res, _ := cache.Get(ctx, "p-001", primary.Read)
    log.Printf("hit=%v latency=%.2fms record=%v", res.Hit, res.RedisLatencyMs, res.Record)

    // Update a single field without rewriting the whole record.
    _, _ = cache.UpdateField(ctx, "p-001", "stock", "41")

    // Invalidate the cache key on a write to the primary.
    primary.UpdateField("p-001", "price_cents", "699")
    _, _ = cache.Invalidate(ctx, "p-001")
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

The `Get()` method runs `HGETALL` on the cache key first. On a hit it returns the cached hash and records the hit in an in-process counter. On a miss, it delegates to a single-flight loader:

```go
func (c *RedisCache) Get(ctx context.Context, id string, loader Loader) (Result, error) {
    cacheKey := c.cacheKey(id)

    start := time.Now()
    cached, err := c.client.HGetAll(ctx, cacheKey).Result()
    redisMs := float64(time.Since(start).Microseconds()) / 1000.0
    if err != nil {
        return Result{RedisLatencyMs: redisMs}, err
    }

    if len(cached) > 0 {
        c.recordHit()
        return Result{Record: cached, Hit: true, RedisLatencyMs: redisMs}, nil
    }

    c.recordMiss()
    record, err := c.loadWithSingleFlight(ctx, id, loader)
    return Result{Record: record, Hit: false, RedisLatencyMs: redisMs}, err
}
```

The returned `Result` includes the measured Redis round-trip time so the demo UI can show the latency difference between a hit and a miss.

## Stampede protection with a Lua lock

When a popular key expires, every concurrent reader observes the miss at the same instant. Without coordination, all of them would query the primary and overwrite the cache redundantly — a *cache stampede*.

The helper uses a tiny Lua script to acquire a short-lived lock atomically. Only the goroutine that wins the `SET NX` becomes the primary loader; the rest poll the cache briefly and return the value the lock holder writes:

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

The Go side wraps both scripts in `redis.NewScript` and runs them on every miss:

```go
func (c *RedisCache) loadWithSingleFlight(ctx context.Context, id string, loader Loader) (map[string]string, error) {
    cacheKey := c.cacheKey(id)
    lockKey := c.lockKey(id)
    tokenBytes := make([]byte, 8)
    if _, err := rand.Read(tokenBytes); err != nil {
        return nil, err
    }
    token := hex.EncodeToString(tokenBytes)

    acquired, err := c.acquireScript.Run(ctx, c.client,
        []string{lockKey},
        token,
        c.lockTTL.Milliseconds(),
    ).Int()
    if err != nil {
        return nil, err
    }

    if acquired == 1 {
        defer c.releaseScript.Run(ctx, c.client, []string{lockKey}, token)
        record, err := loader(ctx, id)
        if err != nil || record == nil {
            return record, err
        }
        pipe := c.client.TxPipeline()
        pipe.Del(ctx, cacheKey)
        // ...HSet fields... and pipe.Expire(ctx, cacheKey, c.ttl)
        _, err = pipe.Exec(ctx)
        return record, err
    }

    c.recordStampedeSuppressed()
    deadline := time.Now().Add(c.lockTTL)
    for time.Now().Before(deadline) {
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-time.After(c.waitPoll):
        }
        if cached, err := c.client.HGetAll(ctx, cacheKey).Result(); err == nil && len(cached) > 0 {
            return cached, nil
        }
    }
    return loader(ctx, id)
}
```

The unique `token` per caller is what makes the release script safe — only the goroutine that actually holds the lock can release it.

## Invalidation on write

When a write hits the primary, the application invalidates the cache key. The next read pulls fresh data from the primary:

```go
func (c *RedisCache) Invalidate(ctx context.Context, id string) (bool, error) {
    n, err := c.client.Del(ctx, c.cacheKey(id)).Result()
    return n == 1, err
}
```

This is the simplest and safest pattern: never try to keep the cache and primary in sync directly, just delete the cache entry and let the next read repopulate it.

## Field-level updates

Because each record is stored as a hash, the cache helper can also update a single field in place without re-serializing the full record. The update only writes if the entry is already cached, so a partial record can never appear in Redis:

```go
func (c *RedisCache) UpdateField(ctx context.Context, id, field, value string) (bool, error) {
    cacheKey := c.cacheKey(id)
    for {
        var ok bool
        err := c.client.Watch(ctx, func(tx *redis.Tx) error {
            exists, err := tx.Exists(ctx, cacheKey).Result()
            if err != nil {
                return err
            }
            if exists == 0 {
                ok = false
                return nil
            }
            _, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
                pipe.HSet(ctx, cacheKey, field, value)
                pipe.Expire(ctx, cacheKey, c.ttl)
                return nil
            })
            ok = err == nil
            return err
        }, cacheKey)
        if errors.Is(err, redis.TxFailedErr) {
            continue
        }
        return ok, err
    }
}
```

This is useful for hot fields that change more often than the rest of the record (a stock counter, a view count) and would otherwise force a full reload.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, and stampedes that were suppressed by the single-flight lock. The demo UI surfaces these so you can see the cache absorbing load:

```go
func (c *RedisCache) Stats() map[string]any {
    c.mu.Lock()
    defer c.mu.Unlock()
    total := c.hits + c.misses
    hitRate := 0.0
    if total > 0 {
        hitRate = float64(int(1000.0*float64(c.hits)/float64(total))) / 10.0
    }
    return map[string]any{
        "hits":                 c.hits,
        "misses":               c.misses,
        "stampedes_suppressed": c.stampedesSuppressed,
        "hit_rate_pct":         hitRate,
    }
}
```

In production you would emit these as Prometheus counters or push them into your metrics pipeline rather than holding them in process memory.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Go 1.23 or later is installed.
* The `go-redis` module is available (see the `go.mod` file in this directory).

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

A local demo server is included to show the cache-aside layer in action
([source](demo_server.go)).

Create a `main.go` file in the same directory:

```go
package main

import "cacheaside"

func main() { cacheaside.RunDemoServer() }
```

Then run:

```bash
go build -o demo ./...
./demo --port 8080 --redis-host localhost --redis-port 6379
```

The demo server uses only Go's standard library for HTTP handling and concurrency:

* [`net/http`](https://pkg.go.dev/net/http) for the web server
* [`sync`](https://pkg.go.dev/sync) for the stampede test goroutine pool
* [`crypto/rand`](https://pkg.go.dev/crypto/rand) for the per-caller lock token

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
([source](primary.go)):

```go
func (m *MockPrimaryStore) Read(ctx context.Context, id string) (map[string]string, error) {
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    case <-time.After(m.ReadLatency):
    }
    // ...
}
```

Every call to `Read()` sleeps for `ReadLatency` so the difference between a cache hit and a miss is obvious in the UI. The store also tracks the total number of primary reads, which the stampede test uses to confirm that single-flight is working — for N concurrent readers against a cold key, you should see exactly one primary read.

In a real application this would be replaced by a SQL query, an HTTP call to a downstream service, or any other slow-but-authoritative source.

## Production usage

This guide uses a deliberately small local demo so you can focus on the cache-aside pattern. In production, you will usually want to harden several aspects of it.

### Choose a TTL that matches your staleness tolerance

The TTL is the upper bound on how long a stale value can be served. Shorter TTLs mean lower hit rates and more primary load; longer TTLs mean higher hit rates and more stale reads between writes. Pick the value that matches your business tolerance for stale data, and combine it with explicit invalidation on writes for the cases where you cannot tolerate any staleness.

### Invalidate, don't try to keep the cache in sync

When the underlying record changes, delete the cache key rather than rewriting it. Cache-aside is robust precisely because it never assumes the cache holds the latest value — the next read always re-fetches from the primary on a miss.

### Handle missing records explicitly

In this demo, a missing record returns `nil` and nothing is cached. In a real system you may want to cache "not found" sentinels with a short TTL to absorb load from probing for non-existent IDs, while making sure the sentinel TTL is shorter than the positive cache entry so a newly-created record becomes visible quickly.

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

* [go-redis guide]({{< relref "/develop/clients/go" >}}) - Install and use the Go Redis client
* [SET command]({{< relref "/commands/set" >}}) - Set a string with TTL options (`EX`, `PX`, `NX`)
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Atomic single-flight locks and stampede mitigation
