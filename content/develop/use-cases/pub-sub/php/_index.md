---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement Redis pub/sub messaging in PHP with Predis
linkTitle: Predis example (PHP)
title: Redis pub/sub with Predis
weight: 7
---

This guide shows you how to implement a Redis-backed pub/sub broadcaster in PHP with [Predis](https://github.com/predis/predis). It includes a small local web server built on PHP's built-in dev server so you can publish messages to named channels, add and remove subscribers live, and watch Redis fan out each message to every interested listener.

## Overview

Pub/sub lets your application broadcast events — chat messages, cache invalidation signals, presence updates, notifications — to many consumers without per-pair wiring. The publisher names a *channel*; every client currently subscribed to that channel receives the message, in publish order, with sub-millisecond fan-out.

That gives you:

* Many-to-many event delivery with no message storage cost in Redis
* Exact-match subscriptions (`SUBSCRIBE orders:new`) for known topics
* Pattern subscriptions (`PSUBSCRIBE notifications:*`) for whole topic hierarchies
* Live server-side introspection through `PUBSUB CHANNELS`, `PUBSUB NUMSUB`, and `PUBSUB NUMPAT`
* At-most-once delivery: subscribers that are offline when a message is published miss it, so durable state should live in keys or a Stream, not in the pub/sub channel itself

In this example, the publisher side calls `PUBLISH` with a JSON-encoded body and counts how many subscribers Redis reported delivering to. Each subscriber runs in its own detached PHP CLI process and writes the messages it receives to a Redis list so the demo server can render them.

## How it works

The flow looks like this:

1. The application calls `$hub->subscribe($name, $channels)` or `$hub->psubscribe($name, $patterns)`
2. The helper spawns a detached `php subscriber_worker.php` process, records its PID in Redis under `demo:pubsub:sub:{name}:pid`, and stores the subscription metadata under `demo:pubsub:sub:{name}:meta`
3. The worker connects to Redis, calls `pubSubLoop()` against the channels or patterns, and writes each received message to `demo:pubsub:sub:{name}:messages`
4. The application (or another process) calls `$hub->publish($channel, $message)`
5. Redis fans the message out over every subscribing client's open socket
6. The subscribing worker reads the message, JSON-decodes the payload, and `LPUSH`es a structured record onto its messages list — capped via `LTRIM` and with a `HINCRBY` on `received_total`
7. The publisher receives the integer subscriber count back from `PUBLISH`, which is the number of clients Redis delivered to right then

Pattern subscriptions match channels by glob (`*`, `?`, `[abc]`). A single message that matches both an exact subscription and a pattern subscription is delivered twice — once as a `message` and once as a `pmessage`.

This port is **structurally different from the other clients in this use case**: every other client keeps subscribers as in-process objects with a background thread (or async task), but PHP's built-in `php -S` development server runs each HTTP request in a brand-new short-lived process, so an in-process subscriber would die as soon as the request that created it returned. The helper sidesteps that by spawning detached OS processes and keeping every piece of cross-request state in Redis. See [Production usage](#production-usage) for the longer story.

## The pub/sub hub helper

The `RedisPubSubHub` class wraps the publish, subscribe, and introspection operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/php/PubSubHub.php)):

```php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/PubSubHub.php';

use Predis\Client as PredisClient;

$redis = new PredisClient(['host' => '127.0.0.1', 'port' => 6379]);
$hub = new RedisPubSubHub($redis, __DIR__ . '/subscriber_worker.php');

// Exact-match subscriber — spawns a worker process.
$hub->subscribe('orders-listener', ['orders:new']);

// Pattern subscriber covering an entire topic hierarchy.
$hub->psubscribe('all-notifications', ['notifications:*']);

// Publish — returns Redis' delivered count for this PUBLISH.
$delivered = $hub->publish('orders:new', ['order_id' => 42, 'total' => 199.0]);
echo "Redis delivered to {$delivered} subscriber(s)\n";

// Look at what each subscriber has received so far.
foreach ($hub->subscriptions() as $sub) {
    echo "{$sub['name']}: {$sub['received_total']} message(s)\n";
    foreach ($sub['messages'] as $m) {
        echo "  {$m['channel']}: " . json_encode($m['payload']) . "\n";
    }
}

$hub->unsubscribe('orders-listener');
$hub->shutdown();   // kills every remaining worker
```

### Data model

