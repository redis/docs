---
aliases:
- /develop/use-cases/job-queue/lettuce
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in Java with Lettuce
linkTitle: "Lettuce example (Java)"
title: "Redis job queue with Lettuce"
weight: 5
---

This guide shows you how to implement a Redis-backed job queue in Java with [`Lettuce`]({{< relref "/develop/clients/lettuce" >}}). It includes a small local web server built on Java's standard `com.sun.net.httpserver.HttpServer` so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

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
2. The helper runs a single Lua script that writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker calls `queue.claim(timeoutMs)`
4. The helper runs `BLMOVE` to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash
5. The worker runs the job and calls `queue.complete(job, result)` or `queue.fail(job, error)`
6. `complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.reclaimStuck()` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The job queue helper

The `RedisJobQueue` class wraps the queue operations
([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-lettuce/RedisJobQueue.java)):

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import java.util.Map;

RedisClient client = RedisClient.create("redis://localhost:6379");
StatefulRedisConnection<String, String> conn = client.connect();

RedisJobQueue queue = new RedisJobQueue(conn, "jobs", 5000, 300, 50, 3);

String jobId = queue.enqueue(Map.of(
        "kind", "email",
        "recipient", "alice@example.com"));

// In a worker thread:
RedisJobQueue.ClaimedJob job = queue.claim(1000);
if (job != null) {
    try {
        // ... run the job ...
        queue.complete(job, Map.of("sent_at", "2026-05-11T15:00:00Z"));
    } catch (Exception ex) {
        queue.fail(job, ex.getMessage());
    }
}

