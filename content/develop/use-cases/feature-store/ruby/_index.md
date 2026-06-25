---
aliases:
- /develop/use-cases/feature-store/redis-rb
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in Ruby with redis-rb
linkTitle: redis-rb example (Ruby)
title: Redis feature store with redis-rb
weight: 8
---

This guide shows you how to build a small Redis-backed online feature store
in Ruby with the [`redis`]({{< relref "/develop/clients/ruby" >}}) gem. The
demo runs on top of WEBrick (the stdlib HTTP server) so you can bulk-load a
batch of users with a key-level TTL, run a streaming worker that overwrites
real-time features with per-field TTL, retrieve any subset of features for
one user under 2 ms, and pipeline `HMGET` across a hundred users for batch
scoring.

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
* Sub-millisecond hot path. The Redis-side work is microseconds; in practice
  the bottleneck is the network round trip plus the model's own
  feature-prep.
* Pipelined batch scoring — one round trip for `N` users at once.
* Independent freshness per feature, expressed as a server-side TTL rather
  than as application logic.
* Self-cleanup on pipeline failure: a stalled batch refresher lets entities
  expire on schedule, and a stalled streaming worker lets each affected
  field expire on its own timer.

## How redis-rb fits the demo

Two gem facts shape the helper:

* **One shared `Redis` client serves the whole process.** The `redis` gem
  uses a single TCP connection per `Redis` instance — and the instance is
  thread-safe (synchronized with a mutex). Handing the same `Redis` to
  every WEBrick worker thread and the streaming worker is fine and is the
  canonical way to run this kind of demo.
* **`Redis#call` is the escape hatch for commands not yet typed on the
  gem.** redis-rb 5.4 ships no stable typed helpers for the per-field
  TTL commands. The helper sends `HEXPIRE` and `HTTL` with
  `r.call('HEXPIRE', key, ttl, 'FIELDS', count, *fields)` so the wire
  bytes match the protocol exactly regardless of which patch release
  is installed.

In this example, the batch features describe a user's longer-term shape
(`country_iso`, `risk_segment`, `account_age_days`, `tx_count_7d`,
`avg_amount_30d`, `chargeback_count_180d`) and are bulk-loaded by
`build_features.rb` — the demo's stand-in for a nightly Spark / Feast
materialization job. The streaming features describe what the user is doing
right now (`last_login_ts`, `last_device_id`, `tx_count_5m`,
`failed_logins_15m`, `session_country`) and are written by
`streaming_worker.rb` — a daemon Ruby thread that stands in for a
Flink / Kafka Streams job. The WEBrick servlet in `demo_server.rb` reads
any subset of those features through `feature_store.rb`'s helper class.

## How it works

There are three paths: a **batch path** that bulk-loads features once per
materialization cycle, a **streaming path** that updates real-time features
as events arrive, and an **inference path** that reads features on the
request side.

### Batch path (per materialization cycle)

1. The batch job calls `synthesize_users(N, seed)` (in production, the
   equivalent computation lives in an offline pipeline against the
   warehouse). The result is `{user_id => {field => value, ...}}` for every
   user in this cycle.
2. `store.bulk_load(rows, ttl_seconds:)` queues one
   [`HSET`]({{< relref "/commands/hset" >}}) plus one
   [`EXPIRE`]({{< relref "/commands/expire" >}}) per user through
   `redis.pipelined`, so the whole batch ships in a single round trip.

### Streaming path (per event)

When a user does something (login, transaction, page view) the streaming
layer computes whatever real-time signals fall out of that event and calls
`store.update_streaming(user_id, fields)`. That queues:

1. An [`HSET`]({{< relref "/commands/hset" >}}) writing the new field
   values. Redis is single-threaded per shard, so this is atomic against
   any concurrent batch write on the same hash — no version columns, no
   locks.
