---
aliases:
- /develop/use-cases/streaming/redis-rb
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis event-streaming pipeline in Ruby with redis-rb
linkTitle: redis-rb example (Ruby)
title: Redis streaming with redis-rb
weight: 8
---

This guide shows you how to build a Redis-backed event-streaming pipeline in Ruby with the [`redis-rb`]({{< relref "/develop/clients/ruby" >}}) gem. It includes a small local web server built on Ruby's standard `webrick` library so you can produce events into a single Redis Stream, watch two independent consumer groups read it at their own pace, and recover stuck deliveries with `XAUTOCLAIM` after simulating a consumer crash.

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

1. The application calls `stream.produce(event_type, payload)` which runs [`XADD`]({{< relref "/commands/xadd" >}}) with an approximate [`MAXLEN ~`]({{< relref "/commands/xadd" >}}) cap. Redis assigns an auto-generated time-ordered ID.
2. Each consumer thread loops on [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` (meaning "deliver entries this group has not yet delivered to anyone") and a short block timeout.
3. After processing each entry, the consumer calls [`XACK`]({{< relref "/commands/xack" >}}) so Redis can drop it from the group's pending list.
4. If a consumer is killed (or crashes) before acking, its entries sit in the group's PEL. A periodic [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) sweep reassigns idle entries to a healthy consumer.
5. Anyone — including code outside the consumer groups — can read history with [`XRANGE`]({{< relref "/commands/xrange" >}}) without affecting any group's cursor.

Each consumer group has its own cursor (`last-delivered-id`) and its own pending list, so the two groups in this demo process the same events without coordinating with each other.

## The event-stream helper

The `RedisEventStream` class wraps the stream operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/ruby/event_stream.rb)):

```ruby
require 'redis'
require_relative 'event_stream'

redis = Redis.new(host: 'localhost', port: 6379)
stream = RedisEventStream.new(
  redis: redis,
  stream_key: 'demo:events:orders',
  maxlen_approx: 2000,        # retention guardrail
  claim_min_idle_ms: 5000,    # XAUTOCLAIM threshold
)

# Producer
stream_id = stream.produce(
  'order.placed',
  { 'order_id' => 'o-1234', 'customer' => 'alice', 'amount' => '49.50' },
)

# Consumer group + one consumer
stream.ensure_group('notifications', '0-0')
entries = stream.consume('notifications', 'worker-a', count: 10, block_ms: 500)
entries.each do |entry_id, fields|
  handle(fields)                                # your processing
  stream.ack('notifications', [entry_id])       # XACK
end

# Recover stuck PEL entries by reaping them into a healthy consumer.
# The textbook pattern: each consumer periodically calls XAUTOCLAIM
# with itself as the target and processes whatever it claimed.
# `ConsumerWorker#reap_idle_pel` wraps that flow; the low-level helper
# `stream.autoclaim(group, target_name)` is also available if you
# want to drive XAUTOCLAIM directly.
result = worker_b.reap_idle_pel
# result == { claimed: N, processed: M, deleted_ids: [...] }
# deleted_ids are PEL entries whose payload was already trimmed.
# Redis 7+ has already removed those slots from the PEL, so no XACK
# is needed -- log them and route to a dead-letter store for audit.

# Replay history (independent of any group's cursor)
stream.replay(start_id: '-', end_id: '+', count: 50).each do |entry_id, fields|
  puts "#{entry_id} #{fields.inspect}"
end
```

### Data model

Each event is a single stream entry — a flat hash of field/value strings — with an auto-generated time-ordered ID:

```text
demo:events:orders
  1716998413541-0   type=order.placed     order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-0   type=order.paid       order_id=o-1234   customer=alice  amount=49.50  ts_ms=...
  1716998413542-1   type=order.shipped    order_id=o-1235   customer=bob    amount=12.00  ts_ms=...
  ...
```

The ID is `{milliseconds}-{sequence}`, monotonically increasing within the stream, so you can range-query by approximate wall-clock time without an extra index. (IDs are ordered within a stream, not across streams — two events appended to different streams at the same millisecond can produce the same ID.) The implementation uses:

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

```ruby
def produce_batch(events)
  events = events.to_a
  return [] if events.empty?
  ids = @redis.pipelined do |pipe|
    events.each do |event_type, payload|
      fields = encode_fields(event_type, payload)
      pipe.xadd(@stream_key, fields,
                maxlen: @maxlen_approx, approximate: true)
    end
  end
  @stats_lock.synchronize { @produced_total += ids.length }
  ids
end
```

The `~` flavour of `MAXLEN` lets Redis trim at a macro-node boundary, which is much cheaper than exact trimming and is what you want when the cap is a retention *guardrail*, not a hard size constraint. With 300 events produced and `MAXLEN ~ 50`, you might end up with 100 entries left — Redis released the oldest whole macro-node and stopped. The next `XADD` will keep length stable.

If you genuinely need an exact cap (rare), drop `approximate: true`. The performance difference is significant on busy streams.

## Reading with a consumer group

Each consumer in a group runs the same `XREADGROUP` loop. The special ID `>` means "deliver entries this group has not yet delivered to *anyone*":

```ruby
def consume(group, consumer, count: 10, block_ms: 500)
  result = @redis.xreadgroup(group, consumer, @stream_key, '>',
                             count: count, block: block_ms)
  flatten_entries(result)
end
```

`block_ms` makes the call efficient even when the stream is idle: the client parks on the server until either an entry arrives or the timeout expires, so consumers don't busy-loop.

Reading with an explicit ID like `0-0` instead of `>` does something different — it replays entries already delivered to *this* consumer name (its private PEL). That is the canonical recovery path when the same consumer restarts: catch up on its own pending entries first, then resume reading new ones.

A `redis-rb` `Redis` instance holds a single TCP connection and serialises every command through a monitor; a blocking `XREADGROUP BLOCK 500` parks that monitor for up to 500 ms, so every consumer must use its *own* `Redis` connection or its blocking read will park every other thread sharing the same client. The demo gives each `ConsumerWorker` a dedicated read connection and shares one connection across the HTTP handlers (which only issue non-blocking commands).

## Acknowledging entries

Once the consumer has processed an entry, `XACK` tells Redis it can drop the entry from the group's pending list:

```ruby
def ack(group, ids)
  ids = Array(ids)
  return 0 if ids.empty?
  n = @redis.xack(@stream_key, group, ids).to_i
  @stats_lock.synchronize { @acked_total += n }
  n
end
```

This is the linchpin of at-least-once delivery: an entry that is never acked stays in the PEL until a claim moves it elsewhere. If your consumer thread crashes between processing and ack, the next claim sweep picks the entry back up. The one caveat is retention: `XADD MAXLEN ~` and `XTRIM` can release the entry's *payload* even while its ID is still in the PEL. The next `XAUTOCLAIM` returns those IDs in its `deleted` list and removes them from the PEL inside the same command — the entry cannot be retried, so the caller should log it and route to a dead-letter store for audit. The example handles this explicitly in `reap_idle_pel` further down.

The trade-off is the opposite of pub/sub: a slow or crashed consumer doesn't lose messages, but it does mean your downstream system must be idempotent. If you process an order twice because the first attempt died after the side effect but before the ack, the second attempt must be safe.

## Multiple consumer groups, one stream

The big difference between Redis Streams and a job queue is that any number of independent consumer groups can read the same stream. The demo sets up two groups on `demo:events:orders`:

```ruby
stream.ensure_group('notifications', '0-0')
stream.ensure_group('analytics',     '0-0')
```

Each group has its own cursor. Producing 5 events results in `notifications` and `analytics` each receiving all 5, with no coordination between them. Within `notifications`, the work is split across `worker-a` and `worker-b`: Redis hands each `XREADGROUP` call whatever entries are not yet delivered to anyone in the group, so adding a second worker doubles throughput without any rebalance logic.

The `'0-0'` start ID means "deliver everything in the stream from the beginning" — useful in a demo and for fresh groups bootstrapping from history. In production, a brand-new group reading a long-existing stream usually starts at `'$'` ("only events after this point") and uses [`XRANGE`]({{< relref "/commands/xrange" >}}) explicitly if it needs history.

## Recovering crashed consumers with XAUTOCLAIM

The demo's "Crash next 3" button tells a chosen consumer to drop its next three deliveries on the floor without acking them — the same effect as a worker process dying mid-message. Those entries stay in the group's PEL with their delivery counter incremented. Once they have been idle for at least `claim_min_idle_ms`, any healthy consumer in the group can rescue them by calling `XAUTOCLAIM` *with itself as the target*. `ConsumerWorker#reap_idle_pel` wraps that pattern:

```ruby
def reap_idle_pel
  result = @shared_stream.autoclaim(@group, @name,
                                    page_count: 100, max_pages: 10)
  claimed = result[:claimed]
  deleted = result[:deleted_ids]
  processed = 0
  claimed.each do |entry_id, fields|
    begin
      handle_entry(entry_id, fields)
      processed += 1
    rescue StandardError => exc
      warn "[#{@group}/#{@name}] reap failed on #{entry_id}: #{exc}"
    end
  end
  @lock.synchronize { @reaped += processed }
  { claimed: claimed.length, processed: processed, deleted_ids: deleted }
end
```

The underlying `stream.autoclaim` helper pages through the group's PEL with `XAUTOCLAIM`'s continuation cursor. `redis-rb` 5.x exposes a typed `xautoclaim(...)` wrapper, but it discards the third element of the reply (the list of IDs whose payload was already trimmed). The helper drops down to the raw command via `redis.call(...)` so the deleted-IDs list survives:

```ruby
def autoclaim(group, consumer, page_count: 100, start_id: '0-0',
              max_pages: 10)
  claimed_all = []
  deleted_all = []
  cursor = start_id
  max_pages.times do
    reply = @redis.call('XAUTOCLAIM', @stream_key, group, consumer,
                        @claim_min_idle_ms.to_s, cursor,
                        'COUNT', page_count.to_s)
    next_cursor = reply[0]
    claimed = parse_entries(reply[1])
    deleted = Array(reply[2])
    claimed_all.concat(claimed)
    deleted_all.concat(deleted)
    break if next_cursor == '0-0'
    cursor = next_cursor
  end
  @stats_lock.synchronize { @claimed_total += claimed_all.length }
  { claimed: claimed_all, deleted_ids: deleted_all }
end
```

A single `XAUTOCLAIM` call scans up to `page_count` PEL entries starting at `start_id`, reassigns the ones idle for at least `min_idle_time` to the named consumer, and returns a continuation cursor in the first slot of the reply. For a full sweep, loop until the cursor returns to `'0-0'` (with a `max_pages` safety net so one call cannot monopolise a very large PEL). The delivery counter is incremented on every claim — after a few cycles you can use it to spot a *poison-pill* message that crashes every consumer that touches it, and route it to a dead-letter stream so the bad entry stops cycling. (New entries keep flowing past the poison pill — `XREADGROUP >` still delivers fresh work — but the bad entry's repeated reclaim wastes consumer time and keeps the PEL larger than it needs to be.)

The `deleted_ids` list contains PEL entry IDs whose stream payload was already trimmed by the time the claim ran (typically because `MAXLEN ~` retention outran a slow consumer). `XAUTOCLAIM` removes those dangling slots from the PEL itself, so the caller does *not* need to `XACK` them — but the entries cannot be retried either, so log and route them to a dead-letter store for offline inspection. Redis 7.0 introduced this third return element; the example requires Redis 7.0+ for that reason.

`reap_idle_pel` is the right primitive for the recovery path because it claims and processes in one step: every entry the call returned is now in *this* consumer's PEL, so the same consumer is responsible for processing and acking it. In production each consumer thread runs `reap_idle_pel` periodically (every few seconds, on a timer) so a crashed peer's entries never sit invisibly. The demo exposes it as a manual button so you can trigger the reap after waiting for the idle threshold.

`XCLAIM` (singular, no auto) does the same thing for a specific list of entry IDs you already have in hand — useful when you want to take ownership of one known stuck entry, or when you need to move a specific consumer's PEL to a peer (the case the demo's "Remove consumer" button handles via `handover_pending`). `XAUTOCLAIM` cannot filter by source consumer, so it cannot be used for a per-consumer handover.

## Replay with XRANGE

`XRANGE` reads a slice of history. It is completely independent of any consumer group — no cursors move, no acks happen — so it is safe to call any number of times, from any process:

```ruby
def replay(start_id: '-', end_id: '+', count: 100)
  rows = @redis.xrange(@stream_key, start_id, end_id, count: count)
  rows.map { |entry_id, fields| [entry_id, fields] }
end
```

The special IDs `-` and `+` mean "from the very beginning" and "to the very end". You can also pass real IDs (`1716998413541-0`) or just the millisecond part (`1716998413541`, which Redis interprets as "any entry with this timestamp").

Typical uses:

* **Bootstrapping a new projection** — read the entire stream from `-` and build a derived view in another store (a search index, a SQL table, a different cache). Doing this against a consumer group would consume the entries; `XRANGE` lets you do it without disrupting live consumers.
* **Auditing recent activity** — read the last few minutes by ID range without touching any group cursor.
* **Debugging** — fetch one specific entry by its ID, or a tight range around an incident timestamp, to see exactly what producers wrote.

## The consumer worker thread

`ConsumerWorker` wraps the `XREADGROUP` → process → `XACK` loop in a Ruby `Thread`
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/ruby/consumer_worker.rb)):

