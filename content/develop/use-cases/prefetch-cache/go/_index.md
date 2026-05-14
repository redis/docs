---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Go with go-redis
linkTitle: go-redis example (Go)
title: Redis prefetch cache with go-redis
weight: 3
---

This guide shows you how to implement a Redis prefetch cache in Go with [`go-redis`]({{< relref "/develop/clients/go" >}}). It includes a small local web server built with Go's standard `net/http` package so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

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

1. **On startup**, the demo server calls `cache.BulkLoad(ctx, primary.ListRecords())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.Get(ctx, id)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process channel. A sync-worker goroutine drains the channel and calls `cache.ApplyChange(ctx, event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process channel is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` type wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/go/cache.go)):

```go
package main

import (
    "context"

    "github.com/redis/go-redis/v9"
    "prefetchcache"
)

func main() {
    client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
    primary := prefetchcache.NewMockPrimaryStore(80)
    cache := prefetchcache.NewPrefetchCache(client, "cache:category:", 3600)

    ctx := context.Background()

    // Pre-load every primary record into Redis in one pipelined round trip.
    _, _ = cache.BulkLoad(ctx, primary.ListRecords())

    // Start the sync worker so primary mutations propagate into Redis.
    sync := prefetchcache.NewSyncWorker(primary, cache)
    sync.Start()
    defer sync.Stop(2 * time.Second)

    // Read paths now go to Redis only.
    result, _ := cache.Get(ctx, "cat-001")
    _ = result
}
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

`BulkLoad` pipelines a `DEL` + `HSET` + `EXPIRE` triple for every record. The pipeline is sent in a single round trip, so loading thousands of records takes one network RTT plus the time Redis spends executing the commands locally — typically tens of milliseconds even for a large reference table:

```go
func (c *PrefetchCache) BulkLoad(ctx context.Context, records []map[string]string) (int, error) {
    loaded := 0
    pipe := c.client.Pipeline()
    for _, record := range records {
        id := record["id"]
        if id == "" {
            continue
        }
        cacheKey := c.cacheKey(id)
        pipe.Del(ctx, cacheKey)
        pipe.HSet(ctx, cacheKey, hashFields(record)...)
        pipe.Expire(ctx, cacheKey, time.Duration(c.ttlSeconds)*time.Second)
        loaded++
    }
    if loaded > 0 {
        if _, err := pipe.Exec(ctx); err != nil {
            return 0, err
        }
    }
    return loaded, nil
}
```

The pipeline uses `client.Pipeline()` (non-transactional) on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `BulkLoad` directly from your own code on a cache that is already serving reads, either pause your writers first or rewrite it with `client.TxPipeline()` so callers cannot observe a half-loaded record.

## Reads from Redis only

`Get` runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```go
func (c *PrefetchCache) Get(ctx context.Context, id string) (GetResult, error) {
    cacheKey := c.cacheKey(id)
    started := time.Now()
    cached, err := c.client.HGetAll(ctx, cacheKey).Result()
    latencyMs := float64(time.Since(started).Microseconds()) / 1000.0
    if err != nil {
        return GetResult{RedisLatencyMs: latencyMs}, err
    }
    if len(cached) > 0 {
        c.recordHit()
        return GetResult{Record: cached, Hit: true, RedisLatencyMs: latencyMs}, nil
    }
    c.recordMiss()
    return GetResult{Record: nil, Hit: false, RedisLatencyMs: latencyMs}, nil
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `ApplyChange` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one pipelined transaction so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```go
func (c *PrefetchCache) ApplyChange(ctx context.Context, change Change) error {
    if change.ID == "" {
        return nil
    }
    cacheKey := c.cacheKey(change.ID)

    switch change.Op {
    case ChangeOpUpsert:
        if len(change.Fields) == 0 {
            // Malformed upsert with no fields. Skip rather than crash
            // the sync worker: HSET with an empty mapping errors, and
            // there's nothing to write anyway.
            return nil
        }
        pipe := c.client.TxPipeline()
        pipe.Del(ctx, cacheKey)
        pipe.HSet(ctx, cacheKey, hashFields(change.Fields)...)
        pipe.Expire(ctx, cacheKey, time.Duration(c.ttlSeconds)*time.Second)
        if _, err := pipe.Exec(ctx); err != nil {
            return err
        }
    case ChangeOpDelete:
        if err := c.client.Del(ctx, cacheKey).Err(); err != nil {
            return err
        }
    default:
        return nil
    }
    return nil
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis. `TxPipeline` wraps the three commands in `MULTI`/`EXEC` so concurrent readers can never observe the half-written intermediate state.

## The sync worker

`SyncWorker` runs a single goroutine that blocks on the primary's change channel with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/go/sync_worker.go)):

```go
func (w *SyncWorker) run(ctx context.Context, done chan struct{}) {
    defer close(done)
    for {
        select {
        case <-ctx.Done():
            return
        default:
        }

        // ... park here if paused ...

        change, ok := w.primary.NextChange(w.pollTimeout)
        if !ok {
            continue
        }
        if err := w.cache.ApplyChange(ctx, change); err != nil {
            log.Printf("[sync] failed to apply %s %s: %v", change.Op, change.ID, err)
        }
    }
}
```

Pause and resume are coordinated through two channels stored on the worker:

* `pausedIdle` is closed by the worker when the run loop has parked itself. `Pause()` waits on this channel so it can prove no `ApplyChange` is in flight before returning.
* `resumeCh` is closed by `Resume()` to wake the parked select. Both channels are replaced with fresh values on each `Pause()` so a stale `Resume` from a previous cycle cannot prematurely unblock the next pause.

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `Invalidate(ctx, id)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `Clear(ctx)` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `BulkLoad(ctx, primary.ListRecords())` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`Clear()` and `BulkLoad()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.ListRecords()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `Clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```go
s.sync.Pause(2 * time.Second)
_, _ = s.cache.Clear(ctx)
loaded, _ := s.cache.BulkLoad(ctx, s.primary.ListRecords())
s.sync.Resume()
```

`Pause()` waits for the worker goroutine to finish whatever event it is currently applying, parks the run loop, and returns. Change events that arrive during the pause sit on the primary's channel and apply in order once `Resume()` is called, so no event is lost. The demo also wraps the pause/resume pair in a `sync.Mutex` so two concurrent admin callers cannot interleave their pause/resume cycles.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```go
func (c *PrefetchCache) Stats() map[string]any {
    c.mu.Lock()
    defer c.mu.Unlock()
    total := c.hits + c.misses
    hitRate := 0.0
    if total > 0 {
        hitRate = roundTo(100.0*float64(c.hits)/float64(total), 1)
    }
    avgLag := 0.0
    if c.syncLagSamples > 0 {
        avgLag = roundTo(c.syncLagMsTotal/float64(c.syncLagSamples), 2)
    }
    return map[string]any{
        "hits":                c.hits,
        "misses":              c.misses,
        "hit_rate_pct":        hitRate,
        "prefetched":          c.prefetched,
        "sync_events_applied": c.syncEventsApplied,
        "sync_lag_ms_avg":     avgLag,
    }
}
```

In production you would emit these as Prometheus counters and gauges. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

* Redis running and accessible. By default, the demo connects to `localhost:6379`.
* Go 1.21 or later.
* The `go-redis` client. The included `go.mod` pins:

  ```text
  require github.com/redis/go-redis/v9 v9.18.0
  ```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of five files. Download them from the [`go` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/go) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/go
curl -O $BASE/cache.go
curl -O $BASE/primary.go
curl -O $BASE/sync_worker.go
curl -O $BASE/demo_server.go
curl -O $BASE/go.mod
curl -O $BASE/go.sum
```

### Start the demo server

The helper, mock primary, sync worker, and demo handlers all live in `package prefetchcache`. Go's `package main` can't live in the same directory as another package, so create a tiny `main.go` shim in a subdirectory that calls into the package:

```bash
mkdir -p cmd/demo
cat > cmd/demo/main.go <<'EOF'
package main

import "prefetchcache"

func main() { prefetchcache.RunDemoServer() }
EOF
```

Then build and run:

```bash
go mod tidy
go run ./cmd/demo
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8784
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 83.0 ms; sync worker running
```

After starting the server, visit [http://localhost:8784](http://localhost:8784).

The demo server uses only Go's standard library plus `go-redis`:

* [`net/http`](https://pkg.go.dev/net/http) for the web server
* [`flag`](https://pkg.go.dev/flag) for CLI flags
* Goroutines, channels, and `sync.Mutex` for the sync worker and stats counters

It exposes a small interactive page where you can:

* See which IDs are in the cache and in the primary, side by side
* Read a category through the cache and confirm every read is a hit
* Update a field on the primary and watch the sync worker rewrite the cache hash
* Add and delete categories and watch them appear and disappear from the cache
* Invalidate one key or clear the entire cache to simulate a sync-pipeline failure
* Re-prefetch from the primary to recover from a broken cache state
* Watch the average sync lag, and confirm primary reads stay at one until you re-prefetch — each `/reprefetch` adds another primary read for the snapshot, but normal request traffic never reaches the primary at all

If you want to run the demo against a non-default cache prefix or port, pass `--port` and `--cache-prefix`:

```bash
go run ./cmd/demo --port 8784 --cache-prefix 'cache:category:'
```

## The mock primary store

To make the demo self-contained, the example includes a `MockPrimaryStore` that stands in for a source-of-truth database
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/go/primary.go)):

```go
type MockPrimaryStore struct {
    readLatencyMs int

    mu      sync.Mutex
    reads   int
    changes chan Change
    records map[string]map[string]string
}

func (p *MockPrimaryStore) ListRecords() []map[string]string {
    time.Sleep(time.Duration(p.readLatencyMs) * time.Millisecond)
    // ... return a deep copy of every record under p.mu ...
}

func (p *MockPrimaryStore) UpdateField(id, field, value string) bool {
    p.mu.Lock()
    defer p.mu.Unlock()
    rec, ok := p.records[id]
    if !ok {
        return false
    }
    rec[field] = value
    p.emitChangeLocked(ChangeOpUpsert, id, copyRecord(rec))
    return true
}
```

Every mutation appends a change event to an in-process buffered `chan Change`. The sync worker drains the channel with a 50 ms timeout via `NextChange` and applies each event to Redis. The change event is **emitted while the record lock is still held** (`emitChangeLocked` runs inside the `mu.Lock()` block) so two concurrent `UpdateField` calls cannot produce out-of-order events on the channel.

In a real system this channel is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

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

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:category:{id}`) so different services cannot clobber each other's entries. The helper takes a `prefix` constructor argument exactly for this.

### Wire shutdown through `context.Context`

The sync worker runs on its own goroutine that blocks in `NextChange` (a channel select with a 50 ms timeout). The demo's `RunDemoServer` calls `syncWorker.Stop(2 * time.Second)` on SIGINT/SIGTERM, which cancels the worker's internal context and joins the goroutine. Wire your real sync worker to your service's shutdown context so `SIGTERM` produces a clean drain instead of a hard kill.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache keys directly to confirm the bulk load and the sync worker are writing what you expect:

```bash
redis-cli --scan --pattern 'cache:category:*'
redis-cli HGETALL cache:category:cat-001
redis-cli TTL cache:category:cat-001
```

If a key is missing for an ID that still exists in the primary, the prefetch did not run, the key expired without a sync refresh, or someone invalidated it. If a key is still present for an ID that was deleted in the primary, the delete event has not yet been applied. If the TTL is much lower than the configured safety-net value on a hot key, the sync worker is not keeping up.

## Learn more

* [go-redis guide]({{< relref "/develop/clients/go" >}}) - Install and use the Go Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
