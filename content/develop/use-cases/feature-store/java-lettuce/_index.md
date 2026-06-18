---
aliases:
- /develop/use-cases/feature-store/lettuce
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in Java with Lettuce
linkTitle: Lettuce example (Java)
title: Redis feature store with Lettuce
weight: 5
---

This guide shows you how to build a small Redis-backed online feature store in
Java with [Lettuce]({{< relref "/develop/clients/lettuce" >}}), the
async-by-default Netty-based Redis client. The demo runs on top of the JDK's
`com.sun.net.httpserver.HttpServer` so you can bulk-load a batch of users
with a key-level TTL, run a streaming worker that overwrites real-time
features with per-field TTL, retrieve any subset of features for one user
under 2 ms, and pipeline `HMGET` across a hundred users for batch scoring.

The [Jedis walkthrough]({{< relref "/develop/use-cases/feature-store/java-jedis" >}})
covers the same flow with a synchronous, pool-borrowing client. This page
focuses on what's different in Lettuce — the multiplexed connection, the
`RedisAsyncCommands` surface, and the auto-flush pipelining model — rather
than re-explaining the shared concepts.

## Overview

Each entity (here, a user) is one Redis
[Hash]({{< relref "/develop/data-types/hashes" >}}) at a deterministic key —
`fs:user:{id}`. The hash holds every feature for that entity as one field per
feature: batch-materialized aggregates (refreshed once a day) alongside
streaming-updated signals (refreshed every few seconds). One
[`HMGET`]({{< relref "/commands/hmget" >}}) returns whichever subset the model
needs in one network round trip.

Two TTL layers solve the *mixed staleness* problem without an application-side
cleaner:

* A **key-level** [`EXPIRE`]({{< relref "/commands/expire" >}}) aligned with the
  batch materialization cycle (24 hours in the demo). If the batch refresher
  fails, the whole entity disappears at the next cycle and inference sees a
  missing entity — which the model handler can detect and fall back on —
  rather than silently outdated values.
* A **per-field** [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) (Redis 7.4+) on
  each streaming feature gives that field its own shorter expiry, independent
  of the rest of the hash. If the streaming pipeline stops updating a feature,
  the field self-cleans while the batch fields stay populated.

That gives you:

* A single round trip for retrieval — any subset of features for one entity
  in one [`HMGET`]({{< relref "/commands/hmget" >}}).
* Sub-millisecond hot path. The Redis-side work is microseconds; in practice
  the bottleneck is the network round trip plus the model's own feature-prep.
* Pipelined batch scoring — one round trip for `N` users at once.
* Independent freshness per feature, expressed as a server-side TTL rather
  than as application logic.
* Self-cleanup on pipeline failure: a stalled batch refresher lets entities
  expire on schedule, and a stalled streaming worker lets each affected field
  expire on its own timer.

## How Lettuce differs from Jedis

The big mental-model difference for someone arriving from Jedis:

* **One shared, multiplexed connection.** A `StatefulRedisConnection<K, V>`
  is thread-safe and serves the whole process. There's no `JedisPool`-style
  per-call borrow — every handler in the HTTP thread pool *and* the
  streaming worker share the same connection, and Netty handles the
  serialization onto the underlying socket.
* **Async-by-default API.** Every method on `RedisAsyncCommands<K, V>`
  returns a `RedisFuture<T>` (which is a `CompletionStage<T>` and a
  `Future<T>`). For synchronous code paths the helper blocks with `.get()`;
  for reactive pipelines you'd compose with `.thenApply()` /
  `.thenCompose()` or use the `.reactive()` API directly.
* **Pipelining via connection-level auto-flush.** Lettuce doesn't have a
  `pipelined()`-style builder. Instead, you toggle
  `conn.setAutoFlushCommands(false)` on the connection, queue commands as
  normal async calls (each returns its own `RedisFuture`), call
  `conn.flushCommands()` to ship the batch, and toggle auto-flush back on.
  `LettuceFutures.awaitAll(...)` waits for all the futures to resolve.

