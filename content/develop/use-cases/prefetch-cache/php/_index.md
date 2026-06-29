---
aliases:
- /develop/use-cases/prefetch-cache/predis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in PHP with Predis
linkTitle: Predis example (PHP)
title: Redis prefetch cache with Predis
weight: 7
---

This guide shows you how to implement a Redis prefetch cache in PHP with [Predis](https://github.com/predis/predis). It includes a small local web server built on PHP's built-in dev server so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

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

1. **On startup**, the demo server calls `$cache->bulkLoad($primary->listRecords())`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `$cache->get($entityId)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to a Redis list (`demo:primary:changes`). A separate `sync_worker.php` process drains the list with `BRPOP` and calls `$cache->applyChange($event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system, the Redis-list change feed is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/php/Cache.php)):

```php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/Cache.php';
require __DIR__ . '/Primary.php';
require __DIR__ . '/SyncWorker.php';

use Predis\Client as PredisClient;

$redis = new PredisClient(['host' => '127.0.0.1', 'port' => 6379]);
$primary = new MockPrimaryStore($redis);
$cache = new PrefetchCache($redis, 'cache:category:', 3600);

// Pre-load every primary record into Redis in one pipelined round trip.
$cache->bulkLoad($primary->listRecords());

// Spawn the long-running sync_worker.php process.
$supervisor = new SyncWorkerSupervisor($redis, __DIR__ . '/sync_worker.php');
$supervisor->start();

// Read paths now go to Redis only.
[$record, $hit, $redisMs] = $cache->get('cat-001');
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

```php
public function bulkLoad(iterable $records): int
{
    $loaded = 0;
    $pipe = $this->redis->pipeline();
    foreach ($records as $record) {
        $entityId = $record['id'] ?? '';
        if ($entityId === '') {
            continue;
        }
        $cacheKey = $this->cacheKey($entityId);
        $pipe->del([$cacheKey]);
        $pipe->hset($cacheKey, ...self::flattenFields($record));
        $pipe->expire($cacheKey, $this->ttlSeconds);
        $loaded++;
    }
    if ($loaded > 0) {
        $pipe->execute();
        $this->redis->hincrby($this->statsKey, 'prefetched', $loaded);
    }
    return $loaded;
}
```

The Predis pipeline is non-transactional by default, which is intentional on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulkLoad` directly from your own code on a cache that is already serving reads, either pause your writers first or wrap the pipeline in a `MULTI`/`EXEC` transaction so callers cannot observe a half-loaded record.

`flattenFields()` converts the associative `['field' => 'value']` record into the variadic field/value/field/value form `HSET` expects in Predis 3.x. Predis 1.x accepted an associative array directly; the 1.x form raises `wrong number of arguments for 'hset'` against 3.x.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```php
public function get(string $entityId): array
{
    $cacheKey = $this->cacheKey($entityId);
    $started = microtime(true);
    $cached = $this->redis->hgetall($cacheKey);
    $redisLatencyMs = (microtime(true) - $started) * 1000.0;

    if (is_array($cached) && !empty($cached)) {
        $this->redis->hincrby($this->statsKey, 'hits', 1);
        return [$cached, true, $redisLatencyMs];
    }

    $this->redis->hincrby($this->statsKey, 'misses', 1);
    return [null, false, $redisLatencyMs];
}
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `applyChange` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one pipelined `MULTI`/`EXEC` transaction so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```php
public function applyChange(array $change): void
{
    $op = $change['op'] ?? '';
    $entityId = $change['id'] ?? '';
    if ($entityId === '') {
        return;
    }
    $cacheKey = $this->cacheKey($entityId);

    if ($op === 'upsert') {
        $fields = $change['fields'] ?? null;
        if (!is_array($fields) || empty($fields)) {
            return;
        }
        $tx = $this->redis->transaction();
        $tx->del([$cacheKey]);
        $tx->hset($cacheKey, ...self::flattenFields($fields));
        $tx->expire($cacheKey, $this->ttlSeconds);
        $tx->execute();
    } elseif ($op === 'delete') {
        $this->redis->del([$cacheKey]);
    }
    // ... record sync_events_applied + sync lag
}
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis. The malformed-upsert guard (`empty($fields)` returns early) prevents `HSET` from being called with no arguments, which raises an error in Predis 3.x.