2. An [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) over exactly the
   fields that were written, with the streaming TTL. Each streaming field
   carries its own per-field expiry independent of the rest of the hash.
   Stop the worker and these fields drop out one by one as their TTLs
   elapse, while the batch fields remain populated under the longer
   key-level TTL.

### Inference path (per request)

1. The model server picks the feature subset it needs (the schema is
   owned by the model, not the store).
2. It calls `store.get_features(user_id, names)`, which is one
   [`HMGET`]({{< relref "/commands/hmget" >}}). Redis returns the values
   in the same order as the requested fields, with `nil` for any field
   that doesn't exist (or has expired).
3. For batch inference, the model server calls
   `store.batch_get_features(user_ids, names)`, which pipelines one
   [`HMGET`]({{< relref "/commands/hmget" >}}) per user across all `N`
   users in a single network round trip.

### Project layout

```text
feature-store/ruby/
├── Gemfile                — redis ~> 5.4, webrick ~> 1.9
├── feature_store.rb       — FeatureStore class
├── streaming_worker.rb    — daemon-thread worker
├── build_features.rb     — synthesize_users + CLI main
└── demo_server.rb         — WEBrick servlet + HTML page (single file)
```

Run with `bundle exec ruby demo_server.rb` or
`bundle exec ruby build_features.rb --count 500`.

## The feature-store helper

The `FeatureStore` class wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/ruby/feature_store.rb)):

```ruby
require 'redis'
require_relative 'feature_store'

redis = Redis.new(url: 'redis://localhost:6379')
store = FeatureStore.new(
  redis: redis,
  key_prefix: 'fs:user:',
  batch_ttl_seconds: 24 * 60 * 60,    # whole-entity TTL aligned with the daily batch cycle
  streaming_ttl_seconds: 5 * 60,      # per-field TTL on each streaming feature
)

# Batch materialization: one HSET + EXPIRE per user, all pipelined.
store.bulk_load({
  'u0001' => {
    'country_iso' => 'US', 'risk_segment' => 'low',
    'tx_count_7d' => 14, 'avg_amount_30d' => 92.40,
    'account_age_days' => 612, 'chargeback_count_180d' => 0,
  },
}, ttl_seconds: 24 * 60 * 60)

# Streaming write: HSET + HEXPIRE on just the fields that changed.
store.update_streaming('u0001', {
  'last_login_ts' => (Time.now.to_f * 1000).to_i,
  'last_device_id' => 'ios-9f02',
  'tx_count_5m' => 3,
  'failed_logins_15m' => 0,
  'session_country' => 'US',
})

# Inference read: HMGET of whatever the model needs.
features = store.get_features('u0001', [
  'risk_segment', 'tx_count_7d', 'avg_amount_30d',
  'tx_count_5m', 'failed_logins_15m',
])

# Batch scoring: pipelined HMGET across many users.
batch = store.batch_get_features(
  %w[u0001 u0002 u0003],
  %w[risk_segment tx_count_5m failed_logins_15m],
)
```

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis
hash fields are bytes on the wire, so the helper renders booleans as
`'true'` / `'false'` and uses `value.to_s` for everything else. The model
server is responsible for parsing back to the right type, the same way it
would when reading any serialized feature store.

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

`bulk_load` pipelines one `HSET` and one `EXPIRE` per user into a single
round trip via `redis.pipelined`. With 500 users that's 1000 commands in
one network call — Redis processes them sequentially on the server side
but the client only pays one RTT.

```ruby
def bulk_load(rows, ttl_seconds: nil)
  return 0 if rows.empty?
  ttl = ttl_seconds || @batch_ttl_seconds
  @redis.pipelined do |pipe|
    rows.each do |entity_id, fields|
      key = key_for(entity_id)
      encoded = fields.transform_values { |v| encode_value(v) }
      pipe.hset(key, encoded)
      pipe.expire(key, ttl)
    end
  end
  ...
end
```

