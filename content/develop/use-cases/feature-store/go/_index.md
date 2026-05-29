---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Build a Redis-backed online feature store in Go with go-redis
linkTitle: go-redis example (Go)
title: Redis feature store with go-redis
weight: 3
---

This guide shows you how to build a small Redis-backed online feature store in
Go with [`go-redis`]({{< relref "/develop/clients/go" >}}). It includes a
local web server built with Go's standard `net/http` package so you can
bulk-load a batch of users with a key-level TTL, run a streaming worker that
overwrites real-time features with per-field TTL, retrieve any subset of
features for one user under 1 ms, and pipeline `HMGET` across a hundred users
for batch scoring.

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

In this example, the batch features describe a user's longer-term shape
(`country_iso`, `risk_segment`, `account_age_days`, `tx_count_7d`,
`avg_amount_30d`, `chargeback_count_180d`) and are bulk-loaded by
`build_features.go` — the demo's stand-in for a nightly Spark / Feast
materialization job. The streaming features describe what the user is doing
right now (`last_login_ts`, `last_device_id`, `tx_count_5m`,
`failed_logins_15m`, `session_country`) and are written by
`streaming_worker.go` — the demo's stand-in for a Flink / Kafka Streams job.
The inference handlers of the demo server read any subset of those features
through `feature_store.go`'s helper type.

That gives you:

* A single round trip for retrieval — any subset of features for one entity in
  one [`HMGET`]({{< relref "/commands/hmget" >}}).
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
materialization cycle, a **streaming path** that updates real-time features
as events arrive, and an **inference path** that reads features on the
request side.

### Batch path (per materialization cycle)

1. The batch job calls `SynthesizeUsers(N, seed)` (in production, the
   equivalent computation lives in an offline pipeline against the warehouse).
   The result is `map[string]FeatureMap` for every user in this cycle.
2. `store.BulkLoad(ctx, rows, ttl)` batches one
   [`HSET`]({{< relref "/commands/hset" >}}) plus one
   [`EXPIRE`]({{< relref "/commands/expire" >}}) per user through go-redis's
   [`Pipeline`]({{< relref "/develop/clients/go/transpipe" >}}), so the whole
   batch ships in a single round trip. The `HSET` writes every batch field;
   the `EXPIRE` is what makes the entity disappear if the next batch run
   fails, so inference reads a missing entity rather than silently outdated
   values.

### Streaming path (per event)

When a user does something (login, transaction, page view) the streaming
layer computes whatever real-time signals fall out of that event and calls
`store.UpdateStreaming(ctx, userID, fields, ttl)`. That batches:

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
2. It calls `store.GetFeatures(ctx, userID, names)`, which is one
   [`HMGET`]({{< relref "/commands/hmget" >}}). Redis returns the values in
   the same order as the requested fields, with `nil` for any field that
   doesn't exist (or has expired).
3. For batch inference, the model server calls
   `store.BatchGetFeatures(ctx, userIDs, names)`, which pipelines one
   [`HMGET`]({{< relref "/commands/hmget" >}}) per user across all `N` users
   in a single network round trip.

## The feature-store helper

The `FeatureStore` type wraps the read/write paths
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/go/feature_store.go)):

```go
package main

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	fs "featurestore"
)

func main() {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	defer rdb.Close()

	store := fs.NewFeatureStore(rdb,
		"fs:user:",
		24*time.Hour,   // whole-entity TTL aligned with the daily batch cycle
		5*time.Minute,  // per-field TTL on each streaming feature
	)

	// Batch materialization: one HSET + EXPIRE per user, all pipelined.
	rows := map[string]fs.FeatureMap{
		"u0001": {"country_iso": "US", "risk_segment": "low",
			"tx_count_7d": 14, "avg_amount_30d": 92.40,
			"account_age_days": 612, "chargeback_count_180d": 0},
		"u0002": {"country_iso": "GB", "risk_segment": "medium",
			"tx_count_7d": 47, "avg_amount_30d": 220.10,
			"account_age_days": 1840, "chargeback_count_180d": 1},
	}
	store.BulkLoad(ctx, rows, store.BatchTTL)

	// Streaming write: HSET + HEXPIRE on just the fields that changed.
	store.UpdateStreaming(ctx, "u0001", fs.FeatureMap{
		"last_login_ts":     time.Now().UnixMilli(),
		"last_device_id":    "ios-9f02",
		"tx_count_5m":       3,
		"failed_logins_15m": 0,
		"session_country":   "US",
	}, store.StreamingTTL)

	// Inference read: HMGET of whatever the model needs.
	features, _ := store.GetFeatures(ctx, "u0001", []string{
		"risk_segment", "tx_count_7d", "avg_amount_30d",
		"tx_count_5m", "failed_logins_15m",
	})
	fmt.Println(features)

	// Batch scoring: pipelined HMGET across many users.
	batch, _ := store.BatchGetFeatures(ctx,
		[]string{"u0001", "u0002", "u0003"},
		[]string{"risk_segment", "tx_count_5m", "failed_logins_15m"},
	)
	fmt.Println(batch)
}
```