## The sync worker

The sync worker is a separate long-running PHP process: `sync_worker.php` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/php/sync_worker.php)). The demo server spawns one of these on first request through a `SyncWorkerSupervisor` and tracks its PID in Redis ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/php/SyncWorker.php)):

```php
public function run(): void
{
    if (function_exists('pcntl_async_signals')) {
        pcntl_async_signals(true);
        pcntl_signal(SIGTERM, function () { $this->stop = true; });
    }

    while (!$this->stop) {
        if ($this->isPaused()) {
            $this->redis->set($this->idleKey, '1');
            while ($this->isPaused() && !$this->stop) {
                usleep(20 * 1000);
            }
            $this->redis->set($this->idleKey, '0');
            continue;
        }

        $change = $this->primary->nextChange($this->pollTimeoutS);
        if ($change === null) {
            continue;
        }
        try {
            $this->cache->applyChange($change);
        } catch (\Throwable $exc) {
            fwrite(STDERR, "[sync] failed to apply event: " . $exc->getMessage() . "\n");
        }
    }
}
```

`MockPrimaryStore::nextChange()` blocks on `BRPOP demo:primary:changes <timeout>`, so the worker uses a fraction of a CPU when idle and reacts within milliseconds when a change arrives.

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `invalidate($entityId)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `clear()` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `bulkLoad($primary->listRecords())` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`clear()` and `bulkLoad()` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary->listRecords()`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `clear()`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```php
$supervisor->pause();
try {
    $cache->clear();
    $cache->bulkLoad($primary->listRecords());
} finally {
    $supervisor->resume();
}
```

`pause()` writes `demo:sync:paused = "1"`, then waits up to 2 seconds for the worker to write `demo:sync:idle = "1"` (the worker writes this key once it has parked itself on the pause flag). Once `pause()` returns true, no `applyChange` is in flight and no new event will be drained from the change list. Change events that arrive during the pause sit on `demo:primary:changes` and apply in order once `resume()` is called.

This pattern is forced by PHP's process model: the demo server runs under `php -S`, every HTTP request is a fresh process, and the sync worker lives in a separate long-running process. The pause / idle signals cannot live in shared memory; Redis is the only place every component already talks to.

## Hit/miss accounting

The helper keeps counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up.

In PHP under `php -S`, every HTTP request runs in its own process, so the counters cannot live in object properties. The helper stores them in a Redis hash under `demo:stats:{prefix}` and uses `HINCRBY` / `HINCRBYFLOAT` to update them. Every HTTP request, plus the sync worker process, sees the same totals:

```php
public function stats(): array
{
    $raw = $this->redis->hgetall($this->statsKey) ?: [];
    $hits = (int) ($raw['hits'] ?? 0);
    $misses = (int) ($raw['misses'] ?? 0);
    $prefetched = (int) ($raw['prefetched'] ?? 0);
    $applied = (int) ($raw['sync_events_applied'] ?? 0);
    $lagTotal = (float) ($raw['sync_lag_ms_total'] ?? 0.0);
    $lagSamples = (int) ($raw['sync_lag_samples'] ?? 0);

    $total = $hits + $misses;
    $hitRate = $total > 0 ? round(100.0 * $hits / $total, 1) : 0.0;
    $avgLag = $lagSamples > 0 ? round($lagTotal / $lagSamples, 2) : 0.0;

    return [
        'hits' => $hits,
        'misses' => $misses,
        'hit_rate_pct' => $hitRate,
        'prefetched' => $prefetched,
        'sync_events_applied' => $applied,
        'sync_lag_ms_avg' => $avgLag,
    ];
}
```

