---
aliases:
- /develop/use-cases/prefetch-cache/redis-rb
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis prefetch cache in Ruby with redis-rb
linkTitle: redis-rb example (Ruby)
title: Redis prefetch cache with redis-rb
weight: 8
---

This guide shows you how to implement a Redis prefetch cache in Ruby with [`redis-rb`]({{< relref "/develop/clients/ruby" >}}). It includes a small local web server built with the Ruby standard library `webrick` so you can watch the cache pre-load at startup, see a background sync worker apply primary mutations within milliseconds, and break the cache to confirm that reads never fall back to the primary.

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

1. **On startup**, the demo server calls `cache.bulk_load(primary.list_records)`, which pipelines `DEL` + `HSET` + `EXPIRE` for every record in one round trip.
2. **On every read**, the application calls `cache.get(entity_id)`, which runs `HGETALL` against Redis only. A miss is treated as an error, not a trigger to query the primary.
3. **On every primary mutation**, the primary appends a change event to an in-process queue. The sync worker thread drains the queue and calls `cache.apply_change(event)`. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL; for a `delete`, it removes the cache key.

In a real system the in-process change queue is replaced by a CDC pipeline — [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}), Debezium plus a lightweight consumer, or an equivalent tool that tails the source's binlog/WAL and pushes events into Redis.

## The prefetch-cache helper

The `PrefetchCache` class wraps the cache operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/ruby/cache.rb)):

```ruby
require "redis"
require_relative "cache"
require_relative "primary"
require_relative "sync_worker"

redis = Redis.new(host: "localhost", port: 6379)
primary = MockPrimaryStore.new
cache = PrefetchCache.new(redis_client: redis, ttl_seconds: 3600)

# Pre-load every primary record into Redis in one pipelined round trip.
cache.bulk_load(primary.list_records)

# Start the sync worker so primary mutations propagate into Redis.
sync = SyncWorker.new(primary: primary, cache: cache)
sync.start

# Read paths now go to Redis only.
record, hit, redis_ms = cache.get("cat-001")
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

The `bulk_load` method pipelines a `DEL` + `HSET` + `EXPIRE` triple for every record. The pipeline is sent in a single round trip, so loading thousands of records takes one network RTT plus the time Redis spends executing the commands locally — typically tens of milliseconds even for a large reference table:

```ruby
def bulk_load(records)
  loaded = 0
  @apply_lock.synchronize do
    @redis.pipelined do |pipe|
      records.each do |record|
        entity_id = record["id"] || record[:id]
        next if entity_id.nil? || entity_id.to_s.empty?
        cache_key = cache_key_for(entity_id)
        pipe.del(cache_key)
        pipe.hset(cache_key, stringify_record(record))
        pipe.expire(cache_key, @ttl_seconds)
        loaded += 1
      end
    end
  end
  @stats_lock.synchronize { @prefetched += loaded }
  loaded
end
```

The `pipelined` block sends every command in one network round trip without `MULTI`/`EXEC`. This is intentional on the **startup** path: nothing is reading the cache yet, the records do not need to be applied atomically as a set, and skipping `MULTI`/`EXEC` keeps the bulk load fast. The same method is used for the live `/reprefetch` reload, which is safe because the demo pauses the sync worker around the clear-and-reload sequence — see [Re-prefetch under load](#re-prefetch-under-load) below. If you call `bulk_load` directly from your own code on a cache that is already serving reads, either pause your writers first or rewrite it with `multi` so callers cannot observe a half-loaded record.

## Reads from Redis only

The `get` method runs `HGETALL` and returns the cached hash. **It does not fall back to the primary on a miss.** In a healthy system, a miss never happens; if it does, the application surfaces it as an error and treats it as a sync-pipeline incident:

```ruby
def get(entity_id)
  cache_key = cache_key_for(entity_id)

  started = monotonic_ms
  cached = @redis.hgetall(cache_key)
  redis_latency_ms = monotonic_ms - started

  if cached && !cached.empty?
    @stats_lock.synchronize { @hits += 1 }
    [cached, true, redis_latency_ms]
  else
    @stats_lock.synchronize { @misses += 1 }
    [nil, false, redis_latency_ms]
  end
