---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Java with Lettuce
linkTitle: Lettuce example (Java)
title: Redis prefetch cache with Lettuce
weight: 5
---

This guide shows you how to implement a Redis prefetch cache in Java with the [Lettuce]({{< relref "/develop/clients/lettuce" >}}) client library. It includes a small local web server built on the JDK's `com.sun.net.httpserver` so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

## Overview

Prefetch caching pre-loads a working set of reference data into Redis before the first request arrives, so every read on the request path is a cache hit. A separate sync worker keeps the cache current as the source of truth changes — there is no fall-back to the primary on the read path.

That gives you:

* Near-100% cache hit ratios for reference and master data
* Sub-millisecond reads for lookup-heavy paths at peak traffic
* All reference-data reads offloaded from the primary database
* Source-database changes propagated into Redis within a few milliseconds
* A long safety-net TTL that bounds memory if the sync pipeline ever stops

In this example, each cached category is stored as a Redis hash under a key like `cache:category:{id}`. The hash holds the category fields (`id`, `name`, `display_order`, `featured`, `parent_id`) and the key has a long safety-net TTL that the sync worker refreshes on every add or update event. Delete events remove the cache key outright, so there is no TTL to refresh in that case.

This guide uses Lettuce's synchronous command API (`StatefulRedisConnection.sync()`) for reads and event application, and the asynchronous API (`async()`) inside `bulkLoad` so that the startup pipeline of `DEL` + `HSET` + `EXPIRE` triples can batch into a single round trip without each command blocking on its own future. Lettuce's reactive API would work equally well for either path.

## How it works

The flow has three independent paths:

