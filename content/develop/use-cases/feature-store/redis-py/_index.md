---
aliases:
- /develop/use-cases/feature-store/python
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in Python with redis-py
linkTitle: redis-py example (Python)
title: Redis feature store with redis-py
weight: 1
---

This guide shows you how to build a small Redis-backed online feature store in
Python with [`redis-py`]({{< relref "/develop/clients/redis-py" >}}). It
includes a local web server built with the Python standard library so you can
bulk-load a batch of users with a key-level TTL, run a streaming worker that
overwrites real-time features with per-field TTL, retrieve any subset of
features for one user under 1 ms, and pipeline `HMGET` across a hundred users
for batch scoring.

## Overview

Each entity (here, a user) is one Redis [Hash]({{< relref "/develop/data-types/hashes" >}})
at a deterministic key — `fs:user:{id}`. The hash holds every feature for that
entity as one field per feature: batch-materialized aggregates (refreshed once
a day) alongside streaming-updated signals (refreshed every few seconds). One
[`HMGET`]({{< relref "/commands/hmget" >}}) returns whichever subset the model
needs in one network round trip.

Two TTL layers solve the *mixed staleness* problem without an application-side
cleaner:

* A **key-level** [`EXPIRE`]({{< relref "/commands/expire" >}}) aligned with the
  batch materialization cycle (24 hours in the demo). If the batch refresher
  fails, the whole entity disappears at the next cycle and inference sees a
  missing entity — which the model handler can detect and fall back on —
  rather than silently outdated values.
* A **per-field** [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) (Redis 7.4+) on
  each streaming feature gives that field its own shorter expiry, independent
  of the rest of the hash. If the streaming pipeline stops updating a feature,
  the field self-cleans while the batch fields stay populated.

In this example, the batch features describe a user's longer-term shape
(`country_iso`, `risk_segment`, `account_age_days`, `tx_count_7d`,
`avg_amount_30d`, `chargeback_count_180d`) and are bulk-loaded by
`build_features.py` — the demo's stand-in for a nightly Spark / Feast
materialization job. The streaming features describe what the user is doing
right now (`last_login_ts`, `last_device_id`, `tx_count_5m`,
`failed_logins_15m`, `session_country`) and are written by
`streaming_worker.py` — the demo's stand-in for a Flink / Kafka Streams job.
The inference panel of the demo server reads any subset of those features
through `feature_store.py`'s helper class.

That gives you:

* A single round trip for retrieval — any subset of features for one entity
  in one [`HMGET`]({{< relref "/commands/hmget" >}}).
* Sub-millisecond hot path. The Redis-side work is microseconds; in practice
  the bottleneck is the network round trip plus the model's own feature-prep.
* Pipelined batch scoring — one round trip for `N` users at once.
* Independent freshness per feature, expressed as a server-side TTL rather
  than as application logic.
* Self-cleanup on pipeline failure: a stalled batch refresher lets entities
  expire on schedule, and a stalled streaming worker lets each affected field
  expire on its own timer.

## How it works

There are three paths: a **batch path** that bulk-loads features once per
materialization cycle, a **streaming path** that updates real-time features as
events arrive, and an **inference path** that reads features on the request
side.

### Batch path (per materialization cycle)

1. The batch job calls `synthesize_users(N)` (in production, the equivalent
   computation lives in an offline pipeline against the warehouse). The result
   is `{user_id: {field: value, ...}}` for every user in this cycle.
2. `store.bulk_load(rows, ttl_seconds=86400)` pipelines one
   [`HSET`]({{< relref "/commands/hset" >}}) plus one
   [`EXPIRE`]({{< relref "/commands/expire" >}}) per user into a single
   round trip. The `HSET` writes every batch field; the `EXPIRE` is what makes
   the entity disappear if the next batch run fails, so inference reads a
   missing entity rather than silently outdated values.

### Streaming path (per event)

When a user does something (login, transaction, page view) the streaming layer
computes whatever real-time signals fall out of that event and calls
`store.update_streaming(user_id, fields, ttl_seconds=300)`. That pipelines:

1. An [`HSET`]({{< relref "/commands/hset" >}}) writing the new field values.
   Redis is single-threaded per shard, so this is atomic against any
   concurrent batch write on the same hash — no version columns, no locks.