In short: reach for **Lettuce** when you need async/reactive composition
or you're already in a reactive stack (Spring WebFlux, Project Reactor);
reach for **Jedis** when blocking commands are common or you want a
simple sync API with explicit per-call connection lifetime. The
[Lettuce]({{< relref "/develop/clients/lettuce" >}}) and
[Jedis]({{< relref "/develop/clients/jedis" >}}) client guides cover the
deeper selection criteria.

In this example, the batch features describe a user's longer-term shape and
are bulk-loaded by `BuildFeatures.java`. The streaming features describe
what the user is doing right now and are written by `StreamingWorker.java`
on a daemon thread. The inference handlers of the demo server read any
subset of those features through `FeatureStore.java`'s helper class. All
four sources share one `StatefulRedisConnection` opened in `DemoServer.java`.

## The feature-store helper

The `FeatureStore` class wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/java-lettuce/FeatureStore.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;

RedisClient client = RedisClient.create("redis://localhost:6379");
try (StatefulRedisConnection<String, String> conn = client.connect()) {
    FeatureStore store = new FeatureStore(conn,
        "fs:user:",
        24L * 60L * 60L,    // whole-entity TTL aligned with the daily batch cycle
        5L * 60L            // per-field TTL on each streaming feature
    );

    // Batch materialization: one HSET + EXPIRE per user, all pipelined
    // through a single connection-level flush.
    Map<String, Map<String, Object>> rows = Map.of(
        "u0001", Map.of(
            "country_iso", "US", "risk_segment", "low",
            "tx_count_7d", 14, "avg_amount_30d", 92.40,
            "account_age_days", 612, "chargeback_count_180d", 0));
    store.bulkLoad(rows);

    // Streaming write: HSET + HEXPIRE on just the fields that changed.
    store.updateStreaming("u0001", Map.of(
        "last_login_ts", System.currentTimeMillis(),
        "last_device_id", "ios-9f02",
        "tx_count_5m", 3,
        "failed_logins_15m", 0,
        "session_country", "US"));

    // Inference read: HMGET of whatever the model needs.
    Map<String, String> features = store.getFeatures("u0001", List.of(
        "risk_segment", "tx_count_7d", "avg_amount_30d",
        "tx_count_5m", "failed_logins_15m"));

    // Batch scoring: pipelined HMGET across many users.
    Map<String, Map<String, String>> batch = store.batchGetFeatures(
        List.of("u0001", "u0002", "u0003"),
        List.of("risk_segment", "tx_count_5m", "failed_logins_15m"));
} finally {
    client.shutdown();
}
```

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis hash
fields are bytes on the wire, so the helper encodes booleans as `"true"` /
`"false"` (`encodeValue(Object)` in `FeatureStore.java`) and renders
everything else with `Object.toString()`. The model server is responsible
for parsing back to the right type, the same way it would when reading any
serialized feature store.

```text
fs:user:u0001                                   TTL = 86400 s (key-level)
  country_iso=US                                <no field TTL>
  risk_segment=low                              <no field TTL>
  account_age_days=612                          <no field TTL>
  tx_count_7d=14                                <no field TTL>
  avg_amount_30d=92.40                          <no field TTL>
  chargeback_count_180d=0                       <no field TTL>
  last_login_ts=1716998413541                   TTL = 300 s (per field, HEXPIRE)
  last_device_id=ios-9f02                       TTL = 300 s (per field, HEXPIRE)
  tx_count_5m=3                                 TTL = 300 s (per field, HEXPIRE)
  failed_logins_15m=0                           TTL = 300 s (per field, HEXPIRE)
  session_country=US                            TTL = 300 s (per field, HEXPIRE)