end
```

This is the key behavioural difference from [cache-aside]({{< relref "/develop/use-cases/cache-aside" >}}): the request path never touches the primary, so reference-data reads cannot contribute to primary database load.

## Applying sync events

The sync worker calls `apply_change` for every primary mutation. For an `upsert`, the helper rewrites the cache hash and refreshes the safety-net TTL in one `MULTI`/`EXEC` transaction so the cache never holds a stale mix of old and new fields. For a `delete`, it removes the cache key:

```ruby
def apply_change(change)
  op = change[:op] || change["op"]
  entity_id = change[:id] || change["id"]
  return if entity_id.nil? || entity_id.to_s.empty?

  cache_key = cache_key_for(entity_id)

  case op
  when "upsert"
    fields = change[:fields] || change["fields"]
    return if fields.nil? || fields.empty?

    @apply_lock.synchronize do
      @redis.multi do |tx|
        tx.del(cache_key)
        tx.hset(cache_key, stringify_record(fields))
        tx.expire(cache_key, @ttl_seconds)
      end
    end
  when "delete"
    @redis.del(cache_key)
  end
  # stats update omitted for brevity
end
```

The `DEL` before the `HSET` ensures the cached hash contains exactly the fields the primary record has now — fields that have been dropped from the primary will not linger in Redis. The `Mutex` around `multi` is a redis-rb-specific guard: a single `Redis.new` connection is thread-safe for individual commands, but a `multi` block uses the underlying connection for the duration of the transaction, so concurrent transactions on the same client must be serialised by the caller (or you must use a connection pool). The demo uses one shared client plus a mutex; production code should use [`connection_pool`](https://github.com/mperham/connection_pool) and check out a connection per transaction instead.

## The sync worker

The `SyncWorker` runs a daemon thread that blocks on the primary's change queue with a short timeout. Every change is applied to Redis as soon as it arrives
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/ruby/sync_worker.rb)):

```ruby
def run_loop
  loop do
    should_stop, should_pause = @state_mutex.synchronize { [@stop, @pause] }
    break if should_stop

    if should_pause
      @state_mutex.synchronize do
        @paused_idle = true
        @state_cv.broadcast
        while @pause && !@stop
          @state_cv.wait(@state_mutex, @poll_timeout_s)
        end
        @paused_idle = false
      end
      next
    end

    change = @primary.next_change(@poll_timeout_s)
    next if change.nil?
    begin
      @cache.apply_change(change)
    rescue => exc
      warn "[sync] failed to apply #{change.inspect}: #{exc}"
    end
  end
end
```

In production this loop is replaced by a CDC consumer reading from RDI's Redis output stream, Debezium's Kafka topic, or an equivalent change feed. The shape stays the same: drain events, apply them to Redis, advance the consumer offset.

## Invalidation and re-prefetch

Two helpers exist for testing and recovery:

* `invalidate(entity_id)` deletes a single cache key. The demo uses it to simulate a sync-pipeline failure on one record.
* `clear` runs `SCAN MATCH cache:category:*` and deletes every key under the prefix. The demo uses it to simulate a full cache loss.

In both cases, the recovery path is to call `bulk_load(primary.list_records)` again — re-prefetching from the primary. The demo exposes this as the "Re-prefetch" button so you can see the cache come back to a fully-warm state in one operation.

### Re-prefetch under load

`clear` and `bulk_load` are not atomic against the sync worker. If a change event arrives between the snapshot (`primary.list_records`) and the bulk write, the bulk write can overwrite a newer value; if a change event arrives between `clear`'s `SCAN` and `DEL`, the cleared entry can immediately be recreated. The demo's `/clear` and `/reprefetch` handlers solve this by pausing the sync worker around the operation:

```ruby
@sync.pause
begin
  @cache.clear
  @cache.bulk_load(@primary.list_records)
ensure
  @sync.resume
end
```

`pause` waits for the worker to finish whatever event it is currently applying, parks the run loop on a `ConditionVariable`, and returns. Change events that arrive during the pause sit in the primary's `Queue` and apply in order once `resume` is called, so no event is lost.

## Hit/miss accounting

The helper keeps in-process counters for hits, misses, prefetched records, sync events applied, and the average lag between a primary change and its application to Redis. The demo UI surfaces these so you can confirm the cache is absorbing all reads and the sync worker is keeping up:

```ruby
def stats
  @stats_lock.synchronize do
    total = @hits + @misses
    hit_rate = total.zero? ? 0.0 : (100.0 * @hits / total).round(1)
    avg_lag = @sync_lag_samples.zero? ? 0.0 : (@sync_lag_ms_total / @sync_lag_samples).round(2)
    {
      "hits" => @hits,
      "misses" => @misses,
      "hit_rate_pct" => hit_rate,
      "prefetched" => @prefetched,
      "sync_events_applied" => @sync_events_applied,
      "sync_lag_ms_avg" => avg_lag,
    }
  end