1. **On startup**, the demo server calls `cache.bulkLoad(primary.listRecords())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.get(entityId)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process queue. The sync worker thread drains the queue and calls `cache.applyChange(event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process change queue is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/java-lettuce/PrefetchCache.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;

RedisClient client = RedisClient.create(
    RedisURI.builder().withHost("localhost").withPort(6379).build());
StatefulRedisConnection<String, String> connection = client.connect();

MockPrimaryStore primary = new MockPrimaryStore(80);
PrefetchCache cache = new PrefetchCache(connection, "cache:category:", 3600);

// Pre-load every primary record into Redis in one pipelined round trip.
cache.bulkLoad(primary.listRecords());

// Start the sync worker so primary mutations propagate into Redis.
SyncWorker sync = new SyncWorker(primary, cache);
sync.start();

// Read paths now go to Redis only.
PrefetchCache.Result result = cache.get("cat-001");
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
* [`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) for the transactional upsert path in `applyChange`

## Bulk load on startup

The `bulkLoad` method pipelines a `DEL` + `HSET` + `EXPIRE` triple for every record using Lettuce's async API with `setAutoFlushCommands(false)`. The whole batch flushes in a single network round trip, so loading thousands of records takes one RTT plus the time Redis spends executing the commands locally — typically tens of milliseconds even for a large reference table:

```java
public int bulkLoad(Iterable<Map<String, String>> records) {
    RedisAsyncCommands<String, String> async = connection.async();
    connection.setAutoFlushCommands(false);
    List<RedisFuture<?>> futures = new ArrayList<>();
    int loaded = 0;
    try {
        for (Map<String, String> record : records) {
            if (record == null) continue;
            String entityId = record.get("id");
            if (entityId == null || entityId.isEmpty()) continue;
            String cacheKey = cacheKey(entityId);
            futures.add(async.del(cacheKey));
            futures.add(async.hset(cacheKey, record));
            futures.add(async.expire(cacheKey, ttlSeconds));
            loaded += 1;
        }
        connection.flushCommands();
        for (RedisFuture<?> future : futures) {
            future.get();
        }
    } finally {
        connection.setAutoFlushCommands(true);
    }
    if (loaded > 0) prefetched.addAndGet(loaded);
    return loaded;
}
```

The bulk load is intentionally non-transactional: nothing is reading the cache yet on the startup path, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the pipeline fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulkLoad` directly from your own code on a cache that is already serving reads, either pause your writers first or rewrite it as a single `MULTI`/`EXEC` block so callers cannot observe a half-loaded record.

Using the async API here is important: the sync API blocks on every command's future, which would defeat the batching even with auto-flush disabled. The async API queues commands locally and only flushes them when `flushCommands()` is called, then waits on the resulting futures in bulk.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```java
public Result get(String entityId) {
    RedisCommands<String, String> sync = connection.sync();
    String cacheKey = cacheKey(entityId);

    long startedNs = System.nanoTime();
    Map<String, String> cached = sync.hgetall(cacheKey);
    double redisLatencyMs = (System.nanoTime() - startedNs) / 1_000_000.0;

    if (cached != null && !cached.isEmpty()) {
        hits.incrementAndGet();
        return new Result(cached, true, redisLatencyMs);
    }
    misses.incrementAndGet();
    return new Result(null, false, redisLatencyMs);
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `applyChange` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one `MULTI`/`EXEC` block so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```java
public void applyChange(Map<String, Object> change) {
    // ... validate op and id ...
    if ("upsert".equals(op)) {
        Map<String, String> fields = (Map<String, String>) change.get("fields");
        if (fields == null || fields.isEmpty()) return;
        txLock.lock();
        try {
            sync.multi();
            sync.del(cacheKey);
            sync.hset(cacheKey, fields);
            sync.expire(cacheKey, ttlSeconds);
            sync.exec();
        } finally {
            txLock.unlock();
        }
    } else if ("delete".equals(op)) {
        sync.del(cacheKey);
    }
    // ... record sync_events_applied counter and lag sample ...
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis.

A Lettuce-specific point: a single `StatefulRedisConnection` is thread-safe for individual command calls, but `MULTI`/`EXEC` is connection-scoped state. If two threads issued transactions over the same connection at the same time, their queued commands would interleave. The demo shares one connection across HTTP handlers and the sync worker, so `txLock` (a `ReentrantLock`) serializes every transactional sequence. In production you would hand each transactional caller its own connection from a pool (see [Production usage](#production-usage)) or migrate the upsert path into a Lua script so the atomicity is server-side and no client-side lock is needed.

## The sync worker

The `SyncWorker` runs a daemon thread that blocks on the primary's change queue with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/java-lettuce/SyncWorker.java)):

```java
private void run() {
    while (!stopRequested) {
        if (pauseRequested) {
            // park until resume() ...
            continue;
        }
        Map<String, Object> change = primary.nextChange(pollTimeoutMs);
        if (change == null) continue;
        try {
            cache.applyChange(change);
        } catch (Exception exc) {
            System.err.printf("[sync] failed to apply %s: %s%n",
                    change, exc.getMessage());
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
sync.pause(2000);
try {
    cache.clear();
    cache.bulkLoad(primary.listRecords());
} finally {
    sync.resume();
}
```

`pause()` waits for the worker to finish whatever event it is currently applying, parks the run loop, and returns. Change events that arrive during the pause sit in the primary's queue and apply in order once `resume()` is called, so no event is lost.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```java
public Map<String, Object> stats() {
    long h = hits.get();
    long m = misses.get();
    long total = h + m;
    double hitRate = total == 0 ? 0.0 : Math.round(1000.0 * h / total) / 10.0;
    double avgLag;
    synchronized (lagLock) {
        avgLag = syncLagSamples == 0
                ? 0.0
                : Math.round(100.0 * syncLagMsTotal / syncLagSamples) / 100.0;
    }
    Map<String, Object> stats = new LinkedHashMap<>();
    stats.put("hits", h);
    stats.put("misses", m);
    stats.put("hit_rate_pct", hitRate);
    stats.put("prefetched", prefetched.get());
    stats.put("sync_events_applied", syncEventsApplied.get());
    stats.put("sync_lag_ms_avg", avgLag);
    return stats;
}
```

In production you would emit these as Micrometer counters and gauges or push them into your metrics pipeline. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* JDK 17 or later is installed (the demo uses Java text blocks for the inline HTML).
* The Lettuce JAR (and its Netty + Reactor dependencies) is on your classpath.
  Get them from
  [Maven Central](https://repo1.maven.org/maven2/io/lettuce/lettuce-core/),
  or via Maven/Gradle in a project setup.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of four Java files. Download them from the [`java-lettuce` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/java-lettuce) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/java-lettuce
curl -O $BASE/PrefetchCache.java
curl -O $BASE/MockPrimaryStore.java
curl -O $BASE/SyncWorker.java
curl -O $BASE/DemoServer.java
```

You also need Lettuce and its runtime dependencies on your classpath. The simplest way is to download them into a local `lib/` directory:

```bash
mkdir lib && cd lib
LETTUCE=https://repo1.maven.org/maven2/io/lettuce/lettuce-core/6.5.0.RELEASE
curl -O $LETTUCE/lettuce-core-6.5.0.RELEASE.jar
NETTY=https://repo1.maven.org/maven2/io/netty
for ARTIFACT in netty-buffer netty-codec netty-common netty-handler \
                netty-resolver netty-transport netty-transport-native-unix-common; do
  curl -O "$NETTY/$ARTIFACT/4.1.113.Final/$ARTIFACT-4.1.113.Final.jar"
done
curl -O https://repo1.maven.org/maven2/io/projectreactor/reactor-core/3.6.6/reactor-core-3.6.6.jar
curl -O https://repo1.maven.org/maven2/org/reactivestreams/reactive-streams/1.0.4/reactive-streams-1.0.4.jar
cd ..
```

### Start the demo server

From the demo directory:

```bash
javac -cp 'lib/*' PrefetchCache.java MockPrimaryStore.java SyncWorker.java DemoServer.java
java -cp '.:lib/*' DemoServer --port 8786 --redis-host localhost --redis-port 6379
```

(Where `lib/` contains `lettuce-core`, `reactor-core`, `reactive-streams`, and the relevant Netty jars.)

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8786
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 90.9 ms; sync worker running
```

After starting the server, visit `http://localhost:8786`.

The demo server uses only standard JDK libraries for HTTP handling and concurrency:

* [`com.sun.net.httpserver.HttpServer`](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html) for the web server
* [`java.util.concurrent.Executors`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Executors.html) for the request thread pool and sync-worker daemon
* [`java.util.concurrent.LinkedBlockingQueue`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/LinkedBlockingQueue.html) for the primary's in-process change feed

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
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/java-lettuce/MockPrimaryStore.java)):

```java
public class MockPrimaryStore {
    public MockPrimaryStore(int readLatencyMs) { ... }

    public List<Map<String, String>> listRecords() {
        Thread.sleep(readLatencyMs);
        // ...
    }

    public boolean updateField(String entityId, String field, String value) {
        synchronized (lock) {
            // ... mutate the record ...
            emitChangeLocked(CHANGE_OP_UPSERT, entityId, copy);
        }
        return true;
    }
}
```

Every mutation appends a change event to an in-process [`LinkedBlockingQueue`](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/LinkedBlockingQueue.html). The sync worker drains the queue with a 50 ms timeout and applies each event to Redis. The mutation lock is held across both the record update and the queue `offer`, so concurrent updates produce change events in the same order as their mutations — a correctness requirement the demo's pause/resume race test relies on. In a real system the queue is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

## Production usage

This guide uses a deliberately small local demo so you can focus on the prefetch-cache pattern. In production, you will usually want to harden several aspects of it.

### Use a connection pool for transactions

The demo shares a single `StatefulRedisConnection` across HTTP handlers and the sync worker, and serializes every `MULTI`/`EXEC` block with an in-process `ReentrantLock`. In production, use [`ConnectionPoolSupport`](https://github.com/redis/lettuce/wiki/Connection-Pooling) so each transactional caller (or each sync-worker partition, if you shard the change feed) gets its own connection. Once each transaction has a dedicated connection, you can drop `txLock` entirely. An alternative is to merge the `DEL`+`HSET`+`EXPIRE` upsert into a small Lua script invoked with `EVAL` — atomic server-side, lock-free on the client, and a single network round trip per event.

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

### Consider the async or reactive APIs

For high-throughput or event-driven applications, Lettuce's `async()` (`CompletionStage`-based) or `reactive()` (Project Reactor) APIs let request-handling threads return immediately while Redis work continues. The prefetch-cache structure is identical — replace the synchronous `hgetall` / `multi`/`exec` calls with their async counterparts and chain them together. The bulk-load path in this helper already uses the async API to batch its pipeline.

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

* [Lettuce guide]({{< relref "/develop/clients/lettuce" >}}) - Install and use the Lettuce Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [MULTI command]({{< relref "/commands/multi" >}}) / [EXEC command]({{< relref "/commands/exec" >}}) - Transactional upsert path in `applyChange`
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
