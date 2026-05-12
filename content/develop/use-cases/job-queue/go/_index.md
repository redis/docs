---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in Go with go-redis
linkTitle: go-redis example (Go)
title: Redis job queue with go-redis
weight: 3
---

This guide shows you how to implement a Redis-backed job queue in Go with [`go-redis`]({{< relref "/develop/clients/go" >}}). It includes a small local web server built with the Go standard library so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

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

1. The application calls `queue.Enqueue(ctx, payload)`
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker calls `queue.Claim(ctx, timeoutMs)`
4. The helper runs `BLMOVE` to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash
5. The worker runs the job and calls `queue.Complete(ctx, job, result)` or `queue.Fail(ctx, job, errMsg)`
6. `Complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `Fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.ReclaimStuck(ctx)` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `RedisJobQueue` type wraps the queue operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/go/job_queue.go)):

```go
import (
    "context"

    "github.com/redis/go-redis/v9"
    "jobqueue"
)

client := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
queue := jobqueue.NewRedisJobQueue(client, jobqueue.Options{
    VisibilityMs: 5000,
})

ctx := context.Background()
jobID, _ := queue.Enqueue(ctx, map[string]any{
    "kind":      "email",
    "recipient": "alice@example.com",
})

// In a worker goroutine:
job, _ := queue.Claim(ctx, 1000)
if job != nil {
    // ... run the job ...
    if _, err := queue.Complete(ctx, job, map[string]any{"sent_at": "2026-05-11T15:00:00Z"}); err != nil {
        queue.Fail(ctx, job, err.Error())
    }
}

// In a periodic sweeper:
reclaimed, _ := queue.ReclaimStuck(ctx)
_ = reclaimed
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

`Enqueue()` writes the metadata hash and pushes the job ID onto the pending list in one pipeline:

```go
func (q *RedisJobQueue) Enqueue(ctx context.Context, payload map[string]any) (string, error) {
    jobID := tokenHex(8)
    payloadJSON, _ := json.Marshal(payload)
    now := nowMs()
    meta := map[string]interface{}{
        "id":             jobID,
        "payload":        string(payloadJSON),
        "status":         "pending",
        "attempts":       0,
        "enqueued_at_ms": now,
        "claim_token":    "",
    }
    pipe := q.client.Pipeline()
    pipe.HSet(ctx, q.metaKey(jobID), meta)
    pipe.LPush(ctx, q.pendingKey, jobID)
    if _, err := pipe.Exec(ctx); err != nil {
        return "", err
    }
    return jobID, nil
}
```

The payload is stored as JSON so the queue can carry arbitrary nested structures without forcing every field into a hash.

## Claiming jobs with BLMOVE

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. `BLMOVE` does both in a single Redis call:

```go
func (q *RedisJobQueue) Claim(ctx context.Context, timeoutMs int) (*ClaimedJob, error) {
    timeout := time.Duration(timeoutMs) * time.Millisecond
    if timeout < 100*time.Millisecond {
        timeout = 100 * time.Millisecond
    }
    jobID, err := q.client.BLMove(ctx, q.pendingKey, q.processingKey, "RIGHT", "LEFT", timeout).Result()
    if err == redis.Nil {
        return nil, nil
    }
    if err != nil {
        return nil, err
    }

    token := tokenHex(8)
    now := nowMs()
    metaKey := q.metaKey(jobID)

    pipe := q.client.Pipeline()
    pipe.HSet(ctx, metaKey, map[string]interface{}{
        "status":        "processing",
        "claimed_at_ms": now,
        "claim_token":   token,
    })
    pipe.HIncrBy(ctx, metaKey, "attempts", 1)
    getAll := pipe.HGetAll(ctx, metaKey)
    if _, err := pipe.Exec(ctx); err != nil {
        return nil, err
    }
    // ... parse payload and attempts from getAll.Val() ...
    return &ClaimedJob{ID: jobID, Payload: payload, Attempts: attempts, ClaimToken: token}, nil
}
```

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

`BLMOVE` is the modern replacement for `BRPOPLPUSH`, which was deprecated in Redis 6.2. `go-redis` exposes both for backwards compatibility but the helper uses `BLMOVE` with `RIGHT`/`LEFT` arguments to match `BRPOPLPUSH` semantics.

## Completing jobs

`Complete()` runs a Lua script so the processing-list removal, the metadata write, and the history push happen atomically:

```go
func (q *RedisJobQueue) Complete(ctx context.Context, job *ClaimedJob, result map[string]any) (bool, error) {
    resultJSON, _ := json.Marshal(result)
    keys := []string{q.metaPrefix, q.processingKey, q.completedKey}
    args := []interface{}{
        job.ID,
        job.ClaimToken,
        "completed",
        nowMs(),
        string(resultJSON),
        q.completedTTL,
        q.completedHistory,
    }
    res, err := q.completeScript.Run(ctx, q.client, keys, args...).Result()
    if err != nil {
        return false, err
    }
    n, _ := res.(int64)
    if n != 1 {
        return false, nil
    }
    eventPayload, _ := json.Marshal(map[string]any{"id": job.ID, "status": "completed"})
    q.client.Publish(ctx, q.eventsChannel, string(eventPayload))
    return true, nil
}
```

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`Fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```go
func (q *RedisJobQueue) Fail(ctx context.Context, job *ClaimedJob, errMsg string) (bool, error) {
    retry := job.Attempts < q.maxAttempts
    retryArg := "0"
    if retry {
        retryArg = "1"
    }
    keys := []string{q.metaPrefix, q.processingKey, q.pendingKey, q.failedKey}
    args := []interface{}{
        job.ID, job.ClaimToken, errMsg, nowMs(),
        q.completedTTL, q.completedHistory, retryArg,
    }
    res, err := q.failScript.Run(ctx, q.client, keys, args...).Result()
    if err != nil {
        return false, err
    }
    n, _ := res.(int64)
    return n != 0, nil
}
```

The attempt counter is incremented on every `Claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `ReclaimStuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```go
func (q *RedisJobQueue) ReclaimStuck(ctx context.Context) ([]string, error) {
    keys := []string{q.pendingKey, q.processingKey, q.metaPrefix}
    args := []interface{}{nowMs(), q.visibilityMs}
    res, err := q.reclaimScript.Run(ctx, q.client, keys, args...).Result()
    if err != nil {
        return nil, err
    }
    raw, _ := res.([]interface{})
    out := make([]string, 0, len(raw))
    for _, item := range raw {
        if s, ok := item.(string); ok {
            out = append(out, s)
        }
    }
    return out, nil
}
```

The Lua script also handles a narrower race: a worker that crashed between `BLMOVE` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`Stats()` reports queue depth plus per-process counters:

```go
func (q *RedisJobQueue) Stats(ctx context.Context) (map[string]any, error) {
    pipe := q.client.Pipeline()
    pendingCmd := pipe.LLen(ctx, q.pendingKey)
    processingCmd := pipe.LLen(ctx, q.processingKey)
    completedCmd := pipe.LLen(ctx, q.completedKey)
    failedCmd := pipe.LLen(ctx, q.failedKey)
    if _, err := pipe.Exec(ctx); err != nil {
        return nil, err
    }
    return map[string]any{
        "enqueued_total":   q.enqueuedN,
        "completed_total":  q.completedN,
        "failed_total":     q.failedN,
        "reclaimed_total":  q.reclaimedN,
        "pending_depth":    pendingCmd.Val(),
        "processing_depth": processingCmd.Val(),
        "completed_depth":  completedCmd.Val(),
        "failed_depth":     failedCmd.Val(),
        "visibility_ms":    q.visibilityMs,
    }, nil
}
```

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a longer-term audit log if needed.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). `BLMOVE` requires Redis 6.2+; earlier servers can fall back to the deprecated `BRPOPLPUSH` exposed on the same client.
* Go 1.21 or later.
* The `go-redis` client. The included `go.mod` pins:

  ```text
  require github.com/redis/go-redis/v9 v9.18.0
  ```

## Running the demo

### Get the source files

The demo consists of five files. Download them from the [`go` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/go) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/go
curl -O $BASE/job_queue.go
curl -O $BASE/worker.go
curl -O $BASE/demo_server.go
curl -O $BASE/go.mod
curl -O $BASE/go.sum
```

### Start the demo server

From that directory, create a tiny `main.go` to start the server. Go's `package main` can't live in the same directory as `package jobqueue`, so put it in a subdirectory:

```bash
mkdir -p cmd/demo
cat > cmd/demo/main.go <<'EOF'
package main

import "jobqueue"

func main() { jobqueue.RunDemoServer() }
EOF
```

Then build and run:

```bash
go mod tidy
go run ./cmd/demo
```

You should see:

```text
Redis job-queue demo server listening on http://127.0.0.1:8792
Using Redis at localhost:6379
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8792](http://127.0.0.1:8792) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

If your Redis server is running elsewhere, start the demo with `-redis-host` and `-redis-port`. You can also tune the visibility timeout with `-visibility-ms` and the queue keyspace with `-queue-name`.

## The mock worker pool

The demo includes a small `Worker` and `WorkerPool` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/go/worker.go)) that stands in for whatever real background work your application would run. Each worker:

* Blocks on `queue.Claim()` for new jobs.
* Sleeps `workLatencyMs` to simulate doing the work.
* Either completes successfully, fails (calling `queue.Fail()`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

The `failRate` and `hangRate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

## Production usage

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `ReclaimStuck()` from a periodic goroutine (every few seconds for fast queues, every minute for slow ones), or from each worker before it blocks on `Claim()`. Both patterns work as long as *someone* runs the sweep.

### Use a separate Redis database or key prefix per queue

The helper takes a `QueueName` option so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `MaxAttempts` per job kind

A blanket `MaxAttempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `MaxAttempts` so each queue can pick its own policy.

### Use `context.Context` for clean shutdown

Workers in the demo run as goroutines that block in `Claim()` (`BLMOVE` is a blocking Redis call). The `WorkerPool` holds a parent `context.Context`; calling `pool.Stop()` cancels each worker's child context so the next `BLMOVE` returns and the goroutine exits. Wire your real worker pool to your service's shutdown context so `SIGTERM` produces a clean drain instead of a hard kill.

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

See the [`go-redis` documentation]({{< relref "/develop/clients/go" >}}) for full client reference.
