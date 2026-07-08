---
aliases:
- /develop/use-cases/streaming/predis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis event-streaming pipeline in PHP with Predis
linkTitle: Predis example (PHP)
title: Redis streaming with Predis
weight: 7
---

This guide shows you how to build a Redis-backed event-streaming pipeline in PHP with [Predis](https://github.com/predis/predis). It includes a small local web server built on PHP's built-in dev server so you can produce events into a single Redis Stream, watch two independent consumer groups read it at their own pace, and recover stuck deliveries with `XAUTOCLAIM` after simulating a consumer crash.

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

This port is **structurally different from the other clients in this use case**: every other client runs its consumers as in-process threads or async tasks, but PHP's built-in `php -S` development server runs each HTTP request in a brand-new short-lived process, so an in-process consumer would die as soon as the request that started it returned. The helper sidesteps that by spawning each consumer as a detached OS process and keeping every piece of cross-request state in Redis. See [Production usage](#production-usage) for the longer story.

## How it works

The flow looks like this:

1. The application calls `$stream->produce($eventType, $payload)` which runs [`XADD`]({{< relref "/commands/xadd" >}}) with an approximate [`MAXLEN ~`]({{< relref "/commands/xadd" >}}) cap. Redis assigns an auto-generated time-ordered ID.
2. Each consumer process loops on [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` (meaning "deliver entries this group has not yet delivered to anyone") and a short block timeout.
3. After processing each entry, the consumer calls [`XACK`]({{< relref "/commands/xack" >}}) so Redis can drop it from the group's pending list.
4. If a consumer is killed (or crashes) before acking, its entries sit in the group's PEL. A periodic [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) sweep reassigns idle entries to a healthy consumer.
5. Anyone — including code outside the consumer groups — can read history with [`XRANGE`]({{< relref "/commands/xrange" >}}) without affecting any group's cursor.

Each consumer group has its own cursor (`last-delivered-id`) and its own pending list, so the two groups in this demo process the same events without coordinating with each other.

## The event-stream helper

The `EventStream` class wraps the stream operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/php/EventStream.php)):

```php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/EventStream.php';

use Predis\Client as PredisClient;

$redis = new PredisClient(['host' => '127.0.0.1', 'port' => 6379]);
$stream = new EventStream(
    $redis,
    'demo:events:orders',
    2000,        // retention guardrail (approximate MAXLEN)
    5000         // XAUTOCLAIM idle threshold (ms)
);

// Producer
$streamId = $stream->produce('order.placed', [
    'order_id' => 'o-1234',
    'customer' => 'alice',
    'amount'   => '49.50',
]);

// Consumer group + one consumer
$stream->ensureGroup('notifications', '0-0');
$entries = $stream->consume('notifications', 'worker-a', count: 10, blockMs: 500);
foreach ($entries as [$entryId, $fields]) {
    handle($fields);                                // your processing
    $stream->ack('notifications', [$entryId]);      // XACK
}

// Recover stuck PEL entries by reaping them into a healthy consumer.
// The textbook pattern: each consumer periodically calls XAUTOCLAIM
// with itself as the target and processes whatever it claimed.
// `ConsumerWorker::reapIdlePel()` wraps that flow; the low-level
// helper `$stream->autoclaim($group, $target)` is also available if
// you want to drive XAUTOCLAIM directly.
$result = $worker->reapIdlePel();
// $result == ['claimed' => N, 'processed' => M, 'deleted_ids' => [...]]
// deleted_ids are PEL entries whose payload was already trimmed.
// Redis 7+ has already removed those slots from the PEL, so no XACK
// is needed — log them and route to a dead-letter store for audit.

// Replay history (independent of any group's cursor)
foreach ($stream->replay('-', '+', 50) as [$entryId, $fields]) {
    print "$entryId " . json_encode($fields) . "\n";
}
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

The ID is `{milliseconds}-{sequence}`, monotonically increasing within the stream, so you can range-query by approximate wall-clock time without an extra index. (IDs are ordered within a stream, not across streams — two events appended to different streams at the same millisecond can produce the same ID.)

The PHP port also keeps a small per-process bookkeeping keyspace under `demo:streaming:*` so every fresh `php -S` request can find the running consumers:

```text
demo:streaming:stats                            (hash)   produced_total, acked_total, claimed_total
demo:streaming:workers                          (set)    "{group}/{name}" entries for every spawned worker
demo:streaming:worker:{group}:{name}:pid        (string) worker process PID
demo:streaming:worker:{group}:{name}:processed  (string) per-consumer ack count
demo:streaming:worker:{group}:{name}:reaped     (string) per-consumer XAUTOCLAIM-claimed count
demo:streaming:worker:{group}:{name}:crashed_drops (string) per-consumer drop count
demo:streaming:worker:{group}:{name}:crash_next (string) integer counter for the crash lever
demo:streaming:worker:{group}:{name}:paused     (string) "1" while paused, deleted otherwise
demo:streaming:worker:{group}:{name}:idle       (string) "1" while the worker has acknowledged the pause
demo:streaming:worker:{group}:{name}:recent     (list)   last N processed entries for the UI
```

The implementation uses:

* [`XADD ... MAXLEN ~ n`]({{< relref "/commands/xadd" >}}), pipelined, for batch production with a retention cap
* [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) with the special ID `>` for fresh deliveries to a consumer
* [`XACK`]({{< relref "/commands/xack" >}}) on every processed entry
* [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) for sweeping idle pending entries to a healthy consumer
* [`XCLAIM`]({{< relref "/commands/xclaim" >}}) for handing one consumer's PEL over to a peer before removing it
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit
* [`XPENDING`]({{< relref "/commands/xpending" >}}) for inspecting the per-group pending list
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for surface-level observability
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement

## Producing events

`produceBatch()` pipelines `XADD` calls in a single round trip. Each call carries an approximate `MAXLEN ~` cap so the stream stays bounded as it rolls forward:

```php
public function produceBatch(array $events): array
{
    $stream = $this->streamKey;
    $maxlen = $this->maxlenApprox;
    $results = $this->redis->pipeline(function ($pipe) use ($events, $stream, $maxlen) {
        foreach ($events as [$eventType, $payload]) {
            $fields = self::encodeFields($eventType, $payload);
            // XADD <key> <fields-assoc> <id=*> {trim => [MAXLEN, ~, n]}
            $pipe->xadd($stream, $fields, '*', ['trim' => ['MAXLEN', '~', $maxlen]]);
        }
    });
    // ...
}
```

The `~` flavour of `MAXLEN` lets Redis trim at a macro-node boundary, which is much cheaper than exact trimming and is what you want when the cap is a retention *guardrail*, not a hard size constraint. With 300 events produced and `MAXLEN ~ 50`, you might end up with 100 entries left — Redis released the oldest whole macro-node and stopped. The next `XADD` will keep length stable.

If you genuinely need an exact cap (rare), drop the `~` from the `trim` array. The performance difference is significant on busy streams.

Predis 3.x's `xadd()` takes the fields as an **associative array** in the second argument and the trim options as an `['trim' => ['MAXLEN', '~', n]]` entry in the fourth — a different shape from `hset()`, which takes its fields variadically. Skim the [Predis stream tests](https://github.com/predis/predis/tree/main/tests/Predis/Command/Redis) if you need to confirm the signature for a command this guide doesn't show.

## Reading with a consumer group

Each consumer runs the same `XREADGROUP` loop. The special ID `>` means "deliver entries this group has not yet delivered to *anyone*":

```php
public function consume(string $group, string $consumer, int $count = 10, int $blockMs = 500): array
{
    // Predis xreadgroup signature:
    // xreadgroup(group, consumer, count, block, noack, key, id)
    $raw = $this->redis->xreadgroup(
        $group, $consumer, $count, $blockMs, false,
        $this->streamKey, '>'
    );
    return self::flattenReadGroup($raw);
}
```

`blockMs` makes the call efficient even when the stream is idle: the client parks on the server until either an entry arrives or the timeout expires, so consumers don't busy-loop.

Reading with an explicit ID like `0-0` instead of `>` does something different — it replays entries already delivered to *this* consumer name (its private PEL). That is the canonical recovery path when the same consumer restarts: catch up on its own pending entries first, then resume reading new ones. The helper exposes that as `consumeOwnPel()`.

## Acknowledging entries

Once the consumer has processed an entry, `XACK` tells Redis it can drop the entry from the group's pending list. Predis 3.x's `xack()` takes the IDs **variadically** rather than as a single array, so the helper unpacks the list with `...`:

```php
public function ack(string $group, array $ids): int
{
    if (empty($ids)) {
        return 0;
    }
    $n = (int) $this->redis->xack($this->streamKey, $group, ...$ids);
    if ($n > 0) {
        $this->redis->hincrby(self::STATS_KEY, 'acked_total', $n);
    }
    return $n;
}
```

This is the linchpin of at-least-once delivery: an entry that is never acked stays in the PEL until a claim moves it elsewhere. If your consumer process crashes between processing and ack, the next claim sweep picks the entry back up. The one caveat is retention: `XADD MAXLEN ~` and `XTRIM` can release the entry's *payload* even while its ID is still in the PEL. The next `XAUTOCLAIM` returns those IDs in its `deletedIds` list and removes them from the PEL inside the same command — the entry cannot be retried, so the caller should log it and route to a dead-letter store for audit.

The trade-off is the opposite of pub/sub: a slow or crashed consumer doesn't lose messages, but it does mean your downstream system must be idempotent. If you process an order twice because the first attempt died after the side effect but before the ack, the second attempt must be safe.

## Multiple consumer groups, one stream

The big difference between Redis Streams and a job queue is that any number of independent consumer groups can read the same stream. The demo sets up two groups on `demo:events:orders`:

```php
$stream->ensureGroup('notifications', '0-0');
$stream->ensureGroup('analytics',     '0-0');
```

Each group has its own cursor. Producing 5 events results in `notifications` and `analytics` each receiving all 5, with no coordination between them. Within `notifications`, the work is split across `worker-a` and `worker-b`: Redis hands each `XREADGROUP` call whatever entries are not yet delivered to anyone in the group, so adding a second worker doubles throughput without any rebalance logic.

The `'0-0'` argument means "deliver everything in the stream from the beginning" — useful in a demo and for fresh groups bootstrapping from history. In production, a brand-new group reading a long-existing stream usually starts at `$` ("only events after this point") and uses [`XRANGE`]({{< relref "/commands/xrange" >}}) explicitly if it needs history.

## Recovering crashed consumers with XAUTOCLAIM

The demo's "Crash next 3" button tells a chosen consumer to drop its next three deliveries on the floor without acking them — the same effect as a worker process dying mid-message. Those entries stay in the group's PEL with their delivery counter incremented. Once they have been idle for at least `claimMinIdleMs`, any healthy consumer in the group can rescue them by calling `XAUTOCLAIM` *with itself as the target*. `ConsumerWorker::reapIdlePel()` wraps that pattern:

```php
public function reapIdlePel(): array
{
    $result = $this->stream->autoclaim($this->group, $this->name, 100, '0-0', 10);
    $claimed = $result['claimed'];
    $deletedIds = $result['deletedIds'];

    $processed = 0;
    foreach ($claimed as [$entryId, $fields]) {
        try {
            $this->handleEntry($entryId, $fields, /*viaReap*/ true);
            $processed++;
        } catch (\Throwable $exc) {
            fwrite(STDERR, "[{$this->group}/{$this->name}] reap failed on {$entryId}: " . $exc->getMessage() . "\n");
        }
    }
    return [
        'claimed' => count($claimed),
        'processed' => $processed,
        'deleted_ids' => $deletedIds,
    ];
}
```

The underlying `$stream->autoclaim()` helper pages through the group's PEL with `XAUTOCLAIM`'s continuation cursor:

```php
public function autoclaim(
    string $group, string $consumer,
    int $pageCount = 100, string $startId = '0-0', int $maxPages = 10
): array {
    $claimedAll = []; $deletedAll = []; $cursor = $startId;
    for ($i = 0; $i < $maxPages; $i++) {
        $reply = $this->redis->xautoclaim(
            $this->streamKey, $group, $consumer,
            $this->claimMinIdleMs, $cursor, $pageCount
        );
        // Reply shape: [nextCursor, [[id, [k,v,k,v,...]], ...], [deletedIds...]]
        $nextCursor = (string) $reply[0];
        foreach (($reply[1] ?? []) as $entry) {
            $claimedAll[] = [(string) $entry[0], self::pairsToDict($entry[1] ?? [])];
        }
        foreach (($reply[2] ?? []) as $id) { $deletedAll[] = (string) $id; }
        if ($nextCursor === '0-0') break;
        $cursor = $nextCursor;
    }
    return ['claimed' => $claimedAll, 'deletedIds' => $deletedAll];
}
```

A single `XAUTOCLAIM` call scans up to `pageCount` PEL entries starting at `startId`, reassigns the ones idle for at least `claimMinIdleMs` to the named consumer, and returns a continuation cursor in the first slot of the reply. For a full sweep, loop until the cursor returns to `0-0` (with a `maxPages` safety net so one call cannot monopolise a very large PEL). The delivery counter is incremented on every claim — after a few cycles you can use it to spot a *poison-pill* message that crashes every consumer that touches it, and route it to a dead-letter stream so the bad entry stops cycling. (New entries keep flowing past the poison pill — `XREADGROUP >` still delivers fresh work — but the bad entry's repeated reclaim wastes consumer time and keeps the PEL larger than it needs to be.)

The `deletedIds` list contains PEL entry IDs whose stream payload was already trimmed by the time the claim ran (typically because `MAXLEN ~` retention outran a slow consumer). `XAUTOCLAIM` removes those dangling slots from the PEL itself, so the caller does *not* need to `XACK` them — but the entries cannot be retried either, so log and route them to a dead-letter store for offline inspection. Redis 7.0 introduced this third return element; the example requires Redis 7.0+ for that reason.

`reapIdlePel` is the right primitive for the recovery path because it claims and processes in one step: every entry the call returned is now in *this* consumer's PEL, so the same consumer is responsible for processing and acking it. In production each consumer process runs `reapIdlePel` periodically (every few seconds, on a timer) so a crashed peer's entries never sit invisibly. The demo exposes it as a manual button so you can trigger the reap after waiting for the idle threshold.

`XCLAIM` (singular, no auto) does the same thing for a specific list of entry IDs you already have in hand — useful when you want to take ownership of one known stuck entry, or when you need to move a specific consumer's PEL to a peer (the case the demo's "Remove consumer" button handles via `handoverPending()`). `XAUTOCLAIM` cannot filter by source consumer, so it cannot be used for a per-consumer handover.

## Replay with XRANGE

`XRANGE` reads a slice of history. It is completely independent of any consumer group — no cursors move, no acks happen — so it is safe to call any number of times, from any process:

```php
public function replay(string $startId = '-', string $endId = '+', int $count = 100): array
{
    $raw = $this->redis->xrange($this->streamKey, $startId, $endId, $count);
    $out = [];
    foreach ($raw as $id => $fields) {
        $out[] = [(string) $id, is_array($fields) ? $fields : []];
    }
    return $out;
}
```

The special IDs `-` and `+` mean "from the very beginning" and "to the very end". You can also pass real IDs (`1716998413541-0`) or just the millisecond part (`1716998413541`, which Redis interprets as "any entry with this timestamp").

Typical uses:

* **Bootstrapping a new projection** — read the entire stream from `-` and build a derived view in another store (a search index, a SQL table, a different cache). Doing this against a consumer group would consume the entries; `XRANGE` lets you do it without disrupting live consumers.
* **Auditing recent activity** — read the last few minutes by ID range without touching any group cursor.
* **Debugging** — fetch one specific entry by its ID, or a tight range around an incident timestamp, to see exactly what producers wrote.

## The consumer worker process

`ConsumerWorker` wraps the `XREADGROUP` → process → `XACK` loop and is intended to run as a **separate CLI process**
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/streaming/php/ConsumerWorker.php)):

