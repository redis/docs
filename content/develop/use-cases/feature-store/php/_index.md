---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in PHP with Predis
linkTitle: Predis example (PHP)
title: Redis feature store with Predis
weight: 9
---

This guide shows you how to build a small Redis-backed online feature store
in PHP with [Predis]({{< relref "/develop/clients/php" >}}). The demo runs
on top of PHP's built-in development server (`php -S`) and uses a detached
CLI process for the streaming worker, so you can bulk-load a batch of users
with a key-level TTL, watch real-time features expire per-field via
`HEXPIRE`, retrieve any subset of features for one user under 2 ms, and
pipeline `HMGET` across a hundred users for batch scoring.

## Overview

Each entity (here, a user) is one Redis
[Hash]({{< relref "/develop/data-types/hashes" >}}) at a deterministic key —
`fs:user:{id}`. The hash holds every feature for that entity as one field per
feature: batch-materialized aggregates (refreshed once a day) alongside
streaming-updated signals (refreshed every few seconds). One
[`HMGET`]({{< relref "/commands/hmget" >}}) returns whichever subset the
model needs in one network round trip.

Two TTL layers solve the *mixed staleness* problem without an
application-side cleaner:

* A **key-level** [`EXPIRE`]({{< relref "/commands/expire" >}}) aligned with
  the batch materialization cycle (24 hours in the demo). If the batch
  refresher fails, the whole entity disappears at the next cycle and
  inference sees a missing entity — which the model handler can detect and
  fall back on — rather than silently outdated values.
* A **per-field** [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) (Redis 7.4+)
  on each streaming feature gives that field its own shorter expiry,
  independent of the rest of the hash. If the streaming pipeline stops
  updating a feature, the field self-cleans while the batch fields stay
  populated.

That gives you:

* A single round trip for retrieval — any subset of features for one entity
  in one [`HMGET`]({{< relref "/commands/hmget" >}}).
* Sub-millisecond hot path. The Redis-side work is microseconds; in
  practice the bottleneck is the network round trip plus the model's own
  feature-prep.
* Pipelined batch scoring — one round trip for `N` users at once.
* Independent freshness per feature, expressed as a server-side TTL rather
  than as application logic.
* Self-cleanup on pipeline failure: a stalled batch refresher lets entities
  expire on schedule, and a stalled streaming worker lets each affected
  field expire on its own timer.

## How PHP's request model shapes the demo

PHP's hosting model is different from every other client in this use case.
`php -S` gives each request a fresh PHP execution context, so a long-lived
streaming worker can't live inside the demo router the way it does in
Python, Node.js, Go, or Java. The demo handles this by spawning the
streaming worker as a **separate, detached CLI process** the first time
the demo server is hit. The router and the worker then share state through
Redis itself:

* `fs:control:worker_pid` — PID of the running worker. The router checks
  it on every request and respawns the worker if the PID is no longer
  alive.
* `fs:control:paused` — `1` while paused, `0` otherwise. The worker polls
  this between ticks.
* `fs:control:tick_in_flight` — set by the worker *before* each tick and
  cleared after. The router's `/reset` handler waits for this to flip to
  `0` before it issues the `DEL` sweep.
* `fs:control:tick_count` / `fs:control:writes_count` — counters the
  router reads to populate the UI.
* `fs:control:stop` — graceful-shutdown flag the worker checks each tick.

This is the same race-free pause-and-wait-idle pattern as every other
client; it's just implemented through Redis primitives because there's no
shared memory between the router and the worker.

Predis-specific notes:

* Predis 3 ships typed `hexpire()` and `httl()` methods. The helper uses
  them directly. `HEXPIRE` returns one status code per field (`1` set,
  `2` deleted because TTL was 0/past, `0` conditional flag not met, `-2`
  no such field/key).