end
```

In production you would emit these as Prometheus counters and gauges. The sync-lag metric is the most important: a sudden rise indicates the CDC pipeline is falling behind.

## Prerequisites

Before running the demo, make sure that:

* Redis is running and accessible. By default, the demo connects to `localhost:6379`.
* Ruby 2.6 or later is installed (the demo uses `webrick`, which is stdlib in 2.x and is shipped as a bundled gem in 3.x).
* The `redis` gem (`redis-rb` 5.x) is installed:

```bash
gem install redis webrick
```

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of four files. Download them from the [`ruby` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/prefetch-cache/ruby) on GitHub, or grab them with `curl`:

```bash
mkdir prefetch-cache-demo && cd prefetch-cache-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/prefetch-cache/ruby
curl -O $BASE/cache.rb
curl -O $BASE/primary.rb
curl -O $BASE/sync_worker.rb
curl -O $BASE/demo_server.rb
```

### Start the demo server

From that directory:

```bash
ruby demo_server.rb
```

You should see something like:

```text
Redis prefetch-cache demo server listening on http://127.0.0.1:8789
Using Redis at localhost:6379 with cache prefix 'cache:category:' and TTL 3600s
Prefetched 5 records in 86.5 ms; sync worker running
```

After starting the server, visit `http://localhost:8789`.

The demo server uses only Ruby standard library features for HTTP handling and concurrency:

* [`webrick`](https://docs.ruby-lang.org/en/master/WEBrick.html) for the web server
* [`uri`](https://docs.ruby-lang.org/en/master/URI.html) and `req.query` for query and form decoding
* [`Thread`](https://docs.ruby-lang.org/en/master/Thread.html), [`Mutex`](https://docs.ruby-lang.org/en/master/Mutex.html), [`ConditionVariable`](https://docs.ruby-lang.org/en/master/ConditionVariable.html), and [`Queue`](https://docs.ruby-lang.org/en/master/Thread/Queue.html) for the sync worker daemon

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
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/prefetch-cache/ruby/primary.rb)):

```ruby
class MockPrimaryStore
  def initialize(read_latency_ms: 80)
    # ...
  end

  def list_records
    sleep(@read_latency_ms / 1000.0)
    # ...
  end

  def update_field(entity_id, field, value)
    @lock.synchronize do
      record = @records[entity_id]
      return false if record.nil?
      record[field] = value
      emit_change_locked(CHANGE_OP_UPSERT, entity_id, record.dup)
    end
    true
  end
end
```

Every mutation appends a change event to an in-process [`Queue`](https://docs.ruby-lang.org/en/master/Thread/Queue.html). The sync worker drains the queue with a 50 ms timeout and applies each event to Redis. Ruby's `Queue#pop` does not accept a timeout directly, so `next_change` wraps a non-blocking `pop(true)` in a short polling loop — that keeps the worker responsive to its stop flag.

In a real system this queue is replaced by a CDC pipeline — RDI on Redis Enterprise or Debezium with a Redis consumer on open-source Redis.

## Production usage

This guide uses a deliberately small local demo so you can focus on the prefetch-cache pattern. In production, you will usually want to harden several aspects of it.

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

### Use a connection pool for transactions, not a shared client + mutex

A single `Redis.new` client is thread-safe for individual commands because Ruby's GIL serialises access to the C-level command pipeline. But `multi` blocks use the underlying connection for the duration of the transaction, so two threads cannot run `multi` blocks concurrently on the same client without interleaving. The demo gets away with one shared client guarded by a `Mutex`, which is fine for a small local server. In production, use [`connection_pool`](https://github.com/mperham/connection_pool) to keep a pool of `Redis` clients and check one out per transaction:

```ruby
require "connection_pool"

REDIS = ConnectionPool.new(size: 16, timeout: 5) { Redis.new(host: "localhost") }

REDIS.with do |redis|
  redis.multi do |tx|
    tx.del(cache_key)
    tx.hset(cache_key, fields)
    tx.expire(cache_key, ttl_seconds)
  end
end
```

That gives you per-thread transactions without a global lock and reuses connections across requests.

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

* [redis-rb guide]({{< relref "/develop/clients/ruby" >}}) - Install and use the Ruby Redis client
* [HSET command]({{< relref "/commands/hset" >}}) - Write hash fields
* [HGETALL command]({{< relref "/commands/hgetall" >}}) - Read every field of a hash
* [EXPIRE command]({{< relref "/commands/expire" >}}) - Set key expiration in seconds
* [DEL command]({{< relref "/commands/del" >}}) - Delete a key on invalidation or sync-delete
* [SCAN command]({{< relref "/commands/scan" >}}) - Iterate the cached keyspace without blocking the server
* [TTL command]({{< relref "/commands/ttl" >}}) - Inspect remaining safety-net time on a key
* [Redis Data Integration]({{< relref "/integrate/redis-data-integration" >}}) - Configuration-driven CDC into Redis on Redis Enterprise and Redis Cloud