```php
public function run(): void
{
    // SIGTERM handler so the demo server's posix_kill gives the
    // worker a chance to leave the loop cleanly.
    $stop = false;
    pcntl_async_signals(true);
    pcntl_signal(SIGTERM, function () use (&$stop) { $stop = true; });

    while (!$stop) {
        // Cross-process pause flag (see Production usage).
        if ((string) $this->redis->get($pausedKey) === '1') {
            $this->redis->set($idleKey, '1');
            usleep(20 * 1000);
            continue;
        }
        $entries = $this->stream->consume($this->group, $this->name, 10, 500);
        foreach ($entries as [$entryId, $fields]) {
            usleep($this->processLatencyMs * 1000);
            $this->handleEntry($entryId, $fields, /*viaReap*/ false);
        }
    }
}
```

`handleEntry()` either acks (the normal path) or, when the demo's `crash_next` counter is `> 0`, drops the entry on the floor and increments the per-consumer `crashed_drops` count. The crash check uses a tiny Lua script (`GET` + conditional `DECR`) so two simultaneous deliveries can't both undercount the counter past zero.

Recovery of stuck PEL entries — this consumer's, after a restart, or another consumer's, after a crash — runs through `reapIdlePel()` rather than the read loop. That method calls `XAUTOCLAIM` with this consumer as the target, then processes whatever was claimed in the same flow as new entries. This is the textbook Streams pattern: each consumer is its own reaper, running `XAUTOCLAIM(self)` periodically (or on demand) so a crashed peer's entries never sit invisibly in the PEL. The demo's "XAUTOCLAIM to selected" button calls `reapIdlePel()` on the chosen consumer; in production you would run it from a timer every few seconds.