2. An [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) over exactly the fields
   that were written, with the streaming TTL. Each streaming field carries
   its own per-field expiry independent of the rest of the hash. Stop the
   worker and these fields drop out one by one as their TTLs elapse, while
   the batch fields remain populated under the longer key-level TTL.

### Inference path (per request)

1. The model server picks the feature subset it needs (the schema is owned by
   the model, not the store).
2. It calls `store.get_features(user_id, names)`, which is one
   [`HMGET`]({{< relref "/commands/hmget" >}}). Redis returns the values in
   the same order as the requested fields, with `None` for any field that
   doesn't exist (or has expired).
3. For batch inference, the model server calls
   `store.batch_get_features(user_ids, names)`, which pipelines one
   [`HMGET`]({{< relref "/commands/hmget" >}}) per user across all `N` users
   in a single network round trip.

## The feature-store helper

The `RedisFeatureStore` class wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/redis-py/feature_store.py)):

```python
import redis
from feature_store import RedisFeatureStore

r = redis.Redis(host="localhost", port=6379, decode_responses=True)
store = RedisFeatureStore(
    redis_client=r,
    key_prefix="fs:user:",
    batch_ttl_seconds=24 * 60 * 60,    # whole-entity TTL aligned with the daily batch cycle
    streaming_ttl_seconds=5 * 60,      # per-field TTL on each streaming feature
)

# Batch materialization: one HSET + EXPIRE per user, all pipelined.
store.bulk_load({
    "u0001": {"country_iso": "US", "risk_segment": "low",
              "tx_count_7d": 14, "avg_amount_30d": 92.40,
              "account_age_days": 612, "chargeback_count_180d": 0},
    "u0002": {"country_iso": "GB", "risk_segment": "medium",
              "tx_count_7d": 47, "avg_amount_30d": 220.10,
              "account_age_days": 1840, "chargeback_count_180d": 1},
})

# Streaming write: HSET + HEXPIRE on just the fields that changed.
store.update_streaming("u0001", {
    "last_login_ts": 1716998413541,
    "last_device_id": "ios-9f02",
    "tx_count_5m": 3,
    "failed_logins_15m": 0,
    "session_country": "US",
})

# Inference read: HMGET of whatever the model needs.
features = store.get_features("u0001", [
    "risk_segment", "tx_count_7d", "avg_amount_30d",
    "tx_count_5m", "failed_logins_15m",
])

# Batch scoring: pipelined HMGET across many users.
batch = store.batch_get_features(
    user_ids=["u0001", "u0002", "u0003"],
    field_names=["risk_segment", "tx_count_5m", "failed_logins_15m"],
)
```

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis hash
fields are bytes-on-the-wire, so the helper encodes booleans as `"true"` /
`"false"` and numbers as their `str(...)` form. The model server is responsible
for parsing back to the right type, the same way it would when reading any
serialized feature store.

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

The batch fields sit under the key-level `EXPIRE`. The streaming fields each
carry their own [`HEXPIRE`]({{< relref "/commands/hexpire" >}}). If the
streaming pipeline stops, the streaming fields drop one by one as their
per-field TTLs elapse; the batch fields stay until the daily key-level
`EXPIRE` fires (or the next batch cycle re-pins them).

### Bulk-loading batch features

`bulk_load` pipelines one `HSET` and one `EXPIRE` per user into a single round
trip. With 500 users that's 1000 commands in one network call — Redis processes
them sequentially on the server side but the client only pays one RTT.

```python
def bulk_load(
    self,
    rows: Mapping[str, FeatureMap],
    ttl_seconds: Optional[int] = None,
) -> int:
    ttl = self.batch_ttl_seconds if ttl_seconds is None else ttl_seconds
    pipe = self.redis.pipeline(transaction=False)
    for entity_id, fields in rows.items():
        key = self.key_for(entity_id)
        pipe.hset(key, mapping={k: _encode(v) for k, v in fields.items()})
        pipe.expire(key, ttl)
    pipe.execute()
    ...
```

