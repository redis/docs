---
aliases:
- /develop/use-cases/job-queue/node-redis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in Node.js with node-redis
linkTitle: node-redis example (Node.js)
title: Redis job queue with node-redis
weight: 2
---

This guide shows you how to implement a Redis-backed job queue in Node.js with [`node-redis`]({{< relref "/develop/clients/nodejs" >}}). It includes a small local web server built with Node's standard `http` module so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

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

1. The application calls `queue.enqueue(payload)`
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker calls `queue.claim(timeoutMs)`
4. The helper runs `BLMOVE` (the successor to `BRPOPLPUSH`) to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash
5. The worker runs the job and calls `queue.complete(job, result)` or `queue.fail(job, error)`
6. `complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.reclaimStuck()` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `RedisJobQueue` class wraps the queue operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/nodejs/job_queue.js)):

```javascript
const { createClient } = require("redis");
const { RedisJobQueue } = require("./job_queue");

async function main() {
  const client = createClient({ url: "redis://localhost:6379" });
  await client.connect();

  const queue = new RedisJobQueue({ redisClient: client, visibilityMs: 5000 });

  const jobId = await queue.enqueue({ kind: "email", recipient: "alice@example.com" });

  // In a worker process:
  const job = await queue.claim(1000);
  if (job !== null) {
    try {
      // ... run the job ...
      await queue.complete(job, { sent_at: "2026-05-11T15:00:00Z" });
    } catch (err) {
      await queue.fail(job, String(err));
    }
  }

  // In a periodic sweeper:
  const reclaimed = await queue.reclaimStuck();

  await client.quit();
}

main().catch(console.error);
```

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
* [`BLMOVE`]({{< relref "/commands/blmove" >}}) to atomically claim a job into the processing list (the modern replacement for the deprecated [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}))
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs:events` for completion signalling
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) ([`EVALSHA`]({{< relref "/commands/evalsha" >}})) for the complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash

## Enqueueing jobs

`enqueue()` writes the metadata hash and pushes the job ID onto the pending list in one transaction (`MULTI` pipeline):

```javascript
async enqueue(payload) {
  const jobId = crypto.randomBytes(8).toString("hex");
  const nowMs = Date.now();
  const meta = {
    id: jobId,
    payload: JSON.stringify(payload),
    status: "pending",
    attempts: "0",
    enqueued_at_ms: String(nowMs),
    claim_token: "",
  };
  const multi = this.redis.multi();
  multi.hSet(this._metaKey(jobId), meta);
  multi.lPush(this.pendingKey, jobId);
  await multi.exec();
  this._enqueued += 1;
  return jobId;
}
```

The payload is stored as JSON so the queue can carry arbitrary nested structures without forcing every field into a hash. Hash field values are all strings — `node-redis` won't convert numbers for you, so the helper coerces them explicitly.

## Claiming jobs with BLMOVE

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. In Redis 6.2 and later this is `BLMOVE`; the older `BRPOPLPUSH` is deprecated and was removed from `node-redis` in v5:

```javascript
async claim(timeoutMs = 1000) {
  const timeoutS = Math.max(timeoutMs / 1000, 0.1);
  const jobId = await this.redis.blMove(
    this.pendingKey,
    this.processingKey,
    "RIGHT",
    "LEFT",
    timeoutS,
  );
  if (jobId === null || jobId === undefined) {
    return null;
  }

  const token = crypto.randomBytes(8).toString("hex");
  const nowMs = Date.now();
  const metaKey = this._metaKey(jobId);
  const multi = this.redis.multi();
  multi.hSet(metaKey, {
    status: "processing",
    claimed_at_ms: String(nowMs),
    claim_token: token,
  });
  multi.hIncrBy(metaKey, "attempts", 1);
  multi.hGetAll(metaKey);
  const results = await multi.exec();
  const meta = results[2] || {};
  return new ClaimedJob(jobId, JSON.parse(meta.payload || "{}"), Number(meta.attempts), token);
}
```

`BLMOVE pending processing RIGHT LEFT timeoutS` is the byte-for-byte equivalent of the old `BRPOPLPUSH pending processing timeoutS` — pop from the right end of pending, push onto the left end of processing, atomically, blocking up to `timeoutS` seconds.

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

## Completing jobs

`complete()` runs a Lua script via `EVALSHA` so the processing-list removal, the metadata write, and the history push happen atomically:

```javascript
async complete(job, result) {
  const ok = await this._evalScript(COMPLETE_SCRIPT, this._completeSha, {
    keys: [this.metaPrefix, this.processingKey, this.completedKey],
    arguments: [
      job.id,
      job.claimToken,
      "completed",
      String(Date.now()),
      JSON.stringify(result),
      String(this.completedTtl),
      String(this.completedHistory),
    ],
  });
  if (!ok || Number(ok) === 0) {
    return false;
  }
  await this.redis.publish(
    this.eventsChannel,
    JSON.stringify({ id: job.id, status: "completed" }),
  );
  this._completed += 1;
  return true;
}
```

The helper preloads each script with `SCRIPT LOAD` at first use and prefers `EVALSHA` to avoid resending the script body on every call. If Redis evicts the script cache and returns `NOSCRIPT`, the wrapper falls back to a full `EVAL` and re-caches the SHA.

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```javascript
async fail(job, error) {
  const retry = job.attempts < this.maxAttempts;
  const result = await this._evalScript(FAIL_SCRIPT, this._failSha, {
    keys: [this.metaPrefix, this.processingKey, this.pendingKey, this.failedKey],
    arguments: [
      job.id,
      job.claimToken,
      error,
      String(Date.now()),
      String(this.completedTtl),
      String(this.completedHistory),
      retry ? "1" : "0",
    ],
  });
  return Boolean(result) && Number(result) !== 0;
}
```

The attempt counter is incremented on every `claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `reclaimStuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```javascript
async reclaimStuck() {
  const reclaimed = await this._evalScript(RECLAIM_SCRIPT, this._reclaimSha, {
    keys: [this.pendingKey, this.processingKey, this.metaPrefix],
    arguments: [String(Date.now()), String(this.visibilityMs)],
  });
  return Array.isArray(reclaimed) ? reclaimed : [];
}
```

The Lua script also handles a narrower race: a worker that crashed between `BLMOVE` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`stats()` reports queue depth plus per-process counters:

```javascript
async stats() {
  const multi = this.redis.multi();
  multi.lLen(this.pendingKey);
  multi.lLen(this.processingKey);
  multi.lLen(this.completedKey);
  multi.lLen(this.failedKey);
  const [pending, processing, completed, failed] = await multi.exec();
  return {
    enqueued_total: this._enqueued,
    completed_total: this._completed,
    failed_total: this._failed,
    reclaimed_total: this._reclaimed,
    pending_depth: Number(pending) || 0,
    processing_depth: Number(processing) || 0,
    completed_depth: Number(completed) || 0,
    failed_depth: Number(failed) || 0,
    visibility_ms: this.visibilityMs,
  };
}
```

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a longer-term audit log if needed.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work for the rest of the pattern, but `BLMOVE` requires Redis 6.2+; on older servers swap it for `BRPOPLPUSH`.
* Node.js 18 or later (the helper uses native `async`/`await` and the `crypto` module).
* The `node-redis` client at version 5.x. Install it with:

  ```bash
  npm install redis
  ```

## Running the demo

### Get the source files

The demo consists of four files. Download them from the [`nodejs` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/nodejs) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/nodejs
curl -O $BASE/job_queue.js
curl -O $BASE/worker.js
curl -O $BASE/demoServer.js
curl -O $BASE/package.json
```