Note that the worker's main read loop deliberately does *not* call `XREADGROUP 0` to drain its own PEL on every iteration. That would re-deliver every pending entry continuously and *reset its idle counter to zero* each time, which would keep crashed entries below the `XAUTOCLAIM` threshold forever. Using `XAUTOCLAIM(self)` as the recovery primitive — which only fires for entries idle longer than `min_idle_time` — avoids that whole class of bug.

The pause and crash levers exist only for the demo. A real consumer is just the read-process-ack loop — everything else in this class is instrumentation.

## Prerequisites

* Redis 7.0 or later. `XAUTOCLAIM` was added in Redis 6.2, but its reply gained a third
  element (the list of deleted IDs) in 7.0; the example relies on that shape.
* PHP 8.1 or later, with the `pcntl` and `posix` extensions enabled (both ship with the
  official PHP binary on macOS and most Linux distros).
* The Predis client (3.x). Install it with [Composer](https://getcomposer.org/):

  ```bash
  composer require "predis/predis:^3.0"
  ```

If your Redis server is running elsewhere, start the demo with `REDIS_HOST=...` and `REDIS_PORT=...` (see [Start the demo server](#start-the-demo-server) below).

## Running the demo

### Get the source files

The demo consists of four files plus the Composer manifest. Download them from the [`php` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/streaming/php) on GitHub, or grab them with `curl`:

```bash
mkdir streaming-demo && cd streaming-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/streaming/php
curl -O $BASE/EventStream.php
curl -O $BASE/ConsumerWorker.php
curl -O $BASE/demo_server.php
curl -O $BASE/composer.json
```

Then install dependencies:

```bash
composer install
```

### Start the demo server

From that directory:

```bash
php -S 127.0.0.1:8083 demo_server.php
```

You should see:

```text
[...] PHP 8.4.6 Development Server (http://127.0.0.1:8083) started
```

By default the demo wipes the configured stream key on startup so each run starts from a clean state. The Composer-built-in `php -S` doesn't accept user CLI flags through to the script, so the demo uses environment variables for the equivalent overrides:

| Env var              | CLI equivalent       | Default                | Meaning                                                                                       |
|----------------------|----------------------|------------------------|-----------------------------------------------------------------------------------------------|
| `REDIS_HOST`         | `--redis-host`       | `127.0.0.1`            | Redis host the demo server and every worker connect to.                                       |
| `REDIS_PORT`         | `--redis-port`       | `6379`                 | Redis port.                                                                                   |
| `STREAM_KEY`         | `--stream-key`       | `demo:events:orders`   | The Redis Stream key the demo writes to and reads from.                                       |
| `MAXLEN`             | `--maxlen`           | `2000`                 | Approximate `MAXLEN ~` cap on every `XADD`.                                                   |
| `CLAIM_IDLE_MS`      | `--claim-idle-ms`    | `5000`                 | Minimum idle time before `XAUTOCLAIM` may reassign a pending entry.                           |
| `NO_RESET`           | `--no-reset`         | (reset on first request) | Set to `1` to keep any existing data at `STREAM_KEY` instead of dropping it on first request. |
| `PROCESS_LATENCY_MS` | —                    | `25`                   | Per-entry processing latency the workers simulate (purely for visualisation).                 |

For example, to point the demo at a different stream and tighten the autoclaim window:

```bash
STREAM_KEY=demo:events:orders-php CLAIM_IDLE_MS=500 php -S 127.0.0.1:8083 demo_server.php
```

Open [http://127.0.0.1:8083](http://127.0.0.1:8083) in a browser. You can:

* **Produce** any number of events of a chosen type (or random types). Watch the stream length grow and the tail update.
* See each **consumer group**: its `last-delivered-id`, the size of its pending list, and the consumers in it. Each consumer shows its processed count, pending count, and idle time.
* **Add or remove** consumers within a group at runtime to see Redis split the work across the new shape.
* Click **Crash next 3** on a consumer to drop its next three deliveries — the same effect as a worker process dying after `XREADGROUP` but before `XACK`. Watch the **Pending entries (XPENDING)** panel fill up.
* Wait until the idle time exceeds the threshold (default 5000 ms), pick a healthy target consumer, and click **XAUTOCLAIM to selected** — the stuck entries are reassigned and the delivery counter increments.
* **Replay (XRANGE)** any range to confirm the full history is independent of consumer-group state.
* **XTRIM** with an approximate `MAXLEN` to bound retention. Note that an approximate trim only releases whole macro-nodes — `MAXLEN ~ 50` on a small stream may not delete anything; on a 300-entry stream it typically lands at around 100.
* Click **Reset demo** to drop the stream, kill every worker, and re-seed the default groups.

### Stopping the demo cleanly

`php -S` doesn't run a shutdown handler when you Ctrl-C out of it, and the consumer worker processes — which are *intentionally* detached so they survive request boundaries — will outlive the demo server unless you stop them first. Before stopping the server, click **Reset demo** in the UI (which kills every worker), or run:

```bash
curl -X POST http://127.0.0.1:8083/reset
```

If you forgot, clean up by name:

```bash
pgrep -f ConsumerWorker.php | xargs kill
redis-cli --scan --pattern 'demo:streaming:*' | xargs redis-cli del
```

## Production usage

### Why this PHP port differs from the others

Every other client in this use case keeps consumers as in-process objects with a background thread (Python's `threading.Thread`, .NET's task pool, Node's event loop, Go's goroutines, etc.). That works because those runtimes have a long-lived server process that owns the consumer's connection, callback, and dispatch loop.

PHP's traditional one-process-per-request model — used by `php -S`, mod_php, PHP-FPM with the default `pm` setting — fundamentally doesn't fit that shape. A consumer created inside an HTTP handler dies the moment the handler returns. Even if you used a long-running PHP daemon (Roadrunner, Swoole, ReactPHP), you'd still need separate worker processes if you wanted multiple independent consumers, because Predis's blocking `XREADGROUP` call blocks the calling process.

This port therefore keeps each consumer as a **separate OS process**, with its full state (PID, processed/reaped/dropped counts, recent buffer) persisted in Redis. Every HTTP request reconstructs its view of the consumer registry from those keys. The pattern is closer to how a real production PHP application would run stream consumers: a `supervisord`, `systemd`, or container orchestrator drives N copies of `ConsumerWorker.php`, each owning one logical consumer in one logical group, and the web tier never tries to host a consumer itself. The demo just inlines the supervision (via `proc_open` + `posix_kill`) so a single `php -S` command is enough to play with the pattern end-to-end.

Two cross-process subtleties are worth calling out, because both will bite anyone who tries to copy this pattern naively:

* **Capture the worker's real PID, not a wrapper's.** A `proc_open(['setsid', '-f', $args...])` call returns the *wrapper's* PID — `setsid -f` forks, exec's the worker as the new session leader, and the wrapper exits. A subsequent `posix_kill($recordedPid, SIGTERM)` then signals a dead PID and the worker survives. The fix is a shell-wrapped `& echo $!` pattern that backgrounds the worker and echoes its real PID back through the wrapper's stdout pipe, which is what `spawnWorker()` in `demo_server.php` does on both Linux and macOS.
* **Pause/resume across processes uses Redis flags, not in-process events.** The reference Python port uses a `threading.Event` to park a consumer while the demo server hands its PEL off to a peer; this port uses two Redis keys per worker (`paused` and `idle`). The demo server `SET`s `paused=1`, waits for the worker to write `idle=1` (the worker checks the flag at the top of every loop iteration with a 20 ms spin-wait), runs the surgical operation, then `DEL`s both keys. That's what makes the "Remove consumer" handover safe even though the demo server can't touch the worker's in-memory state directly.

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

The demo runs every consumer alongside one demo server. In production each consumer group is usually its own deployment — its own pool of pods or VMs — so a slow projection in `analytics` cannot pull `notifications` workers off their stream. Each pod runs one consumer process per CPU core, with `XAUTOCLAIM` either embedded in the consumer loop (every N reads, claim idle entries to self) or run by a separate reaper. `supervisord`, `systemd`, or a container orchestrator owns the process lifecycle, not your web tier.

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

# The PHP port's own bookkeeping keys
redis-cli --scan --pattern 'demo:streaming:*'
```

If a group's `lag` is growing while consumers' `idle` times are short, consumers are healthy but producers are outpacing them — add more consumers. If `pending` is growing while `lag` is small, consumers are *receiving* entries but not *acking* them — either they are crashing mid-message or your acking logic has a bug.

## Learn more

This example uses the following Redis commands:

* [`XADD`]({{< relref "/commands/xadd" >}}) to append an event with an approximate `MAXLEN` cap.
* [`XREADGROUP`]({{< relref "/commands/xreadgroup" >}}) to read new entries for a consumer in a group.
* [`XACK`]({{< relref "/commands/xack" >}}) to acknowledge a processed entry.
* [`XAUTOCLAIM`]({{< relref "/commands/xautoclaim" >}}) to reassign idle pending entries to a healthy consumer.
* [`XCLAIM`]({{< relref "/commands/xclaim" >}}) to reassign specific entry IDs (used here to hand a consumer's PEL over to a peer before deletion).
* [`XRANGE`]({{< relref "/commands/xrange" >}}) for replay and audit, independent of consumer-group state.
* [`XPENDING`]({{< relref "/commands/xpending" >}}) to inspect the per-group pending list with idle times and delivery counts.
* [`XTRIM`]({{< relref "/commands/xtrim" >}}) for explicit retention enforcement.
* [`XGROUP CREATE`]({{< relref "/commands/xgroup-create" >}}) and
  [`XGROUP DELCONSUMER`]({{< relref "/commands/xgroup-delconsumer" >}}) to manage groups and consumers.
* [`XINFO STREAM`]({{< relref "/commands/xinfo-stream" >}}),
  [`XINFO GROUPS`]({{< relref "/commands/xinfo-groups" >}}), and
  [`XINFO CONSUMERS`]({{< relref "/commands/xinfo-consumers" >}}) for observability.

See the [Predis README](https://github.com/predis/predis) for the full client reference, and the [Streams overview]({{< relref "/develop/data-types/streams" >}}) for the deeper conceptual model — consumer groups, the PEL, claim semantics, capped streams, and the differences with Kafka partitions.
