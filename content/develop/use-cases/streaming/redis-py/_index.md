---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis event-streaming pipeline in Python with redis-py
linkTitle: redis-py example (Python)
title: Redis streaming with redis-py
weight: 1
---

This guide shows you how to build a Redis-backed event-streaming pipeline in Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It includes a small local web server built with the Python standard library so you can produce events into a single Redis Stream, watch two independent consumer groups read it at their own pace, and recover stuck deliveries with `XAUTOCLAIM` after simulating a consumer crash.

## Overview

A Redis Stream is an append-only log of field/value entries with auto-generated, time-ordered IDs. Producers append with [`XADD`]({{< relref "/commands/xadd" >}}); consumers belong to *consumer groups* and read with [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}), which gives each consumer a private cursor and a pending-entries list (PEL) of in-flight messages. Once a consumer has processed an entry it acknowledges it with [`XACK`]({{< relref "/commands/xack" >}}); entries left unacknowledged past an idle threshold can be reassigned to a healthy consumer with [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}).

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

1. The application calls `stream.produce(event_type, payload)` which runs [`XADD`]({{< relref "/commands/xadd" >}}) with an approximate [`MAXLEN ~`]({{< relref "/commands/xadd" >}}) cap. Redis assigns an auto-generated time-ordered ID.
2. Each consumer thread loops on [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` (meaning "deliver entries this group has not yet delivered to anyone") and a short block timeout.
3. After processing each entry, the consumer calls [`XACK`]({{< relref "/commands/xack" >}}) so Redis can drop it from the group's pending list.
4. If a consumer is killed (or crashes) before acking, its entries sit in the group's PEL. A periodic [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) sweep reassigns idle entries to a healthy consumer.
5. Anyone — including code outside the consumer groups — can read history with [`XRANGE`]({{< relref "/commands/xrange" >}}) without affecting any group's cursor.

Each consumer group has its own cursor (`last-delivered-id`) and its own pending list, so the two groups in this demo process the same events without coordinating with each other.

## The event-stream helper

The `RedisEventStream` class wraps the stream operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/redis-py/event_stream.py)):

```python
import redis
from event_stream import RedisEventStream

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
stream = RedisEventStream(
    redis_client=r,
    stream_key="demo:events:orders",
    maxlen_approx=2000,        # retention guardrail
    claim_min_idle_ms=5000,    # XAUTOCLAIM threshold
)

# Producer
stream_id = stream.produce(
    "order.placed",
    {"order_id": "o-1234", "customer": "alice", "amount": "49.50"},
)

# Consumer group + one consumer
stream.ensure_group("notifications", start_id="0-0")
entries = stream.consume("notifications", "worker-a", count=10, block_ms=500)
for entry_id, fields in entries:
    handle(fields)                              # your processing
    stream.ack("notifications", [entry_id])     # XACK

# Recover entries from a crashed consumer (idle ≥ claim_min_idle_ms)
stream.autoclaim("notifications", "worker-b", count=100)

# Replay history (independent of any group's cursor)
for entry_id, fields in stream.replay("-", "+", count=50):
    print(entry_id, fields)
```

### Data model

Each event is a single stream entry — a flat dict of field/value strings — with an auto-generated time-ordered ID:

```text
demo:events:orders
  1716998413541-0   type=order.placed     order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-0   type=order.paid       order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-1   type=order.shipped    order_id=o-1235   customer=bob    amount=12.00  ts_ms=...
  ...
```

The ID is `{milliseconds}-{sequence}`, so IDs are globally ordered and you can range-query by approximate wall-clock time without any extra index. The implementation uses:

* [`XADD ... MAXLEN ~ n`]({{< relref "/commands/xadd" >}}), pipelined, for batch production with a retention cap
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

`produce_batch` pipelines `XADD` calls in a single round trip. Each call carries an approximate `MAXLEN ~` cap so the stream stays bounded as it rolls forward:

```python
def produce_batch(self, events: Iterable[tuple[str, dict]]) -> list[str]:
    pipe = self.redis.pipeline(transaction=False)
    for event_type, payload in events:
        fields = self._encode_fields(event_type, payload)
        pipe.xadd(
            self.stream_key,
            fields,
            maxlen=self.maxlen_approx,
            approximate=True,
        )
    ids = pipe.execute()
    ...
    return list(ids)
```

The `~` flavour of `MAXLEN` lets Redis trim at a macro-node boundary, which is much cheaper than exact trimming and is what you want when the cap is a retention *guardrail*, not a hard size constraint. With 300 events produced and `MAXLEN ~ 50`, you might end up with 100 entries left — Redis released the oldest whole macro-node and stopped. The next `XADD` will keep length stable.

If you genuinely need an exact cap (rare), drop `approximate=True`. The performance difference is significant on busy streams.

## Reading with a consumer group

Each consumer in a group runs the same `XREADGROUP` loop. The special ID `>` means "deliver entries this group has not yet delivered to *anyone*":

```python
def consume(
    self,
    group: str,
    consumer: str,
    count: int = 10,
    block_ms: int = 500,
) -> list[Entry]:
    result = self.redis.xreadgroup(
        group,
        consumer,
        {self.stream_key: ">"},
        count=count,
        block=block_ms,
    )
    return _flatten_entries(result)
```

`block_ms` makes the call efficient even when the stream is idle: the client parks on the server until either an entry arrives or the timeout expires, so consumers don't busy-loop.

Reading with an explicit ID like `0-0` instead of `>` does something different — it replays entries already delivered to *this* consumer name (its private PEL). That is the canonical recovery path when the same consumer restarts: catch up on its own pending entries first, then resume reading new ones.

## Acknowledging entries

Once the consumer has processed an entry, `XACK` tells Redis it can drop the entry from the group's pending list:

```python
def ack(self, group: str, ids: Iterable[str]) -> int:
    ids = list(ids)
    if not ids:
        return 0
    return int(self.redis.xack(self.stream_key, group, *ids))
```

This is the linchpin of at-least-once delivery: an entry that is never acked stays in the PEL forever (until a claim moves it elsewhere). If your consumer thread crashes between processing and ack, the entry is *retained*, not lost — the next claim sweep picks it up.

The trade-off is the opposite of pub/sub: a slow or crashed consumer doesn't lose messages, but it does mean your downstream system must be idempotent. If you process an order twice because the first attempt died after the side effect but before the ack, the second attempt must be safe.

## Multiple consumer groups, one stream

The big difference between Redis Streams and a job queue is that any number of independent consumer groups can read the same stream. The demo sets up two groups on `demo:events:orders`:

```python
stream.ensure_group("notifications", start_id="0-0")
stream.ensure_group("analytics",     start_id="0-0")
```

Each group has its own cursor. Producing 5 events results in `notifications` and `analytics` each receiving all 5, with no coordination between them. Within `notifications`, the work is split across `worker-a` and `worker-b`: Redis hands each `XREADGROUP` call whatever entries are not yet delivered to anyone in the group, so adding a second worker doubles throughput without any rebalance logic.

The `start_id="0-0"` argument means "deliver everything in the stream from the beginning" — useful in a demo and for fresh groups bootstrapping from history. In production, a brand-new group reading a long-existing stream usually starts at `$` ("only events after this point") and uses [`XRANGE`]({{< relref "/commands/xrange" >}}) explicitly if it needs history.

## Recovering crashed consumers with XAUTOCLAIM

The demo's "Crash next 3" button tells a chosen consumer to drop its next three deliveries on the floor without acking them — the same effect as a worker process dying mid-message. Those entries stay in the group's PEL with their delivery counter incremented. Once they have been idle for at least `claim_min_idle_ms`, the recovery sweep picks them up:

```python
def autoclaim(
    self,
    group: str,
    consumer: str,
    count: int = 100,
    start_id: str = "0-0",
) -> list[Entry]:
    _next_id, claimed, _deleted = self.redis.xautoclaim(
        self.stream_key,
        group,
        consumer,
        min_idle_time=self.claim_min_idle_ms,
        start_id=start_id,
        count=count,
    )
    return list(claimed)
```

`XAUTOCLAIM` walks the group's PEL, finds every entry idle longer than `min_idle_time`, reassigns it to the named consumer, and returns the reassigned entries. The delivery counter is incremented on every claim — after a few cycles you can use it to detect a *poison-pill* message that crashes every consumer that touches it, and route it to a dead-letter stream instead of looping forever.

In production this loop runs periodically (every few seconds) on every healthy consumer, or on a dedicated reaper. The demo exposes it as a button so you can trigger it manually after waiting for the idle threshold.

`XCLAIM` (singular, no auto) does the same thing for a specific list of entry IDs you already have in hand — useful when you want to take ownership of one known stuck entry rather than sweep the whole PEL.

## Replay with XRANGE

`XRANGE` reads a slice of history. It is completely independent of any consumer group — no cursors move, no acks happen — so it is safe to call any number of times, from any process:

```python
def replay(
    self,
    start_id: str = "-",
    end_id: str = "+",
    count: int = 100,
) -> list[Entry]:
    return list(self.redis.xrange(
        self.stream_key, min=start_id, max=end_id, count=count,
    ))
```

The special IDs `-` and `+` mean "from the very beginning" and "to the very end". You can also pass real IDs (`1716998413541-0`) or just the millisecond part (`1716998413541`, which Redis interprets as "any entry with this timestamp").

Typical uses:

* **Bootstrapping a new projection** — read the entire stream from `-` and build a derived view in another store (a search index, a SQL table, a different cache). Doing this against a consumer group would consume the entries; `XRANGE` lets you do it without disrupting live consumers.
* **Auditing recent activity** — read the last few minutes by ID range without touching any group cursor.
* **Debugging** — fetch one specific entry by its ID, or a tight range around an incident timestamp, to see exactly what producers wrote.

## The consumer worker thread

`ConsumerWorker` wraps the `XREADGROUP` → process → `XACK` loop in a daemon thread
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/redis-py/consumer_worker.py)):

```python
def _run(self) -> None:
    while not self._stop_event.is_set():
        if self._paused.is_set():
            time.sleep(0.05)
            continue
        try:
            entries = self.stream.consume(
                self.group, self.name, count=10, block_ms=500,
            )
        except Exception as exc:
            print(f"[{self.group}/{self.name}] read failed: {exc}")
            time.sleep(0.5)
            continue

        for entry_id, fields in entries:
            if self.process_latency_ms:
                time.sleep(self.process_latency_ms / 1000.0)
            self._handle_entry(entry_id, fields)
```

`_handle_entry` either acks (the normal path) or, when the demo has asked the worker to "crash", drops the entry on the floor and increments a counter so the UI can show what is currently in the PEL waiting to be claimed.

The pause and crash levers exist only for the demo. A real consumer is just the read-process-ack loop — everything else in this class is instrumentation.

## Prerequisites

* Redis 6.2 or later (Redis 7.0+ recommended for `XAUTOCLAIM`).
* Python 3.9 or later.
* The `redis-py` client. Install it with:

  ```bash
  pip install "redis>=5.0"
  ```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of three Python files. Download them from the [`redis-py` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/streaming/redis-py) on GitHub, or grab them with `curl`:

```bash
mkdir streaming-demo && cd streaming-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/streaming/redis-py
curl -O $BASE/event_stream.py
curl -O $BASE/consumer_worker.py
curl -O $BASE/demo_server.py
```

### Start the demo server

From that directory:

```bash
python3 demo_server.py
```

You should see:

```text
Redis streaming demo server listening on http://127.0.0.1:8083
Using Redis at localhost:6379 with stream key 'demo:events:orders' (MAXLEN ~ 2000)
Seeded 3 consumer(s) across 2 group(s)
```

Open [http://127.0.0.1:8083](http://127.0.0.1:8083) in a browser. You can:

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

* `MINID ~ <id>` — keep only entries newer than an ID. If you want "the last 24 hours", compute the wall-clock cutoff and pass `XTRIM MINID ~ <ms>-0`. This is the right pattern when retention is time-bounded.
* No cap on `XADD` plus a periodic `XTRIM` job — useful if your producer is hot and the per-`XADD` work has to stay minimal, or if retention rules are complex (a separate process can also factor in consumer-group lag).

In all three cases the trimming is approximate by default. Use exact trimming (`MAXLEN n` or `MINID id` without `~`) only when you genuinely need an exact count.

### Don't let consumer-group lag silently grow

`XINFO GROUPS` reports each group's `lag` (entries the group has not yet read) and `pending` (entries delivered but not acked). In production, alert on either of these crossing a threshold — a steadily growing pending count usually means consumers are crashing without `XAUTOCLAIM` running, and a growing lag means consumers can't keep up with producers.

The same applies inside a group: `XINFO CONSUMERS` reports per-consumer pending counts and idle times, so you can spot one slow consumer holding entries that the rest of the group is waiting on.

### Make consumer logic idempotent

`XAUTOCLAIM` can re-deliver an entry to a different consumer after a crash. If your processing has side effects (sending email, charging a card, updating a downstream store), make sure the same entry processed twice gives the same result — use an idempotency key, an upsert with conditional check, or a once-per-id guard table. Redis Streams cannot give you exactly-once semantics on its own.

### Bound the delivery counter as a poison-pill signal

`XPENDING` returns each entry's delivery count, incremented on every claim. If an entry has been delivered (and dropped) several times, the next consumer is unlikely to fare better. After some threshold — `deliveries >= 5`, say — route the entry to a *dead-letter stream*, ack it on the original group, and alert. Without this, one bad entry can stop the group's forward progress indefinitely.

### Partition by tenant or entity for scale

A single Redis Stream is a single key, and on a Redis Cluster a single key lives on a single shard. If your throughput exceeds what one shard can handle, partition the stream — for example by tenant ID (`events:orders:{tenant_a}`, `events:orders:{tenant_b}`) — so different tenants land on different shards. Hash-tags (`{tenant_a}`) keep all related streams on the same shard if you need to multi-stream atomically.

Per-entity partitioning (`events:order:{order_id}`) is the canonical pattern when you treat each entity's stream as the event-sourcing log for that entity: every state change for one order goes on its own stream, which is also bounded in size by the entity's lifetime.

### Use a separate consumer pool per group

The demo runs every consumer in one process. In production each consumer group is usually its own deployment — its own pool of pods or VMs — so a slow projection in `analytics` cannot pull `notifications` workers off their stream. Each pod runs one consumer thread per CPU core, with `XAUTOCLAIM` either embedded in the consumer loop (every N reads, claim idle entries to self) or run by a separate reaper.

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
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit, independent of consumer-group state.
* [`XPENDING`]({{< relref "/commands/xpending" >}}) to inspect the per-group pending list with idle times and delivery counts.
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement.
* [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}) and
  [`XGROUP DELCONSUMER`]({{< relref "/commands/xgroup-delconsumer" >}}) to manage groups and consumers.
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for observability.

See the [`redis-py` documentation]({{< relref "/develop/clients/redis-py" >}}) for the full client reference, and the [Streams overview]({{< relref "/develop/data-types/streams" >}}) for the deeper conceptual model — consumer groups, the PEL, claim semantics, capped streams, and the differences with Kafka partitions.