### Package layout

Go won't let `package main` live in the same directory as another package, so
the runnable entry points live in `cmd/`:

```text
feature-store/go/
├── go.mod
├── feature_store.go       (package featurestore)
├── build_features.go      (package featurestore; SynthesizeUsers + CLI)
├── streaming_worker.go    (package featurestore)
├── demo_server.go         (package featurestore; RunDemoServer)
└── cmd/
    ├── build_features/main.go   (package main, shim → fs.BuildFeaturesCLI)
    └── demo_server/main.go      (package main, shim → fs.RunDemoServer)
```

Build and run with `go run ./cmd/demo_server`. The shim is the only `main`
package; everything else is library code.

### Data model

Each user is one Redis Hash. Every value is stored as a string — Redis hash
fields are bytes on the wire, so the helper encodes booleans as `"true"` /
`"false"` and renders numbers with `strconv`. The model server is responsible
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

`BulkLoad` pipelines one `HSET` and one `EXPIRE` per user. With 500 users
that's 1000 commands in one network call — Redis processes them sequentially
on the server side but the client only pays one RTT.

```go
func (fs *FeatureStore) BulkLoad(ctx context.Context, rows map[string]FeatureMap, ttl time.Duration) (int, error) {
    if ttl == 0 {
        ttl = fs.BatchTTL
    }
    if len(rows) == 0 {
        return 0, nil
    }
    pipe := fs.rdb.Pipeline()
    for entityID, fields := range rows {
        key := fs.KeyFor(entityID)
        encoded := make(map[string]any, len(fields))
        for name, value := range fields {
            encoded[name] = encode(value)
        }
        pipe.HSet(ctx, key, encoded)
        pipe.Expire(ctx, key, ttl)
    }
    if _, err := pipe.Exec(ctx); err != nil {
        return 0, fmt.Errorf("bulk load: %w", err)
    }
    ...
}
```

go-redis's `Pipeline` is a *non-transactional* batch: commands queue up and
ship in one round trip, but they don't run inside a `MULTI/EXEC` block.
That's the right choice here because each user's `HSET` + `EXPIRE` pair is
independent of every other user's, and an all-or-nothing transaction would
block the server for the duration of the batch. For the rare case where the
pair has to be inseparable (a server crash between the two would leave the
entity without a key-level TTL) you would wrap each user in `rdb.TxPipeline()`
or a Lua script (see [`EVAL`]({{< relref "/commands/eval" >}}) /
[Eval scripting]({{< relref "/develop/programmability/eval-intro" >}})). For
a daily ingestion job that runs end-to-end every cycle, the next run re-pins
the TTL — no extra machinery needed.