`Redis#pipelined` is a non-transactional batch: commands queue up and ship
in one round trip but they don't run inside a `MULTI/EXEC` block. That's
the right choice here because each user's `HSET` + `EXPIRE` pair is
independent of every other user's, and an all-or-nothing transaction
would block the server for the duration of the batch. For the rare case
where the pair has to be inseparable, use `redis.multi do |tx| ... end`
or a Lua script via
[`EVAL`]({{< relref "/commands/eval" >}}) /
[Eval scripting]({{< relref "/develop/programmability/eval-intro" >}}).

In production, the equivalent of this script runs as an offline pipeline
(a Spark or Feast `materialize` job) that reads from the warehouse and
writes into Redis. The
[Feast `RedisOnlineStore`](https://docs.feast.dev/reference/online-stores/redis)
provider does exactly this under the hood; the in-house
[Redis Feature Form]({{< relref "/develop/ai/featureform" >}}) integration
covers the materialize + serve path end-to-end.

### Streaming writes with per-field TTL

`update_streaming` is the linchpin of the mixed-staleness story:

```ruby
def update_streaming(entity_id, fields, ttl_seconds: nil)
  return if fields.empty?
  ttl = ttl_seconds || @streaming_ttl_seconds
  key = key_for(entity_id)
  encoded = fields.transform_values { |v| encode_value(v) }
  names = encoded.keys

  results = @redis.pipelined do |pipe|
    pipe.hset(key, encoded)
    pipe.call('HEXPIRE', key, ttl, 'FIELDS', names.size, *names)
  end
  codes = results[1] || []
  codes.each do |code|
    unless code == 1
      raise "HEXPIRE did not set every field TTL for #{key}: #{codes.inspect}"
    end
  end
  ...
end
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on
*individual* hash fields, not on the whole key. The two commands are
queued in the same `pipelined` block so Redis runs them in order: the
`HSET` first creates or overwrites the fields, then `HEXPIRE` attaches a
TTL to each of those same fields. `HEXPIRE` returns one status code per
field:

* `1` — TTL set / updated.
* `2` — the expiry was 0 or in the past, so Redis deleted the field
  instead of applying a TTL.
* `0` — an `NX | XX | GT | LT` conditional flag was specified and not
  met (we never use one here).
* `-2` — no such field, or no such key.

The helper raises if any code is anything other than `1`, so the "every
streaming write renews its TTL" invariant fails loudly rather than
silently leaving a streaming field with no expiry attached.

Why `redis.call('HEXPIRE', ...)` instead of a typed `redis.hexpire`?
redis-rb 5.4 ships no stable typed helpers for the per-field TTL
commands, so `Redis#call` is the canonical way to issue them. The wire
bytes match the protocol exactly. The same `r.call('HTTL', ...)` shape
appears in `field_ttls_seconds`.

If a streaming pipeline stops, the streaming fields drop out one by one
as their per-field TTLs elapse. `field_ttls_seconds` lets the model side
inspect the remaining TTL on any field — useful both for debugging
("why is this feature missing?" → "it expired three seconds ago") and as
a freshness signal in the model itself.

> **HEXPIRE requires Redis 7.4 or later.** `HEXPIRE` and the field-level
> TTL commands were added in Redis 7.4. The demo's `Gemfile` pins
> `redis ~> 5.4`, which speaks the protocol natively.

### Inference reads with HMGET

`get_features` is one `HMGET`:

```ruby
def get_features(entity_id, field_names = nil)
  key = key_for(entity_id)
  if field_names.nil?
    return @redis.hgetall(key)
  end
  return {} if field_names.empty?
  values = @redis.hmget(key, *field_names)
  out = {}
  field_names.each_with_index do |n, i|
    out[n] = values[i] unless values[i].nil?
  end
  out
end
```

The model knows exactly which features it consumes, so the request path
always takes the `hmget` branch with an explicit field list — that's the
sub-millisecond path. `hgetall` is the right call for debugging (which is
what the demo's "Inspect" panel does) but not for serving: it forces
Redis to serialize every field, including ones the model doesn't need.

Fields that don't exist (because they were never written, or because they
expired) come back as `nil`. The helper drops them from the result hash
so the caller sees only the features that are actually available.

### Batch scoring with pipelined HMGET

For batch inference, the same `HMGET` shape pipelines across users:

```ruby
def batch_get_features(entity_ids, field_names)
  return {} if entity_ids.empty? || field_names.empty?
  rows = @redis.pipelined do |pipe|
    entity_ids.each { |id| pipe.hmget(key_for(id), *field_names) }
  end
  out = {}
  entity_ids.each_with_index do |id, i|
    values = rows[i] || []
    row = {}
    field_names.each_with_index do |n, j|
      row[n] = values[j] unless values[j].nil?
    end
    out[id] = row
  end
  out
end
```

One round trip for the whole batch. The demo returns a 30-user batch in
~2 ms against a local Redis.

A Redis Cluster is different: a single `redis.pipelined` block ships
through one connection to one node. For batch reads on a cluster, use
the [`redis-clustering`](https://github.com/redis/redis-rb) gem
and either fan out parallel `hmget` calls (the cluster client routes
each one to the right shard) or, for tighter control, group entity IDs
by hash slot and run one `pipelined` block per shard in parallel.

## The streaming worker

`streaming_worker.rb` is the demo's stand-in for whatever Flink, Kafka
Streams, or bespoke service computes the real-time features
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/ruby/streaming_worker.rb)).
It runs as a daemon `Thread` next to the WEBrick server so the UI can
start, pause, and resume it.