* Predis 3's `hset()` accepts variadic `field, value, field, value, ...`
  pairs but **not** a single field=>value map argument the way Predis 2
  did. The helper flattens the encoded map and spreads it:
  `$pipe->hset($key, ...$flat)`.

## How it works

There are three paths: a **batch path** that bulk-loads features once per
materialization cycle, a **streaming path** that updates real-time features
as events arrive, and an **inference path** that reads features on the
request side.

### Batch path (per materialization cycle)

1. The batch job calls `BuildFeatures::synthesizeUsers($count, $seed)`
   (in production, the equivalent computation lives in an offline
   pipeline against the warehouse). The result is
   `array<string, array<string, mixed>>` keyed by user ID.
2. `$store->bulkLoad($rows, $ttlSeconds)` queues one
   [`HSET`]({{< relref "/commands/hset" >}}) plus one
   [`EXPIRE`]({{< relref "/commands/expire" >}}) per user through
   `$redis->pipeline(function ($pipe) { ... })`, so the whole batch ships
   in a single round trip.

### Streaming path (per tick)

The detached `streaming_worker.php` process polls Redis once per tick and
calls `$store->updateStreaming($userId, $fields)` for a handful of random
users. That queues:

1. An [`HSET`]({{< relref "/commands/hset" >}}) writing the new field
   values. Redis is single-threaded per shard, so this is atomic against
   any concurrent batch write on the same hash — no version columns, no
   locks.
2. An [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) over exactly the
   fields that were written, with the streaming TTL. Each streaming field
   carries its own per-field expiry independent of the rest of the hash.
   Pause the worker (or stop it entirely) and these fields drop out one
   by one as their TTLs elapse, while the batch fields remain populated
   under the longer key-level TTL.

### Inference path (per HTTP request)

1. The model server picks the feature subset it needs (the schema is
   owned by the model, not the store).
2. It calls `$store->getFeatures($userId, $names)`, which is one
   [`HMGET`]({{< relref "/commands/hmget" >}}). Redis returns the values
   in the same order as the requested fields, with `null` for any field
   that doesn't exist (or has expired).
3. For batch inference, the model server calls
   `$store->batchGetFeatures($userIds, $names)`, which pipelines one
   [`HMGET`]({{< relref "/commands/hmget" >}}) per user across all `N`
   users in a single network round trip.

### Project layout

```text
feature-store/php/
├── composer.json           — predis/predis ^3, PHP >= 8.1
├── FeatureStore.php        — FeatureStore class
├── StreamingWorker.php     — worker tick loop (used by the CLI process)
├── BuildFeatures.php       — synthesize_users + helpers
├── build_features.php      — CLI entry point for the materializer
├── streaming_worker.php    — CLI entry point for the worker process
├── demo_server.php         — php -S router (HTTP routes + worker spawn)
└── demo_template.html      — HTML page, loaded by file_get_contents
```

Run the demo with `composer install && composer start`, or directly:
`php -S 127.0.0.1:8094 demo_server.php`.

## The feature-store helper

The `FeatureStore` class wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/php/FeatureStore.php)):

