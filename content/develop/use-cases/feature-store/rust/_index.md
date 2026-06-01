---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in Rust with redis-rs
linkTitle: redis-rs example (Rust)
title: Redis feature store with redis-rs
weight: 6
---

This guide shows you how to build a small Redis-backed online feature store in
Rust with the async [redis-rs]({{< relref "/develop/clients/rust" >}}) crate
and `tokio`. The demo runs on top of the [axum](https://docs.rs/axum/)
web framework so you can bulk-load a batch of users with a key-level TTL, run
a streaming worker that overwrites real-time features with per-field TTL,
retrieve any subset of features for one user under 2 ms, and pipeline `HMGET`
across a hundred users for batch scoring.

## Overview

Each entity (here, a user) is one Redis
[Hash]({{< relref "/develop/data-types/hashes" >}}) at a deterministic key —
`fs:user:{id}`. The hash holds every feature for that entity as one field per
feature: batch-materialized aggregates (refreshed once a day) alongside
streaming-updated signals (refreshed every few seconds). One
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

## How redis-rs fits the demo

Two crate facts shape the helper:

* **`ConnectionManager` is the canonical async connection.** It owns a
  multiplexed `MultiplexedConnection` underneath and transparently reconnects
  on a dropped socket. The type is `Clone` — handing it to one HTTP handler,
  the streaming worker, and the batch builder is just three `clone()` calls,
  and they all share the same underlying connection. There's no pool to
  manage.
* **The `redis::cmd("HEXPIRE")` builder is how you reach commands not yet
  typed on the `AsyncCommands` trait.** Per-field TTL bindings (`hexpire`,
  `httl`, `hpersist`) aren't part of the typed surface on redis-rs 0.27, so
  the helper issues them with the generic command builder. The wire bytes
  are identical to the typed form.

In this example, the batch features describe a user's longer-term shape
(`country_iso`, `risk_segment`, `account_age_days`, `tx_count_7d`,
`avg_amount_30d`, `chargeback_count_180d`) and are bulk-loaded by
`build_features.rs` — the demo's stand-in for a nightly Spark / Feast
materialization job. The streaming features describe what the user is doing
right now (`last_login_ts`, `last_device_id`, `tx_count_5m`,
`failed_logins_15m`, `session_country`) and are written by
`streaming_worker.rs` — a tokio task that stands in for a Flink / Kafka
Streams job. The HTTP handlers in `demo_server.rs` read any subset of those
features through `feature_store.rs`'s helper struct.

## How it works

There are three paths: a **batch path** that bulk-loads features once per
materialization cycle, a **streaming path** that updates real-time features
as events arrive, and an **inference path** that reads features on the
request side.

### Batch path (per materialization cycle)

1. The batch job calls `synthesize_users(N, seed)` (in production, the
   equivalent computation lives in an offline pipeline against the
   warehouse). The result is a `Vec<(String, FeatureMap)>` for every user
   in this cycle.
2. `store.bulk_load(&rows, ttl_seconds).await` queues one
   [`HSET`]({{< relref "/commands/hset" >}}) plus one
   [`EXPIRE`]({{< relref "/commands/expire" >}}) per user through a
   non-transactional `redis::pipe()`, so the whole batch ships in a single
   round trip.

### Streaming path (per event)

When a user does something (login, transaction, page view) the streaming
layer computes whatever real-time signals fall out of that event and
calls `store.update_streaming(user_id, &fields, ttl_seconds).await`. That
queues:

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
2. It calls `store.get_features(user_id, &names).await`, which is one
   [`HMGET`]({{< relref "/commands/hmget" >}}). Redis returns the values
   in the same order as the requested fields, with `None` for any field
   that doesn't exist (or has expired).
3. For batch inference, the model server calls
   `store.batch_get_features(&user_ids, &names).await`, which pipelines
   one [`HMGET`]({{< relref "/commands/hmget" >}}) per user across all
   `N` users in a single network round trip via `redis::pipe()`.

## The feature-store helper

The `FeatureStore` struct wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/rust/feature_store.rs)):