```

### Bulk-loading batch features

`bulkLoad` queues one `HSET` and one `EXPIRE` per user with auto-flush
disabled, flushes once, and waits for every `RedisFuture` to resolve.

```java
public int bulkLoad(Map<String, Map<String, Object>> rows, long ttlSeconds) {
    if (rows.isEmpty()) return 0;

    List<RedisFuture<?>> futures = new ArrayList<>(rows.size() * 2);
    conn.setAutoFlushCommands(false);
    try {
        for (Map.Entry<String, Map<String, Object>> e : rows.entrySet()) {
            String key = keyFor(e.getKey());
            Map<String, String> encoded = encode(e.getValue());
            futures.add(async.hset(key, encoded));
            futures.add(async.expire(key, ttlSeconds));
        }
        conn.flushCommands();
    } finally {
        conn.setAutoFlushCommands(true);
    }
    if (!LettuceFutures.awaitAll(BATCH_TIMEOUT, futures.toArray(new RedisFuture[0]))) {
        throw new IllegalStateException("bulkLoad: timed out after " + BATCH_TIMEOUT);
    }
    ...
}
```

The two important things to notice:

1. **`setAutoFlushCommands(false)` is on the connection, not the async
   commands.** It affects *every* call going through that
   `StatefulRedisConnection` until it's flipped back. The `finally` block
   restores auto-flush even if a queue step throws — failing to do so would
   silently break every subsequent command in the JVM.
2. **`LettuceFutures.awaitAll` blocks with a timeout.** With auto-flush off,
   queued commands can sit in the local pipeline buffer indefinitely if
   something below the flush goes wrong. The timeout gives `bulkLoad` a
   clean failure mode rather than hanging forever.

In production, the equivalent of this script runs as an offline pipeline (a
Spark or Feast `materialize` job) that reads from the warehouse and writes
into Redis. The
[Feast `RedisOnlineStore`](https://docs.feast.dev/reference/online-stores/redis)
provider does exactly this under the hood; the in-house
[Redis Feature Form]({{< relref "/develop/ai/featureform" >}}) integration
covers the materialize + serve path end-to-end.

### Streaming writes with per-field TTL

`updateStreaming` is the linchpin of the mixed-staleness story:

```java
public void updateStreaming(String entityId, Map<String, Object> fields, long ttlSeconds) {
    if (fields.isEmpty()) return;
    String key = keyFor(entityId);
    Map<String, String> encoded = encode(fields);
    String[] names = encoded.keySet().toArray(new String[0]);

    RedisFuture<Long> hsetFut;
    RedisFuture<List<Long>> hexpireFut;
    conn.setAutoFlushCommands(false);
    try {
        hsetFut = async.hset(key, encoded);
        hexpireFut = async.hexpire(key, ttlSeconds, names);
        conn.flushCommands();
    } finally {
        conn.setAutoFlushCommands(true);
    }
    awaitOne(hsetFut);
    List<Long> codes = awaitOne(hexpireFut);
    for (Long code : codes) {
        if (code == null || code != 1L) {
            throw new IllegalStateException(
                "HEXPIRE did not set every field TTL for " + key + ": " + codes);
        }
    }
    ...
}
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on *individual*
hash fields, not on the whole key. The two commands are queued under one
flush so Redis runs them in pipeline order: the `HSET` first creates or
overwrites the fields, then `HEXPIRE` attaches a TTL to each of those same
fields. `HEXPIRE` returns one status code per field — `1` if the TTL was
set, `2` if the expiry was 0 or in the past (so Redis deleted the field
instead), `0` if an `NX | XX | GT | LT` conditional flag was set and not
met (we never use one here), `-2` if the field doesn't exist on the key.
The helper throws if any code is anything other than `1`, so the "every
streaming write renews its TTL" invariant fails loudly rather than silently
leaving a streaming field with no expiry attached.

If a streaming pipeline stops, the streaming fields drop out one by one as
their per-field TTLs elapse. [`HTTL`]({{< relref "/commands/httl" >}}) lets
the model side inspect the remaining TTL on any field, which is useful both
for debugging and as a freshness signal in the model itself.

