---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis event-streaming pipeline in C# with StackExchange.Redis
linkTitle: StackExchange.Redis example (C#)
title: Redis streaming with StackExchange.Redis
weight: 6
---

This guide shows you how to build a Redis-backed event-streaming pipeline in C# with [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/). It includes a small local web server built with ASP.NET Core's minimal API so you can produce events into a single Redis Stream, watch two independent consumer groups read it at their own pace, and recover stuck deliveries with `XAUTOCLAIM` after simulating a consumer crash.

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

1. The application calls `stream.Produce(eventType, payload)` which runs [`XADD`]({{< relref "/commands/xadd" >}}) with an approximate [`MAXLEN ~`]({{< relref "/commands/xadd" >}}) cap. Redis assigns an auto-generated time-ordered ID.
2. Each consumer thread polls [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` (meaning "deliver entries this group has not yet delivered to anyone") on a short interval.
3. After processing each entry, the consumer calls [`XACK`]({{< relref "/commands/xack" >}}) so Redis can drop it from the group's pending list.
4. If a consumer is killed (or crashes) before acking, its entries sit in the group's PEL. A periodic [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) sweep reassigns idle entries to a healthy consumer.
5. Anyone — including code outside the consumer groups — can read history with [`XRANGE`]({{< relref "/commands/xrange" >}}) without affecting any group's cursor.

Each consumer group has its own cursor (`last-delivered-id`) and its own pending list, so the two groups in this demo process the same events without coordinating with each other.

## The event-stream helper

The `EventStream` class wraps the stream operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/dotnet/EventStream.cs)):

```csharp
using StackExchange.Redis;
using StreamingDemo;

var redis = ConnectionMultiplexer.Connect("localhost:6379");
var stream = new EventStream(
    redis.GetDatabase(),
    streamKey: "demo:events:orders",
    maxlenApprox: 2000,        // retention guardrail
    claimMinIdleMs: 5000);     // XAUTOCLAIM threshold

// Producer
var streamId = stream.Produce(
    "order.placed",
    new Dictionary<string, string?>
    {
        ["order_id"] = "o-1234",
        ["customer"] = "alice",
        ["amount"] = "49.50",
    });

// Consumer group + one consumer
stream.EnsureGroup("notifications", startId: "0-0");
var entries = stream.Consume("notifications", "worker-a", count: 10);
foreach (var entry in entries)
{
    Handle(entry.Fields);                              // your processing
    stream.Ack("notifications", new[] { entry.Id });   // XACK
}

// Recover stuck PEL entries by reaping them into a healthy consumer.
// The textbook pattern: each consumer periodically calls XAUTOCLAIM
// with itself as the target and processes whatever it claimed.
// ConsumerWorker.ReapIdlePel wraps that flow; the low-level helper
// stream.Autoclaim(group, targetName) is also available if you want
// to drive XAUTOCLAIM directly.
var result = workerB.ReapIdlePel();
// result == new ReapResult(Claimed: N, DeletedIds: [...], Processed: M)
// DeletedIds are PEL entries whose payload was already trimmed.
// Redis 7+ has already removed those slots from the PEL, so no XACK
// is needed — log them and route to a dead-letter store for audit.

// Replay history (independent of any group's cursor)
foreach (var entry in stream.Replay("-", "+", count: 50))
{
    Console.WriteLine($"{entry.Id} {string.Join(",", entry.Fields)}");
}
```

### Data model

Each event is a single stream entry — a flat dictionary of field/value strings — with an auto-generated time-ordered ID:

```text
demo:events:orders
  1716998413541-0   type=order.placed     order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-0   type=order.paid       order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-1   type=order.shipped    order_id=o-1235   customer=bob    amount=12.00  ts_ms=...
  ...
```

The ID is `{milliseconds}-{sequence}`, monotonically increasing within the stream, so you can range-query by approximate wall-clock time without an extra index. (IDs are ordered within a stream, not across streams — two events appended to different streams at the same millisecond can produce the same ID.) The implementation uses:

* [`XADD ... MAXLEN ~ n`]({{< relref "/commands/xadd" >}}), pipelined through `IBatch`, for batch production with a retention cap
* [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` for fresh deliveries to a consumer
* [`XACK`]({{< relref "/commands/xack" >}}) on every processed entry
* [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) for sweeping idle pending entries to a healthy consumer
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit
* [`XPENDING`]({{< relref "/commands/xpending" >}}) for inspecting the per-group pending list
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for surface-level observability
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement

## Producing events

`ProduceBatch` pipelines `XADD` calls in a single round trip through `IDatabase.CreateBatch()`. Each call carries an approximate `MAXLEN ~` cap so the stream stays bounded as it rolls forward:

```csharp
public string[] ProduceBatch(IEnumerable<(string EventType, IDictionary<string, string?> Payload)> events)
{
    var eventList = events.ToList();
    var batch = _db.CreateBatch();
    var addTasks = new Task<RedisValue>[eventList.Count];
    for (var i = 0; i < eventList.Count; i++)
    {
        var (eventType, payload) = eventList[i];
        var pairs = EncodeFields(eventType, payload);
        addTasks[i] = batch.StreamAddAsync(
            _streamKey,
            pairs,
            messageId: null,
            maxLength: _maxlenApprox,
            useApproximateMaxLength: true);
    }
    batch.Execute();
    Task.WaitAll(addTasks);

    var ids = addTasks.Select(t => (string)t.Result!).ToArray();
    Interlocked.Add(ref _producedTotal, ids.Length);
    return ids;
}
```

The `~` flavour of `MAXLEN` lets Redis trim at a macro-node boundary, which is much cheaper than exact trimming and is what you want when the cap is a retention *guardrail*, not a hard size constraint. With 300 events produced and `MAXLEN ~ 50`, you might end up with 100 entries left — Redis released the oldest whole macro-node and stopped. The next `XADD` will keep length stable.

If you genuinely need an exact cap (rare), pass `useApproximateMaxLength: false`. The performance difference is significant on busy streams.

## Reading with a consumer group

Each consumer in a group runs the same `XREADGROUP` poll. The special ID `>` means "deliver entries this group has not yet delivered to *anyone*":

```csharp
public List<StreamRecord> Consume(string group, string consumer, int count = 10)
{
    var entries = _db.StreamReadGroup(
        _streamKey,
        group,
        consumer,
        position: ">",
        count: count);
    return ToRecords(entries);
}
```

StackExchange.Redis intentionally does not expose a blocking `XREADGROUP` (the long-blocking variant would monopolise the multiplexer's single command pipeline). The consumer thread polls on a short fixed interval (100 ms in the demo) so the call returns promptly when there is nothing waiting and Redis hands out the next batch as soon as producers append more entries. A production helper would naturally be `async` (`StreamReadGroupAsync` with `await Task.Delay`), which gives the same effect without parking a thread.

Reading with an explicit ID like `0-0` instead of `>` does something different — it replays entries already delivered to *this* consumer name (its private PEL). That is the canonical recovery path when the same consumer restarts: catch up on its own pending entries first, then resume reading new ones.

## Acknowledging entries

Once the consumer has processed an entry, `XACK` tells Redis it can drop the entry from the group's pending list:

```csharp
public long Ack(string group, IEnumerable<string> ids)
{
    var idArray = ids.Select(id => (RedisValue)id).ToArray();
    if (idArray.Length == 0) return 0;
    var n = _db.StreamAcknowledge(_streamKey, group, idArray);
    Interlocked.Add(ref _ackedTotal, n);
    return n;
}
```

This is the linchpin of at-least-once delivery: an entry that is never acked stays in the PEL until a claim moves it elsewhere. If your consumer thread crashes between processing and ack, the next claim sweep picks the entry back up. The one caveat is retention: `XADD MAXLEN ~` and `XTRIM` can release the entry's *payload* even while its ID is still in the PEL. The next `XAUTOCLAIM` returns those IDs in its `DeletedIds` list and removes them from the PEL inside the same command — the entry cannot be retried, so the caller should log it and route to a dead-letter store for audit. The example handles this explicitly in `/autoclaim` further down.

The trade-off is the opposite of pub/sub: a slow or crashed consumer doesn't lose messages, but it does mean your downstream system must be idempotent. If you process an order twice because the first attempt died after the side effect but before the ack, the second attempt must be safe.

## Multiple consumer groups, one stream

The big difference between Redis Streams and a job queue is that any number of independent consumer groups can read the same stream. The demo sets up two groups on `demo:events:orders`:

```csharp
stream.EnsureGroup("notifications", startId: "0-0");
stream.EnsureGroup("analytics",     startId: "0-0");
```

Each group has its own cursor. Producing 5 events results in `notifications` and `analytics` each receiving all 5, with no coordination between them. Within `notifications`, the work is split across `worker-a` and `worker-b`: Redis hands each `XREADGROUP` call whatever entries are not yet delivered to anyone in the group, so adding a second worker doubles throughput without any rebalance logic.

The `startId: "0-0"` argument means "deliver everything in the stream from the beginning" — useful in a demo and for fresh groups bootstrapping from history. In production, a brand-new group reading a long-existing stream usually starts at `$` ("only events after this point") and uses [`XRANGE`]({{< relref "/commands/xrange" >}}) explicitly if it needs history.

## Recovering crashed consumers with XAUTOCLAIM

The demo's "Crash next 3" button tells a chosen consumer to drop its next three deliveries on the floor without acking them — the same effect as a worker process dying mid-message. Those entries stay in the group's PEL with their delivery counter incremented. Once they have been idle for at least `claimMinIdleMs`, any healthy consumer in the group can rescue them by calling `XAUTOCLAIM` *with itself as the target*. `ConsumerWorker.ReapIdlePel` wraps that pattern:

```csharp
public ReapResult ReapIdlePel()
{
    var swept = _stream.Autoclaim(Group, Name, pageCount: 100, maxPages: 10);
    var processed = 0;
    foreach (var record in swept.Claimed)
    {
        try
        {
            HandleEntry(record.Id, record.Fields);
            processed++;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[{Group}/{Name}] reap failed on {record.Id}: {ex.Message}");
        }
    }
    lock (_lock) { _reaped += processed; }
    return new ReapResult(swept.Claimed.Count, swept.DeletedIds, processed);
}
```

The underlying `stream.Autoclaim` helper pages through the group's PEL with `XAUTOCLAIM`'s continuation cursor, using StackExchange.Redis 2.7+'s typed `StreamAutoClaim` wrapper:

```csharp
public AutoClaimResult Autoclaim(
    string group,
    string consumer,
    int pageCount = 100,
    string startId = "0-0",
    int maxPages = 10)
{
    var claimedAll = new List<StreamRecord>();
    var deletedAll = new List<string>();
    var cursor = startId;
    for (var i = 0; i < maxPages; i++)
    {
        var result = _db.StreamAutoClaim(
            _streamKey,
            group,
            consumer,
            minIdleTimeInMs: _claimMinIdleMs,
            startAtId: cursor,
            count: pageCount);
        if (result.IsNull) break;
        foreach (var entry in result.ClaimedEntries)
            claimedAll.Add(EntryToRecord(entry));
        foreach (var id in result.DeletedIds ?? Array.Empty<RedisValue>())
            deletedAll.Add((string)id!);
        var nextId = (string)result.NextStartId!;
        if (nextId == "0-0") break;
        cursor = nextId;
    }
    Interlocked.Add(ref _claimedTotal, claimedAll.Count);
    return new AutoClaimResult(claimedAll, deletedAll);
}
```

A single `XAUTOCLAIM` call scans up to `pageCount` PEL entries starting at `startId`, reassigns the ones idle for at least `minIdleTimeInMs` to the named consumer, and returns a continuation cursor on `StreamAutoClaimResult.NextStartId`. For a full sweep, loop until the cursor returns to `0-0` (with a `maxPages` safety net so one call cannot monopolise a very large PEL). The delivery counter is incremented on every claim — after a few cycles you can use it to spot a *poison-pill* message that crashes every consumer that touches it, and route it to a dead-letter stream so the bad entry stops cycling. (New entries keep flowing past the poison pill — `XREADGROUP >` still delivers fresh work — but the bad entry's repeated reclaim wastes consumer time and keeps the PEL larger than it needs to be.)

The `StreamAutoClaimResult.DeletedIds` list contains PEL entry IDs whose stream payload was already trimmed by the time the claim ran (typically because `MAXLEN ~` retention outran a slow consumer). `XAUTOCLAIM` removes those dangling slots from the PEL itself, so the caller does *not* need to `XACK` them — but the entries cannot be retried either, so log and route them to a dead-letter store for offline inspection. Redis 7.0 introduced this third return element; the example requires Redis 7.0+ for that reason.

`ReapIdlePel` is the right primitive for the recovery path because it claims and processes in one step: every entry the call returned is now in *this* consumer's PEL, so the same consumer is responsible for processing and acking it. In production each consumer thread runs `ReapIdlePel` periodically (every few seconds, on a timer) so a crashed peer's entries never sit invisibly. The demo exposes it as a manual button so you can trigger the reap after waiting for the idle threshold.

`XCLAIM` (singular, no auto) does the same thing for a specific list of entry IDs you already have in hand — useful when you want to take ownership of one known stuck entry, or when you need to move a specific consumer's PEL to a peer (the case the demo's "Remove consumer" button handles via `HandoverPending`). `XAUTOCLAIM` cannot filter by source consumer, so it cannot be used for a per-consumer handover.

## Replay with XRANGE

`XRANGE` reads a slice of history. It is completely independent of any consumer group — no cursors move, no acks happen — so it is safe to call any number of times, from any process:

```csharp
public List<StreamRecord> Replay(string startId = "-", string endId = "+", int count = 100)
{
    var entries = _db.StreamRange(
        _streamKey,
        minId: startId,
        maxId: endId,
        count: count);
    return entries.Select(EntryToRecord).ToList();
}
```

The special IDs `-` and `+` mean "from the very beginning" and "to the very end". You can also pass real IDs (`1716998413541-0`) or just the millisecond part (`1716998413541`, which Redis interprets as "any entry with this timestamp").

Typical uses:

* **Bootstrapping a new projection** — read the entire stream from `-` and build a derived view in another store (a search index, a SQL table, a different cache). Doing this against a consumer group would consume the entries; `XRANGE` lets you do it without disrupting live consumers.
* **Auditing recent activity** — read the last few minutes by ID range without touching any group cursor.
* **Debugging** — fetch one specific entry by its ID, or a tight range around an incident timestamp, to see exactly what producers wrote.

## The consumer worker thread

`ConsumerWorker` wraps the `XREADGROUP` → process → `XACK` loop in a background thread
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/dotnet/ConsumerWorker.cs)):

```csharp
private void Run()
{
    while (!_stop)
    {
        bool paused;
        lock (_lock) { paused = _paused; }
        if (paused) { Thread.Sleep(50); continue; }

        List<StreamRecord> entries;
        try
        {
            entries = _stream.Consume(Group, Name, count: 10);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[{Group}/{Name}] read failed: {ex.Message}");
            Thread.Sleep(500);
            continue;
        }

        if (entries.Count == 0)
        {
            Thread.Sleep(_pollIntervalMs);
            continue;
        }

        foreach (var entry in entries)
        {
            Dispatch(entry.Id, entry.Fields);
        }
    }
}
```

`HandleEntry` either acks (the normal path) or, when the demo has asked the worker to "crash", drops the entry on the floor and increments a counter so the UI can show what is currently in the PEL waiting to be claimed.

Recovery of stuck PEL entries — this consumer's, after a restart, or another consumer's, after a crash — runs through a separate `ReapIdlePel` method rather than the read loop. That method calls `XAUTOCLAIM` with this consumer as the target, then processes whatever was claimed in the same flow as new entries. This is the textbook Streams pattern: each consumer is its own reaper, running `XAUTOCLAIM(self)` periodically (or on demand) so a crashed peer's entries never sit invisibly in the PEL. The demo's "XAUTOCLAIM to selected" button calls `ReapIdlePel` on the chosen consumer; in production you would run it from a timer every few seconds.

Note that the worker's main read loop deliberately does *not* call `XREADGROUP 0` to drain its own PEL on every iteration. That would re-deliver every pending entry continuously and *reset its idle counter to zero* each time, which would keep crashed entries below the `XAUTOCLAIM` threshold forever. Using `XAUTOCLAIM(self)` as the recovery primitive — which only fires for entries idle longer than `minIdleTime` — avoids that whole class of bug.

The pause and crash levers exist only for the demo. A real consumer is just the read-process-ack loop — everything else in this class is instrumentation.

## Prerequisites

* Redis 7.0 or later. `XAUTOCLAIM` was added in Redis 6.2, but its reply gained a third
  element (the list of deleted IDs) in 7.0; the example relies on that shape.
* .NET 8 SDK or later.
* The `StackExchange.Redis` NuGet package at version 2.7 or later (already declared in `StreamingDemo.csproj`).

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of four files. Download them from the [`dotnet` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/streaming/dotnet) on GitHub, or grab them with `curl`:

```bash
mkdir streaming-demo && cd streaming-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/streaming/dotnet
curl -O $BASE/EventStream.cs
curl -O $BASE/ConsumerWorker.cs
curl -O $BASE/Program.cs
curl -O $BASE/StreamingDemo.csproj
```

### Start the demo server

From that directory:

```bash
dotnet run
```

You should see:

```text
Deleting any existing data at key 'demo:events:orders' for a clean demo run (pass --no-reset to keep it).
Redis streaming demo server listening on http://localhost:8785
Using Redis at localhost:6379 with stream key 'demo:events:orders' (MAXLEN ~ 2000)
Seeded 3 consumer(s) across 2 group(s)
```

By default the demo wipes the configured stream key on startup so each run starts from a clean state. Pass `--no-reset` to keep any existing data at the key (useful when re-running against the same stream to inspect prior state), or `--stream-key <name>` to point the demo at a different key entirely.

Open [http://localhost:8785](http://localhost:8785) in a browser. You can:

* **Produce** any number of events of a chosen type (or random types). Watch the stream length grow and the tail update.
* See each **consumer group**: its `last-delivered-id`, the size of its pending list, and the consumers in it. Each consumer shows its processed count, pending count, and idle time.
* **Add or remove** consumers within a group at runtime to see Redis split the work across the new shape.
* Click **Crash next 3** on a consumer to drop its next three deliveries — the same effect as a worker process dying after `XREADGROUP` but before `XACK`. Watch the **Pending entries (XPENDING)** panel fill up.
* Wait until the idle time exceeds the threshold (default 5000 ms), pick a healthy target consumer, and click **XAUTOCLAIM to selected** — the stuck entries are reassigned and the delivery counter increments.
* **Replay (XRANGE)** any range to confirm the full history is independent of consumer-group state.
* **XTRIM** with an approximate `MAXLEN` to bound retention. Note that an approximate trim only releases whole macro-nodes — `MAXLEN ~ 50` on a small stream may not delete anything; on a 300-entry stream it typically lands at around 100.
* Click **Reset demo** to drop the stream and re-seed the default groups.

## Production usage

### Use the async API on the request path

The demo helper is synchronous (`StreamAdd`, `StreamReadGroup`, `StreamAutoClaim`, `Thread.Sleep`) to keep the code compact. In production, prefer the `Async` overloads — `StreamAddAsync`, `StreamReadGroupAsync`, `StreamAutoClaimAsync`, `StreamAcknowledgeAsync` — together with `await Task.Delay` so request-handling threads return to the ThreadPool while the loader is in flight. The streaming structure is identical; just propagate `await`s through the call chain.

### ThreadPool sizing for synchronous consumers

`Program.cs` calls `ThreadPool.SetMinThreads(64, 64)` at startup. With multiple consumer groups each running a polling thread per consumer, the default ThreadPool can grow too slowly under load and starve the polling threads. Raising the floor up front is a property of *this synchronous demo*; an async helper (see above) avoids the issue entirely because the poll naturally yields the thread between iterations.

### Pick retention by length or by minimum ID

The demo uses `MAXLEN ~` on every `XADD`. Two alternatives are worth considering:

* `MINID ~ <id>` — keep only entries newer than an ID. If you want "the last 24 hours", compute the wall-clock cutoff and call `stream.TrimMinid("{ms}-0")`. This is the right pattern when retention is time-bounded.
* No cap on `XADD` plus a periodic `XTRIM` job — useful if your producer is hot and the per-`XADD` work has to stay minimal, or if retention rules are complex (a separate process can also factor in consumer-group lag).

In all three cases the trimming is approximate by default. Use exact trimming (`MAXLEN n` or `MINID id` without `~`) only when you genuinely need an exact count.

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

### StackExchange.Redis does not expose a blocking XREADGROUP

StackExchange.Redis intentionally omits the long-blocking variant of `XREADGROUP` (and `XREAD`) because a blocking command would monopolise the multiplexer's single command pipeline — every other call on the same connection would queue behind it. The idiomatic workaround for this demo is a short polling interval on the synchronous wrapper; the idiomatic production pattern is `StreamReadGroupAsync` with `await Task.Delay`, which yields the thread between iterations without ever holding the multiplexer.

### Don't read with XREAD (no group) and then try to ack

`XREAD` and `XREADGROUP` are different mechanisms. `XREAD` is a tail-the-log read with no consumer-group state — entries are not added to any PEL, and you cannot `XACK` them. If you want at-least-once delivery and crash recovery, you must read through a consumer group.

`XREAD` is still useful for read-only tail clients (a UI streaming events, a debugger, a `tail -f`-style command-line tool). It's just not part of the at-least-once path.

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
* [`XCLAIM`]({{< relref "/commands/xclaim" >}}) to take ownership of a specific list of pending entry IDs by hand (used by `HandoverPending` to move a leaving consumer's PEL to a peer, since `XAUTOCLAIM` has no source-consumer filter).
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit, independent of consumer-group state.
* [`XPENDING`]({{< relref "/commands/xpending" >}}) to inspect the per-group pending list with idle times and delivery counts.
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement.
* [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}) and
  [`XGROUP DELCONSUMER`]({{< relref "/commands/xgroup-delconsumer" >}}) to manage groups and consumers.
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for observability.

See the [StackExchange.Redis docs](https://stackexchange.github.io/StackExchange.Redis/) for the full client reference, and the [Streams overview]({{< relref "/develop/data-types/streams" >}}) for the deeper conceptual model — consumer groups, the PEL, claim semantics, capped streams, and the differences with Kafka partitions.