```ruby
def run
  until @stop
    if @lock.synchronize { @paused }
      sleep 0.05
      next
    end
    begin
      entries = @read_stream.consume(@group, @name, count: 10, block_ms: 500)
    rescue StandardError => exc
      # Don't kill the thread on a transient Redis error; a real
      # consumer would log this and back off.
      warn "[#{@group}/#{@name}] read failed: #{exc}"
      sleep 0.5
      next
    end

    entries.each do |entry_id, fields|
      dispatch(entry_id, fields)
    end
  end
end
```

`dispatch` either acks (the normal path) or, when the demo has asked the worker to "crash", drops the entry on the floor and increments a counter so the UI can show what is currently in the PEL waiting to be claimed. The `begin/rescue` block around the per-entry handler is important: a transient failure (typically `XACK` against a flaky network) must not kill the worker thread — otherwise every other entry in this consumer's PEL would sit invisibly waiting for `XAUTOCLAIM`. The entry stays unacked instead; the next `reap_idle_pel` call (here or on any consumer in the group) recovers it.

Each `ConsumerWorker` is constructed with two `RedisEventStream` handles:

* A `read_stream` with its own dedicated `Redis` connection. The blocking `XREADGROUP BLOCK 500` would otherwise park the demo server's primary connection (and any HTTP handler sharing it) for up to 500 ms.
* A `shared_stream` pointing at the demo server's primary connection. Non-blocking commands (`XACK`, `XAUTOCLAIM`) run through this handle so stats land in a single aggregate counter the UI can render.