> **HEXPIRE requires Redis 7.4 or later.** `HEXPIRE` and the field-level TTL
> commands were added in Redis 7.4. Lettuce 6.4 was the first release with
> the bindings; the demo's `pom.xml` pins 7.5.2.RELEASE.

### Inference reads with HMGET

`getFeatures` is one `HMGET`:

```java
public Map<String, String> getFeatures(String entityId, List<String> fieldNames) {
    String key = keyFor(entityId);
    Map<String, String> out = new LinkedHashMap<>();
    if (fieldNames == null) {
        Map<String, String> all = awaitOne(async.hgetall(key));
        if (all != null) out.putAll(all);
        return out;
    }
    if (fieldNames.isEmpty()) return out;
    List<KeyValue<String, String>> values = awaitOne(
        async.hmget(key, fieldNames.toArray(new String[0])));
    for (KeyValue<String, String> kv : values) {
        if (kv != null && kv.hasValue()) {
            out.put(kv.getKey(), kv.getValue());
        }
    }
    return out;
}
```

Lettuce's `hmget` returns `List<KeyValue<K, V>>` rather than a parallel
`List<V>` like Jedis. `KeyValue` is Lettuce's `Optional`-like wrapper:
`kv.hasValue()` tells you whether Redis returned a value or a nil for that
field, and `kv.getValue()` unwraps it. The helper drops `hasValue()==false`
entries so the caller's `Map<String, String>` only contains fields that
actually exist on the hash.

### Batch scoring with pipelined HMGET

The same connection-level flush pattern carries over to batch reads:

```java
public Map<String, Map<String, String>> batchGetFeatures(
        List<String> entityIds, List<String> fieldNames) {
    if (entityIds.isEmpty() || fieldNames.isEmpty()) {
        return Collections.emptyMap();
    }
    String[] names = fieldNames.toArray(new String[0]);

    List<RedisFuture<List<KeyValue<String, String>>>> futures =
        new ArrayList<>(entityIds.size());
    conn.setAutoFlushCommands(false);
    try {
        for (String id : entityIds) {
            futures.add(async.hmget(keyFor(id), names));
        }
        conn.flushCommands();
    } finally {
        conn.setAutoFlushCommands(true);
    }

    Map<String, Map<String, String>> out = new LinkedHashMap<>();
    for (int i = 0; i < entityIds.size(); i++) {
        List<KeyValue<String, String>> values = awaitOne(futures.get(i));
        Map<String, String> row = new LinkedHashMap<>();
        for (KeyValue<String, String> kv : values) {
            if (kv != null && kv.hasValue()) row.put(kv.getKey(), kv.getValue());
        }
        out.put(entityIds.get(i), row);
    }
    return out;
}
```

One round trip for the whole batch. The first call after server startup
includes a few milliseconds of Netty event-loop and connection warm-up;
steady-state, the demo returns a 100-user batch in 2-5 ms against a local
Redis.

A Redis Cluster is different: a single auto-flush batch is bound to one
shard, because all the queued commands ship through one connection to one
node. For batch reads on a cluster, use
[`RedisClusterClient`]({{< relref "/develop/clients/lettuce" >}}) — its
`StatefulRedisClusterConnection` exposes `getConnection(slot)` for
per-shard auto-flush batching, and the high-level `RedisAdvancedClusterAsyncCommands`
fans out non-pipelined calls per shard automatically.

A hash tag like `fs:user:{vip}:u0001` forces a known set of keys onto the
same shard so one auto-flush batch can cover all of them in a single round
trip.

## The streaming worker

`StreamingWorker.java` is the demo's stand-in for whatever Flink, Kafka
Streams, or bespoke service computes the real-time features
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/java-lettuce/StreamingWorker.java)).
It runs as a daemon `Thread` next to the demo server so the UI can start,
pause, and resume it; in production this code would live in the streaming
layer.

The lifecycle (start / stop / pause / resume / waitForIdle) is identical to
the Jedis demo — the worker thread itself doesn't care which client it's
talking to, only that `FeatureStore.updateStreaming` pipelines the
`HSET` + `HEXPIRE` in order within one flush. The Lettuce helper achieves that through
the connection-level flush described above.

