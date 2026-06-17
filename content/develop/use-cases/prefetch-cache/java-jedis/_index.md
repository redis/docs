---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Java with Jedis
linkTitle: Jedis example (Java)
title: Redis prefetch cache with Jedis
weight: 4
---

This guide shows you how to implement a Redis prefetch cache in Java with the [Jedis]({{< relref "/develop/clients/jedis" >}}) client library. It includes a small local web server built on the JDK's `com.sun.net.httpserver` so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

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

1. **On startup**, the demo server calls `cache.bulkLoad(primary.listRecords())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.get(entityId)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process queue. The sync worker thread drains the queue and calls `cache.applyChange(event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process change queue is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/java-jedis/PrefetchCache.java)):

```java
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

JedisPool pool = new JedisPool(new JedisPoolConfig(), "localhost", 6379);
MockPrimaryStore primary = new MockPrimaryStore(80);
PrefetchCache cache = new PrefetchCache(pool);

// Pre-load every primary record into Redis in one pipelined round trip.
cache.bulkLoad(primary.listRecords());

// Start the sync worker so primary mutations propagate into Redis.
SyncWorker sync = new SyncWorker(primary, cache);
sync.start();

// Read paths now go to Redis only.
PrefetchCache.Result result = cache.get("cat-001");
System.out.printf("hit=%s latency=%.2fms record=%s%n",
    result.hit, result.redisLatencyMs, result.record);
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

```java
public int bulkLoad(Iterable<Map<String, String>> records) {
    int loaded = 0;
    try (Jedis jedis = pool.getResource()) {
        Pipeline pipe = jedis.pipelined();
        for (Map<String, String> record : records) {
            if (record == null) continue;
            String entityId = record.get("id");
            if (entityId == null || entityId.isEmpty()) continue;
            String cacheKey = cacheKey(entityId);
            pipe.del(cacheKey);
            pipe.hset(cacheKey, record);
            pipe.expire(cacheKey, ttlSeconds);
            loaded++;
        }
        if (loaded > 0) pipe.sync();
    }
    return loaded;
}
```

The pipeline is intentionally non-transactional on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulkLoad` directly from your own code on a cache that is already serving reads, either pause your writers first or wrap the writes in a `Transaction` so callers cannot observe a half-loaded record.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```java
public Result get(String entityId) {
    String cacheKey = cacheKey(entityId);
    long startedNs = System.nanoTime();
    Map<String, String> cached;
    try (Jedis jedis = pool.getResource()) {
        cached = jedis.hgetAll(cacheKey);
    }
    double redisLatencyMs = (System.nanoTime() - startedNs) / 1_000_000.0;

    if (cached != null && !cached.isEmpty()) {
        synchronized (statsLock) { hits++; }
        return new Result(cached, true, redisLatencyMs);
    }
    synchronized (statsLock) { misses++; }
    return new Result(null, false, redisLatencyMs);
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `applyChange` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL inside a `MULTI`/`EXEC` transaction so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```java
public void applyChange(Map<String, Object> change) {
    Object op = change.get("op");
    String entityId = (String) change.get("id");
    if (entityId == null || entityId.isEmpty()) return;
    String cacheKey = cacheKey(entityId);

    if ("upsert".equals(op)) {
        @SuppressWarnings("unchecked")
        Map<String, String> fields = (Map<String, String>) change.get("fields");
        if (fields == null || fields.isEmpty()) {
            // Malformed upsert: skip rather than crash the sync worker.
            return;
        }
        try (Jedis jedis = pool.getResource()) {
            Transaction tx = jedis.multi();
            tx.del(cacheKey);
            tx.hset(cacheKey, fields);
            tx.expire(cacheKey, ttlSeconds);
            tx.exec();
        }
    } else if ("delete".equals(op)) {
        try (Jedis jedis = pool.getResource()) {
            jedis.del(cacheKey);
        }
    }
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis.

## The sync worker

The `SyncWorker` runs a daemon thread that polls the primary's change queue with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/java-jedis/SyncWorker.java)):

```java
private void run() {
    while (!stopRequested) {
        if (pauseRequested) {
            // Park until pause is lifted (see pause/resume below).
            parkUntilResumed();
            continue;
        }
        Map<String, Object> change = primary.nextChange(pollTimeoutMs);
        if (change == null) continue;
        try {
            cache.applyChange(change);
        } catch (Exception exc) {
            System.err.println("[sync] failed to apply " + change + ": " + exc);
        }
    }
}
```

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `invalidate(entityId)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `clear()` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `bulkLoad(primary.listRecords())` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`clear()` and `bulkLoad()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.listRecords()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```java
sync.pause();
try {
    cache.clear();
    cache.bulkLoad(primary.listRecords());
} finally {
    sync.resume();
}
```

`pause()` is built on a `ReentrantLock` plus two `Condition`s: it sets a pause flag, then blocks on the worker's "idle" condition until the worker reports it has finished whatever event it was applying. Change events that arrive during the pause sit in the primary's `LinkedBlockingQueue` and apply in order once `resume()` is called, so no event is lost.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. All counter access is guarded by an intrinsic lock so the demo's parallel HTTP handlers and the sync thread can read and write them without tearing:

```java
public Map<String, Object> stats() {
    synchronized (statsLock) {
        long total = hits + misses;
        double hitRate = total == 0 ? 0.0 : Math.round(1000.0 * hits / total) / 10.0;
        double avgLag = syncLagSamples == 0 ? 0.0
                : Math.round(100.0 * syncLagMsTotal / syncLagSamples) / 100.0;
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("hits", hits);
        stats.put("misses", misses);
        stats.put("hit_rate_pct", hitRate);
        stats.put("prefetched", prefetched);
        stats.put("sync_events_applied", syncEventsApplied);
        stats.put("sync_lag_ms_avg", avgLag);
        return stats;
    }
}
```

In production you would emit these as Micrometer counters and gauges rather than holding them in process memory. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* JDK 11 or later is installed.
* The Jedis JAR (5.0+) and its dependencies are on your classpath. Get them from [Maven Central](https://repo1.maven.org/maven2/redis/clients/jedis/), or via Maven/Gradle in a project setup. You also need [`slf4j-api`](https://repo1.maven.org/maven2/org/slf4j/slf4j-api/) (Jedis declares it as a transitive dependency).

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of four files. Download them from the [`java-jedis` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/java-jedis) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/java-jedis
curl -O $BASE/PrefetchCache.java
curl -O $BASE/MockPrimaryStore.java
curl -O $BASE/SyncWorker.java
curl -O $BASE/DemoServer.java
```

### Start the demo server

From that directory, with the Jedis and `slf4j-api` jars in the working directory (the example assumes Jedis 5.1.2 and slf4j-api 2.0.13 — adjust the filenames to match your versions):

```bash
javac -cp jedis-5.1.2.jar:slf4j-api-2.0.13.jar \
    PrefetchCache.java MockPrimaryStore.java SyncWorker.java DemoServer.java

java -cp .:jedis-5.1.2.jar:slf4j-api-2.0.13.jar \
    DemoServer --port 8785 --redis-host localhost --redis-port 6379
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8785
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 103.3 ms; sync worker running
```

After starting the server, visit `http://localhost:8785`.

The demo server uses standard JDK libraries for HTTP handling and concurrency:

* [`com.sun.net.httpserver.HttpServer`](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html) for the web server, with a 16-thread fixed pool from `Executors.newFixedThreadPool(16)`
* [`java.util.concurrent.LinkedBlockingQueue`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/LinkedBlockingQueue.html) for the change feed between the mock primary and the sync worker
* [`java.util.concurrent.locks.ReentrantLock`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html) and [`Condition`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Condition.html) for the sync worker's pause/resume coordination

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
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/java-jedis/MockPrimaryStore.java)):

```java
public List<Map<String, String>> listRecords() {
    sleepLatency();
    synchronized (lock) {
        reads++;
        // ... return a copy of every record
    }
}

public boolean updateField(String entityId, String field, String value) {
    synchronized (lock) {
        Map<String, String> record = records.get(entityId);
        if (record == null) return false;
        record.put(field, value);
        // Emit the change event while still holding the records lock,
        // so queue order matches mutation order.
        emitChangeLocked(OP_UPSERT, entityId, new LinkedHashMap<>(record));
    }
    return true;
}
```

Every mutation appends a change event to an in-process [`LinkedBlockingQueue`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/LinkedBlockingQueue.html). The sync worker drains the queue with a 50 ms timeout and applies each event to Redis. In a real system this queue is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

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

### Tune the JedisPool

The demo uses a default `JedisPoolConfig`. In production, set `setMaxTotal()` and `setMaxIdle()` to match your concurrency profile and server-side `maxclients`. Every cache call acquires a connection with try-with-resources so connections are returned to the pool even on exceptions; this is what lets the sync worker, the HTTP handlers, and any background job share Redis safely without an in-process lock.

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

* [Jedis guide]({{< relref "/develop/clients/jedis" >}}) - Install and use the Jedis Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
