---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in Rust with redis-rs
linkTitle: redis-rs example (Rust)
title: Redis job queue with redis-rs
weight: 9
---

This guide shows you how to implement a Redis-backed job queue in Rust with the [`redis`](https://crates.io/crates/redis) crate (redis-rs). It includes a small async web server built with [`axum`](https://docs.rs/axum/) so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

## Overview

A job queue lets your application offload background work — sending email, processing payments, image transcoding, ML inference, webhooks — from the request path. Producers enqueue jobs in milliseconds and return to the user; workers pull from the queue and process them on their own schedule.

That gives you:

* Low-latency user-facing requests, even when downstream work is slow or bursty
* Horizontal scale across many worker processes that share one Redis instance
* At-least-once delivery so a worker crash doesn't lose work
* Visibility-timeout reclaim that returns stuck jobs to the queue automatically
* Job metadata, retry counts, and completion results in Redis hashes with TTL

In this example, each job is identified by a random hex ID and its payload, status, and result live in a Redis hash under `queue:jobs:job:{id}`. Pending IDs sit in a list, claimed IDs move atomically to a *processing* list, and completed or failed IDs land in short history lists.

## How it works

The flow looks like this:

1. The application calls `queue.enqueue(payload).await`
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker task calls `queue.claim(timeout_ms).await`
4. The helper runs [`BLMOVE`]({{< relref "/commands/blmove" >}}) to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash
5. The worker runs the job and calls `queue.complete(&job, result).await` or `queue.fail(&job, error).await`
6. `complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.reclaim_stuck().await` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `RedisJobQueue` struct wraps the queue operations
([source](src/job_queue.rs)):

```rust
use redis::aio::ConnectionManager;
use redis::Client;
use serde_json::json;

use jobqueue_demo::job_queue::{JobQueueOptions, RedisJobQueue};

#[tokio::main]
async fn main() -> redis::RedisResult<()> {
    let client = Client::open("redis://127.0.0.1:6379/")?;
    let conn = ConnectionManager::new(client).await?;
    let queue = RedisJobQueue::new(
        conn,
        JobQueueOptions {
            queue_name: "jobs".to_string(),
            visibility_ms: 5000,
            ..Default::default()
        },
    );

    let job_id = queue
        .enqueue(json!({"kind": "email", "recipient": "alice@example.com"}))
        .await?;
    println!("enqueued {}", job_id);

    // In a worker task:
    if let Some(job) = queue.claim(1000).await? {
        // ... run the job ...
        queue
            .complete(&job, json!({"sent_at": "2026-05-11T15:00:00Z"}))
            .await?;
    }

    // In a periodic sweeper:
    let reclaimed = queue.reclaim_stuck().await?;
    println!("reclaimed {} job(s)", reclaimed.len());

    Ok(())
}
```

`ConnectionManager` is a cheap-to-clone handle that reconnects automatically. Cloning the manager is the standard way to share Redis access across `tokio::spawn`ed tasks.

### Data model

Each job's state lives in a Redis hash plus a position in one of four lists:

```text
queue:jobs:pending          (list)   pending job IDs, oldest at the right
queue:jobs:processing       (list)   claimed but not yet completed
queue:jobs:completed        (list)   recent successes (LTRIM-capped history)
queue:jobs:failed           (list)   terminally failed jobs
queue:jobs:job:{id}         (hash)   per-job metadata
queue:jobs:events           (pubsub) completion notifications
```

A job's hash carries:

```text
queue:jobs:job:9a4f...
  id              = 9a4f...
  payload         = {"kind":"email","recipient":"alice@example.com"}
  status          = pending | processing | completed | failed
  attempts        = 1
  enqueued_at_ms  = 1715441000000
  claimed_at_ms   = 1715441000123
  claim_token     = b3c0d1e2...        (per-claim random token)
  completed_at_ms = 1715441000456
  result          = {"sent_at":"..."}
  last_error      = "smtp timeout"
```

The implementation uses:

* [`LPUSH`]({{< relref "/commands/lpush" >}}) to add new job IDs to the pending list
* [`BLMOVE`]({{< relref "/commands/blmove" >}}) to atomically claim a job into the processing list (the modern replacement for the deprecated `BRPOPLPUSH`)
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs:events` for completion signalling
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) ([`EVALSHA`]({{< relref "/commands/evalsha" >}})) for the complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash

## Enqueueing jobs

`enqueue()` writes the metadata hash and pushes the job ID onto the pending list in one pipeline:

```rust
pub async fn enqueue(&self, payload: Value) -> RedisResult<String> {
    let job_id = Self::token_hex(8);
    let now_ms = Self::now_ms();
    let meta_key = self.meta_key(&job_id);
    let payload_str = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".to_string());

    let fields: Vec<(&str, String)> = vec![
        ("id", job_id.clone()),
        ("payload", payload_str),
        ("status", "pending".to_string()),
        ("attempts", "0".to_string()),
        ("enqueued_at_ms", now_ms.to_string()),
        ("claim_token", "".to_string()),
    ];

    let mut conn = self.conn.clone();
    redis::pipe()
        .atomic()
        .hset_multiple(&meta_key, &fields)
        .ignore()
        .lpush(&self.pending_key, &job_id)
        .ignore()
        .query_async::<_, ()>(&mut conn)
        .await?;

    self.enqueued_total.fetch_add(1, Ordering::Relaxed);
    Ok(job_id)
}
```

The payload is stored as JSON so the queue can carry arbitrary nested structures without forcing every field into a hash.

## Claiming jobs with BLMOVE

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. `BLMOVE` does both in a single Redis call (it's the modern replacement for `BRPOPLPUSH`, which is deprecated in Redis 6.2+):

```rust
pub async fn claim(&self, timeout_ms: u64) -> RedisResult<Option<ClaimedJob>> {
    let timeout_secs = (timeout_ms as f64 / 1000.0).max(0.1);

    let mut conn = self.conn.clone();
    let job_id: Option<String> = redis::cmd("BLMOVE")
        .arg(&self.pending_key)
        .arg(&self.processing_key)
        .arg("RIGHT")
        .arg("LEFT")
        .arg(timeout_secs)
        .query_async(&mut conn)
        .await?;

    let job_id = match job_id { Some(id) => id, None => return Ok(None) };

    let token = Self::token_hex(8);
    let now_ms = Self::now_ms();
    let meta_key = self.meta_key(&job_id);

    let claim_fields: Vec<(&str, String)> = vec![
        ("status", "processing".to_string()),
        ("claimed_at_ms", now_ms.to_string()),
        ("claim_token", token.clone()),
    ];

    let (_, _, meta): ((), i64, HashMap<String, String>) = redis::pipe()
        .atomic()
        .hset_multiple(&meta_key, &claim_fields)
        .hincr(&meta_key, "attempts", 1)
        .hgetall(&meta_key)
        .query_async(&mut conn)
        .await?;

    let payload = meta
        .get("payload")
        .and_then(|raw| serde_json::from_str::<Value>(raw).ok())
        .unwrap_or_else(|| json!({}));
    let attempts = meta
        .get("attempts")
        .and_then(|raw| raw.parse::<i64>().ok())
        .unwrap_or(1);

    Ok(Some(ClaimedJob { id: job_id, payload, attempts, claim_token: token }))
}
```

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

## Completing jobs

`complete()` runs a Lua script so the processing-list removal, the metadata write, and the history push happen atomically:

```rust
pub async fn complete(&self, job: &ClaimedJob, result: Value) -> RedisResult<bool> {
    let result_str = serde_json::to_string(&result).unwrap_or_else(|_| "{}".to_string());
    let now_ms = Self::now_ms();

    let mut conn = self.conn.clone();
    let ok: i64 = Script::new(COMPLETE_SCRIPT)
        .key(&self.meta_prefix)
        .key(&self.processing_key)
        .key(&self.completed_key)
        .arg(&job.id)
        .arg(&job.claim_token)
        .arg("completed")
        .arg(now_ms)
        .arg(result_str)
        .arg(self.completed_ttl as i64)
        .arg(self.completed_history)
        .invoke_async(&mut conn)
        .await?;

    if ok == 0 { return Ok(false); }

    let event = json!({"id": job.id, "status": "completed"}).to_string();
    let _: i64 = conn.publish(&self.events_channel, event).await?;
    self.completed_total.fetch_add(1, Ordering::Relaxed);
    Ok(true)
}
```

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```rust
pub async fn fail(&self, job: &ClaimedJob, error: &str) -> RedisResult<bool> {
    let retry = job.attempts < self.max_attempts;
    let now_ms = Self::now_ms();
    let retry_arg = if retry { "1" } else { "0" };

    let mut conn = self.conn.clone();
    let result: i64 = Script::new(FAIL_SCRIPT)
        .key(&self.meta_prefix)
        .key(&self.processing_key)
        .key(&self.pending_key)
        .key(&self.failed_key)
        .arg(&job.id)
        .arg(&job.claim_token)
        .arg(error)
        .arg(now_ms)
        .arg(self.completed_ttl as i64)
        .arg(self.completed_history)
        .arg(retry_arg)
        .invoke_async(&mut conn)
        .await?;

    Ok(result != 0)
}
```

The attempt counter is incremented on every `claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `reclaim_stuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```rust
pub async fn reclaim_stuck(&self) -> RedisResult<Vec<String>> {
    let now_ms = Self::now_ms();
    let mut conn = self.conn.clone();
    let reclaimed: Vec<String> = Script::new(RECLAIM_SCRIPT)
        .key(&self.pending_key)
        .key(&self.processing_key)
        .key(&self.meta_prefix)
        .arg(now_ms)
        .arg(self.visibility_ms as i64)
        .invoke_async(&mut conn)
        .await?;

    if !reclaimed.is_empty() {
        self.reclaimed_total
            .fetch_add(reclaimed.len() as i64, Ordering::Relaxed);
    }
    Ok(reclaimed)
}
```

The Lua script also handles a narrower race: a worker that crashed between `BLMOVE` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`stats()` reports queue depth plus per-process counters. The counters are held in `Arc<AtomicI64>` so they're cheap to read from any task that holds a clone of the queue:

```rust
pub async fn stats(&self) -> RedisResult<Value> {
    let mut conn = self.conn.clone();
    let (pending, processing, completed, failed): (i64, i64, i64, i64) = redis::pipe()
        .atomic()
        .llen(&self.pending_key)
        .llen(&self.processing_key)
        .llen(&self.completed_key)
        .llen(&self.failed_key)
        .query_async(&mut conn)
        .await?;

    Ok(json!({
        "enqueued_total": self.enqueued_total.load(Ordering::Relaxed),
        "completed_total": self.completed_total.load(Ordering::Relaxed),
        "failed_total": self.failed_total.load(Ordering::Relaxed),
        "reclaimed_total": self.reclaimed_total.load(Ordering::Relaxed),
        "pending_depth": pending,
        "processing_depth": processing,
        "completed_depth": completed,
        "failed_depth": failed,
        "visibility_ms": self.visibility_ms,
    }))
}
```

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a longer-term audit log if needed.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). `BLMOVE` requires Redis 6.2+; on older servers, replace the call with `BRPOPLPUSH`.
* Rust 1.75 or later.
* The [`redis`](https://crates.io/crates/redis) crate at 0.27+ (or 0.24+ if you only need `BRPOPLPUSH`-style claims).

Add the crate dependencies to your `Cargo.toml`:

```toml
[dependencies]
redis = { version = "0.27", features = ["tokio-comp", "aio", "connection-manager"] }
tokio = { version = "1", features = ["full"] }
axum = "0.7"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rand = "0.8"
```

The `connection-manager` feature gives you `ConnectionManager` — a cheap, cloneable, auto-reconnecting handle that's the right primitive for sharing one Redis client across many `tokio::spawn`ed tasks.

## Running the demo

From the [`rust`](.) directory, build and start the demo server:

```bash
cargo run --release
```

You should see:

```text
Redis job-queue demo server listening on http://127.0.0.1:8798
Using Redis at redis://127.0.0.1:6379/
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8798](http://127.0.0.1:8798) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

The demo accepts a `--visibility-ms` flag to tune the visibility timeout, and reads a `REDIS_URL` environment variable if your Redis lives somewhere other than `redis://127.0.0.1:6379/`.

## The mock worker pool

The demo includes a small `Worker` and `WorkerPool` ([source](src/worker.rs)) that stands in for whatever real background work your application would run. Each worker is a `tokio::spawn`ed task that:

* Blocks on `queue.claim(500).await` for new jobs.
* `tokio::time::sleep`s `work_latency_ms` to simulate doing the work.
* Either completes successfully, fails (calling `queue.fail()`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

The pool's shutdown channel is a `tokio::sync::watch::Receiver<bool>`. Calling `pool.stop()` flips the watch value to `true`; each worker checks it before the next `claim()`. The pool's `WorkerConfig` lives behind a `tokio::sync::Mutex` so the HTTP `/workers/configure` handler can update knobs without restarting the workers.

The `fail_rate` and `hang_rate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

## Production usage

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `reclaim_stuck()` from a `tokio::time::interval` loop (every few seconds for fast queues, every minute for slow ones), or from each worker before it blocks on `claim()`. Both patterns work as long as *someone* runs the sweep.

### Share one `ConnectionManager` across tasks

`ConnectionManager` is cheap to `clone()` — internally it's an `Arc` around the real connection — and it handles automatic reconnection on transient failures. The helper struct stores one and clones it inside every async method, so a `WorkerPool` of 32 workers still uses a single underlying multiplexed connection.

### Use a separate Redis database or key prefix per queue

The helper takes a `queue_name` argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `max_attempts` per job kind

A blanket `max_attempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `max_attempts` on `JobQueueOptions` so each queue can pick its own policy.

### Inspect queue state directly in Redis

Because the queue is just lists and hashes, you can inspect it with `redis-cli`:

```bash
# How many pending jobs?
redis-cli LLEN queue:jobs:pending

# Look at the next 5 jobs to be picked up.
redis-cli LRANGE queue:jobs:pending -5 -1

# Read a job's metadata.
redis-cli HGETALL queue:jobs:job:9a4f0d1c

# How many jobs are currently being processed?
redis-cli LLEN queue:jobs:processing

# Clear everything for this queue (be careful — this deletes work).
redis-cli --scan --pattern 'queue:jobs:*' | xargs redis-cli DEL
```

## Learn more

This example uses the following Redis commands:

* [`LPUSH`]({{< relref "/commands/lpush" >}}) to enqueue a job ID.
* [`BLMOVE`]({{< relref "/commands/blmove" >}}) to atomically claim a job into the processing list.
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a job from the processing list on complete or fail.
* [`LRANGE`]({{< relref "/commands/lrange" >}}) and [`LLEN`]({{< relref "/commands/llen" >}}) to read queue depth and list contents.
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history.
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) for automatic cleanup of completed and failed jobs.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) for job-completion notifications.
* [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for atomic complete, fail, and reclaim flows.

See the [`redis-rs` crate documentation](https://docs.rs/redis/) for the client reference.