In production, the equivalent of this script runs as an offline pipeline (a
Spark or Feast `materialize` job) that reads from the warehouse and writes
into Redis. The
[Feast `RedisOnlineStore`](https://docs.feast.dev/reference/online-stores/redis)
provider does exactly this under the hood; the in-house
[Redis Feature Form]({{< relref "/develop/ai/featureform" >}}) integration
covers the materialize + serve path end-to-end.

### Streaming writes with per-field TTL

`UpdateStreaming` is the linchpin of the mixed-staleness story:

```go
func (fs *FeatureStore) UpdateStreaming(ctx context.Context, entityID string, fields FeatureMap, ttl time.Duration) error {
    if len(fields) == 0 {
        return nil
    }
    if ttl == 0 {
        ttl = fs.StreamingTTL
    }
    key := fs.KeyFor(entityID)
    encoded := make(map[string]any, len(fields))
    names := make([]string, 0, len(fields))
    for name, value := range fields {
        encoded[name] = encode(value)
        names = append(names, name)
    }
    pipe := fs.rdb.Pipeline()
    pipe.HSet(ctx, key, encoded)
    hexpireCmd := pipe.HExpire(ctx, key, ttl, names...)
    if _, err := pipe.Exec(ctx); err != nil {
        return fmt.Errorf("update streaming: %w", err)
    }
    codes, _ := hexpireCmd.Result()
    for _, code := range codes {
        if code != 1 {
            return fmt.Errorf("HEXPIRE did not set every field TTL for %s: %v", key, codes)
        }
    }
    ...
}
```

[`HEXPIRE`]({{< relref "/commands/hexpire" >}}) sets the TTL on *individual*
hash fields, not on the whole key. The two commands are sent in one round
trip and Redis executes them in pipeline order: the `HSET` runs first and
creates or overwrites the fields, then `HEXPIRE` attaches a TTL to each of
those same fields. `HEXPIRE` returns one status code per field — `1` if the
TTL was set, `2` if the expiry was 0 or in the past (so Redis deleted the
field instead), `0` if an `NX | XX | GT | LT` conditional flag was set and
not met (we never use one here), `-2` if the field doesn't exist on the key.
The helper returns an error if any code is anything other than `1`, so the
"every streaming write renews its TTL" invariant fails loudly rather than
silently leaving a streaming field with no expiry attached.

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

`GetFeatures` is one `HMGET`:

```go
func (fs *FeatureStore) GetFeatures(ctx context.Context, entityID string, fieldNames []string) (map[string]string, error) {
    key := fs.KeyFor(entityID)
    if fieldNames == nil {
        return fs.rdb.HGetAll(ctx, key).Result()
    }
    if len(fieldNames) == 0 {
        return map[string]string{}, nil
    }
    values, err := fs.rdb.HMGet(ctx, key, fieldNames...).Result()
    if err != nil {
        return nil, err
    }
    out := make(map[string]string, len(fieldNames))
    for i, name := range fieldNames {
        if s, ok := values[i].(string); ok {
            out[name] = s
        }
    }
    return out, nil
}
```

The model knows exactly which features it consumes, so the request path
always takes the `HMGET` branch with an explicit field list — that's the
sub-millisecond path. `HGETALL` is the right call for debugging (which is
what the demo's "Inspect" panel does) but not for serving: it forces Redis
to serialize every field, including ones the model doesn't need.

Fields that don't exist (because they were never written, or because they
expired) come back as `nil` (a typed `nil`, not a `string` empty). The helper
drops them from the result map so the caller sees only the features that
are actually available. A real model server would either treat missing
values as a feature ("this user has no streaming signal yet") or fall back
to a default from the model's training data.

### Batch scoring with pipelined HMGET

For batch inference, the same `HMGET` shape pipelines across users:

```go
func (fs *FeatureStore) BatchGetFeatures(ctx context.Context, entityIDs, fieldNames []string) (map[string]map[string]string, error) {
    if len(entityIDs) == 0 || len(fieldNames) == 0 {
        return map[string]map[string]string{}, nil
    }
    pipe := fs.rdb.Pipeline()
    cmds := make([]*redis.SliceCmd, len(entityIDs))
    for i, id := range entityIDs {
        cmds[i] = pipe.HMGet(ctx, fs.KeyFor(id), fieldNames...)
    }
    if _, err := pipe.Exec(ctx); err != nil && !errors.Is(err, redis.Nil) {
        return nil, err
    }
    out := make(map[string]map[string]string, len(entityIDs))
    for i, id := range entityIDs {
        values, _ := cmds[i].Result()
        row := make(map[string]string, len(fieldNames))
        for j, name := range fieldNames {
            if s, ok := values[j].(string); ok {
                row[name] = s
            }
        }
        out[id] = row
    }
    return out, nil
}
```

One round trip for the whole batch — the demo regularly returns 100 users in
1-2 ms against a local Redis. On a real network the round trip dominates;
pipelining is what keeps batch scoring practical.

A Redis Cluster is different in two ways: a single `Pipeline.Exec` is bound
to one shard, because non-cross-slot pipelines can only target one node; and
the keys for a typical user batch will land on multiple shards. For batch
reads on a cluster, use the
[`ClusterClient`]({{< relref "/develop/clients/go/connect" >}}) — its
`Pipeline` knows how to dispatch per-shard, so you pay one round trip per
shard rather than one for the whole batch. A hash tag like
`fs:user:{vip}:u0001` forces a known set of keys onto the same shard so one
pipeline can cover all of them in a single round trip.

## The streaming worker

`streaming_worker.go` is the demo's stand-in for whatever Flink, Kafka
Streams, or bespoke service computes the real-time features
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/go/streaming_worker.go)).
It runs as a goroutine next to the demo server so the UI can start, pause,
and resume it; in production this code would live in the streaming layer.