Recovery of stuck PEL entries — this consumer's, after a restart, or another consumer's, after a crash — runs through a separate `reap_idle_pel` method rather than the read loop. That method calls `XAUTOCLAIM` with this consumer as the target, then processes whatever was claimed in the same flow as new entries. This is the textbook Streams pattern: each consumer is its own reaper, running `XAUTOCLAIM(self)` periodically (or on demand) so a crashed peer's entries never sit invisibly in the PEL. The demo's "XAUTOCLAIM to selected" button calls `reap_idle_pel` on the chosen consumer; in production you would run it from a timer every few seconds.

Note that the worker's main read loop deliberately does *not* call `XREADGROUP 0` to drain its own PEL on every iteration. That would re-deliver every pending entry continuously and *reset its idle counter to zero* each time, which would keep crashed entries below the `XAUTOCLAIM` threshold forever. Using `XAUTOCLAIM(self)` as the recovery primitive — which only fires for entries idle longer than `min_idle_time` — avoids that whole class of bug.

The pause and crash levers exist only for the demo. A real consumer is just the read-process-ack loop — everything else in this class is instrumentation.

## Prerequisites

* Redis 7.0 or later. `XAUTOCLAIM` was added in Redis 6.2, but its reply gained a third
  element (the list of deleted IDs) in 7.0; the example relies on that shape.