```rust
use redis::aio::ConnectionManager;
use feature_store_demo::feature_store::{FeatureStore, FeatureMap, FeatureValue};
use std::collections::BTreeMap;

let client = redis::Client::open("redis://127.0.0.1/")?;
let conn = ConnectionManager::new(client).await?;
let store = FeatureStore::new(
    conn,
    "fs:user:",
    24 * 60 * 60,    // whole-entity TTL aligned with the daily batch cycle
    5 * 60,          // per-field TTL on each streaming feature
);

// Batch materialization: one HSET + EXPIRE per user, all pipelined
// through one round trip.
let mut row: FeatureMap = BTreeMap::new();
row.insert("country_iso".into(), FeatureValue::Str("US".into()));
row.insert("risk_segment".into(), FeatureValue::Str("low".into()));
row.insert("tx_count_7d".into(), FeatureValue::Int(14));
row.insert("avg_amount_30d".into(), FeatureValue::Float(92.40));
store.bulk_load(&[("u0001".into(), row)], 24 * 60 * 60).await?;

// Streaming write: HSET + HEXPIRE on just the fields that changed.
let mut s: FeatureMap = BTreeMap::new();
s.insert("last_login_ts".into(), FeatureValue::Int(1716998413541));
s.insert("tx_count_5m".into(), FeatureValue::Int(3));
store.update_streaming("u0001", &s, 5 * 60).await?;

// Inference read: HMGET of whatever the model needs.
let features = store.get_features(
    "u0001",
    &["risk_segment", "tx_count_7d", "avg_amount_30d",
      "tx_count_5m", "last_login_ts"],
).await?;

// Batch scoring: pipelined HMGET across many users.
let batch = store.batch_get_features(
    &["u0001".into(), "u0002".into()],
    &["risk_segment", "tx_count_5m"],
).await?;
```

### Project layout

The crate is a small lib + two binaries:

```text
feature-store/rust/
├── Cargo.toml
├── lib.rs                  (pub mod feature_store; pub mod streaming_worker; pub mod build_features;)
├── feature_store.rs        — FeatureStore struct + methods
├── streaming_worker.rs     — async tokio task worker
├── build_features.rs       — SynthesizeUsers + cli_main()
├── demo_server.rs          — main() for the demo server (axum)
├── build_features_bin.rs   — main() for the CLI builder
└── demo_template.html      — HTML page, baked in via include_str!
```

Run with `cargo run --release --bin demo_server` or
`cargo run --release --bin build_features -- --count 500`.

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis hash
fields are bytes on the wire, so the helper encodes booleans as `"true"` /
`"false"` and renders numbers via `i64::to_string` / `f64::to_string`. The
model server is responsible for parsing back to the right type, the same way
it would when reading any serialized feature store.

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
non-transactional batch through `redis::pipe()`. With 500 users that's 1000
commands in one network call — Redis processes them sequentially on the
server side but the client only pays one RTT.

```rust
pub async fn bulk_load(
    &self,
    rows: &[(String, FeatureMap)],
    ttl_seconds: u64,
) -> RedisResult<usize> {
    if rows.is_empty() { return Ok(0); }
    let mut pipe = redis::pipe();
    for (entity_id, fields) in rows {
        let key = self.key_for(entity_id);
        let encoded: Vec<(&str, String)> = fields
            .iter().map(|(k, v)| (k.as_str(), v.encode())).collect();
        pipe.hset_multiple(&key, &encoded).ignore();
        pipe.expire(&key, ttl_seconds as i64).ignore();
    }
    let mut conn = self.conn.clone();
    pipe.query_async::<()>(&mut conn).await?;
    ...
}
```

`redis::pipe()` is a non-transactional builder: commands queue up and ship in
one round trip, but they don't run inside a `MULTI/EXEC` block. That's the
right choice here because each user's `HSET` + `EXPIRE` pair is independent
of every other user's, and an all-or-nothing transaction would block the
server for the duration of the batch. For the rare case where the pair has
to be inseparable, swap to `redis::pipe().atomic()` (which wraps in
`MULTI/EXEC`) or a Lua script via
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