The lifecycle (start / stop / pause / resume / wait_for_idle) is the same
as every other client in this use case. The two correctness levers:

```ruby
def run
  until @stop
    sleep(@tick)
    break if @stop
    # Set tick_in_flight *before* the pause check so a concurrent
    # pause + wait_for_idle can never observe tick_in_flight=false
    # in the window between the pause check and the actual tick call.
    @tick_in_flight = true
    begin
      do_tick unless @paused
    rescue => e
      warn "[streaming-worker] tick failed: #{e.class}: #{e.message}"
    ensure
      @tick_in_flight = false
    end
  end
ensure
  # Clear running and tick_in_flight no matter how the thread exits
  # so a later start can spin a fresh thread.
  @running = false
  @tick_in_flight = false
end
```

The same pre-flight `@tick_in_flight = true` before the pause check and
the outer `ensure` block that clears both flags on every exit path
appears in every other client demo, for the same reason: a reset that's
about to `DEL` every key needs to be able to call `worker.pause` to stop
*future* ticks AND `worker.wait_for_idle` to flush a mid-flight tick
before issuing the DEL sweep.

Pausing the worker is what shows off the mixed-staleness behavior: leave
it paused for longer than `streaming_ttl_seconds` and the streaming
fields disappear from every user's hash one by one, while the batch
fields remain under the longer key-level `EXPIRE`. The demo's
`Pause / resume` button lets you see this happen in real time.

## The batch builder

`build_features.rb` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/ruby/build_features.rb)).
It generates synthetic feature rows and calls `store.bulk_load` once.

Run the builder on its own (independently of the demo server) to
populate Redis from the command line:

```bash
bundle exec ruby build_features.rb --count 500 --ttl-seconds 3600
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL,
which is how a typical operator would pre-seed a feature store from the
command line when debugging.

## The interactive demo

`demo_server.rb` runs a WEBrick server on port 8093. The HTML page lets
you:

* **Bulk-load** any number of users (default 200) with a configurable
  key-level TTL.
* See the **store state**: user count, batch / streaming TTLs,
  cumulative read/write counters.
* See the **streaming worker** status and **pause or resume** it.
* Run an **inference read** for any user with a chosen feature subset,
  and see the value, the per-field TTL, and the read latency.
* Run **batch scoring** with a pipelined `HMGET` across `N` users.
* **Inspect** any user's full hash with field-level TTLs and the
  key-level TTL.

The server holds one `Redis` client, one `FeatureStore`, and one
`StreamingWorker` for the lifetime of the process. Every WEBrick request
thread shares the same `Redis` (the gem synchronizes its own access).
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

## Prerequisites

* **Redis 7.4 or later.** [`HEXPIRE`]({{< relref "/commands/hexpire" >}})
  and [`HTTL`]({{< relref "/commands/httl" >}}) were added in Redis 7.4;
  the demo relies on per-field TTL for the mixed-staleness story.
* **Ruby 3.0 or later.**
* The `redis` and `webrick` gems. The demo's `Gemfile` pins
  `redis ~> 5.4` and `webrick ~> 1.9`. WEBrick was removed from Ruby's
  default-gem set in 3.0, so the explicit pin keeps the demo runnable
  on modern Rubies.

If your Redis server is running elsewhere, start the demo with
`--redis-url redis://host:port`.

## Running the demo

### Get the source files

The demo lives in a small directory under
[`feature-store/ruby`](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/ruby).
Clone the repo or copy the directory:

```bash
git clone https://github.com/redis/docs.git
cd docs/content/develop/use-cases/feature-store/ruby
bundle install
```

### Start the demo server

From the project directory:

```bash
bundle exec ruby demo_server.rb
```

You should see:

```text
Dropping any existing users under 'fs:user:*' for a clean demo run (pass --no-reset to keep them).
Redis feature-store demo server listening on http://127.0.0.1:8093
Using Redis at redis://localhost:6379 with key prefix 'fs:user:' (batch TTL 86400s, streaming TTL 300s)
Materialized 200 user(s); streaming worker running.
```

Open [http://127.0.0.1:8093](http://127.0.0.1:8093). Useful things to try:

* Pick a user and click **Read features** with a mixed batch/streaming
  subset — you'll see batch fields with no per-field TTL (covered by the
  key-level TTL) and streaming fields with a positive per-field TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a
  100-user batch read.
* Click **Pause / resume** on the streaming worker and leave it paused
  for ~5 minutes (or restart the server with
  `--streaming-ttl-seconds 30` to make it visible in seconds). Re-run
  **Read features** on any user and watch the streaming fields
  disappear while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level
  TTLs.
* Click **Reset** to drop every user and start over.

## Production usage

The guidance below focuses on the production concerns specific to
running a feature store on Redis. For the generic redis-rb production
checklist — connection options, TLS, AUTH, retry policy — see the
[`redis` gem documentation]({{< relref "/develop/clients/ruby" >}}).
The feature-store demo runs against `localhost` with the defaults; a
real deployment should harden the client first.

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

The training pipeline reads from the offline store with its own schema;
the serving pipeline reads from Redis with the flattened serving
schema. Keeping those two pipelines as the same code path is what
prevents training-serving skew.

### Use redis-clustering for cluster deployments

A single `redis.pipelined` block ships through one connection to one
node. On a Redis Cluster you need the
[`redis-clustering`](https://github.com/redis/redis-rb) gem,
which routes each command to the right shard transparently. For batch
reads on a cluster, either fan out parallel `hmget` calls (each routed
per-shard) or group entity IDs by hash slot ahead of time and run one
`pipelined` block per shard in parallel.

A hash tag like `fs:user:{vip}:u0001` forces a known set of keys onto
the same shard so one pipeline can cover them all in a single round
trip.

### Make HEXPIRE part of every streaming write

The single biggest correctness lever in this design is that the
streaming write applies `HEXPIRE` *every time*. If a streaming worker
writes a field without renewing its TTL, the field carries whatever
expiry was there before — possibly none, possibly stale — and the
mixed-staleness invariant breaks. Keep the `HSET` and `HEXPIRE` in the
same pipeline (or, even safer, in the same
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

See the [`redis` gem documentation]({{< relref "/develop/clients/ruby" >}})
for the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the
deeper conceptual model.