In production you would emit these as Prometheus counters and gauges. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* PHP 8.1 or later is installed (`php --version`)
* [Composer](https://getcomposer.org/) is installed
* Redis is running and accessible. By default, the demo connects to `127.0.0.1:6379`

If your Redis server is running elsewhere, start the demo with the `PREFETCH_REDIS_HOST` and `PREFETCH_REDIS_PORT` environment variables.

## Running the demo

### Get the source files

The demo consists of six files. Download them from the [`php` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/php) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/php
curl -O $BASE/Cache.php
curl -O $BASE/Primary.php
curl -O $BASE/SyncWorker.php
curl -O $BASE/sync_worker.php
curl -O $BASE/demo_server.php
curl -O $BASE/composer.json
```

### Start the demo server

From that directory, install Predis and start the server:

```bash
composer install
php -S 127.0.0.1:8788 demo_server.php
```

After starting the server, visit `http://127.0.0.1:8788`.

On the first request the server will:

* Seed the mock primary store into Redis (records under `demo:primary:hash:{id}`, ID set under `demo:primary:ids`).
* Bulk-load every primary record into the cache.
* Spawn a long-running `sync_worker.php` process via `proc_open` and record its PID in `demo:sync:pid`.

The sync worker keeps running until you stop it manually. To stop everything cleanly:

```bash
# Stop the demo server with Ctrl+C, then kill the sync worker:
kill $(redis-cli get demo:sync:pid)
```

The demo server uses only the PHP standard library and Predis:

* PHP's [built-in dev server](https://www.php.net/manual/en/features.commandline.webserver.php) for HTTP
* [`proc_open`](https://www.php.net/manual/en/function.proc-open.php) + `posix_kill` for spawning and signalling the sync worker
* [Predis](https://github.com/predis/predis) for every Redis command

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
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/php/Primary.php)).

Each record lives in its own Redis hash under `demo:primary:hash:{id}`, and the set `demo:primary:ids` tracks the current ID universe. The change feed is a Redis list (`demo:primary:changes`); every mutation `LPUSH`es a JSON-encoded change event and the sync worker drains the list with `BRPOP`.

The reference Python implementation guards mutation + emit with an in-process lock so two concurrent updates produce change events in queue order matching mutation order. PHP doesn't have shared memory across requests, so the PHP port runs each mutation as a Lua script on the Redis server. Lua scripts run atomically on the Redis main thread, so the mutation and the `LPUSH` happen as one step and the queue order can't get scrambled:

```php
private const UPDATE_SCRIPT = <<<'LUA'
local id = ARGV[1]
local field = ARGV[2]
local value = ARGV[3]
local now_ms = tonumber(ARGV[4])
local ids_key = KEYS[1]
local hash_key = KEYS[2]
local changes_key = KEYS[3]
if redis.call('SISMEMBER', ids_key, id) == 0 then
  return 0
end
redis.call('HSET', hash_key, field, value)
local raw = redis.call('HGETALL', hash_key)
local fields = {}
for i = 1, #raw, 2 do
  fields[raw[i]] = raw[i + 1]
end
local change = cjson.encode({
  op = 'upsert',
  id = id,
  fields = fields,
  timestamp_ms = now_ms,
})
redis.call('LPUSH', changes_key, change)
return 1
LUA;
```

In a real system this list-based change feed is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

## Production usage

This guide uses a deliberately small local demo so you can focus on the prefetch-cache pattern. In production, you will usually want to harden several aspects of it.

### Replace the in-process change queue with a real CDC pipeline

The demo's Redis-list change feed is the simplest possible stand-in for a CDC change feed. In production, the change feed lives outside the application process: an RDI pipeline configured against your primary database, Debezium connectors writing to Kafka or a Redis stream, or your application explicitly publishing change events from the write path. Whatever you choose, the consumer side stays the same — read events, apply them to Redis, advance the offset.

### Run the sync worker as a managed service

Under `php -S`, every HTTP request runs in its own short-lived process, so this demo spawns a separate `sync_worker.php` process via `proc_open` and records its PID in Redis. That keeps the demo self-contained, but it is not how you would run this in production: the supervisor's lifecycle is bound to whichever HTTP request happened to spawn the worker, and a stale PID can survive a server restart.

In production, run the sync worker as a managed service — systemd, supervisord, Kubernetes, or whatever your platform uses to run long-lived workers — and remove the in-request spawning entirely. The pause/resume coordination still belongs in Redis (`demo:sync:paused` / `demo:sync:idle`), because the application processes that handle `/clear` and `/reprefetch` still need a way to ask the out-of-band worker to park itself before they rewrite the cache. The supervisor in this demo is only there to give you a one-command "press play and watch the cache work" experience.

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

* [Predis on GitHub](https://github.com/predis/predis) - The Predis client for PHP
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [BRPOP command]({{< relref "/commands/brpop" >}}) - Block on a list for the next change event
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