Pausing the worker is what shows off the mixed-staleness behavior: leave
it paused for longer than `streamingTtlSeconds` and the streaming fields
disappear from every user's hash one by one, while the batch fields remain
under the longer key-level `EXPIRE`. The demo's `Pause / resume` button
lets you see this happen in real time.

`pause()` only blocks *future* ticks from running. A reset that's about to
`DEL` every key also needs to wait out an already-running tick, which is
what `waitForIdle()` is for. The demo's `Reset` handler calls
`worker.pause()` *and* `worker.waitForIdle()` before it issues the `DEL`
sweep, so a mid-flight tick can't recreate a user under a streaming-only
hash with no key-level TTL.

## The batch builder

`BuildFeatures.java` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/java-lettuce/BuildFeatures.java)).
It generates synthetic feature rows and calls `store.bulkLoad` once. The
synthesis itself is not the point — in a real deployment the equivalent
code reads from the offline store (Snowflake, BigQuery, Iceberg) and writes
the resulting hashes into Redis.

Run the builder on its own (independently of the demo server) to populate
Redis from the command line:

```bash
mvn exec:java -Dexec.mainClass=BuildFeatures -Dexec.args="--count 500 --ttl-seconds 3600"
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL, which
is how a typical operator would pre-seed a feature store from the command
line when debugging.

## The interactive demo

`DemoServer.java` runs the JDK `HttpServer` on port 8089 with a fixed
thread pool. The HTML page lets you:

* **Bulk-load** any number of users (default 200) with a configurable
  key-level TTL.
* See the **store state**: user count, batch / streaming TTLs, cumulative
  read/write counters.
* See the **streaming worker** status and **pause or resume** it.
* Run an **inference read** for any user with a chosen feature subset, and
  see the value, the per-field TTL, and the read latency.
* Run **batch scoring** with a pipelined `HMGET` across `N` users.
* **Inspect** any user's full hash with field-level TTLs and the key-level
  TTL.

The server holds one `FeatureStore`, one `StreamingWorker`, one
`RedisClient`, and one `StatefulRedisConnection` for the lifetime of the
process. Every HTTP handler and the streaming worker share that single
connection — Lettuce multiplexes the commands across them automatically.
Endpoints:

| Endpoint                  | What it does                                                                        |
|---------------------------|-------------------------------------------------------------------------------------|
| `GET  /state`             | User count, TTL config, stats counters, worker status.                              |
| `POST /bulk-load`         | Auto-flush batched `HSET` + `EXPIRE` over N synthetic users with a chosen TTL.      |
| `POST /worker/toggle`     | Pause / resume the streaming worker.                                                |
| `POST /read`              | `HMGET` a chosen feature subset for one user; report latency and per-field TTLs.    |
| `POST /batch-read`        | Pipeline `HMGET` across N users; report total latency and per-entity field counts.  |
| `GET  /inspect`           | `HGETALL` + `HTTL` for one user; full hash view with per-field TTLs.                |
| `POST /reset`             | Drop every user under the key prefix (used by the demo's reset button).             |

## Prerequisites

* **Redis 7.4 or later.** [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) and
  [`HTTL`]({{< relref "/commands/httl" >}}) were added in Redis 7.4; the
  demo relies on per-field TTL for the mixed-staleness story.
* **Java 17 or later.** The demo uses switch expressions with arrow labels
  (`case "..." -> ...`), records, and text blocks.
* **Lettuce 6.4 or later.** The demo's `pom.xml` pins 7.5.2.RELEASE.
  Field-level TTL bindings (`hexpire`, `httl`, `hpersist`) ship from
  Lettuce 6.4.

If your Redis server is running elsewhere, start the demo with
`--redis-uri redis://host:port`.

## Running the demo

### Get the source files

The demo lives in a small Maven project under
[`feature-store/java-lettuce`](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/java-lettuce).
Clone the repo or copy the directory:

```bash
git clone https://github.com/redis/docs.git
cd docs/content/develop/use-cases/feature-store/java-lettuce
mvn package
```

### Start the demo server

From the project directory:

```bash
mvn exec:java -Dexec.mainClass=DemoServer
```

You should see:

```text
Dropping any existing users under 'fs:user:*' for a clean demo run (pass --no-reset to keep them).
Redis feature-store demo server listening on http://127.0.0.1:8089
Using Redis at redis://localhost:6379 with key prefix 'fs:user:' (batch TTL 86400s, streaming TTL 300s)
Materialized 200 user(s); streaming worker running.
```

Open [http://127.0.0.1:8089](http://127.0.0.1:8089). The first inference
read after startup is a few milliseconds slower than the rest because
Lettuce / Netty are warming up the event loop and the underlying socket;
subsequent reads settle into 1-2 ms on a local Redis.

Useful things to try:

* Pick a user and click **Read features** with a mixed batch/streaming
  subset — you'll see batch fields with no per-field TTL (covered by the
  key-level TTL) and streaming fields with a positive per-field TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a
  100-user batch read.
* Click **Pause / resume** on the streaming worker and leave it paused for
  ~5 minutes (or restart the server with `--streaming-ttl-seconds 30` to
  make it visible in seconds). Re-run **Read features** on any user and
  watch the streaming fields disappear while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level TTLs.
* Click **Reset** to drop every user and start over.

The server is read/write against your local Redis. The default key prefix
is `fs:user:`. Pass `--no-reset` to keep existing data across restarts, or
`--redis-uri` to point at a different Redis.

## Production usage

The guidance below focuses on the production concerns that are specific to
running a feature store on Redis. For the generic Lettuce production
checklist — `ClientResources` tuning, AUTH/ACL, retry policy,
sentinel/cluster failover — see the
[Lettuce client guide]({{< relref "/develop/clients/lettuce" >}}). For TLS
specifically, follow the
[connect-with-TLS recipe]({{< relref "/develop/clients/lettuce/connect#tls-connection" >}}).
The feature-store demo runs against `localhost` with the defaults; a real
deployment should harden the client first.

### Pick the batch TTL to outlast a failed refresher

The whole-entity `EXPIRE` is your safety net against silent staleness from
a broken batch pipeline. Set it longer than your worst-case batch outage
so a single missed run doesn't take the feature store offline, but short
enough that a sustained outage causes loud failures (missing entities)
rather than quiet ones (yesterday's features being scored as today's). The
standard choice is one cycle of "expected refresh interval × 2" — for a
daily batch, 48 hours; for a 6-hour batch, 12 hours.

The same logic applies to the per-field streaming TTL: a few times the
expected update interval so a slow-but-alive streaming worker doesn't
churn features needlessly, but short enough that a stalled worker causes
visible freshness failures.

### Don't share auto-flush state across unrelated code paths

`conn.setAutoFlushCommands(false)` flips a *connection-level* toggle that
affects every call going through that connection until it's flipped
back. If two threads run pipelined writes concurrently against the same
connection, they will fight over the flag — one thread's `flushCommands()`
will ship the other thread's still-being-queued commands, or its
restore-to-true will flush the other thread's queue prematurely. Worse,
a single non-pipelined read on that same connection will be silently
queued (and never flushed) while the flag is off.

The demo handles this by opening **two** connections from the same
`RedisClient`:

* **The shared read connection** stays in default auto-flush=true mode.
  Every HTTP handler and the streaming worker use it for the
  non-pipelined commands (`HMGET`, `HTTL`, `TTL`, `SCAN`, `DEL`,
  `HGETALL`).
* **The dedicated pipeline connection** is reserved for `bulkLoad`,
  `updateStreaming`, and `batchGetFeatures`. These all acquire a single
  `pipelineLock` inside the `FeatureStore` instance before they touch
  the auto-flush flag, so concurrent batches block each other instead
  of corrupting the state. With one lock and one connection, you get at
  most one in-flight batch at a time on the pipeline side; the read
  connection is unaffected.