Then install dependencies:

```bash
npm install
```

### Start the demo server

From that directory:

```bash
node demoServer.js
```

You should see:

```text
Redis job-queue demo server listening on http://127.0.0.1:8791
Using Redis at localhost:6379
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8791](http://127.0.0.1:8791) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. You can also tune the visibility timeout with `--visibility-ms` and the bind address with `--host` / `--port`.

## The mock worker pool

The demo includes a small `Worker` and `WorkerPool` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/nodejs/worker.js)) that stands in for whatever real background work your application would run. Each worker:

* Blocks on `queue.claim()` for new jobs.
* Sleeps `workLatencyMs` to simulate doing the work.
* Either completes successfully, fails (calling `queue.fail()`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

The `failRate` and `hangRate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

Because Node.js is single-threaded, each "worker" is an async loop running on the event loop rather than an OS thread. The `claim(500)` call uses Redis's blocking `BLMOVE` so the loop spends almost all its time waiting on the server rather than spinning; multiple workers share one Redis client and Node's I/O scheduler interleaves their claims naturally.

## Production usage

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `reclaimStuck()` from a periodic task (use `setInterval` for fast queues, or a separate scheduler process for slow ones), or from each worker before it blocks on `claim()`. Both patterns work as long as *someone* runs the sweep.

### Use a separate Redis database or key prefix per queue

The helper takes a `queueName` argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `maxAttempts` per job kind

A blanket `maxAttempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `maxAttempts` so each queue can pick its own policy.

### Prefer `BLMOVE` over `BRPOPLPUSH`

`node-redis` v5 removed `client.brPopLPush()`; use `client.bLMove(src, dst, "RIGHT", "LEFT", timeoutSec)` instead. The two commands are functionally identical for this pattern: pop from the right of the source list and push onto the left of the destination list, atomically, blocking until a value appears. `BLMOVE` is more general (it accepts any combination of `LEFT`/`RIGHT` on either end) and is the recommended modern command.

### Use one shared client, not a pool

`node-redis` pipelines commands automatically across a single TCP connection, so for most workloads you should create one `createClient()` instance per process and reuse it everywhere. The only reason to add a second connection is to dedicate one to a blocking call (such as `BLMOVE` with a long timeout, or `SUBSCRIBE`); this demo's `claim()` uses a short 500 ms timeout so a single client is fine.

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
* [`BLMOVE`]({{< relref "/commands/blmove" >}}) to atomically claim a job into the processing list (modern replacement for [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}})).
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a job from the processing list on complete or fail.
* [`LRANGE`]({{< relref "/commands/lrange" >}}) and [`LLEN`]({{< relref "/commands/llen" >}}) to read queue depth and list contents.
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history.
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) for automatic cleanup of completed and failed jobs.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) for job-completion notifications.
* [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for atomic complete, fail, and reclaim flows.

See the [`node-redis` documentation]({{< relref "/develop/clients/nodejs" >}}) for full client reference.