* Ruby 3.0 or later.
* The `redis` gem at version 5.x. `webrick` was removed from Ruby's standard library in
  Ruby 3.0, so install both:

  ```bash
  gem install redis webrick
  ```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of three Ruby files. Download them from the [`ruby` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/streaming/ruby) on GitHub, or grab them with `curl`:

```bash
mkdir streaming-demo && cd streaming-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/streaming/ruby
curl -O $BASE/event_stream.rb
curl -O $BASE/consumer_worker.rb
curl -O $BASE/demo_server.rb
```

### Start the demo server

From that directory, install the gems and run the server:

```bash
gem install redis webrick
ruby demo_server.rb
```

You should see:

```text
Deleting any existing data at key 'demo:events:orders' for a clean demo run (pass --no-reset to keep it).
Redis streaming demo server listening on http://127.0.0.1:8787
Using Redis at localhost:6379 with stream key 'demo:events:orders' (MAXLEN ~ 2000)
Seeded 3 consumer(s) across 2 group(s)
```

By default the demo wipes the configured stream key on startup so each run starts from a clean state. Pass `--no-reset` to keep any existing data at the key (useful when re-running against the same stream to inspect prior state), or `--stream-key <name>` to point the demo at a different key entirely.

Open [http://127.0.0.1:8787](http://127.0.0.1:8787) in a browser. You can:

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

`XPENDING` returns each entry's delivery count, incremented on every claim. If an entry has been delivered (and dropped) several times, the next consumer is unlikely to fare better. After some threshold — `deliveries >= 5`, say — route the entry to a *dead-letter stream*, ack it on the original group, and alert. New entries keep flowing past a poison pill (`XREADGROUP >` still delivers fresh work), but the bad entry's repeated reclaim wastes consumer time and keeps the PEL bigger than it needs to be — without a DLQ threshold it can also slowly trip retention/lag alerts.

### Partition by tenant or entity for scale

A single Redis Stream is a single key, and on a Redis Cluster a single key lives on a single shard. If your throughput exceeds what one shard can handle, partition the stream — for example by tenant ID (`events:orders:{tenant_a}`, `events:orders:{tenant_b}`) — so different tenants land on different shards. Hash-tags (`{tenant_a}`) keep all related streams on the same shard if you need to multi-stream atomically.

Per-entity partitioning (`events:order:{order_id}`) is the canonical pattern when you treat each entity's stream as the event-sourcing log for that entity: every state change for one order goes on its own stream, which is also bounded in size by the entity's lifetime.

### Use a separate consumer pool per group

The demo runs every consumer in one Ruby process. In production each consumer group is usually its own deployment — its own pool of pods or VMs — so a slow projection in `analytics` cannot pull `notifications` workers off their stream. Each pod runs one consumer thread per CPU core (mind the GVL: pure-Ruby consumers won't go in parallel on MRI), with `XAUTOCLAIM` either embedded in the consumer loop (every N reads, claim idle entries to self) or run by a separate reaper.

### Use one `Redis` connection per consumer thread

A `redis-rb` `Redis` instance holds a single TCP socket and serialises every command through an internal monitor. A blocking call like `XREADGROUP BLOCK 500` parks that monitor for the full block window, so a second thread issuing *any* command — even a simple `XACK` — would queue behind it. The demo gives each `ConsumerWorker` a dedicated read connection for the blocking `XREADGROUP` loop and routes its `XACK` and `XAUTOCLAIM` calls through the demo server's shared connection so the aggregate stats counter stays in sync. In production with `redis-rb`, use a `ConnectionPool` (from the `connection_pool` gem) for the non-blocking side and a dedicated per-consumer `Redis` for the blocking reads.

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
* [`XCLAIM`]({{< relref "/commands/xclaim" >}}) to take ownership of a specific list of pending entry IDs by hand (used by `handover_pending` to move a leaving consumer's PEL to a peer, since `XAUTOCLAIM` has no source-consumer filter).
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit, independent of consumer-group state.
* [`XPENDING`]({{< relref "/commands/xpending" >}}) to inspect the per-group pending list with idle times and delivery counts.
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement.
* [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}) and
  [`XGROUP DELCONSUMER`]({{< relref "/commands/xgroup-delconsumer" >}}) to manage groups and consumers.
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for observability.

See the [`redis-rb` documentation]({{< relref "/develop/clients/ruby" >}}) for the full client reference, and the [Streams overview]({{< relref "/develop/data-types/streams" >}}) for the deeper conceptual model — consumer groups, the PEL, claim semantics, capped streams, and the differences with Kafka partitions.