```php
<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/FeatureStore.php';

use Predis\Client;

$redis = new Client('tcp://127.0.0.1:6379');
$store = new FeatureStore(
    $redis,
    keyPrefix: 'fs:user:',
    batchTtlSeconds: 24 * 60 * 60,    // whole-entity TTL aligned with the daily batch cycle
    streamingTtlSeconds: 5 * 60,      // per-field TTL on each streaming feature
);

// Batch materialization: one HSET + EXPIRE per user, all pipelined.
$store->bulkLoad([
    'u0001' => [
        'country_iso' => 'US', 'risk_segment' => 'low',
        'tx_count_7d' => 14, 'avg_amount_30d' => 92.40,
        'account_age_days' => 612, 'chargeback_count_180d' => 0,
    ],
], 24 * 60 * 60);

// Streaming write: HSET + HEXPIRE on just the fields that changed.
$store->updateStreaming('u0001', [
    'last_login_ts' => (int)(microtime(true) * 1000),
    'last_device_id' => 'ios-9f02',
    'tx_count_5m' => 3,
    'failed_logins_15m' => 0,
    'session_country' => 'US',
], 5 * 60);

// Inference read: HMGET of whatever the model needs.
$features = $store->getFeatures('u0001', [
    'risk_segment', 'tx_count_7d', 'avg_amount_30d',
    'tx_count_5m', 'failed_logins_15m',
]);

// Batch scoring: pipelined HMGET across many users.
$batch = $store->batchGetFeatures(
    ['u0001', 'u0002', 'u0003'],
    ['risk_segment', 'tx_count_5m', 'failed_logins_15m'],
);
```

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis
hash fields are bytes on the wire, so the helper encodes booleans as
`'true'` / `'false'` (`FeatureStore::encodeValue()`) and uses
`(string)$value` for everything else. The model server is responsible
for parsing back to the right type, the same way it would when reading
any serialized feature store.

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

`bulkLoad` queues one `HSET` and one `EXPIRE` per user through
`$redis->pipeline(...)`, so the whole batch ships in a single round trip.

```php
public function bulkLoad(array $rows, ?int $ttlSeconds = null): int
{
    if (count($rows) === 0) return 0;
    $ttl = $ttlSeconds ?? $this->batchTtlSeconds;
    $this->redis->pipeline(function ($pipe) use ($rows, $ttl) {
        foreach ($rows as $entityId => $fields) {
            $key = $this->keyFor((string)$entityId);
            // Predis 3's `hset` accepts variadic field/value pairs
            // (key, f1, v1, f2, v2, ...) but not a single field=>value
            // map argument the way Predis 2 did — flatten the encoded
            // map into that shape.
            $flat = [];
            foreach ($fields as $name => $value) {
                $flat[] = $name;
                $flat[] = self::encodeValue($value);
            }
            $pipe->hset($key, ...$flat);
            $pipe->expire($key, $ttl);
        }
    });
    ...
}
```

`$redis->pipeline(callable)` is a non-transactional batch: commands queue
up and ship in one round trip but they don't run inside a `MULTI/EXEC`
block. That's the right choice here because each user's `HSET` +
`EXPIRE` pair is independent of every other user's. For the rare case
where the pair has to be inseparable, use `$redis->transaction(...)` (or
a Lua script via [`EVAL`]({{< relref "/commands/eval" >}}) /
[Eval scripting]({{< relref "/develop/programmability/eval-intro" >}})).