Every tick the worker picks a few random users, generates a new value for
each streaming feature, and calls `store.UpdateStreaming(ctx, userID, fields, 0)`.
The demo defaults to 5 users per tick at 1-second intervals — so a 200-user
store sees roughly half its users refreshed in the first minute, and most
after a few minutes. Raise `--users-per-tick` or drop `--seed-users` if
you'd rather touch every user quickly.

```go
func (w *StreamingWorker) doTick(ctx context.Context) error {
    ids, err := w.store.ListEntityIDs(ctx, 500)
    if err != nil {
        return err
    }
    if len(ids) == 0 {
        return nil
    }
    chosen := w.rng.Perm(len(ids))[:w.usersPerTick]
    nowMs := time.Now().UnixMilli()
    for _, idx := range chosen {
        fields := FeatureMap{
            "last_login_ts":     nowMs,
            "last_device_id":    w.choice(deviceIDs),
            "tx_count_5m":       w.intn(13),
            "failed_logins_15m": w.weightedInt(failedLoginBuckets, failedLoginWeights),
            "session_country":   w.choice(sessionCountries),
        }
        if err := w.store.UpdateStreaming(ctx, ids[idx], fields, 0); err != nil {
            return err
        }
    }
    return nil
}
```

Pausing the worker is what shows off the mixed-staleness behavior: leave it
paused for longer than `streamingTTL` and the streaming fields disappear
from every user's hash one by one, while the batch fields remain under the
longer key-level `EXPIRE`. The demo's `Pause / resume` button lets you see
this happen in real time.

`Pause()` only blocks *future* ticks from running — the goroutine simply
skips its turn on the next ticker fire. A reset that's about to `DEL` every
key needs to wait out an already-running tick too, which is what
`WaitForIdle()` is for: the demo's `Reset` handler calls `worker.Pause()`
*and* `worker.WaitForIdle()` before it issues the `DEL` sweep, so a
mid-flight tick can't recreate a user under a streaming-only hash with no
key-level TTL.

## The batch builder

`build_features.go` is the demo's nightly materializer
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/feature-store/go/build_features.go)).
It generates synthetic feature rows and calls `store.BulkLoad` once. The
synthesis itself is not the point — in a real deployment the equivalent
code reads from the offline store (Snowflake, BigQuery, Iceberg) and writes
the resulting hashes into Redis.

```go
func SynthesizeUsers(count int, seed int64) map[string]FeatureMap {
    rng := rand.New(rand.NewSource(seed))
    users := make(map[string]FeatureMap, count)
    for i := 1; i <= count; i++ {
        uid := fmt.Sprintf("u%04d", i)
        users[uid] = FeatureMap{
            "country_iso":           countryChoices[rng.Intn(len(countryChoices))],
            "risk_segment":          weightedChoiceString(rng, riskSegments, riskWeights),
            "account_age_days":      rng.Intn(2400-7+1) + 7,
            "tx_count_7d":           rng.Intn(81),
            "avg_amount_30d":        roundTo2(rng.Float64()*345.0 + 5.0),
            "chargeback_count_180d": weightedChoiceInt(rng, chargebackBuckets, chargebackWeights),
        }
    }
    return users
}
```

You can run the builder on its own (independently of the demo server) to
populate Redis from the command line:

```bash
go run ./cmd/build_features --count 500 --ttl-seconds 3600
```

That writes 500 users at `fs:user:*` with a one-hour key-level TTL, which is
how a typical operator would pre-seed a feature store from the command line
when debugging.

## The interactive demo

`demo_server.go` runs a `net/http` server on port 8087. The HTML page lets
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

The server holds one `FeatureStore` and one `StreamingWorker` for the
lifetime of the process. Endpoints:

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
* **Go 1.21 or later.**
* The `go-redis` v9 client. The demo's `go.mod` pins
  `github.com/redis/go-redis/v9 v9.18.0` or later.

If your Redis server is running elsewhere, start the demo with `--redis-addr`.

## Running the demo

### Get the source files