```rust
pub async fn update_streaming(
    &self,
    entity_id: &str,
    fields: &FeatureMap,
    ttl_seconds: u64,
) -> RedisResult<()> {
    if fields.is_empty() { return Ok(()); }
    let key = self.key_for(entity_id);
    let encoded: Vec<(&str, String)> = fields.iter()
        .map(|(k, v)| (k.as_str(), v.encode())).collect();
    let names: Vec<&str> = fields.keys().map(|s| s.as_str()).collect();

    let mut pipe = redis::pipe();
    pipe.hset_multiple(&key, &encoded).ignore();
    // HEXPIRE wire form: HEXPIRE key seconds FIELDS count field...
    let mut hexpire = redis::cmd("HEXPIRE");
    hexpire.arg(&key).arg(ttl_seconds).arg("FIELDS").arg(names.len());
    for n in &names { hexpire.arg(n); }
    pipe.add_command(hexpire);

    let mut conn = self.conn.clone();
    // Pipeline returns one entry per non-ignored command; HSET's
    // reply was dropped with .ignore(), so the only remaining entry
    // is HEXPIRE's per-field code list.
    let pipe_result: Vec<Vec<i64>> = pipe.query_async(&mut conn).await?;
    let codes = pipe_result.into_iter().next().unwrap_or_default();
    for code in &codes {
        if *code != 1 {
            return Err(redis::RedisError::from((
                redis::ErrorKind::ResponseError,
                "HEXPIRE invariant violated",
                format!("HEXPIRE did not set every field TTL for {key}: {codes:?}"),
            )));
        }
    }
    ...
}
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on *individual*
hash fields, not on the whole key. The two commands are queued under one
flush so Redis runs them in pipeline order: the `HSET` first creates or
overwrites the fields, then `HEXPIRE` attaches a TTL to each of those same
fields. `HEXPIRE` returns one status code per field — `1` if the TTL was
set, `2` if the expiry was 0 or in the past (so Redis deleted the field
instead), `0` if an `NX | XX | GT | LT` conditional flag was specified and
not met (we never use one here), `-2` if the field doesn't exist on the
key. The helper returns a `RedisError` if any code is anything other than
`1`, so the "every streaming write renews its TTL" invariant fails loudly
rather than silently leaving a streaming field with no expiry attached.

The pipeline reply shape — `Vec<Vec<i64>>` — is the one tricky bit. redis-rs
wraps each non-ignored command's reply in the outer `Vec`, even when there
is only one such command. The HEXPIRE reply itself is an array, so we
end up with one outer `Vec` containing one inner `Vec<i64>` of codes.

If a streaming pipeline stops, the streaming fields drop out one by one as
their per-field TTLs elapse. `field_ttls_seconds` (which wraps `HTTL`) lets
the model side inspect the remaining TTL on any field — useful both for
debugging and as a freshness signal in the model itself.

> **HEXPIRE requires Redis 7.4 or later.** `HEXPIRE` and the field-level
> TTL commands (`HTTL`, `HPERSIST`, `HEXPIREAT`, `HPEXPIRE`, `HPEXPIREAT`,
> `HPTTL`, `HEXPIRETIME`, `HPEXPIRETIME`) were added in Redis 7.4. The
> demo's `Cargo.toml` pins `redis = "0.27"` and uses
> `redis::cmd("HEXPIRE")` because the typed binding doesn't ship on that
> client line yet — the wire bytes are identical.

### Inference reads with HMGET

`get_features` is one `HMGET`:

```rust
pub async fn get_features(
    &self,
    entity_id: &str,
    field_names: &[&str],
) -> RedisResult<BTreeMap<String, String>> {
    if field_names.is_empty() { return Ok(BTreeMap::new()); }
    let key = self.key_for(entity_id);
    let mut conn = self.conn.clone();
    let values: Vec<Option<String>> = conn.hget(&key, field_names).await?;
    let mut out = BTreeMap::new();
    for (n, v) in field_names.iter().zip(values.into_iter()) {
        if let Some(s) = v { out.insert((*n).to_string(), s); }
    }
    ...
}
```

`conn.hget` with a slice of field names is redis-rs's way of issuing
`HMGET` (the typed `hmget` and `hget(slice)` produce the same wire bytes).
The reply is `Vec<Option<String>>` — fields that don't exist on the hash
come back as `None`, which the helper drops from the result map.

### Batch scoring with pipelined HMGET

For batch inference, the same `HMGET` shape pipelines across users:

```rust
pub async fn batch_get_features(
    &self,
    entity_ids: &[String],
    field_names: &[&str],
) -> RedisResult<BTreeMap<String, BTreeMap<String, String>>> {
    if entity_ids.is_empty() || field_names.is_empty() {
        return Ok(BTreeMap::new());
    }
    let mut pipe = redis::pipe();
    for id in entity_ids {
        pipe.hget(self.key_for(id), field_names);
    }
    let mut conn = self.conn.clone();
    let rows: Vec<Vec<Option<String>>> = pipe.query_async(&mut conn).await?;
    ...
}
```

One round trip for the whole batch. The demo returns a 30-user batch in
under 1 ms against a local Redis.

A Redis Cluster is different: a single `redis::pipe()` is bound to one
connection, and a `ConnectionManager` holds one connection to one node.
For batch reads on a cluster, use redis-rs's
[`cluster_async`](https://docs.rs/redis/0.27/redis/cluster_async/index.html)
client and either fan out parallel `hget` calls (the cluster client routes
each one to the right shard) or, for tighter control, group entity IDs by
hash slot and run one pipeline per shard in parallel. A hash tag like
`fs:user:{vip}:u0001` forces a known set of keys onto the same shard so
one pipeline can cover them all in a single round trip.

## The streaming worker

`streaming_worker.rs` is the demo's stand-in for whatever Flink, Kafka
Streams, or bespoke service computes the real-time features
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/rust/streaming_worker.rs)).
It runs as a tokio task next to the demo server so the UI can start,
pause, and resume it.

```rust
async fn run(state: Arc<State>) {
    struct Guard<'a>(&'a State);
    impl Drop for Guard<'_> {
        fn drop(&mut self) {
            // Clear running and tick_in_flight no matter how the
            // task exits — a panic, a manual stop, anything.
            self.0.running.store(false, Ordering::Relaxed);
            self.0.tick_in_flight.store(false, Ordering::Relaxed);
        }
    }
    let _guard = Guard(&state);

    let mut interval = time::interval(state.tick);
    interval.set_missed_tick_behavior(time::MissedTickBehavior::Skip);
    interval.tick().await;  // skip the first immediate tick

    loop {
        if state.stop.load(Ordering::Relaxed) { return; }
        interval.tick().await;

        // Set tick_in_flight *before* the pause check so a concurrent
        // pause()+wait_for_idle() can never see tick_in_flight=false
        // in the window between the pause check and the actual
        // do_tick call.
        state.tick_in_flight.store(true, Ordering::Relaxed);
        let result = if !state.paused.load(Ordering::Relaxed) {
            do_tick(&state).await
        } else { Ok(()) };
        state.tick_in_flight.store(false, Ordering::Relaxed);
        if let Err(e) = result {
            eprintln!("[streaming-worker] tick failed: {e}");
        }
    }
}
```

The same pre-flight-`tick_in_flight` + drop-`Guard` pattern as every other
client in this use case closes the pause/in-flight race: a reset that's
about to `DEL` every key calls `worker.pause()` to stop *future* ticks
*and* `worker.wait_for_idle().await` to flush a mid-flight tick before
issuing the DEL sweep.

Pausing the worker is what shows off the mixed-staleness behavior: leave
it paused for longer than `streaming_ttl_seconds` and the streaming fields
disappear from every user's hash one by one, while the batch fields remain
under the longer key-level `EXPIRE`. The demo's `Pause / resume` button
lets you see this happen in real time.

## The batch builder

`build_features.rs` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/rust/build_features.rs)).
It generates synthetic feature rows and calls `store.bulk_load` once. The
synthesis itself is not the point — in a real deployment the equivalent
code reads from the offline store (Snowflake, BigQuery, Iceberg) and writes
the resulting hashes into Redis.

Run the builder on its own (independently of the demo server) to populate
Redis from the command line:

```bash
cargo run --release --bin build_features -- --count 500 --ttl-seconds 3600
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL, which
is how a typical operator would pre-seed a feature store from the command
line when debugging.