Pub/sub has no Redis keyspace footprint of its own — channels are server-side routing entries, not stored values. The hub keeps its own bookkeeping under the `demo:pubsub:*` namespace so every PHP process (the demo server, every worker, the CLI) sees the same state:

```text
demo:pubsub:stats                          (hash) published_total, delivered_total
demo:pubsub:channel_published              (hash) channel -> publish count
demo:pubsub:seeded                         (string flag) "1" once defaults are seeded

demo:pubsub:sub:{name}:meta                (hash) name, kind, targets, is_pattern,
                                                  created_at_ms, received_total
demo:pubsub:sub:{name}:pid                 (string) worker process PID
demo:pubsub:sub:{name}:messages            (list)  recent messages, capped via LTRIM
```

A subscriber's `messages` list holds JSON records of the form:

```json
{
  "channel": "orders:new",
  "pattern": null,
  "payload": {"body": "hello", "seq": 1, "of": 3},
  "received_at_ms": 1715441000123
}
```

`pattern` is the matching pattern for pattern subscribers and `null` for exact-match subscribers — the demo UI uses that to render "via `notifications:*`" annotations next to messages received by pattern subscribers.

The implementation uses:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a JSON-encoded message out to every subscriber of a channel
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) for exact-match subscribers (called from the worker)
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) for glob-style pattern subscribers (called from the worker)
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list the channels with at least one active exact-match subscriber
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per channel
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide
* [`LPUSH`]({{< relref "/commands/lpush" >}}) and [`LTRIM`]({{< relref "/commands/ltrim" >}}) on each subscriber's messages list to keep a recent-history buffer
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) on each subscriber's meta hash to maintain a `received_total` counter that the demo UI can read
* The Predis `pubSubLoop()` method to iterate incoming pub/sub events without writing the protocol-decode loop by hand

## Publishing messages

`publish()` JSON-encodes the message body, calls `PUBLISH`, and updates the cross-request publish counters:

```php
public function publish(string $channel, $message): int
{
    $payload = is_string($message)
        ? $message
        : json_encode($message, JSON_UNESCAPED_SLASHES);
    $delivered = (int) $this->redis->publish($channel, $payload);

    $pipe = $this->redis->pipeline();
    $pipe->hincrby('demo:pubsub:stats', 'published_total', 1);
    $pipe->hincrby('demo:pubsub:stats', 'delivered_total', $delivered);
    $pipe->hincrby('demo:pubsub:channel_published', $channel, 1);
    $pipe->execute();

    return $delivered;
}
```

The integer returned by `PUBLISH` is what Redis itself reports — the number of subscribers (direct and pattern) that received the message in that call. It's a useful sanity check that the channel name is actually being listened to: a steady stream of `0`s means you have a typo somewhere or your subscriber crashed.

Counters live in Redis (under `demo:pubsub:stats`) rather than as object properties because every HTTP request runs in its own PHP process under `php -S`. An object property would be reset on every request.

## Subscribing to channels

`subscribe()` spawns a `subscriber_worker.php` process that owns its own Redis connection and runs the pub/sub loop:

```php
public function subscribe(string $name, array $channels): array
{
    return $this->register($name, $channels, false);
}

private function register(string $name, array $targets, bool $isPattern): array
{
    // Stake the name atomically so two concurrent /subscribe calls
    // can't both spawn a worker for the same subscription.
    if (!$this->redis->hsetnx($this->metaKey($name), 'name', $name)) {
        throw new InvalidArgumentException("subscription named '{$name}' already exists");
    }
    $this->redis->hset($this->metaKey($name),
        'kind',           $isPattern ? 'pattern' : 'channel',
        'targets',        implode(',', $targets),
        'is_pattern',     $isPattern ? '1' : '0',
        'created_at_ms',  (string) self::nowMs(),
        'received_total', '0'
    );
    $pid = $this->spawnWorker($name, $isPattern ? 'pattern' : 'channel', $targets);
    $this->redis->set($this->pidKey($name), (string) $pid);
    $this->waitForSubscription($name, $isPattern, $targets);
    return $this->getSubscription($name) ?? [];
}
```

`HSETNX` on the metadata hash gives the helper an atomic "claim this name" without a separate lock key. After the name is staked, the rest of the metadata is filled in and the worker is spawned.

`waitForSubscription()` polls `PUBSUB NUMSUB` (or `PUBSUB NUMPAT`) for up to two seconds so a `publish()` that follows immediately after `subscribe()` doesn't race the worker's `SUBSCRIBE` call — without it, a fast-fire publish could land before the worker socket reached subscribe-only mode.