For batch concurrency beyond what one connection sustains, scale this
pattern to a small
[`BoundedAsyncPool<StatefulRedisConnection<K, V>>`]({{< relref "/develop/clients/lettuce" >}})
of pipeline connections and lease one per batch.

### Pipeline batch reads across shards

On a single Redis instance, an auto-flush batched `HMGET` across `N` users
is one round trip. A Redis Cluster is different: a single auto-flush batch
is bound to one shard, because all queued commands ship to one node. For
batch reads on a cluster, use
[`RedisClusterClient`]({{< relref "/develop/clients/lettuce" >}}) and one
of:

* Fan-out via `RedisAdvancedClusterAsyncCommands` — the cluster client
  routes each `hmGet` to the right shard transparently. Easier to write,
  slightly more overhead per call.
* Bucket keys by slot with `SlotHash.getSlot(key)` and open one connection
  per affected shard; auto-flush-batch each bucket separately. More code,
  but one round trip per shard.

For a small number of frequently-queried users (a top-N customer list, for
example), a hash tag like `fs:user:{vip}:u0001` forces a known set of keys
onto the same shard so one batch can cover them all.

### Make HEXPIRE part of every streaming write

The single biggest correctness lever in this design is that the streaming
write applies `HEXPIRE` *every time*. If a streaming worker writes a field
without renewing its TTL, the field carries whatever expiry was there
before — possibly none, possibly stale — and the mixed-staleness invariant
breaks. Keep the `HSET` and `HEXPIRE` under the same flush boundary (or,
even safer, in the same
[Lua script]({{< relref "/develop/programmability/eval-intro" >}}) if you
don't trust the call site).

### Avoid HGETALL on the request path

`HGETALL` reads every field on the hash, including ones the model doesn't
need. With dozens of features per entity, that is wasted serialization
work on the server and wasted bandwidth on the wire. Always specify the
field list explicitly with `hmget` in the model server.

The exception is debugging and feature-set discovery, where you genuinely
want the full hash. The demo's "Inspect" button uses `hgetall` for exactly
this reason.

### Inspect the store directly with redis-cli

When testing or troubleshooting, the cli tells you everything:

```bash
# How many users currently in the store
redis-cli --scan --pattern 'fs:user:*' | wc -l

# One user's full hash and key-level TTL
redis-cli HGETALL fs:user:u0001
redis-cli TTL    fs:user:u0001

# Per-field TTL on the streaming fields
redis-cli HTTL fs:user:u0001 FIELDS 5 \
  last_login_ts last_device_id tx_count_5m failed_logins_15m session_country

# Sample HMGET as the model would issue it
redis-cli HMGET fs:user:u0001 risk_segment tx_count_7d avg_amount_30d tx_count_5m
```

A streaming field that returns `-2` from `HTTL` doesn't exist on the hash
(either it was never written, or it expired); `-1` means the field has no
TTL set (and is therefore covered only by the key-level `EXPIRE`); any
positive value is the remaining TTL in seconds.

## Learn more

This example uses the following Redis commands:

* [`HSET`]({{< relref "/commands/hset" >}}) to write a feature or a whole
  feature row in one call.
* [`HMGET`]({{< relref "/commands/hmget" >}}) to retrieve any subset of
  features for one entity in one round trip.
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) for debugging and
  feature-set discovery.
* [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) and
  [`HTTL`]({{< relref "/commands/httl" >}}) for per-field TTL on streaming
  features (Redis 7.4+).
* [`EXPIRE`]({{< relref "/commands/expire" >}}) and
  [`TTL`]({{< relref "/commands/ttl" >}}) for the whole-entity TTL aligned
  with the batch materialization cycle.
* Pipelined `HMGET` across many entities for batch scoring with one
  network round trip via Lettuce's connection-level auto-flush.

See the [Lettuce documentation]({{< relref "/develop/clients/lettuce" >}})
for the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the
deeper conceptual model.