## The interactive demo

`demo_server.rs` runs the axum HTTP server on port 8090. The HTML page lets
you:

* **Bulk-load** any number of users (default 200) with a configurable
  key-level TTL.
* See the **store state**: user count, batch / streaming TTLs, cumulative
  read/write counters.
* See the **streaming worker** status and **pause or resume** it.
* Run an **inference read** for any user with a chosen feature subset, and
  see the value, the per-field TTL, and the read latency.
* Run **batch scoring** with a pipelined `HMGET` across `N` users.
* **Inspect** any user's full hash with field-level TTLs and the key-level
  TTL.

The server holds one `FeatureStore` and one `StreamingWorker` for the
lifetime of the process. Both wrap clones of the same `ConnectionManager`,
so every HTTP handler and the streaming worker share the underlying
multiplexed socket. Endpoints:

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
  [`HTTL`]({{< relref "/commands/httl" >}}) were added in Redis 7.4; the
  demo relies on per-field TTL for the mixed-staleness story.
* **Rust 1.74 or later.** The demo uses `async fn` in traits, `let-else`,
  and other recent ergonomics. Earlier stable Rust may compile after small
  tweaks.
* **redis-rs 0.27 or later.** The demo's `Cargo.toml` pins 0.27 with the
  `tokio-comp`, `aio`, and `connection-manager` features. Per-field TTL
  commands are issued via `redis::cmd("HEXPIRE")`.