// In a periodic sweeper:
List<String> reclaimed = queue.reclaimStuck();
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
* [`BLMOVE`]({{< relref "/commands/blmove" >}}) to atomically claim a job into the processing list
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs:events` for completion signalling
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) ([`EVAL`]({{< relref "/commands/eval" >}})) for the enqueue, complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash

## Why we use Lua for enqueue too

The redis-py reference implementation enqueues a job with a two-command pipeline (`HSET` + `LPUSH`). On a single Lettuce `StatefulRedisConnection` shared across HTTP handler threads, command pipelines from different threads can interleave their responses on the wire. That isn't a correctness problem for two unrelated commands, but it does make it harder to reason about the visible queue state under concurrency.

This port wraps the enqueue's two commands in a single Lua script so the metadata hash write and the pending-list push are atomic on the server. That keeps the demo lock-free without needing to serialise enqueue calls behind a `ReentrantLock`, and it matches the pattern already used for `complete`, `fail`, and `reclaim`.

For production code, prefer a connection pool over a shared connection: see [Production usage](#production-usage) below.

## Enqueueing jobs

`enqueue()` runs a Lua script that writes the metadata hash and pushes the job ID onto the pending list in one round trip:

```java
public String enqueue(Map<String, Object> payload) {
    String jobId = randomHex(8);
    long now = System.currentTimeMillis();
    String payloadJson = JsonUtil.toJson(payload);

    String[] keys = { metaKey(jobId), pendingKey };
    String[] argv = { jobId, payloadJson, Long.toString(now) };

    conn.sync().eval(ENQUEUE_SCRIPT, ScriptOutputType.INTEGER, keys, argv);
    return jobId;
}
```

The payload is stored as JSON so the queue can carry arbitrary nested structures without forcing every field into a hash.

## Claiming jobs with BLMOVE

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. `BLMOVE` does both in a single Redis call. (`BRPOPLPUSH` is deprecated in Redis 6.2+; `BLMOVE` with `rightLeft()` is the modern replacement.)

```java
public ClaimedJob claim(long timeoutMs) {
    double timeoutSeconds = Math.max(timeoutMs / 1000.0, 0.1);
    RedisCommands<String, String> sync = conn.sync();
    String jobId = sync.blmove(pendingKey, processingKey,
            LMoveArgs.Builder.rightLeft(), timeoutSeconds);
    if (jobId == null) {
        return null;
    }

    String token = randomHex(8);
    long now = System.currentTimeMillis();
    String meta = metaKey(jobId);

    Map<String, String> updates = new LinkedHashMap<>();
    updates.put("status", "processing");
    updates.put("claimed_at_ms", Long.toString(now));
    updates.put("claim_token", token);
    sync.hset(meta, updates);
    sync.hincrby(meta, "attempts", 1);
    Map<String, String> hash = sync.hgetall(meta);

    Map<String, Object> payload = JsonUtil.parseObject(hash.getOrDefault("payload", "{}"));
    int attempts = Integer.parseInt(hash.getOrDefault("attempts", "1"));
    return new ClaimedJob(jobId, payload, attempts, token);
}
```

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

## Completing jobs

`complete()` runs a Lua script so the processing-list removal, the metadata write, and the history push happen atomically:

```java
public boolean complete(ClaimedJob job, Map<String, Object> result) {
    String[] keys = { metaPrefix, processingKey, completedKey };
    String[] argv = {
            job.id,
            job.claimToken,
            "completed",
            Long.toString(System.currentTimeMillis()),
            JsonUtil.toJson(result),
            Integer.toString(completedTtl),
            Integer.toString(completedHistory),
    };
    Long ok = conn.sync().eval(COMPLETE_SCRIPT, ScriptOutputType.INTEGER, keys, argv);
    if (ok == null || ok == 0L) {
        return false;
    }
    publishEvent(job.id, "completed");
    return true;
}
```

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```java
public boolean fail(ClaimedJob job, String error) {
    boolean retry = job.attempts < maxAttempts;
    String[] keys = { metaPrefix, processingKey, pendingKey, failedKey };
    String[] argv = {
            job.id, job.claimToken, error,
            Long.toString(System.currentTimeMillis()),
            Integer.toString(completedTtl),
            Integer.toString(completedHistory),
            retry ? "1" : "0",
    };
    Long result = conn.sync().eval(FAIL_SCRIPT, ScriptOutputType.INTEGER, keys, argv);
    return result != null && result != 0L;
}
```

The attempt counter is incremented on every `claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `reclaimStuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```java
public List<String> reclaimStuck() {
    String[] keys = { pendingKey, processingKey, metaPrefix };
    String[] argv = {
            Long.toString(System.currentTimeMillis()),
            Long.toString(visibilityMs),
    };
    List<Object> raw = conn.sync().eval(RECLAIM_SCRIPT, ScriptOutputType.MULTI, keys, argv);
    List<String> reclaimed = new ArrayList<>();
    if (raw != null) {
        for (Object item : raw) {
            if (item != null) reclaimed.add(item.toString());
        }
    }
    return reclaimed;
}
```

The Lua script also handles a narrower race: a worker that crashed between `BLMOVE` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`stats()` reports queue depth plus per-process counters:

```java
public Map<String, Object> stats() {
    RedisCommands<String, String> sync = conn.sync();
    long pending = sync.llen(pendingKey);
    long processing = sync.llen(processingKey);
    long completed = sync.llen(completedKey);
    long failed = sync.llen(failedKey);
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("enqueued_total", enqueuedTotal);
    out.put("completed_total", completedTotal);
    out.put("failed_total", failedTotal);
    out.put("reclaimed_total", reclaimedTotal);
    out.put("pending_depth", pending);
    out.put("processing_depth", processing);
    out.put("completed_depth", completed);
    out.put("failed_depth", failed);
    out.put("visibility_ms", visibilityMs);
    return out;
}
```

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a longer-term audit log if needed.

## Prerequisites

* Redis 6.2 or later running locally on the default port (6379). `BLMOVE` was added in 6.2; on earlier versions, swap it for `BRPOPLPUSH` in `claim()`.
* JDK 17 or later.
* Lettuce 6.1+ and its runtime dependencies (`netty-*`, `reactor-core`, `reactive-streams`).

Add Lettuce to your project:

* If you use **Maven**:

  ```xml
  <dependency>
      <groupId>io.lettuce</groupId>
      <artifactId>lettuce-core</artifactId>
      <version>6.7.1.RELEASE</version>
  </dependency>
  ```

* If you use **Gradle**:

  ```groovy
  implementation 'io.lettuce:lettuce-core:6.7.1.RELEASE'
  ```

## Running the demo

### Get the source files

The demo consists of four Java source files. Download them from the [`java-lettuce` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/java-lettuce) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/java-lettuce
curl -O $BASE/RedisJobQueue.java
curl -O $BASE/JobWorker.java
curl -O $BASE/WorkerPool.java
curl -O $BASE/DemoServer.java
```