### Spawning a detached worker

Spawning a worker from a PHP request handler is more delicate than it looks. The `php -S` development server keeps its listening socket open in every child it forks or execs from a request handler — if the worker inherits that FD, the dev server's port gets a phantom listener that can hijack new connections, *and* the worker can't be killed cleanly. There are two defences:

```php
$workerArgs = [
    $this->phpBinary, $this->workerScript,
    '--name', $name,
    '--kind', $kind,
    '--target', implode(',', $targets),
    '--redis-host', $this->redisHost,
    '--redis-port', (string) $this->redisPort,
];

if (PHP_OS_FAMILY === 'Darwin') {
    // macOS' setsid has no -f flag. Use a shell wrapper that
    // backgrounds the worker and echoes its PID so we can capture it.
    $escaped = array_map('escapeshellarg', $workerArgs);
    $shellCmd = sprintf('exec %s >>%s 2>&1 </dev/null & echo $!',
        implode(' ', $escaped), escapeshellarg($logFile));
    $args = ['/bin/sh', '-c', $shellCmd];
} else {
    $args = array_merge(['setsid', '-f'], $workerArgs);
}

$descriptorSpec = [
    0 => ['file', '/dev/null', 'r'],
    1 => ['pipe', 'w'],
    2 => ['file', $logFile, 'a'],
];
$proc = proc_open($args, $descriptorSpec, $pipes);
```

* On Linux, `setsid -f` puts the worker into a new session and process group, detached from the dev-server's group.
* On macOS (no `setsid`), a `/bin/sh -c '… & echo $!'` wrapper does the same thing — backgrounds the worker and echoes its PID on stdout for the parent to capture.
* Every standard FD is redirected to a file (or `/dev/null`) so the dev server's accept socket can't leak into the worker.

The same pattern is used in the [job-queue PHP port](../../job-queue/php/) and the [cache-aside PHP port](../../cache-aside/php/) for their respective worker types.

## Inside the subscriber worker

The worker ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/pub-sub/php/subscriber_worker.php)) is a small CLI that connects to Redis, enters `pubSubLoop()`, and writes each received message to the per-subscription messages list:

```php
$subRedis = new PredisClient([
    'host' => $opts['redis-host'],
    'port' => $opts['redis-port'],
    'read_write_timeout' => 0,  // never time out the subscribe socket
]);
$writeRedis = new PredisClient([
    'host' => $opts['redis-host'],
    'port' => $opts['redis-port'],
]);

$loop = $subRedis->pubSubLoop();
if ($kind === 'pattern') {
    $loop->psubscribe(...$targets);
} else {
    $loop->subscribe(...$targets);
}

foreach ($loop as $event) {
    if ($event->kind === 'message' || $event->kind === 'pmessage') {
        $record = [
            'channel'        => $event->channel,
            'pattern'        => $event->kind === 'pmessage' ? $event->pattern : null,
            'payload'        => json_decode($event->payload, true) ?? $event->payload,
            'received_at_ms' => (int) round(microtime(true) * 1000),
        ];
        $pipe = $writeRedis->pipeline();
        $pipe->lpush($messagesKey, [json_encode($record, JSON_UNESCAPED_SLASHES)]);
        $pipe->ltrim($messagesKey, 0, $bufferSize - 1);
        $pipe->hincrby($metaKey, 'received_total', 1);
        $pipe->execute();
    }
}
```

A few details matter here:

* **Two Redis clients per worker.** Once Predis enters `pubSubLoop()`, the underlying connection is in subscribe-only mode — sending an `LPUSH` on the same connection fails with `ERR Can't execute 'lpush': only (P|S)SUBSCRIBE / (P|S)UNSUBSCRIBE / PING / QUIT / RESET are allowed in this context`. The worker therefore keeps a separate `$writeRedis` client for the buffering pipeline. (The reference Python implementation hides this behind `redis-py`'s `PubSub` object, which manages its own dedicated connection internally — but the constraint is the same on the wire.)
* **`read_write_timeout => 0` on the subscribe socket.** A pub/sub loop is supposed to block indefinitely waiting for messages. The default Predis timeout would otherwise drop the connection during quiet periods.
* **SIGTERM is handled with `pcntl_async_signals`.** The hub's `unsubscribe()` sends SIGTERM to the worker. The worker catches it and sets a `$stop` flag, which is checked at the start of every loop iteration — so the worker exits cleanly *after* the next message it receives. For long-quiet subscriptions, the hub falls back to SIGKILL after 80 ms.

## Pattern subscriptions with PSUBSCRIBE

`psubscribe()` works the same way but the worker calls `PSUBSCRIBE` instead of `SUBSCRIBE`:

```php
$hub->psubscribe('all-notifications', ['notifications:*']);
$hub->psubscribe('cache-invalidator', ['cache:invalidate:*']);
```

When a published channel matches a pattern, the worker's `pubSubLoop()` delivers an event with `kind === 'pmessage'` whose `pattern` field carries the matching glob. That distinction is useful for routing: a pattern subscriber can do one thing for the whole hierarchy (e.g., increment a counter) and dispatch on the specific channel within its logic (e.g., "invalidate this region's cache").

## Inspecting active subscribers

Redis exposes a small set of pub/sub introspection commands that report on subscriber state without traversing any keyspace:

```php
$hub->activeChannels();                  // PUBSUB CHANNELS *
$hub->channelSubscriberCounts($chans);   // PUBSUB NUMSUB ch1 ch2 ...
$hub->patternSubscriberCount();          // PUBSUB NUMPAT
```

`PUBSUB CHANNELS` only reports channels with at least one *exact-match* subscriber — pattern subscribers do not appear here. That's a deliberate Redis design choice: a glob like `*` would otherwise show up as a subscriber to every conceivable channel. `PUBSUB NUMPAT` covers the pattern side as a single global count.

Predis 3.x doesn't expose dedicated PHP helpers for these commands, so the hub sends them via `executeRaw(['PUBSUB', 'CHANNELS', $pattern])` — a clean fallback for any command the client doesn't model directly.

## Stats and history

`stats()` reads the publish counters from Redis and sums received counts across every active subscription:

```php
public function stats(): array
{
    $pipe = $this->redis->pipeline();
    $pipe->hgetall('demo:pubsub:stats');
    $pipe->hgetall('demo:pubsub:channel_published');
    [$stats, $perChannel] = $pipe->execute();

    $receivedTotal = 0;
    foreach ($this->subscriptionNames() as $name) {
        $receivedTotal += (int) $this->redis->hget($this->metaKey($name), 'received_total');
    }

    return [
        'published_total'       => (int) ($stats['published_total'] ?? 0),
        'delivered_total'       => (int) ($stats['delivered_total'] ?? 0),
        'received_total'        => $receivedTotal,
        'active_subscriptions'  => count($this->subscriptionNames()),
        'channel_published'     => $perChannel,
        'pattern_subscriptions' => $this->patternSubscriberCount(),
    ];
}
```

`delivered_total` is what Redis itself counted; `received_total` is what the workers have logged into their per-subscription Redis lists. In a single-process demo they should track each other closely — a sustained divergence usually means a worker crashed while a publisher kept publishing. (Pub/sub is at-most-once: if your subscriber wasn't connected at publish time, the message is gone.)

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for plain `PUBLISH`/`SUBSCRIBE`; `PUBSUB NUMPAT` is older than that.
* PHP 8.1 or later, with the `posix` and `pcntl` extensions enabled (both ship with the official PHP binary on macOS and most Linux distros).
* The Predis client (3.x). Install it with [Composer](https://getcomposer.org/):

  ```bash
  composer require "predis/predis:^3.0"
  ```

## Running the demo

### Get the source files

The demo consists of four files plus the Composer manifest. Download them from the [`php` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/pub-sub/php) on GitHub, or grab them with `curl`:

```bash
mkdir pub-sub-demo && cd pub-sub-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/pub-sub/php
curl -O $BASE/PubSubHub.php
curl -O $BASE/subscriber_worker.php
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
php -S 127.0.0.1:8101 demo_server.php
```

You should see:

```text
[...] PHP 8.4.6 Development Server (http://127.0.0.1:8101) started
```

Open [http://127.0.0.1:8101](http://127.0.0.1:8101) in a browser. You can:

* Publish messages of any text to any channel name in any batch size.
* Add named subscribers that listen on either a specific channel (`orders:new`) or a glob pattern (`notifications:*`). A single subscriber can listen on multiple targets — enter them comma-separated.
* Watch each subscriber's incoming-message panel update every 800 ms (the data is read out of Redis on every poll, since the workers live in separate PHP processes).
* See the server-side view: `PUBSUB CHANNELS` lists exact-match channels with subscribers, `PUBSUB NUMSUB` gives per-channel counts, and `PUBSUB NUMPAT` counts active pattern subscriptions.
* Click **Reset** to drop every subscription, zero the counters, and re-seed the three default subscribers.

The first time the server handles a request, it seeds three default subscriptions (`orders-listener`, `billing-listener`, `all-notifications`). A flag in Redis (`demo:pubsub:seeded`) prevents the seed from re-running on every request, so `unsubscribe` doesn't get immediately undone; defaults come back when you click **Reset**.

If your Redis server is running elsewhere, set `REDIS_HOST` and `REDIS_PORT` before launching the server:

```bash
REDIS_HOST=redis.local REDIS_PORT=6380 php -S 127.0.0.1:8101 demo_server.php
```

### Stopping the demo cleanly

`php -S` doesn't run a shutdown handler when you Ctrl-C out of it, so the subscriber worker processes — which are *intentionally* detached so they survive request boundaries — will outlive the demo server unless you stop them first. Before stopping the server, click **Reset** in the UI (which calls `$hub->shutdown()` and kills every worker), or run:

```bash
curl -X POST http://127.0.0.1:8101/reset
```

If you forgot, clean up by name:

```bash
pgrep -f subscriber_worker.php | xargs kill
redis-cli --scan --pattern 'demo:pubsub:*' | xargs redis-cli del
```

## Production usage

### Why this PHP port differs from the others

Every other client in this use case keeps subscribers as in-process objects with a background thread (Python's `run_in_thread`, .NET's `IConnectionMultiplexer.Subscribe`, Node's `subscriber.on('message', ...)`, Go's `<-ch`, etc.). That works because those runtimes have a long-lived server process that owns the subscriber's connection, callback, and dispatch loop.

PHP's traditional one-process-per-request model — used by `php -S`, mod_php, PHP-FPM with the default `pm` setting — fundamentally doesn't fit that shape. A subscriber created inside an HTTP handler dies the moment the handler returns. Even if you used a long-running PHP daemon (Roadrunner, Swoole, ReactPHP), you'd still need separate worker processes if you wanted multiple independent subscribers, because Predis's `pubSubLoop()` blocks the calling process.

This port keeps each subscriber as a **separate OS process**, with its full state (PID, received counter, message buffer) persisted in Redis. Every HTTP request reconstructs its view of the subscriber registry from those keys. The pattern is closer to how a real production PHP application would run pub/sub: a `supervisord`, `systemd`, or container orchestrator drives N copies of `subscriber_worker.php`, each owning one logical subscription, and the web tier never tries to host a subscriber itself. The demo just inlines the supervision (via `proc_open` + `posix_kill`) so a single `php -S` command is enough to play with the pattern end-to-end.

### Pub/sub is at-most-once — pair it with durable state if you need replay

A subscriber that's offline when a message is published misses it permanently. For events you can't afford to lose, write the durable record (the order row, the cache key version, the audit log entry) to its primary store, then `PUBLISH` a notification so live consumers can pick it up immediately. On reconnect, consumers reconcile by reading the durable store, not by waiting for missed pub/sub messages. If you actually need replay or at-least-once delivery, switch to [Redis Streams]({{< relref "/develop/data-types/streams" >}}) with consumer groups.

### Use a separate connection per subscriber (and a *second* one for any non-pubsub work)

Predis's `pubSubLoop()` puts its connection into subscribe-only mode: ordinary commands (`GET`, `HSET`, `LPUSH`, etc.) on the same connection will fail with `ERR Can't execute 'lpush': only (P|S)SUBSCRIBE / ...`. The worker in this demo therefore keeps two `Predis\Client` instances — `$subRedis` for the loop and `$writeRedis` for the receive-buffering pipeline. The same rule applies in production: any work the subscriber needs to do as a result of a received message (writing to a key, publishing a follow-up event, hitting a downstream API) must go through a separate connection.

### Choose a topic naming convention up front

A flat namespace gets ugly fast — `email`, `email_high_priority`, `email_high_priority_billing`. Pick a colon-separated hierarchy (`notifications:billing:invoice`, `cache:invalidate:products:p-001`) so consumers can subscribe at the right level: a billing service uses `notifications:billing:*`, the audit logger uses `notifications:*`. Glob patterns are evaluated for every published message, so don't go wild with multiple wildcards on hot paths — `*:*:*` matches everything and costs more than a flat `notifications:*` would.

### Don't do heavy work in the message-handling loop

The worker reads messages from a single socket. If the per-message work blocks (synchronous HTTP call, big computation, slow DB write), the next message waits behind it and the subscriber's effective throughput drops to whatever the work's latency is. For heavier work, push the message onto a Redis [list]({{< relref "/develop/data-types/lists" >}}) or [stream]({{< relref "/develop/data-types/streams" >}}) and let a separate pool of workers consume it — exactly the pattern in the [job-queue use case]({{< relref "/develop/use-cases/job-queue" >}}).

### Tune the subscriber message buffer for your traffic shape

The demo caps each subscriber's Redis-side message list at 50 (via `LTRIM 0 49`). That's right for showing the recent activity in a UI, but a real subscriber typically processes each message and discards it — the buffer is only there for human inspection. If you keep a buffer, make sure it's bounded; an unbounded `LPUSH` on a chatty pattern subscriber will eventually OOM Redis.

### Sharded pub/sub on a Redis Cluster

On a Redis Cluster, plain `PUBLISH` fans every message out to every node via the cluster bus, which becomes a hotspot at high throughput. Redis 7.0 added [sharded pub/sub]({{< relref "/develop/pubsub#sharded-pubsub" >}}): channels are hashed to slots, and `SPUBLISH` / `SSUBSCRIBE` only touch the shard that owns the slot. If you're scaling pub/sub on a cluster, prefer the sharded commands and pick channel names whose hash distribution matches your traffic. Predis 3.x exposes both via `ssubscribe()` on the pub/sub loop and `executeRaw(['SPUBLISH', ...])`.

### Inspect pub/sub state directly in Redis

Because pub/sub has no keyspace, `KEYS`/`SCAN` won't show you the routing table. Use the introspection commands instead:

```bash
# Which channels currently have at least one exact-match subscriber?
redis-cli pubsub channels '*'

# How many subscribers does each channel have?
redis-cli pubsub numsub orders:new notifications:billing chat:lobby

# How many active pattern subscriptions across the whole server?
redis-cli pubsub numpat

# Subscribe interactively from the CLI to watch traffic on a pattern.
redis-cli psubscribe 'orders:*'
```

`redis-cli` in subscribe mode only exits with `Ctrl-C` — it can't issue any other commands while subscribed.

The demo's own bookkeeping (PIDs, message buffers, counters) lives under regular keys, so you *can* inspect that with `SCAN`:

```bash
# Every key the demo owns.
redis-cli --scan --pattern 'demo:pubsub:*'

# Recent messages received by a specific subscriber.
redis-cli lrange demo:pubsub:sub:orders-listener:messages 0 9

# Worker PIDs.
redis-cli --scan --pattern 'demo:pubsub:sub:*:pid' \
  | while read k; do echo "$k = $(redis-cli get "$k")"; done
```

## Learn more

This example uses the following Redis commands:

* [`PUBLISH`]({{< relref "/commands/publish" >}}) to fan a message out to every subscriber of a channel.
* [`SUBSCRIBE`]({{< relref "/commands/subscribe" >}}) and [`UNSUBSCRIBE`]({{< relref "/commands/unsubscribe" >}}) for exact-match topic subscriptions.
* [`PSUBSCRIBE`]({{< relref "/commands/psubscribe" >}}) and [`PUNSUBSCRIBE`]({{< relref "/commands/punsubscribe" >}}) for glob-style pattern subscriptions.
* [`PUBSUB CHANNELS`]({{< relref "/commands/pubsub-channels" >}}) to list channels with at least one active exact-match subscriber.
* [`PUBSUB NUMSUB`]({{< relref "/commands/pubsub-numsub" >}}) to count subscribers per named channel.
* [`PUBSUB NUMPAT`]({{< relref "/commands/pubsub-numpat" >}}) to count active pattern subscriptions server-wide.
* [`LPUSH`]({{< relref "/commands/lpush" >}}), [`LTRIM`]({{< relref "/commands/ltrim" >}}), and [`LRANGE`]({{< relref "/commands/lrange" >}}) for the per-subscriber recent-message buffers.
* [`HSET`]({{< relref "/commands/hset" >}}), [`HGETALL`]({{< relref "/commands/hgetall" >}}), and [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the cross-request stats and per-subscription meta.

See the [Predis README](https://github.com/predis/predis) for full client reference, including the [pub/sub consumer](https://github.com/predis/predis/blob/main/src/Consumer/PubSub/Consumer.php) returned by `pubSubLoop()`.