If your Redis server is running elsewhere, start the demo with
`--redis-url redis://host:port/`.

## Running the demo

### Get the source files

The demo lives in a small Cargo project under
[`feature-store/rust`](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/rust).
Clone the repo or copy the directory:

```bash
git clone https://github.com/redis/docs.git
cd docs/content/develop/use-cases/feature-store/rust
cargo build --release
```

### Start the demo server

From the project directory:

```bash
cargo run --release --bin demo_server
```

You should see:

```text
Dropping any existing users under 'fs:user:*' for a clean demo run (pass --no-reset to keep them).
Redis feature-store demo server listening on http://127.0.0.1:8090
Using Redis at redis://127.0.0.1/ with key prefix 'fs:user:' (batch TTL 86400s, streaming TTL 300s)
Materialized 200 user(s); streaming worker running.
```

Open [http://127.0.0.1:8090](http://127.0.0.1:8090). Useful things to try:

* Pick a user and click **Read features** with a mixed batch/streaming
  subset — you'll see batch fields with no per-field TTL (covered by the
  key-level TTL) and streaming fields with a positive per-field TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a
  100-user batch read.
* Click **Pause / resume** on the streaming worker and leave it paused
  for ~5 minutes (or restart the server with
  `--streaming-ttl-seconds 30` to make it visible in seconds). Re-run
  **Read features** on any user and watch the streaming fields disappear
  while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level TTLs.
* Click **Reset** to drop every user and start over.

## Production usage

The guidance below focuses on the production concerns specific to running
a feature store on Redis. For the generic redis-rs production checklist
— TLS, AUTH, retry/backoff, error handling — see the
[redis-rs client guide]({{< relref "/develop/clients/rust" >}}) and the
[error-handling notes]({{< relref "/develop/clients/rust/error-handling" >}}).
The feature-store demo runs against `localhost` with the defaults; a real
deployment should harden the client first.

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

### Pipeline batch reads across shards

On a single Redis instance, a pipelined `HMGET` across `N` users is one
round trip. A Redis Cluster is different: a single `redis::pipe()` ships
through one connection to one node, so on a cluster you need redis-rs's
[`cluster_async`](https://docs.rs/redis/0.27/redis/cluster_async/index.html)
client. Either fan out parallel `hget` calls (the cluster client routes
each one to the right shard) or group entity IDs by hash slot and issue
one pipeline against each shard in parallel.

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
Always specify the field list explicitly with `hget(&[...])` (or the
typed `hmget`) in the model server.

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
hash (either it was never written, or it expired); `-1` means the field
has no TTL set (and is therefore covered only by the key-level
`EXPIRE`); any positive value is the remaining TTL in seconds.

## Learn more

This example uses the following Redis commands:

* [`HSET`]({{< relref "/commands/hset" >}}) to write a feature or a whole
  feature row in one call.
* [`HMGET`]({{< relref "/commands/hmget" >}}) to retrieve any subset of
  features for one entity in one round trip.
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
  [transactions and pipelining]({{< relref "/develop/clients/rust/transpipe" >}}).

See the [redis-rs documentation]({{< relref "/develop/clients/rust" >}})
for the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the
deeper conceptual model — including the listpack encoding that makes
small hashes particularly compact in memory, which matters at
feature-store scale.