### Start the demo server

From that directory, compile the sources and run the server. With the Lettuce + netty + reactor jars staged in a local `lib/` directory:

```bash
javac -cp "lib/*" -d build RedisJobQueue.java JobWorker.java WorkerPool.java DemoServer.java
java -cp "build:lib/*" DemoServer --port 8794 --visibility-ms 5000
```

You should see:

```text
Redis job-queue demo server listening on http://127.0.0.1:8794
Using Redis at localhost:6379
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8794](http://127.0.0.1:8794) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. You can also tune the visibility timeout with `--visibility-ms` and pick an alternate Redis key prefix with `--queue-name`.

## The mock worker pool

The demo includes a small `JobWorker` and `WorkerPool` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-lettuce/JobWorker.java), [WorkerPool.java](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-lettuce/WorkerPool.java)) that stands in for whatever real background work your application would run. Each worker:

* Blocks on `queue.claim()` for new jobs.
* Sleeps `workLatencyMs` to simulate doing the work.
* Either completes successfully, fails (calling `queue.fail()`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

The `failRate` and `hangRate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

## Production usage

### Use a connection pool, not a shared connection

The demo shares a single `StatefulRedisConnection` across HTTP handlers and worker threads to keep the code compact. That has two consequences worth knowing about:

* The `claim()` call uses `BLMOVE`, which blocks the shared connection for up to the claim timeout. With many workers sharing one connection, claim throughput is serialised. The demo uses a 500ms timeout so the connection stays responsive to other commands, but a real deployment will want each worker to own a connection.
* Lettuce transactions (`MULTI`/`EXEC`) are connection-scoped, so any code that uses them would also need to serialise behind a `ReentrantLock`. This port avoids `MULTI`/`EXEC` entirely — the multi-command operations (`enqueue`, `complete`, `fail`, `reclaim`) all run as Lua scripts.

In production, use `ConnectionPoolSupport.createGenericObjectPool(redisClient::connect, poolConfig)` and acquire a connection per worker (and per request handler if you want fully concurrent pipelines):

```java
GenericObjectPoolConfig<StatefulRedisConnection<String, String>> config = new GenericObjectPoolConfig<>();
config.setMaxTotal(32);
GenericObjectPool<StatefulRedisConnection<String, String>> pool =
        ConnectionPoolSupport.createGenericObjectPool(client::connect, config);

try (StatefulRedisConnection<String, String> conn = pool.borrowObject()) {
    new RedisJobQueue(conn, "jobs", 5000, 300, 50, 3).enqueue(payload);
}
```

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `reclaimStuck()` from a `ScheduledExecutorService` (every few seconds for fast queues, every minute for slow ones), or from each worker before it blocks on `claim()`. Both patterns work as long as *someone* runs the sweep.

### Use a separate Redis database or key prefix per queue

The helper takes a `queueName` argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `maxAttempts` per job kind

A blanket `maxAttempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `maxAttempts` so each queue can pick its own policy.

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
* [`EVAL`]({{< relref "/commands/eval" >}}) for atomic enqueue, complete, fail, and reclaim flows.

See the [Lettuce documentation]({{< relref "/develop/clients/lettuce" >}}) for full client reference.
