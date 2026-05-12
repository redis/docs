---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in C# with StackExchange.Redis
linkTitle: "StackExchange.Redis example (C#)"
title: "Redis job queue with StackExchange.Redis"
weight: 6
---

This guide shows you how to implement a Redis-backed job queue in C# with [StackExchange.Redis](https://stackexchange.github.io/StackExchange.Redis/). It includes a small ASP.NET Core minimal-API web server so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

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

1. The application calls `queue.Enqueue(payload)`
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker calls `queue.Claim(timeoutMs)`
4. The helper runs a non-blocking `RPOPLPUSH` (via `ListRightPopLeftPush`) to atomically move the next pending ID into the processing list, then writes a per-claim `claim_token` plus `claimed_at_ms` on the hash. StackExchange.Redis intentionally does not expose blocking variants such as `BRPOPLPUSH`, so the demo polls on a 50 ms interval until either a job arrives or the timeout elapses.
5. The worker runs the job and calls `queue.Complete(job, result)` or `queue.Fail(job, error)`
6. `Complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `Fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.ReclaimStuck()` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `RedisJobQueue` class wraps the queue operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/dotnet/RedisJobQueue.cs)):

```csharp
using StackExchange.Redis;
using JobQueueDemo;

var redis = ConnectionMultiplexer.Connect("localhost:6379");
var queue = new RedisJobQueue(redis, visibilityMs: 5000);

var jobId = queue.Enqueue(new Dictionary<string, object>
{
    ["kind"] = "email",
    ["recipient"] = "alice@example.com",
});

// In a worker thread:
var job = queue.Claim(timeoutMs: 1000);
if (job is not null)
{
    try
    {
        // ... run the job ...
        queue.Complete(job, new Dictionary<string, object> { ["sent_at"] = "2026-05-11T15:00:00Z" });
    }
    catch (Exception ex)
    {
        queue.Fail(job, ex.Message);
    }
}

// In a periodic sweeper:
var reclaimed = queue.ReclaimStuck();
```

The demo helper is synchronous to keep the code compact. A production helper would expose `EnqueueAsync`, `ClaimAsync`, and so on, using `HashSetAsync`, `ScriptEvaluateAsync`, and `await Task.Delay` — see the *Production usage* section below.

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
* [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}) (via `IDatabase.ListRightPopLeftPush`) to atomically claim a job into the processing list. StackExchange.Redis does not expose the blocking [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) variant, so the helper polls.
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs:events` for completion signalling
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) ([`EVALSHA`]({{< relref "/commands/evalsha" >}})) for the complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash

## Enqueueing jobs

`Enqueue()` writes the metadata hash and pushes the job ID onto the pending list in one batch:

```csharp
public string Enqueue(IDictionary<string, object> payload)
{
    var jobId = RandomTokenHex(8);
    var nowMs = NowMs();
    var metaKey = MetaKey(jobId);

    var hashEntries = new[]
    {
        new HashEntry("id", jobId),
        new HashEntry("payload", JsonSerializer.Serialize(payload)),
        new HashEntry("status", "pending"),
        new HashEntry("attempts", 0),
        new HashEntry("enqueued_at_ms", nowMs),
        new HashEntry("claim_token", ""),
    };

    var batch = _db.CreateBatch();
    var hashTask = batch.HashSetAsync(metaKey, hashEntries);
    var pushTask = batch.ListLeftPushAsync(_pendingKey, jobId);
    batch.Execute();
    Task.WaitAll(hashTask, pushTask);

    lock (_statsLock) { _enqueued++; }
    return jobId;
}
```

