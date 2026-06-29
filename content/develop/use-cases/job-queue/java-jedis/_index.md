---
aliases:
- /develop/use-cases/job-queue/java
- /develop/use-cases/job-queue/jedis
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a Redis job queue in Java with Jedis
linkTitle: Jedis example (Java)
title: Redis job queue with Jedis
weight: 4
---

This guide shows you how to implement a Redis-backed job queue in Java with [`Jedis`]({{< relref "/develop/clients/jedis" >}}). It includes a small local web server built with Java's built-in `HttpServer` so you can enqueue jobs, watch a pool of workers drain them, and see the reclaimer recover jobs from a simulated worker crash.

## Overview

A job queue lets your application offload background work — sending email, processing payments, image transcoding, ML inference, webhooks — from the request path. Producers enqueue jobs in milliseconds and return to the user; workers pull from the queue and process them on their own schedule.

That gives you:

* Low-latency user-facing requests, even when downstream work is slow or bursty
* Horizontal scale across many worker processes that share one Redis instance
* At-least-once delivery so a worker crash doesn't lose work
* Visibility-timeout reclaim that returns stuck jobs to the queue automatically
* Job metadata, retry counts, and completion results in Redis hashes with TTL

In this example, each job is identified by a random hex ID and its payload, status, and result live in a Redis hash under `queue:jobs-jedis:job:{id}`. Pending IDs sit in a list, claimed IDs move atomically to a *processing* list, and completed or failed IDs land in short history lists.

## How it works

The flow looks like this:

1. The application calls `queue.enqueue(payload)`
2. The helper writes the job metadata hash and `LPUSH`es the job ID onto the pending list
3. A worker calls `queue.claim(timeoutMs)`
4. The helper runs `BRPOPLPUSH` to atomically move the next pending ID into the processing list and writes a per-claim `claim_token` plus `claimed_at_ms` on the hash
5. The worker runs the job and calls `queue.complete(job, result)` or `queue.fail(job, error)`
6. `complete` removes the job from the processing list, writes the result, and `LPUSH`es the ID onto the completed history (with `LTRIM` and an `EXPIRE` on the hash for cleanup)
7. `fail` either retries the job (back to pending) or moves it to the failed list once retries are exhausted

If a worker dies before completing a job, the job sits in the processing list with a `claimed_at_ms` older than the visibility timeout. A periodic call to `queue.reclaimStuck()` finds those jobs and moves them back to pending so another worker can pick them up.

Every state change holds the token: a worker that has been reclaimed cannot later complete or fail a job another worker has already claimed.

## The `RedisJobQueue` helper

The `RedisJobQueue` class wraps the queue operations ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-jedis/RedisJobQueue.java)):

```java
import java.util.Map;
import redis.clients.jedis.JedisPool;

public class Main {
    public static void main(String[] args) {
        JedisPool pool = new JedisPool("localhost", 6379);
        RedisJobQueue queue = new RedisJobQueue(pool, "jobs-jedis", 5000, 300, 50, 3);

        String jobId = queue.enqueue(Map.of(
                "kind", "email",
                "recipient", "alice@example.com"
        ));

        // In a worker thread:
        RedisJobQueue.ClaimedJob job = queue.claim(1000);
        if (job != null) {
            try {
                // ... run the job ...
                queue.complete(job, Map.of("sent_at", "2026-05-11T15:00:00Z"));
            } catch (Exception exc) {
                queue.fail(job, exc.getMessage());
            }
        }

        // In a periodic sweeper:
        java.util.List<String> reclaimed = queue.reclaimStuck();
    }
}
```

Jedis operations are synchronous. The helper acquires a `Jedis` connection per call using `pool.getResource()` inside a try-with-resources block, so connections are returned to the pool even on errors. The blocking `claim()` method holds its own connection for the duration of the `BRPOPLPUSH` wait, which is fine because every other call uses a different connection.

### Data model

Each job's state lives in a Redis hash plus a position in one of four lists:

```text
queue:jobs-jedis:pending          (list)   pending job IDs, oldest at the right
queue:jobs-jedis:processing       (list)   claimed but not yet completed
queue:jobs-jedis:completed        (list)   recent successes (LTRIM-capped history)
queue:jobs-jedis:failed           (list)   terminally failed jobs
queue:jobs-jedis:job:{id}         (hash)   per-job metadata
queue:jobs-jedis:events           (pubsub) completion notifications
```

A job's hash carries:

```text
queue:jobs-jedis:job:9a4f...
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
* [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) to atomically claim a job into the processing list
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a claimed job from the processing list on complete or fail
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history lists
* [`HSET`]({{< relref "/commands/hset" >}}) / [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata
* [`EXPIRE`]({{< relref "/commands/expire" >}}) on completed and failed hashes for automatic cleanup
* [`PUBLISH`]({{< relref "/commands/publish" >}}) on `queue:jobs-jedis:events` for completion signalling
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) ([`EVAL`]({{< relref "/commands/eval" >}})) for the complete, fail, and reclaim flows so each runs atomically against the processing list and metadata hash

## Enqueueing jobs

`enqueue()` writes the metadata hash and pushes the job ID onto the pending list in one pipeline:

```java
public String enqueue(Map<String, Object> payload) {
    String jobId = randomTokenHex(8);
    long now = System.currentTimeMillis();
    Map<String, String> meta = new LinkedHashMap<>();
    meta.put("id", jobId);
    meta.put("payload", JsonUtil.toJson(payload));
    meta.put("status", "pending");
    meta.put("attempts", "0");
    meta.put("enqueued_at_ms", Long.toString(now));
    meta.put("claim_token", "");

    try (Jedis jedis = pool.getResource()) {
        Pipeline pipe = jedis.pipelined();
        pipe.hset(metaKey(jobId), meta);
        pipe.lpush(pendingKey, jobId);
        pipe.sync();
    }
    return jobId;
}
```

The payload is stored as a JSON string so the queue can carry arbitrary nested structures without forcing every field into a hash.

## Claiming jobs with BRPOPLPUSH

A worker blocks until a job is available, then atomically pops it from the pending list and pushes it onto the processing list. `BRPOPLPUSH` does both in a single Redis call:

```java
public ClaimedJob claim(long timeoutMs) {
    double timeoutSec = Math.max(timeoutMs / 1000.0, 0.1);
    String jobId;
    try (Jedis jedis = pool.getResource()) {
        jobId = jedis.brpoplpush(pendingKey, processingKey, (int) Math.ceil(timeoutSec));
    }
    if (jobId == null) {
        return null;
    }

    String token = randomTokenHex(8);
    long now = System.currentTimeMillis();
    String mk = metaKey(jobId);
    Map<String, String> meta;
    try (Jedis jedis = pool.getResource()) {
        Pipeline pipe = jedis.pipelined();
        Map<String, String> updates = new LinkedHashMap<>();
        updates.put("status", "processing");
        updates.put("claimed_at_ms", Long.toString(now));
        updates.put("claim_token", token);
        pipe.hset(mk, updates);
        pipe.hincrBy(mk, "attempts", 1);
        Response<Map<String, String>> resp = pipe.hgetAll(mk);
        pipe.sync();
        meta = resp.get();
    }
    // ... parse payload, attempts, and return a ClaimedJob ...
}
```

The `claim_token` is the worker's proof of ownership for this attempt. Every subsequent state change (complete, fail) checks it before touching the processing list, so a worker that hung past the visibility timeout cannot interfere with the new claimant.

## Completing jobs

`complete()` runs a Lua script via `EVAL` so the processing-list removal, the metadata write, and the history push happen atomically:

```java
public boolean complete(ClaimedJob job, Map<String, Object> result) {
    List<String> keys = Arrays.asList(metaPrefix, processingKey, completedKey);
    List<String> args = Arrays.asList(
            job.id,
            job.claimToken,
            "completed",
            Long.toString(System.currentTimeMillis()),
            JsonUtil.toJson(result),
            Integer.toString(completedTtl),
            Integer.toString(completedHistory)
    );
    Object res;
    try (Jedis jedis = pool.getResource()) {
        res = jedis.eval(COMPLETE_SCRIPT, keys, args);
    }
    if (res == null || !"1".equals(res.toString())) {
        return false;
    }
    // ... publish the completion event ...
    return true;
}
```

The Lua script checks the token first and returns `0` if the worker no longer owns the job (because the reclaimer moved it back to pending). The metadata hash also gets an `EXPIRE` so completed jobs are cleaned up automatically.

## Failing and retrying

`fail()` either retries the job (back to pending) or moves it to the failed list once retries are exhausted:

```java
public boolean fail(ClaimedJob job, String error) {
    boolean retry = job.attempts < maxAttempts;
    List<String> keys = Arrays.asList(metaPrefix, processingKey, pendingKey, failedKey);
    List<String> args = Arrays.asList(
            job.id,
            job.claimToken,
            error,
            Long.toString(System.currentTimeMillis()),
            Integer.toString(completedTtl),
            Integer.toString(completedHistory),
            retry ? "1" : "0"
    );
    Object res;
    try (Jedis jedis = pool.getResource()) {
        res = jedis.eval(FAIL_SCRIPT, keys, args);
    }
    return res != null && !"0".equals(res.toString());
}
```

The attempt counter is incremented on every `claim()`, so a job that fails three times is moved to the failed list with `attempts = 3` and the final `last_error` preserved.

## Reclaiming stuck jobs

If a worker dies mid-job — the process is killed, the host loses power, the network partitions — the job sits in the processing list with a `claimed_at_ms` that never advances. A periodic call to `reclaimStuck()` walks the processing list and moves any job past the visibility timeout back to pending:

```java
public List<String> reclaimStuck() {
    List<String> keys = Arrays.asList(pendingKey, processingKey, metaPrefix);
    List<String> args = Arrays.asList(
            Long.toString(System.currentTimeMillis()),
            Long.toString(visibilityMs)
    );
    Object res;
    try (Jedis jedis = pool.getResource()) {
        res = jedis.eval(RECLAIM_SCRIPT, keys, args);
    }
    // ... unwrap the list of reclaimed IDs ...
}
```

The Lua script also handles a narrower race: a worker that crashed between `BRPOPLPUSH` and writing `claimed_at_ms`. Those jobs are reclaimed after `2 × visibility_ms` using `enqueued_at_ms` as a fallback timer, so they aren't stranded forever.

## Stats and history

`stats()` reports queue depth plus per-process counters:

```java
public Map<String, Object> stats() {
    long pending, processing, completed, failed;
    try (Jedis jedis = pool.getResource()) {
        Pipeline pipe = jedis.pipelined();
        Response<Long> pendingResp = pipe.llen(pendingKey);
        Response<Long> processingResp = pipe.llen(processingKey);
        Response<Long> completedResp = pipe.llen(completedKey);
        Response<Long> failedResp = pipe.llen(failedKey);
        pipe.sync();
        pending = pendingResp.get();
        processing = processingResp.get();
        completed = completedResp.get();
        failed = failedResp.get();
    }
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

The completed and failed lists are capped via `LTRIM` so they never grow unbounded; a real deployment would also write completion events to a separate audit log if needed.

## Prerequisites

Before running the demo, make sure that:

* Redis 6.2 or later is running locally on the default port (6379). Earlier versions still work, since the helper uses commands that have existed since Redis 2.6.
* Java 17 or later (the demo uses text-block-free string concatenation but still relies on a modern JDK).
* Jedis 5.x is on the classpath. The smallest workable classpath is the Jedis jar plus its two transitive dependencies, `commons-pool2` and `slf4j-api`.

If you use Maven:

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>5.0.1</version>
</dependency>
```

If you use Gradle:

```groovy
implementation 'redis.clients:jedis:5.0.1'
```

## Running the demo

### Get the source files

The demo consists of five Java source files. Download them from the [`java-jedis` source folder](https://github.com/redis/docs/tree/main/content/develop/use-cases/job-queue/java-jedis) on GitHub, or grab them with `curl`:

```bash
mkdir job-queue-demo && cd job-queue-demo
BASE=https://raw.githubusercontent.com/redis/docs/main/content/develop/use-cases/job-queue/java-jedis
curl -O $BASE/RedisJobQueue.java
curl -O $BASE/JobWorker.java
curl -O $BASE/WorkerPool.java
curl -O $BASE/DemoServer.java
curl -O $BASE/JsonUtil.java
```

### Start the demo server

A local demo server is included to show the queue in action ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-jedis/DemoServer.java)). Compile and run with `javac` and `java`, listing each jar on the classpath:

```bash
javac -cp jedis-5.0.1.jar:commons-pool2-2.12.1.jar:slf4j-api-2.0.12.jar \
      JsonUtil.java RedisJobQueue.java JobWorker.java WorkerPool.java DemoServer.java

java  -cp .:jedis-5.0.1.jar:commons-pool2-2.12.1.jar:slf4j-api-2.0.12.jar \
      DemoServer --port 8793 --visibility-ms 5000
```

You should see:

```text
Redis job-queue demo server listening on http://127.0.0.1:8793
Using Redis at localhost:6379
Visibility timeout: 5000 ms
```

Open [http://127.0.0.1:8793](http://127.0.0.1:8793) in a browser. You can:

* Enqueue jobs of different kinds (email, webhook, thumbnail, invoice) in batches.
* Start a pool of workers with configurable size, work latency, and *failure* / *hang* rates. A non-zero hang rate simulates worker crashes.
* Click **Run reclaim sweep** to move any timed-out processing jobs back to pending.
* Watch pending / processing / completed / failed lists update every 800 ms.

If your Redis server is running elsewhere, start the demo with `--redis-host` and `--redis-port`. You can also tune the visibility timeout with `--visibility-ms`.

## The mock worker pool

The demo includes a small `JobWorker` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-jedis/JobWorker.java)) and `WorkerPool` ([source](https://github.com/redis/docs/blob/main/content/develop/use-cases/job-queue/java-jedis/WorkerPool.java)) that stand in for whatever real background work your application would run. Each worker:

* Blocks on `queue.claim()` for new jobs.
* Sleeps `workLatencyMs` to simulate doing the work.
* Either completes successfully, fails (calling `queue.fail()`), or *hangs* — returning without completing or failing the job so the reclaimer has to recover it.

Workers run on daemon threads spawned by the pool; an `AtomicBoolean` stop flag lets the HTTP handlers shut workers down between requests. The `failRate` and `hangRate` knobs let you watch the at-least-once delivery and reclaim behaviours from the UI without writing test code.

## Production usage

### Choose a visibility timeout that matches your worst-case job latency

The visibility timeout has to exceed the longest real job time, with margin. If it's too short, a healthy worker that's running a slow job will get its work duplicated when the reclaimer fires. If it's too long, a real crash takes longer to detect. Most production deployments use a per-queue value tuned to the 99th-percentile job latency — for example, 2 minutes for email and 30 minutes for video transcoding.

### Run the reclaimer on a schedule

The demo only reclaims when you click the button. In production, run `reclaimStuck()` from a `ScheduledExecutorService` (every few seconds for fast queues, every minute for slow ones), or from each worker before it blocks on `claim()`. Both patterns work as long as *someone* runs the sweep.

### Size `JedisPool` for your worker count

`JedisPool` is thread-safe and connections are released back to the pool when the try-with-resources block exits. The demo bumps `maxTotal` to 32 to support the blocking `BRPOPLPUSH` call held by each worker plus the per-request connections used by the HTTP handlers. As a rule of thumb, `maxTotal` should be at least *workers + concurrent HTTP request threads + reclaimer threads + headroom*.

### Use a separate Redis database or key prefix per queue

The helper takes a `queueName` argument so you can run multiple independent queues against one Redis instance — for example, one queue per priority level, or one per job kind. Keep queue keys under a clearly-namespaced prefix (here, `queue:jobs-jedis:*`) so they're easy to inspect and easy to clear without touching application data.

### Cap the completed and failed history

The demo keeps the last 50 completed and 50 failed job IDs via `LTRIM`. If you need longer history for audit purposes, write completion events to a separate Redis Stream (or to an external store) and keep the in-queue history short. Stream consumer groups give you the same fan-out semantics with a much richer history.

### Tune `maxAttempts` per job kind

A blanket `maxAttempts = 3` is a reasonable default for transient failures (network timeouts, rate limits). Jobs that talk to non-idempotent external systems — for example, posting a Stripe charge — need either application-level idempotency keys or a much lower retry count. The helper exposes `maxAttempts` so each queue can pick its own policy.

### Inspect queue state directly in Redis

Because the queue is just lists and hashes, you can inspect it with `redis-cli`:

```bash
# How many pending jobs?
redis-cli LLEN queue:jobs-jedis:pending

# Look at the next 5 jobs to be picked up.
redis-cli LRANGE queue:jobs-jedis:pending -5 -1

# Read a job's metadata.
redis-cli HGETALL queue:jobs-jedis:job:9a4f0d1c

# How many jobs are currently being processed?
redis-cli LLEN queue:jobs-jedis:processing

# Clear everything for this queue (be careful — this deletes work).
redis-cli --scan --pattern 'queue:jobs-jedis:*' | xargs redis-cli DEL
```

## Learn more

This example uses the following Redis commands:

* [`LPUSH`]({{< relref "/commands/lpush" >}}) to enqueue a job ID.
* [`BRPOPLPUSH`]({{< relref "/commands/brpoplpush" >}}) to atomically claim a job into the processing list.
* [`LREM`]({{< relref "/commands/lrem" >}}) to remove a job from the processing list on complete or fail.
* [`LRANGE`]({{< relref "/commands/lrange" >}}) and [`LLEN`]({{< relref "/commands/llen" >}}) to read queue depth and list contents.
* [`LTRIM`]({{< relref "/commands/ltrim" >}}) to cap the completed and failed history.
* [`HSET`]({{< relref "/commands/hset" >}}) and [`HGETALL`]({{< relref "/commands/hgetall" >}}) for job metadata.
* [`HINCRBY`]({{< relref "/commands/hincrby" >}}) for the attempt counter.
* [`EXPIRE`]({{< relref "/commands/expire" >}}) for automatic cleanup of completed and failed jobs.
* [`PUBLISH`]({{< relref "/commands/publish" >}}) for job-completion notifications.
* [`EVAL`]({{< relref "/commands/eval" >}}) for atomic complete, fail, and reclaim flows.

See the [Jedis documentation]({{< relref "/develop/clients/jedis" >}}) for full client reference.
