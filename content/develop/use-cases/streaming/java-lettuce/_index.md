---
aliases:
- /develop/use-cases/streaming/lettuce
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis event-streaming pipeline in Java with Lettuce
linkTitle: Lettuce example (Java)
title: Redis streaming with Lettuce
weight: 5
---

This guide shows you how to build a Redis-backed event-streaming pipeline in Java with the [Lettuce]({{< relref "/develop/clients/lettuce" >}}) client library. It includes a small local web server built on the JDK's `com.sun.net.httpserver` so you can produce events into a single Redis Stream, watch two independent consumer groups read it at their own pace, and recover stuck deliveries with `XAUTOCLAIM` after simulating a consumer crash.

## Overview

A Redis Stream is an append-only log of field/value entries with auto-generated, time-ordered IDs. Producers append with [`XADD`]({{< relref "/commands/xadd" >}}); consumers belong to *consumer groups* and read with [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}). The group as a whole tracks a single `last-delivered-id` cursor, and each consumer gets its own pending-entries list (PEL) of messages it has been handed but not yet acknowledged. Once a consumer has processed an entry it calls [`XACK`]({{< relref "/commands/xack" >}}) to clear the entry from its PEL; entries left unacknowledged past an idle threshold can be reassigned to a healthy consumer with [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}).

That gives you:

* Ordered, durable history that many independent consumer groups can read at their own pace
* At-least-once delivery, with per-consumer pending lists and automatic recovery of crashed consumers
* Horizontal scaling within a group — add a consumer and Redis automatically splits the work
* Replay of any range with [`XRANGE`]({{< relref "/commands/xrange" >}}), independent of consumer-group state
* Bounded retention through [`XADD MAXLEN ~`]({{< relref "/commands/xadd" >}}) or
  [`XTRIM MINID ~`]({{< relref "/commands/xtrim" >}}), without a separate cleanup job

In this example, producers append order events (`order.placed`, `order.paid`, `order.shipped`, `order.cancelled`) to a single stream at `demo:events:orders`. Two consumer groups read the same stream:

* **`notifications`** — two consumers (`worker-a`, `worker-b`) sharing the work, modelling a fan-out worker pool.
* **`analytics`** — one consumer (`worker-c`) processing the full event flow on its own.

## How it works

The flow looks like this:

1. The application calls `stream.produce(eventType, payload)` which runs [`XADD`]({{< relref "/commands/xadd" >}}) with an approximate [`MAXLEN ~`]({{< relref "/commands/xadd" >}}) cap. Redis assigns an auto-generated time-ordered ID.
2. Each `ConsumerWorker` runs a daemon thread that loops on [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` (meaning "deliver entries this group has not yet delivered to anyone") and a short block timeout.
3. After processing each entry, the consumer calls [`XACK`]({{< relref "/commands/xack" >}}) so Redis can drop it from the group's pending list.
4. If a consumer is killed (or crashes) before acking, its entries sit in the group's PEL. A periodic [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) sweep reassigns idle entries to a healthy consumer.
5. Anyone — including code outside the consumer groups — can read history with [`XRANGE`]({{< relref "/commands/xrange" >}}) without affecting any group's cursor.

Each consumer group has its own cursor (`last-delivered-id`) and its own pending list, so the two groups in this demo process the same events without coordinating with each other.

## The event-stream helper

The `EventStream` class wraps the stream operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/java-lettuce/EventStream.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;

RedisClient client = RedisClient.create(
        RedisURI.builder().withHost("localhost").withPort(6379).build());
StatefulRedisConnection<String, String> connection = client.connect();

EventStream stream = new EventStream(
        connection,
        "demo:events:orders",
        2000L,    // approximate MAXLEN retention guardrail
        5000L);   // XAUTOCLAIM idle threshold (ms)

// Producer
Map<String, String> payload = new LinkedHashMap<>();
payload.put("order_id", "o-1234");
payload.put("customer", "alice");
payload.put("amount", "49.50");
String streamId = stream.produce("order.placed", payload);

// Consumer group + one consumer
stream.ensureGroup("notifications", "0-0");
List<EventStream.Entry> entries = stream.consume(
        "notifications", "worker-a", 10L, 500L);
for (EventStream.Entry entry : entries) {
    handle(entry.fields);                                     // your processing
    stream.ack("notifications", List.of(entry.id));           // XACK
}

// Recover stuck PEL entries by reaping them into a healthy consumer.
// The textbook pattern: each consumer periodically calls XAUTOCLAIM
// with itself as the target and processes whatever it claimed.
// ConsumerWorker.reapIdlePel() wraps that flow; the low-level helper
// stream.autoclaim(group, target, ...) is also available if you want
// to drive XAUTOCLAIM directly.
ConsumerWorker.ReapResult result = workerB.reapIdlePel();
// result.claimed, result.processed, result.deletedIds
// deletedIds are PEL entries whose payload was already trimmed.
// Redis 7+ has already removed those slots from the PEL, so no XACK
// is needed — log them and route to a dead-letter store for audit.

// Replay history (independent of any group's cursor)
for (EventStream.Entry entry : stream.replay("-", "+", 50L)) {
    System.out.println(entry.id + " " + entry.fields);
}
```

### Data model

Each event is a single stream entry — a flat map of field/value strings — with an auto-generated time-ordered ID:

```text
demo:events:orders
  1716998413541-0   type=order.placed     order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-0   type=order.paid       order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-1   type=order.shipped    order_id=o-1235   customer=bob    amount=12.00  ts_ms=...
  ...
```

The ID is `{milliseconds}-{sequence}`, monotonically increasing within the stream, so you can range-query by approximate wall-clock time without an extra index. (IDs are ordered within a stream, not across streams — two events appended to different streams at the same millisecond can produce the same ID.) The implementation uses:

* [`XADD`]({{< relref "/commands/xadd" >}}) with [`XAddArgs.maxlen(n).approximateTrimming()`](https://github.com/redis/lettuce/) on every append, so the stream stays bounded as it rolls forward
* [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with `XReadArgs.StreamOffset.lastConsumed(...)` (the `>` offset in CLI) for fresh deliveries
* [`XACK`]({{< relref "/commands/xack" >}}) on every processed entry
* [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) for sweeping idle pending entries to a healthy consumer
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit
* [`XPENDING`]({{< relref "/commands/xpending" >}}) for inspecting the per-group pending list
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for surface-level observability
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement

## Producing events

`produceBatch` queues several `XADD` calls through Lettuce's async API. Each call carries an approximate `MAXLEN ~` cap so the stream stays bounded as it rolls forward:

```java
public List<String> produceBatch(Iterable<Map.Entry<String, Map<String, String>>> events) {
    RedisAsyncCommands<String, String> async = connection.async();
    List<RedisFuture<String>> futures = new ArrayList<>();
    for (Map.Entry<String, Map<String, String>> event : events) {
        Map<String, String> fields = encodeFields(event.getKey(), event.getValue());
        XAddArgs args = XAddArgs.Builder.maxlen(maxlenApprox).approximateTrimming();
        futures.add(async.xadd(streamKey, args, fields));
    }
    List<String> ids = new ArrayList<>(futures.size());
    for (RedisFuture<String> future : futures) {
        ids.add(future.get());
    }
    return ids;
}
```

The `~` flavour of `MAXLEN` (set with `approximateTrimming()`) lets Redis trim at a macro-node boundary, which is much cheaper than exact trimming and is what you want when the cap is a retention *guardrail*, not a hard size constraint. With 300 events produced and `MAXLEN ~ 50`, you might end up with 100 entries left — Redis released the oldest whole macro-node and stopped. The next `XADD` keeps length stable.

If you genuinely need an exact cap (rare), call `.exactTrimming()` instead of `.approximateTrimming()`. The performance difference is significant on busy streams.

A Lettuce-specific point on batching: the obvious "true pipeline" pattern of `setAutoFlushCommands(false)` + queue + `flushCommands()` + bulk-await is **connection-scoped** — auto-flush off on the shared connection stalls every *other* thread that is issuing sync commands on the same connection. In this demo the consumer workers' `XREADGROUP` loops use the sync API on the same connection, so flipping the connection's auto-flush flag to batch produces would freeze every consumer thread until the batch finished. The helper sidesteps that by leaving auto-flush on; Lettuce still pipelines the queued async `XADD` calls when they arrive faster than the round-trip latency. For truly large produce batches you would use a dedicated `RedisClient.connect()` for the producer and toggle `setAutoFlushCommands(false)` on *that* connection only.

## Reading with a consumer group

Each consumer in a group runs the same `XREADGROUP` loop. The `XReadArgs.StreamOffset.lastConsumed(streamKey)` offset is the CLI's `>` — "deliver entries this group has not yet delivered to *anyone*":

```java
public List<Entry> consume(String group, String consumer, long count, long blockMs) {
    XReadArgs.StreamOffset<String> offset =
            XReadArgs.StreamOffset.lastConsumed(streamKey);
    XReadArgs args = XReadArgs.Builder.count(count).block(blockMs);
    List<StreamMessage<String, String>> raw = connection.sync()
            .xreadgroup(Consumer.from(group, consumer), args, offset);
    return toEntries(raw);
}
```

`blockMs` makes the call efficient even when the stream is idle: the client parks on the server until either an entry arrives or the timeout expires, so consumers don't busy-loop.

Reading with an explicit ID like `0` (via `XReadArgs.StreamOffset.from(streamKey, "0")`) does something different — it replays entries already delivered to *this* consumer name (its private PEL). That is the canonical recovery path when the same consumer restarts: catch up on its own pending entries first, then resume reading new ones. `EventStream` exposes that as `consumeOwnPel`.

## Acknowledging entries

Once the consumer has processed an entry, `XACK` tells Redis it can drop the entry from the group's pending list:

```java
public long ack(String group, Collection<String> ids) {
    if (ids == null || ids.isEmpty()) return 0L;
    Long n = connection.sync().xack(streamKey, group, ids.toArray(new String[0]));
    return n == null ? 0L : n;
}
```

This is the linchpin of at-least-once delivery: an entry that is never acked stays in the PEL until a claim moves it elsewhere. If your consumer thread crashes between processing and ack, the next claim sweep picks the entry back up. The one caveat is retention: `XADD MAXLEN ~` and `XTRIM` can release the entry's *payload* even while its ID is still in the PEL. The next `XAUTOCLAIM` returns those IDs in its deleted-IDs list and removes them from the PEL inside the same command — the entry cannot be retried, so the caller should log it and route to a dead-letter store for audit.

The trade-off is the opposite of pub/sub: a slow or crashed consumer doesn't lose messages, but it does mean your downstream system must be idempotent. If you process an order twice because the first attempt died after the side effect but before the ack, the second attempt must be safe.

## Multiple consumer groups, one stream

The big difference between Redis Streams and a job queue is that any number of independent consumer groups can read the same stream. The demo sets up two groups on `demo:events:orders`:

```java
stream.ensureGroup("notifications", "0-0");
stream.ensureGroup("analytics",     "0-0");
```

Each group has its own cursor. Producing 5 events results in `notifications` and `analytics` each receiving all 5, with no coordination between them. Within `notifications`, the work is split across `worker-a` and `worker-b`: Redis hands each `XREADGROUP` call whatever entries are not yet delivered to anyone in the group, so adding a second worker doubles throughput without any rebalance logic.

The `"0-0"` start ID means "deliver everything in the stream from the beginning" — useful in a demo and for fresh groups bootstrapping from history. In production, a brand-new group reading a long-existing stream usually starts at `$` ("only events after this point") and uses [`XRANGE`]({{< relref "/commands/xrange" >}}) explicitly if it needs history.

## Recovering crashed consumers with XAUTOCLAIM

The demo's "Crash next 3" button tells a chosen consumer to drop its next three deliveries on the floor without acking them — the same effect as a worker process dying mid-message. Those entries stay in the group's PEL with their delivery counter incremented. Once they have been idle for at least `claim_min_idle_ms`, any healthy consumer in the group can rescue them by calling `XAUTOCLAIM` *with itself as the target*. `ConsumerWorker.reapIdlePel` wraps that pattern
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/java-lettuce/ConsumerWorker.java)):

```java
public ReapResult reapIdlePel() {
    EventStream.AutoClaimResult result = stream.autoclaim(
            group, name, 100L, "0-0", 10);
    int processedThisCall = 0;
    for (EventStream.Entry entry : result.claimed) {
        try {
            handleEntry(entry.id, entry.fields);
            processedThisCall += 1;
        } catch (Exception exc) {
            System.err.printf("[%s/%s] reap failed on %s: %s%n",
                    group, name, entry.id, exc.getMessage());
        }
    }
    return new ReapResult(
            result.claimed.size(), processedThisCall, result.deletedIds);
}
```

The underlying `stream.autoclaim` helper pages through the group's PEL with `XAUTOCLAIM`'s continuation cursor:

```java
public AutoClaimResult autoclaim(
        String group, String consumer, long pageCount, String startId, int maxPages) {
    List<Entry> claimedAll = new ArrayList<>();
    List<String> deletedAll = new ArrayList<>();
    String cursor = startId == null ? "0-0" : startId;
    String lastCursor = cursor;
    for (int i = 0; i < maxPages; i++) {
        AutoClaimPage page = autoclaimPage(group, consumer, pageCount, cursor);
        claimedAll.addAll(page.claimed);
        deletedAll.addAll(page.deletedIds);
        lastCursor = page.nextCursor;
        if ("0-0".equals(page.nextCursor)) break;
        cursor = page.nextCursor;
    }
    return new AutoClaimResult(claimedAll, deletedAll, lastCursor);
}
```

A single `XAUTOCLAIM` call scans up to `pageCount` PEL entries starting at `startId`, reassigns the ones idle for at least `min_idle_time` to the named consumer, and returns a continuation cursor in the first slot of the reply. For a full sweep, loop until the cursor returns to `"0-0"` (with a `maxPages` safety net so one call cannot monopolise a very large PEL). The delivery counter is incremented on every claim — after a few cycles you can use it to spot a *poison-pill* message that crashes every consumer that touches it, and route it to a dead-letter stream so the bad entry stops cycling. (New entries keep flowing past the poison pill — `XREADGROUP >` still delivers fresh work — but the bad entry's repeated reclaim wastes consumer time and keeps the PEL larger than it needs to be.)

The `deletedIds` list contains PEL entry IDs whose stream payload was already trimmed by the time the claim ran (typically because `MAXLEN ~` retention outran a slow consumer). `XAUTOCLAIM` on Redis 7+ removes those dangling slots from the PEL itself, so the caller does *not* need to `XACK` them — but the entries cannot be retried either, so log and route them to a dead-letter store for offline inspection. Redis 7.0 introduced this third return element; the example requires Redis 7.0+ for that reason.

A Lettuce-specific quirk: Lettuce's typed `xautoclaim` method returns a `ClaimedMessages` object that only exposes the continuation cursor and the claimed messages — it does **not** surface the third (deleted-IDs) slot. To preserve the textbook `(cursor, claimed, deletedIds)` shape that the other clients return, `EventStream.autoclaim` dispatches the command itself with a `NestedMultiOutput` and parses all three slots manually. It's a small amount of boilerplate, but until Lettuce extends `ClaimedMessages` there is no clean way to read the deleted IDs through the typed helper.

`reapIdlePel` is the right primitive for the recovery path because it claims and processes in one step: every entry the call returned is now in *this* consumer's PEL, so the same consumer is responsible for processing and acking it. In production each consumer thread runs `reapIdlePel` periodically (every few seconds, on a timer) so a crashed peer's entries never sit invisibly. The demo exposes it as a manual button so you can trigger the reap after waiting for the idle threshold.

`XCLAIM` (singular, no auto) does the same thing for a specific list of entry IDs you already have in hand — useful when you want to take ownership of one known stuck entry, or when you need to move a specific consumer's PEL to a peer (the case the demo's "Remove consumer" button handles via `handoverPending`). `XAUTOCLAIM` cannot filter by source consumer, so it cannot be used for a per-consumer handover.

## Replay with XRANGE

`XRANGE` reads a slice of history. It is completely independent of any consumer group — no cursors move, no acks happen — so it is safe to call any number of times, from any process:

```java
public List<Entry> replay(String startId, String endId, long count) {
    Range<String> range = Range.create(
            startId == null ? "-" : startId,
            endId == null ? "+" : endId);
    List<StreamMessage<String, String>> raw = connection.sync()
            .xrange(streamKey, range, Limit.from(count));
    return toEntries(raw);
}
```

The special IDs `-` and `+` mean "from the very beginning" and "to the very end". You can also pass real IDs (`1716998413541-0`) or just the millisecond part (`1716998413541`, which Redis interprets as "any entry with this timestamp").

Typical uses:

* **Bootstrapping a new projection** — read the entire stream from `-` and build a derived view in another store (a search index, a SQL table, a different cache). Doing this against a consumer group would consume the entries; `XRANGE` lets you do it without disrupting live consumers.
* **Auditing recent activity** — read the last few minutes by ID range without touching any group cursor.
* **Debugging** — fetch one specific entry by its ID, or a tight range around an incident timestamp, to see exactly what producers wrote.

## The consumer worker thread

`ConsumerWorker` wraps the `XREADGROUP` → process → `XACK` loop in a daemon thread:

```java
private void run() {
    while (!stopRequested) {
        if (paused) {
            sleepQuietly(50L);
            continue;
        }
        List<EventStream.Entry> entries;
        try {
            entries = stream.consume(group, name, 10L, 500L);
        } catch (Exception exc) {
            System.err.printf("[%s/%s] read failed: %s%n",
                    group, name, exc.getMessage());
            sleepQuietly(500L);
            continue;
        }
        if (entries == null || entries.isEmpty()) continue;
        for (EventStream.Entry entry : entries) {
            dispatch(entry.id, entry.fields);
        }
    }
}
```

`dispatch` either acks (the normal path) or, when the demo has asked the worker to "crash", drops the entry on the floor and increments a counter so the UI can show what is currently in the PEL waiting to be claimed.

Recovery of stuck PEL entries — this consumer's, after a restart, or another consumer's, after a crash — runs through a separate `reapIdlePel` method rather than the read loop. That method calls `XAUTOCLAIM` with this consumer as the target, then processes whatever was claimed in the same flow as new entries. This is the textbook Streams pattern: each consumer is its own reaper, running `XAUTOCLAIM(self)` periodically (or on demand) so a crashed peer's entries never sit invisibly in the PEL. The demo's "XAUTOCLAIM to selected" button calls `reapIdlePel` on the chosen consumer; in production you would run it from a timer every few seconds.

Note that the worker's main read loop deliberately does *not* read its own PEL on every iteration (the `consumeOwnPel` helper exists for the explicit recovery case). Re-delivering every pending entry on every loop iteration would *reset its idle counter to zero* each time, which would keep crashed entries below the `XAUTOCLAIM` threshold forever. Using `XAUTOCLAIM(self)` as the recovery primitive — which only fires for entries idle longer than `min_idle_time` — avoids that whole class of bug.

The pause and crash levers exist only for the demo. A real consumer is just the read-process-ack loop — everything else in this class is instrumentation.

## Prerequisites

* Redis 7.0 or later. `XAUTOCLAIM` was added in Redis 6.2, but its reply gained a third element (the list of deleted IDs) in 7.0; the example relies on that shape.
* JDK 17 or later (the demo uses Java text blocks for the inlined HTML).
* The Lettuce JAR (and its Netty + Reactor dependencies) on your classpath. Get them from
  [Maven Central](https://repo1.maven.org/maven2/io/lettuce/lettuce-core/),
  or via Maven/Gradle in a project setup.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of three Java files. Download them from the [`java-lettuce` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/streaming/java-lettuce) on GitHub, or grab them with `curl`:

```bash
mkdir streaming-demo && cd streaming-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/streaming/java-lettuce
curl -O $BASE/EventStream.java
curl -O $BASE/ConsumerWorker.java
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
javac -cp 'lib/*' EventStream.java ConsumerWorker.java DemoServer.java
java -cp '.:lib/*' DemoServer
```

You should see:

```text
Deleting any existing data at key 'demo:events:orders' for a clean demo run (pass --no-reset to keep it).
Redis streaming demo server listening on http://127.0.0.1:8784
Using Redis at localhost:6379 with stream key 'demo:events:orders' (MAXLEN ~ 2000)
Seeded 3 consumer(s) across 2 group(s)
```

By default the demo wipes the configured stream key on startup so each run starts from a clean state. Pass `--no-reset` to keep any existing data at the key (useful when re-running against the same stream to inspect prior state), or `--stream-key <name>` to point the demo at a different key entirely. Other supported flags: `--port`, `--redis-host`, `--redis-port`, `--maxlen`, `--claim-idle-ms`.

Open [http://127.0.0.1:8784](http://127.0.0.1:8784) in a browser. You can:

* **Produce** any number of events of a chosen type (or random types). Watch the stream length grow and the tail update.
* See each **consumer group**: its `last-delivered-id`, the size of its pending list, and the consumers in it. Each consumer shows its processed count, pending count, and idle time.
* **Add or remove** consumers within a group at runtime to see Redis split the work across the new shape.
* Click **Crash next 3** on a consumer to drop its next three deliveries — the same effect as a worker process dying after `XREADGROUP` but before `XACK`. Watch the **Pending entries (XPENDING)** panel fill up.
* Wait until the idle time exceeds the threshold (default 5000 ms), pick a healthy target consumer, and click **XAUTOCLAIM to selected** — the stuck entries are reassigned and the delivery counter increments.
* **Replay (XRANGE)** any range to confirm the full history is independent of consumer-group state.
* **XTRIM** with an approximate `MAXLEN` to bound retention. Note that an approximate trim only releases whole macro-nodes — `MAXLEN ~ 50` on a small stream may not delete anything; on a 300-entry stream it typically lands at around 100.
* Click **Reset demo** to drop the stream and re-seed the default groups.

## Production usage

### Pick retention by length or by minimum ID

The demo uses `MAXLEN ~` on every `XADD`. Two alternatives are worth considering:

* `MINID ~ <id>` — keep only entries newer than an ID. If you want "the last 24 hours", compute the wall-clock cutoff and call `stream.trimMinid(...)` (or `XTRIM MINID ~ <ms>-0`). This is the right pattern when retention is time-bounded.
* No cap on `XADD` plus a periodic `XTRIM` job — useful if your producer is hot and the per-`XADD` work has to stay minimal, or if retention rules are complex (a separate process can also factor in consumer-group lag).

In all three cases the trimming is approximate by default. Use exact trimming (`.exactTrimming()`) only when you genuinely need an exact count.

### Don't let consumer-group lag silently grow

`XINFO GROUPS` reports each group's `lag` (entries the group has not yet read) and `pending` (entries delivered but not acked). In production, alert on either of these crossing a threshold — a steadily growing pending count usually means consumers are crashing without `XAUTOCLAIM` running, and a growing lag means consumers can't keep up with producers.

The same applies inside a group: `XINFO CONSUMERS` reports per-consumer pending counts and idle times, so you can spot one slow consumer holding entries that the rest of the group is waiting on.

### Make consumer logic idempotent

`XAUTOCLAIM` can re-deliver an entry to a different consumer after a crash. If your processing has side effects (sending email, charging a card, updating a downstream store), make sure the same entry processed twice gives the same result — use an idempotency key, an upsert with conditional check, or a once-per-id guard table. Redis Streams cannot give you exactly-once semantics on its own.

### Bound the delivery counter as a poison-pill signal

`XPENDING` returns each entry's delivery count, incremented on every claim. If an entry has been delivered (and dropped) several times, the next consumer is unlikely to fare better. After some threshold — `deliveries >= 5`, say — route the entry to a *dead-letter stream*, ack it on the original group, and alert. New entries keep flowing past a poison pill (`XREADGROUP >` still delivers fresh work), but the bad entry's repeated reclaim wastes consumer time and keeps the PEL bigger than it needs to be — without a DLQ threshold it can also slowly trip retention/lag alerts.

### Partition by tenant or entity for scale

A single Redis Stream is a single key, and on a Redis Cluster a single key lives on a single shard. If your throughput exceeds what one shard can handle, partition the stream — for example by tenant ID (`events:orders:{tenant_a}`, `events:orders:{tenant_b}`) — so different tenants land on different shards. Hash-tags (`{tenant_a}`) keep all related streams on the same shard if you need to multi-stream atomically.

Per-entity partitioning (`events:order:{order_id}`) is the canonical pattern when you treat each entity's stream as the event-sourcing log for that entity: every state change for one order goes on its own stream, which is also bounded in size by the entity's lifetime.

### Use a separate consumer pool per group

The demo runs every consumer in one process. In production each consumer group is usually its own deployment — its own pool of pods or VMs — so a slow projection in `analytics` cannot pull `notifications` workers off their stream. Each pod runs one consumer thread per CPU core, with `XAUTOCLAIM` either embedded in the consumer loop (every N reads, claim idle entries to self) or run by a separate reaper.

### Don't read with XREAD (no group) and then try to ack

`XREAD` and `XREADGROUP` are different mechanisms. `XREAD` is a tail-the-log read with no consumer-group state — entries are not added to any PEL, and you cannot `XACK` them. If you want at-least-once delivery and crash recovery, you must read through a consumer group.

`XREAD` is still useful for read-only tail clients (a UI streaming events, a debugger, a `tail -f`-style command-line tool). It's just not part of the at-least-once path.

### Use a dedicated connection (or a pool) for batched produces

The demo shares one `StatefulRedisConnection` across HTTP handlers and consumer threads. Lettuce is thread-safe for individual commands, but `setAutoFlushCommands(false)` is **connection-wide**: turning auto-flush off so an async batch can flush in one round trip would stall every other thread that is mid-flight on the same connection — and sync calls on those threads would silently hang until something else triggered a flush. The helper's `produceBatch` therefore leaves auto-flush on and relies on Lettuce's natural pipelining of arrival-rate-faster-than-RTT writes. For large produce batches use [`ConnectionPoolSupport`](https://github.com/redis/lettuce/wiki/Connection-Pooling) (or a second `RedisClient.connect()` dedicated to the producer) and toggle `setAutoFlushCommands(false)` on the dedicated connection only.

If you mix `setAutoFlushCommands(false)` with the **sync** API on the same connection, the call deadlocks silently — each sync call awaits its own future, and with auto-flush off those futures never complete. Always use the async API (`connection.async()`) inside the auto-flush-off window and await the futures in bulk; restore auto-flush to `true` in a `finally` block.

### Inspect the stream directly with redis-cli

When testing or troubleshooting, inspect the stream directly to confirm the consumer state is what you expect:

```bash
# Stream summary
redis-cli XLEN demo:events:orders
redis-cli XINFO STREAM demo:events:orders

# Group cursors and pending counts
redis-cli XINFO GROUPS demo:events:orders

# Consumers within a group
redis-cli XINFO CONSUMERS demo:events:orders notifications

# Pending entries with idle time and delivery count
redis-cli XPENDING demo:events:orders notifications - + 20

# Tail the stream live (no consumer-group state — like tail -f)
redis-cli XREAD BLOCK 0 STREAMS demo:events:orders '$'

# Replay a range
redis-cli XRANGE demo:events:orders - + COUNT 50
```

If a group's `lag` is growing while consumers' `idle` times are short, consumers are healthy but producers are outpacing them — add more consumers. If `pending` is growing while `lag` is small, consumers are *receiving* entries but not *acking* them — either they are crashing mid-message or your acking logic has a bug.

## Learn more

This example uses the following Redis commands:

* [`XADD`]({{< relref "/commands/xadd" >}}) to append an event with an approximate `MAXLEN` cap.
* [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) to read new entries for a consumer in a group.
* [`XACK`]({{< relref "/commands/xack" >}}) to acknowledge a processed entry.
* [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) to reassign idle pending entries to a healthy consumer.
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit, independent of consumer-group state.
* [`XPENDING`]({{< relref "/commands/xpending" >}}) to inspect the per-group pending list with idle times and delivery counts.
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement.
* [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}) and
  [`XGROUP DELCONSUMER`]({{< relref "/commands/xgroup-delconsumer" >}}) to manage groups and consumers.
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for observability.

See the [Lettuce guide]({{< relref "/develop/clients/lettuce" >}}) for the full client reference, and the [Streams overview]({{< relref "/develop/data-types/streams" >}}) for the deeper conceptual model — consumer groups, the PEL, claim semantics, capped streams, and the differences with Kafka partitions.