The payload is serialised to JSON with `System.Text.Json` so the queue can carry arbitrary nested structures without forcing every field into a hash. A batch is the StackExchange.Redis equivalent of a Redis pipeline — it groups commands into one round trip but does not wrap them in `MULTI`/`EXEC` (no atomicity is needed here: a writer can't race itself).

## Claiming jobs

A worker tries to atomically pop the next pending job onto the processing list. The Python and Node ports use the blocking `BRPOPLPUSH`/`BLMOVE` variants; StackExchange.Redis ships only the non-blocking `ListRightPopLeftPush`, so the helper polls on a 50 ms interval until either a job arrives or the per-call timeout elapses:

```csharp
public ClaimedJob? Claim(int timeoutMs = 1000)
{
    var deadline = Environment.TickCount64 + Math.Max(0, timeoutMs);
    const int pollIntervalMs = 50;

    RedisValue popped;
    while (true)
    {
        popped = _db.ListRightPopLeftPush(_pendingKey, _processingKey);
        if (!popped.IsNull) break;
        var remaining = deadline - Environment.TickCount64;
        if (remaining <= 0) return null;
        Thread.Sleep((int)Math.Min(pollIntervalMs, remaining));
    }

    var jobId = (string)popped!;
    var token = RandomTokenHex(8);
    var nowMs = NowMs();
    var metaKey = MetaKey(jobId);

    var batch = _db.CreateBatch();
    var hashSetTask = batch.HashSetAsync(metaKey, new[]
    {
        new HashEntry("status", "processing"),
        new HashEntry("claimed_at_ms", nowMs),
        new HashEntry("claim_token", token),
    });
    var incrTask = batch.HashIncrementAsync(metaKey, "attempts", 1);
    var hgetallTask = batch.HashGetAllAsync(metaKey);
    batch.Execute();
    Task.WaitAll(hashSetTask, incrTask, hgetallTask);

    var meta = ToDictionary(hgetallTask.Result);
    var payload = ParseJsonObject(meta.GetValueOrDefault("payload", "{}"));
    var attempts = int.TryParse(meta.GetValueOrDefault("attempts", "1"), out var a) ? a : 1;
    return new ClaimedJob(jobId, payload, attempts, token);
}
```

`Environment.TickCount64` is used for deadline arithmetic to avoid the 24.9-day overflow of the 32-bit `Environment.TickCount`.

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

## Completing jobs

`Complete()` runs a Lua script so the processing-list removal, the metadata write, and the history push happen atomically:

```csharp
public bool Complete(ClaimedJob job, IDictionary<string, object> result)
{
    var keys = new RedisKey[] { _metaPrefix, _processingKey, _completedKey };
    var args = new RedisValue[]
    {
        job.Id, job.ClaimToken, "completed", NowMs(),
        JsonSerializer.Serialize(result), _completedTtl, _completedHistory,
    };

    var raw = _db.ScriptEvaluate(CompleteScript, keys, args);
    var ok = !raw.IsNull && (long)raw == 1;
    if (!ok) return false;

    _db.Publish(
        RedisChannel.Literal(_eventsChannel),
        JsonSerializer.Serialize(new Dictionary<string, string>
        {
            ["id"] = job.Id,
            ["status"] = "completed",
        }));

    lock (_statsLock) { _completed++; }
    return true;
}
```

`IDatabase.ScriptEvaluate` ships the script body on first use and switches to `EVALSHA` automatically for subsequent calls — you don't have to manage the SHA yourself in StackExchange.Redis. The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`Fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```csharp
public bool Fail(ClaimedJob job, string error)
{
    var retry = job.Attempts < _maxAttempts;
    var keys = new RedisKey[]
    {
        _metaPrefix, _processingKey, _pendingKey, _failedKey,
    };
    var args = new RedisValue[]
    {
        job.Id, job.ClaimToken, error, NowMs(),
        _completedTtl, _completedHistory, retry ? "1" : "0",
    };

    var raw = _db.ScriptEvaluate(FailScript, keys, args);
    if (raw.IsNull || (long)raw == 0) return false;
    // ... publish event, bump counter if final failure ...
    return true;
}
```

The attempt counter is incremented on every `Claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `ReclaimStuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```csharp
public IReadOnlyList<string> ReclaimStuck()
{
    var keys = new RedisKey[] { _pendingKey, _processingKey, _metaPrefix };
    var args = new RedisValue[] { NowMs(), _visibilityMs };
    var raw = _db.ScriptEvaluate(ReclaimScript, keys, args);
    if (raw.IsNull) return Array.Empty<string>();
    var reclaimedArray = (RedisResult[])raw!;
    return reclaimedArray.Select(r => (string)r!).ToList();
}
```

The Lua script also handles a narrower race: a worker that crashed between the claim's `RPOPLPUSH` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`Stats()` reports queue depth plus per-process counters:

```csharp
public IDictionary<string, object> Stats()
{
    var batch = _db.CreateBatch();
    var pendingTask = batch.ListLengthAsync(_pendingKey);
    var processingTask = batch.ListLengthAsync(_processingKey);
    var completedTask = batch.ListLengthAsync(_completedKey);
    var failedTask = batch.ListLengthAsync(_failedKey);
    batch.Execute();
    Task.WaitAll(pendingTask, processingTask, completedTask, failedTask);

    lock (_statsLock)
    {
        return new Dictionary<string, object>
        {
            ["enqueued_total"] = _enqueued,
            ["completed_total"] = _completed,
            ["failed_total"] = _failed,
            ["reclaimed_total"] = _reclaimed,
            ["pending_depth"] = pendingTask.Result,
            ["processing_depth"] = processingTask.Result,
            ["completed_depth"] = completedTask.Result,
            ["failed_depth"] = failedTask.Result,
            ["visibility_ms"] = _visibilityMs,
        };
    }
}
```

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a longer-term audit log if needed.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). Earlier versions still work, since the helper only uses commands that have existed since Redis 2.6.
* .NET 8 SDK or later.
* The `StackExchange.Redis` client at version 2.7 or newer. The demo project references `StackExchange.Redis` 2.7.33 in its `.csproj`.

## Running the demo

### Get the source files

The demo consists of five files. Download them from the [`dotnet` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/dotnet) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/dotnet
curl -O $BASE/RedisJobQueue.cs
curl -O $BASE/JobWorker.cs
curl -O $BASE/WorkerPool.cs
curl -O $BASE/Program.cs
curl -O $BASE/JobQueueDemo.csproj
```

### Start the demo server

From that directory:

```bash
dotnet run
```

You should see:

```text
Connected to Redis at localhost:6379
Redis job-queue demo server listening on http://127.0.0.1:8795
Using Redis at localhost:6379
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8795](http://127.0.0.1:8795) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. You can also tune the visibility timeout with `--visibility-ms` and the bind address with `--host` / `--port`. Set the `QUEUE_NAME` environment variable to use a different queue prefix.

## The mock worker pool

The demo includes a small `JobWorker` and `WorkerPool` ([`JobWorker.cs`](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/dotnet/JobWorker.cs), [`WorkerPool.cs`](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/dotnet/WorkerPool.cs)) that stands in for whatever real background work your application would run. Each worker is a dedicated background `Thread` that:

* Polls `queue.Claim(500)` for new jobs.
* `Thread.Sleep(workLatencyMs)` to simulate doing the work.
* Either completes successfully, fails (calling `queue.Fail()`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

The `FailRate` and `HangRate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

`Program.cs` calls `ThreadPool.SetMinThreads(64, 64)` at startup so concurrent claims, batch awaits, and HTTP handlers don't starve each other while the pool grows on demand.

## Production usage

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `ReclaimStuck()` from a periodic task (an `IHostedService` running on a `PeriodicTimer` for fast queues, or a separate scheduler process for slow ones), or from each worker before it polls on `Claim()`. Both patterns work as long as *someone* runs the sweep.

### Make the helper async in production

To keep the demo readable, the helper here is fully synchronous. In a real ASP.NET Core service you should use the async overloads — `HashSetAsync`, `ListLeftPushAsync`, `ScriptEvaluateAsync`, `HashGetAllAsync` — and `await Task.Delay` in the claim polling loop. That frees the calling thread while round trips are in flight, which matters a lot when many handlers share the multiplexer's single command pipeline.

### Use a separate Redis database or key prefix per queue

The helper takes a `queueName` constructor argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `maxAttempts` per job kind

A blanket `maxAttempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `maxAttempts` so each queue can pick its own policy.

### Poll instead of blocking — and watch out for the multiplexer

StackExchange.Redis [intentionally does not expose blocking commands](https://stackexchange.github.io/StackExchange.Redis/PipelinesMultiplexers#fundamentally-blocking-operations) such as `BLPOP`, `BRPOPLPUSH`, or `BLMOVE`. The multiplexer interleaves all commands from all callers onto one TCP connection, so a long blocking call would stall every other request on the same connection. The helper therefore calls the non-blocking `ListRightPopLeftPush` and polls — at 50 ms it remains responsive without flooding Redis. If you really want a single connection dedicated to a blocking pop (a less common pattern in C#), spin up a second `ConnectionMultiplexer` configured with `AllowAdmin = true` and a separate database, and run the blocking call through its dedicated socket; this demo intentionally does not.

### Bump the minimum thread-pool size in long-running services

.NET's thread pool grows by ~2 threads per second under load, which can starve concurrent workers when a burst of jobs arrives. The demo calls `ThreadPool.SetMinThreads(64, 64)` at startup. In a real service set the values to match the maximum number of simultaneous outstanding Redis calls plus the size of your HTTP thread pool.

### Use `Environment.TickCount64` for deadline arithmetic

`Environment.TickCount` is a 32-bit signed integer in milliseconds and overflows after roughly 24.9 days. For visibility-timeout and claim-poll deadlines, always use `Environment.TickCount64` (or `Stopwatch.GetTimestamp`) instead — see the `Claim` implementation above.

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
* [`RPOPLPUSH`]({{< relref "/commands/rpoplpush" >}}) to atomically claim a job into the processing list (the non-blocking variant of [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}), used because StackExchange.Redis doesn't expose blocking pops).
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a job from the processing list on complete or fail.
* [`LRANGE`]({{< relref "/commands/lrange" >}}) and [`LLEN`]({{< relref "/commands/llen" >}}) to read queue depth and list contents.
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history.
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) for automatic cleanup of completed and failed jobs.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) for job-completion notifications.
* [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for atomic complete, fail, and reclaim flows.

See the [StackExchange.Redis documentation](https://stackexchange.github.io/StackExchange.Redis/) for the full client reference.