In production, the equivalent of this script runs as an offline pipeline
(a Spark or Feast `materialize` job) that reads from the warehouse and
writes into Redis. The
[Feast `RedisOnlineStore`](https://docs.feast.dev/reference/online-stores/redis)
provider does exactly this under the hood; the in-house
[Redis Feature Form]({{< relref "/develop/ai/featureform" >}}) integration
covers the materialize + serve path end-to-end.

### Streaming writes with per-field TTL

`updateStreaming` is the linchpin of the mixed-staleness story:

```php
public function updateStreaming(string $entityId, array $fields, ?int $ttlSeconds = null): void
{
    if (count($fields) === 0) return;
    $ttl = $ttlSeconds ?? $this->streamingTtlSeconds;
    $key = $this->keyFor($entityId);
    $flat = [];
    $names = [];
    foreach ($fields as $name => $value) {
        $names[] = $name;
        $flat[] = $name;
        $flat[] = self::encodeValue($value);
    }

    $results = $this->redis->pipeline(function ($pipe) use ($key, $flat, $names, $ttl) {
        $pipe->hset($key, ...$flat);
        $pipe->hexpire($key, $ttl, $names);
    });
    $codes = $results[1] ?? [];
    foreach ($codes as $code) {
        if ((int)$code !== 1) {
            throw new RuntimeException(
                "HEXPIRE did not set every field TTL for {$key}: " . json_encode($codes)
            );
        }
    }
    ...
}
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on
*individual* hash fields, not on the whole key. The two commands are
queued in the same `pipeline` callback so Redis runs them in order: the
`HSET` first creates or overwrites the fields, then `HEXPIRE` attaches a
TTL to each of those same fields. `hexpire()` returns one status code
per field:

* `1` — TTL set / updated.
* `2` — the expiry was 0 or in the past, so Redis deleted the field
  instead of applying a TTL.
* `0` — an `NX | XX | GT | LT` conditional flag was specified and not
  met (we never use one here).
* `-2` — no such field, or no such key.

The helper throws if any code is anything other than `1`, so the "every
streaming write renews its TTL" invariant fails loudly rather than
silently leaving a streaming field with no expiry attached.

If a streaming pipeline stops, the streaming fields drop out one by one
as their per-field TTLs elapse. `fieldTtlsSeconds` (which wraps `httl()`)
lets the model side inspect the remaining TTL on any field — useful
both for debugging and as a freshness signal in the model itself.

> **HEXPIRE requires Redis 7.4 or later.** `HEXPIRE` and the field-level
> TTL commands were added in Redis 7.4. Predis 3.0 was the first major
> release with the typed bindings; the demo's `composer.json` pins
> `^3.0`.

### Inference reads with HMGET

`getFeatures` is one `HMGET`:

```php
public function getFeatures(string $entityId, ?array $fieldNames): array
{
    $key = $this->keyFor($entityId);
    if ($fieldNames === null) {
        return $this->redis->hgetall($key);
    }
    if (count($fieldNames) === 0) return [];
    $values = $this->redis->hmget($key, $fieldNames);
    $out = [];
    foreach ($fieldNames as $i => $n) {
        if ($values[$i] !== null) $out[$n] = (string)$values[$i];
    }
    return $out;
}
```

The model knows exactly which features it consumes, so the request path
always takes the `hmget` branch with an explicit field list — that's
the sub-millisecond path. `hgetall` is the right call for debugging
(which is what the demo's "Inspect" panel does) but not for serving:
it forces Redis to serialize every field, including ones the model
doesn't need.

Fields that don't exist (because they were never written, or because
they expired) come back as `null`. The helper drops them from the
result array so the caller sees only the features that are actually
available.

### Batch scoring with pipelined HMGET

For batch inference, the same `HMGET` shape pipelines across users:

```php
public function batchGetFeatures(array $entityIds, array $fieldNames): array
{
    if (count($entityIds) === 0 || count($fieldNames) === 0) return [];
    $rows = $this->redis->pipeline(function ($pipe) use ($entityIds, $fieldNames) {
        foreach ($entityIds as $id) {
            $pipe->hmget($this->keyFor($id), $fieldNames);
        }
    });
    ...
}
```

One round trip for the whole batch. The demo regularly returns a
30-user batch in ~1 ms against a local Redis.

A Redis Cluster is different: a single `pipeline()` block ships through
one connection to one node. For batch reads on a cluster, configure
Predis with a cluster connection profile and fan out parallel
non-pipelined `hmget` calls (the cluster client routes each one to the
right shard), or group entity IDs by hash slot and run one pipeline
against each shard's node-connection in parallel. A hash tag like
`fs:user:{vip}:u0001` forces a known set of keys onto the same shard
so one pipeline can cover them all in a single round trip.

## The streaming worker

`streaming_worker.php` is a small CLI shim that loads `StreamingWorker`
and runs its tick loop until the demo server flips
`fs:control:stop` to `1` (or SIGTERM lands). The class itself lives in
`StreamingWorker.php`
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/php/StreamingWorker.php)):

```php
public function run(): void
{
    $this->redis->set('fs:control:worker_pid', (string)getmypid());
    $this->redis->set('fs:control:running', '1');
    // SIGTERM / SIGINT trap so the demo server's shutdown path
    // can cleanly kill us via `posix_kill($pid, SIGTERM)`.
    ...
    try {
        while (true) {
            if ($this->redis->get('fs:control:stop') === '1') break;
            $this->microsleep($this->tickSeconds);
            if ($this->redis->get('fs:control:stop') === '1') break;
            // Set tick_in_flight *before* the pause check so a
            // concurrent pause + wait_for_idle (reset path) can
            // never observe tick_in_flight=0 in the window between
            // the pause check and the actual tick call.
            $this->redis->set('fs:control:tick_in_flight', '1');
            try {
                if ($this->redis->get('fs:control:paused') !== '1') {
                    $this->doTick();
                }
            } catch (\Throwable $e) {
                fwrite(STDERR, "[streaming-worker] tick failed: " . $e->getMessage() . "\n");
            } finally {
                $this->redis->set('fs:control:tick_in_flight', '0');
            }
        }
    } finally {
        // Clear running, tick_in_flight, stop no matter how the loop
        // exits so a later restart can spin a fresh worker with a
        // clean slate.
        $this->redis->del(...[
            'fs:control:running', 'fs:control:tick_in_flight',
            'fs:control:worker_pid', 'fs:control:stop',
        ]);
    }
}
```

The pre-flight `tick_in_flight = 1` before the pause check, and the
outer `finally` block that clears every control key on every exit
path, are the same correctness levers as every other client in this
use case. The only difference is that the flags live in Redis rather
than in process memory.

The demo server's `/reset` handler reads the same Redis keys: it sets
`fs:control:paused = 1`, polls `fs:control:tick_in_flight` until it
sees `0`, then issues the `DEL` sweep. That's the cross-process
equivalent of `worker.pause() + worker.wait_for_idle()` in the
single-process clients.

`demo_server.php` spawns the worker on the first request with
`nohup ... &` (detached so it survives the per-request `php -S`
process) and checks `pid_alive($pid)` on every subsequent request.
If the worker has died, it's respawned on the next request.

To shut the worker down cleanly from outside the demo (the detached
process isn't tied to the foreground `php -S`), flip the stop flag
with `redis-cli`:

```bash
redis-cli SET fs:control:stop 1
```

The worker's tick loop checks `fs:control:stop` at the top of every
iteration and exits, clearing every `fs:control:*` key on the way
out so the next demo run starts from a clean slate.

## The batch builder

`build_features.php` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/php/build_features.php)).
It generates synthetic feature rows and calls `$store->bulkLoad()`
once. The synthesis itself is not the point — in a real deployment the
equivalent code reads from the offline store (Snowflake, BigQuery,
Iceberg) and writes the resulting hashes into Redis.

Run the builder on its own (independently of the demo server) to
populate Redis from the command line:

```bash
php build_features.php --count 500 --ttl-seconds 3600
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL,
which is how a typical operator would pre-seed a feature store from
the command line when debugging.

## The interactive demo

`demo_server.php` runs as a router script under `php -S` on port 8094.
The HTML page (loaded via `file_get_contents` from
`demo_template.html`) lets you:

* **Bulk-load** any number of users (default 200) with a configurable
  key-level TTL.
* See the **store state**: user count, batch / streaming TTLs,
  cumulative read/write counters.
* See the **streaming worker** status and **pause or resume** it. The
  pause flag goes into Redis at `fs:control:paused`; the detached
  worker process reads it between ticks.
* Run an **inference read** for any user with a chosen feature subset,
  and see the value, the per-field TTL, and the read latency.
* Run **batch scoring** with a pipelined `HMGET` across `N` users.
* **Inspect** any user's full hash with field-level TTLs and the
  key-level TTL.

Endpoints:

| Endpoint                  | What it does                                                                        |
|---------------------------|-------------------------------------------------------------------------------------|
| `GET  /state`             | User count, TTL config, stats counters, worker status.                              |
| `POST /bulk-load`         | Pipelined `HSET` + `EXPIRE` over N synthetic users with a chosen TTL.               |
| `POST /worker/toggle`     | Pause / resume the streaming worker.                                                |
| `POST /read`              | `HMGET` a chosen feature subset for one user; report latency and per-field TTLs.    |
| `POST /batch-read`        | Pipeline `HMGET` across N users; report total latency and per-entity field counts.  |
| `GET  /inspect`           | `HGETALL` + `HTTL` for one user; full hash view with per-field TTLs.                |
| `POST /reset`             | Drop every user under the key prefix (used by the demo's reset button).             |

> **PHP's `$_POST` doesn't preserve repeated keys.** The demo's `/read`
> and `/batch-read` handlers parse the raw `php://input` body
> manually via `parse_multi_form()` so the model can request several
> features in one call (`field=a&field=b&field=c`). PHP's built-in
> form-parsing would keep only the last `field=` value.

## Prerequisites

* **Redis 7.4 or later.** [`HEXPIRE`]({{< relref "/commands/hexpire" >}})
  and [`HTTL`]({{< relref "/commands/httl" >}}) were added in Redis 7.4;
  the demo relies on per-field TTL for the mixed-staleness story.
* **PHP 8.1 or later.** The demo uses readonly properties, named
  arguments, and first-class callable syntax.
* **Predis 3.0 or later.** The demo's `composer.json` pins `^3.0`.
  Typed bindings for the field-TTL commands ship from 3.0.
* **A POSIX shell environment** for the worker spawn (`nohup`,
  `posix_kill`). The demo has been tested on macOS and Linux; Windows
  would need a different process-detach approach.

If your Redis server is running elsewhere, start the demo with
`REDIS_URI=tcp://host:port php -S 127.0.0.1:8094 demo_server.php`.

## Running the demo

### Get the source files

The demo lives in a small Composer project under
[`feature-store/php`](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/php).
Clone the repo or copy the directory:

```bash
git clone https://github.com/redis/docs.git
cd docs/content/develop/use-cases/feature-store/php
composer install
```

### Start the demo server

From the project directory:

```bash
composer start
# or, equivalently:
php -S 127.0.0.1:8094 demo_server.php
```

The first request to the server triggers the one-time bootstrap
(reset + seed the store, spawn the streaming worker). You should see:

```text
[Mon Jun  1 ...] PHP 8.4 Development Server (http://127.0.0.1:8094) started
[Mon Jun  1 ...] 127.0.0.1:... Accepted
```

Open [http://127.0.0.1:8094](http://127.0.0.1:8094). Useful things to
try:

* Pick a user and click **Read features** with a mixed batch/streaming
  subset — you'll see batch fields with no per-field TTL (covered by
  the key-level TTL) and streaming fields with a positive per-field
  TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a
  100-user batch read.
* Click **Pause / resume** on the streaming worker and leave it
  paused for ~5 minutes (or restart the server with
  `STREAMING_TTL_SECONDS=30` to make it visible in seconds). Re-run
  **Read features** on any user and watch the streaming fields
  disappear while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level
  TTLs.
* Click **Reset** to drop every user and start over.

## Production usage

The guidance below focuses on the production concerns specific to
running a feature store on Redis. For the generic Predis production
checklist — connection options,
[transactions and pipelining]({{< relref "/develop/clients/php/transpipe" >}}),
TLS, AUTH, error handling — see the
[Predis client guide]({{< relref "/develop/clients/php" >}}) and the
[connect recipe]({{< relref "/develop/clients/php/connect" >}}).

### Don't run `php -S` in production

The built-in PHP development server is single-threaded and not
production-grade. A real deployment runs PHP-FPM behind nginx or
Apache, with the streaming worker as a separate systemd / supervisord /
Kubernetes-cron-job process. The router script in `demo_server.php` is
shaped for the demo; for production, extract the route handlers into a
proper PHP framework (Symfony, Laravel, Slim) that pools `Predis\Client`
connections per-worker.

### Pick the batch TTL to outlast a failed refresher

The whole-entity `EXPIRE` is your safety net against silent staleness
from a broken batch pipeline. Set it longer than your worst-case batch
outage so a single missed run doesn't take the feature store offline,
but short enough that a sustained outage causes loud failures (missing
entities) rather than quiet ones (yesterday's features being scored as
today's). The standard choice is one cycle of "expected refresh
interval × 2" — for a daily batch, 48 hours; for a 6-hour batch, 12
hours.

The same logic applies to the per-field streaming TTL: a few times the
expected update interval so a slow-but-alive streaming worker doesn't
churn features needlessly, but short enough that a stalled worker
causes visible freshness failures.

### Co-locate the online store with serving, not with training

The online store's hash representation does *not* have to match the
schema in your offline store. The batch materialization step is your
chance to flatten joins, encode categoricals, and project to whatever
shape the model server wants — so the request path is exactly one
`HMGET` and zero transforms.

The training pipeline reads from the offline store with its own
schema; the serving pipeline reads from Redis with the flattened
serving schema. Keeping those two pipelines as the same code path is
what prevents training-serving skew.

### Run the streaming worker as a real process supervisor

The demo spawns the worker with `nohup ... &` because it's the
simplest portable thing that works under `php -S`. In production,
manage the worker process with systemd / supervisord / Kubernetes —
something that restarts it on crash, captures its logs properly, and
gives you a clean shutdown path. The Redis-backed `fs:control:*`
state (pause flag, in-flight flag, counters) keeps working
unchanged — that's the point of putting it in Redis.

### Make HEXPIRE part of every streaming write

The single biggest correctness lever in this design is that the
streaming write applies `HEXPIRE` *every time*. If a streaming worker
writes a field without renewing its TTL, the field carries whatever
expiry was there before — possibly none, possibly stale — and the
mixed-staleness invariant breaks. Keep the `HSET` and `HEXPIRE` in
the same pipeline (or, even safer, in the same
[Lua script]({{< relref "/develop/programmability/eval-intro" >}}) if
you don't trust the call site).

### Avoid HGETALL on the request path

`HGETALL` reads every field on the hash, including ones the model
doesn't need. With dozens of features per entity, that is wasted
serialization work on the server and wasted bandwidth on the wire.
Always specify the field list explicitly with `hmget` in the model
server.

The exception is debugging and feature-set discovery, where you
genuinely want the full hash. The demo's "Inspect" button uses
`hgetall` for exactly this reason.

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

# Inspect the worker's control state
redis-cli MGET fs:control:worker_pid fs:control:paused \
  fs:control:tick_in_flight fs:control:tick_count
```

A streaming field that returns `-2` from `HTTL` doesn't exist on the
hash (either it was never written, or it expired); `-1` means the
field has no TTL set (and is therefore covered only by the key-level
`EXPIRE`); any positive value is the remaining TTL in seconds.

## Learn more

This example uses the following Redis commands:

* [`HSET`]({{< relref "/commands/hset" >}}) to write a feature or a
  whole feature row in one call.
* [`HMGET`]({{< relref "/commands/hmget" >}}) to retrieve any subset
  of features for one entity in one round trip.
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) for debugging and
  feature-set discovery.
* [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) and
  [`HTTL`]({{< relref "/commands/httl" >}}) for per-field TTL on
  streaming features (Redis 7.4+).
* [`EXPIRE`]({{< relref "/commands/expire" >}}) and
  [`TTL`]({{< relref "/commands/ttl" >}}) for the whole-entity TTL
  aligned with the batch materialization cycle.
* Pipelined `HMGET` across many entities for batch scoring with one
  network round trip — see
  [transactions and pipelining]({{< relref "/develop/clients/php/transpipe" >}}).

See the [Predis documentation]({{< relref "/develop/clients/php" >}})
for the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the
deeper conceptual model.