`transaction=False` skips the `MULTI/EXEC` wrapper that
[`pipeline`]({{< relref "/develop/clients/redis-py/transpipe" >}}) defaults to
— commands still queue and ship in one round trip, but they execute as
independent commands rather than as one atomic block. That is the right
choice here: each user's `HSET` + `EXPIRE` pair is independent of every
other user's, and an all-or-nothing transaction would block the server for
the duration of the batch. It does *not* make the `HSET` + `EXPIRE` pair
atomic — in the extremely unlikely event the server crashes between the two,
the entity exists without a key-level TTL until the next batch run re-pins
it. For an ingestion script that runs end-to-end every cycle this is fine;
if you need the pair to be inseparable, wrap each user in its own tiny
`MULTI/EXEC` or a Lua script (see [`EVAL`]({{< relref "/commands/eval" >}}) /
[Eval scripting]({{< relref "/develop/programmability/eval-intro" >}})).

In production, the equivalent of this script runs as an offline pipeline (a
Spark or Feast `materialize` job) that reads from the warehouse and writes
into Redis. The
[Feast `RedisOnlineStore`](https://docs.feast.dev/reference/online-stores/redis)
provider does exactly this under the hood.

### Streaming writes with per-field TTL

`update_streaming` is the linchpin of the mixed-staleness story:

```python
def update_streaming(
    self,
    entity_id: str,
    fields: FeatureMap,
    ttl_seconds: Optional[int] = None,
) -> None:
    if not fields:
        return
    ttl = self.streaming_ttl_seconds if ttl_seconds is None else ttl_seconds
    key = self.key_for(entity_id)
    encoded = {name: _encode(value) for name, value in fields.items()}

    pipe = self.redis.pipeline(transaction=False)
    pipe.hset(key, mapping=encoded)
    pipe.hexpire(key, ttl, *encoded.keys())
    pipe.execute()
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on *individual*
hash fields, not on the whole key. The two commands are sent in one round trip
and Redis executes them in pipeline order: the `HSET` runs first and creates
or overwrites the fields, then `HEXPIRE` attaches a TTL to each of those same
fields. `HEXPIRE` returns one status code per field — `1` if the TTL was set,
`-2` if the field doesn't exist — so the helper raises if any code is anything
other than `1`. That makes the "every streaming write renews its TTL"
invariant fail loudly rather than silently leaving a streaming field with no
expiry attached.

If a streaming pipeline stops, the streaming fields drop out one by one as
their per-field TTLs elapse — there is no application-side cleaner involved.
[`HTTL`]({{< relref "/commands/httl" >}}) lets the model side inspect the
remaining TTL on any field, which is useful both for debugging ("why is this
feature missing?" → "it expired three seconds ago") and as a freshness signal
in the model itself.

> **HEXPIRE requires Redis 7.4 or later.** `HEXPIRE` and the field-level TTL
> commands (`HTTL`, `HPERSIST`, `HEXPIREAT`, `HPEXPIRE`, `HPEXPIREAT`,
> `HPTTL`, `HEXPIRETIME`, `HPEXPIRETIME`) were added in Redis 7.4. On older
> Redis builds you would have to put streaming features on their own keys
> (one key per feature, or one key per feature group) and set a key-level
> `EXPIRE` instead — at the cost of giving up the single-`HMGET` retrieval.

### Inference reads with HMGET

`get_features` is one `HMGET`:

```python
def get_features(
    self,
    entity_id: str,
    field_names: Optional[Iterable[str]] = None,
) -> dict[str, str]:
    key = self.key_for(entity_id)
    if field_names is None:
        return self.redis.hgetall(key)
    names = list(field_names)
    if not names:
        return {}
    values = self.redis.hmget(key, names)
    return {n: v for n, v in zip(names, values) if v is not None}
```

The model knows exactly which features it consumes, so the request path always
takes the `HMGET` branch with an explicit field list — that's the
sub-millisecond path. `HGETALL` is the right call for debugging (which is what
the demo's "Inspect" panel does) but not for serving: it forces Redis to
serialize every field, including ones the model doesn't need.

Fields that don't exist (because they were never written, or because they
expired) come back as `None`. The helper drops them from the result dict so
the caller sees only the features that are actually available. A real model
server would either treat missing values as a feature ("this user has no
streaming signal yet") or fall back to a default from the model's training
data.

### Batch scoring with pipelined HMGET

For batch inference, the same `HMGET` shape pipelines across users:

```python
def batch_get_features(
    self,
    entity_ids: Iterable[str],
    field_names: Iterable[str],
) -> dict[str, dict[str, str]]:
    ids = list(entity_ids)
    names = list(field_names)
    if not ids or not names:
        return {}

    pipe = self.redis.pipeline(transaction=False)
    for entity_id in ids:
        pipe.hmget(self.key_for(entity_id), names)
    rows = pipe.execute()

    out: dict[str, dict[str, str]] = {}
    for entity_id, values in zip(ids, rows):
        out[entity_id] = {n: v for n, v in zip(names, values) if v is not None}
    return out
```

One round trip for the whole batch — the demo regularly returns 100 users in
2-3 ms against a local Redis. On a real network the round trip dominates;
pipelining is what keeps batch scoring practical.

For very large batches on a clustered deployment, the same shape generalizes
to one pipeline per shard: bucket the entity IDs by their hash slot
(`cluster.keyslot(key)`), then issue one pipeline against each shard in
parallel. `redis-py`'s
[`RedisCluster` pipeline](https://redis-py.readthedocs.io/en/stable/clustering.html#redis-cluster-pipeline)
handles that automatically — the per-user `HMGET` calls are dispatched to the
right shard transparently.

## The streaming worker

`streaming_worker.py` is the demo's stand-in for whatever Flink, Kafka Streams,
or bespoke service computes the real-time features
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/redis-py/streaming_worker.py)).
It runs as a daemon thread next to the demo server so the UI can start, pause,
and resume it; in production this code would live in the streaming layer.

Every tick the worker picks a few random users, generates a new value for each
streaming feature, and calls `store.update_streaming(user_id, fields)`. The
demo defaults to 5 users per tick at 1-second intervals — so a 200-user store
sees roughly half its users refreshed in the first minute, and most after a
few minutes. Drop `--seed-users` or raise `--users-per-tick` if you'd rather
have every user touched quickly.

```python
def _tick(self) -> None:
    ids = self.store.list_entity_ids(limit=500)
    if not ids:
        return
    chosen = self._rng.sample(ids, k=min(self.users_per_tick, len(ids)))
    now_ms = int(time.time() * 1000)
    for entity_id in chosen:
        fields = {
            "last_login_ts": now_ms,
            "last_device_id": self._rng.choice(DEVICE_IDS),
            "tx_count_5m": self._rng.randint(0, 12),
            "failed_logins_15m": self._rng.choices(
                (0, 1, 2, 5), weights=(70, 20, 8, 2), k=1,
            )[0],
            "session_country": self._rng.choice(SESSION_COUNTRIES),
        }
        self.store.update_streaming(entity_id, fields)
```

Pausing the worker is what shows off the mixed-staleness behavior: leave it
paused for longer than `streaming_ttl_seconds` and the streaming fields
disappear from every user's hash one by one, while the batch fields remain
under the longer key-level `EXPIRE`. The demo's `Pause / resume` button lets
you see this happen in real time.

## The batch builder

`build_features.py` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/redis-py/build_features.py)).
It generates synthetic feature rows and calls `store.bulk_load` once. The
synthesis itself is not the point — in a real deployment the equivalent code
reads from the offline store (Snowflake, BigQuery, Iceberg) and writes the
resulting hashes into Redis.

```python
def synthesize_users(count: int, seed: int = 42) -> dict[str, dict]:
    rng = random.Random(seed)
    users: dict[str, dict] = {}
    for i in range(1, count + 1):
        uid = f"u{i:04d}"
        users[uid] = {
            "country_iso": rng.choice(COUNTRY_CHOICES),
            "risk_segment": rng.choices(
                RISK_SEGMENTS, weights=(70, 25, 5), k=1,
            )[0],
            "account_age_days": rng.randint(7, 2400),
            "tx_count_7d": rng.randint(0, 80),
            "avg_amount_30d": round(rng.uniform(5, 350), 2),
            "chargeback_count_180d": rng.choices(
                (0, 1, 2, 3), weights=(85, 10, 4, 1), k=1,
            )[0],
        }
    return users
```

You can run the builder on its own (independently of the demo server) to
populate Redis from the command line:

```bash
python3 build_features.py --count 500 --ttl-seconds 3600
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL, which is
how a typical operator would pre-seed a feature store from the command line
when debugging.

## The interactive demo

`demo_server.py` runs a `ThreadingHTTPServer` on port 8085. The HTML page lets
you:

* **Bulk-load** any number of users (default 200) with a configurable
  key-level TTL. Drop the TTL to 30 s and watch the entire store expire on
  schedule — the same thing that happens if a daily refresher fails.
* See the **store state** at a glance: user count, batch / streaming TTLs,
  cumulative read/write counters.
* See the **streaming worker** status (running / paused, ticks completed,
  writes performed) and **pause or resume** it. Leave it paused for longer
  than the streaming TTL to watch streaming fields drop out.
* Run an **inference read** for any user with a chosen feature subset, and
  see the value, the per-field TTL, and the read latency.
* Run **batch scoring** with a pipelined `HMGET` across `N` users and see
  the total elapsed time plus the per-user breakdown.
* **Inspect** any user's full hash with field-level TTLs and the key-level
  TTL — the right view for debugging "why is this feature missing?" at
  read time.

The server holds one `RedisFeatureStore` instance and one `StreamingWorker`
for the lifetime of the process. Endpoints:

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

* **Redis 7.4 or later.** [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) and
  [`HTTL`]({{< relref "/commands/httl" >}}) were added in Redis 7.4; the demo
  relies on per-field TTL for the mixed-staleness story.
* **Python 3.9 or later.**
* The `redis-py` client. Install it with:

  ```bash
  pip install "redis>=5.1"
  ```

  Field-level TTL commands (`hexpire`, `httl`) were added to `redis-py` in 5.1.

If your Redis server is running elsewhere, start the demo with `--redis-host`
and `--redis-port`.

## Running the demo

### Get the source files

The demo consists of four Python files. Download them from the
[`redis-py` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/redis-py)
on GitHub, or grab them with `curl`:

```bash
mkdir feature-store-demo && cd feature-store-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/feature-store/redis-py
curl -O $BASE/feature_store.py
curl -O $BASE/build_features.py
curl -O $BASE/streaming_worker.py
curl -O $BASE/demo_server.py
```

### Start the demo server

From that directory:

```bash
python3 demo_server.py
```

You should see:

```text
Dropping any existing users under 'fs:user:*' for a clean demo run (pass --no-reset to keep them).
Redis feature-store demo server listening on http://127.0.0.1:8085
Using Redis at localhost:6379 with key prefix 'fs:user:' (batch TTL 86400s, streaming TTL 300s)
Materialized 200 user(s); streaming worker running.
```

By default the demo wipes the configured key prefix on startup so each run
starts from a clean state. Pass `--no-reset` to keep any existing data, or
`--key-prefix <prefix>` to point the demo at a different prefix entirely.

Open [http://127.0.0.1:8085](http://127.0.0.1:8085) in a browser. Useful things
to try:

* Pick a user and click **Read features** with a mixed batch/streaming subset
  — you'll see batch fields with no per-field TTL (covered by the key-level
  TTL) and streaming fields with a positive per-field TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a 100-user
  batch read.
* Click **Pause / resume** on the streaming worker and leave it paused for
  ~5 minutes (or restart the server with `--streaming-ttl-seconds 30` to
  make it visible in seconds). Re-run **Read features** on any user and
  watch the streaming fields disappear while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level TTLs.
* Click **Bulk-load** with a short TTL (say 30 seconds) and watch the user
  count fall to zero on the next minute — the same thing that happens if a
  daily batch run fails to land.
* Click **Reset** to drop every user and start over.

The server is read/write against your local Redis. The default key prefix is
`fs:user:`. Pass `--no-reset` to keep existing data across restarts, or
`--redis-host` / `--redis-port` to point at a different Redis.

## Production usage

The guidance below focuses on the production concerns that are specific to
running a feature store on Redis. For the generic redis-py production checklist
— connection-pool sizing,
[TLS and AUTH]({{< relref "/develop/clients/redis-py/connect#connect-to-your-production-redis-with-tls" >}}),
[exception handling]({{< relref "/develop/clients/redis-py/produsage#exception-handling" >}}),
and the rest — see the
[redis-py production usage guide]({{< relref "/develop/clients/redis-py/produsage" >}}).
The feature-store demo runs against `localhost` with the defaults; a real
deployment should harden the client first.

### Pick the batch TTL to outlast a failed refresher

The whole-entity `EXPIRE` is your safety net against silent staleness from a
broken batch pipeline. Set it longer than your worst-case batch outage so a
single missed run doesn't take the feature store offline, but short enough
that a sustained outage causes loud failures (missing entities) rather than
quiet ones (yesterday's features being scored as today's). The standard
choice is one cycle of "expected refresh interval × 2" — for a daily batch,
48 hours; for a 6-hour batch, 12 hours.

The same logic applies to the per-field streaming TTL: a few times the
expected update interval so a slow-but-alive streaming worker doesn't churn
features needlessly, but short enough that a stalled worker causes visible
freshness failures.

### Co-locate the online store with serving, not with training

The online store's hash representation does *not* have to match the schema in
your offline store. The batch materialization step is your chance to flatten
joins, encode categoricals, and project to whatever shape the model server
wants — so the request path is exactly one `HMGET` and zero transforms.

The training pipeline reads from the offline store with its own schema; the
serving pipeline reads from Redis with the flattened serving schema. Keeping
those two pipelines as the same code path is what prevents training-serving
skew.

### Pipeline batch reads across shards

On a single Redis instance, pipelining `HMGET` across `N` users is one round
trip. On a Redis Cluster, the keys land on different shards — `redis-py`'s
[`RedisCluster` client](https://redis-py.readthedocs.io/en/stable/clustering.html)
dispatches each `HMGET` to the right shard transparently, but you still pay
one round trip per shard rather than one for the whole batch. For very
latency-sensitive batch inference, group users by shard slot
(`cluster.keyslot(key)`) and issue one pipeline per shard in parallel.

For a small number of frequently-queried users (a top-N customer list, for
example), a hash tag like `fs:user:{vip}:u0001` forces the keys onto the same
shard and lets one pipeline serve them all in one round trip.

### Make HEXPIRE part of every streaming write

The single biggest correctness lever in this design is that the streaming
write applies `HEXPIRE` *every time*. If a streaming worker writes a field
without renewing its TTL, the field carries whatever expiry was there before
— possibly none, possibly stale — and the mixed-staleness invariant breaks.
Keep the `HSET` and `HEXPIRE` in the same pipeline (or, even safer, in the
same [Lua script]({{< relref "/develop/programmability/eval-intro" >}}) if
you don't trust the call site).

### Avoid HGETALL on the request path

`HGETALL` reads every field on the hash, including ones the model doesn't
need. With dozens of features per entity, that is wasted serialization work
on the server and wasted bandwidth on the wire. Always specify the field list
explicitly with `HMGET` in the model server.

The exception is debugging and feature-set discovery, where you genuinely
want the full hash. The demo's "Inspect" button uses `HGETALL` for exactly
this reason.

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

A streaming field that returns `-2` from `HTTL` doesn't exist on the hash
(either it was never written, or it expired); `-1` means the field has no
TTL set (and is therefore covered only by the key-level `EXPIRE`); any
positive value is the remaining TTL in seconds.

## Learn more

This example uses the following Redis commands:

* [`HSET`]({{< relref "/commands/hset" >}}) to write a feature or a whole
  feature row in one call.
* [`HMGET`]({{< relref "/commands/hmget" >}}) to retrieve any subset of
  features for one entity in one round trip.
* [`HGETALL`]({{< relref "/commands/hgetall" >}}) for debugging and
  feature-set discovery.
* [`HEXPIRE`]({{< relref "/commands/hexpire" >}}) and
  [`HTTL`]({{< relref "/commands/httl" >}}) for per-field TTL on streaming
  features (Redis 7.4+).
* [`EXPIRE`]({{< relref "/commands/expire" >}}) and
  [`TTL`]({{< relref "/commands/ttl" >}}) for the whole-entity TTL aligned
  with the batch materialization cycle.
* Pipelined `HMGET` across many entities for batch scoring with one network
  round trip — see [Pipelining]({{< relref "/develop/using-commands/pipelining" >}}).

See the [`redis-py` documentation]({{< relref "/develop/clients/redis-py" >}})
for the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the deeper
conceptual model — including the listpack encoding that makes small hashes
particularly compact in memory, which matters at feature-store scale.
