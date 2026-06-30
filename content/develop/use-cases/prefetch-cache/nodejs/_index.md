---
aliases:
- /develop/use-cases/prefetch-cache/node-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Node.js with node-redis
linkTitle: node-redis example (Node.js)
title: Redis prefetch cache with node-redis
weight: 2
---

This guide shows you how to implement a Redis prefetch cache in Node.js with [`node-redis`]({{< relref "/develop/clients/nodejs" >}}). It includes a small local web server built with the Node.js standard `http` module so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

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

1. **On startup**, the demo server calls `cache.bulkLoad(await primary.listRecords())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.get(entityId)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process queue. The sync worker async task drains the queue and calls `cache.applyChange(event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process change queue is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/nodejs/cache.js)):

```javascript
const { createClient } = require("redis");
const { PrefetchCache } = require("./cache");
const { MockPrimaryStore } = require("./primary");
const { SyncWorker } = require("./sync_worker");

const client = createClient({ socket: { host: "localhost", port: 6379 } });
await client.connect();

const primary = new MockPrimaryStore();
const cache = new PrefetchCache({ redisClient: client, ttlSeconds: 3600 });

// Pre-load every primary record into Redis in one pipelined round trip.
await cache.bulkLoad(await primary.listRecords());

// Start the sync worker so primary mutations propagate into Redis.
const sync = new SyncWorker({ primary, cache });
sync.start();

// Read paths now go to Redis only.
const { record, hit, redisLatencyMs } = await cache.get("cat-001");
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

The `bulkLoad` method pipelines a `DEL` + `HSET` + `EXPIRE` triple for every record. The pipeline is sent in a single round trip, so loading thousands of records takes one network RTT plus the time Redis spends executing the commands locally — typically tens of milliseconds even for a large reference table:

```javascript
async bulkLoad(records) {
  let loaded = 0;
  const pipe = this.redis.multi();
  for (const record of records) {
    const entityId = record && record.id;
    if (!entityId) continue;
    const cacheKey = this._cacheKey(entityId);
    pipe.del(cacheKey);
    pipe.hSet(cacheKey, record);
    pipe.expire(cacheKey, this.ttlSeconds);
    loaded += 1;
  }
  if (loaded > 0) {
    await pipe.execAsPipeline();
  }
  this._prefetched += loaded;
  return loaded;
}
```

`execAsPipeline()` is intentional on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulkLoad` directly from your own code on a cache that is already serving reads, either pause your writers first or rewrite it with `multi().exec()` so callers cannot observe a half-loaded record.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```javascript
async get(entityId) {
  const cacheKey = this._cacheKey(entityId);

  const started = process.hrtime.bigint();
  const cached = await this.redis.hGetAll(cacheKey);
  const redisLatencyMs = Number(process.hrtime.bigint() - started) / 1e6;

  if (cached && Object.keys(cached).length > 0) {
    this._hits += 1;
    return { record: cached, hit: true, redisLatencyMs };
  }

  this._misses += 1;
  return { record: null, hit: false, redisLatencyMs };
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `applyChange` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one pipelined transaction so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```javascript
async applyChange(change) {
  const { op, id: entityId, fields } = change;
  if (!entityId) return;

  const cacheKey = this._cacheKey(entityId);

  if (op === "upsert") {
    if (!fields || Object.keys(fields).length === 0) return;
    await this.redis
      .multi()
      .del(cacheKey)
      .hSet(cacheKey, fields)
      .expire(cacheKey, this.ttlSeconds)
      .exec();
  } else if (op === "delete") {
    await this.redis.del(cacheKey);
  }
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis. The empty-fields guard avoids crashing the sync worker if a malformed event arrives, because node-redis rejects an `hSet` call with an empty object.

## The sync worker

The `SyncWorker` runs an async task that awaits the primary's change queue with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/nodejs/sync_worker.js)):

```javascript
async _run() {
  while (!this._stopped) {
    if (this._paused) {
      if (this._pausedIdleResolve) this._pausedIdleResolve();
      while (this._paused && !this._stopped) await this._resumePromise;
      continue;
    }

    const change = await this.primary.nextChange(this.pollTimeoutMs);
    if (change == null) continue;
    try {
      await this.cache.applyChange(change);
    } catch (err) {
      console.error(`[sync] failed to apply ${JSON.stringify(change)}: ${err && err.message}`);
    }
  }
}
```

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `invalidate(entityId)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `clear()` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `bulkLoad(await primary.listRecords())` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`clear()` and `bulkLoad()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.listRecords()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```javascript
await sync.pause();
try {
  await cache.clear();
  await cache.bulkLoad(await primary.listRecords());
} finally {
  sync.resume();
}
```

`pause()` waits for the worker to finish whatever event it is currently applying, parks the run loop, and returns. Change events that arrive during the pause sit in the primary's queue and apply in order once `resume()` is called, so no event is lost.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```javascript
stats() {
  const total = this._hits + this._misses;
  const hitRate = total > 0 ? Math.round((1000 * this._hits) / total) / 10 : 0.0;
  const avgLag = this._syncLagSamples > 0
    ? Math.round((this._syncLagMsTotal / this._syncLagSamples) * 100) / 100
    : 0.0;
  return {
    hits: this._hits,
    misses: this._misses,
    hit_rate_pct: hitRate,
    prefetched: this._prefetched,
    sync_events_applied: this._syncEventsApplied,
    sync_lag_ms_avg: avgLag,
  };
}
```

In production you would emit these as Prometheus counters and gauges. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Node.js 18 or later is installed.
* The `redis` (node-redis) package is installed via `npm install`. The demo pins to the latest 5.x.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of five files. Download them from the [`nodejs` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/nodejs) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/nodejs
curl -O $BASE/cache.js
curl -O $BASE/primary.js
curl -O $BASE/sync_worker.js
curl -O $BASE/demoServer.js
curl -O $BASE/package.json
npm install
```

### Start the demo server

From that directory:

```bash
node demoServer.js
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8783
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 85.5 ms; sync worker running
```

After starting the server, visit `http://localhost:8783`.

The demo server uses only Node.js standard library features for HTTP and concurrency:

* The [`http`](https://nodejs.org/api/http.html) module for the web server, with manual route dispatch on `req.method` and `url.pathname`
* The [`url`](https://nodejs.org/api/url.html) module's `URL` and `URLSearchParams` for query and form decoding
* `async`/`await` for the sync worker's long-running task

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
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/nodejs/primary.js)):

```javascript
class MockPrimaryStore {
  constructor({ readLatencyMs = 80 } = {}) { /* ... */ }

  async listRecords() {
    await new Promise((r) => setTimeout(r, this.readLatencyMs));
    this._reads += 1;
    return [...this._records.values()].map((r) => ({ ...r }));
  }

  updateField(entityId, field, value) {
    const record = this._records.get(entityId);
    if (record === undefined) return false;
    record[field] = String(value);
    this._emitChange("upsert", entityId, { ...record });
    return true;
  }
}
```

Every mutation appends a change event to an in-process queue and the sync worker `await`s `primary.nextChange(timeoutMs)` to drain it. Node.js JS execution is single-threaded, so the mutate-then-emit pair runs without any `await` between the two steps — that's how the queue order stays aligned with the mutation order. In a real system this queue is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

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

If multiple applications share a Redis deployment, prefix cache keys with the application name (`cache:billing:category:{id}`) so different services cannot clobber each other's entries. The helper takes a `prefix` constructor option exactly for this.

### Use a connection pool or a single multiplexed client

The demo shares a single `createClient()` connection across the HTTP handlers and the sync worker. node-redis 5.x multiplexes commands over that one socket, so a single client handles concurrent reads, transactions, and pipelined writes without any in-process locking. In production, monitor the client's `error` event and reconnect-and-retry on transient failures, and consider a small pool of clients if you need to isolate slow blocking commands from the rest of your traffic.

### Inspect cached entries directly in Redis

When testing or troubleshooting, inspect the stored cache keys directly to confirm the bulk load and the sync worker are writing what you expect:

```bash
redis-cli --scan --pattern 'cache:category:*'
redis-cli HGETALL cache:category:cat-001
redis-cli TTL cache:category:cat-001
```

If a key is missing for an ID that still exists in the primary, the prefetch did not run, the key expired without a sync refresh, or someone invalidated it. If a key is still present for an ID that was deleted in the primary, the delete event has not yet been applied. If the TTL is much lower than the configured safety-net value on a hot key, the sync worker is not keeping up.

## Learn more

* [node-redis guide]({{< relref "/develop/clients/nodejs" >}}) - Install and use the Node.js Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