The demo lives in a small Go module under
[`feature-store/go`](https://github.com/redis/docs/tree/main/content/develop/use-cases/feature-store/go).
Clone the repo or copy the directory:

```bash
git clone https://github.com/redis/docs.git
cd docs/content/develop/use-cases/feature-store/go
go mod tidy
```

### Start the demo server

From the module directory:

```bash
go run ./cmd/demo_server
```

You should see:

```text
Dropping any existing users under 'fs:user:*' for a clean demo run (pass --no-reset to keep them).
Redis feature-store demo server listening on http://127.0.0.1:8087
Using Redis at localhost:6379 with key prefix 'fs:user:' (batch TTL 86400s, streaming TTL 300s)
Materialized 200 user(s); streaming worker running.
```

By default the demo wipes the configured key prefix on startup so each run
starts from a clean state. Pass `--no-reset` to keep any existing data, or
`--key-prefix <prefix>` to point the demo at a different prefix entirely.

Open [http://127.0.0.1:8087](http://127.0.0.1:8087) in a browser. Useful
things to try:

* Pick a user and click **Read features** with a mixed batch/streaming
  subset — you'll see batch fields with no per-field TTL (covered by the
  key-level TTL) and streaming fields with a positive per-field TTL.
* Click **Pipeline HMGET** with `count=100` to see the latency of a
  100-user batch read.
* Click **Pause / resume** on the streaming worker and leave it paused for
  ~5 minutes (or restart the server with `--streaming-ttl-seconds 30` to
  make it visible in seconds). Re-run **Read features** on any user and
  watch the streaming fields disappear while the batch fields stay.
* Click **Inspect** on a user to see the full hash with field-level TTLs.
* Click **Bulk-load** with a short TTL (say 30 seconds) and watch the user
  count fall to zero on the next minute — the same thing that happens if a
  daily batch run fails to land.
* Click **Reset** to drop every user and start over.

The server is read/write against your local Redis. The default key prefix
is `fs:user:`. Pass `--no-reset` to keep existing data across restarts, or
`--redis-addr` to point at a different Redis.

## Production usage

The guidance below focuses on the production concerns that are specific to
running a feature store on Redis. For the generic go-redis production
checklist — connection-pool sizing, TLS, ACL, context cancellation, and
retry policy — see the
[go-redis production usage guide]({{< relref "/develop/clients/go/produsage" >}})
and the
[connect-with-TLS recipe]({{< relref "/develop/clients/go/connect#connect-to-your-production-redis-with-tls" >}}).
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
expected update interval so a slow-but-alive streaming worker doesn't
churn features needlessly, but short enough that a stalled worker causes
visible freshness failures.

### Co-locate the online store with serving, not with training

The online store's hash representation does *not* have to match the schema
in your offline store. The batch materialization step is your chance to
flatten joins, encode categoricals, and project to whatever shape the model
server wants — so the request path is exactly one `HMGET` and zero
transforms.

The training pipeline reads from the offline store with its own schema; the
serving pipeline reads from Redis with the flattened serving schema.
Keeping those two pipelines as the same code path is what prevents
training-serving skew.

### Pipeline batch reads across shards

On a single Redis instance, pipelining `HMGET` across `N` users through
`Pipeline.Exec` is one round trip. A Redis Cluster is different: a single
`Pipeline.Exec` is bound to one shard, because non-cross-slot pipelines can
only target one node, and the keys for a typical user batch will land on
multiple shards. For batch reads on a cluster, use the
[`ClusterClient`]({{< relref "/develop/clients/go/connect" >}}) — its
`Pipeline` knows how to bucket commands per-shard and ship one batch per
shard in parallel. For a small number of frequently-queried users (a
top-N customer list, for example), a hash tag like `fs:user:{vip}:u0001`
forces a known set of keys onto the same shard so one pipeline can cover
all of them in a single round trip.

### Make HEXPIRE part of every streaming write

The single biggest correctness lever in this design is that the streaming
write applies `HEXPIRE` *every time*. If a streaming worker writes a field
without renewing its TTL, the field carries whatever expiry was there
before — possibly none, possibly stale — and the mixed-staleness invariant
breaks. Keep the `HSET` and `HEXPIRE` in the same pipeline (or, even safer,
in the same [Lua script]({{< relref "/develop/programmability/eval-intro" >}})
if you don't trust the call site).

### Avoid HGETALL on the request path

`HGETALL` reads every field on the hash, including ones the model doesn't
need. With dozens of features per entity, that is wasted serialization work
on the server and wasted bandwidth on the wire. Always specify the field
list explicitly with `HMGet` in the model server.

The exception is debugging and feature-set discovery, where you genuinely
want the full hash. The demo's "Inspect" button uses `HGetAll` for exactly
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
  round trip — see
  [transactions and pipelining]({{< relref "/develop/clients/go/transpipe" >}}).

See the [go-redis documentation]({{< relref "/develop/clients/go" >}}) for
the full client reference, and the
[Hashes overview]({{< relref "/develop/data-types/hashes" >}}) for the deeper
conceptual model — including the listpack encoding that makes small hashes
particularly compact in memory, which matters at feature-store scale.
